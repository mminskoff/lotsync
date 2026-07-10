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
| E10000083B68 | 3.5-BWRY | 384×184 | B/W/R/Y | Secondary — **see ID note below** |
| E10000083B76 | 2.9-BWRY | 296×128 | B/W/R/Y | Verify ID on physical label |
| E100000A15B4 | 2.13-BWRY | 250×122 | B/W/R/Y | Verify ID on physical label |
| E0000001BE6A | 7.3-E6 | 800×480 | E6 panel | Large format / later |

**LotSync mapping:** use Minew ID as `esl_devices.device_id` and `provider_device_id` with `provider=minew`.

## MAC / key reference (Jul 2026)

Minew emailed `mac&key new.xls` — **per-tag 16-char jengine keys**. Store locally; **do not commit** that file.

| Screen ID (lowercase in MQTT) | In LotSync seed | Notes |
|---|---|---|
| `e100000a1525` | E100000A1525 | Pilot — validated on hardware |
| `e10000083868` | E10000083B68 | **Mismatch:** xls has `83868`, seed/docs had `83B68` (B vs 8). Scan physical barcode and use that ID + matching key from xls |
| `e10000083b76` | E10000083B76 | OK |
| `e100000a15b4` | E100000A15B4 | OK |
| `e0000001be6a` | E0000001BE6A | OK |

### IDs we got wrong before (remember)

| What | Wrong | Correct |
|---|---|---|
| **Gateway MQTT topic MAC** | `FC233FC2B7C2` (WiFi label sticker) | `AC233FC267C2` / `ac233fc267c2` in topics |
| **3.5" tag screen ID** | `E10000083B68` in early seed | Minew xls: `e10000083868` — confirm on tag |
| **jengine `payload.key`** | placeholder / one global guess | Per-tag key from Minew `mac&key` xls |
| **NFC tap URL** | assumed same as QR image | Separate chip programming — spec still needed from Minew |
| **Uplink `screen: "0011"`** | looked like NFC/config | `info_v3` status bitmask (which screen slots have content) |

**Rule:** For MQTT `details.{mac}` and jengine `key`, trust **Minew xls + physical barcode**, not handwritten notes.

## LotSync software (ready while waiting on Minew docs)

| Piece | Location |
|---|---|
| BWRY / BWR / E6 encoders | `apps/api/app/adapters/rendering/minew_pixel.py` |
| Label → pixel renderer | `apps/api/app/adapters/rendering/minew.py` |
| MQTT transport | `apps/api/app/adapters/transport/minew_mqtt.py` |
| MQTT integration | `docs/MINEW_MQTT_INTEGRATION.md` |
| Pixel format reference | `docs/MINEW_PIXEL_FORMAT.md` |
| Seed script | `apps/api/scripts/seed_minew_kit.py` |

### Seed tags for Dover Dodge

```bash
cd apps/api
    PYTHONPATH=. .venv/bin/python scripts/seed_minew_kit.py --slug dover-dodge
```

### Enable adapters (gateway on LAN)

```env
RENDERER_ADAPTER=minew
TRANSPORT_ADAPTER=minew_mqtt
MQTT_HOST=192.168.99.1
MQTT_PORT=1883
GATEWAY_MAC=AC233FC267C2
ESL_TAG_MAC=e100000a1525
MINEW_JENGINE_DEVICE_KEY=<16-char key from mac&key xls for that tag>
```

Use **MQTT MAC** (`AC233FC267C2`), not the WiFi sticker (`FC233FC2B7C2`). Tag id in `details` is the **screen ID** (`e100000a1525`), lowercase, no colons. Each tag has its own jengine key.

## Hardware Checklist

- [x] Minew gateway (G1-E)
- [x] ESL tags (5 sizes)
- [x] Gateway on network (dealer WiFi)
- [ ] Power adapter connected (if not PoE)
- [ ] Tags online in Minew cloud/app (blocked — no cloud invite)
- [ ] MQTT topic + Jengine payload from Minew support
- [x] One successful push from LotSync to E100000A1525

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

- [x] Gateway online
- [x] Tag registered in LotSync and pairable via barcode scan
- [x] LotSync renders 30,000-byte BWRY buffer for pilot tag
- [x] MQTT publish accepted by gateway
- [x] Physical ESL matches dashboard label preview
- [x] Price change propagates to tag (pair → price change → physical refresh)
- [x] Reassign tag to new VIN via lot PWA

## NFC / advertising URL (Jul 2026 bench)

- **QR on label** (command 02): working — use `vehicle_url` or `LABEL_QR_FALLBACK_URL` (short URLs; long URLs fail Eddystone).
- **action 36 Eddystone URL**: gateway accepts short URLs (e.g. `http://example.com`); does **not** change NFC tap (still Minew default).
- **NFC tap URL**: blocked — need Minew jengine spec for NDEF programming.

## Open Questions (emailed Minew)

- MQTT topic and Jengine JSON/binary envelope for command 42
- Local LAN API URL and auth for G1-E without cloud
- EPD rotation bytes per model (EPD Informations.xlsx)
- Does barcode on screen encode the full `E100000A1525` string?
