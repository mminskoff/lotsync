from __future__ import annotations

from PIL import ImageDraw

BLACK = 0
WHITE = 255

# Display wordmarks for common makes (demo / preview — not official brand assets)
_MAKE_WORDMARKS: dict[str, str] = {
    "toyota": "TOYOTA",
    "honda": "HONDA",
    "ford": "FORD",
    "chevrolet": "CHEVROLET",
    "chevy": "CHEVROLET",
    "hyundai": "HYUNDAI",
    "nissan": "NISSAN",
    "subaru": "SUBARU",
    "mazda": "MAZDA",
    "kia": "KIA",
    "jeep": "JEEP",
    "bmw": "BMW",
    "volkswagen": "VW",
    "vw": "VW",
    "mercedes-benz": "MERCEDES",
    "mercedes": "MERCEDES",
    "audi": "AUDI",
    "lexus": "LEXUS",
    "gmc": "GMC",
    "ram": "RAM",
    "dodge": "DODGE",
    "tesla": "TESLA",
    "acura": "ACURA",
    "infiniti": "INFINITI",
    "cadillac": "CADILLAC",
    "lincoln": "LINCOLN",
    "volvo": "VOLVO",
    "porsche": "PORSCHE",
}


def make_wordmark(make: str | None) -> str:
    if not make:
        return "AUTO"
    key = make.strip().lower()
    if key in _MAKE_WORDMARKS:
        return _MAKE_WORDMARKS[key]
    return make.strip().upper()[:12]


def draw_make_badge(
    draw: ImageDraw.ImageDraw,
    *,
    make: str | None,
    x: int,
    y: int,
    size: int,
) -> tuple[int, int]:
    """Draw a make monogram + wordmark badge. Returns (width, height) used."""
    wordmark = make_wordmark(make)
    letter = wordmark[0] if wordmark else "A"
    radius = max(size // 8, 4)

    # Monogram circle
    draw.rounded_rectangle(
        [(x, y), (x + size, y + size)],
        radius=radius,
        fill=BLACK,
    )

    mono_font = load_font(max(int(size * 0.52), 14), weight="bold")
    letter_bbox = draw.textbbox((0, 0), letter, font=mono_font)
    letter_w = letter_bbox[2] - letter_bbox[0]
    letter_h = letter_bbox[3] - letter_bbox[1]
    draw.text(
        (x + (size - letter_w) // 2, y + (size - letter_h) // 2 - 1),
        letter,
        fill=WHITE,
        font=mono_font,
    )

    # Wordmark beside monogram
    mark_font = load_font(max(int(size * 0.28), 9), weight="bold")
    text_x = x + size + max(size // 5, 6)
    text_y = y + (size - (mark_font.size if hasattr(mark_font, "size") else 10)) // 2
    draw.text((text_x, text_y), wordmark, fill=BLACK, font=mark_font)

    word_bbox = draw.textbbox((text_x, text_y), wordmark, font=mark_font)
    total_w = word_bbox[2] - x
    return total_w, size
