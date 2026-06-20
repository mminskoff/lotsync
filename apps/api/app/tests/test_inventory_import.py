"""Tests for Milestone 7 inventory import framework."""

import uuid
from decimal import Decimal
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from openpyxl import Workbook
from sqlalchemy import delete, select

from app.adapters.inventory.nielsen_ddc import NielsenDDCAdapter
from app.core.database import SessionLocal
from app.main import app
from app.models.audit_log import AuditLog
from app.models.dealership import Dealership
from app.models.inventory_source import InventorySource
from app.models.inventory_sync_run import InventorySyncRun
from app.models.vehicle import Vehicle
from app.services.vehicle_upsert_service import upsert_vehicles_from_import
from app.schemas.normalized_vehicle import NormalizedVehicle

client = TestClient(app)
FIXTURES_DIR = Path(__file__).parent / "fixtures"
TEST_SLUG = f"inventory-test-{uuid.uuid4().hex[:8]}"


def _headers(dealership_id: uuid.UUID) -> dict[str, str]:
    return {"X-Dealership-Id": str(dealership_id)}


def _write_nielsen_fixture(path: Path) -> None:
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Test Dealer"
    sheet.append(
        [
            "External dealer ID",
            "New/used",
            "Certified",
            "Stocknumber",
            "Vin",
            "Year",
            "Make",
            "Model",
            "Modelnumber",
            "Trim",
            "Transmission",
            "Engine",
            "Published Price",
            "List price",
            "Exterior color",
            "Interior color",
            "Odometer",
            "Cylinder",
            "Days in stock",
            "Comments",
            "Options",
            "Photo Updated Date",
            "Photo URL",
            "MSRP",
            "Internet Price",
            "Style",
            "Body Style",
            "Drive Type",
            "Fuel Type",
            "Status",
            "Sale Price",
            "Invoice",
            "Doc Fee",
        ]
    )
    sheet.append(
        [
            1,
            "N",
            "N",
            "STK001",
            "1HGBH41JXMN109186",
            2023,
            "Honda",
            "Accord",
            "ACC",
            "Sport",
            "Automatic",
            "2.0L",
            28950,
            29950,
            "Blue",
            "Black",
            1200,
            4,
            10,
            "",
            "",
            None,
            "https://example.com/accord.jpg",
            29950,
            28950,
            "Sedan",
            "Sedan",
            "FWD",
            "Gas",
            "IN-STOCK",
            28950,
            "",
            "",
        ]
    )
    sheet.append(
        [
            1,
            "U",
            "N",
            "STK002",
            "TESTVIN002",
            2022,
            "Toyota",
            "RAV4",
            "RAV",
            "XLE",
            "Automatic",
            "2.5L",
            32400,
            33400,
            "Silver",
            "Gray",
            8500,
            4,
            20,
            "",
            "",
            None,
            "",
            33400,
            32400,
            "SUV",
            "SUV",
            "AWD",
            "Gas",
            "IN-STOCK",
            32400,
            "",
            "",
        ]
    )
    workbook.save(path)
    workbook.close()


@pytest.fixture(scope="module")
def test_dealership_id():
    db = SessionLocal()
    dealership = Dealership(
        id=uuid.uuid4(),
        name="Inventory Test Dealership",
        slug=TEST_SLUG,
        status="active",
        organization_id=uuid.uuid4(),
    )
    db.add(dealership)
    db.commit()
    dealership_id = dealership.id
    db.close()
    yield dealership_id

    db = SessionLocal()
    db.execute(delete(AuditLog).where(AuditLog.dealership_id == dealership_id))
    db.execute(delete(InventorySyncRun).where(InventorySyncRun.dealership_id == dealership_id))
    db.execute(delete(InventorySource).where(InventorySource.dealership_id == dealership_id))
    db.execute(delete(Vehicle).where(Vehicle.dealership_id == dealership_id))
    db.execute(delete(Dealership).where(Dealership.id == dealership_id))
    db.commit()
    db.close()


@pytest.fixture(scope="module")
def nielsen_fixture_path(tmp_path_factory) -> Path:
    path = FIXTURES_DIR / "nielsen_sample.xlsx"
    FIXTURES_DIR.mkdir(parents=True, exist_ok=True)
    _write_nielsen_fixture(path)
    return path


def test_nielsen_adapter_reads_fixture(test_dealership_id, nielsen_fixture_path):
    adapter = NielsenDDCAdapter()
    adapter.test_connection({"file_path": str(nielsen_fixture_path), "sheet_name": "Test Dealer"})
    vehicles = adapter.fetch_inventory(
        test_dealership_id,
        {"file_path": str(nielsen_fixture_path), "sheet_name": "Test Dealer"},
    )
    assert len(vehicles) == 2
    assert vehicles[0].vin == "1HGBH41JXMN109186"
    assert vehicles[0].price == Decimal("28950.00")
    assert vehicles[0].status == "available"
    assert vehicles[0].photos == ["https://example.com/accord.jpg"]


def test_vehicle_upsert_creates_and_updates(test_dealership_id):
    db = SessionLocal()
    record = NormalizedVehicle(
        vin="UPSERTVIN001",
        stock_number="S1",
        year=2024,
        make="Ford",
        model="F-150",
        price=Decimal("45000.00"),
        dealership_id=test_dealership_id,
        source_type="nielsen",
    )
    first = upsert_vehicles_from_import(db, test_dealership_id, [record], "nielsen")
    db.commit()
    assert first.created == 1
    assert first.updated == 0

    updated_record = record.model_copy(update={"price": Decimal("44000.00"), "stock_number": "S1B"})
    second = upsert_vehicles_from_import(db, test_dealership_id, [updated_record], "nielsen")
    db.commit()

    vehicle = db.scalar(
        select(Vehicle).where(
            Vehicle.dealership_id == test_dealership_id,
            Vehicle.vin == "UPSERTVIN001",
        )
    )
    assert second.updated == 1
    assert vehicle is not None
    assert vehicle.displayed_price == Decimal("44000.00")
    assert vehicle.stock_number == "S1B"
    db.close()


def test_sync_now_endpoint(test_dealership_id, nielsen_fixture_path):
    create_response = client.post(
        "/api/v1/inventory-sources",
        headers=_headers(test_dealership_id),
        json={
            "source_type": "nielsen",
            "name": "Nielsen Test",
            "config_json": {
                "file_path": str(nielsen_fixture_path),
                "sheet_name": "Test Dealer",
            },
        },
    )
    assert create_response.status_code == 201
    source_id = create_response.json()["id"]

    sync_response = client.post(
        f"/api/v1/inventory-sources/{source_id}/sync-now",
        headers=_headers(test_dealership_id),
    )
    assert sync_response.status_code == 200
    payload = sync_response.json()
    assert payload["success"] is True
    assert payload["vehicles_imported"] == 2
    assert payload["vehicles_created"] == 2

    rerun = client.post(
        f"/api/v1/inventory-sources/{source_id}/sync-now",
        headers=_headers(test_dealership_id),
    )
    assert rerun.status_code == 200
    assert rerun.json()["vehicles_updated"] == 2
    assert rerun.json()["vehicles_created"] == 0

    runs_response = client.get(
        f"/api/v1/inventory-sources/{source_id}/sync-runs",
        headers=_headers(test_dealership_id),
    )
    assert runs_response.status_code == 200
    assert len(runs_response.json()) >= 2


@pytest.mark.skipif(
    not Path("/Users/mikey/Downloads/Nielsen DDC Files.xlsx").is_file(),
    reason="Full Nielsen workbook not available locally",
)
def test_nielsen_full_workbook_import(test_dealership_id):
    workbook_path = "/Users/mikey/Downloads/Nielsen DDC Files.xlsx"
    adapter = NielsenDDCAdapter()
    vehicles = adapter.fetch_inventory(
        test_dealership_id,
        {"file_path": workbook_path, "sheet_name": "Nielsen Ford of Morristown"},
    )
    assert len(vehicles) == 360

    db = SessionLocal()
    result = upsert_vehicles_from_import(db, test_dealership_id, vehicles, "nielsen")
    db.commit()
    assert result.processed == 360
    db.close()


def test_missing_fields_handled_safely(test_dealership_id):
    sparse = NormalizedVehicle(vin="SPARSEVIN1", dealership_id=test_dealership_id)
    db = SessionLocal()
    result = upsert_vehicles_from_import(db, test_dealership_id, [sparse], "nielsen")
    db.commit()
    vehicle = db.scalar(
        select(Vehicle).where(
            Vehicle.dealership_id == test_dealership_id,
            Vehicle.vin == "SPARSEVIN1",
        )
    )
    assert result.created == 1
    assert vehicle is not None
    assert vehicle.make is None
    db.close()
