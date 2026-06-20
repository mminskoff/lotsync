# LotSync Ordered Task List

Cursor must work from this file.

## Current Rule

Complete one task at a time.
After each task, commit code.
Do not skip ahead.

## Milestone 1 — Repo and Scaffold

- [x] Create GitHub repo
- [x] Add documentation package
- [x] Add Cursor rules
- [x] Scaffold FastAPI app
- [x] Scaffold Next.js app
- [x] Add root README
- [x] Add .gitignore
- [x] Add .env.example
- [x] Confirm frontend runs
- [x] Confirm backend health route runs

## Milestone 2 — Supabase

- [x] Create Supabase project
- [x] Add env vars
- [x] Run initial schema
- [x] Confirm database tables
- [x] Add database connection to backend
- [x] Add DB health endpoint

## Milestone 3 — Core Backend

- [x] Dealership model/API
- [x] Vehicle model/API
- [x] ESL device model/API
- [x] Assignment model/API
- [x] Inventory source model/API
- [x] Sync event model/API
- [x] Audit log service

## Milestone 4 — Pairing Workflow

- [ ] Pair VIN to ESL endpoint
- [ ] Reassign ESL endpoint
- [ ] Unpair ESL endpoint
- [ ] Pairing audit logs
- [ ] Pairing triggers sync event
- [ ] Pairing tests

## Milestone 5 — Dealer Mobile App

- [ ] Mobile layout
- [ ] VIN scan/manual entry screen
- [ ] ESL scan/manual entry screen
- [ ] Confirm pairing screen
- [ ] Success screen
- [ ] Reassign flow
- [ ] Resync tag button
- [ ] Unpair button

## Milestone 6 — Dashboard

- [ ] Dashboard shell
- [ ] Inventory table
- [ ] Vehicle detail
- [ ] ESL device table
- [ ] Pairings page
- [ ] Sync events page
- [ ] Price mismatch page
- [ ] Settings page

## Milestone 7 — Inventory Adapters

- [ ] Define InventoryAdapter
- [ ] Manual adapter
- [ ] CSV adapter
- [ ] JSON adapter
- [ ] XML adapter
- [ ] Driveway test adapter
- [ ] Website verification placeholder

## Milestone 8 — Sync Engine

- [ ] Define LabelPayload
- [ ] Define DeviceProfile
- [ ] Generate LabelPayload from vehicle
- [ ] Define RendererAdapter
- [ ] Define TransportAdapter
- [ ] Create sync event worker
- [ ] Add retry logic
- [ ] Add failed sync status

## Milestone 9 — Minew Kit

- [ ] Identify models
- [ ] Confirm NFC/QR
- [ ] Confirm local API
- [ ] Confirm local renderer
- [ ] Confirm gateway LAN IP control
- [ ] Create MinewLocalRenderer
- [ ] Create MinewLocalTransport
- [ ] Push test label

## Milestone 10 — Driveway Validation

- [ ] Create 3 test vehicles
- [ ] Create 3 test ESL devices
- [ ] Pair each vehicle
- [ ] Change price
- [ ] Confirm tag updates
- [ ] Reassign tag
- [ ] Simulate gateway failure
- [ ] Confirm audit log
