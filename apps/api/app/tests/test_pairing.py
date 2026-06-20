"""Integration tests for Milestone 4 pairing workflow."""

import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete

from app.core.database import SessionLocal
from app.main import app
from app.models.assignment import VehicleESLAssignment
from app.models.audit_log import AuditLog
from app.models.dealership import Dealership
from app.models.esl_device import ESLDevice
from app.models.sync_event import SyncEvent
from app.models.vehicle import Vehicle

client = TestClient(app)

TEST_SLUG = f"pairing-test-{uuid.uuid4().hex[:8]}"


@pytest.fixture(scope="module")
def test_dealership_id():
    db = SessionLocal()
    dealership = Dealership(
        id=uuid.uuid4(),
        name="Pairing Test Dealership",
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
    db.execute(delete(SyncEvent).where(SyncEvent.dealership_id == dealership_id))
    db.execute(delete(VehicleESLAssignment).where(VehicleESLAssignment.dealership_id == dealership_id))
    db.execute(delete(Vehicle).where(Vehicle.dealership_id == dealership_id))
    db.execute(delete(ESLDevice).where(ESLDevice.dealership_id == dealership_id))
    db.execute(delete(Dealership).where(Dealership.id == dealership_id))
    db.commit()
    db.close()


def _headers(dealership_id: uuid.UUID) -> dict[str, str]:
    return {"X-Dealership-Id": str(dealership_id)}


def _create_vehicle(dealership_id: uuid.UUID, vin: str) -> dict:
    response = client.post(
        "/api/v1/vehicles",
        headers=_headers(dealership_id),
        json={"vin": vin, "make": "Ford", "model": "F-150"},
    )
    assert response.status_code == 201
    return response.json()


def _register_device(dealership_id: uuid.UUID, device_code: str) -> dict:
    response = client.post(
        "/api/v1/esl-devices/register",
        headers=_headers(dealership_id),
        json={"device_id": device_code},
    )
    assert response.status_code == 201
    return response.json()


def test_pair_happy_path(test_dealership_id):
    vin = f"1FTFW1ET5BFA{uuid.uuid4().hex[:5].upper()}"
    device_code = f"ESL-{uuid.uuid4().hex[:4].upper()}"
    _create_vehicle(test_dealership_id, vin)
    _register_device(test_dealership_id, device_code)

    response = client.post(
        "/api/v1/pairings",
        headers=_headers(test_dealership_id),
        json={
            "vin": vin,
            "device_code": device_code,
            "scan_type": "barcode",
            "assignment_source": "mobile_app",
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "paired"
    assert body["vehicle"]["vin"] == vin
    assert body["device"]["device_id"] == device_code
    assert body["assignment_source"] == "mobile_app"
    assert body["scan_type"] == "barcode"
    assert body["sync_event"]["status"] == "PENDING"
    assert body["organization_id"] is not None
    assert body["dealership_id"] == str(test_dealership_id)


def test_pair_conflict_without_force(test_dealership_id):
    vin_a = f"1FTFW1ET5BFB{uuid.uuid4().hex[:5].upper()}"
    vin_b = f"1FTFW1ET5BFC{uuid.uuid4().hex[:5].upper()}"
    device_code = f"ESL-{uuid.uuid4().hex[:4].upper()}"
    _create_vehicle(test_dealership_id, vin_a)
    _create_vehicle(test_dealership_id, vin_b)
    _register_device(test_dealership_id, device_code)

    client.post(
        "/api/v1/pairings",
        headers=_headers(test_dealership_id),
        json={"vin": vin_a, "device_code": device_code},
    )

    conflict = client.post(
        "/api/v1/pairings",
        headers=_headers(test_dealership_id),
        json={"vin": vin_b, "device_code": device_code},
    )
    assert conflict.status_code == 409


def test_reassign_with_force(test_dealership_id):
    vin_a = f"1FTFW1ET5BFD{uuid.uuid4().hex[:5].upper()}"
    vin_b = f"1FTFW1ET5BFE{uuid.uuid4().hex[:5].upper()}"
    device_code = f"ESL-{uuid.uuid4().hex[:4].upper()}"
    _create_vehicle(test_dealership_id, vin_a)
    _create_vehicle(test_dealership_id, vin_b)
    _register_device(test_dealership_id, device_code)

    client.post(
        "/api/v1/pairings",
        headers=_headers(test_dealership_id),
        json={"vin": vin_a, "device_code": device_code},
    )

    response = client.post(
        "/api/v1/pairings/reassign",
        headers=_headers(test_dealership_id),
        json={
            "device_code": device_code,
            "new_vin": vin_b,
            "force_reassign": True,
            "scan_type": "nfc",
            "nfc_uid": "NFC-PLACEHOLDER-001",
            "assignment_source": "mobile_app",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "reassigned"
    assert body["vehicle"]["vin"] == vin_b
    assert body["nfc_uid"] == "NFC-PLACEHOLDER-001"


def test_unpair(test_dealership_id):
    vin = f"1FTFW1ET5BFF{uuid.uuid4().hex[:5].upper()}"
    device_code = f"ESL-{uuid.uuid4().hex[:4].upper()}"
    _create_vehicle(test_dealership_id, vin)
    _register_device(test_dealership_id, device_code)

    pair = client.post(
        "/api/v1/pairings",
        headers=_headers(test_dealership_id),
        json={"vin": vin, "device_code": device_code},
    )
    assignment_id = pair.json()["assignment_id"]

    response = client.delete(
        f"/api/v1/pairings/{assignment_id}",
        headers=_headers(test_dealership_id),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "unpaired"
    assert body["vehicle"]["sync_status"] == "TAG_UNASSIGNED"


def test_mobile_lookups(test_dealership_id):
    vin = f"1FTFW1ET5BFG{uuid.uuid4().hex[:5].upper()}"
    device_code = f"ESL-{uuid.uuid4().hex[:4].upper()}"
    _create_vehicle(test_dealership_id, vin)
    _register_device(test_dealership_id, device_code)

    vehicle_lookup = client.get(
        f"/api/v1/mobile/vehicles/by-vin/{vin}",
        headers=_headers(test_dealership_id),
    )
    assert vehicle_lookup.status_code == 200
    assert vehicle_lookup.json()["vehicle"]["vin"] == vin

    device_lookup = client.get(
        f"/api/v1/mobile/esl-devices/by-code/{device_code}",
        headers=_headers(test_dealership_id),
    )
    assert device_lookup.status_code == 200
    assert device_lookup.json()["device"]["device_id"] == device_code


def test_deprecated_assignment_post(test_dealership_id):
    response = client.post(
        "/api/v1/assignments",
        headers=_headers(test_dealership_id),
        json={
            "vehicle_id": str(uuid.uuid4()),
            "esl_device_id": str(uuid.uuid4()),
        },
    )
    assert response.status_code == 410
