from pydantic import BaseModel, Field


class LabelPayload(BaseModel):
    """Provider-neutral label content produced by business logic."""

    vin: str = Field(min_length=1)
    stock_number: str | None = None
    price: str
    year: str | None = None
    make: str | None = None
    model: str | None = None
    trim: str | None = None
    mileage: str | None = None
    status: str = "available"
    qr_url: str | None = None
    disclaimer: str | None = None


class DeviceProfile(BaseModel):
    """Physical ESL capabilities used by renderers."""

    provider: str
    model: str
    width: int
    height: int
    color_mode: str = "BW"
    supports_nfc: bool = False
    supports_qr: bool = False


class RenderedLabel(BaseModel):
    """Output of a renderer adapter — opaque to business logic until transport."""

    format: str
    payload: dict | str
    width: int | None = None
    height: int | None = None


class TransportPushResult(BaseModel):
    """Result of pushing a rendered label to a gateway or provider."""

    success: bool
    device_id: str
    provider_response: dict | None = None
    error: str | None = None
