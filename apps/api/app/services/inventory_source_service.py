import uuid

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.inventory_source import InventorySource
from app.schemas.inventory import InventorySourceCreate, InventorySourceUpdate
from app.services.audit_service import log_action


def list_inventory_sources(db: Session, dealership_id: uuid.UUID) -> list[InventorySource]:
    stmt = (
        select(InventorySource)
        .where(InventorySource.dealership_id == dealership_id)
        .order_by(InventorySource.name)
    )
    return list(db.scalars(stmt).all())


def get_inventory_source(
    db: Session, dealership_id: uuid.UUID, source_id: uuid.UUID
) -> InventorySource:
    source = db.get(InventorySource, source_id)
    if source is None or source.dealership_id != dealership_id:
        raise HTTPException(status_code=404, detail="Inventory source not found")
    return source


def create_inventory_source(
    db: Session, dealership_id: uuid.UUID, data: InventorySourceCreate
) -> InventorySource:
    source = InventorySource(id=uuid.uuid4(), dealership_id=dealership_id, **data.model_dump())
    db.add(source)
    log_action(
        db,
        dealership_id=dealership_id,
        action="inventory_source.create",
        entity_type="inventory_source",
        entity_id=source.id,
        metadata={"name": data.name, "source_type": data.source_type},
    )
    db.commit()
    db.refresh(source)
    return source


def update_inventory_source(
    db: Session, dealership_id: uuid.UUID, source_id: uuid.UUID, data: InventorySourceUpdate
) -> InventorySource:
    source = get_inventory_source(db, dealership_id, source_id)
    changes = data.model_dump(exclude_unset=True)
    for field, value in changes.items():
        setattr(source, field, value)

    log_action(
        db,
        dealership_id=dealership_id,
        action="inventory_source.update",
        entity_type="inventory_source",
        entity_id=source_id,
        metadata=changes,
    )
    db.commit()
    db.refresh(source)
    return source
