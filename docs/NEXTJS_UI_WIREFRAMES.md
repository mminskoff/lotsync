# Next.js UI Wireframes

## Dashboard Layout

Sidebar:
- Dashboard
- Inventory
- ESL Tags
- Pairings
- Sync Events
- Price Mismatches
- Inventory Sources
- Label Templates
- Users
- Settings

## Dashboard Home

Cards:
- Vehicles synced
- Vehicles with mismatch
- Unassigned vehicles
- Available ESL tags
- Failed sync jobs
- Gateway status

Table:
Recent sync events

## Inventory Page

Columns:
- Status
- VIN
- Stock #
- Year
- Make
- Model
- Price
- Website verified
- ESL assigned
- Sync status
- Last updated

Actions:
- View
- Push update
- Pair tag
- Mark sold
- Retry sync

## Vehicle Detail Page

Sections:
- Vehicle info
- Pricing
- Source data
- Website verification
- Assigned ESL
- Label preview
- Sync history
- Audit log

## ESL Tags Page

Columns:
- Device ID
- Provider
- Model
- Battery
- Signal
- Assigned VIN
- Status
- Last update

Actions:
- Test push
- Pair
- Unpair
- Mark broken

## Pairings Page

Board:
- Unassigned vehicles
- Available tags
- Active assignments
- Problem assignments

## Price Mismatches Page

Columns:
- Vehicle
- Source price
- Website price
- ESL price
- Last verified
- Severity
- Recommended action

Actions:
- Accept source
- Retry website verification
- Push ESL update
- Mark reviewed

## Inventory Sources Page

Cards:
- CSV upload
- XML feed
- JSON feed
- Website feed/API
- Pilot dealer adapter

Each source:
- Enabled/disabled
- Last sync
- Last success
- Error message
- Test connection

## Label Template Page

Functions:
- Choose ESL model
- Preview label
- Edit fields
- Add disclaimer
- Test render
- Push to test tag
