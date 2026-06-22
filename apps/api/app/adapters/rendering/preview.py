"""Dashboard preview renderer — PNG label mockup (not e-paper firmware output)."""

from __future__ import annotations

import base64
import io
import logging

from app.adapters.rendering.base import RendererAdapter
from app.adapters.rendering.label_layouts import render_label
from app.schemas.label import DeviceProfile, LabelPayload, RenderedLabel

logger = logging.getLogger(__name__)


class PreviewRenderer(RendererAdapter):
    """Renders ESL label mockups matching LotSync design templates."""

    def render(self, payload: LabelPayload, device_profile: DeviceProfile) -> RenderedLabel:
        width = max(device_profile.width, 200)
        height = max(device_profile.height, 120)

        image = render_label(payload, device_profile)
        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        png_b64 = base64.b64encode(buffer.getvalue()).decode("ascii")

        logger.info(
            "PreviewRenderer: vin=%s price=%s %dx%d",
            payload.vin,
            payload.price,
            width,
            height,
        )

        return RenderedLabel(
            format="png",
            payload=png_b64,
            width=width,
            height=height,
        )
