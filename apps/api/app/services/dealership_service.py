import uuid

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.dealership import Dealership
from app.schemas.dealership import DealershipUpdate
from app.services.audit_service import log_action


def get_dealership(db: Session, dealership_id: uuid.UUID) -> Dealership:
    dealership = db.get(Dealership, dealership_id)
    if dealership is None:
        raise HTTPException(status_code=404, detail="Dealership not found")
    return dealership


def update_dealership(
    db: Session, dealership_id: uuid.UUID, data: DealershipUpdate
) -> Dealership:
    dealership = get_dealership(db, dealership_id)
    changes = data.model_dump(exclude_unset=True)
    for field, value in changes.items():
        setattr(dealership, field, value)

    log_action(
        db,
        dealership_id=dealership_id,
        action="dealership.update",
        entity_type="dealership",
        entity_id=dealership_id,
        metadata=changes,
    )
    db.commit()
    db.refresh(dealership)
    return dealership
