import uuid

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.vehicle import Vehicle
from app.schemas.vehicle import VehicleCreate, VehicleUpdate
from app.services.audit_service import log_action


def list_vehicles(db: Session, dealership_id: uuid.UUID) -> list[Vehicle]:
    stmt = select(Vehicle).where(Vehicle.dealership_id == dealership_id).order_by(Vehicle.created_at.desc())
    return list(db.scalars(stmt).all())


def get_vehicle(db: Session, dealership_id: uuid.UUID, vehicle_id: uuid.UUID) -> Vehicle:
    vehicle = db.get(Vehicle, vehicle_id)
    if vehicle is None or vehicle.dealership_id != dealership_id:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle


def create_vehicle(db: Session, dealership_id: uuid.UUID, data: VehicleCreate) -> Vehicle:
    vehicle = Vehicle(id=uuid.uuid4(), dealership_id=dealership_id, **data.model_dump())
    db.add(vehicle)
    try:
        db.flush()
        log_action(
            db,
            dealership_id=dealership_id,
            action="vehicle.create",
            entity_type="vehicle",
            entity_id=vehicle.id,
            metadata={"vin": data.vin},
        )
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="VIN already exists for this dealership") from exc
    db.refresh(vehicle)
    return vehicle


def update_vehicle(
    db: Session, dealership_id: uuid.UUID, vehicle_id: uuid.UUID, data: VehicleUpdate
) -> Vehicle:
    vehicle = get_vehicle(db, dealership_id, vehicle_id)
    changes = data.model_dump(exclude_unset=True)
    for field, value in changes.items():
        setattr(vehicle, field, value)

    log_action(
        db,
        dealership_id=dealership_id,
        action="vehicle.update",
        entity_type="vehicle",
        entity_id=vehicle_id,
        metadata=changes,
    )
    db.commit()
    db.refresh(vehicle)
    return vehicle
