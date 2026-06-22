"""ESL label layouts — large (4.2"), medium (2.9"), small (2.13")."""

from __future__ import annotations

from PIL import Image, ImageDraw

from app.adapters.rendering.label_fonts import load_font
from app.adapters.rendering.label_qr import make_qr_image
from app.adapters.rendering.label_text import (
    BG,
    BLACK,
    FADED,
    GRAY,
    GREEN,
    LIGHT_GRAY,
    RED,
    draw_status_dot,
    draw_strikethrough_price,
    fit_text,
    is_price_reduced,
    is_sold,
    split_model_trim,
    status_label,
    template_tier,
    vehicle_headline,
    vehicle_short_name,
)
from app.schemas.label import DeviceProfile, LabelPayload

# Large-tag layout tuned to 400×300 design mockup (scaled proportionally)
LARGE_DIVIDER_Y_RATIO = 0.70
LARGE_QR_SIZE_RATIO = 0.24
LARGE_PRICE_SIZE_RATIO = 0.175
LARGE_TITLE_SIZE_RATIO = 0.073
LARGE_TRIM_SIZE_RATIO = 0.045
LARGE_STATUS_SIZE_RATIO = 0.037
LARGE_SPECS_SIZE_RATIO = 0.037


def _qr_data(payload: LabelPayload) -> str:
    return payload.qr_url or f"https://lotsync.app/v/{payload.vin}"


def _content_color(base: tuple[int, int, int], payload: LabelPayload) -> tuple[int, int, int]:
    return FADED if is_sold(payload) else base


def _draw_sold_stamp(draw: ImageDraw.ImageDraw, width: int, height: int) -> None:
    stamp_w = int(width * 0.42)
    stamp_h = int(height * 0.18)
    cx = width // 2
    cy = int(height * 0.52)
    x0 = cx - stamp_w // 2
    y0 = cy - stamp_h // 2
    draw.rounded_rectangle(
        [(x0, y0), (x0 + stamp_w, y0 + stamp_h)],
        radius=6,
        outline=RED,
        width=3,
        fill=(255, 240, 240),
    )
    font = load_font(max(int(stamp_h * 0.45), 14), weight="bold")
    text = "SOLD"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text((cx - tw // 2, cy - th // 2 - 2), text, fill=RED, font=font)


def _draw_header_status(
    draw: ImageDraw.ImageDraw,
    payload: LabelPayload,
    *,
    width: int,
    margin: int,
    y: int,
    font_size: int,
) -> int:
    label, color = status_label(payload)
    dot_r = max(font_size // 3, 4)
    content_color = _content_color(color, payload)
    draw_status_dot(draw, margin, y + 1, dot_r, content_color, outline_only=is_sold(payload))
    status_font = load_font(font_size, weight="bold")
    draw.text((margin + dot_r * 2 + 8, y), label, fill=content_color, font=status_font)

    if payload.stock_number:
        stock_font = load_font(font_size, weight="medium")
        stock = f"STOCK {payload.stock_number}"
        bbox = draw.textbbox((0, 0), stock, font=stock_font)
        draw.text(
            (width - margin - (bbox[2] - bbox[0]), y),
            stock,
            fill=_content_color(GRAY, payload),
            font=stock_font,
        )

    return y + font_size + max(int(font_size * 0.35), 4)


def _draw_price_block(
    draw: ImageDraw.ImageDraw,
    payload: LabelPayload,
    *,
    x: int,
    y: int,
    max_width: int,
    target_size: int,
) -> int:
    price_color = _content_color(GREEN, payload)
    if is_sold(payload):
        price_color = FADED

    if is_price_reduced(payload) and payload.previous_price:
        old_font = fit_text(
            draw,
            payload.previous_price,
            int(target_size * 0.5),
            max_width,
            weight="medium",
            min_size=10,
        )
        y = draw_strikethrough_price(draw, x, y, payload.previous_price, old_font, RED) + 4

    min_price = max(int(target_size * 0.72), 28)
    price_font = fit_text(
        draw, payload.price, target_size, max_width, weight="bold", min_size=min_price
    )
    draw.text((x, y), payload.price, fill=price_color, font=price_font)
    bbox = draw.textbbox((x, y), payload.price, font=price_font)
    return bbox[3]


def _draw_vin_footer(
    draw: ImageDraw.ImageDraw,
    image: Image.Image,
    payload: LabelPayload,
    profile: DeviceProfile,
    *,
    width: int,
    height: int,
    margin: int,
    divider_y: int,
    qr_size: int,
) -> None:
    draw.line([(margin, divider_y), (width - margin, divider_y)], fill=LIGHT_GRAY, width=1)

    footer_y = divider_y + max(int(height * 0.025), 8)
    vin_label_font = load_font(max(int(height * 0.032), 9), weight="bold")
    vin_font = load_font(max(int(height * 0.036), 10), weight="medium")

    draw.text((margin, footer_y), "VIN", fill=_content_color(GREEN, payload), font=vin_label_font)
    label_bbox = draw.textbbox((margin, footer_y), "VIN", font=vin_label_font)
    draw.text(
        (margin, label_bbox[3] + 2),
        payload.vin,
        fill=_content_color(BLACK, payload),
        font=vin_font,
    )

    if profile.supports_qr and qr_size >= 28:
        qr = make_qr_image(_qr_data(payload), size=qr_size)
        qr_y = divider_y + max(int(height * 0.012), 4)
        image.paste(qr, (width - margin - qr_size, qr_y))


def render_large(
    payload: LabelPayload,
    profile: DeviceProfile,
    *,
    width: int,
    height: int,
) -> Image.Image:
    image = Image.new("RGB", (width, height), BG)
    draw = ImageDraw.Draw(image)
    margin = max(int(width * 0.045), 14)
    inner_w = width - margin * 2

    divider_y = int(height * LARGE_DIVIDER_Y_RATIO)
    qr_size = max(int(height * LARGE_QR_SIZE_RATIO), 48)

    y = margin
    y = _draw_header_status(
        draw,
        payload,
        width=width,
        margin=margin,
        y=y,
        font_size=max(int(height * LARGE_STATUS_SIZE_RATIO), 10),
    )
    y += max(int(height * 0.014), 4)

    headline = vehicle_headline(payload)
    title_font = fit_text(
        draw,
        headline,
        int(height * LARGE_TITLE_SIZE_RATIO),
        inner_w,
        weight="bold",
        min_size=14,
    )
    draw.text((margin, y), headline, fill=_content_color(BLACK, payload), font=title_font)
    y = draw.textbbox((margin, y), headline, font=title_font)[3] + max(int(height * 0.008), 2)

    _, trim = split_model_trim(payload)
    if trim:
        trim_font = load_font(max(int(height * LARGE_TRIM_SIZE_RATIO), 11), weight="regular")
        draw.text((margin, y), trim, fill=_content_color(GRAY, payload), font=trim_font)
        y = draw.textbbox((margin, y), trim, font=trim_font)[3] + max(int(height * 0.018), 5)

    y = _draw_price_block(
        draw,
        payload,
        x=margin,
        y=y,
        max_width=inner_w,
        target_size=int(height * LARGE_PRICE_SIZE_RATIO),
    )
    y += max(int(height * 0.014), 4)

    specs = payload.specs_line or (f"{payload.mileage} mi" if payload.mileage else None)
    if specs:
        specs_font = load_font(max(int(height * LARGE_SPECS_SIZE_RATIO), 10), weight="regular")
        draw.text((margin, y), specs, fill=_content_color(BLACK, payload), font=specs_font)

    _draw_vin_footer(
        draw,
        image,
        payload,
        profile,
        width=width,
        height=height,
        margin=margin,
        divider_y=divider_y,
        qr_size=qr_size,
    )

    if is_sold(payload):
        _draw_sold_stamp(draw, width, height)

    draw.rectangle([(0, 0), (width - 1, height - 1)], outline=LIGHT_GRAY, width=2)
    return image


def render_medium(
    payload: LabelPayload,
    profile: DeviceProfile,
    *,
    width: int,
    height: int,
) -> Image.Image:
    image = Image.new("RGB", (width, height), BG)
    draw = ImageDraw.Draw(image)
    margin = max(int(width * 0.04), 6)

    row_font = fit_text(
        draw, vehicle_headline(payload), int(height * 0.22), width // 2, weight="bold", min_size=9
    )
    draw.text((margin, margin), vehicle_headline(payload), fill=_content_color(BLACK, payload), font=row_font)

    if payload.stock_number:
        stock_font = load_font(max(int(height * 0.16), 8), weight="medium")
        stock = f"STOCK {payload.stock_number}"
        bbox = draw.textbbox((0, 0), stock, font=stock_font)
        draw.text(
            (width - margin - (bbox[2] - bbox[0]), margin + 2),
            stock,
            fill=_content_color(GRAY, payload),
            font=stock_font,
        )

    price_y = margin + int(height * 0.34)
    price_font = fit_text(draw, payload.price, int(height * 0.38), width // 2, weight="bold", min_size=12)
    draw.text((margin, price_y), payload.price, fill=_content_color(GREEN, payload), font=price_font)

    qr_size = max(int(height * 0.62), 36)
    if profile.supports_qr:
        qr = make_qr_image(_qr_data(payload), size=qr_size)
        image.paste(qr, (width - margin - qr_size, margin + int(height * 0.28)))

    vin_font = load_font(max(int(height * 0.14), 7), weight="medium")
    vin_text = f"VIN {payload.vin}"
    draw.text(
        (margin, height - margin - int(height * 0.18)),
        vin_text,
        fill=_content_color(BLACK, payload),
        font=vin_font,
    )

    if is_sold(payload):
        _draw_sold_stamp(draw, width, height)

    draw.rectangle([(0, 0), (width - 1, height - 1)], outline=LIGHT_GRAY, width=1)
    return image


def render_small(
    payload: LabelPayload,
    _profile: DeviceProfile,
    *,
    width: int,
    height: int,
) -> Image.Image:
    image = Image.new("RGB", (width, height), BG)
    draw = ImageDraw.Draw(image)
    margin = max(int(width * 0.04), 5)

    name = vehicle_short_name(payload)
    name_font = fit_text(draw, name, int(height * 0.18), int(width * 0.55), weight="bold", min_size=8)
    draw.text((margin, margin), name, fill=_content_color(BLACK, payload), font=name_font)

    if payload.stock_number:
        stock_font = load_font(max(int(height * 0.14), 7), weight="medium")
        stock = payload.stock_number
        bbox = draw.textbbox((0, 0), stock, font=stock_font)
        draw.text(
            (width - margin - (bbox[2] - bbox[0]), margin + 1),
            stock,
            fill=_content_color(GRAY, payload),
            font=stock_font,
        )

    price_y = margin + int(height * 0.28)
    price_font = fit_text(draw, payload.price, int(height * 0.34), width - margin * 2, weight="bold", min_size=11)
    draw.text((margin, price_y), payload.price, fill=_content_color(GREEN, payload), font=price_font)

    line_y = height - margin - int(height * 0.28)
    draw.line([(margin, line_y), (width - margin, line_y)], fill=LIGHT_GRAY, width=1)

    vin_font = load_font(max(int(height * 0.13), 6), weight="medium")
    vin_text = f"VIN {payload.vin}"
    draw.text((margin, line_y + 3), vin_text, fill=_content_color(BLACK, payload), font=vin_font)

    if is_sold(payload):
        _draw_sold_stamp(draw, width, height)

    draw.rectangle([(0, 0), (width - 1, height - 1)], outline=LIGHT_GRAY, width=1)
    return image


def render_label(payload: LabelPayload, profile: DeviceProfile) -> Image.Image:
    width = max(profile.width, 200)
    height = max(profile.height, 120)
    tier = template_tier(width)

    if tier == "large":
        return render_large(payload, profile, width=width, height=height)
    if tier == "medium":
        return render_medium(payload, profile, width=width, height=height)
    return render_small(payload, profile, width=width, height=height)
