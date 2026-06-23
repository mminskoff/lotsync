"""Detect and flag vehicles whose prices disagree across sources."""

from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.vehicle import Vehicle
from app.models.assignment import VehicleESLAssignment
from app.services.sync_constants import VEHICLE_SYNC_PENDING, VEHICLE_SYNC_PRICE_MISMATCH

PRICE_TOLERANCE = Decimal("0.01")


def _normalize_price(value: Decimal | None) -> Decimal | None:
    if value is None:
        return None
    return value.quantize(Decimal("0.01"))


def detect_price_mismatch_reason(vehicle: Vehicle) -> str | None:
    """Return a human-readable mismatch reason, or None if prices align."""
    source = _normalize_price(vehicle.source_price)
    displayed = _normalize_price(vehicle.displayed_price)
    website = _normalize_price(vehicle.website_verified_price)

    reasons: list[str] = []

    if source is not None and displayed is not None and abs(source - displayed) > PRICE_TOLERANCE:
        reasons.append(f"source ({source}) ≠ displayed ({displayed})")

    if website is not None and source is not None and abs(website - source) > PRICE_TOLERANCE:
        reasons.append(f"website ({website}) ≠ source ({source})")

    if website is not None and displayed is not None and abs(website - displayed) > PRICE_TOLERANCE:
        reasons.append(f"website ({website}) ≠ displayed ({displayed})")

    if not reasons:
        return None
    return "; ".join(reasons)


def _has_active_assignment(db: Session, vehicle_id: UUID) -> bool:
    assignment = db.scalar(
        select(VehicleESLAssignment.id).where(
            VehicleESLAssignment.vehicle_id == vehicle_id,
            VehicleESLAssignment.unassigned_at.is_(None),
        )
    )
    return assignment is not None


def refresh_dealership_price_mismatches(db: Session, dealership_id: UUID) -> tuple[int, int]:
    """Scan all vehicles for a rooftop and update PRICE_MISMATCH flags.

    Returns (flagged_count, cleared_count).
    """
    vehicles = list(
        db.scalars(
            select(Vehicle).where(Vehicle.dealership_id == dealership_id).order_by(Vehicle.vin)
        ).all()
    )

    flagged = 0
    cleared = 0

    for vehicle in vehicles:
        reason = detect_price_mismatch_reason(vehicle)
        current = (vehicle.sync_status or "").upper()

        if reason:
            vehicle.price_verified = False
            if current != VEHICLE_SYNC_PRICE_MISMATCH:
                vehicle.sync_status = VEHICLE_SYNC_PRICE_MISMATCH
                flagged += 1
        elif current == VEHICLE_SYNC_PRICE_MISMATCH:
            vehicle.price_verified = True
            vehicle.sync_status = (
                VEHICLE_SYNC_PENDING if _has_active_assignment(db, vehicle.id) else None
            )
            cleared += 1

    return flagged, cleared
