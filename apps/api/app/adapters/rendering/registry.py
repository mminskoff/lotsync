from app.adapters.rendering.base import RendererAdapter
from app.adapters.rendering.stub import StubRenderer

_RENDERERS: dict[str, RendererAdapter] = {
    "stub": StubRenderer(),
}


def get_renderer_adapter(name: str = "stub") -> RendererAdapter:
    adapter = _RENDERERS.get(name.lower())
    if adapter is None:
        supported = ", ".join(sorted(_RENDERERS))
        raise ValueError(f"Unsupported renderer '{name}'. Supported: {supported}")
    return adapter
