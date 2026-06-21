from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.tenancy import get_dealership_id
from app.schemas.dealership import (
    AccessibleDealershipsResponse,
    DealershipResponse,
    DealershipUpdate,
)
from app.services import dealership_service

router = APIRouter(prefix="/dealerships", tags=["dealerships"])


@router.get("/me", response_model=DealershipResponse)
def get_my_dealership(
    dealership_id: UUID = Depends(get_dealership_id),
    db: Session = Depends(get_db),
):
    return dealership_service.get_dealership(db, dealership_id)


@router.get("/accessible", response_model=AccessibleDealershipsResponse)
def list_accessible_dealerships(
    dealership_id: UUID = Depends(get_dealership_id),
    db: Session = Depends(get_db),
):
    current, groups = dealership_service.list_accessible_rooftop_groups(
        db, dealership_id
    )
    return AccessibleDealershipsResponse(
        groups=groups,
        active_organization_id=current.organization_id,
        active_dealership_id=dealership_id,
    )


@router.patch("/me", response_model=DealershipResponse)
def update_my_dealership(
    data: DealershipUpdate,
    dealership_id: UUID = Depends(get_dealership_id),
    db: Session = Depends(get_db),
):
    return dealership_service.update_dealership(db, dealership_id, data)
