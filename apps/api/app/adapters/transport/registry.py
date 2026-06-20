from app.adapters.transport.base import TransportAdapter
from app.adapters.transport.stub import StubTransport

_TRANSPORTS: dict[str, TransportAdapter] = {
    "stub": StubTransport(),
}


def get_transport_adapter(name: str = "stub") -> TransportAdapter:
    adapter = _TRANSPORTS.get(name.lower())
    if adapter is None:
        supported = ", ".join(sorted(_TRANSPORTS))
        raise ValueError(f"Unsupported transport '{name}'. Supported: {supported}")
    return adapter
