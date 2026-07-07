"""Seed physical Minew ESL devices from the demo kit.

Run from apps/api:
    PYTHONPATH=. .venv/bin/python scripts/seed_minew_kit.py --list
    PYTHONPATH=. .venv/bin/python scripts/seed_minew_kit.py --slug dover-dodge
    PYTHONPATH=. .venv/bin/python scripts/seed_minew_kit.py --dealership-id ebd0ecef-7276-450d-9f6c-af8372705570
"""

from __future__ import annotations

import argparse
import uuid

from sqlalchemy import delete, select

from app.core.database import SessionLocal
from app.models.dealership import Dealership
from app.models.esl_device import ESLDevice

MINEW_KIT_DEVICES: tuple[dict[str, object], ...] = (
    {
        "device_id": "E100000A1525",
        "model": "4.2-BWRY",
        "screen_width": 400,
        "screen_height": 300,
        "pilot": True,
    },
    {
        "device_id": "E10000083B68",
        "model": "3.5-BWRY",
        "screen_width": 384,
        "screen_height": 184,
    },
    {
        "device_id": "E10000083B76",
        "model": "2.9-BWRY",
        "screen_width": 296,
        "screen_height": 128,
    },
    {
        "device_id": "E100000A15B4",
        "model": "2.13-BWRY",
        "screen_width": 250,
        "screen_height": 122,
    },
    {
        "device_id": "E0000001BE6A",
        "model": "7.3-E6",
        "screen_width": 800,
        "screen_height": 480,
    },
)


def list_dealerships(db) -> None:
    rows = db.scalars(select(Dealership).order_by(Dealership.name)).all()
    for dealer in rows:
        print(f"  {dealer.slug}")
        print(f"    {dealer.name} · {dealer.id}")


def resolve_dealership(db, *, slug: str | None, dealership_id: uuid.UUID | None) -> Dealership:
    if dealership_id is not None:
        dealer = db.get(Dealership, dealership_id)
        if dealer is None:
            raise SystemExit(f"Dealership not found: {dealership_id}")
        return dealer
    if slug:
        dealer = db.scalar(select(Dealership).where(Dealership.slug == slug))
        if dealer is None:
            raise SystemExit(f"Dealership not found for slug: {slug!r}")
        return dealer
    raise SystemExit("Pass --slug or --dealership-id")


def clear_minew_devices(db, dealership_id: uuid.UUID) -> None:
    db.execute(
        delete(ESLDevice).where(
            ESLDevice.dealership_id == dealership_id,
            ESLDevice.provider == "minew",
        )
    )


def seed_minew_kit(
    db,
    dealership: Dealership,
    *,
    reset: bool,
) -> None:
    if reset:
        clear_minew_devices(db, dealership.id)
        db.commit()

    created = 0
    skipped = 0
    for spec in MINEW_KIT_DEVICES:
        device_id = str(spec["device_id"])
        existing = db.scalar(
            select(ESLDevice).where(
                ESLDevice.dealership_id == dealership.id,
                ESLDevice.device_id == device_id,
            )
        )
        if existing is not None:
            skipped += 1
            continue

        db.add(
            ESLDevice(
                id=uuid.uuid4(),
                dealership_id=dealership.id,
                device_id=device_id,
                provider="minew",
                provider_device_id=device_id,
                model=str(spec["model"]),
                screen_width=int(spec["screen_width"]),
                screen_height=int(spec["screen_height"]),
                battery_level=100,
                signal_status="unknown",
                status="online",
            )
        )
        created += 1

    db.commit()
    print(f"Seeded {dealership.name} ({dealership.slug})")
    print(f"  {created} Minew devices created, {skipped} skipped (already present)")
    print("  Pilot tag for first refresh: E100000A1525 (4.2-BWRY 400x300)")


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed Minew demo kit ESL devices")
    parser.add_argument("--list", action="store_true", help="List dealerships")
    parser.add_argument("--slug", help="Dealership slug")
    parser.add_argument("--dealership-id", type=uuid.UUID, help="Dealership UUID")
    parser.add_argument("--reset", action="store_true", help="Remove prior minew provider devices")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        if args.list:
            list_dealerships(db)
            return

        dealership = resolve_dealership(
            db,
            slug=args.slug,
            dealership_id=args.dealership_id,
        )
        seed_minew_kit(db, dealership, reset=args.reset)
    finally:
        db.close()


if __name__ == "__main__":
    main()
