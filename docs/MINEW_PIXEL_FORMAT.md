# Minew Pixel Format (LotSync)

LotSync renders dealer labels to Minew-compatible pixel buffers before transport. Encoders live in `apps/api/app/adapters/rendering/minew_pixel.py` and are invoked by `MinewRenderer`.

## Supported panels

| Mode | Colors | Bytes | Packing |
|---|---|---|---|
| **BWRY** | Black, white, yellow, red | `(width × height) ÷ 4` | 4 pixels/byte, outer **x**, inner **y** (top→bottom) |
| **BWR** | Black, white, red | `2 × ceil(width × padded_height ÷ 8)` | Separate BW + red bit planes, MSB-first |
| **E6** | 6-color palette | `(width × height) ÷ 2` | 2 pixels/byte, outer **x**, inner **y** |

Height constraints:

- **BWRY:** rows pad to a multiple of 4 with white (e.g. 250×122 → 7,750 bytes).
- **BWR:** height padded to multiple of 8 per plane.
- **E6:** height must be divisible by 2.

## BWRY nibble order

For each column `x`, pixels at `y, y+1, y+2, y+3` pack into one byte:

```
byte = (p0 << 6) | (p1 << 4) | (p2 << 2) | p3
```

Codes: black `0x00`, white `0x01`, yellow `0x02`, red `0x03`.

## Pilot tag (E100000A1525)

| Field | Value |
|---|---|
| Model | 4.2-BWRY |
| Resolution | 400×300 |
| Expected buffer | **30,000 bytes** |
| Renderer format | `minew_bwry` |

## Color mode inference

`infer_minew_color_mode(model)` maps ESL `model` strings:

- `*BWRY*` → BWRY
- `*BWR*` or `*-BW-*` → BWR
- `*E6*` / `*6-COLOR*` → E6

Used by `label_payload_service.build_device_profile()` when `device_config.color_mode` is absent.

## RenderedLabel payload

`MinewRenderer` returns:

```json
{
  "encoding": "bwry",
  "color_mode": "BWRY",
  "data_b64": "<base64 pixel buffer>",
  "byte_length": 30000,
  "device_id_hint": "4.2-BWRY"
}
```

## Transport (pending Minew docs)

`MinewMqttTransport` publishes a JSON envelope to `MINEW_MQTT_TOPIC` once configured:

| Env var | Purpose |
|---|---|
| `MINEW_MQTT_HOST` | Broker hostname (gateway or LAN broker) |
| `MINEW_MQTT_PORT` | Default `1883` |
| `MINEW_MQTT_TOPIC` | Publish topic from Minew integration doc |
| `MINEW_JENGINE_COMMAND` | Jengine command id (default `42` = image refresh) |

Placeholder message shape:

```json
{
  "command": "42",
  "device_id": "E100000A1525",
  "encoding": "bwry",
  "color_mode": "BWRY",
  "width": 400,
  "height": 300,
  "data_b64": "...",
  "metadata": {}
}
```

**Blocked:** exact topic, field names, and binary vs base64 encoding until Minew replies. Do not enable `TRANSPORT_ADAPTER=minew_mqtt` in production until validated against the gateway.

## Adapters

| Setting | Value |
|---|---|
| `RENDERER_ADAPTER` | `minew` |
| `TRANSPORT_ADAPTER` | `minew` or `minew_mqtt` |

Registry aliases: `get_renderer_adapter("minew")`, `get_transport_adapter("minew")`.

## References

- Minew BWRY Screen Data Format V1.0
- Minew BWR Screen Data Format V1.1
- Minew 6-color Screen Data Format V1.0
