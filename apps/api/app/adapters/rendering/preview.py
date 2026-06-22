"""Dashboard preview renderer — PNG label mockup (not e-paper firmware output)."""

from __future__ import annotations

import base64
import io
import logging

from PIL import Image, ImageDraw, ImageFont

from app.adapters.rendering.base import RendererAdapter
from app.schemas.label import DeviceProfile, LabelPayload, RenderedLabel

logger = logging.getLogger(__name__)

WHITE = 255
BLACK = 0


def _load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for path in (
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ):
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def _vehicle_title(payload: LabelPayload) -> str:
    parts = [payload.year, payload.make, payload.model, payload.trim]
    return " ".join(part for part in parts if part)


class PreviewRenderer(RendererAdapter):
    """Renders a simple BW label PNG for dashboard preview and sales demos."""

    def render(self, payload: LabelPayload, device_profile: DeviceProfile) -> RenderedLabel:
        width = max(device_profile.width, 200)
        height = max(device_profile.height, 150)

        image = Image.new("L", (width, height), color=WHITE)
        draw = ImageDraw.Draw(image)

        price_font = _load_font(max(int(height * 0.18), 18))
        title_font = _load_font(max(int(height * 0.08), 12))
        detail_font = _load_font(max(int(height * 0.06), 10))
        fine_font = _load_font(max(int(height * 0.045), 8))

        margin = max(int(width * 0.05), 8)
        y = margin

        draw.text((margin, y), payload.price, fill=BLACK, font=price_font)
        y += int(height * 0.22)

        title = _vehicle_title(payload)
        if title:
            draw.text((margin, y), title, fill=BLACK, font=title_font)
            y += int(height * 0.12)

        if payload.mileage:
            draw.text((margin, y), f"{payload.mileage} mi", fill=BLACK, font=detail_font)
            y += int(height * 0.09)

        if payload.stock_number:
            draw.text((margin, y), f"Stock #{payload.stock_number}", fill=BLACK, font=detail_font)
            y += int(height * 0.09)

        draw.text((margin, y), payload.vin, fill=BLACK, font=fine_font)

        if payload.disclaimer:
            disclaimer = payload.disclaimer
            if len(disclaimer) > 80:
                disclaimer = disclaimer[:77] + "..."
            draw.text((margin, height - margin - int(height * 0.08)), disclaimer, fill=BLACK, font=fine_font)

        draw.rectangle([(0, 0), (width - 1, height - 1)], outline=BLACK, width=2)

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
