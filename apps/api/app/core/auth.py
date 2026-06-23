"""Supabase JWT verification for API requests."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Annotated
from uuid import UUID

import jwt
from fastapi import Header, HTTPException

from app.core.config import settings

LOT_ROLES = frozenset({"owner", "manager", "lot_staff", "viewer", "support_admin"})


@dataclass(frozen=True)
class AuthUser:
    id: UUID
    email: str
    role: str


def _decode_bearer_token(authorization: str | None) -> dict | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    if not settings.supabase_jwt_secret:
        return None

    token = authorization.removeprefix("Bearer ").strip()
    try:
        return jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from exc


def get_optional_auth_user(
    authorization: Annotated[str | None, Header()] = None,
) -> AuthUser | None:
    payload = _decode_bearer_token(authorization)
    if payload is None:
        return None

    sub = payload.get("sub")
    email = payload.get("email")
    if not sub or not email:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    app_meta = payload.get("app_metadata") or {}
    user_meta = payload.get("user_metadata") or {}
    role = app_meta.get("role") or user_meta.get("role") or "lot_staff"
    if role not in LOT_ROLES:
        role = "lot_staff"

    try:
        user_id = UUID(str(sub))
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Invalid token subject") from exc

    return AuthUser(id=user_id, email=str(email), role=role)
