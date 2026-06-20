# LotSync Ordered Task List

Cursor must work from this file.

## Architecture — Mobile-First (v5)

LotSync is **mobile-first for lot operations**. Employees pair VIN to ESL tags while walking the lot on phones—not from a desktop dashboard.

**Monorepo target:**

```
apps/api          — FastAPI backend (single source of truth for all clients)
apps/web          — Next.js dealer dashboard (desktop/tablet; monitoring & admin)
apps/mobile       — React Native / Expo lot operations app (future; primary pairing UX)
packages/types    — Shared TypeScript types (API request/response shapes)
packages/api-client — Shared API client (fetch, auth headers, error handling)
packages/ui       — Shared UI primitives where web + mobile overlap
```

**Rules:**

- Design all `/api/v1` endpoints **mobile-compatible** (JSON, minimal round-trips, clear errors, no web-only assumptions).
- Pairing workflow (`POST /pairings`, reassign, unpair) is consumed by **mobile first**; dashboard is read/monitor.
- Do **not** scaffold `apps/mobile` until pairing APIs (M4) are validated.
- Shared packages can be introduced incrementally; start with `packages/types` when web or mobile UI work begins.

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

Mobile-first API — primary consumer will be `apps/mobile` (future); must also work from curl/Postman and interim web PWA.

- [x] Pair VIN to ESL endpoint
- [x] Reassign ESL endpoint
- [x] Unpair ESL endpoint
- [x] Pairing audit logs
- [x] Pairing triggers sync event
- [x] Pairing tests
- [x] Mobile-friendly response shapes (vehicle + device summary in one payload)

## Milestone 5 — Lot Operations UI (Interim Web PWA)

Temporary pairing UI in `apps/web` until `apps/mobile` exists. Validates flows before native app investment.

- [ ] Mobile layout (responsive, touch-first)
- [ ] VIN scan/manual entry screen
- [ ] ESL scan/manual entry screen
- [ ] Confirm pairing screen
- [ ] Success screen
- [ ] Reassign flow
- [ ] Resync tag button
- [ ] Unpair button

## Milestone 6 — Dashboard (Web)

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

## Future — Shared Packages & Native Mobile

Do not start until Milestone 4 pairing APIs are validated. Do not scaffold `apps/mobile` in earlier milestones.

- [ ] Create `packages/types` — shared TS types aligned with `/api/v1` schemas
- [ ] Create `packages/api-client` — shared HTTP client for web + mobile
- [ ] Create `packages/ui` — shared components/tokens where practical
- [ ] Scaffold `apps/mobile` (React Native / Expo)
- [ ] Native VIN + ESL camera scanning
- [ ] Offline-aware pairing UX (queue requests when signal is weak)
- [ ] App Store / Play Store pilot build
