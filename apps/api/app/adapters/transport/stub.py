import logging

from app.adapters.transport.base import TransportAdapter
from app.core.config import settings
from app.schemas.label import RenderedLabel, TransportPushResult

logger = logging.getLogger(__name__)


class StubTransport(TransportAdapter):
    """M8 stub — logs push attempts and always reports success."""

    def push_label(
        self,
        device_id: str,
        rendered: RenderedLabel,
        metadata: dict | None = None,
    ) -> TransportPushResult:
        if settings.stub_transport_fail:
            logger.warning("StubTransport: simulated failure for device_id=%s", device_id)
            return TransportPushResult(
                success=False,
                device_id=device_id,
                error="Stub transport simulated failure",
            )

        logger.info(
            "StubTransport: device_id=%s format=%s metadata=%s",
            device_id,
            rendered.format,
            metadata or {},
        )
        return TransportPushResult(
            success=True,
            device_id=device_id,
            provider_response={
                "adapter": "stub",
                "format": rendered.format,
                "accepted": True,
            },
        )
