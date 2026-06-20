import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SyncEventCreate(BaseModel):
    vehicle_id: uuid.UUID | None = None
    esl_device_id: uuid.UUID | None = None
    event_type: str = Field(min_length=1)
    old_value: dict | None = None
    new_value: dict | None = None
    status: str = Field(min_length=1)
    error_message: str | None = None


class SyncEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    dealership_id: uuid.UUID
    vehicle_id: uuid.UUID | None
    esl_device_id: uuid.UUID | None
    event_type: str
    old_value: dict | None
    new_value: dict | None
    status: str
    error_message: str | None
    created_at: datetime
    processed_at: datetime | None
