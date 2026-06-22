"""Tests for preview PNG renderer and label preview service."""

import base64
import uuid
from decimal import Decimal

import pytest
from PIL import Image
from sqlalchemy import delete

from app.adapters.rendering import get_renderer_adapter
from app.core.database import SessionLocal
from app.models.dealership import Dealership
from app.models.esl_device import ESLDevice
from app.models.vehicle import Vehicle
from app.schemas.label import DeviceProfile, LabelPayload
from app.services.label_preview_service import render_vehicle_label_png
from app.tests.test_label_adapters import _sample_payload, _sample_profile

TEST_SLUG = f"label-preview-{uuid.uuid4().hex[:8]}"


def test_preview_renderer_returns_png():
    renderer = get_renderer_adapter("preview")
    rendered = renderer.render(_sample_payload(), _sample_profile())

    assert rendered.format == "png"
    assert isinstance(rendered.payload, str)
    png_bytes = base64.b64decode(rendered.payload)
    assert png_bytes[:8] == b"\x89PNG\r\n\x1a\n"

    image = Image.open(__import__("io").BytesIO(png_bytes))
    assert image.size == (400, 300)


@pytest.fixture
def preview_dealership_id():
    db = SessionLocal()
    dealership = Dealership(
        id=uuid.uuid4(),
        name="Preview Test",
        slug=TEST_SLUG,
        status="active",
        organization_id=uuid.uuid4(),
    )
    db.add(dealership)
    db.commit()
    dealership_id = dealership.id
    db.close()
    yield dealership_id

    db = SessionLocal()
    db.execute(delete(Vehicle).where(Vehicle.dealership_id == dealership_id))
    db.execute(delete(ESLDevice).where(ESLDevice.dealership_id == dealership_id))
    db.execute(delete(Dealership).where(Dealership.id == dealership_id))
    db.commit()
    db.close()


def test_render_vehicle_label_png_without_device(preview_dealership_id):
    db = SessionLocal()
    vehicle = Vehicle(
        id=uuid.uuid4(),
        dealership_id=preview_dealership_id,
        vin=f"PREV{uuid.uuid4().hex[:8].upper()}",
        make="Honda",
        model="Accord",
        year=2024,
        displayed_price=Decimal("28950.00"),
    )
    db.add(vehicle)
    db.commit()

    png_bytes = render_vehicle_label_png(db, preview_dealership_id, vehicle.id)
    db.close()

    assert png_bytes[:8] == b"\x89PNG\r\n\x1a\n"


def test_render_vehicle_label_png_with_paired_device(preview_dealership_id):
    db = SessionLocal()
    vehicle = Vehicle(
        id=uuid.uuid4(),
        dealership_id=preview_dealership_id,
        vin=f"PREV{uuid.uuid4().hex[:8].upper()}",
        make="Toyota",
        model="RAV4",
        year=2023,
        displayed_price=Decimal("32000.00"),
    )
    device = ESLDevice(
        id=uuid.uuid4(),
        dealership_id=preview_dealership_id,
        device_id="ESL-PREV-001",
        provider="stub",
        model="ESL-4.2-BW",
        screen_width=480,
        screen_height=320,
    )
    db.add_all([vehicle, device])
    db.commit()

    png_bytes = render_vehicle_label_png(
        db, preview_dealership_id, vehicle.id, esl_device_id=device.id
    )
    db.close()

    image = Image.open(__import__("io").BytesIO(png_bytes))
    assert image.size == (480, 320)
