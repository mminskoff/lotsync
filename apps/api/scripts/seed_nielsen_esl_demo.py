"""Seed demo ESL devices and pairings on a Nielsen rooftop (for dashboard demos).

Run from apps/api:
    PYTHONPATH=. .venv/bin/python scripts/seed_nielsen_esl_demo.py --list
    PYTHONPATH=. .venv/bin/python scripts/seed_nielsen_esl_demo.py --slug dover-dodge-chrysler-jeep-ram
    PYTHONPATH=. .venv/bin/python scripts/seed_nielsen_esl_demo.py --slug dover-dodge-chrysler-jeep-ram --reset
"""

from __future__ import annotations

import argparse
import uuid

from sqlalchemy import delete, func, select

from app.core.database import SessionLocal
from app.models.assignment import VehicleESLAssignment
from app.models.dealership import Dealership
from app.models.esl_device import ESLDevice
from app.models.organization import Organization
from app.models.sync_event import SyncEvent
from app.models.vehicle import Vehicle
from app.services.sync_constants import SYNC_FAILED, SYNC_PENDING, SYNC_SYNCED
from app.services.sync_enqueue_service import enqueue_label_sync

NIELSEN_ORG_ID = uuid.UUID("00000000-0000-4000-8000-000000000001")
ESL_MODEL = "ESL-4.2-BWR"
SCREEN_WIDTH = 400
SCREEN_HEIGHT = 300
DEFAULT_DEVICE_COUNT = 12
DEFAULT_PAIR_COUNT = 8


def list_nielsen_rooftops(db) -> None:
    rows = db.execute(
        select(
            Dealership.slug,
            Dealership.name,
            Dealership.id,
            func.count(Vehicle.id).label("vehicles"),
        )
        .outerjoin(Vehicle, Vehicle.dealership_id == Dealership.id)
        .where(Dealership.organization_id == NIELSEN_ORG_ID)
        .group_by(Dealership.id, Dealership.slug, Dealership.name)
        .order_by(func.count(Vehicle.id).desc())
    ).all()

    if not rows:
        print("No Nielsen rooftops found. Run setup_nielsen_rooftops.py first.")
        return

    print("Nielsen rooftops (slug · vehicles):")
    for slug, name, dealer_id, count in rows:
        print(f"  {slug}")
        print(f"    {name} · {count} vehicles · {dealer_id}")


def resolve_dealership(db, slug: str) -> Dealership:
    dealership = db.scalar(select(Dealership).where(Dealership.slug == slug))
    if dealership is None:
        raise SystemExit(f"Dealership not found for slug: {slug!r}. Run with --list.")
    if dealership.organization_id != NIELSEN_ORG_ID:
        print(f"Warning: {dealership.name} is not under Nielsen Auto Group.")
    return dealership


def clear_esl_demo_data(db, dealership_id: uuid.UUID) -> None:
    db.execute(
        delete(SyncEvent).where(
            SyncEvent.dealership_id == dealership_id,
            SyncEvent.event_type == "demo_seed.pair",
        )
    )
    db.execute(
        delete(VehicleESLAssignment).where(
            VehicleESLAssignment.dealership_id == dealership_id,
            VehicleESLAssignment.assignment_source == "nielsen_demo_seed",
        )
    )
    db.execute(
        delete(ESLDevice).where(
            ESLDevice.dealership_id == dealership_id,
            ESLDevice.provider == "demo_seed",
        )
    )


def existing_demo_devices(db, dealership_id: uuid.UUID) -> list[ESLDevice]:
    return list(
        db.scalars(
            select(ESLDevice).where(
                ESLDevice.dealership_id == dealership_id,
                ESLDevice.provider == "demo_seed",
            )
        ).all()
    )


def seed_esl_demo(
    db,
    dealership: Dealership,
    *,
    device_count: int,
    pair_count: int,
    reset: bool,
) -> None:
    if reset:
        clear_esl_demo_data(db, dealership.id)
        db.commit()

    existing = existing_demo_devices(db, dealership.id)
    if existing:
        print(f"Demo ESL data already exists ({len(existing)} devices). Use --reset to replace.")
        return

    vehicles = list(
        db.scalars(
            select(Vehicle)
            .where(Vehicle.dealership_id == dealership.id)
            .order_by(Vehicle.updated_at.desc())
            .limit(pair_count)
        ).all()
    )
    if not vehicles:
        raise SystemExit(f"No vehicles on {dealership.name}. Import inventory first.")

    devices: list[ESLDevice] = []
    prefix = dealership.slug[:8].upper().replace("-", "")
    for index in range(1, device_count + 1):
        device = ESLDevice(
            id=uuid.uuid4(),
            dealership_id=dealership.id,
            device_id=f"{prefix}-ESL-{index:03d}",
            provider="demo_seed",
            model=ESL_MODEL,
            screen_width=SCREEN_WIDTH,
            screen_height=SCREEN_HEIGHT,
            battery_level=90 - (index % 5) * 3,
            signal_status="good" if index % 4 else "fair",
            status="online",
        )
        db.add(device)
        devices.append(device)

    db.flush()

    pair_limit = min(pair_count, len(vehicles), len(devices))
    for index in range(pair_limit):
        vehicle = vehicles[index]
        device = devices[index]
        db.add(
            VehicleESLAssignment(
                id=uuid.uuid4(),
                dealership_id=dealership.id,
                vehicle_id=vehicle.id,
                esl_device_id=device.id,
                status="active",
                assignment_source="nielsen_demo_seed",
            )
        )
        enqueue_label_sync(
            db,
            dealership_id=dealership.id,
            vehicle=vehicle,
            esl_device_id=device.id,
            event_type="demo_seed.pair",
            new_value={"vin": vehicle.vin, "device_id": device.device_id},
        )

    # Mix of sync outcomes for dashboard demos (after pair events)
    if pair_limit >= 3:
        vehicles[0].sync_status = "SYNCED"
        vehicles[1].sync_status = "PENDING"
        vehicles[2].sync_status = "FAILED"

        pending_event = db.scalar(
            select(SyncEvent)
            .where(
                SyncEvent.dealership_id == dealership.id,
                SyncEvent.vehicle_id == vehicles[1].id,
            )
            .order_by(SyncEvent.created_at.desc())
        )
        if pending_event:
            pending_event.status = SYNC_PENDING

        failed_event = db.scalar(
            select(SyncEvent)
            .where(
                SyncEvent.dealership_id == dealership.id,
                SyncEvent.vehicle_id == vehicles[2].id,
            )
            .order_by(SyncEvent.created_at.desc())
        )
        if failed_event:
            failed_event.status = SYNC_FAILED
            failed_event.error_message = "Stub transport simulated failure"
            failed_event.attempt_count = 3

        synced_event = db.scalar(
            select(SyncEvent)
            .where(
                SyncEvent.dealership_id == dealership.id,
                SyncEvent.vehicle_id == vehicles[0].id,
            )
            .order_by(SyncEvent.created_at.desc())
        )
        if synced_event:
            synced_event.status = SYNC_SYNCED
            synced_event.attempt_count = 1

    db.commit()
    print(f"Seeded {dealership.name} ({dealership.slug})")
    print(f"  {device_count} ESL devices, {pair_limit} pairings, {pair_limit} sync events")
    print(f"  Dealership id: {dealership.id}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed demo ESL devices on a Nielsen rooftop")
    parser.add_argument("--list", action="store_true", help="List Nielsen rooftops and vehicle counts")
    parser.add_argument("--slug", help="Dealership slug (see --list)")
    parser.add_argument("--devices", type=int, default=DEFAULT_DEVICE_COUNT, help="ESL devices to create")
    parser.add_argument("--pairings", type=int, default=DEFAULT_PAIR_COUNT, help="Vehicles to pair")
    parser.add_argument("--reset", action="store_true", help="Remove prior demo_seed ESL data first")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        if args.list:
            list_nielsen_rooftops(db)
            return

        if not args.slug:
            parser.error("Pass --slug (use --list to see options)")

        dealership = resolve_dealership(db, args.slug)
        seed_esl_demo(
            db,
            dealership,
            device_count=args.devices,
            pair_count=args.pairings,
            reset=args.reset,
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()
