from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.tenancy import get_dealership_id
from app.schemas.sync_event import SyncEventCreate, SyncEventResponse, SyncEventRetryResponse
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


@router.post("/{event_id}/retry", response_model=SyncEventRetryResponse)
def retry_sync_event(
    event_id: UUID,
    dealership_id: UUID = Depends(get_dealership_id),
    db: Session = Depends(get_db),
):
    event = sync_event_service.retry_sync_event(db, dealership_id, event_id)
    return SyncEventRetryResponse(
        success=True,
        sync_event=event,
        message="Sync event queued for retry",
    )
