import uuid
from collections import defaultdict
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DealershipResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    website_url: str | None
    status: str
    organization_id: uuid.UUID | None
    created_at: datetime


class DealershipUpdate(BaseModel):
    name: str | None = None
    website_url: str | None = None
    status: str | None = None


class RooftopGroupResponse(BaseModel):
    organization_id: uuid.UUID | None
    organization_name: str
    dealerships: list[DealershipResponse]


class AccessibleDealershipsResponse(BaseModel):
    groups: list[RooftopGroupResponse]
    active_organization_id: uuid.UUID | None
    active_dealership_id: uuid.UUID
