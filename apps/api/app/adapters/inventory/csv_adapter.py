import csv
import uuid
from decimal import Decimal, InvalidOperation
from pathlib import Path

from app.adapters.inventory.base import InventoryAdapter
from app.schemas.normalized_vehicle import NormalizedVehicle

_DEFAULT_COLUMN_MAP = {
    "vin": "vin",
    "stock_number": "stock_number",
    "year": "year",
    "make": "make",
    "model": "model",
    "trim": "trim",
    "mileage": "mileage",
    "price": "price",
    "status": "status",
    "photo_url": "photo_url",
}


def _parse_decimal(value: str | None) -> Decimal | None:
    if not value:
        return None
    try:
        return Decimal(value.strip()).quantize(Decimal("0.01"))
    except (InvalidOperation, ValueError):
        return None


def _parse_int(value: str | None) -> int | None:
    if not value:
        return None
    try:
        return int(float(value.strip()))
    except (TypeError, ValueError):
        return None


class CsvAdapter(InventoryAdapter):
    """Generic CSV file import with configurable column mapping."""

    def test_connection(self, config: dict) -> None:
        file_path = config.get("file_path")
        if not file_path:
            raise ValueError("config.file_path is required for CSV imports")
        path = Path(file_path)
        if not path.is_file():
            raise FileNotFoundError(f"CSV file not found: {path}")

    def fetch_inventory(
        self, dealership_id: uuid.UUID, config: dict
    ) -> list[NormalizedVehicle]:
        self.test_connection(config)
        path = Path(config["file_path"])
        column_map: dict[str, str] = {**_DEFAULT_COLUMN_MAP, **config.get("column_map", {})}
        source_type = config.get("source_type", "csv")

        vehicles: list[NormalizedVehicle] = []
        with path.open(newline="", encoding="utf-8-sig") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                normalized_row = {
                    target: row.get(source_col, "").strip()
                    for target, source_col in column_map.items()
                    if source_col in row
                }
                vin = normalized_row.get("vin")
                if not vin:
                    continue
                photo_url = normalized_row.get("photo_url")
                vehicles.append(
                    NormalizedVehicle(
                        vin=vin.upper(),
                        stock_number=normalized_row.get("stock_number") or None,
                        year=_parse_int(normalized_row.get("year")),
                        make=normalized_row.get("make") or None,
                        model=normalized_row.get("model") or None,
                        trim=normalized_row.get("trim") or None,
                        mileage=_parse_int(normalized_row.get("mileage")),
                        price=_parse_decimal(normalized_row.get("price")),
                        status=(normalized_row.get("status") or "available").lower(),
                        dealership_id=dealership_id,
                        photos=[photo_url] if photo_url else [],
                        source_type=source_type,
                    )
                )
        return vehicles
