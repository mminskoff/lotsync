"""Dashboard preview renderer — PNG label mockup (not e-paper firmware output)."""

from __future__ import annotations

import base64
import io
import logging

from PIL import Image, ImageDraw, ImageFont

from app.adapters.rendering.base import RendererAdapter
from app.adapters.rendering.label_fonts import load_font
from app.adapters.rendering.make_badge import draw_make_badge
from app.schemas.label import DeviceProfile, LabelPayload, RenderedLabel

logger = logging.getLogger(__name__)

WHITE = 255
BLACK = 0
GRAY = 180


def _vehicle_title(payload: LabelPayload) -> str:
    parts = [payload.year, payload.make, payload.model]
    return " ".join(part for part in parts if part)


def _fit_text(
    draw: ImageDraw.ImageDraw,
    text: str,
    font_size: int,
    max_width: int,
    *,
    weight: str = "regular",
    min_size: int = 10,
) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    size = font_size
    while size >= min_size:
        font = load_font(size, weight=weight)
        bbox = draw.textbbox((0, 0), text, font=font)
        if bbox[2] - bbox[0] <= max_width:
            return font
        size -= 1
    return load_font(min_size, weight=weight)


class PreviewRenderer(RendererAdapter):
    """Renders a styled BW label PNG for dashboard preview and sales demos."""

    def render(self, payload: LabelPayload, device_profile: DeviceProfile) -> RenderedLabel:
        width = max(device_profile.width, 200)
        height = max(device_profile.height, 150)

        image = Image.new("L", (width, height), color=WHITE)
        draw = ImageDraw.Draw(image)

        margin = max(int(min(width, height) * 0.05), 8)
        inner_w = width - margin * 2

        badge_size = max(int(height * 0.14), 28)
        price_size = max(int(height * 0.22), 22)
        title_size = max(int(height * 0.09), 13)
        detail_size = max(int(height * 0.065), 10)
        fine_size = max(int(height * 0.045), 8)

        y = margin

        # Header: make logo badge + stock number
        badge_w, badge_h = draw_make_badge(
            draw, make=payload.make, x=margin, y=y, size=badge_size
        )
        _ = badge_w

        if payload.stock_number:
            stock_font = load_font(detail_size, weight="medium")
            stock_text = f"STOCK {payload.stock_number}"
            stock_bbox = draw.textbbox((0, 0), stock_text, font=stock_font)
            stock_w = stock_bbox[2] - stock_bbox[0]
            draw.text(
                (width - margin - stock_w, y + (badge_h - (stock_bbox[3] - stock_bbox[1])) // 2),
                stock_text,
                fill=GRAY,
                font=stock_font,
            )

        y += badge_h + max(int(height * 0.04), 6)

        # Price — large bold
        price_font = _fit_text(
            draw, payload.price, price_size, inner_w, weight="bold", min_size=16
        )
        draw.text((margin, y), payload.price, fill=BLACK, font=price_font)
        price_bbox = draw.textbbox((margin, y), payload.price, font=price_font)
        y = price_bbox[3] + max(int(height * 0.03), 4)

        # Vehicle title
        title = _vehicle_title(payload)
        if title:
            title_font = _fit_text(
                draw, title, title_size, inner_w, weight="medium", min_size=11
            )
            draw.text((margin, y), title, fill=BLACK, font=title_font)
            title_bbox = draw.textbbox((margin, y), title, font=title_font)
            y = title_bbox[3] + max(int(height * 0.02), 3)

        # Trim on its own line when present
        if payload.trim:
            trim_font = load_font(detail_size, weight="regular")
            draw.text((margin, y), payload.trim, fill=GRAY, font=trim_font)
            trim_bbox = draw.textbbox((margin, y), payload.trim, font=trim_font)
            y = trim_bbox[3] + max(int(height * 0.02), 3)

        # Mileage
        if payload.mileage:
            detail_font = load_font(detail_size, weight="regular")
            draw.text((margin, y), f"{payload.mileage} mi", fill=BLACK, font=detail_font)

        # Divider above footer
        footer_y = height - margin - max(int(height * 0.1), 24)
        draw.line([(margin, footer_y), (width - margin, footer_y)], fill=GRAY, width=1)

        fine_font = load_font(fine_size, weight="regular")
        if payload.disclaimer:
            disclaimer = payload.disclaimer
            max_chars = max(int(inner_w / (fine_size * 0.55)), 40)
            if len(disclaimer) > max_chars:
                disclaimer = disclaimer[: max_chars - 3] + "..."
            draw.text((margin, footer_y + 4), disclaimer, fill=GRAY, font=fine_font)

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
