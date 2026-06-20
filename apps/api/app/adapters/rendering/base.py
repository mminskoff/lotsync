from abc import ABC, abstractmethod

from app.schemas.label import DeviceProfile, LabelPayload, RenderedLabel


class RendererAdapter(ABC):
    """Renders a LabelPayload into a provider-specific label artifact."""

    @abstractmethod
    def render(self, payload: LabelPayload, device_profile: DeviceProfile) -> RenderedLabel:
        pass
