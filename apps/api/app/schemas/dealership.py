import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DealershipResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    website_url: str | None
    status: str
    created_at: datetime


class DealershipUpdate(BaseModel):
    name: str | None = None
    website_url: str | None = None
    status: str | None = None
