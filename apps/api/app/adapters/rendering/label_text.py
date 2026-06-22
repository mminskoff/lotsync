from __future__ import annotations

from PIL import ImageDraw, ImageFont

from app.adapters.rendering.label_fonts import load_font
from app.schemas.label import LabelPayload

# LotSync label palette (dashboard preview — tri-color ESL simulation)
BG = (246, 244, 238)
BLACK = (26, 26, 26)
GRAY = (130, 130, 130)
LIGHT_GRAY = (175, 175, 175)
GREEN = (45, 110, 70)
RED = (185, 55, 50)
FADED = (195, 195, 195)


def template_tier(width: int) -> str:
    if width >= 360:
        return "large"
    if width >= 270:
        return "medium"
    return "small"


def split_model_trim(payload: LabelPayload) -> tuple[str | None, str | None]:
    if payload.trim:
        return payload.model, payload.trim
    if not payload.model:
        return None, None
    parts = payload.model.split()
    if len(parts) <= 1:
        return payload.model, None
    return parts[0], " ".join(parts[1:])


def vehicle_headline(payload: LabelPayload, *, include_year: bool = True) -> str:
    model, _ = split_model_trim(payload)
    parts: list[str] = []
    if include_year and payload.year:
        parts.append(payload.year)
    if payload.make:
        parts.append(payload.make.upper())
    if model:
        parts.append(model.upper())
    return " ".join(parts)


def vehicle_short_name(payload: LabelPayload) -> str:
    model, _ = split_model_trim(payload)
    parts: list[str] = []
    if payload.make:
        parts.append(payload.make.upper())
    if model:
        parts.append(model.upper())
    return " ".join(parts)


def status_label(payload: LabelPayload) -> tuple[str, tuple[int, int, int]]:
    status = (payload.status or "available").lower()
    if status == "sold":
        return "AVAILABLE", FADED
    if payload.previous_price:
        return "PRICE REDUCED", RED
    if status in ("available", "active"):
        return "AVAILABLE", GREEN
    return status.replace("_", " ").upper(), GRAY


def is_sold(payload: LabelPayload) -> bool:
    return (payload.status or "").lower() == "sold"


def is_price_reduced(payload: LabelPayload) -> bool:
    return bool(payload.previous_price) and not is_sold(payload)


def fit_text(
    draw: ImageDraw.ImageDraw,
    text: str,
    font_size: int,
    max_width: int,
    *,
    weight: str = "regular",
    min_size: int = 8,
) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    size = font_size
    while size >= min_size:
        font = load_font(size, weight=weight)
        bbox = draw.textbbox((0, 0), text, font=font)
        if bbox[2] - bbox[0] <= max_width:
            return font
        size -= 1
    return load_font(min_size, weight=weight)


def draw_status_dot(
    draw: ImageDraw.ImageDraw,
    x: int,
    y: int,
    radius: int,
    color: tuple[int, int, int],
    *,
    outline_only: bool = False,
) -> None:
    if outline_only:
        draw.ellipse(
            [(x, y), (x + radius * 2, y + radius * 2)],
            outline=color,
            width=max(1, radius // 3),
        )
    else:
        draw.ellipse([(x, y), (x + radius * 2, y + radius * 2)], fill=color)


def draw_strikethrough_price(
    draw: ImageDraw.ImageDraw,
    x: int,
    y: int,
    text: str,
    font: ImageFont.FreeTypeFont | ImageFont.ImageFont,
    color: tuple[int, int, int],
) -> int:
    draw.text((x, y), text, fill=color, font=font)
    bbox = draw.textbbox((x, y), text, font=font)
    mid_y = (bbox[1] + bbox[3]) // 2
    draw.line([(bbox[0], mid_y), (bbox[2], mid_y)], fill=color, width=max(2, font.size // 12))
    return bbox[3]
