"""Minew ESL renderer — label layout to e-paper pixel bytes."""

from __future__ import annotations

import base64
import logging

from app.adapters.rendering.base import RendererAdapter
from app.adapters.rendering.label_layouts import render_label
from app.adapters.rendering.minew_pixel import encode_minew_pixels, infer_minew_color_mode
from app.schemas.label import DeviceProfile, LabelPayload, RenderedLabel

logger = logging.getLogger(__name__)


def resolve_minew_color_mode(profile: DeviceProfile) -> str:
    inferred = infer_minew_color_mode(profile.model)
    if inferred:
        return inferred
    mode = (profile.color_mode or "").upper()
    if mode in {"BWRY", "BWR", "E6", "6COLOR", "6-COLOR"}:
        return mode
    return "BWRY"


class MinewRenderer(RendererAdapter):
    """Renders LabelPayload into Minew-compatible pixel buffers."""

    def render(self, payload: LabelPayload, device_profile: DeviceProfile) -> RenderedLabel:
        color_mode = resolve_minew_color_mode(device_profile)
        width = device_profile.width
        height = device_profile.height

        image = render_label(payload, device_profile)
        if image.size != (width, height):
            image = image.resize((width, height))

        pixel_bytes = encode_minew_pixels(image, color_mode)
        encoding = color_mode.lower().replace("-", "")

        logger.info(
            "MinewRenderer: vin=%s price=%s mode=%s %dx%d bytes=%d",
            payload.vin,
            payload.price,
            color_mode,
            width,
            height,
            len(pixel_bytes),
        )

        return RenderedLabel(
            format=f"minew_{encoding}",
            payload={
                "encoding": encoding,
                "color_mode": color_mode,
                "data_b64": base64.b64encode(pixel_bytes).decode("ascii"),
                "byte_length": len(pixel_bytes),
                "device_id_hint": device_profile.model,
            },
            width=width,
            height=height,
        )
