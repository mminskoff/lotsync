# Minew G1-E MQTT Integration

LotSync pushes label updates to Minew ESL tags **through the gateway** — never direct to tags.

```
Inventory → Renderer → Pixel encoder → Jengine 02 → MQTT dData → G1-E → BLE → Tag
```

## Gateway (kit)

| Field | Value |
|---|---|
| Model | G1-E B6121 |
| WiFi MAC | `FC:23:3F:C2:B7:C2` → topic MAC `FC233FC2B7C2` |
| Default IP | `192.168.99.1` (confirm on LAN) |

## MQTT downlink (first implementation target)

**Topic:**

```
Mqtt/GateWay/<GATEWAY_MAC>/Command
```

Example:

```
Mqtt/GateWay/FC233FC2B7C2/Command
```

**Payload:**

```json
{
  "msg": "dData",
  "mac": "<ESL_TAG_BLE_MAC>",
  "seq": 1,
  "auth1": "00000000",
  "dType": "ascii",
  "data": "<JENGINE_COMMAND_02_AS_HEX>"
}
```

| Field | LotSync source |
|---|---|
| `mac` | `ESL_TAG_MAC` env, `esl_devices.provider_device_id`, or `metadata.tag_mac` |
| `data` | Jengine command **02** + width/height + BWRY pixel buffer (hex ASCII) |
| `seq` | Auto-incrementing per worker process |

## Environment (worker + API when testing transport)

```env
RENDERER_ADAPTER=minew
TRANSPORT_ADAPTER=minew_mqtt
MQTT_HOST=192.168.99.1
MQTT_PORT=1883
MQTT_USERNAME=
MQTT_PASSWORD=
GATEWAY_MAC=FC233FC2B7C2
ESL_TAG_MAC=<pilot_tag_ble_mac>
MINEW_JENGINE_COMMAND=02
MINEW_JENGINE_DATA_ENCODING=command02_v1
```

(`MINEW_MQTT_HOST` / `MINEW_GATEWAY_MAC` aliases still work.)

Optional overrides:

| Variable | Default | Notes |
|---|---|---|
| `MINEW_MQTT_TOPIC` | auto from `GATEWAY_MAC` | Full topic override |
| `MINEW_MQTT_MSG_TYPE` | `dData` | Downlink message type |
| `MINEW_MQTT_AUTH1` | `00000000` | Payload auth field |
| `MINEW_MQTT_DTYPE` | `ascii` | Hex string in `data` |
| `MINEW_JENGINE_DATA_ENCODING` | `command02_v1` | `raw_hex` if gateway expects pixels only |

## Tag IDs vs BLE MAC

| ID | Example | Used for |
|---|---|---|
| Barcode / screen ID | `E100000A1525` | Pairing scan, `esl_devices.device_id` |
| BLE MAC | `AC233FA1B2C3` | MQTT `mac` field — **required for push** |

Discover tag MAC from gateway status/uplink MQTT or Minew tools, then update:

```sql
UPDATE esl_devices
SET provider_device_id = '<TAG_BLE_MAC>'
WHERE device_id = 'E100000A1525';
```

## Firmware scope

**Single (BLE) firmware only** — commands `02`, `42`, `102`, `103`. Ignore MIX/standard commands `03`, `20`, `33`, `37`, `101`.

## Validation checklist

- [ ] Gateway on LAN; MQTT broker reachable at `MINEW_MQTT_HOST`
- [ ] `GET /health` shows `minew_mqtt_configured: true`
- [ ] Tag BLE MAC stored on `E100000A1525`
- [ ] Pair vehicle → process sync → MQTT publish logged
- [ ] Physical tag updates within target window
- [ ] If no update: try `MINEW_JENGINE_DATA_ENCODING=raw_hex` or confirm Jengine 02 frame with Minew

## API endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/v1/vehicles/{id}/render-label` | Render + encode; saves job artifacts |
| `POST` | `/api/v1/vehicles/{id}/send-to-esl` | Render + MQTT publish for paired vehicle |
| `POST` | `/api/v1/esl/test-update` | 800×480 TEST UPDATE image + MQTT publish |
| `GET` | `/api/v1/esl/status` | MQTT connection + recent jobs + gateway messages |

## CLI test script

```bash
cd apps/api
PYTHONPATH=. .venv/bin/python scripts/test_minew_update.py \\
  --gateway FC233FC2B7C2 --tag <TAG_BLE_MAC>
```

## Job tracking

Table `esl_update_jobs` stores image path, encoded MQTT data path, seq, status, and gateway response. Migration: `apps/api/migrations/20260708_esl_update_jobs.sql`.

Existing `esl_devices` maps to **esl_tags** (MAC in `provider_device_id`, barcode ID in `device_id`). Existing `vehicles` table unchanged.

## Code

| Piece | Path |
|---|---|
| Jengine envelope | `app/adapters/transport/minew_jengine.py` |
| MQTT transport | `app/adapters/transport/minew_mqtt.py` |
| Pixel format | `docs/MINEW_PIXEL_FORMAT.md` |

## Open / hypothesis

- Exact Jengine 02 byte layout inside `data` (current: `02` + BE width + BE height + pixels)
- Uplink topic for acks / tag online status
- Gateway MQTT credentials if broker requires auth
