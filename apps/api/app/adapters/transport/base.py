from abc import ABC, abstractmethod

from app.schemas.label import RenderedLabel, TransportPushResult


class TransportAdapter(ABC):
    """Delivers a rendered label to an ESL gateway or hardware provider."""

    @abstractmethod
    def push_label(
        self,
        device_id: str,
        rendered: RenderedLabel,
        metadata: dict | None = None,
    ) -> TransportPushResult:
        pass
