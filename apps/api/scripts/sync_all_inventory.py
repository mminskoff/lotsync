"""Sync all enabled inventory sources (for Railway cron or manual runs).

Run from apps/api:
    PYTHONPATH=. .venv/bin/python scripts/sync_all_inventory.py
    PYTHONPATH=. .venv/bin/python scripts/sync_all_inventory.py --type nielsen
"""

from __future__ import annotations

import argparse
import sys

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.inventory_source import InventorySource
from app.services.inventory_sync_service import sync_inventory_source_now


def main() -> None:
    parser = argparse.ArgumentParser(description="Sync all enabled inventory sources")
    parser.add_argument(
        "--type",
        help="Only sync sources of this type (e.g. nielsen, csv)",
    )
    args = parser.parse_args()

    db = SessionLocal()
    failures = 0
    try:
        stmt = select(InventorySource).where(InventorySource.enabled.is_(True))
        if args.type:
            stmt = stmt.where(InventorySource.source_type == args.type)
        sources = list(db.scalars(stmt.order_by(InventorySource.name)).all())

        if not sources:
            print("No enabled inventory sources found.")
            return

        print(f"Syncing {len(sources)} source(s)...")
        for source in sources:
            try:
                result = sync_inventory_source_now(db, source.dealership_id, source.id)
                if result.success:
                    print(
                        f"  OK  {source.name}: {result.vehicles_imported} vehicles "
                        f"({result.vehicles_created} new, {result.vehicles_updated} updated)"
                    )
                else:
                    failures += 1
                    print(f"  FAIL {source.name}: {result.error}")
            except Exception as exc:
                failures += 1
                db.rollback()
                print(f"  FAIL {source.name}: {exc}")

        if failures:
            sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
