# API Contracts

Base path: `/api/v1`

All endpoints must be **mobile-compatible** — consumed by future `apps/mobile` (React Native / Expo), interim web PWA, and dashboard. Use JSON, lean payloads, standard HTTP errors, and Bearer auth (not cookie-only).

## Mobile API Design Principles

- Composite pairing responses: return vehicle + device + assignment in one payload
- Scan lookup routes under `/mobile/*` for VIN and ESL code resolution
- Minimize round-trips (pairing flow target: scan → lookup → confirm → pair in ≤3 requests)
- Clear `{ "detail": "..." }` errors for field staff on unreliable networks
- No web-only assumptions (HTML redirects, cookie sessions, browser-specific flows)

## Dealerships

GET /dealerships/me
PATCH /dealerships/me

## Vehicles

GET /vehicles
GET /vehicles/{vehicle_id}
POST /vehicles
PATCH /vehicles/{vehicle_id}
POST /vehicles/import/csv
POST /vehicles/sync

## ESL Devices

GET /esl-devices
GET /esl-devices/{device_id}
POST /esl-devices/register
PATCH /esl-devices/{device_id}
POST /esl-devices/{device_id}/test-push

## Pairing

Mobile-first VIN-to-ESL workflow. All pairing responses include `organization_id` and `dealership_id` for multi-rooftop scoping.

### Mobile lookups

GET /mobile/vehicles/by-vin/{vin}

Response:
```json
{
  "organization_id": "uuid|null",
  "dealership_id": "uuid",
  "vehicle": { "id": "uuid", "vin": "1FM...", "make": "Ford", "sync_status": null },
  "active_assignment": null,
  "warnings": []
}
```

GET /mobile/esl-devices/by-code/{device_code}

Response:
```json
{
  "organization_id": "uuid|null",
  "dealership_id": "uuid",
  "device": { "id": "uuid", "device_id": "ESL-001" },
  "active_assignment": null,
  "warnings": []
}
```

### Pair / reassign / unpair

POST /pairings

Body:
```json
{
  "vin": "1FM...",
  "device_code": "ESL-001",
  "force_reassign": false,
  "scan_type": "barcode",
  "nfc_uid": null,
  "assignment_source": "mobile_app"
}
```

`scan_type`: `barcode` | `qr` | `nfc` | `manual` (optional)  
`assignment_source`: `mobile_app` | `web_pwa` | `api` | `automation` (default `mobile_app`)  
`nfc_uid`: optional NFC placeholder for future native scanning

Response:
```json
{
  "organization_id": "uuid|null",
  "dealership_id": "uuid",
  "assignment_id": "uuid",
  "status": "paired",
  "assignment_source": "mobile_app",
  "scan_type": "barcode",
  "nfc_uid": null,
  "vehicle": {},
  "device": {},
  "sync_event": { "id": "uuid", "event_type": "pairing.assign", "status": "PENDING" }
}
```

POST /pairings/reassign

Body:
```json
{
  "device_code": "ESL-001",
  "new_vin": "1FM...",
  "force_reassign": true,
  "scan_type": "nfc",
  "nfc_uid": "NFC-UID-PLACEHOLDER",
  "assignment_source": "mobile_app"
}
```

DELETE /pairings/{assignment_id}

GET /pairings/active

GET /vehicles/by-vin/{vin}/assignment

POST /vehicles/{vehicle_id}/push-label — manual label sync trigger (creates PENDING sync event)

POST /assignments — **deprecated (410)**; use POST /pairings

## Sync

GET /sync-events
POST /sync-events/{event_id}/retry
POST /vehicles/{vehicle_id}/push-label
GET /vehicles/{vehicle_id}/sync-status

## Inventory Sources

GET /inventory-sources
POST /inventory-sources
PATCH /inventory-sources/{source_id}
POST /inventory-sources/{source_id}/test
POST /inventory-sources/{source_id}/sync-now

## Dealer App

Legacy scan routes below are superseded by `/mobile/*` lookup + `/pairings` confirm flow.

POST /mobile/scan-vin
POST /mobile/scan-esl
POST /mobile/confirm-pairing
GET /mobile/vehicle-by-vin/{vin}
GET /mobile/device-by-code/{code}

## Audit

GET /audit-logs
