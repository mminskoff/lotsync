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


class InventoryTestResult(BaseModel):
    success: bool
    message: str


class InventorySyncResult(BaseModel):
    success: bool
    vehicles_imported: int
    vehicles_created: int
    vehicles_updated: int
    vehicles_off_lot: int = 0
    sync_run_id: uuid.UUID
    error: str | None = None


class InventorySyncRunResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    dealership_id: uuid.UUID
    inventory_source_id: uuid.UUID
    status: str
    started_at: datetime
    finished_at: datetime | None
    records_processed: int
    vehicles_created: int
    vehicles_updated: int
    vehicles_off_lot: int
    error_message: str | None
