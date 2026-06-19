# Product Requirements

## Primary Requirement

LotSync must ensure the ESL tag displayed on a vehicle matches the price and vehicle data currently presented to consumers through the dealership's primary inventory channel.

This may be:

- Dealer website inventory feed/API
- Inventory merchandising platform
- DMS export/feed
- Website provider feed
- CSV/XML/JSON feed
- Verified website scrape as backup

## Real-Time Requirement

LotSync should be designed for near real-time synchronization.

Target SLA:

- Price change: under 60 seconds after LotSync receives updated data
- Sold vehicle status: under 60 seconds after LotSync receives updated data
- New vehicle arrival: under 5 minutes
- Tag pairing: under 30 seconds after employee scans VIN and tag
- Manual override push: under 60 seconds

## Source of Truth Rule

Do not assume the website HTML is always the best data source.

The best source is usually the same feed/API that powers the dealer website.

Preferred source hierarchy:

1. Primary dealer inventory feed/API powering the website
2. Dealer inventory/pricing platform feed
3. DMS export/API
4. Dealer public website verification
5. CSV/XML/JSON upload
6. Manual admin override

If the feed and website disagree, mark the vehicle as PRICE_MISMATCH and alert the dealer.

## Required Vehicle Fields

- VIN
- Stock number
- Year
- Make
- Model
- Trim
- Price
- Mileage
- Status
- Source URL
- Last verified timestamp
- Assigned ESL device ID
- Sync status

## Required ESL Fields

- ESL device ID
- Provider device ID
- Provider type
- Battery level
- Signal/status
- Last update timestamp
- Current assigned VIN
- Current rendered image URL
- Firmware/provider metadata

## Required Dealer App Features

- Login
- Scan VIN barcode
- Scan ESL QR/device ID
- Confirm vehicle details
- Pair VIN to ESL
- Reassign ESL to another VIN
- Unpair ESL
- Show sync status
- Show last update time
- Show price mismatch alert
- Support driveway/pilot testing

## Required Dashboard Features

- Inventory table
- ESL device table
- VIN-to-tag assignment view
- Real-time sync status
- Price mismatch alerts
- Inventory source settings
- Dealer users/permissions
- Audit log
- Hardware/gateway status
- Manual push update
- Failed sync retry

## Non-Goals for MVP

- Building custom ESL hardware
- Supporting every DMS on day one
- GPS/RFID/AI location matching
- Replacing the dealer's existing website or DMS
- Full accounting or deal jacket workflows
