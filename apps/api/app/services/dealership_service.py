import uuid
from collections import defaultdict

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.dealership import Dealership
from app.models.organization import Organization
from app.schemas.dealership import DealershipUpdate, RooftopGroupResponse
from app.services.audit_service import log_action

_DEV_TEST_SLUG_PREFIXES = (
    "sync-engine-",
    "pairing-test-",
    "accessible-test-",
    "inventory-test-",
)
_DEV_TEST_SLUGS = frozenset({"driveway-test"})


def _is_dev_test_dealership(dealership: Dealership) -> bool:
    slug = dealership.slug
    if slug in _DEV_TEST_SLUGS:
        return True
    return any(slug.startswith(prefix) for prefix in _DEV_TEST_SLUG_PREFIXES) or (
        len(slug) <= 10 and slug.startswith("t-")
    )


def get_dealership(db: Session, dealership_id: uuid.UUID) -> Dealership:
    dealership = db.get(Dealership, dealership_id)
    if dealership is None:
        raise HTTPException(status_code=404, detail="Dealership not found")
    return dealership


def _fetch_accessible_dealerships(
    db: Session, current: Dealership
) -> list[Dealership]:
    if settings.environment == "development":
        stmt = (
            select(Dealership)
            .where(Dealership.status == "active")
            .order_by(Dealership.name)
        )
        dealerships = list(db.scalars(stmt).all())
        return [d for d in dealerships if not _is_dev_test_dealership(d)]

    if current.organization_id is not None:
        stmt = (
            select(Dealership)
            .where(
                Dealership.organization_id == current.organization_id,
                Dealership.status == "active",
            )
            .order_by(Dealership.name)
        )
        return list(db.scalars(stmt).all())

    return [current]


def _organization_name(db: Session, organization_id: uuid.UUID) -> str:
    organization = db.get(Organization, organization_id)
    if organization is None:
        return "Dealer group"
    return organization.name


def _build_rooftop_groups(
    db: Session, dealerships: list[Dealership]
) -> list[RooftopGroupResponse]:
    grouped: dict[uuid.UUID | None, list[Dealership]] = defaultdict(list)
    for dealership in dealerships:
        grouped[dealership.organization_id].append(dealership)

    groups: list[RooftopGroupResponse] = []
    for organization_id, members in grouped.items():
        members.sort(key=lambda dealer: dealer.name.lower())
        if organization_id is not None:
            organization_name = _organization_name(db, organization_id)
        elif len(members) == 1:
            organization_name = members[0].name
        else:
            organization_name = "Standalone rooftops"

        groups.append(
            RooftopGroupResponse(
                organization_id=organization_id,
                organization_name=organization_name,
                dealerships=members,
            )
        )

    groups.sort(key=lambda group: group.organization_name.lower())
    return groups


def list_accessible_rooftop_groups(
    db: Session, dealership_id: uuid.UUID
) -> tuple[Dealership, list[RooftopGroupResponse]]:
    current = get_dealership(db, dealership_id)
    dealerships = _fetch_accessible_dealerships(db, current)
    groups = _build_rooftop_groups(db, dealerships)
    return current, groups


def update_dealership(
    db: Session, dealership_id: uuid.UUID, data: DealershipUpdate
) -> Dealership:
    dealership = get_dealership(db, dealership_id)
    changes = data.model_dump(exclude_unset=True)
    for field, value in changes.items():
        setattr(dealership, field, value)

    log_action(
        db,
        dealership_id=dealership_id,
        action="dealership.update",
        entity_type="dealership",
        entity_id=dealership_id,
        metadata=changes,
    )
    db.commit()
    db.refresh(dealership)
    return dealership
