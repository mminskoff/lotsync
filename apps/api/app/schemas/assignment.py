import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AssignmentCreate(BaseModel):
    vehicle_id: uuid.UUID
    esl_device_id: uuid.UUID
    assigned_by: uuid.UUID | None = None
    status: str = "active"


class AssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    dealership_id: uuid.UUID
    vehicle_id: uuid.UUID
    esl_device_id: uuid.UUID
    assigned_by: uuid.UUID | None
    assigned_at: datetime
    unassigned_at: datetime | None
    status: str
    assignment_source: str
    scan_type: str | None
    nfc_uid: str | None
