"""Tests for price mismatch detection."""

from decimal import Decimal
import uuid

import uuid

import pytest
from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.dealership import Dealership
from app.models.vehicle import Vehicle
from app.services.price_mismatch_service import (
    detect_price_mismatch_reason,
    refresh_dealership_price_mismatches,
)
from app.core.database import SessionLocal


@pytest.fixture(scope="module")
def test_dealership_id():
    db = SessionLocal()
    dealership = Dealership(
        id=uuid.uuid4(),
        name="Price Mismatch Test",
        slug=f"price-mismatch-{uuid.uuid4().hex[:8]}",
        status="active",
        organization_id=uuid.uuid4(),
    )
    db.add(dealership)
    db.commit()
    dealer_id = dealership.id
    db.close()
    return dealer_id


def _vehicle(**kwargs) -> Vehicle:
    defaults = {
        "id": "00000000-0000-4000-8000-000000000099",
        "dealership_id": "de000000-0000-4000-8000-000000000001",
        "vin": "1HGBH41JXMN109186",
        "sync_status": None,
        "price_verified": False,
    }
    defaults.update(kwargs)
    return Vehicle(**defaults)


def test_no_mismatch_when_prices_align():
    vehicle = _vehicle(
        source_price=Decimal("25000.00"),
        displayed_price=Decimal("25000.00"),
        website_verified_price=Decimal("25000.00"),
    )
    assert detect_price_mismatch_reason(vehicle) is None


def test_mismatch_source_vs_displayed():
    vehicle = _vehicle(
        source_price=Decimal("25000.00"),
        displayed_price=Decimal("24500.00"),
    )
    reason = detect_price_mismatch_reason(vehicle)
    assert reason is not None
    assert "source" in reason
    assert "displayed" in reason


def test_mismatch_website_vs_source():
    vehicle = _vehicle(
        source_price=Decimal("25000.00"),
        displayed_price=Decimal("25000.00"),
        website_verified_price=Decimal("24000.00"),
    )
    reason = detect_price_mismatch_reason(vehicle)
    assert reason is not None
    assert "website" in reason


def test_refresh_flags_and_clears(test_dealership_id):
    db = SessionLocal()
    try:
        vehicle = Vehicle(
            id=uuid.uuid4(),
            dealership_id=test_dealership_id,
            vin="MISMATCHTESTVIN001",
            source_price=Decimal("30000.00"),
            displayed_price=Decimal("29000.00"),
            sync_status=None,
            price_verified=False,
        )
        db.add(vehicle)
        db.commit()

        flagged, cleared = refresh_dealership_price_mismatches(db, test_dealership_id)
        db.flush()

        assert flagged == 1
        assert cleared == 0
        assert vehicle.sync_status == "PRICE_MISMATCH"
        assert vehicle.price_verified is False

        vehicle.displayed_price = Decimal("30000.00")
        db.commit()

        flagged, cleared = refresh_dealership_price_mismatches(db, test_dealership_id)
        db.flush()

        assert flagged == 0
        assert cleared == 1
        assert vehicle.sync_status is None
        assert vehicle.price_verified is True
    finally:
        db.close()
