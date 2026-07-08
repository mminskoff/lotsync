from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.tenancy import get_dealership_id
from app.schemas.esl_update import ESLStatusResponse, TestUpdateRequest, TestUpdateResponse
from app.services import minew_update_service

router = APIRouter(prefix="/esl", tags=["esl"])


@router.post("/test-update", response_model=TestUpdateResponse)
def test_update(
    body: TestUpdateRequest,
    dealership_id: UUID = Depends(get_dealership_id),
    db: Session = Depends(get_db),
):
    return minew_update_service.run_test_update(db, dealership_id, body)


@router.get("/status", response_model=ESLStatusResponse)
def esl_status(
    dealership_id: UUID = Depends(get_dealership_id),
    db: Session = Depends(get_db),
):
    return minew_update_service.get_esl_status(db, dealership_id)
