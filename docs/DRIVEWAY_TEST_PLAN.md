# Driveway Test Plan

## Purpose

Use personal vehicles in the driveway as a mini dealership lot to validate LotSync before dealer pilot.

## Test Inventory

Create test vehicles manually if no feed exists.

Example:

| Test Vehicle | VIN | Stock # | Starting Price | ESL Tag |
|---|---|---|---|---|
| Vehicle 1 | TBD | TEST-001 | 29995 | ESL-001 |
| Vehicle 2 | TBD | TEST-002 | 39995 | ESL-002 |
| Vehicle 3 | TBD | TEST-003 | 49995 | ESL-003 |

## Required Tests

### Test 1: Add Vehicle

- Create vehicle in dashboard
- Enter VIN, stock, price
- Confirm vehicle appears in inventory

Pass:
Vehicle exists with SOURCE_UNVERIFIED or SYNCED status.

### Test 2: Pair VIN to ESL

- Open mobile app
- Scan VIN
- Scan ESL tag
- Confirm pairing

Pass:
Assignment exists and ESL receives correct label.

### Test 3: Price Change

- Change vehicle price in LotSync test source
- Run sync
- Confirm ESL updates

Pass:
ESL displays new price within target window.

### Test 4: Price Mismatch

- Set source price to one value
- Set website/test verification price to different value

Pass:
Vehicle status becomes PRICE_MISMATCH and dashboard alert appears.

### Test 5: Reassign Tag

- Move ESL-001 from Vehicle 1 to Vehicle 2
- Scan ESL
- Scan new VIN
- Confirm reassignment

Pass:
Old assignment inactive. New assignment active. ESL shows Vehicle 2.

### Test 6: Sold Vehicle

- Mark vehicle sold
- Confirm ESL updates to SOLD or blank template

Pass:
Vehicle status sold. Tag ready for removal/reassignment.

### Test 7: Gateway Offline

- Disconnect gateway/network
- Trigger price update

Pass:
Sync event fails gracefully, retries, and shows alert.

### Test 8: Battery/Device Health

- Pull device status from provider if supported

Pass:
Battery/status visible in dashboard.

### Test 9: Bulk Update

- Change prices for multiple vehicles
- Trigger sync

Pass:
All assigned ESLs update and sync events are logged.

## Exit Criteria Before Dealer Pilot

- 3+ vehicles paired
- 10+ price updates successful
- Reassignment works
- Failed gateway scenario handled
- Dashboard alerts work
- Audit log captures actions
- Label preview matches physical tag
