import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.assignment import VehicleESLAssignment
from app.models.dealership import Dealership
from app.models.esl_device import ESLDevice
from app.models.sync_event import SyncEvent
from app.models.vehicle import Vehicle
from app.schemas.pairing import (
    ActivePairingsResponse,
    AssignmentSummary,
    DeviceLookupResponse,
    ESLDevicePairingSummary,
    PairingCreateRequest,
    PairingReassignRequest,
    PairingResponse,
    PushLabelResponse,
    SyncEventSummary,
    UnpairResponse,
    VehicleLookupResponse,
    VehiclePairingSummary,
    VinAssignmentResponse,
)
from app.services.audit_service import log_action
from app.services.dealership_service import get_dealership

ACTIVE = "active"
INACTIVE = "inactive"
SYNC_PENDING = "PENDING"
VEHICLE_SYNC_PENDING = "PENDING"
VEHICLE_SYNC_UNASSIGNED = "TAG_UNASSIGNED"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _dealership_scope(dealership: Dealership) -> dict[str, Any]:
    return {
        "organization_id": dealership.organization_id,
        "dealership_id": dealership.id,
    }


def _vehicle_summary(vehicle: Vehicle) -> VehiclePairingSummary:
    return VehiclePairingSummary.model_validate(vehicle)


def _device_summary(device: ESLDevice) -> ESLDevicePairingSummary:
    return ESLDevicePairingSummary.model_validate(device)


def _sync_event_summary(event: SyncEvent) -> SyncEventSummary:
    return SyncEventSummary(
        id=event.id,
        event_type=event.event_type,
        status=event.status,
        created_at=event.created_at,
    )


def _get_vehicle_by_vin(db: Session, dealership_id: uuid.UUID, vin: str) -> Vehicle:
    normalized_vin = vin.strip().upper()
    stmt = select(Vehicle).where(
        Vehicle.dealership_id == dealership_id,
        Vehicle.vin == normalized_vin,
    )
    vehicle = db.scalar(stmt)
    if vehicle is None:
        raise HTTPException(status_code=404, detail="Vehicle not found for VIN")
    return vehicle


def _get_device_by_code(db: Session, dealership_id: uuid.UUID, device_code: str) -> ESLDevice:
    stmt = select(ESLDevice).where(
        ESLDevice.dealership_id == dealership_id,
        ESLDevice.device_id == device_code.strip(),
    )
    device = db.scalar(stmt)
    if device is None:
        raise HTTPException(status_code=404, detail="ESL device not found for code")
    return device


def _get_active_assignment(
    db: Session,
    dealership_id: uuid.UUID,
    *,
    vehicle_id: uuid.UUID | None = None,
    esl_device_id: uuid.UUID | None = None,
) -> VehicleESLAssignment | None:
    stmt = select(VehicleESLAssignment).where(
        VehicleESLAssignment.dealership_id == dealership_id,
        VehicleESLAssignment.status == ACTIVE,
        VehicleESLAssignment.unassigned_at.is_(None),
    )
    if vehicle_id is not None:
        stmt = stmt.where(VehicleESLAssignment.vehicle_id == vehicle_id)
    if esl_device_id is not None:
        stmt = stmt.where(VehicleESLAssignment.esl_device_id == esl_device_id)
    return db.scalar(stmt)


def _build_assignment_summary(
    db: Session, assignment: VehicleESLAssignment
) -> AssignmentSummary:
    vehicle = db.get(Vehicle, assignment.vehicle_id)
    device = db.get(ESLDevice, assignment.esl_device_id)
    if vehicle is None or device is None:
        raise HTTPException(status_code=500, detail="Assignment references missing entities")

    return AssignmentSummary(
        id=assignment.id,
        status=assignment.status,
        assignment_source=assignment.assignment_source,
        scan_type=assignment.scan_type,
        nfc_uid=assignment.nfc_uid,
        assigned_at=assignment.assigned_at,
        unassigned_at=assignment.unassigned_at,
        vehicle=_vehicle_summary(vehicle),
        device=_device_summary(device),
    )


def _deactivate_assignment(assignment: VehicleESLAssignment) -> None:
    assignment.status = INACTIVE
    assignment.unassigned_at = _now()


def _create_sync_event(
    db: Session,
    *,
    dealership_id: uuid.UUID,
    vehicle_id: uuid.UUID,
    esl_device_id: uuid.UUID,
    event_type: str,
    new_value: dict[str, Any] | None = None,
) -> SyncEvent:
    event = SyncEvent(
        id=uuid.uuid4(),
        dealership_id=dealership_id,
        vehicle_id=vehicle_id,
        esl_device_id=esl_device_id,
        event_type=event_type,
        status=SYNC_PENDING,
        new_value=new_value,
    )
    db.add(event)
    db.flush()
    return event


def _pairing_audit_metadata(
    *,
    vin: str,
    device_code: str,
    assignment_source: str,
    scan_type: str | None,
    nfc_uid: str | None,
    vehicle_id: uuid.UUID,
    esl_device_id: uuid.UUID,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    metadata: dict[str, Any] = {
        "vin": vin,
        "device_code": device_code,
        "assignment_source": assignment_source,
        "scan_type": scan_type,
        "nfc_uid": nfc_uid,
        "vehicle_id": str(vehicle_id),
        "esl_device_id": str(esl_device_id),
    }
    if extra:
        metadata.update(extra)
    return metadata


def _resolve_conflicts(
    db: Session,
    dealership_id: uuid.UUID,
    vehicle: Vehicle,
    device: ESLDevice,
    force_reassign: bool,
) -> tuple[list[VehicleESLAssignment], list[str]]:
    warnings: list[str] = []
    to_deactivate: list[VehicleESLAssignment] = []

    vehicle_assignment = _get_active_assignment(
        db, dealership_id, vehicle_id=vehicle.id
    )
    device_assignment = _get_active_assignment(
        db, dealership_id, esl_device_id=device.id
    )

    if (
        vehicle_assignment is not None
        and device_assignment is not None
        and vehicle_assignment.id == device_assignment.id
    ):
        return [], warnings

    if vehicle_assignment is not None and vehicle_assignment.esl_device_id != device.id:
        if not force_reassign:
            other = db.get(ESLDevice, vehicle_assignment.esl_device_id)
            code = other.device_id if other else "unknown"
            raise HTTPException(
                status_code=409,
                detail=f"Vehicle already paired to ESL device {code}",
            )
        to_deactivate.append(vehicle_assignment)
        warnings.append(f"Vehicle was paired to {vehicle_assignment.esl_device_id}")

    if device_assignment is not None and device_assignment.vehicle_id != vehicle.id:
        if not force_reassign:
            other = db.get(Vehicle, device_assignment.vehicle_id)
            other_vin = other.vin if other else "unknown"
            raise HTTPException(
                status_code=409,
                detail=f"ESL device already paired to VIN {other_vin}",
            )
        if device_assignment not in to_deactivate:
            to_deactivate.append(device_assignment)
        warnings.append(f"Device was paired to {device_assignment.vehicle_id}")

    return to_deactivate, warnings


def lookup_vehicle_by_vin(
    db: Session, dealership_id: uuid.UUID, vin: str
) -> VehicleLookupResponse:
    dealership = get_dealership(db, dealership_id)
    vehicle = _get_vehicle_by_vin(db, dealership_id, vin)
    active = _get_active_assignment(db, dealership_id, vehicle_id=vehicle.id)
    warnings: list[str] = []
    if active is not None:
        warnings.append("Vehicle has an active ESL assignment")

    return VehicleLookupResponse(
        **_dealership_scope(dealership),
        vehicle=_vehicle_summary(vehicle),
        active_assignment=_build_assignment_summary(db, active) if active else None,
        warnings=warnings,
    )


def lookup_device_by_code(
    db: Session, dealership_id: uuid.UUID, device_code: str
) -> DeviceLookupResponse:
    dealership = get_dealership(db, dealership_id)
    device = _get_device_by_code(db, dealership_id, device_code)
    active = _get_active_assignment(db, dealership_id, esl_device_id=device.id)
    warnings: list[str] = []
    if active is not None:
        warnings.append("ESL device has an active vehicle assignment")

    return DeviceLookupResponse(
        **_dealership_scope(dealership),
        device=_device_summary(device),
        active_assignment=_build_assignment_summary(db, active) if active else None,
        warnings=warnings,
    )


def _commit_pairing(
    db: Session,
    dealership: Dealership,
    vehicle: Vehicle,
    device: ESLDevice,
    data: PairingCreateRequest | PairingReassignRequest,
    *,
    action: str,
    response_status: str,
    vin: str,
) -> PairingResponse:
    to_deactivate, _ = _resolve_conflicts(
        db,
        dealership.id,
        vehicle,
        device,
        data.force_reassign,
    )

    for assignment in to_deactivate:
        _deactivate_assignment(assignment)

    existing = _get_active_assignment(
        db,
        dealership.id,
        vehicle_id=vehicle.id,
        esl_device_id=device.id,
    )
    if existing is not None:
        sync_event = _create_sync_event(
            db,
            dealership_id=dealership.id,
            vehicle_id=vehicle.id,
            esl_device_id=device.id,
            event_type="pairing.assign",
            new_value={"vin": vin, "device_code": data.device_code},
        )
        vehicle.sync_status = VEHICLE_SYNC_PENDING
        log_action(
            db,
            dealership_id=dealership.id,
            action=action,
            entity_type="vehicle_esl_assignment",
            entity_id=existing.id,
            metadata=_pairing_audit_metadata(
                vin=vin,
                device_code=data.device_code,
                assignment_source=data.assignment_source,
                scan_type=data.scan_type,
                nfc_uid=data.nfc_uid,
                vehicle_id=vehicle.id,
                esl_device_id=device.id,
                extra={"note": "already_paired"},
            ),
        )
        log_action(
            db,
            dealership_id=dealership.id,
            action="sync_event.create",
            entity_type="sync_event",
            entity_id=sync_event.id,
            metadata={"event_type": sync_event.event_type, "status": sync_event.status},
        )
        db.commit()
        db.refresh(existing)
        db.refresh(vehicle)
        db.refresh(device)
        return PairingResponse(
            **_dealership_scope(dealership),
            assignment_id=existing.id,
            status=response_status,  # type: ignore[arg-type]
            vehicle=_vehicle_summary(vehicle),
            device=_device_summary(device),
            sync_event=_sync_event_summary(sync_event),
            assignment_source=existing.assignment_source,
            scan_type=existing.scan_type,
            nfc_uid=existing.nfc_uid,
        )

    assignment = VehicleESLAssignment(
        id=uuid.uuid4(),
        dealership_id=dealership.id,
        vehicle_id=vehicle.id,
        esl_device_id=device.id,
        assignment_source=data.assignment_source,
        scan_type=data.scan_type,
        nfc_uid=data.nfc_uid,
        status=ACTIVE,
    )
    db.add(assignment)
    db.flush()

    vehicle.sync_status = VEHICLE_SYNC_PENDING
    sync_event = _create_sync_event(
        db,
        dealership_id=dealership.id,
        vehicle_id=vehicle.id,
        esl_device_id=device.id,
        event_type="pairing.assign",
        new_value={"vin": vin, "device_code": data.device_code},
    )

    audit_metadata = _pairing_audit_metadata(
        vin=vin,
        device_code=data.device_code,
        assignment_source=data.assignment_source,
        scan_type=data.scan_type,
        nfc_uid=data.nfc_uid,
        vehicle_id=vehicle.id,
        esl_device_id=device.id,
    )
    if to_deactivate:
        audit_metadata["deactivated_assignment_ids"] = [str(a.id) for a in to_deactivate]

    log_action(
        db,
        dealership_id=dealership.id,
        action=action,
        entity_type="vehicle_esl_assignment",
        entity_id=assignment.id,
        metadata=audit_metadata,
    )
    log_action(
        db,
        dealership_id=dealership.id,
        action="sync_event.create",
        entity_type="sync_event",
        entity_id=sync_event.id,
        metadata={"event_type": sync_event.event_type, "status": sync_event.status},
    )

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Active assignment conflict — retry with force_reassign=true",
        ) from exc

    db.refresh(assignment)
    db.refresh(vehicle)
    db.refresh(device)
    return PairingResponse(
        **_dealership_scope(dealership),
        assignment_id=assignment.id,
        status=response_status,  # type: ignore[arg-type]
        vehicle=_vehicle_summary(vehicle),
        device=_device_summary(device),
        sync_event=_sync_event_summary(sync_event),
        assignment_source=assignment.assignment_source,
        scan_type=assignment.scan_type,
        nfc_uid=assignment.nfc_uid,
    )


def pair_vehicle_to_device(
    db: Session, dealership_id: uuid.UUID, data: PairingCreateRequest
) -> PairingResponse:
    dealership = get_dealership(db, dealership_id)
    vehicle = _get_vehicle_by_vin(db, dealership_id, data.vin)
    device = _get_device_by_code(db, dealership_id, data.device_code)
    return _commit_pairing(
        db,
        dealership,
        vehicle,
        device,
        data,
        action="pairing.create",
        response_status="paired",
        vin=data.vin,
    )


def reassign_device(
    db: Session, dealership_id: uuid.UUID, data: PairingReassignRequest
) -> PairingResponse:
    dealership = get_dealership(db, dealership_id)
    vehicle = _get_vehicle_by_vin(db, dealership_id, data.new_vin)
    device = _get_device_by_code(db, dealership_id, data.device_code)
    return _commit_pairing(
        db,
        dealership,
        vehicle,
        device,
        data,
        action="pairing.reassign",
        response_status="reassigned",
        vin=data.new_vin,
    )


def unpair_assignment(
    db: Session, dealership_id: uuid.UUID, assignment_id: uuid.UUID
) -> UnpairResponse:
    dealership = get_dealership(db, dealership_id)
    assignment = db.get(VehicleESLAssignment, assignment_id)
    if assignment is None or assignment.dealership_id != dealership_id:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if assignment.status != ACTIVE or assignment.unassigned_at is not None:
        raise HTTPException(status_code=409, detail="Assignment is not active")

    vehicle = db.get(Vehicle, assignment.vehicle_id)
    device = db.get(ESLDevice, assignment.esl_device_id)
    if vehicle is None or device is None:
        raise HTTPException(status_code=500, detail="Assignment references missing entities")

    _deactivate_assignment(assignment)
    vehicle.sync_status = VEHICLE_SYNC_UNASSIGNED

    sync_event = _create_sync_event(
        db,
        dealership_id=dealership_id,
        vehicle_id=vehicle.id,
        esl_device_id=device.id,
        event_type="pairing.unassign",
        new_value={"vin": vehicle.vin, "device_code": device.device_id},
    )

    log_action(
        db,
        dealership_id=dealership_id,
        action="pairing.unpair",
        entity_type="vehicle_esl_assignment",
        entity_id=assignment.id,
        metadata={
            "vin": vehicle.vin,
            "device_code": device.device_id,
            "assignment_source": assignment.assignment_source,
        },
    )
    log_action(
        db,
        dealership_id=dealership_id,
        action="sync_event.create",
        entity_type="sync_event",
        entity_id=sync_event.id,
        metadata={"event_type": sync_event.event_type, "status": sync_event.status},
    )
    db.commit()
    db.refresh(assignment)
    db.refresh(vehicle)
    db.refresh(device)

    return UnpairResponse(
        **_dealership_scope(dealership),
        assignment_id=assignment.id,
        status="unpaired",
        unassigned_at=assignment.unassigned_at,  # type: ignore[arg-type]
        vehicle=_vehicle_summary(vehicle),
        device=_device_summary(device),
        sync_event=_sync_event_summary(sync_event),
    )


def list_active_pairings(
    db: Session, dealership_id: uuid.UUID
) -> ActivePairingsResponse:
    dealership = get_dealership(db, dealership_id)
    stmt = (
        select(VehicleESLAssignment)
        .where(
            VehicleESLAssignment.dealership_id == dealership_id,
            VehicleESLAssignment.status == ACTIVE,
            VehicleESLAssignment.unassigned_at.is_(None),
        )
        .order_by(VehicleESLAssignment.assigned_at.desc())
    )
    assignments = list(db.scalars(stmt).all())
    return ActivePairingsResponse(
        **_dealership_scope(dealership),
        pairings=[_build_assignment_summary(db, a) for a in assignments],
    )


def get_assignment_by_vin(
    db: Session, dealership_id: uuid.UUID, vin: str
) -> VinAssignmentResponse:
    dealership = get_dealership(db, dealership_id)
    vehicle = _get_vehicle_by_vin(db, dealership_id, vin)
    active = _get_active_assignment(db, dealership_id, vehicle_id=vehicle.id)
    return VinAssignmentResponse(
        **_dealership_scope(dealership),
        active_assignment=_build_assignment_summary(db, active) if active else None,
    )


def push_label_for_vehicle(
    db: Session, dealership_id: uuid.UUID, vehicle_id: uuid.UUID
) -> PushLabelResponse:
    dealership = get_dealership(db, dealership_id)
    vehicle = db.get(Vehicle, vehicle_id)
    if vehicle is None or vehicle.dealership_id != dealership_id:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    active = _get_active_assignment(db, dealership_id, vehicle_id=vehicle.id)
    if active is None:
        raise HTTPException(
            status_code=409,
            detail="Vehicle has no active ESL assignment — pair a tag first",
        )

    device = db.get(ESLDevice, active.esl_device_id)
    if device is None:
        raise HTTPException(status_code=500, detail="Assignment references missing device")

    vehicle.sync_status = VEHICLE_SYNC_PENDING
    sync_event = _create_sync_event(
        db,
        dealership_id=dealership_id,
        vehicle_id=vehicle.id,
        esl_device_id=device.id,
        event_type="label.push",
        new_value={"vin": vehicle.vin, "device_code": device.device_id},
    )
    log_action(
        db,
        dealership_id=dealership_id,
        action="sync_event.create",
        entity_type="sync_event",
        entity_id=sync_event.id,
        metadata={
            "event_type": sync_event.event_type,
            "status": sync_event.status,
            "trigger": "manual_push",
        },
    )
    db.commit()
    db.refresh(sync_event)

    return PushLabelResponse(
        **_dealership_scope(dealership),
        vehicle_id=vehicle.id,
        sync_event=_sync_event_summary(sync_event),
    )
