from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.tenancy import get_dealership_id
from app.schemas.pairing import PushLabelResponse, VinAssignmentResponse
from app.schemas.vehicle import VehicleCreate, VehicleResponse, VehicleUpdate
from app.services import pairing_service, vehicle_service

router = APIRouter(prefix="/vehicles", tags=["vehicles"])


@router.get("", response_model=list[VehicleResponse])
def list_vehicles(
    dealership_id: UUID = Depends(get_dealership_id),
    db: Session = Depends(get_db),
):
    return vehicle_service.list_vehicles(db, dealership_id)


@router.get("/by-vin/{vin}/assignment", response_model=VinAssignmentResponse)
def get_assignment_by_vin(
    vin: str,
    dealership_id: UUID = Depends(get_dealership_id),
    db: Session = Depends(get_db),
):
    return pairing_service.get_assignment_by_vin(db, dealership_id, vin)


@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(
    vehicle_id: UUID,
    dealership_id: UUID = Depends(get_dealership_id),
    db: Session = Depends(get_db),
):
    return vehicle_service.get_vehicle(db, dealership_id, vehicle_id)


@router.post("", response_model=VehicleResponse, status_code=201)
def create_vehicle(
    data: VehicleCreate,
    dealership_id: UUID = Depends(get_dealership_id),
    db: Session = Depends(get_db),
):
    return vehicle_service.create_vehicle(db, dealership_id, data)


@router.patch("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(
    vehicle_id: UUID,
    data: VehicleUpdate,
    dealership_id: UUID = Depends(get_dealership_id),
    db: Session = Depends(get_db),
):
    return vehicle_service.update_vehicle(db, dealership_id, vehicle_id, data)


@router.post("/{vehicle_id}/push-label", response_model=PushLabelResponse)
def push_label(
    vehicle_id: UUID,
    dealership_id: UUID = Depends(get_dealership_id),
    db: Session = Depends(get_db),
):
    return pairing_service.push_label_for_vehicle(db, dealership_id, vehicle_id)
