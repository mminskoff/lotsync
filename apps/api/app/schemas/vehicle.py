import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class VehicleCreate(BaseModel):
    vin: str = Field(min_length=1)
    stock_number: str | None = None
    year: int | None = None
    make: str | None = None
    model: str | None = None
    trim: str | None = None
    mileage: int | None = None
    status: str | None = None
    source_price: Decimal | None = None
    displayed_price: Decimal | None = None
    website_verified_price: Decimal | None = None
    price_type: str | None = None
    source_type: str | None = None
    source_url: str | None = None
    vehicle_url: str | None = None
    image_url: str | None = None
    sync_status: str | None = None


class VehicleUpdate(BaseModel):
    stock_number: str | None = None
    year: int | None = None
    make: str | None = None
    model: str | None = None
    trim: str | None = None
    mileage: int | None = None
    status: str | None = None
    source_price: Decimal | None = None
    displayed_price: Decimal | None = None
    website_verified_price: Decimal | None = None
    price_type: str | None = None
    source_type: str | None = None
    source_url: str | None = None
    vehicle_url: str | None = None
    image_url: str | None = None
    price_verified: bool | None = None
    sync_status: str | None = None


class VehicleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    dealership_id: uuid.UUID
    vin: str
    stock_number: str | None
    year: int | None
    make: str | None
    model: str | None
    trim: str | None
    mileage: int | None
    status: str | None
    source_price: Decimal | None
    displayed_price: Decimal | None
    website_verified_price: Decimal | None
    price_type: str | None
    source_type: str | None
    source_url: str | None
    vehicle_url: str | None
    image_url: str | None
    price_verified: bool
    sync_status: str | None
    created_at: datetime
    updated_at: datetime
