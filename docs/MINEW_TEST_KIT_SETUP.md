# Minew Test Kit Setup

## Goal

Set up Minew ESL hardware so LotSync can test real VIN-to-tag pairing and real-time price updates.

## Hardware Checklist

- Minew gateway
- ESL tags
- Power adapter
- Network connection
- Cloud/app access
- API/SDK documentation if provided

## Setup Steps

1. Unbox gateway and tags.
2. Record gateway serial number.
3. Record every ESL device ID.
4. Photograph labels/QR codes on each ESL.
5. Connect gateway to network.
6. Confirm tags appear in Minew cloud/app.
7. Test sending a basic label from Minew tools.
8. Record update latency.
9. Record image format/resolution requirements.
10. Add devices to LotSync test database.

## Device Inventory Table

| LotSync Device ID | Minew Device ID | Model | Screen Size | QR Code | Notes |
|---|---|---|---|---|---|
| ESL-001 | TBD | TBD | TBD | TBD | Test tag 1 |
| ESL-002 | TBD | TBD | TBD | TBD | Test tag 2 |

## Validation

Success means:
- Gateway online
- Tag visible in provider system
- LotSync can identify tag
- LotSync can render image
- LotSync can push image
- Tag updates within target window
