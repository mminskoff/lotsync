# Minew Test Kit Setup

## Goal

Set up Minew ESL hardware so LotSync can test real VIN-to-tag pairing and real-time price updates.

## Gateway (received Jun 2026)

| Field | Value |
|---|---|
| Model | G1-E |
| Version | B6121 |
| Power | DC 5V 1A or PoE (48V 0.1A) |
| Label IP | 192.168.99.1 (default — confirm on dealer LAN after join) |
| FCC ID | 2ABU6-G1-E |
| WiFi MAC | FC:23:3F:C2:B7:C2 |
| QR on label | Yes (gateway provisioning) |

## Tags (5)

Each tag shows a **1D barcode + device ID on the e-paper screen** — use the pairing camera to scan the barcode (not the printed VIN text pattern). IDs are the `E…` hex strings below.

| Minew device ID | Model | Resolution | Colors | Pilot |
|---|---|---|---|---|
| E100000A1525 | 4.2-BWRY | 400×300 | B/W/R/Y | **Yes — first physical refresh** |
| E10000083B68 | 3.5-BWRY | 384×184 | B/W/R/Y | Secondary |
| E10000083B76 | 2.9-BWRY | 296×128 | B/W/R/Y | Verify ID on physical label |
| E100000A15B4 | 2.13-BWRY | 250×122 | B/W/R/Y | Verify ID on physical label |
| E0000001BE6A | 7.3-E6 | 800×480 | E6 panel | Large format / later |

**LotSync mapping:** use Minew ID as `esl_devices.device_id` and `provider_device_id` with `provider=minew`.

## LotSync software (ready while waiting on Minew docs)

| Piece | Location |
|---|---|
| BWRY / BWR / E6 encoders | `apps/api/app/adapters/rendering/minew_pixel.py` |
| Label → pixel renderer | `apps/api/app/adapters/rendering/minew.py` |
| MQTT transport skeleton | `apps/api/app/adapters/transport/minew_mqtt.py` |
| Pixel format reference | `docs/MINEW_PIXEL_FORMAT.md` |
| Seed script | `apps/api/scripts/seed_minew_kit.py` |

### Seed tags for Dover Dodge

```bash
cd apps/api
    PYTHONPATH=. .venv/bin/python scripts/seed_minew_kit.py --slug dover-dodge
```

### Enable adapters (after MQTT topic confirmed)

```env
RENDERER_ADAPTER=minew
TRANSPORT_ADAPTER=minew_mqtt
MINEW_MQTT_HOST=<gateway-or-broker>
MINEW_MQTT_TOPIC=<from-minew-doc>
MINEW_JENGINE_COMMAND=42
```

Until `MINEW_MQTT_*` is set, sync events will render pixels but transport returns a clear configuration error (safe for staging).

## Hardware Checklist

- [x] Minew gateway (G1-E)
- [x] ESL tags (5 sizes)
- [x] Gateway on network (dealer WiFi)
- [ ] Power adapter connected (if not PoE)
- [ ] Tags online in Minew cloud/app (blocked — no cloud invite)
- [ ] MQTT topic + Jengine payload from Minew support
- [ ] One successful push from LotSync to E100000A1525

## Setup Steps

1. ~~Unbox gateway and tags.~~
2. ~~Record gateway model and tag device IDs.~~
3. Connect gateway to power + network.
4. Confirm gateway IP on LAN (may differ from 192.168.99.1).
5. Seed Minew tags in LotSync (`scripts/seed_minew_kit.py`).
6. Pair a VIN via PWA (scan tag barcode) → process sync.
7. When Minew replies: set `MINEW_MQTT_*`, push to **E100000A1525**, confirm physical update.
8. Price change → sync → confirm tag within target window.

## Validation

Success means:

- Gateway online
- Tag registered in LotSync and pairable via barcode scan
- LotSync renders 30,000-byte BWRY buffer for pilot tag
- MQTT publish accepted by gateway (once format confirmed)
- Physical ESL matches dashboard label preview
- Price change propagates to tag within target window

## Open Questions (emailed Minew)

- MQTT topic and Jengine JSON/binary envelope for command 42
- Local LAN API URL and auth for G1-E without cloud
- EPD rotation bytes per model (EPD Informations.xlsx)
- Does barcode on screen encode the full `E100000A1525` string?
