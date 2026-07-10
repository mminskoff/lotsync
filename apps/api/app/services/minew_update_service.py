"""Minew label render, encode, MQTT publish, and job tracking."""

from __future__ import annotations

import base64
import uuid
from datetime import UTC, datetime
from pathlib import Path

from PIL import Image, ImageDraw
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.adapters.rendering.label_fonts import load_font
from app.adapters.rendering.label_layouts import render_label
from app.adapters.rendering.minew import MinewRenderer, resolve_minew_color_mode
from app.adapters.rendering.minew_pixel import encode_minew_pixels, infer_minew_panel_flip_horizontal, infer_minew_panel_rotation
from app.adapters.transport.minew_jengine import (
    normalize_esl_mqtt_mac,
    normalize_mac,
    resolve_tag_mac,
)
from app.adapters.transport.minew_mqtt import build_mqtt_artifact
from app.adapters.transport.minew_mqtt_client import get_minew_mqtt_client
from app.core.config import settings
from app.models.esl_device import ESLDevice
from app.models.esl_update_job import ESLUpdateJob
from app.models.vehicle import Vehicle
from app.schemas.esl_update import (
    ESLStatusResponse,
    ESLUpdateJobResponse,
    RenderLabelResponse,
    SendToEslResponse,
    TestUpdateRequest,
    TestUpdateResponse,
)
from app.schemas.label import DeviceProfile
from app.services.label_payload_service import build_sync_label, get_esl_device, get_vehicle
from app.services.sync_enqueue_service import get_active_assignment_for_vehicle

JOB_OUTPUT_DIR = Path("tmp/minew-jobs")


def _job_dir(job_id: uuid.UUID) -> Path:
    path = JOB_OUTPUT_DIR / str(job_id)
    path.mkdir(parents=True, exist_ok=True)
    return path


def _encode_for_mqtt(pixel_bytes: bytes, *, width: int, height: int, tag_mac: str) -> str:
    return build_mqtt_artifact(pixel_bytes, width=width, height=height, tag_mac=tag_mac)


def render_test_image(
    *,
    width: int,
    height: int,
    price: str = "$32,995",
) -> Image.Image:
    image = Image.new("RGB", (width, height), (255, 255, 255))
    draw = ImageDraw.Draw(image)
    title_font = load_font(max(int(height * 0.12), 24), weight="bold")
    body_font = load_font(max(int(height * 0.06), 16))
    timestamp = datetime.now(UTC).strftime("%Y-%m-%d %H:%M UTC")

    draw.text((int(width * 0.08), int(height * 0.18)), "TEST UPDATE", fill=(0, 0, 0), font=title_font)
    draw.text((int(width * 0.08), int(height * 0.38)), f"price: {price}", fill=(200, 0, 0), font=body_font)
    draw.text((int(width * 0.08), int(height * 0.52)), timestamp, fill=(0, 0, 0), font=body_font)
    return image


def _resolve_gateway_mac(explicit: str | None = None) -> str:
    mac = normalize_mac(explicit or settings.gateway_mac)
    if not mac:
        raise ValueError("GATEWAY_MAC must be set (12 uppercase hex, no colons)")
    return mac


def _resolve_tag_mac_for_device(
    device: ESLDevice,
    *,
    explicit: str | None = None,
) -> str:
    mac = resolve_tag_mac(
        device_id=device.device_id,
        metadata={"provider_device_id": device.provider_device_id},
        provider_device_id=device.provider_device_id,
        fallback_tag_mac=explicit or settings.esl_tag_mac,
    )
    if not mac:
        raise ValueError(
            "Tag BLE MAC required — set ESL_TAG_MAC or esl_devices.provider_device_id"
        )
    return mac


def _create_job(
    db: Session,
    dealership_id: uuid.UUID,
    *,
    tag_mac: str,
    gateway_mac: str,
    vehicle_id: uuid.UUID | None = None,
    esl_device_id: uuid.UUID | None = None,
) -> ESLUpdateJob:
    job = ESLUpdateJob(
        id=uuid.uuid4(),
        dealership_id=dealership_id,
        vehicle_id=vehicle_id,
        esl_device_id=esl_device_id,
        tag_mac=tag_mac,
        gateway_mac=gateway_mac,
        status="pending",
    )
    db.add(job)
    db.flush()
    return job


def _save_render_artifacts(
    job: ESLUpdateJob,
    image: Image.Image,
    pixel_bytes: bytes,
    encoded_data: str,
) -> tuple[str, str]:
    out_dir = _job_dir(job.id)
    image_path = out_dir / "label.png"
    bin_path = out_dir / "pixels.bin"
    encoded_path = out_dir / "mqtt-data.txt"
    image.save(image_path)
    bin_path.write_bytes(pixel_bytes)
    encoded_path.write_text(encoded_data)
    job.image_path = str(image_path)
    job.encoded_payload_path = str(encoded_path)
    return str(image_path), str(encoded_path)


def render_vehicle_label(
    db: Session,
    dealership_id: uuid.UUID,
    vehicle_id: uuid.UUID,
    *,
    esl_device_id: uuid.UUID | None = None,
    persist_job: bool = False,
) -> RenderLabelResponse:
    vehicle = get_vehicle(db, dealership_id, vehicle_id)
    device: ESLDevice | None = None
    if esl_device_id is not None:
        device = get_esl_device(db, dealership_id, esl_device_id)
    else:
        assignment = get_active_assignment_for_vehicle(db, dealership_id, vehicle_id)
        if assignment is not None:
            device = db.get(ESLDevice, assignment.esl_device_id)

    if device is None:
        raise ValueError("Vehicle has no assigned ESL device — pair a tag first")

    payload, profile = build_sync_label(vehicle, device)
    image = render_label(payload, profile)
    if image.size != (profile.width, profile.height):
        image = image.resize((profile.width, profile.height))

    color_mode = resolve_minew_color_mode(profile)
    rotation = infer_minew_panel_rotation(profile.model)
    flip_horizontal = infer_minew_panel_flip_horizontal(profile.model)
    pixel_bytes = encode_minew_pixels(
        image, color_mode, rotation=rotation, flip_horizontal=flip_horizontal
    )
    tag_mac = _resolve_tag_mac_for_device(device)
    encoded_data = _encode_for_mqtt(
        pixel_bytes, width=profile.width, height=profile.height, tag_mac=tag_mac
    )

    job_id = None
    image_path = None
    encoded_payload_path = None
    if persist_job:
        job = _create_job(
            db,
            dealership_id,
            tag_mac=_resolve_tag_mac_for_device(device),
            gateway_mac=_resolve_gateway_mac(device.gateway_id),
            vehicle_id=vehicle_id,
            esl_device_id=device.id,
        )
        image_path, encoded_payload_path = _save_render_artifacts(
            job, image, pixel_bytes, encoded_data
        )
        job.status = "rendered"
        db.commit()
        job_id = job.id

    return RenderLabelResponse(
        job_id=job_id,
        vehicle_id=vehicle_id,
        esl_device_id=device.id,
        width=profile.width,
        height=profile.height,
        color_mode=color_mode,
        pixel_byte_length=len(pixel_bytes),
        encoded_data_length=len(encoded_data),
        image_path=image_path,
        encoded_payload_path=encoded_payload_path,
        encoded_data_preview=encoded_data[:64],
    )


def send_vehicle_to_esl(
    db: Session,
    dealership_id: uuid.UUID,
    vehicle_id: uuid.UUID,
    *,
    esl_device_id: uuid.UUID | None = None,
) -> SendToEslResponse:
    vehicle = get_vehicle(db, dealership_id, vehicle_id)
    device: ESLDevice | None = None
    if esl_device_id is not None:
        device = get_esl_device(db, dealership_id, esl_device_id)
    else:
        assignment = get_active_assignment_for_vehicle(db, dealership_id, vehicle_id)
        if assignment is None:
            raise ValueError("Vehicle has no active ESL assignment")
        device = db.get(ESLDevice, assignment.esl_device_id)
    if device is None:
        raise ValueError("ESL device not found")

    tag_mac = _resolve_tag_mac_for_device(device)
    gateway_mac = _resolve_gateway_mac(device.gateway_id)
    payload, profile = build_sync_label(vehicle, device)
    image = render_label(payload, profile)
    if image.size != (profile.width, profile.height):
        image = image.resize((profile.width, profile.height))

    color_mode = resolve_minew_color_mode(profile)
    rotation = infer_minew_panel_rotation(profile.model)
    flip_horizontal = infer_minew_panel_flip_horizontal(profile.model)
    pixel_bytes = encode_minew_pixels(
        image, color_mode, rotation=rotation, flip_horizontal=flip_horizontal
    )
    encoded_data = _encode_for_mqtt(
        pixel_bytes, width=profile.width, height=profile.height, tag_mac=tag_mac
    )

    job = _create_job(
        db,
        dealership_id,
        tag_mac=tag_mac,
        gateway_mac=gateway_mac,
        vehicle_id=vehicle_id,
        esl_device_id=device.id,
    )
    _save_render_artifacts(job, image, pixel_bytes, encoded_data)

    client = get_minew_mqtt_client()
    client.connect()
    client.subscribe_status()
    try:
        result = client.publish_label_update(
            gateway_mac,
            tag_mac,
            pixel_bytes,
            width=profile.width,
            height=profile.height,
        )
        job.status = "sent"
        job.sent_at = datetime.now(UTC)
        job.seq = int(result.get("seq") or result.get("req_id") or 0)
        job.gateway_response = result
        job.completed_at = datetime.now(UTC)
        db.commit()
    except OSError as exc:
        job.status = "failed"
        job.error_message = str(exc)
        job.completed_at = datetime.now(UTC)
        db.commit()
        raise

    return SendToEslResponse(
        job_id=job.id,
        status=job.status,
        tag_mac=tag_mac,
        gateway_mac=gateway_mac,
        topic=str(result["topic"]),
        seq=int(result.get("seq") or result.get("req_id") or 0),
        pixel_byte_length=len(pixel_bytes),
        encoded_data_length=len(encoded_data),
    )


def run_test_update(
    db: Session,
    dealership_id: uuid.UUID,
    body: TestUpdateRequest,
) -> TestUpdateResponse:
    gateway_mac = _resolve_gateway_mac(body.gateway_mac)
    tag_mac = normalize_esl_mqtt_mac(body.tag_mac or settings.esl_tag_mac)
    if not tag_mac:
        raise ValueError("ESL_TAG_MAC or tag_mac is required for test update")

    profile = DeviceProfile(
        provider="minew",
        model=f"4.2-{body.color_mode}" if body.width == 400 and body.height == 300 else f"test-{body.color_mode}",
        width=body.width,
        height=body.height,
        color_mode=body.color_mode,
    )
    image = render_test_image(width=body.width, height=body.height, price=body.price)
    color_mode = resolve_minew_color_mode(profile)
    rotation = infer_minew_panel_rotation(profile.model)
    flip_horizontal = infer_minew_panel_flip_horizontal(profile.model)
    pixel_bytes = encode_minew_pixels(
        image, color_mode, rotation=rotation, flip_horizontal=flip_horizontal
    )
    encoded_data = _encode_for_mqtt(
        pixel_bytes, width=body.width, height=body.height, tag_mac=tag_mac
    )

    job = _create_job(
        db,
        dealership_id,
        tag_mac=tag_mac,
        gateway_mac=gateway_mac,
    )
    image_path, encoded_path = _save_render_artifacts(job, image, pixel_bytes, encoded_data)

    client = get_minew_mqtt_client()
    client.connect()
    if body.subscribe:
        client.subscribe_status()

    result = client.publish_label_update(
        gateway_mac,
        tag_mac,
        pixel_bytes,
        width=body.width,
        height=body.height,
    )
    job.status = "sent"
    job.sent_at = datetime.now(UTC)
    job.seq = int(result.get("seq") or result.get("req_id") or 0)
    job.gateway_response = result
    job.completed_at = datetime.now(UTC)
    db.commit()

    return TestUpdateResponse(
        job_id=job.id,
        status=job.status,
        tag_mac=tag_mac,
        gateway_mac=gateway_mac,
        topic=str(result["topic"]),
        seq=int(result.get("seq") or result.get("req_id") or 0),
        color_mode=color_mode,
        width=body.width,
        height=body.height,
        image_path=image_path,
        encoded_payload_path=encoded_path,
    )


def get_esl_status(db: Session, dealership_id: uuid.UUID) -> ESLStatusResponse:
    client = get_minew_mqtt_client()
    jobs = db.scalars(
        select(ESLUpdateJob)
        .where(ESLUpdateJob.dealership_id == dealership_id)
        .order_by(ESLUpdateJob.created_at.desc())
        .limit(20)
    ).all()

    return ESLStatusResponse(
        mqtt_connected=client.connected,
        mqtt_subscribed=client.subscribed,
        gateway_mac=normalize_mac(settings.gateway_mac) or None,
        subscribe_topic=settings.minew_mqtt_subscribe_topic,
        recent_jobs=[ESLUpdateJobResponse.model_validate(job) for job in jobs],
        recent_gateway_messages=client.recent_messages(limit=50),
    )
