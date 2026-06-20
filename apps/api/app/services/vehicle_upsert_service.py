import uuid
from dataclasses import dataclass
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.vehicle import Vehicle
from app.schemas.normalized_vehicle import NormalizedVehicle
from app.services.audit_service import log_action


@dataclass
class VehicleUpsertResult:
    created: int
    updated: int
    off_lot: int
    processed: int


def _apply_normalized_fields(
    vehicle: Vehicle, record: NormalizedVehicle, source_type: str, synced_at: datetime
) -> None:
    vehicle.stock_number = record.stock_number
    vehicle.year = record.year
    vehicle.make = record.make
    vehicle.model = record.model
    vehicle.trim = record.trim
    vehicle.mileage = record.mileage
    vehicle.status = record.status
    vehicle.source_type = source_type
    vehicle.price_type = record.price_type
    vehicle.source_price = record.price
    vehicle.displayed_price = record.price
    vehicle.last_source_update_at = synced_at
    vehicle.updated_at = synced_at
    if record.photos:
        vehicle.image_url = record.photos[0]
    if record.vehicle_url:
        vehicle.vehicle_url = record.vehicle_url


def upsert_vehicles_from_import(
    db: Session,
    dealership_id: uuid.UUID,
    records: list[NormalizedVehicle],
    source_type: str,
    *,
    mark_missing_off_lot: bool = True,
) -> VehicleUpsertResult:
    synced_at = datetime.now(UTC)
    imported_vins = {record.vin.upper() for record in records}

    existing_stmt = select(Vehicle).where(
        Vehicle.dealership_id == dealership_id,
        Vehicle.vin.in_(imported_vins),
    )
    existing_by_vin = {vehicle.vin: vehicle for vehicle in db.scalars(existing_stmt).all()}

    created = 0
    updated = 0

    for record in records:
        vin = record.vin.upper()
        existing = existing_by_vin.get(vin)
        if existing is None:
            vehicle = Vehicle(
                id=uuid.uuid4(),
                dealership_id=dealership_id,
                vin=vin,
                price_verified=False,
            )
            _apply_normalized_fields(vehicle, record, source_type, synced_at)
            db.add(vehicle)
            existing_by_vin[vin] = vehicle
            created += 1
        else:
            _apply_normalized_fields(existing, record, source_type, synced_at)
            updated += 1

    off_lot = 0
    if mark_missing_off_lot and imported_vins:
        stale_stmt = select(Vehicle).where(
            Vehicle.dealership_id == dealership_id,
            Vehicle.source_type == source_type,
            Vehicle.vin.not_in(imported_vins),
            Vehicle.status.not_in(["sold", "off_lot"]),
        )
        for vehicle in db.scalars(stale_stmt).all():
            vehicle.status = "off_lot"
            vehicle.updated_at = synced_at
            off_lot += 1

    log_action(
        db,
        dealership_id=dealership_id,
        action="inventory.import",
        entity_type="vehicle",
        entity_id=None,
        metadata={
            "source_type": source_type,
            "processed": len(records),
            "created": created,
            "updated": updated,
            "off_lot": off_lot,
        },
    )

    return VehicleUpsertResult(
        created=created,
        updated=updated,
        off_lot=off_lot,
        processed=len(records),
    )
