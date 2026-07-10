# Minew Open Questions (updated after gateway interface docs)

Last updated after reviewing Minew gateway interface PDFs (overview, adv, jengine, extcmd-grapes) — v3.7 / g1-e-grapes.

## Resolved by docs (no longer need to ask)

| Question | Answer |
|---|---|
| MQTT downlink topic? | `/gw/{gateway_mac}/action` |
| MQTT uplink topic? | `/gw/{gateway_mac}/status` |
| MQTT response topic? | `/gw/{gateway_mac}/response` |
| Downlink envelope? | Jengine JSON (`action`, `version`, `method`, `req_id`, `payload`) |
| Image command? | `action: 2`, `method: set_req` |
| Gateway MQTT MAC? | `ac233fc267c2` (not label WiFi MAC `FC233FC2B7C2`) |
| Tag firmware type? | BLE / single (`single: true` in `ds` adverts) |
| Cloud vs local uplink format? | **MINEW-CONNECT** for Minew cloud; **JSON-PREPARSED** for self-hosted |
| Legacy `dData` on `Mqtt/GateWay/.../Command`? | Not the grapes / JSON-PREPARSED path |

## Still need from Minew (blockers)

### 1. Device authentication key (P0 — blocks all pushes)

Jengine `payload.key` must be the real **16-digit BLE device key**. Docs state `1234567890123456` is a placeholder.

- One key per tag, or one key for the whole demo kit?
- How do we obtain / rotate keys for production dealers?

### 2. ESL pixel format validation (P0 — image may render wrong)

Command 02 `images.data` must be ESL-native pixels (base64), not PNG/JPG. Docs refer to separate pixel-format documentation.

- Confirm our BWRY encoder for **400×300** (`E100000A1525`) matches Minew expectations
- EPD rotation / flip bytes per model (4.2", 2.9", 7.3" E6)
- When to use `compress: RLE` vs `NONE` — provide reference encoder or test vector

### 3. Tag MAC for `payload.details` (P0 — confirm once)

Uplink `ds` packets use screen id `e100000a1525`. Jengine examples use BLE-style MACs.

- For our tags, is `details` key the **screen ID** (`e100000a1525`) or a separate **BLE MAC**?
- If BLE MAC differs from screen ID, where is it printed / how do we read it?

### 4. Cloud provisioning (P1 — tags offline in cloud UI)

Gateway `AC233FC267C2` is Online in Teststore-01 but ESL tags stay Offline.

- Required `store_id` value for gateway `cgic-serviceset`?
- Required gateway Bluetooth filter / `preparsed_list` for cloud tag discovery?
- Is demo kit account `mminskoff@mac.com` fully provisioned for mobile + cloud?

### 5. Mobile app access (P1)

MTag / Cloud Tag login fails with `cloud.minewtag.com` and `hub.minewtag.com`.

- Correct server URL and whether an **active key** is required
- Which app (MTag vs Cloud Tag) for this cloud tenant

## Operational / production (P2)

| Topic | Question |
|---|---|
| Dealer LAN deployment | Recommended pattern for cloud-hosted LotSync → on-lot gateway (VPN, edge worker, MQTT bridge)? |
| `strategy.disable_auto` | Must this be `true` for self-hosted jengine when not using Minew cloud strategy? |
| Outer compression | When is v3.8+ outer compression (ZSTD/LZ4) required for 400×300 BWRY over AWS/Azure limits? |
| Command 42 | LED flash parameters for lot staff locating a tag by VIN |
| Command 102/103 | Required differences for 7.3" E6 tag `E0000001BE6A` |
| HFS hosting | Can LotSync host label binaries on dealer LAN HFS instead of embedding base64 in MQTT? |

## Suggested email to Minew (copy/paste)

> We integrated your gateway interface docs (jengine action 2 on `/gw/ac233fc267c2/action`). Gateway AC233FC267C2 is Online in Teststore-01. Please provide:
>
> 1. 16-digit device `key` for pilot tag E100000A1525 (and kit-wide policy)
> 2. ESL pixel format spec / test vector for 400×300 BWRY command 02 `images.data`
> 3. Confirm `payload.details` MAC: screen id `e100000a1525` vs BLE MAC
> 4. Cloud tag discovery: required `store_id`, uplink format, and preparsed filter settings
> 5. Mobile app server URL + active key for our cloud account

## LotSync implementation status

| Component | Status |
|---|---|
| Jengine envelope builder | Implemented (`minew_jengine.py`) |
| MQTT publish to `/gw/.../action` | Implemented (default) |
| Pixel encoder | Implemented — **needs Minew validation** |
| Device key | **Waiting on Minew** |
| Physical refresh | **Not yet confirmed** |
