import uuid

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.esl_device import ESLDevice
from app.models.sync_event import SyncEvent
from app.models.vehicle import Vehicle
from app.schemas.sync_event import SyncEventCreate
from app.services.audit_service import log_action


def list_sync_events(
    db: Session,
    dealership_id: uuid.UUID,
    *,
    status: str | None = None,
    vehicle_id: uuid.UUID | None = None,
) -> list[SyncEvent]:
    stmt = select(SyncEvent).where(SyncEvent.dealership_id == dealership_id)
    if status is not None:
        stmt = stmt.where(SyncEvent.status == status)
    if vehicle_id is not None:
        stmt = stmt.where(SyncEvent.vehicle_id == vehicle_id)
    stmt = stmt.order_by(SyncEvent.created_at.desc())
    return list(db.scalars(stmt).all())


def create_sync_event(
    db: Session, dealership_id: uuid.UUID, data: SyncEventCreate
) -> SyncEvent:
    if data.vehicle_id is not None:
        vehicle = db.get(Vehicle, data.vehicle_id)
        if vehicle is None or vehicle.dealership_id != dealership_id:
            raise HTTPException(status_code=404, detail="Vehicle not found")

    if data.esl_device_id is not None:
        device = db.get(ESLDevice, data.esl_device_id)
        if device is None or device.dealership_id != dealership_id:
            raise HTTPException(status_code=404, detail="ESL device not found")

    event = SyncEvent(id=uuid.uuid4(), dealership_id=dealership_id, **data.model_dump())
    db.add(event)
    log_action(
        db,
        dealership_id=dealership_id,
        action="sync_event.create",
        entity_type="sync_event",
        entity_id=event.id,
        metadata={"event_type": data.event_type, "status": data.status},
    )
    db.commit()
    db.refresh(event)
    return event
