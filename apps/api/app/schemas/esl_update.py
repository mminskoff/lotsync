from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class RenderLabelResponse(BaseModel):
    job_id: uuid.UUID | None = None
    vehicle_id: uuid.UUID | None = None
    esl_device_id: uuid.UUID | None = None
    width: int
    height: int
    color_mode: str
    pixel_byte_length: int
    encoded_data_length: int
    image_path: str | None = None
    encoded_payload_path: str | None = None
    encoded_data_preview: str = Field(
        description="First 64 chars of MQTT data field for debugging"
    )


class SendToEslResponse(BaseModel):
    job_id: uuid.UUID
    status: str
    tag_mac: str
    gateway_mac: str
    topic: str
    seq: int
    pixel_byte_length: int
    encoded_data_length: int


class TestUpdateRequest(BaseModel):
    tag_mac: str | None = None
    gateway_mac: str | None = None
    width: int = 800
    height: int = 480
    color_mode: str = "E6"
    price: str = "$32,995"
    subscribe: bool = True


class TestUpdateResponse(BaseModel):
    job_id: uuid.UUID
    status: str
    tag_mac: str
    gateway_mac: str
    topic: str
    seq: int
    color_mode: str
    width: int
    height: int
    image_path: str
    encoded_payload_path: str


class ESLUpdateJobResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    dealership_id: uuid.UUID
    vehicle_id: uuid.UUID | None
    esl_device_id: uuid.UUID | None
    tag_mac: str
    gateway_mac: str
    image_path: str | None
    encoded_payload_path: str | None
    seq: int | None
    status: str
    error_message: str | None
    gateway_response: dict | None
    created_at: datetime
    sent_at: datetime | None
    completed_at: datetime | None


class ESLStatusResponse(BaseModel):
    mqtt_connected: bool
    mqtt_subscribed: bool
    gateway_mac: str | None
    subscribe_topic: str
    recent_jobs: list[ESLUpdateJobResponse]
    recent_gateway_messages: list[dict]
