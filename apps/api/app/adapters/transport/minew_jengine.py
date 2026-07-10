"""Minew Jengine envelopes for G1-E gateway MQTT downlink.

Official interface (Minew gateway docs v3.7+):
- Publish JSON jengine commands to `/gw/{gateway_mac}/action`
- Subscribe to `/gw/{gateway_mac}/response` for stage-1 acks
- Subscribe to `/gw/{gateway_mac}/status` for BLE adverts (JSON-PREPARSED uplink)

Image refresh for BLE (single) firmware uses jengine action 2 (`02 image`) with
`method: set_req`. Legacy `dData` on `Mqtt/GateWay/.../Command` is not used by
JSON-PREPARSED / grapes firmware gateways.
"""

from __future__ import annotations

import base64
import re
from typing import Any

MAC_RE = re.compile(r"^[0-9A-F]{12}$")
MINEW_SCREEN_ID_RE = re.compile(r"^E[0-9A-F]{11}$")

JENGINE_ACTION_IMAGE = 2


def normalize_mac(value: str | None) -> str | None:
    """Normalize BLE MAC to 12 uppercase hex chars (no separators)."""
    if not value:
        return None
    cleaned = value.strip().upper().replace(":", "").replace("-", "").replace(" ", "")
    if not MAC_RE.fullmatch(cleaned):
        return None
    if MINEW_SCREEN_ID_RE.fullmatch(cleaned):
        return None
    return cleaned


def normalize_esl_mqtt_mac(value: str | None) -> str | None:
    """Normalize ESL device id (BLE MAC or screen ID) to 12 uppercase hex chars."""
    if not value:
        return None
    cleaned = value.strip().upper().replace(":", "").replace("-", "").replace(" ", "")
    if MAC_RE.fullmatch(cleaned):
        return cleaned
    return None


def normalize_jengine_mac(value: str | None) -> str | None:
    """Normalize tag MAC for jengine payload.details keys (lowercase, no separators)."""
    mac = normalize_esl_mqtt_mac(value)
    if not mac:
        return None
    return mac.lower()


def resolve_tag_mac(
    *,
    device_id: str,
    metadata: dict | None,
    provider_device_id: str | None = None,
    fallback_tag_mac: str | None = None,
) -> str | None:
    """Resolve ESL tag device id for MQTT downlink."""
    if metadata:
        for key in ("tag_mac", "ble_mac", "esl_mac", "mac"):
            mac = normalize_mac(metadata.get(key))
            if mac:
                return mac
            mac = normalize_esl_mqtt_mac(metadata.get(key))
            if mac:
                return mac
        provider = metadata.get("provider_device_id")
        if isinstance(provider, str):
            mac = normalize_esl_mqtt_mac(provider)
            if mac:
                return mac

    mac = normalize_esl_mqtt_mac(provider_device_id)
    if mac:
        return mac

    mac = normalize_esl_mqtt_mac(fallback_tag_mac)
    if mac:
        return mac

    _ = device_id
    return None


def encode_image_data_b64(pixel_bytes: bytes, *, encoding: str = "base64") -> str:
    """Encode ESL pixel buffer for jengine `images.data` (compress=NONE)."""
    mode = encoding.strip().lower()
    if mode == "base64":
        return base64.b64encode(pixel_bytes).decode("ascii")
    raise ValueError(f"Unsupported jengine image data encoding: {encoding}")


def build_jengine_image_set_req(
    *,
    tag_mac: str,
    image_data_b64: str,
    req_id: int,
    opcode: int,
    img_id: int,
    device_key: str,
    single: bool = True,
    screen: str = "A",
    compress: str = "NONE",
    refresh: bool = True,
) -> dict[str, Any]:
    """Build jengine v1 command 02 (`action: 2`) set_req envelope."""
    tag_key = normalize_jengine_mac(tag_mac)
    if not tag_key:
        raise ValueError("Tag device id must be 12 hex characters")
    if not device_key or len(device_key) != 16:
        raise ValueError("MINEW_JENGINE_DEVICE_KEY must be a 16-character device key")
    if req_id <= 0:
        raise ValueError("req_id must be a positive integer")

    return {
        "action": JENGINE_ACTION_IMAGE,
        "version": 1,
        "method": "set_req",
        "req_id": req_id,
        "payload": {
            "key": device_key,
            "opcode": opcode,
            "single": single,
            "img_id": img_id,
            "images": [
                {
                    "data": image_data_b64,
                    "screen": [screen],
                    "compress": compress,
                    "refresh": refresh,
                }
            ],
            "details": {
                tag_key: {},
            },
        },
    }


def build_command_02_data(
    pixel_bytes: bytes,
    *,
    width: int,
    height: int,
    encoding: str = "command02_v1",
) -> str:
    """Legacy dData.data field (ASCII hex). Kept for `MINEW_MQTT_DOWNLINK_FORMAT=ddata`."""
    mode = encoding.strip().lower()
    if mode == "raw_hex":
        return pixel_bytes.hex().upper()
    if mode == "command02_v1":
        frame = bytearray([0x02])
        frame.extend(width.to_bytes(2, "big"))
        frame.extend(height.to_bytes(2, "big"))
        frame.extend(pixel_bytes)
        return frame.hex().upper()
    if mode == "base64":
        return base64.b64encode(pixel_bytes).decode("ascii")
    raise ValueError(f"Unsupported Minew Jengine data encoding: {encoding}")
