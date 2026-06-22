import uuid
from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.esl_device import ESLDevice
from app.models.vehicle import Vehicle
from app.schemas.label import DeviceProfile, LabelPayload

DEFAULT_SCREEN_WIDTH = 400
DEFAULT_SCREEN_HEIGHT = 300
DEFAULT_COLOR_MODE = "BW"
DEFAULT_DISCLAIMER = "Price plus tax, title, and doc fee. See dealer for details."


def format_price(value: Decimal | None) -> str:
    if value is None:
        return "Call for price"
    quantized = value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    if quantized == quantized.to_integral_value():
        return f"${int(quantized):,}"
    return f"${quantized:,.2f}"


def format_mileage(value: int | None) -> str | None:
    if value is None:
        return None
    return f"{value:,}"


def _display_price(vehicle: Vehicle) -> Decimal | None:
    return vehicle.displayed_price or vehicle.source_price or vehicle.website_verified_price


def _previous_price(vehicle: Vehicle) -> str | None:
    current = vehicle.displayed_price or vehicle.source_price
    if (
        vehicle.source_price is not None
        and current is not None
        and vehicle.source_price > current
    ):
        return format_price(vehicle.source_price)
    return None


def _specs_line(vehicle: Vehicle) -> str | None:
    parts: list[str] = []
    if vehicle.mileage is not None:
        parts.append(f"{format_mileage(vehicle.mileage)} mi")
    return " · ".join(parts) if parts else None


def build_label_payload(
    vehicle: Vehicle,
    *,
    disclaimer: str | None = None,
    template_config: dict | None = None,
) -> LabelPayload:
    config = template_config or {}
    resolved_disclaimer = disclaimer or config.get("disclaimer") or DEFAULT_DISCLAIMER

    return LabelPayload(
        vin=vehicle.vin,
        stock_number=vehicle.stock_number,
        price=format_price(_display_price(vehicle)),
        year=str(vehicle.year) if vehicle.year is not None else None,
        make=vehicle.make,
        model=vehicle.model,
        trim=vehicle.trim,
        mileage=format_mileage(vehicle.mileage),
        status=(vehicle.status or "available").lower(),
        qr_url=vehicle.vehicle_url,
        disclaimer=resolved_disclaimer,
        previous_price=_previous_price(vehicle),
        specs_line=_specs_line(vehicle),
    )


def build_device_profile(
    device: ESLDevice,
    *,
    template_config: dict | None = None,
) -> DeviceProfile:
    config = template_config or {}
    width = device.screen_width or config.get("width") or DEFAULT_SCREEN_WIDTH
    height = device.screen_height or config.get("height") or DEFAULT_SCREEN_HEIGHT

    return DeviceProfile(
        provider=device.provider or config.get("provider") or "stub",
        model=device.model or device.device_id,
        width=int(width),
        height=int(height),
        color_mode=config.get("color_mode") or DEFAULT_COLOR_MODE,
        supports_nfc=bool(config.get("supports_nfc", False)),
        supports_qr=bool(config.get("supports_qr", True)),
    )


def build_sync_label(
    vehicle: Vehicle,
    device: ESLDevice,
    *,
    template_config: dict | None = None,
) -> tuple[LabelPayload, DeviceProfile]:
    if vehicle.dealership_id != device.dealership_id:
        raise ValueError("Vehicle and ESL device must belong to the same dealership")
    return (
        build_label_payload(vehicle, template_config=template_config),
        build_device_profile(device, template_config=template_config),
    )


def get_vehicle(db: Session, dealership_id: uuid.UUID, vehicle_id: uuid.UUID) -> Vehicle:
    vehicle = db.get(Vehicle, vehicle_id)
    if vehicle is None or vehicle.dealership_id != dealership_id:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle


def get_esl_device(db: Session, dealership_id: uuid.UUID, esl_device_id: uuid.UUID) -> ESLDevice:
    device = db.get(ESLDevice, esl_device_id)
    if device is None or device.dealership_id != dealership_id:
        raise HTTPException(status_code=404, detail="ESL device not found")
    return device


def build_sync_label_for_ids(
    db: Session,
    dealership_id: uuid.UUID,
    vehicle_id: uuid.UUID,
    esl_device_id: uuid.UUID,
    *,
    template_config: dict | None = None,
) -> tuple[LabelPayload, DeviceProfile]:
    vehicle = get_vehicle(db, dealership_id, vehicle_id)
    device = get_esl_device(db, dealership_id, esl_device_id)
    try:
        return build_sync_label(vehicle, device, template_config=template_config)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
