from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.tenancy import get_dealership_id
from app.schemas.pairing import (
    ActivePairingsResponse,
    PairingCreateRequest,
    PairingReassignRequest,
    PairingResponse,
    UnpairResponse,
    VinAssignmentResponse,
)
from app.services import pairing_service

router = APIRouter(prefix="/pairings", tags=["pairings"])


@router.post("", response_model=PairingResponse, status_code=201)
def create_pairing(
    data: PairingCreateRequest,
    dealership_id: UUID = Depends(get_dealership_id),
    db: Session = Depends(get_db),
):
    return pairing_service.pair_vehicle_to_device(db, dealership_id, data)


@router.post("/reassign", response_model=PairingResponse)
def reassign_pairing(
    data: PairingReassignRequest,
    dealership_id: UUID = Depends(get_dealership_id),
    db: Session = Depends(get_db),
):
    return pairing_service.reassign_device(db, dealership_id, data)


@router.delete("/{assignment_id}", response_model=UnpairResponse)
def unpair(
    assignment_id: UUID,
    dealership_id: UUID = Depends(get_dealership_id),
    db: Session = Depends(get_db),
):
    return pairing_service.unpair_assignment(db, dealership_id, assignment_id)


@router.get("/active", response_model=ActivePairingsResponse)
def list_active_pairings(
    dealership_id: UUID = Depends(get_dealership_id),
    db: Session = Depends(get_db),
):
    return pairing_service.list_active_pairings(db, dealership_id)
