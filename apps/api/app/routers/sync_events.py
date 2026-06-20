from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.tenancy import get_dealership_id
from app.schemas.sync_event import SyncEventCreate, SyncEventResponse
from app.services import sync_event_service

router = APIRouter(prefix="/sync-events", tags=["sync-events"])


@router.get("", response_model=list[SyncEventResponse])
def list_sync_events(
    status: str | None = Query(default=None),
    vehicle_id: UUID | None = Query(default=None),
    dealership_id: UUID = Depends(get_dealership_id),
    db: Session = Depends(get_db),
):
    return sync_event_service.list_sync_events(
        db, dealership_id, status=status, vehicle_id=vehicle_id
    )


@router.post("", response_model=SyncEventResponse, status_code=201)
def create_sync_event(
    data: SyncEventCreate,
    dealership_id: UUID = Depends(get_dealership_id),
    db: Session = Depends(get_db),
):
    return sync_event_service.create_sync_event(db, dealership_id, data)
