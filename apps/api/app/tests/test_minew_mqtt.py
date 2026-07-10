"""Tests for Minew MQTT downlink and Jengine envelopes."""

import base64
import json

import pytest

from app.adapters.rendering.minew import MinewRenderer
from app.adapters.transport.minew_jengine import (
    build_command_02_data,
    build_jengine_image_set_req,
    normalize_esl_mqtt_mac,
    normalize_jengine_mac,
    normalize_mac,
    resolve_tag_mac,
)
from app.adapters.transport.minew_mqtt import MinewMqttTransport, build_mqtt_topic
from app.adapters.transport.minew_mqtt_client import (
    build_action_topic,
    build_ddata_payload,
)
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


def test_normalize_mac_strips_separators():
    assert normalize_mac("FC:23:3F:C2:B7:C2") == "FC233FC2B7C2"


def test_normalize_jengine_mac_lowercases_screen_id():
    assert normalize_jengine_mac("E100000A1525") == "e100000a1525"


def test_resolve_tag_mac_from_metadata():
    mac = resolve_tag_mac(
        device_id="E100000A1525",
        metadata={"tag_mac": "AC233FA1B2C3"},
    )
    assert mac == "AC233FA1B2C3"


def test_resolve_tag_mac_accepts_screen_id_for_json_prepared():
    assert (
        resolve_tag_mac(
            device_id="E100000A1525",
            metadata={"provider_device_id": "E100000A1525"},
        )
        == "E100000A1525"
    )


def test_normalize_esl_mqtt_mac_accepts_screen_id():
    assert normalize_esl_mqtt_mac("e100000a1525") == "E100000A1525"


def test_build_command_02_data_prefixes_dimensions():
    pixels = bytes([0x55] * 8)
    encoded = build_command_02_data(pixels, width=400, height=300, encoding="command02_v1")
    assert encoded.startswith("020190012C")
    assert encoded.endswith(pixels.hex().upper())


def test_build_jengine_image_set_req_shape():
    payload = build_jengine_image_set_req(
        tag_mac="e100000a1525",
        image_data_b64="QUJD",
        req_id=123,
        opcode=45234,
        img_id=21433,
        device_key="1234567890123456",
    )
    assert payload["action"] == 2
    assert payload["method"] == "set_req"
    assert payload["payload"]["details"] == {"e100000a1525": {}}
    assert payload["payload"]["images"][0]["compress"] == "NONE"


def test_build_action_topic_default(monkeypatch):
    monkeypatch.setattr(settings, "gateway_mac", "AC233FC267C2")
    monkeypatch.setattr(settings, "minew_mqtt_topic", "")
    assert build_action_topic("AC233FC267C2") == "/gw/ac233fc267c2/action"


def test_build_ddata_payload_shape():
    payload = build_ddata_payload("AC233FA1B2C3", "AABB", seq=7)
    assert payload == {
        "msg": "dData",
        "mac": "AC233FA1B2C3",
        "seq": 7,
        "auth1": "00000000",
        "dType": "ascii",
        "data": "AABB",
    }


def test_build_mqtt_topic_jengine_default(monkeypatch):
    monkeypatch.setattr(settings, "gateway_mac", "AC233FC267C2")
    monkeypatch.setattr(settings, "minew_mqtt_topic", "")
    monkeypatch.setattr(settings, "minew_mqtt_downlink_format", "jengine")
    assert build_mqtt_topic() == "/gw/ac233fc267c2/action"


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


def test_minew_transport_requires_device_key_in_jengine_mode(monkeypatch):
    monkeypatch.setattr(settings, "mqtt_host", "192.168.1.100")
    monkeypatch.setattr(settings, "gateway_mac", "AC233FC267C2")
    monkeypatch.setattr(settings, "esl_tag_mac", "E100000A1525")
    monkeypatch.setattr(settings, "minew_mqtt_downlink_format", "jengine")
    monkeypatch.setattr(settings, "minew_jengine_device_key", "")

    transport = MinewMqttTransport()
    renderer = MinewRenderer()
    rendered = renderer.render(_sample_payload(), _bwry_profile())

    result = transport.push_label("E100000A1525", rendered)
    assert result.success is False
    assert "MINEW_JENGINE_DEVICE_KEY" in (result.error or "")


def test_minew_transport_publishes_jengine_envelope(monkeypatch):
    monkeypatch.setattr(settings, "mqtt_host", "192.168.1.100")
    monkeypatch.setattr(settings, "gateway_mac", "AC233FC267C2")
    monkeypatch.setattr(settings, "minew_mqtt_downlink_format", "jengine")
    monkeypatch.setattr(settings, "minew_jengine_device_key", "1234567890123456")

    captured: dict = {}

    class FakeClient:
        connected = True
        subscribed = True

        def connect(self) -> None:
            return None

        def subscribe_status(self, topic: str | None = None) -> str:
            return "#"

        def publish_label_update(self, gateway_mac, tag_mac, pixel_bytes, *, width, height, **kwargs):
            captured["gateway_mac"] = gateway_mac
            captured["tag_mac"] = tag_mac
            captured["pixel_len"] = len(pixel_bytes)
            captured["width"] = width
            captured["height"] = height
            return {
                "topic": "/gw/ac233fc267c2/action",
                "payload": {"action": 2},
                "req_id": 9,
            }

    monkeypatch.setattr(
        "app.adapters.transport.minew_mqtt.get_minew_mqtt_client",
        lambda: FakeClient(),
    )

    transport = MinewMqttTransport()
    renderer = MinewRenderer()
    rendered = renderer.render(_sample_payload(), _bwry_profile())
    result = transport.push_label(
        "E100000A1525",
        rendered,
        metadata={"provider_device_id": "E100000A1525"},
    )
    assert result.success is True
    assert captured["tag_mac"] == "E100000A1525"
    assert captured["width"] == 400
    assert captured["height"] == 300
    assert result.provider_response["req_id"] == 9
