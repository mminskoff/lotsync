"""Seed a test dealership for local development."""

import uuid

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.dealership import Dealership

SLUG = "driveway-test"
NAME = "Driveway Test"


def main() -> None:
    db = SessionLocal()
    try:
        existing = db.scalar(select(Dealership).where(Dealership.slug == SLUG))
        if existing:
            print(f"Dealership already exists: {existing.id}")
            print(f"Use header: X-Dealership-Id: {existing.id}")
            return

        dealership = Dealership(
            id=uuid.uuid4(),
            name=NAME,
            slug=SLUG,
            status="active",
        )
        db.add(dealership)
        db.commit()
        print(f"Created test dealership: {dealership.id}")
        print(f"Use header: X-Dealership-Id: {dealership.id}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
