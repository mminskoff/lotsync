import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def list_audit_logs(db: Session, dealership_id: uuid.UUID) -> list[AuditLog]:
    stmt = (
        select(AuditLog)
        .where(AuditLog.dealership_id == dealership_id)
        .order_by(AuditLog.created_at.desc())
    )
    return list(db.scalars(stmt).all())
