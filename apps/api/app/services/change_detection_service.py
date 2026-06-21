from decimal import Decimal
from typing import Any

from app.models.vehicle import Vehicle
from app.services.sync_constants import TRACKED_VEHICLE_FIELDS


def _serialize_value(value: Any) -> Any:
    if isinstance(value, Decimal):
        return str(value)
    return value


def snapshot_vehicle(vehicle: Vehicle) -> dict[str, Any]:
    return {
        field: _serialize_value(getattr(vehicle, field))
        for field in TRACKED_VEHICLE_FIELDS
    }


def diff_snapshots(before: dict[str, Any], after: dict[str, Any]) -> dict[str, dict[str, Any]] | None:
    changes: dict[str, dict[str, Any]] = {}
    for field in TRACKED_VEHICLE_FIELDS:
        old = before.get(field)
        new = after.get(field)
        if old != new:
            changes[field] = {"old": old, "new": new}
    return changes or None
