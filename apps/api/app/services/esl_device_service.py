import uuid

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.esl_device import ESLDevice
from app.schemas.esl_device import ESLDeviceRegister, ESLDeviceUpdate
from app.services.audit_service import log_action


def list_esl_devices(db: Session, dealership_id: uuid.UUID) -> list[ESLDevice]:
    stmt = (
        select(ESLDevice)
        .where(ESLDevice.dealership_id == dealership_id)
        .order_by(ESLDevice.created_at.desc())
    )
    return list(db.scalars(stmt).all())


def get_esl_device(db: Session, dealership_id: uuid.UUID, device_id: uuid.UUID) -> ESLDevice:
    device = db.get(ESLDevice, device_id)
    if device is None or device.dealership_id != dealership_id:
        raise HTTPException(status_code=404, detail="ESL device not found")
    return device


def register_esl_device(
    db: Session, dealership_id: uuid.UUID, data: ESLDeviceRegister
) -> ESLDevice:
    device = ESLDevice(id=uuid.uuid4(), dealership_id=dealership_id, **data.model_dump())
    db.add(device)
    try:
        db.flush()
        log_action(
            db,
            dealership_id=dealership_id,
            action="esl_device.register",
            entity_type="esl_device",
            entity_id=device.id,
            metadata={"device_id": data.device_id},
        )
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409, detail="Device ID already exists for this dealership"
        ) from exc
    db.refresh(device)
    return device


def update_esl_device(
    db: Session, dealership_id: uuid.UUID, device_id: uuid.UUID, data: ESLDeviceUpdate
) -> ESLDevice:
    device = get_esl_device(db, dealership_id, device_id)
    changes = data.model_dump(exclude_unset=True)
    for field, value in changes.items():
        setattr(device, field, value)

    log_action(
        db,
        dealership_id=dealership_id,
        action="esl_device.update",
        entity_type="esl_device",
        entity_id=device_id,
        metadata=changes,
    )
    db.commit()
    db.refresh(device)
    return device
