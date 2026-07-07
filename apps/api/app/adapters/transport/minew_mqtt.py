"""Minew ESL transport — MQTT publish skeleton (topic/payload from Minew integration docs)."""

from __future__ import annotations

import json
import logging
import socket

from app.adapters.transport.base import TransportAdapter
from app.core.config import settings
from app.schemas.label import RenderedLabel, TransportPushResult

logger = logging.getLogger(__name__)

MINEW_FORMAT_PREFIX = "minew_"


class MinewMqttTransport(TransportAdapter):
    """Publishes rendered pixel data to a Minew-configured MQTT broker.

    Requires MINEW_MQTT_HOST and MINEW_MQTT_TOPIC once Minew supplies the protocol.
    """

    def push_label(
        self,
        device_id: str,
        rendered: RenderedLabel,
        metadata: dict | None = None,
    ) -> TransportPushResult:
        if not rendered.format.startswith(MINEW_FORMAT_PREFIX):
            return TransportPushResult(
                success=False,
                device_id=device_id,
                error=f"MinewMqttTransport expected minew_* format, got {rendered.format}",
            )

        if not isinstance(rendered.payload, dict):
            return TransportPushResult(
                success=False,
                device_id=device_id,
                error="Minew rendered payload must be a dict with data_b64",
            )

        host = settings.minew_mqtt_host.strip()
        topic = settings.minew_mqtt_topic.strip()
        if not host or not topic:
            byte_length = rendered.payload.get("byte_length", "?")
            logger.warning(
                "MinewMqttTransport not configured (set MINEW_MQTT_HOST + MINEW_MQTT_TOPIC). "
                "Would push %s bytes to device_id=%s encoding=%s",
                byte_length,
                device_id,
                rendered.payload.get("encoding"),
            )
            return TransportPushResult(
                success=False,
                device_id=device_id,
                error=(
                    "Minew MQTT not configured — set MINEW_MQTT_HOST and MINEW_MQTT_TOPIC "
                    "when Minew provides the integration example"
                ),
            )

        message = _build_message(device_id, rendered, metadata)
        try:
            _publish_mqtt(host, topic, message)
        except OSError as exc:
            logger.exception("MinewMqttTransport publish failed for device_id=%s", device_id)
            return TransportPushResult(
                success=False,
                device_id=device_id,
                error=f"MQTT publish failed: {exc}",
            )

        return TransportPushResult(
            success=True,
            device_id=device_id,
            provider_response={
                "adapter": "minew_mqtt",
                "topic": topic,
                "host": host,
                "byte_length": rendered.payload.get("byte_length"),
                "jengine_command": settings.minew_jengine_command,
            },
        )


def _build_message(
    device_id: str,
    rendered: RenderedLabel,
    metadata: dict | None,
) -> dict:
    """Placeholder structure until Minew documents the exact Jengine envelope."""
    body = rendered.payload if isinstance(rendered.payload, dict) else {}
    return {
        "command": settings.minew_jengine_command,
        "device_id": device_id,
        "encoding": body.get("encoding"),
        "color_mode": body.get("color_mode"),
        "width": rendered.width,
        "height": rendered.height,
        "data_b64": body.get("data_b64"),
        "metadata": metadata or {},
    }


def _publish_mqtt(host: str, topic: str, message: dict) -> None:
    """Minimal MQTT 3.1.1 PUBLISH without external dependencies.

    Sufficient for local broker smoke tests once topic/payload are confirmed.
    """
    payload = json.dumps(message, separators=(",", ":")).encode("utf-8")
    port = settings.minew_mqtt_port
    client_id = settings.minew_mqtt_client_id or "lotsync-transport"

    packet = _mqtt_connect_packet(client_id)
    packet += _mqtt_publish_packet(topic, payload)

    with socket.create_connection((host, port), timeout=settings.minew_mqtt_timeout_seconds) as sock:
        sock.settimeout(settings.minew_mqtt_timeout_seconds)
        sock.sendall(packet)
        sock.recv(4)


def _mqtt_connect_packet(client_id: str) -> bytes:
    proto = b"MQTT"
    proto_level = 4
    connect_flags = 0x02
    keepalive = 60
    client_id_bytes = client_id.encode("utf-8")

    variable = (
        len(proto).to_bytes(2, "big")
        + proto
        + bytes([proto_level, connect_flags])
        + keepalive.to_bytes(2, "big")
        + len(client_id_bytes).to_bytes(2, "big")
        + client_id_bytes
    )
    return _mqtt_packet(0x10, variable)


def _mqtt_publish_packet(topic: str, payload: bytes) -> bytes:
    topic_bytes = topic.encode("utf-8")
    variable = len(topic_bytes).to_bytes(2, "big") + topic_bytes + payload
    return _mqtt_packet(0x30, variable)


def _mqtt_packet(packet_type: int, variable: bytes) -> bytes:
    return bytes([packet_type]) + _encode_remaining_length(len(variable)) + variable


def _encode_remaining_length(length: int) -> bytes:
    out = bytearray()
    while True:
        digit = length % 128
        length //= 128
        if length > 0:
            digit |= 0x80
        out.append(digit)
        if length == 0:
            break
    return bytes(out)
