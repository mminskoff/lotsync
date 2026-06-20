import uuid
from datetime import UTC, datetime

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.adapters.inventory import get_inventory_adapter
from app.models.inventory_sync_run import InventorySyncRun
from app.schemas.inventory import InventorySyncResult, InventoryTestResult
from app.services import inventory_source_service
from app.services.audit_service import log_action
from app.services.vehicle_upsert_service import upsert_vehicles_from_import


def _start_sync_run(
    db: Session, dealership_id: uuid.UUID, source_id: uuid.UUID
) -> InventorySyncRun:
    run = InventorySyncRun(
        id=uuid.uuid4(),
        dealership_id=dealership_id,
        inventory_source_id=source_id,
        status="running",
    )
    db.add(run)
    db.flush()
    return run


def test_inventory_source(
    db: Session, dealership_id: uuid.UUID, source_id: uuid.UUID
) -> InventoryTestResult:
    source = inventory_source_service.get_inventory_source(db, dealership_id, source_id)
    if not source.enabled:
        raise HTTPException(status_code=400, detail="Inventory source is disabled")

    try:
        adapter = get_inventory_adapter(source.source_type)
    except ValueError as exc:
        return InventoryTestResult(success=False, message=str(exc))

    try:
        adapter.test_connection(source.config_json)
    except (ValueError, FileNotFoundError, NotImplementedError) as exc:
        return InventoryTestResult(success=False, message=str(exc))

    return InventoryTestResult(success=True, message="Connection successful")


def sync_inventory_source_now(
    db: Session, dealership_id: uuid.UUID, source_id: uuid.UUID
) -> InventorySyncResult:
    source = inventory_source_service.get_inventory_source(db, dealership_id, source_id)
    if not source.enabled:
        raise HTTPException(status_code=400, detail="Inventory source is disabled")

    try:
        adapter = get_inventory_adapter(source.source_type)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    run = _start_sync_run(db, dealership_id, source_id)

    try:
        records = adapter.fetch_inventory(dealership_id, source.config_json)
        upsert_result = upsert_vehicles_from_import(
            db,
            dealership_id,
            records,
            source.source_type,
            mark_missing_off_lot=source.config_json.get("mark_missing_off_lot", True),
        )

        run.status = "success"
        run.records_processed = upsert_result.processed
        run.vehicles_created = upsert_result.created
        run.vehicles_updated = upsert_result.updated
        run.vehicles_off_lot = upsert_result.off_lot
        source.last_success_at = datetime.now(UTC)
        source.last_error = None

        log_action(
            db,
            dealership_id=dealership_id,
            action="inventory_source.sync",
            entity_type="inventory_source",
            entity_id=source.id,
            metadata={
                "sync_run_id": str(run.id),
                "vehicles_imported": upsert_result.processed,
                "vehicles_created": upsert_result.created,
                "vehicles_updated": upsert_result.updated,
                "vehicles_off_lot": upsert_result.off_lot,
            },
        )

        result = InventorySyncResult(
            success=True,
            vehicles_imported=upsert_result.processed,
            vehicles_created=upsert_result.created,
            vehicles_updated=upsert_result.updated,
            vehicles_off_lot=upsert_result.off_lot,
            sync_run_id=run.id,
        )
    except Exception as exc:
        run.status = "failure"
        run.error_message = str(exc)
        source.last_error = str(exc)

        log_action(
            db,
            dealership_id=dealership_id,
            action="inventory_source.sync_failed",
            entity_type="inventory_source",
            entity_id=source.id,
            metadata={"error": str(exc), "sync_run_id": str(run.id)},
        )

        result = InventorySyncResult(
            success=False,
            vehicles_imported=0,
            vehicles_created=0,
            vehicles_updated=0,
            vehicles_off_lot=0,
            sync_run_id=run.id,
            error=str(exc),
        )
    finally:
        finished_at = datetime.now(UTC)
        run.finished_at = finished_at
        source.last_sync_at = finished_at

    db.commit()
    db.refresh(run)
    db.refresh(source)
    return result


def list_sync_runs(
    db: Session, dealership_id: uuid.UUID, source_id: uuid.UUID, *, limit: int = 20
) -> list[InventorySyncRun]:
    inventory_source_service.get_inventory_source(db, dealership_id, source_id)
    stmt = (
        select(InventorySyncRun)
        .where(
            InventorySyncRun.dealership_id == dealership_id,
            InventorySyncRun.inventory_source_id == source_id,
        )
        .order_by(InventorySyncRun.started_at.desc())
        .limit(limit)
    )
    return list(db.scalars(stmt).all())
