# Gateway Transport Strategy

## Purpose

LotSync should communicate with ESL gateways through a transport abstraction.

The transport layer is responsible for delivering rendered payloads to physical ESL devices.

## Core Architecture

LabelPayload
    ↓
RendererAdapter
    ↓
RenderedPayload
    ↓
TransportAdapter
    ↓
Gateway
    ↓
ESL

## TransportAdapter Interface

```python
class TransportAdapter:
    async def push_label(
        self,
        device_id: str,
        rendered_payload: bytes | dict,
        metadata: dict
    ) -> dict:
        pass

    async def get_gateway_status(self, gateway_id: str) -> dict:
        pass

    async def get_device_status(self, device_id: str) -> dict:
        pass

    async def retry_push(self, sync_event_id: str) -> dict:
        pass
```

## Minew Local Transport

Preferred MVP path:

LotSync Cloud
    ↓
LotSync Gateway Connector / Local Agent
    ↓
Minew Gateway LAN API / Local MQTT / Local HTTP
    ↓
ESL Tags

## Local Agent Option

A future dealership-local agent may run on:
- small PC
- Raspberry Pi
- dealership server
- Docker container
- gateway-adjacent appliance

Responsibilities:
- communicate with Minew gateway over LAN
- receive jobs from LotSync cloud
- queue updates if internet is down
- report gateway/device status
- push rendered payloads locally

## Cloud Dependency Rule

Minew cloud should not be required for core LotSync operation if local/on-prem APIs are available.

Minew cloud may be used only as a fallback or early testing shortcut.
