# Inventory Integrations

## Design Principle

LotSync is inventory-source agnostic.

No business logic may depend on a specific DMS, website provider, or inventory vendor.

All sources must map into the normalized vehicle schema.

## Preferred Integration Strategy

Integrate where the dealer website gets its price data.

The dealer website usually receives inventory from:
- DMS
- Inventory merchandising system
- Website provider
- FTP/SFTP feed
- XML/JSON feed
- Pricing tool

LotSync should connect to the same source when possible.

## Phase 1 Adapters

- Manual entry
- CSV import
- XML feed
- JSON feed
- Website feed/API
- Website verification scraper

## Phase 2 Adapters

- Reynolds & Reynolds pilot adapter if available
- HomeNet-style feed
- vAuto/Cox feed/API if available
- Dealer.com ecosystem feed
- CDK/Fortellis integration
- Tekion partner/API
- DealerSocket/Solera feed/API

## Reynolds Pilot Rule

The first pilot dealership may use Reynolds & Reynolds.

Do not architect around Reynolds.

Build a generic adapter interface and implement the pilot source as one adapter.

## Website Verification

The public dealer website should be used to verify what consumers see.

Verification output:
- VIN
- displayed price
- vehicle detail URL
- timestamp
- status
- mismatch flag

## Mismatch Handling

If source and website disagree:
- set sync_status = PRICE_MISMATCH
- show alert
- log mismatch
- optionally pause ESL update depending on dealer config

## Adapter Output

Every adapter returns:

```json
{
  "vin": "",
  "stock_number": "",
  "year": 2024,
  "make": "",
  "model": "",
  "trim": "",
  "mileage": 0,
  "price": 0,
  "price_type": "internet_price",
  "status": "available",
  "source_type": "",
  "source_url": "",
  "vehicle_url": "",
  "last_seen_at": ""
}
```
