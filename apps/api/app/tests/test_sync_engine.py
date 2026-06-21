"""Tests for M8 Phase 3–4 — change detection and sync worker."""

import uuid
from decimal import Decimal

import pytest
from fastapi import HTTPException
from sqlalchemy import delete, select

from app.core.database import SessionLocal
from app.models.assignment import VehicleESLAssignment
from app.models.audit_log import AuditLog
from app.models.dealership import Dealership
from app.models.esl_device import ESLDevice
from app.models.sync_event import SyncEvent
from app.models.vehicle import Vehicle
from app.schemas.normalized_vehicle import NormalizedVehicle
from app.services.change_detection_service import diff_snapshots, snapshot_vehicle
from app.services.sync_constants import SYNC_FAILED, SYNC_PENDING, SYNC_SYNCED, VEHICLE_SYNC_SYNCED
from app.services.sync_engine_service import process_pending_sync_events, process_sync_event
from app.services.sync_enqueue_service import enqueue_label_sync
from app.services.sync_event_service import retry_sync_event
from app.services.vehicle_upsert_service import upsert_vehicles_from_import
from app.services.vehicle_service import update_vehicle
from app.schemas.vehicle import VehicleUpdate

TEST_SLUG = f"sync-engine-{uuid.uuid4().hex[:8]}"


@pytest.fixture
def test_dealership_id():
    db = SessionLocal()
    dealership = Dealership(
        id=uuid.uuid4(),
        name="Sync Engine Test",
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


def _seed_paired_vehicle(db, dealership_id: uuid.UUID) -> tuple[Vehicle, ESLDevice, VehicleESLAssignment]:
    vehicle = Vehicle(
        id=uuid.uuid4(),
        dealership_id=dealership_id,
        vin=f"SYNC{uuid.uuid4().hex[:8].upper()}",
        make="Toyota",
        model="RAV4",
        displayed_price=Decimal("32000.00"),
        price_verified=False,
    )
    device = ESLDevice(
        id=uuid.uuid4(),
        dealership_id=dealership_id,
        device_id=f"ESL-{uuid.uuid4().hex[:4].upper()}",
        provider="stub",
        model="ESL-4.2-BW",
        screen_width=400,
        screen_height=300,
    )
    assignment = VehicleESLAssignment(
        id=uuid.uuid4(),
        dealership_id=dealership_id,
        vehicle_id=vehicle.id,
        esl_device_id=device.id,
        status="active",
        assignment_source="test",
    )
    db.add(vehicle)
    db.add(device)
    db.flush()
    db.add(assignment)
    db.commit()
    return vehicle, device, assignment


def test_diff_detects_price_change():
    before = {"displayed_price": "32000.00", "status": "available"}
    after = {"displayed_price": "31000.00", "status": "available"}
    changes = diff_snapshots(
        {
            "source_price": None,
            "displayed_price": before["displayed_price"],
            "website_verified_price": None,
            "status": before["status"],
            "mileage": None,
            "stock_number": None,
            "year": None,
            "make": None,
            "model": None,
            "trim": None,
            "vehicle_url": None,
            "price_type": None,
        },
        {
            "source_price": None,
            "displayed_price": after["displayed_price"],
            "website_verified_price": None,
            "status": after["status"],
            "mileage": None,
            "stock_number": None,
            "year": None,
            "make": None,
            "model": None,
            "trim": None,
            "vehicle_url": None,
            "price_type": None,
        },
    )
    assert changes is not None
    assert "displayed_price" in changes


def test_import_skips_unpaired_vehicles(test_dealership_id):
    db = SessionLocal()
    record = NormalizedVehicle(
        vin=f"UNPAIRED{uuid.uuid4().hex[:6].upper()}",
        make="Honda",
        model="Civic",
        price=Decimal("22000"),
        dealership_id=test_dealership_id,
    )
    result = upsert_vehicles_from_import(db, test_dealership_id, [record], "nielsen")
    db.commit()
    assert result.sync_events_enqueued == 0
    db.close()


def test_import_enqueues_for_paired_vehicle_on_price_change(test_dealership_id):
    db = SessionLocal()
    vehicle, _, _ = _seed_paired_vehicle(db, test_dealership_id)

    result = upsert_vehicles_from_import(
        db,
        test_dealership_id,
        [
            NormalizedVehicle(
                vin=vehicle.vin,
                make="Toyota",
                model="RAV4",
                price=Decimal("29999.00"),
                dealership_id=test_dealership_id,
            )
        ],
        "nielsen",
    )
    db.commit()
    assert result.sync_events_enqueued == 1

    event = db.scalar(
        select(SyncEvent).where(
            SyncEvent.dealership_id == test_dealership_id,
            SyncEvent.vehicle_id == vehicle.id,
            SyncEvent.event_type == "inventory.change",
        )
    )
    assert event is not None
    assert event.status == SYNC_PENDING
    db.close()


def test_vehicle_update_enqueues_for_paired_vehicle(test_dealership_id):
    db = SessionLocal()
    vehicle, _, _ = _seed_paired_vehicle(db, test_dealership_id)

    update_vehicle(
        db,
        test_dealership_id,
        vehicle.id,
        VehicleUpdate(displayed_price=Decimal("31500.00")),
    )

    event = db.scalar(
        select(SyncEvent).where(
            SyncEvent.dealership_id == test_dealership_id,
            SyncEvent.event_type == "vehicle.update",
        )
    )
    assert event is not None
    db.close()


def test_worker_processes_pending_event_to_synced(test_dealership_id):
    db = SessionLocal()
    vehicle, device, _ = _seed_paired_vehicle(db, test_dealership_id)
    event = enqueue_label_sync(
        db,
        dealership_id=test_dealership_id,
        vehicle=vehicle,
        esl_device_id=device.id,
        event_type="pairing.assign",
        new_value={"vin": vehicle.vin, "device_code": device.device_id},
    )
    db.commit()
    event_id = event.id
    vehicle_id = vehicle.id
    db.close()

    db = SessionLocal()
    summary = process_pending_sync_events(db, limit=10)

    event = db.get(SyncEvent, event_id)
    refreshed_vehicle = db.get(Vehicle, vehicle_id)
    assert summary["processed"] >= 1
    assert event is not None
    assert event.status == SYNC_SYNCED
    assert event.processed_at is not None
    assert refreshed_vehicle is not None
    assert refreshed_vehicle.sync_status == VEHICLE_SYNC_SYNCED
    db.close()


def test_bulk_import_does_not_flood_unpaired_inventory(test_dealership_id):
    db = SessionLocal()
    vehicle, _, _ = _seed_paired_vehicle(db, test_dealership_id)

    records = [
        NormalizedVehicle(
            vin=f"BULK{uuid.uuid4().hex[:6].upper()}",
            make="Ford",
            model="F-150",
            price=Decimal("45000"),
            dealership_id=test_dealership_id,
        )
        for _ in range(50)
    ]
    records.append(
        NormalizedVehicle(
            vin=vehicle.vin,
            make="Toyota",
            model="RAV4",
            price=Decimal("30500.00"),
            dealership_id=test_dealership_id,
        )
    )

    result = upsert_vehicles_from_import(
        db,
        test_dealership_id,
        records,
        "nielsen",
        mark_missing_off_lot=False,
    )
    db.commit()
    assert result.processed == 51
    assert result.sync_events_enqueued == 1
    db.close()


def test_sync_event_fails_after_max_attempts(test_dealership_id, monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "stub_transport_fail", True)

    db = SessionLocal()
    vehicle, device, _ = _seed_paired_vehicle(db, test_dealership_id)
    event = enqueue_label_sync(
        db,
        dealership_id=test_dealership_id,
        vehicle=vehicle,
        esl_device_id=device.id,
        event_type="label.push",
        new_value={"vin": vehicle.vin},
    )
    db.commit()
    event_id = event.id
    vehicle_id = vehicle.id
    db.close()

    for _ in range(3):
        db = SessionLocal()
        event = db.get(SyncEvent, event_id)
        assert event is not None
        process_sync_event(db, event)
        db.commit()
        db.close()

    db = SessionLocal()
    event = db.get(SyncEvent, event_id)
    vehicle = db.get(Vehicle, vehicle_id)
    assert event is not None
    assert event.status == SYNC_FAILED
    assert event.attempt_count == 3
    assert vehicle is not None
    assert vehicle.sync_status == "FAILED"
    db.close()


def test_retry_failed_event_requeues_and_worker_syncs(test_dealership_id, monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "stub_transport_fail", True)

    db = SessionLocal()
    vehicle, device, _ = _seed_paired_vehicle(db, test_dealership_id)
    event = enqueue_label_sync(
        db,
        dealership_id=test_dealership_id,
        vehicle=vehicle,
        esl_device_id=device.id,
        event_type="label.push",
        new_value={"vin": vehicle.vin},
    )
    db.commit()
    event_id = event.id
    vehicle_id = vehicle.id
    db.close()

    for _ in range(3):
        db = SessionLocal()
        event = db.get(SyncEvent, event_id)
        assert event is not None
        process_sync_event(db, event)
        db.commit()
        db.close()

    db = SessionLocal()
    retried = retry_sync_event(db, test_dealership_id, event_id)
    assert retried.status == SYNC_PENDING
    assert retried.attempt_count == 0
    assert retried.error_message is None
    db.close()

    monkeypatch.setattr(settings, "stub_transport_fail", False)

    db = SessionLocal()
    event = db.get(SyncEvent, event_id)
    assert event is not None
    process_sync_event(db, event)
    db.commit()
    event = db.get(SyncEvent, event_id)
    vehicle = db.get(Vehicle, vehicle_id)
    assert event is not None
    assert event.status == SYNC_SYNCED
    assert vehicle is not None
    assert vehicle.sync_status == VEHICLE_SYNC_SYNCED
    db.close()


def test_retry_rejects_non_failed_event(test_dealership_id):
    db = SessionLocal()
    vehicle, device, _ = _seed_paired_vehicle(db, test_dealership_id)
    event = enqueue_label_sync(
        db,
        dealership_id=test_dealership_id,
        vehicle=vehicle,
        esl_device_id=device.id,
        event_type="label.push",
        new_value={"vin": vehicle.vin},
    )
    db.commit()
    event_id = event.id
    db.close()

    db = SessionLocal()
    process_pending_sync_events(db, limit=5)

    with pytest.raises(HTTPException) as exc_info:
        retry_sync_event(db, test_dealership_id, event_id)
    assert exc_info.value.status_code == 400
    db.close()
