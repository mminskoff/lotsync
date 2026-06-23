"""Resolve Nielsen workbook paths for local dev and Railway deploys."""

from __future__ import annotations

import os
from pathlib import Path

# apps/api (parent of app/)
API_ROOT = Path(__file__).resolve().parents[3]

DEFAULT_WORKBOOK = API_ROOT / "data" / "nielsen-ddc.xlsx"


def resolve_workbook_path(configured: str | None) -> Path:
    """Find the Nielsen Excel file on disk.

    Order: NIELSEN_WORKBOOK_PATH env → configured path → default data/ file.
    """
    env_path = os.environ.get("NIELSEN_WORKBOOK_PATH", "").strip()
    if env_path:
        path = Path(env_path)
        if path.is_file():
            return path

    if configured:
        path = Path(configured)
        if path.is_file():
            return path
        # Relative to apps/api (e.g. data/nielsen-ddc.xlsx)
        relative = API_ROOT / path
        if relative.is_file():
            return relative

    if DEFAULT_WORKBOOK.is_file():
        return DEFAULT_WORKBOOK

    raise FileNotFoundError(
        f"Nielsen workbook not found. Set NIELSEN_WORKBOOK_PATH, place file at "
        f"{DEFAULT_WORKBOOK}, or update inventory source config.file_path."
    )
