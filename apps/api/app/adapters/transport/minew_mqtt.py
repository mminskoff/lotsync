"""Minew ESL transport — MQTT downlink via MinewMqttClient."""

from __future__ import annotations

import base64
import json
import logging

from app.adapters.transport.base import TransportAdapter
from app.adapters.transport.minew_jengine import (
    build_command_02_data,
    build_jengine_image_set_req,
    encode_image_data_b64,
    normalize_mac,
    resolve_tag_mac,
)
from app.adapters.transport.minew_mqtt_client import (
    build_action_topic,
    build_command_topic,
    get_minew_mqtt_client,
)
from app.core.config import settings
from app.schemas.label import RenderedLabel, TransportPushResult

logger = logging.getLogger(__name__)

MINEW_FORMAT_PREFIX = "minew_"


class MinewMqttTransport(TransportAdapter):
    """Publishes label updates to a Minew G1-E gateway via MQTT jengine (default) or dData."""

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

        config_error = _configuration_error()
        if config_error:
            logger.warning(
                "MinewMqttTransport not configured: %s (device_id=%s)",
                config_error,
                device_id,
            )
            return TransportPushResult(
                success=False,
                device_id=device_id,
                error=config_error,
            )

        tag_mac = resolve_tag_mac(
            device_id=device_id,
            metadata=metadata,
            fallback_tag_mac=settings.esl_tag_mac,
        )
        if not tag_mac:
            return TransportPushResult(
                success=False,
                device_id=device_id,
                error=(
                    "ESL tag device id required — set ESL_TAG_MAC, "
                    "esl_devices.provider_device_id, or metadata.tag_mac"
                ),
            )

        try:
            gateway_mac = normalize_mac(settings.gateway_mac)
            if not gateway_mac:
                raise ValueError("GATEWAY_MAC is not configured")
            pixel_bytes, width, height = _decode_rendered(rendered)
            client = get_minew_mqtt_client()
            client.connect()
            client.subscribe_status()
            result = client.publish_label_update(
                gateway_mac,
                tag_mac,
                pixel_bytes,
                width=width,
                height=height,
            )
            topic = str(result["topic"])
        except (OSError, ValueError) as exc:
            logger.exception("MinewMqttTransport publish failed for device_id=%s", device_id)
            return TransportPushResult(
                success=False,
                device_id=device_id,
                error=str(exc),
            )

        return TransportPushResult(
            success=True,
            device_id=device_id,
            provider_response={
                "adapter": "minew_mqtt",
                "downlink_format": settings.minew_mqtt_downlink_format,
                "topic": topic,
                "host": settings.mqtt_host.strip(),
                "tag_mac": tag_mac,
                "gateway_mac": gateway_mac,
                "byte_length": len(pixel_bytes),
                "req_id": result.get("req_id"),
                "seq": result.get("seq"),
            },
        )


def _configuration_error() -> str | None:
    if not settings.mqtt_host.strip():
        return "Minew MQTT not configured — set MQTT_HOST to the gateway/broker IP"
    if not normalize_mac(settings.gateway_mac) and not settings.minew_mqtt_topic.strip():
        return (
            "Minew MQTT not configured — set GATEWAY_MAC (for topic) "
            "or MINEW_MQTT_TOPIC explicitly"
        )
    if settings.minew_mqtt_downlink_format.strip().lower() == "jengine":
        if len(settings.minew_jengine_device_key.strip()) != 16:
            return (
                "Minew jengine not configured — set MINEW_JENGINE_DEVICE_KEY "
                "(16-character BLE device key from Minew)"
            )
    return None


def _decode_rendered(rendered: RenderedLabel) -> tuple[bytes, int, int]:
    body = rendered.payload
    data_b64 = body.get("data_b64")
    if not data_b64:
        raise ValueError("Rendered Minew payload missing data_b64")

    pixel_bytes = base64.b64decode(data_b64)
    width = int(rendered.width or body.get("width") or 0)
    height = int(rendered.height or body.get("height") or 0)
    if width <= 0 or height <= 0:
        raise ValueError("Rendered label missing width/height for Jengine command 02")
    return pixel_bytes, width, height


def build_mqtt_artifact(pixel_bytes: bytes, *, width: int, height: int, tag_mac: str) -> str:
    """Serialize the MQTT payload we intend to publish (for job artifacts / debugging)."""
    downlink = settings.minew_mqtt_downlink_format.strip().lower()
    if downlink == "ddata":
        return build_command_02_data(
            pixel_bytes,
            width=width,
            height=height,
            encoding=settings.minew_jengine_data_encoding,
        )
    image_b64 = encode_image_data_b64(pixel_bytes)
    command = build_jengine_image_set_req(
        tag_mac=tag_mac,
        image_data_b64=image_b64,
        req_id=1,
        opcode=1,
        img_id=1,
        device_key=settings.minew_jengine_device_key.strip() or "0000000000000000",
        single=settings.minew_jengine_single_firmware,
        screen=settings.minew_jengine_screen.strip().upper() or "A",
        compress=settings.minew_jengine_compress.strip().upper() or "NONE",
    )
    return json.dumps(command, indent=2)


def build_mqtt_topic(gateway_mac: str | None = None) -> str:
    mac = gateway_mac or settings.gateway_mac
    if settings.minew_mqtt_downlink_format.strip().lower() == "ddata":
        return build_command_topic(mac)
    return build_action_topic(mac)
