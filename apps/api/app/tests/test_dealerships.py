"""Tests for dealership rooftop switcher API."""

import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete

from app.core.database import SessionLocal
from app.main import app
from app.models.dealership import Dealership
from app.models.organization import Organization

client = TestClient(app)

TEST_SLUG_PREFIX = f"accessible-test-{uuid.uuid4().hex[:8]}"


def _headers(dealership_id: uuid.UUID) -> dict[str, str]:
    return {"X-Dealership-Id": str(dealership_id)}


@pytest.fixture(scope="module")
def org_dealerships():
    org_id = uuid.uuid4()
    db = SessionLocal()
    org = Organization(
        id=org_id,
        name="Alpha Auto Group",
        slug=f"{TEST_SLUG_PREFIX}-org",
    )
    db.add(org)
    dealers = [
        Dealership(
            id=uuid.uuid4(),
            name="Alpha Motors North",
            slug=f"{TEST_SLUG_PREFIX}-north",
            status="active",
            organization_id=org_id,
        ),
        Dealership(
            id=uuid.uuid4(),
            name="Alpha Motors South",
            slug=f"{TEST_SLUG_PREFIX}-south",
            status="active",
            organization_id=org_id,
        ),
    ]
    db.add_all(dealers)
    db.commit()
    ids = [dealer.id for dealer in dealers]
    db.close()
    yield org_id, ids

    db = SessionLocal()
    db.execute(delete(Dealership).where(Dealership.slug.like(f"{TEST_SLUG_PREFIX}%")))
    db.execute(delete(Organization).where(Organization.slug.like(f"{TEST_SLUG_PREFIX}%")))
    db.commit()
    db.close()


def test_accessible_returns_org_group(org_dealerships):
    org_id, dealer_ids = org_dealerships
    response = client.get(
        "/api/v1/dealerships/accessible",
        headers=_headers(dealer_ids[0]),
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["active_organization_id"] == str(org_id)
    assert len(payload["groups"]) == 1
    group = payload["groups"][0]
    assert group["organization_name"] == "Alpha Auto Group"
    assert len(group["dealerships"]) == 2
