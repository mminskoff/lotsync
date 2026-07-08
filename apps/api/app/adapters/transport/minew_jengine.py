"""Minew Jengine command envelopes for BLE (single) firmware.

Display refresh uses Jengine command 02. Commands 42, 102, 103 are also supported
on single firmware but 02 is the first target for full-image updates.

The MQTT gateway wraps the Jengine bytes in dData.data with dType=ascii (hex).
"""

from __future__ import annotations

import base64
import re

MAC_RE = re.compile(r"^[0-9A-F]{12}$")
MINEW_SCREEN_ID_RE = re.compile(r"^E[0-9A-F]{11}$")


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


def resolve_tag_mac(
    *,
    device_id: str,
    metadata: dict | None,
    provider_device_id: str | None = None,
    fallback_tag_mac: str | None = None,
) -> str | None:
    """Resolve ESL tag BLE MAC for MQTT downlink."""
    if metadata:
        for key in ("tag_mac", "ble_mac", "esl_mac", "mac"):
            mac = normalize_mac(metadata.get(key))
            if mac:
                return mac
        provider = metadata.get("provider_device_id")
        if isinstance(provider, str):
            mac = normalize_mac(provider)
            if mac:
                return mac

    mac = normalize_mac(provider_device_id)
    if mac:
        return mac

    mac = normalize_mac(fallback_tag_mac)
    if mac:
        return mac

    _ = device_id
    return None


def build_command_02_data(
    pixel_bytes: bytes,
    *,
    width: int,
    height: int,
    encoding: str = "command02_v1",
) -> str:
    """Build the MQTT dData.data field (ASCII hex unless noted)."""
    mode = encoding.strip().lower()
    if mode == "raw_hex":
        return pixel_bytes.hex().upper()
    if mode == "command02_v1":
        # Hypothesis: 0x02 + BE width/height + raw pixel buffer (single firmware).
        frame = bytearray([0x02])
        frame.extend(width.to_bytes(2, "big"))
        frame.extend(height.to_bytes(2, "big"))
        frame.extend(pixel_bytes)
        return frame.hex().upper()
    if mode == "base64":
        return base64.b64encode(pixel_bytes).decode("ascii")
    raise ValueError(f"Unsupported Minew Jengine data encoding: {encoding}")
