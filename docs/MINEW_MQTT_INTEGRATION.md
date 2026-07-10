# Minew G1-E MQTT Integration

LotSync pushes label updates to Minew ESL tags **through the gateway** — never direct to tags.

```
Inventory → Renderer → Pixel encoder → Jengine 02 → MQTT /gw/.../action → G1-E → BLE → Tag
```

Reference docs (Minew NDA, v3.7+): `minew-gateway-interface@en-overview.pdf`, `en-adv.pdf`, `en-jengine.pdf`, `en-extcmd-grapes.pdf`.

## Gateway (Dover pilot kit)

| Field | Value |
|---|---|
| Model | G1-E B6121 (g1-e-grapes firmware) |
| Label WiFi MAC | `FC:23:3F:C2:B7:C2` |
| **MQTT client ID / topics MAC** | `ac233fc267c2` → `AC233FC267C2` |
| Admin UI | `http://192.168.99.1` |
| Cloud broker | `ssl://hub.minewtag.com:9883` |
| Local broker (dev) | `tcp://<laptop-ip>:1883` |

## MQTT topics (jengine — default)

| Direction | Topic |
|---|---|
| Uplink (BLE adverts) | `/gw/ac233fc267c2/status` |
| Downlink (commands) | `/gw/ac233fc267c2/action` |
| Downlink responses | `/gw/ac233fc267c2/response` |
| Extension commands | `/gw/ac233fc267c2/action/cgic-*` |

Legacy `Mqtt/GateWay/{MAC}/Command` + `dData` is **not** used by grapes / JSON-PREPARSED gateways. Keep `MINEW_MQTT_DOWNLINK_FORMAT=ddata` only if Minew support confirms that path.

## Downlink envelope (jengine command 02)

Publish JSON to the **action** topic:

```json
{
  "action": 2,
  "version": 1,
  "method": "set_req",
  "req_id": 123,
  "payload": {
    "key": "<16_DIGIT_DEVICE_KEY>",
    "opcode": 45234,
    "single": true,
    "img_id": 21433,
    "images": [{
      "data": "<base64 ESL pixel buffer>",
      "screen": ["A"],
      "compress": "NONE",
      "refresh": true
    }],
    "details": {
      "e100000a1525": {}
    }
  }
}
```

| Field | Notes |
|---|---|
| `action` | `2` = image refresh |
| `method` | `set_req` |
| `payload.key` | 16-char BLE device key — **from Minew, not a placeholder** |
| `payload.details.{mac}` | Tag id **lowercase**, no colons (screen ID or BLE MAC — confirm with Minew) |
| `opcode` / `img_id` | New values each push; match `ds` uplink when refresh succeeds |
| `images.compress` | `NONE` or Minew-specific `RLE` |
| `images.data` | Base64 of ESL-native pixel buffer — **not PNG/JPG** |

Subscribe to **response** for stage-1 ack (`method: set_rsp`, `payload.code`). Confirm physical refresh via `ds` adverts on **status** (`img_id`, `opcode`, `error: 0`).

## Uplink (JSON-PREPARSED)

Self-hosted monitoring uses JSON-PREPARSED on `/gw/{mac}/status`:

```json
{
  "gw": "ac233fc267c2",
  "adv": [{
    "type": "ds",
    "mac": "e100000a1525",
    "img_id": 1782006065,
    "opcode": 1782006065,
    "error": 0,
    "single": true,
    "rssi": -70
  }]
}
```

**Minew cloud** expects gateway uplink format **MINEW-CONNECT**, not JSON-PREPARSED. Use one format per broker:

| Broker | Data format |
|---|---|
| `hub.minewtag.com` (cloud) | **MINEW-CONNECT** |
| Local Mosquitto (LotSync) | **JSON-PREPARSED** |

## Environment

```env
RENDERER_ADAPTER=minew
TRANSPORT_ADAPTER=minew_mqtt

MQTT_HOST=192.168.99.121
MQTT_PORT=1883
GATEWAY_MAC=AC233FC267C2
ESL_TAG_MAC=e100000a1525

MINEW_MQTT_TOPIC=/gw/ac233fc267c2/action
MINEW_MQTT_SUBSCRIBE_TOPIC=/gw/ac233fc267c2/#
MINEW_MQTT_DOWNLINK_FORMAT=jengine
MINEW_JENGINE_DEVICE_KEY=<16-char key from Minew>
MINEW_JENGINE_SINGLE_FIRMWARE=true
MINEW_JENGINE_SCREEN=A
MINEW_JENGINE_COMPRESS=NONE
```

Optional legacy downlink:

```env
MINEW_MQTT_DOWNLINK_FORMAT=ddata
MINEW_MQTT_TOPIC_PREFIX=Mqtt/GateWay
MINEW_MQTT_TOPIC_SUFFIX=Command
MINEW_JENGINE_DATA_ENCODING=command02_v1
```

## Tag IDs

| ID | Example | Used for |
|---|---|---|
| Barcode / screen ID | `E100000A1525` | Pairing scan, `esl_devices.device_id`, likely jengine `details` key |
| BLE MAC | `AC233FA1B2C3` | Alternate if Minew confirms |

Pilot kit uplink uses screen id `e100000a1525` in `ds` packets.

## Firmware scope

**BLE (single) firmware only** — jengine commands `02`, `42`, `102`, `103`. Ignore MIX/standard commands `03`, `20`, `33`, `37`, `101`.

## Validation checklist

- [ ] Gateway online; broker reachable at `MQTT_HOST`
- [ ] `MINEW_JENGINE_DEVICE_KEY` set (16 chars)
- [ ] `GET /health` → `minew_mqtt_configured: true`
- [ ] Tag id on `E100000A1525` (`e100000a1525`)
- [ ] Publish test → `set_rsp` on response topic
- [ ] `ds` uplink shows new `img_id` + `error: 0`
- [ ] Physical tag updates

## API endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/v1/vehicles/{id}/render-label` | Render + encode; saves job artifacts |
| `POST` | `/api/v1/vehicles/{id}/send-to-esl` | Render + MQTT publish for paired vehicle |
| `POST` | `/api/v1/esl/test-update` | Test image + MQTT publish |
| `GET` | `/api/v1/esl/status` | MQTT connection + recent jobs + gateway messages |

## CLI test script

```bash
cd apps/api
PYTHONPATH=. .venv/bin/python scripts/test_minew_update.py \
  --gateway AC233FC267C2 --tag e100000a1525 \
  --width 400 --height 300 --color-mode BWRY
```

## Code

| Piece | Path |
|---|---|
| Jengine envelope | `app/adapters/transport/minew_jengine.py` |
| MQTT client | `app/adapters/transport/minew_mqtt_client.py` |
| Transport adapter | `app/adapters/transport/minew_mqtt.py` |
| Pixel format (hypothesis) | `docs/MINEW_PIXEL_FORMAT.md` |

## Open questions for Minew

See `docs/MINEW_OPEN_QUESTIONS.md`.
