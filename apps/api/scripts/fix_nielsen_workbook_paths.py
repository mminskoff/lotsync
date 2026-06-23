"""Point all Nielsen inventory sources at the deployable workbook path."""

from __future__ import annotations

from sqlalchemy import select

from app.adapters.inventory.workbook_paths import DEFAULT_WORKBOOK
from app.core.database import SessionLocal
from app.models.inventory_source import InventorySource

DEPLOY_PATH = "data/nielsen-ddc.xlsx"


def main() -> None:
    if not DEFAULT_WORKBOOK.is_file():
        raise SystemExit(
            f"Workbook missing at {DEFAULT_WORKBOOK}. "
            f"Copy Nielsen DDC Files.xlsx to data/nielsen-ddc.xlsx first."
        )

    db = SessionLocal()
    try:
        sources = list(
            db.scalars(
                select(InventorySource).where(InventorySource.source_type == "nielsen")
            ).all()
        )
        if not sources:
            print("No Nielsen inventory sources found.")
            return

        for source in sources:
            config = dict(source.config_json or {})
            old = config.get("file_path", "")
            config["file_path"] = DEPLOY_PATH
            source.config_json = config
            print(f"  {source.name}: {old!r} → {DEPLOY_PATH!r}")

        db.commit()
        print(f"\nUpdated {len(sources)} source(s).")
    finally:
        db.close()


if __name__ == "__main__":
    main()
