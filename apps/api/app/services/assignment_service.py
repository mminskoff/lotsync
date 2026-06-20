import uuid

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.assignment import VehicleESLAssignment
from app.models.esl_device import ESLDevice
from app.models.vehicle import Vehicle
from app.schemas.assignment import AssignmentCreate
from app.services.audit_service import log_action


def list_assignments(db: Session, dealership_id: uuid.UUID) -> list[VehicleESLAssignment]:
    stmt = (
        select(VehicleESLAssignment)
        .where(VehicleESLAssignment.dealership_id == dealership_id)
        .order_by(VehicleESLAssignment.assigned_at.desc())
    )
    return list(db.scalars(stmt).all())


def get_assignment(
    db: Session, dealership_id: uuid.UUID, assignment_id: uuid.UUID
) -> VehicleESLAssignment:
    assignment = db.get(VehicleESLAssignment, assignment_id)
    if assignment is None or assignment.dealership_id != dealership_id:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment


def create_assignment(
    db: Session, dealership_id: uuid.UUID, data: AssignmentCreate
) -> VehicleESLAssignment:
    vehicle = db.get(Vehicle, data.vehicle_id)
    if vehicle is None or vehicle.dealership_id != dealership_id:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    device = db.get(ESLDevice, data.esl_device_id)
    if device is None or device.dealership_id != dealership_id:
        raise HTTPException(status_code=404, detail="ESL device not found")

    assignment = VehicleESLAssignment(
        id=uuid.uuid4(),
        dealership_id=dealership_id,
        **data.model_dump(),
    )
    db.add(assignment)
    try:
        db.flush()
        log_action(
            db,
            dealership_id=dealership_id,
            action="assignment.create",
            entity_type="vehicle_esl_assignment",
            entity_id=assignment.id,
            metadata={
                "vehicle_id": str(data.vehicle_id),
                "esl_device_id": str(data.esl_device_id),
            },
        )
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Active assignment already exists for this vehicle or ESL device",
        ) from exc
    db.refresh(assignment)
    return assignment
