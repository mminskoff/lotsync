"""Tests for Minew pixel encoders and adapters."""

import base64

import pytest
from PIL import Image

from app.adapters.rendering.minew import MinewRenderer
from app.adapters.rendering.minew_pixel import (
    BWRY_BLACK,
    BWRY_RED,
    BWRY_WHITE,
    BWRY_YELLOW,
    encode_bwry,
    encode_minew_pixels,
    expected_byte_length,
    orient_image_for_panel,
)
from app.adapters.transport.minew_mqtt import MinewMqttTransport
from app.core.config import settings
from app.schemas.label import DeviceProfile, LabelPayload


def _sample_payload() -> LabelPayload:
    return LabelPayload(
        vin="1C4RJXP68SW601101",
        stock_number="4259T",
        price="$32,500",
        year="2025",
        make="Jeep",
        model="Wrangler",
        status="available",
    )


def _bwry_profile() -> DeviceProfile:
    return DeviceProfile(
        provider="minew",
        model="4.2-BWRY",
        width=400,
        height=300,
        color_mode="BWRY",
    )


def test_bwry_expected_byte_length():
    assert expected_byte_length(400, 300, "BWRY") == 30_000


def test_bwry_encodes_four_pixel_column():
    image = Image.new("RGB", (1, 4))
    pixels = image.load()
    assert pixels is not None
    pixels[0, 0] = BWRY_BLACK
    pixels[0, 1] = BWRY_WHITE
    pixels[0, 2] = BWRY_RED
    pixels[0, 3] = BWRY_YELLOW

    encoded = encode_bwry(image)
    assert encoded == bytes([0x1E])


def test_orient_panel_flip_after_rotation():
    image = Image.new("RGB", (400, 300), BWRY_WHITE)
    pixels = image.load()
    assert pixels is not None
    pixels[50, 40] = BWRY_BLACK
    plain = orient_image_for_panel(image, -90)
    flipped = orient_image_for_panel(image, -90, flip_horizontal=True)
    assert plain.size == flipped.size == (300, 400)
    assert plain != flipped


def test_bwry_oriented_same_byte_length():
    image = Image.new("RGB", (400, 300), BWRY_WHITE)
    assert len(encode_minew_pixels(image, "BWRY", rotation=0)) == 30_000
    assert len(encode_minew_pixels(image, "BWRY", rotation=90)) == 30_000


def test_bwry_solid_white_tile():
    image = Image.new("RGB", (4, 4), BWRY_WHITE)
    encoded = encode_bwry(image)
    assert encoded == bytes([0x55] * 4)


def test_minew_renderer_outputs_pixel_buffer():
    renderer = MinewRenderer()
    rendered = renderer.render(_sample_payload(), _bwry_profile())

    assert rendered.format == "minew_bwry"
    assert isinstance(rendered.payload, dict)
    assert rendered.payload["byte_length"] == 30_000
    raw = base64.b64decode(rendered.payload["data_b64"])
    assert len(raw) == 30_000


def test_minew_transport_unconfigured_returns_clear_error(monkeypatch):
    monkeypatch.setattr(settings, "mqtt_host", "")
    monkeypatch.setattr(settings, "gateway_mac", "")
    monkeypatch.setattr(settings, "minew_mqtt_topic", "")
    transport = MinewMqttTransport()
    renderer = MinewRenderer()
    rendered = renderer.render(_sample_payload(), _bwry_profile())

    result = transport.push_label("E100000A1525", rendered)
    assert result.success is False
    assert "MQTT_HOST" in (result.error or "")


def test_encode_minew_pixels_rejects_unknown_mode():
    image = Image.new("RGB", (4, 4), BWRY_WHITE)
    with pytest.raises(ValueError, match="Unsupported"):
        encode_minew_pixels(image, "RGB")


@pytest.mark.parametrize(
    ("width", "height", "color_mode", "expected"),
    [
        (400, 300, "BWRY", 30_000),
        (384, 184, "BWRY", 17_664),
        (296, 128, "BWRY", 9_472),
        (250, 122, "BWRY", 7_750),
        (800, 480, "E6", 192_000),
    ],
)
def test_kit_expected_byte_lengths(width, height, color_mode, expected):
    assert expected_byte_length(width, height, color_mode) == expected


@pytest.mark.parametrize(
    ("model", "width", "height", "expected_bytes"),
    [
        ("4.2-BWRY", 400, 300, 30_000),
        ("3.5-BWRY", 384, 184, 17_664),
        ("2.9-BWRY", 296, 128, 9_472),
        ("2.13-BWRY", 250, 122, 7_750),
        ("7.3-E6", 800, 480, 192_000),
    ],
)
def test_kit_renderer_byte_lengths(model, width, height, expected_bytes):
    renderer = MinewRenderer()
    profile = DeviceProfile(
        provider="minew",
        model=model,
        width=width,
        height=height,
        color_mode="BWRY" if "BWRY" in model else "E6",
    )
    rendered = renderer.render(_sample_payload(), profile)
    assert rendered.payload["byte_length"] == expected_bytes
