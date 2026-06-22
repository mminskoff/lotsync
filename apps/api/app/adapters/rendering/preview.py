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
GRAY = 160


def _vehicle_title(payload: LabelPayload) -> str:
    parts = [payload.year, payload.make, payload.model]
    title = " ".join(part for part in parts if part)
    if payload.trim and payload.trim not in (payload.model or ""):
        title = f"{title} {payload.trim}"
    return title


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


def _wrap_lines(
    draw: ImageDraw.ImageDraw,
    text: str,
    font: ImageFont.FreeTypeFont | ImageFont.ImageFont,
    max_width: int,
    *,
    max_lines: int = 2,
) -> list[str]:
    words = text.split()
    if not words:
        return []

    lines: list[str] = []
    current: list[str] = []

    for word in words:
        candidate = " ".join([*current, word])
        bbox = draw.textbbox((0, 0), candidate, font=font)
        if bbox[2] - bbox[0] <= max_width or not current:
            current.append(word)
        else:
            lines.append(" ".join(current))
            current = [word]
            if len(lines) >= max_lines:
                break

    if current and len(lines) < max_lines:
        lines.append(" ".join(current))

    if len(lines) == max_lines and len(words) > len(lines):
        last = lines[-1]
        while draw.textbbox((0, 0), f"{last}…", font=font)[2] > max_width and " " in last:
            last = last.rsplit(" ", 1)[0]
        lines[-1] = f"{last}…"

    return lines


def _draw_lines(
    draw: ImageDraw.ImageDraw,
    lines: list[str],
    *,
    x: int,
    y: int,
    font: ImageFont.FreeTypeFont | ImageFont.ImageFont,
    fill: int,
    line_gap: int,
) -> int:
    for line in lines:
        draw.text((x, y), line, fill=fill, font=font)
        bbox = draw.textbbox((x, y), line, font=font)
        y = bbox[3] + line_gap
    return y


class PreviewRenderer(RendererAdapter):
    """Renders a styled BW label PNG for dashboard preview and sales demos."""

    def render(self, payload: LabelPayload, device_profile: DeviceProfile) -> RenderedLabel:
        width = max(device_profile.width, 200)
        height = max(device_profile.height, 150)

        image = Image.new("L", (width, height), color=WHITE)
        draw = ImageDraw.Draw(image)

        margin = max(int(min(width, height) * 0.06), 12)
        inner_w = width - margin * 2

        badge_size = max(int(height * 0.16), 36)
        price_target = max(int(height * 0.34), 36)
        title_target = max(int(height * 0.12), 16)
        detail_size = max(int(height * 0.075), 13)
        fine_size = max(int(height * 0.048), 9)

        y = margin

        # Header: make badge + stock
        _, badge_h = draw_make_badge(
            draw, make=payload.make, x=margin, y=y, size=badge_size
        )

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

        y += badge_h + max(int(height * 0.05), 10)

        # Hero price
        price_font = _fit_text(
            draw, payload.price, price_target, inner_w, weight="bold", min_size=28
        )
        draw.text((margin, y), payload.price, fill=BLACK, font=price_font)
        price_bbox = draw.textbbox((margin, y), payload.price, font=price_font)
        y = price_bbox[3] + max(int(height * 0.04), 8)

        # Vehicle title — up to 2 lines, large
        title = _vehicle_title(payload)
        if title:
            title_font = _fit_text(
                draw, title, title_target, inner_w, weight="bold", min_size=14
            )
            title_lines = _wrap_lines(draw, title, title_font, inner_w, max_lines=2)
            y = _draw_lines(
                draw,
                title_lines,
                x=margin,
                y=y,
                font=title_font,
                fill=BLACK,
                line_gap=max(int(height * 0.015), 3),
            )
            y += max(int(height * 0.02), 4)

        # Mileage
        if payload.mileage:
            detail_font = load_font(detail_size, weight="medium")
            draw.text((margin, y), f"{payload.mileage} mi", fill=BLACK, font=detail_font)
            mileage_bbox = draw.textbbox((margin, y), f"{payload.mileage} mi", font=detail_font)
            y = mileage_bbox[3]

        # Footer
        footer_h = max(int(height * 0.11), 28)
        footer_y = height - margin - footer_h
        draw.line([(margin, footer_y), (width - margin, footer_y)], fill=GRAY, width=1)

        fine_font = load_font(fine_size, weight="regular")
        if payload.disclaimer:
            disclaimer = payload.disclaimer
            max_chars = max(int(inner_w / (fine_size * 0.5)), 50)
            if len(disclaimer) > max_chars:
                disclaimer = disclaimer[: max_chars - 3] + "..."
            draw.text((margin, footer_y + 6), disclaimer, fill=GRAY, font=fine_font)

        draw.rectangle([(0, 0), (width - 1, height - 1)], outline=BLACK, width=3)

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
