"""Tests for Minew MQTT downlink and Jengine envelopes."""

import base64

import pytest

from app.adapters.rendering.minew import MinewRenderer
from app.adapters.transport.minew_jengine import (
    build_command_02_data,
    normalize_mac,
    resolve_tag_mac,
)
from app.adapters.transport.minew_mqtt import MinewMqttTransport, build_mqtt_topic
from app.adapters.transport.minew_mqtt_client import (
    MinewMqttClient,
    build_command_topic,
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


def test_resolve_tag_mac_from_metadata():
    mac = resolve_tag_mac(
        device_id="E100000A1525",
        metadata={"tag_mac": "AC233FA1B2C3"},
    )
    assert mac == "AC233FA1B2C3"


def test_resolve_tag_mac_rejects_device_id():
    assert (
        resolve_tag_mac(
            device_id="E100000A1525",
            metadata={"provider_device_id": "E100000A1525"},
        )
        is None
    )


def test_build_command_02_data_prefixes_dimensions():
    pixels = bytes([0x55] * 8)
    encoded = build_command_02_data(pixels, width=400, height=300, encoding="command02_v1")
    assert encoded.startswith("020190012C")  # 02 + 400 + 300 + pixels
    assert encoded.endswith(pixels.hex().upper())


def test_build_command_topic_from_prefix(monkeypatch):
    monkeypatch.setattr(settings, "gateway_mac", "FC233FC2B7C2")
    monkeypatch.setattr(settings, "minew_mqtt_topic", "")
    monkeypatch.setattr(settings, "minew_mqtt_topic_prefix", "Mqtt/GateWay")
    monkeypatch.setattr(settings, "minew_mqtt_topic_suffix", "Command")
    assert build_command_topic("FC233FC2B7C2") == "Mqtt/GateWay/FC233FC2B7C2/Command"


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


def test_build_mqtt_topic_from_gateway_mac(monkeypatch):
    monkeypatch.setattr(settings, "gateway_mac", "FC233FC2B7C2")
    monkeypatch.setattr(settings, "minew_mqtt_topic", "")
    assert build_mqtt_topic() == "Mqtt/GateWay/FC233FC2B7C2/Command"


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


def test_minew_transport_requires_tag_mac(monkeypatch):
    monkeypatch.setattr(settings, "mqtt_host", "192.168.1.100")
    monkeypatch.setattr(settings, "gateway_mac", "FC233FC2B7C2")
    monkeypatch.setattr(settings, "esl_tag_mac", "")
    monkeypatch.setattr(settings, "minew_mqtt_topic", "")

    transport = MinewMqttTransport()
    renderer = MinewRenderer()
    rendered = renderer.render(_sample_payload(), _bwry_profile())

    result = transport.push_label("E100000A1525", rendered)
    assert result.success is False
    assert "BLE MAC" in (result.error or "")


def test_minew_transport_uses_esl_tag_mac_fallback(monkeypatch):
    monkeypatch.setattr(settings, "mqtt_host", "192.168.1.100")
    monkeypatch.setattr(settings, "gateway_mac", "FC233FC2B7C2")
    monkeypatch.setattr(settings, "esl_tag_mac", "AC233FA1B2C3")
    monkeypatch.setattr(settings, "minew_mqtt_topic", "")

    class FakeClient:
        connected = True
        subscribed = True

        def connect(self) -> None:
            return None

        def subscribe_status(self, topic: str | None = None) -> str:
            return "#"

        def publish_display_update(self, gateway_mac, tag_mac, encoded_data, *, seq=None):
            return {
                "topic": f"Mqtt/GateWay/{gateway_mac}/Command",
                "payload": {"mac": tag_mac, "data": encoded_data},
                "seq": seq or 1,
            }

    monkeypatch.setattr(
        "app.adapters.transport.minew_mqtt.get_minew_mqtt_client",
        lambda: FakeClient(),
    )

    transport = MinewMqttTransport()
    renderer = MinewRenderer()
    rendered = renderer.render(_sample_payload(), _bwry_profile())

    result = transport.push_label("E100000A1525", rendered)
    assert result.success is True
    assert result.provider_response["tag_mac"] == "AC233FA1B2C3"


def test_minew_transport_builds_ddata_envelope(monkeypatch):
    monkeypatch.setattr(settings, "mqtt_host", "192.168.1.100")
    monkeypatch.setattr(settings, "gateway_mac", "FC233FC2B7C2")
    monkeypatch.setattr(settings, "minew_mqtt_topic", "")

    captured: dict = {}

    class FakeClient:
        connected = True
        subscribed = True

        def connect(self) -> None:
            return None

        def subscribe_status(self, topic: str | None = None) -> str:
            return "#"

        def publish_display_update(self, gateway_mac, tag_mac, encoded_data, *, seq=None):
            captured["gateway_mac"] = gateway_mac
            captured["tag_mac"] = tag_mac
            captured["encoded_data"] = encoded_data
            return {
                "topic": "Mqtt/GateWay/FC233FC2B7C2/Command",
                "payload": {"mac": tag_mac, "data": encoded_data},
                "seq": 3,
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
        metadata={"tag_mac": "AC233FA1B2C3"},
    )

    assert result.success is True
    assert captured["tag_mac"] == "AC233FA1B2C3"
    assert captured["encoded_data"].startswith("020190012C")
    assert result.provider_response["seq"] == 3
