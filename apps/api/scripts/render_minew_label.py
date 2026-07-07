"""Render a Minew label to PNG + binary pixel buffer for kit validation.

Run from apps/api:
    PYTHONPATH=. .venv/bin/python scripts/render_minew_label.py
    PYTHONPATH=. .venv/bin/python scripts/render_minew_label.py --device E100000A1525 --out /tmp/minew
"""

from __future__ import annotations

import argparse
import base64
from pathlib import Path

from PIL import Image

from app.adapters.rendering.label_layouts import render_label
from app.adapters.rendering.minew import MinewRenderer, resolve_minew_color_mode
from app.adapters.rendering.minew_pixel import expected_byte_length, infer_minew_color_mode
from app.schemas.label import DeviceProfile, LabelPayload

KIT_PROFILES: tuple[dict[str, object], ...] = (
    {"device_id": "E100000A1525", "model": "4.2-BWRY", "width": 400, "height": 300},
    {"device_id": "E10000083B68", "model": "3.5-BWRY", "width": 384, "height": 184},
    {"device_id": "E10000083B76", "model": "2.9-BWRY", "width": 296, "height": 128},
    {"device_id": "E100000A15B4", "model": "2.13-BWRY", "width": 250, "height": 122},
    {"device_id": "E0000001BE6A", "model": "7.3-E6", "width": 800, "height": 480},
)

SAMPLE_PAYLOAD = LabelPayload(
    vin="1C4RJXP68SW601101",
    stock_number="4259T",
    price="$32,500",
    year="2025",
    make="Jeep",
    model="Wrangler",
    trim="Sport S",
    mileage="12,450",
    status="available",
)


def _profile(spec: dict[str, object]) -> DeviceProfile:
    model = str(spec["model"])
    color_mode = infer_minew_color_mode(model) or "BWRY"
    return DeviceProfile(
        provider="minew",
        model=model,
        width=int(spec["width"]),
        height=int(spec["height"]),
        color_mode=color_mode,
    )


def render_device(spec: dict[str, object], out_dir: Path) -> None:
    device_id = str(spec["device_id"])
    profile = _profile(spec)
    color_mode = resolve_minew_color_mode(profile)
    expected = expected_byte_length(profile.width, profile.height, color_mode or "BWRY")

    renderer = MinewRenderer()
    rendered = renderer.render(SAMPLE_PAYLOAD, profile)
    raw = base64.b64decode(rendered.payload["data_b64"])

    out_dir.mkdir(parents=True, exist_ok=True)
    stem = f"{device_id}_{profile.width}x{profile.height}_{color_mode}"
    png_path = out_dir / f"{stem}.png"
    bin_path = out_dir / f"{stem}.bin"

    layout = render_label(SAMPLE_PAYLOAD, profile)
    layout.save(png_path)

    bin_path.write_bytes(raw)

    status = "OK" if len(raw) == expected else "MISMATCH"
    print(
        f"{status} {device_id} {profile.model} {profile.width}x{profile.height} "
        f"{color_mode} expected={expected} actual={len(raw)}"
    )
    print(f"  png: {png_path}")
    print(f"  bin: {bin_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Render Minew kit labels to PNG + .bin")
    parser.add_argument("--device", help="Single device id (default: all kit tags)")
    parser.add_argument("--out", default="tmp/minew-renders", help="Output directory")
    args = parser.parse_args()

    out_dir = Path(args.out)
    specs = KIT_PROFILES
    if args.device:
        specs = tuple(s for s in KIT_PROFILES if s["device_id"] == args.device)
        if not specs:
            raise SystemExit(f"Unknown device id: {args.device!r}")

    for spec in specs:
        render_device(spec, out_dir)


if __name__ == "__main__":
    main()
