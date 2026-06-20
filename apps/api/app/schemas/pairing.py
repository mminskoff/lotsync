import uuid
from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class DealershipScope(BaseModel):
    organization_id: uuid.UUID | None
    dealership_id: uuid.UUID


class VehiclePairingSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    dealership_id: uuid.UUID
    vin: str
    stock_number: str | None
    year: int | None
    make: str | None
    model: str | None
    trim: str | None
    displayed_price: Decimal | None
    status: str | None
    sync_status: str | None
    image_url: str | None = None


class ESLDevicePairingSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    dealership_id: uuid.UUID
    device_id: str
    provider: str | None
    model: str | None
    battery_level: int | None
    signal_status: str | None
    status: str | None


class AssignmentSummary(BaseModel):
    id: uuid.UUID
    status: str
    assignment_source: str
    scan_type: str | None
    nfc_uid: str | None
    assigned_at: datetime
    unassigned_at: datetime | None
    vehicle: VehiclePairingSummary
    device: ESLDevicePairingSummary


class SyncEventSummary(BaseModel):
    id: uuid.UUID
    event_type: str
    status: str
    created_at: datetime


class PairingCreateRequest(BaseModel):
    vin: str = Field(min_length=1)
    device_code: str = Field(min_length=1)
    force_reassign: bool = False
    scan_type: Literal["barcode", "qr", "nfc", "manual"] | None = None
    nfc_uid: str | None = None
    assignment_source: Literal["mobile_app", "web_pwa", "api", "automation"] = "mobile_app"

    @field_validator("vin")
    @classmethod
    def normalize_vin(cls, value: str) -> str:
        normalized = value.strip().upper()
        if len(normalized) < 5:
            raise ValueError("Invalid VIN format")
        return normalized

    @field_validator("device_code")
    @classmethod
    def normalize_device_code(cls, value: str) -> str:
        return value.strip()


class PairingReassignRequest(BaseModel):
    device_code: str = Field(min_length=1)
    new_vin: str = Field(min_length=1)
    force_reassign: bool = True
    scan_type: Literal["barcode", "qr", "nfc", "manual"] | None = None
    nfc_uid: str | None = None
    assignment_source: Literal["mobile_app", "web_pwa", "api", "automation"] = "mobile_app"

    @field_validator("new_vin")
    @classmethod
    def normalize_vin(cls, value: str) -> str:
        normalized = value.strip().upper()
        if len(normalized) < 5:
            raise ValueError("Invalid VIN format")
        return normalized

    @field_validator("device_code")
    @classmethod
    def normalize_device_code(cls, value: str) -> str:
        return value.strip()


class VehicleLookupResponse(DealershipScope):
    vehicle: VehiclePairingSummary
    active_assignment: AssignmentSummary | None
    warnings: list[str] = Field(default_factory=list)


class DeviceLookupResponse(DealershipScope):
    device: ESLDevicePairingSummary
    active_assignment: AssignmentSummary | None
    warnings: list[str] = Field(default_factory=list)


class PairingResponse(DealershipScope):
    assignment_id: uuid.UUID
    status: Literal["paired", "reassigned"]
    vehicle: VehiclePairingSummary
    device: ESLDevicePairingSummary
    sync_event: SyncEventSummary
    assignment_source: str
    scan_type: str | None
    nfc_uid: str | None


class UnpairResponse(DealershipScope):
    assignment_id: uuid.UUID
    status: Literal["unpaired"]
    unassigned_at: datetime
    vehicle: VehiclePairingSummary
    device: ESLDevicePairingSummary
    sync_event: SyncEventSummary | None = None


class VinAssignmentResponse(DealershipScope):
    active_assignment: AssignmentSummary | None


class ActivePairingsResponse(DealershipScope):
    pairings: list[AssignmentSummary]


class PushLabelResponse(DealershipScope):
    vehicle_id: uuid.UUID
    sync_event: SyncEventSummary
