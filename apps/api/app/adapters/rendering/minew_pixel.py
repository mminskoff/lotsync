"""Minew e-paper pixel encoders (BWRY, BWR, 6-color).

Specs: Minew BWRY Screen Data Format V1.0, BWR V1.1, 6-color V1.0.
"""

from __future__ import annotations

import math
from typing import Literal

from PIL import Image

MinewColorMode = Literal["BWRY", "BWR", "E6"]

# Canonical palette values from Minew documentation.
BWRY_BLACK = (0, 0, 0)
BWRY_WHITE = (255, 255, 255)
BWRY_YELLOW = (255, 255, 0)
BWRY_RED = (255, 0, 0)

BWRY_CODES: dict[tuple[int, int, int], int] = {
    BWRY_BLACK: 0x00,
    BWRY_WHITE: 0x01,
    BWRY_YELLOW: 0x02,
    BWRY_RED: 0x03,
}

E6_PALETTE: dict[tuple[int, int, int], int] = {
    (0, 0, 0): 0x00,
    (255, 255, 255): 0x01,
    (255, 255, 0): 0x02,
    (255, 0, 0): 0x03,
    (0, 0, 255): 0x05,
    (0, 255, 0): 0x06,
}


def infer_minew_color_mode(model: str | None) -> MinewColorMode | None:
    if not model:
        return None
    upper = model.upper()
    if "BWRY" in upper:
        return "BWRY"
    if "BWR" in upper or "-BW-" in upper:
        return "BWR"
    if "E6" in upper or "6-COLOR" in upper or "6COLOR" in upper:
        return "E6"
    return None


def _nearest_color(rgb: tuple[int, int, int], palette: dict[tuple[int, int, int], int]) -> int:
    best_key = min(
        palette,
        key=lambda key: sum((rgb[i] - key[i]) ** 2 for i in range(3)),
    )
    return palette[best_key]


def quantize_image(image: Image.Image, palette: dict[tuple[int, int, int], int]) -> Image.Image:
    """Return an RGB image using only palette colors."""
    src = image.convert("RGB")
    out = Image.new("RGB", src.size)
    px_in = src.load()
    px_out = out.load()
    assert px_in is not None and px_out is not None
    for x in range(src.width):
        for y in range(src.height):
            code_key = min(
                palette,
                key=lambda key: sum((px_in[x, y][i] - key[i]) ** 2 for i in range(3)),
            )
            px_out[x, y] = code_key
    return out


def encode_bwry(image: Image.Image) -> bytes:
    """Encode a 4-color BWRY panel. Four pixels per byte, outer x / inner y."""
    img = quantize_image(image, BWRY_CODES)
    width, height = img.size
    pad = (4 - height % 4) % 4
    padded_height = height + pad

    pixels = img.load()
    assert pixels is not None
    out = bytearray()
    for x in range(width):
        for y in range(0, padded_height, 4):
            nibbles = []
            for offset in range(4):
                row = y + offset
                if row < height:
                    nibbles.append(_nearest_color(pixels[x, row], BWRY_CODES))
                else:
                    nibbles.append(BWRY_CODES[BWRY_WHITE])
            out.append(
                (nibbles[0] << 6) | (nibbles[1] << 4) | (nibbles[2] << 2) | nibbles[3]
            )
    return bytes(out)


def _classify_bwr(rgb: tuple[int, int, int]) -> tuple[int, int]:
    """Return (bw_bit, red_bit) for BWR panels. Red layer wins when red_bit=1."""
    code = _nearest_color(rgb, BWRY_CODES)
    if code == 0x03:
        return 0, 1
    if code == 0x00:
        return 0, 0
    return 1, 0


def encode_bwr(image: Image.Image) -> bytes:
    """Encode a 3-color BWR panel (separate black/white + red bit planes)."""
    img = quantize_image(image, {k: v for k, v in BWRY_CODES.items() if v != 0x02})
    width, height = img.size
    pad = (8 - height % 8) % 8
    padded_height = height + pad

    pixels = img.load()
    assert pixels is not None
    black_white: list[int] = []
    red: list[int] = []
    for x in range(width):
        for y in range(height):
            bw_bit, red_bit = _classify_bwr(pixels[x, y])
            black_white.append(bw_bit)
            red.append(red_bit)
        for _ in range(pad):
            black_white.append(0)
            red.append(0)

    combined = black_white + red
    return _pack_bits_msb(combined)


def encode_e6(image: Image.Image) -> bytes:
    """Encode a 6-color panel. Two pixels per byte, outer x / inner y."""
    img = quantize_image(image, E6_PALETTE)
    width, height = img.size
    if height % 2 != 0:
        raise ValueError(f"6-color height must be divisible by 2, got {height}")

    pixels = img.load()
    assert pixels is not None
    out = bytearray()
    for x in range(width):
        for y in range(0, height, 2):
            high = _nearest_color(pixels[x, y], E6_PALETTE)
            low = _nearest_color(pixels[x, y + 1], E6_PALETTE)
            out.append((high << 4) | low)
    return bytes(out)


def _pack_bits_msb(bits: list[int]) -> bytes:
    out = bytearray()
    for index in range(0, len(bits), 8):
        byte = 0
        for offset in range(8):
            if index + offset < len(bits) and bits[index + offset]:
                byte |= 1 << (7 - offset)
        out.append(byte)
    return bytes(out)


def encode_minew_pixels(image: Image.Image, color_mode: str) -> bytes:
    mode = color_mode.upper()
    if mode == "BWRY":
        return encode_bwry(image)
    if mode == "BWR":
        return encode_bwr(image)
    if mode in {"E6", "6COLOR", "6-COLOR"}:
        return encode_e6(image)
    raise ValueError(f"Unsupported Minew color mode: {color_mode}")


def expected_byte_length(width: int, height: int, color_mode: str) -> int:
    mode = color_mode.upper()
    if mode == "BWRY":
        pad = (4 - height % 4) % 4
        return (width * (height + pad)) // 4
    if mode == "BWR":
        pad = (8 - height % 8) % 8
        bits_per_plane = width * (height + pad)
        return math.ceil(bits_per_plane / 8) * 2
    if mode in {"E6", "6COLOR", "6-COLOR"}:
        if height % 2 != 0:
            raise ValueError("6-color height must be divisible by 2")
        return (width * height) // 2
    raise ValueError(f"Unsupported Minew color mode: {color_mode}")
