from uuid import UUID

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.dealership import Dealership


def get_dealership_id(
    x_dealership_id: str = Header(..., alias="X-Dealership-Id"),
    db: Session = Depends(get_db),
) -> UUID:
    try:
        dealership_uuid = UUID(x_dealership_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=403,
            detail="Invalid X-Dealership-Id header",
        ) from exc

    dealership = db.get(Dealership, dealership_uuid)
    if dealership is None:
        raise HTTPException(status_code=404, detail="Dealership not found")

    return dealership_uuid
