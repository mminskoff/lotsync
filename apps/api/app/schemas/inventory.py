import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class InventorySourceCreate(BaseModel):
    source_type: str = Field(min_length=1)
    name: str = Field(min_length=1)
    config_json: dict = Field(default_factory=dict)
    enabled: bool = True


class InventorySourceUpdate(BaseModel):
    source_type: str | None = None
    name: str | None = None
    config_json: dict | None = None
    enabled: bool | None = None


class InventorySourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    dealership_id: uuid.UUID
    source_type: str
    name: str
    config_json: dict
    enabled: bool
    last_sync_at: datetime | None
    last_success_at: datetime | None
    last_error: str | None
