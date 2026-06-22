"""Seed a sandbox dealership with fake inventory — separate from Nielsen imports.

Run from apps/api:
    .venv/bin/python scripts/seed_demo_dealership.py

Use the printed UUID in Settings or switch rooftops from the dashboard sidebar (dev mode).
"""

from __future__ import annotations

import uuid
from decimal import Decimal

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.assignment import VehicleESLAssignment
from app.models.dealership import Dealership
from app.models.esl_device import ESLDevice
from app.models.sync_event import SyncEvent
from app.models.vehicle import Vehicle

DEMO_SLUG = "premier-auto-demo"
DEMO_NAME = "Premier Auto Demo"
DEMO_ID = uuid.UUID("de000000-0000-4000-8000-000000000001")

DEMO_VEHICLES: list[dict] = [
    {"vin": "DEMO000000000001", "stock": "PA1001", "year": 2024, "make": "Toyota", "model": "Camry SE", "price": 28995, "sync": "SYNCED"},
    {"vin": "DEMO000000000002", "stock": "PA1002", "year": 2023, "make": "Honda", "model": "CR-V EX", "price": 32450, "sync": "SYNCED"},
    {"vin": "DEMO000000000003", "stock": "PA1003", "year": 2025, "make": "Ford", "model": "F-150 XLT", "price": 45200, "sync": "PENDING"},
    {"vin": "DEMO000000000004", "stock": "PA1004", "year": 2024, "make": "Chevrolet", "model": "Equinox LT", "price": 27800, "sync": "SYNCED"},
    {"vin": "DEMO000000000005", "stock": "PA1005", "year": 2022, "make": "Hyundai", "model": "Tucson SEL", "price": 24500, "sync": "FAILED"},
    {"vin": "DEMO000000000006", "stock": "PA1006", "year": 2024, "make": "Nissan", "model": "Rogue SV", "price": 30100, "sync": "SYNCED"},
    {"vin": "DEMO000000000007", "stock": "PA1007", "year": 2023, "make": "Subaru", "model": "Outback Premium", "price": 33500, "sync": None},
    {"vin": "DEMO000000000008", "stock": "PA1008", "year": 2024, "make": "Mazda", "model": "CX-5 Touring", "price": 31200, "sync": None},
    {"vin": "DEMO000000000009", "stock": "PA1009", "year": 2025, "make": "Kia", "model": "Telluride SX", "price": 48900, "sync": None},
    {"vin": "DEMO000000000010", "stock": "PA1010", "year": 2024, "make": "Jeep", "model": "Grand Cherokee L", "price": 41800, "sync": None},
    {"vin": "DEMO000000000011", "stock": "PA1011", "year": 2023, "make": "BMW", "model": "X3 xDrive30i", "price": 44200, "sync": None},
    {"vin": "DEMO000000000012", "stock": "PA1012", "year": 2024, "make": "Volkswagen", "model": "Atlas Cross Sport", "price": 38900, "sync": None},
]

ESL_CODES = [f"DEMO-ESL-{i:03d}" for i in range(1, 9)]
PAIR_COUNT = 6


def main() -> None:
    db = SessionLocal()
    try:
        existing = db.scalar(select(Dealership).where(Dealership.slug == DEMO_SLUG))
        if existing:
            print(f"Demo dealership already exists: {existing.id}")
            print(f"Name: {existing.name}")
            print("Switch to it from the dashboard sidebar, or set in apps/web/.env.local:")
            print(f"  NEXT_PUBLIC_DEALERSHIP_ID={existing.id}")
            return

        dealership = Dealership(
            id=DEMO_ID,
            name=DEMO_NAME,
            slug=DEMO_SLUG,
            status="active",
        )
        db.add(dealership)
        db.flush()

        vehicles: list[Vehicle] = []
        for row in DEMO_VEHICLES:
            vehicle = Vehicle(
                id=uuid.uuid4(),
                dealership_id=dealership.id,
                vin=row["vin"],
                stock_number=row["stock"],
                year=row["year"],
                make=row["make"],
                model=row["model"],
                status="available",
                source_price=Decimal(str(row["price"])),
                displayed_price=Decimal(str(row["price"])),
                price_type="retail",
                source_type="demo_seed",
                sync_status=row["sync"],
            )
            db.add(vehicle)
            vehicles.append(vehicle)

        devices: list[ESLDevice] = []
        for code in ESL_CODES:
            device = ESLDevice(
                id=uuid.uuid4(),
                dealership_id=dealership.id,
                device_id=code,
                provider="stub",
                model="ESL-4.2-BWR",
                screen_width=400,
                screen_height=300,
                battery_level=85,
                signal_status="good",
                status="online",
            )
            db.add(device)
            devices.append(device)

        db.flush()

        for index in range(PAIR_COUNT):
            assignment = VehicleESLAssignment(
                id=uuid.uuid4(),
                dealership_id=dealership.id,
                vehicle_id=vehicles[index].id,
                esl_device_id=devices[index].id,
                status="active",
                assignment_source="demo_seed",
            )
            db.add(assignment)

        synced_vehicle = vehicles[0]
        pending_vehicle = vehicles[2]
        failed_vehicle = vehicles[4]

        db.add(
            SyncEvent(
                id=uuid.uuid4(),
                dealership_id=dealership.id,
                vehicle_id=synced_vehicle.id,
                esl_device_id=devices[0].id,
                event_type="vehicle.update",
                old_value={"displayed_price": 27995},
                new_value={"displayed_price": 28995},
                status="SYNCED",
                attempt_count=1,
            )
        )
        db.add(
            SyncEvent(
                id=uuid.uuid4(),
                dealership_id=dealership.id,
                vehicle_id=pending_vehicle.id,
                esl_device_id=devices[2].id,
                event_type="vehicle.update",
                new_value={"displayed_price": 45200},
                status="PENDING",
                attempt_count=0,
            )
        )
        db.add(
            SyncEvent(
                id=uuid.uuid4(),
                dealership_id=dealership.id,
                vehicle_id=failed_vehicle.id,
                esl_device_id=devices[4].id,
                event_type="vehicle.update",
                new_value={"displayed_price": 24500},
                status="FAILED",
                error_message="Stub transport simulated failure",
                attempt_count=3,
            )
        )

        db.commit()
        print(f"Created demo dealership: {dealership.id}")
        print(f"  {len(DEMO_VEHICLES)} vehicles, {len(ESL_CODES)} ESL devices, {PAIR_COUNT} pairings")
        print()
        print("Switch from the dashboard sidebar (dev lists all rooftops), or set default:")
        print(f"  NEXT_PUBLIC_DEALERSHIP_ID={dealership.id}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
