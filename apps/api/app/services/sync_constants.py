"""Shared sync status constants."""

SYNC_PENDING = "PENDING"
SYNC_UPDATING = "UPDATING"
SYNC_SYNCED = "SYNCED"
SYNC_FAILED = "FAILED"

VEHICLE_SYNC_PENDING = "PENDING"
VEHICLE_SYNC_UPDATING = "UPDATING"
VEHICLE_SYNC_SYNCED = "SYNCED"
VEHICLE_SYNC_FAILED = "FAILED"

MAX_SYNC_ATTEMPTS = 3

TRACKED_VEHICLE_FIELDS = (
    "source_price",
    "displayed_price",
    "website_verified_price",
    "status",
    "mileage",
    "stock_number",
    "year",
    "make",
    "model",
    "trim",
    "vehicle_url",
    "price_type",
)
