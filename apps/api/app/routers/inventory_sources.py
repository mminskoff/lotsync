from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.tenancy import get_dealership_id
from app.schemas.inventory import (
    InventorySourceCreate,
    InventorySourceResponse,
    InventorySourceUpdate,
    InventorySyncResult,
    InventorySyncRunResponse,
    InventoryTestResult,
)
from app.services import inventory_source_service, inventory_sync_service

router = APIRouter(prefix="/inventory-sources", tags=["inventory-sources"])


@router.get("", response_model=list[InventorySourceResponse])
def list_inventory_sources(
    dealership_id: UUID = Depends(get_dealership_id),
    db: Session = Depends(get_db),
):
    return inventory_source_service.list_inventory_sources(db, dealership_id)


@router.post("", response_model=InventorySourceResponse, status_code=201)
def create_inventory_source(
    data: InventorySourceCreate,
    dealership_id: UUID = Depends(get_dealership_id),
    db: Session = Depends(get_db),
):
    return inventory_source_service.create_inventory_source(db, dealership_id, data)


@router.patch("/{source_id}", response_model=InventorySourceResponse)
def update_inventory_source(
    source_id: UUID,
    data: InventorySourceUpdate,
    dealership_id: UUID = Depends(get_dealership_id),
    db: Session = Depends(get_db),
):
    return inventory_source_service.update_inventory_source(db, dealership_id, source_id, data)


@router.post("/{source_id}/test", response_model=InventoryTestResult)
def test_inventory_source(
    source_id: UUID,
    dealership_id: UUID = Depends(get_dealership_id),
    db: Session = Depends(get_db),
):
    return inventory_sync_service.test_inventory_source(db, dealership_id, source_id)


@router.post("/{source_id}/sync-now", response_model=InventorySyncResult)
def sync_inventory_source(
    source_id: UUID,
    dealership_id: UUID = Depends(get_dealership_id),
    db: Session = Depends(get_db),
):
    return inventory_sync_service.sync_inventory_source_now(db, dealership_id, source_id)


@router.get("/{source_id}/sync-runs", response_model=list[InventorySyncRunResponse])
def list_inventory_sync_runs(
    source_id: UUID,
    dealership_id: UUID = Depends(get_dealership_id),
    db: Session = Depends(get_db),
):
    return inventory_sync_service.list_sync_runs(db, dealership_id, source_id)
