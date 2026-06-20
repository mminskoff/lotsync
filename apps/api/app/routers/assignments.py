from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.tenancy import get_dealership_id
from app.schemas.assignment import AssignmentCreate, AssignmentResponse
from app.services import assignment_service

router = APIRouter(prefix="/assignments", tags=["assignments"])


@router.get("", response_model=list[AssignmentResponse])
def list_assignments(
    dealership_id: UUID = Depends(get_dealership_id),
    db: Session = Depends(get_db),
):
    return assignment_service.list_assignments(db, dealership_id)


@router.get("/{assignment_id}", response_model=AssignmentResponse)
def get_assignment(
    assignment_id: UUID,
    dealership_id: UUID = Depends(get_dealership_id),
    db: Session = Depends(get_db),
):
    return assignment_service.get_assignment(db, dealership_id, assignment_id)


@router.post("")
def create_assignment(
    data: AssignmentCreate,
    dealership_id: UUID = Depends(get_dealership_id),
):
    raise HTTPException(
        status_code=410,
        detail="Direct assignment creation is deprecated. Use POST /api/v1/pairings instead.",
    )
