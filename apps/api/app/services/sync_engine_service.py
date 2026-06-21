import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.adapters.rendering import get_renderer_adapter
from app.adapters.transport import get_transport_adapter
from app.core.config import settings
from app.models.esl_device import ESLDevice
from app.models.sync_event import SyncEvent
from app.models.vehicle import Vehicle
from app.services.audit_service import log_action
from app.services.label_payload_service import build_sync_label
from app.services.sync_constants import (
    MAX_SYNC_ATTEMPTS,
    SYNC_FAILED,
    SYNC_PENDING,
    SYNC_SYNCED,
    SYNC_UPDATING,
    VEHICLE_SYNC_FAILED,
    VEHICLE_SYNC_PENDING,
    VEHICLE_SYNC_SYNCED,
    VEHICLE_SYNC_UPDATING,
)

logger = logging.getLogger(__name__)


class SyncProcessingError(Exception):
    pass


def _load_event_entities(
    db: Session, event: SyncEvent
) -> tuple[Vehicle, ESLDevice]:
    if event.vehicle_id is None or event.esl_device_id is None:
        raise SyncProcessingError("Sync event missing vehicle or ESL device reference")

    vehicle = db.get(Vehicle, event.vehicle_id)
    device = db.get(ESLDevice, event.esl_device_id)
    if vehicle is None or device is None:
        raise SyncProcessingError("Sync event references missing vehicle or ESL device")
    if vehicle.dealership_id != event.dealership_id or device.dealership_id != event.dealership_id:
        raise SyncProcessingError("Sync event entity dealership mismatch")
    return vehicle, device


def process_sync_event(db: Session, event: SyncEvent) -> SyncEvent:
    if event.status != SYNC_PENDING:
        return event

    event.status = SYNC_UPDATING
    vehicle, device = _load_event_entities(db, event)
    vehicle.sync_status = VEHICLE_SYNC_UPDATING
    db.flush()

    renderer = get_renderer_adapter(settings.renderer_adapter)
    transport = get_transport_adapter(settings.transport_adapter)

    try:
        payload, profile = build_sync_label(vehicle, device)
        rendered = renderer.render(payload, profile)
        result = transport.push_label(
            device.device_id,
            rendered,
            metadata={"sync_event_id": str(event.id), "event_type": event.event_type},
        )
        if not result.success:
            raise SyncProcessingError(result.error or "Transport adapter reported failure")

        finished_at = datetime.now(UTC)
        event.status = SYNC_SYNCED
        event.processed_at = finished_at
        event.error_message = None
        vehicle.sync_status = VEHICLE_SYNC_SYNCED

        log_action(
            db,
            dealership_id=event.dealership_id,
            action="sync_event.complete",
            entity_type="sync_event",
            entity_id=event.id,
            metadata={
                "event_type": event.event_type,
                "device_id": device.device_id,
                "vin": vehicle.vin,
            },
        )
    except Exception as exc:
        event.attempt_count += 1
        event.error_message = str(exc)

        if event.attempt_count >= MAX_SYNC_ATTEMPTS:
            event.status = SYNC_FAILED
            event.processed_at = datetime.now(UTC)
            vehicle.sync_status = VEHICLE_SYNC_FAILED
            log_action(
                db,
                dealership_id=event.dealership_id,
                action="sync_event.failed",
                entity_type="sync_event",
                entity_id=event.id,
                metadata={
                    "error": str(exc),
                    "attempt_count": event.attempt_count,
                    "event_type": event.event_type,
                },
            )
        else:
            event.status = SYNC_PENDING
            vehicle.sync_status = VEHICLE_SYNC_PENDING
            logger.warning(
                "Sync event %s failed (attempt %s/%s): %s",
                event.id,
                event.attempt_count,
                MAX_SYNC_ATTEMPTS,
                exc,
            )

        if isinstance(exc, SyncProcessingError):
            pass
        else:
            logger.exception("Unexpected sync processing error for event %s", event.id)

    return event


def fetch_pending_events(db: Session, *, limit: int = 25) -> list[SyncEvent]:
    stmt = (
        select(SyncEvent)
        .where(SyncEvent.status == SYNC_PENDING)
        .order_by(SyncEvent.created_at)
        .limit(limit)
        .with_for_update(skip_locked=True)
    )
    return list(db.scalars(stmt).all())


def process_pending_sync_events(db: Session, *, limit: int = 25) -> dict[str, int]:
    events = fetch_pending_events(db, limit=limit)
    synced = 0
    failed = 0
    retried = 0

    for event in events:
        process_sync_event(db, event)
        if event.status == SYNC_SYNCED:
            synced += 1
        elif event.status == SYNC_FAILED:
            failed += 1
        elif event.status == SYNC_PENDING:
            retried += 1

    if events:
        db.commit()

    return {
        "processed": len(events),
        "synced": synced,
        "failed": failed,
        "retried": retried,
    }
