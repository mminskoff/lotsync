# API Contracts

Base path: /api/v1

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

POST /pairings

Body:
```json
{
  "vin": "1FM...",
  "esl_device_id": "ESL-001"
}
```

Response:
```json
{
  "assignment_id": "uuid",
  "status": "paired",
  "vehicle": {},
  "device": {}
}
```

DELETE /pairings/{assignment_id}
POST /pairings/reassign

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

POST /mobile/scan-vin
POST /mobile/scan-esl
POST /mobile/confirm-pairing
GET /mobile/vehicle-by-vin/{vin}
GET /mobile/device-by-code/{code}

## Audit

GET /audit-logs
