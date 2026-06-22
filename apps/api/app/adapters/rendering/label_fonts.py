from __future__ import annotations

from PIL import ImageFont

# macOS, Linux, fallback — bold for price, medium for title, regular for details
_FONT_CANDIDATES: dict[str, list[tuple[str, int | None]]] = {
    "bold": [
        ("/System/Library/Fonts/HelveticaNeue.ttc", 1),
        ("/System/Library/Fonts/SFNSScript.ttf", 2),
        ("/System/Library/Fonts/Supplemental/Arial Bold.ttf", None),
        ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", None),
    ],
    "medium": [
        ("/System/Library/Fonts/HelveticaNeue.ttc", 0),
        ("/System/Library/Fonts/Supplemental/Arial.ttf", None),
        ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", None),
    ],
    "regular": [
        ("/System/Library/Fonts/HelveticaNeue.ttc", 0),
        ("/System/Library/Fonts/Supplemental/Arial.ttf", None),
        ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", None),
    ],
}


def load_font(size: int, weight: str = "regular") -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = _FONT_CANDIDATES.get(weight, _FONT_CANDIDATES["regular"])
    for path, index in candidates:
        try:
            if index is None:
                return ImageFont.truetype(path, size)
            return ImageFont.truetype(path, size, index=index)
        except OSError:
            continue
    return ImageFont.load_default()
