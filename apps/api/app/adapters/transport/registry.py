from app.adapters.transport.base import TransportAdapter
from app.adapters.transport.minew_mqtt import MinewMqttTransport
from app.adapters.transport.stub import StubTransport

_TRANSPORTS: dict[str, TransportAdapter] = {
    "stub": StubTransport(),
    "minew": MinewMqttTransport(),
    "minew_mqtt": MinewMqttTransport(),
}


def get_transport_adapter(name: str = "stub") -> TransportAdapter:
    adapter = _TRANSPORTS.get(name.lower())
    if adapter is None:
        supported = ", ".join(sorted(_TRANSPORTS))
        raise ValueError(f"Unsupported transport '{name}'. Supported: {supported}")
    return adapter
