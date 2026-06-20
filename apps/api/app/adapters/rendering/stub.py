import logging

from app.adapters.rendering.base import RendererAdapter
from app.schemas.label import DeviceProfile, LabelPayload, RenderedLabel

logger = logging.getLogger(__name__)


class StubRenderer(RendererAdapter):
    """M8 stub — logs label content and returns a JSON representation."""

    def render(self, payload: LabelPayload, device_profile: DeviceProfile) -> RenderedLabel:
        logger.info(
            "StubRenderer: vin=%s price=%s device=%s %dx%d",
            payload.vin,
            payload.price,
            device_profile.model,
            device_profile.width,
            device_profile.height,
        )
        return RenderedLabel(
            format="json_stub",
            payload={
                "vin": payload.vin,
                "stock_number": payload.stock_number,
                "price": payload.price,
                "year": payload.year,
                "make": payload.make,
                "model": payload.model,
                "trim": payload.trim,
                "mileage": payload.mileage,
                "status": payload.status,
                "qr_url": payload.qr_url,
                "disclaimer": payload.disclaimer,
                "device": {
                    "provider": device_profile.provider,
                    "model": device_profile.model,
                    "width": device_profile.width,
                    "height": device_profile.height,
                    "color_mode": device_profile.color_mode,
                },
            },
            width=device_profile.width,
            height=device_profile.height,
        )
