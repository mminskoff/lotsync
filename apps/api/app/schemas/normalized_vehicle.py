import uuid
from decimal import Decimal

from pydantic import BaseModel, Field


class NormalizedVehicle(BaseModel):
    """Source-agnostic vehicle record returned by every inventory adapter."""

    vin: str = Field(min_length=1)
    stock_number: str | None = None
    year: int | None = None
    make: str | None = None
    model: str | None = None
    trim: str | None = None
    mileage: int | None = None
    price: Decimal | None = None
    price_type: str = "internet_price"
    status: str = "available"
    dealership_id: uuid.UUID
    exterior_color: str | None = None
    interior_color: str | None = None
    body_style: str | None = None
    fuel_type: str | None = None
    transmission: str | None = None
    photos: list[str] = Field(default_factory=list)
    source_type: str | None = None
    vehicle_url: str | None = None
