import base64
import uuid

from sqlalchemy.orm import Session

from app.adapters.rendering import get_renderer_adapter
from app.models.esl_device import ESLDevice
from app.schemas.label import DeviceProfile, LabelPayload
from app.services.label_payload_service import (
    build_device_profile,
    build_label_payload,
    build_sync_label,
    get_esl_device,
    get_vehicle,
)
from app.services.sync_enqueue_service import get_active_assignment_for_vehicle

# Dashboard previews render at 2× ESL resolution for readable typography
PREVIEW_DISPLAY_WIDTH = 800
PREVIEW_DISPLAY_HEIGHT = 480


def _default_profile() -> DeviceProfile:
    return DeviceProfile(
        provider="preview",
        model="default",
        width=PREVIEW_DISPLAY_WIDTH,
        height=PREVIEW_DISPLAY_HEIGHT,
        color_mode="BW",
        supports_qr=True,
    )


def _profile_for_display(profile: DeviceProfile) -> DeviceProfile:
    """Scale to a large canvas so dashboard previews have bold, readable type."""
    aspect = profile.width / profile.height if profile.height else 4 / 3
    if aspect >= 1.2:
        width = PREVIEW_DISPLAY_WIDTH
        height = max(int(width / aspect), 200)
    else:
        height = PREVIEW_DISPLAY_HEIGHT
        width = max(int(height * aspect), 200)
    return profile.model_copy(update={"width": width, "height": height})


def resolve_label_context(
    db: Session,
    dealership_id: uuid.UUID,
    vehicle_id: uuid.UUID,
    *,
    esl_device_id: uuid.UUID | None = None,
) -> tuple[LabelPayload, DeviceProfile]:
    vehicle = get_vehicle(db, dealership_id, vehicle_id)

    device: ESLDevice | None = None
    if esl_device_id is not None:
        device = get_esl_device(db, dealership_id, esl_device_id)
    else:
        assignment = get_active_assignment_for_vehicle(db, dealership_id, vehicle_id)
        if assignment is not None:
            device = db.get(ESLDevice, assignment.esl_device_id)

    if device is not None:
        return build_sync_label(vehicle, device)

    return build_label_payload(vehicle), _default_profile()


def render_vehicle_label_png(
    db: Session,
    dealership_id: uuid.UUID,
    vehicle_id: uuid.UUID,
    *,
    esl_device_id: uuid.UUID | None = None,
) -> bytes:
    payload, profile = resolve_label_context(
        db, dealership_id, vehicle_id, esl_device_id=esl_device_id
    )
    display_profile = _profile_for_display(profile)
    renderer = get_renderer_adapter("preview")
    rendered = renderer.render(payload, display_profile)
    if rendered.format != "png" or not isinstance(rendered.payload, str):
        raise ValueError("Preview renderer did not return PNG data")
    return base64.b64decode(rendered.payload)
