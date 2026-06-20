"""Tests for M8 Phase 2 — label payload generation from vehicle + ESL device."""

import uuid
from decimal import Decimal

import pytest

from app.models.esl_device import ESLDevice
from app.models.vehicle import Vehicle
from app.services.label_payload_service import (
    build_device_profile,
    build_label_payload,
    build_sync_label,
    format_mileage,
    format_price,
)


def _vehicle(**overrides) -> Vehicle:
    defaults = {
        "id": uuid.uuid4(),
        "dealership_id": uuid.uuid4(),
        "vin": "1HGBH41JXMN109186",
        "stock_number": "4259T",
        "year": 2023,
        "make": "Honda",
        "model": "Accord",
        "trim": "Sport",
        "mileage": 1200,
        "status": "available",
        "displayed_price": Decimal("28950.00"),
        "vehicle_url": "https://dealer.example.com/inventory/accord",
        "price_verified": False,
    }
    defaults.update(overrides)
    return Vehicle(**defaults)


def _device(**overrides) -> ESLDevice:
    defaults = {
        "id": uuid.uuid4(),
        "dealership_id": uuid.uuid4(),
        "device_id": "ESL-001",
        "provider": "stub",
        "model": "ESL-4.2-BW",
        "screen_width": 400,
        "screen_height": 300,
    }
    defaults.update(overrides)
    return ESLDevice(**defaults)


def test_format_price_whole_dollars():
    assert format_price(Decimal("28950.00")) == "$28,950"


def test_format_price_with_cents():
    assert format_price(Decimal("28950.50")) == "$28,950.50"


def test_format_price_missing():
    assert format_price(None) == "Call for price"


def test_format_mileage():
    assert format_mileage(1200) == "1,200"
    assert format_mileage(None) is None


def test_build_label_payload_from_vehicle():
    payload = build_label_payload(_vehicle())

    assert payload.vin == "1HGBH41JXMN109186"
    assert payload.price == "$28,950"
    assert payload.year == "2023"
    assert payload.make == "Honda"
    assert payload.mileage == "1,200"
    assert payload.qr_url == "https://dealer.example.com/inventory/accord"
    assert payload.disclaimer is not None


def test_build_label_payload_uses_source_price_fallback():
    vehicle = _vehicle(displayed_price=None, source_price=Decimal("31000"))
    payload = build_label_payload(vehicle)
    assert payload.price == "$31,000"


def test_build_label_payload_custom_disclaimer_from_template():
    vehicle = _vehicle()
    payload = build_label_payload(
        vehicle,
        template_config={"disclaimer": "Plus tax and fees."},
    )
    assert payload.disclaimer == "Plus tax and fees."


def test_build_device_profile_from_device():
    profile = build_device_profile(_device())

    assert profile.provider == "stub"
    assert profile.model == "ESL-4.2-BW"
    assert profile.width == 400
    assert profile.height == 300
    assert profile.color_mode == "BW"


def test_build_device_profile_defaults_when_dimensions_missing():
    device = _device(screen_width=None, screen_height=None, model=None)
    profile = build_device_profile(device)

    assert profile.width == 400
    assert profile.height == 300
    assert profile.model == "ESL-001"


def test_build_sync_label_combined():
    dealership_id = uuid.uuid4()
    vehicle = _vehicle(dealership_id=dealership_id)
    device = _device(dealership_id=dealership_id)

    payload, profile = build_sync_label(vehicle, device)

    assert payload.vin == vehicle.vin
    assert profile.model == "ESL-4.2-BW"


def test_build_sync_label_rejects_cross_dealership():
    vehicle = _vehicle(dealership_id=uuid.uuid4())
    device = _device(dealership_id=uuid.uuid4())

    with pytest.raises(ValueError, match="same dealership"):
        build_sync_label(vehicle, device)


def test_build_sync_label_feeds_stub_pipeline():
    from app.adapters.rendering import get_renderer_adapter
    from app.adapters.transport import get_transport_adapter

    dealership_id = uuid.uuid4()
    vehicle = _vehicle(dealership_id=dealership_id)
    device = _device(dealership_id=dealership_id)
    payload, profile = build_sync_label(vehicle, device)

    rendered = get_renderer_adapter("stub").render(payload, profile)
    result = get_transport_adapter("stub").push_label(device.device_id, rendered)

    assert rendered.payload["vin"] == vehicle.vin
    assert result.success is True
    assert result.device_id == "ESL-001"
