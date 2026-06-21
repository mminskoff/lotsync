import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.assignment import VehicleESLAssignment
from app.models.esl_device import ESLDevice
from app.models.sync_event import SyncEvent
from app.models.vehicle import Vehicle
from app.services.audit_service import log_action
from app.services.sync_constants import SYNC_PENDING, VEHICLE_SYNC_PENDING


def load_active_assignments_by_vehicle(
    db: Session, dealership_id: uuid.UUID
) -> dict[uuid.UUID, VehicleESLAssignment]:
    stmt = select(VehicleESLAssignment).where(
        VehicleESLAssignment.dealership_id == dealership_id,
        VehicleESLAssignment.status == "active",
        VehicleESLAssignment.unassigned_at.is_(None),
    )
    return {assignment.vehicle_id: assignment for assignment in db.scalars(stmt).all()}


def get_active_assignment_for_vehicle(
    db: Session, dealership_id: uuid.UUID, vehicle_id: uuid.UUID
) -> VehicleESLAssignment | None:
    stmt = select(VehicleESLAssignment).where(
        VehicleESLAssignment.dealership_id == dealership_id,
        VehicleESLAssignment.vehicle_id == vehicle_id,
        VehicleESLAssignment.status == "active",
        VehicleESLAssignment.unassigned_at.is_(None),
    )
    return db.scalar(stmt)


def enqueue_label_sync(
    db: Session,
    *,
    dealership_id: uuid.UUID,
    vehicle: Vehicle,
    esl_device_id: uuid.UUID,
    event_type: str,
    old_value: dict | None = None,
    new_value: dict | None = None,
) -> SyncEvent:
    vehicle.sync_status = VEHICLE_SYNC_PENDING
    event = SyncEvent(
        id=uuid.uuid4(),
        dealership_id=dealership_id,
        vehicle_id=vehicle.id,
        esl_device_id=esl_device_id,
        event_type=event_type,
        status=SYNC_PENDING,
        old_value=old_value,
        new_value=new_value,
        attempt_count=0,
    )
    db.add(event)
    db.flush()

    log_action(
        db,
        dealership_id=dealership_id,
        action="sync_event.create",
        entity_type="sync_event",
        entity_id=event.id,
        metadata={"event_type": event_type, "status": event.status, "vehicle_id": str(vehicle.id)},
    )
    return event


def enqueue_if_paired(
    db: Session,
    *,
    dealership_id: uuid.UUID,
    vehicle: Vehicle,
    event_type: str,
    old_value: dict | None,
    new_value: dict | None,
    paired_assignments: dict[uuid.UUID, VehicleESLAssignment] | None = None,
) -> SyncEvent | None:
    assignment = (
        paired_assignments.get(vehicle.id)
        if paired_assignments is not None
        else None
    )
    if assignment is None:
        assignment = get_active_assignment_for_vehicle(db, dealership_id, vehicle.id)
    if assignment is None:
        return None

    return enqueue_label_sync(
        db,
        dealership_id=dealership_id,
        vehicle=vehicle,
        esl_device_id=assignment.esl_device_id,
        event_type=event_type,
        old_value=old_value,
        new_value=new_value,
    )
