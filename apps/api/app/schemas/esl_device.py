import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ESLDeviceRegister(BaseModel):
    device_id: str = Field(min_length=1)
    provider: str | None = None
    provider_device_id: str | None = None
    model: str | None = None
    screen_width: int | None = None
    screen_height: int | None = None
    gateway_id: str | None = None
    status: str | None = None


class ESLDeviceUpdate(BaseModel):
    provider: str | None = None
    provider_device_id: str | None = None
    model: str | None = None
    screen_width: int | None = None
    screen_height: int | None = None
    battery_level: int | None = None
    signal_status: str | None = None
    gateway_id: str | None = None
    status: str | None = None


class ESLDeviceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    dealership_id: uuid.UUID
    device_id: str
    provider: str | None
    provider_device_id: str | None
    model: str | None
    screen_width: int | None
    screen_height: int | None
    battery_level: int | None
    signal_status: str | None
    gateway_id: str | None
    status: str | None
    last_seen_at: datetime | None
    last_updated_at: datetime | None
    created_at: datetime
