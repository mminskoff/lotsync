from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.tenancy import get_dealership_id
from app.schemas.pairing import DeviceLookupResponse, VehicleLookupResponse
from app.services import pairing_service

router = APIRouter(prefix="/mobile", tags=["mobile"])


@router.get("/vehicles/by-vin/{vin}", response_model=VehicleLookupResponse)
def lookup_vehicle_by_vin(
    vin: str,
    dealership_id: UUID = Depends(get_dealership_id),
    db: Session = Depends(get_db),
):
    return pairing_service.lookup_vehicle_by_vin(db, dealership_id, vin)


@router.get("/esl-devices/by-code/{device_code}", response_model=DeviceLookupResponse)
def lookup_device_by_code(
    device_code: str,
    dealership_id: UUID = Depends(get_dealership_id),
    db: Session = Depends(get_db),
):
    return pairing_service.lookup_device_by_code(db, dealership_id, device_code)
