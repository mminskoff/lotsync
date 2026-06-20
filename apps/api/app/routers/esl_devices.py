from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.tenancy import get_dealership_id
from app.schemas.esl_device import ESLDeviceRegister, ESLDeviceResponse, ESLDeviceUpdate
from app.services import esl_device_service

router = APIRouter(prefix="/esl-devices", tags=["esl-devices"])


@router.get("", response_model=list[ESLDeviceResponse])
def list_esl_devices(
    dealership_id: UUID = Depends(get_dealership_id),
    db: Session = Depends(get_db),
):
    return esl_device_service.list_esl_devices(db, dealership_id)


@router.get("/{device_id}", response_model=ESLDeviceResponse)
def get_esl_device(
    device_id: UUID,
    dealership_id: UUID = Depends(get_dealership_id),
    db: Session = Depends(get_db),
):
    return esl_device_service.get_esl_device(db, dealership_id, device_id)


@router.post("/register", response_model=ESLDeviceResponse, status_code=201)
def register_esl_device(
    data: ESLDeviceRegister,
    dealership_id: UUID = Depends(get_dealership_id),
    db: Session = Depends(get_db),
):
    return esl_device_service.register_esl_device(db, dealership_id, data)


@router.patch("/{device_id}", response_model=ESLDeviceResponse)
def update_esl_device(
    device_id: UUID,
    data: ESLDeviceUpdate,
    dealership_id: UUID = Depends(get_dealership_id),
    db: Session = Depends(get_db),
):
    return esl_device_service.update_esl_device(db, dealership_id, device_id, data)
