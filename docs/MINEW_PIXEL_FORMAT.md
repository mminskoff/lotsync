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

## Transport

See **`docs/MINEW_MQTT_INTEGRATION.md`** for the full gateway protocol.

`MinewMqttTransport` publishes to `Mqtt/GateWay/<GATEWAY_MAC>/Command`:

| Env var | Purpose |
|---|---|
| `MQTT_HOST` | Gateway/broker IP (e.g. `192.168.99.1`) |
| `MQTT_PORT` | Default `1883` |
| `MQTT_USERNAME` / `MQTT_PASSWORD` | Broker auth if required |
| `GATEWAY_MAC` | G1-E MAC without colons (e.g. `FC233FC2B7C2`) |
| `ESL_TAG_MAC` | Pilot tag BLE MAC (fallback when not in DB) |

Downlink envelope:

```json
{
  "msg": "dData",
  "mac": "<TAG_BLE_MAC>",
  "seq": 1,
  "auth1": "00000000",
  "dType": "ascii",
  "data": "<JENGINE_02_HEX>"
}
```

**Tag BLE MAC** must be in `esl_devices.provider_device_id` (not the `E100…` barcode ID).

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
