"""Tests for M8 Phase 1 — label schemas and stub render/transport adapters."""

import pytest

from app.adapters.rendering import get_renderer_adapter
from app.adapters.transport import get_transport_adapter
from app.schemas.label import DeviceProfile, LabelPayload


def _sample_payload() -> LabelPayload:
    return LabelPayload(
        vin="1HGBH41JXMN109186",
        stock_number="4259T",
        price="$28,950",
        year="2023",
        make="Honda",
        model="Accord",
        trim="Sport",
        mileage="1,200",
        status="available",
    )


def _sample_profile() -> DeviceProfile:
    return DeviceProfile(
        provider="stub",
        model="ESL-4.2-BW",
        width=400,
        height=300,
        color_mode="BW",
        supports_nfc=True,
        supports_qr=True,
    )


def test_label_payload_fields():
    payload = _sample_payload()
    assert payload.vin == "1HGBH41JXMN109186"
    assert payload.price == "$28,950"


def test_stub_renderer_returns_json_stub():
    renderer = get_renderer_adapter("stub")
    rendered = renderer.render(_sample_payload(), _sample_profile())

    assert rendered.format == "json_stub"
    assert rendered.payload["vin"] == "1HGBH41JXMN109186"
    assert rendered.payload["price"] == "$28,950"
    assert rendered.payload["device"]["width"] == 400
    assert rendered.width == 400
    assert rendered.height == 300


def test_stub_transport_push_succeeds():
    renderer = get_renderer_adapter("stub")
    transport = get_transport_adapter("stub")
    rendered = renderer.render(_sample_payload(), _sample_profile())

    result = transport.push_label("ESL-001", rendered, metadata={"sync_event_id": "test"})

    assert result.success is True
    assert result.device_id == "ESL-001"
    assert result.provider_response["adapter"] == "stub"
    assert result.error is None


def test_end_to_end_stub_pipeline():
    renderer = get_renderer_adapter()
    transport = get_transport_adapter()
    rendered = renderer.render(_sample_payload(), _sample_profile())
    result = transport.push_label("ESL-002", rendered)

    assert result.success is True


def test_unknown_renderer_raises():
    with pytest.raises(ValueError, match="Unsupported renderer"):
        get_renderer_adapter("minew")


def test_preview_renderer_registered():
    renderer = get_renderer_adapter("preview")
    rendered = renderer.render(_sample_payload(), _sample_profile())
    assert rendered.format == "png"


def test_unknown_transport_raises():
    with pytest.raises(ValueError, match="Unsupported transport"):
        get_transport_adapter("minew")
