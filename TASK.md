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

- [x] Mobile layout (responsive, touch-first)
- [x] VIN scan/manual entry screen
- [x] ESL scan/manual entry screen
- [x] Confirm pairing screen
- [x] Success screen
- [x] Reassign flow
- [x] Resync tag button
- [x] Unpair button

## Milestone 6 — Dashboard (Web)

- [x] Dashboard shell
- [x] Inventory table
- [x] Vehicle detail
- [x] ESL device table
- [x] Pairings page
- [x] Sync events page
- [x] Price mismatch page
- [x] Settings page

## Milestone 7 — Inventory Adapters

- [x] Define InventoryAdapter
- [x] Manual adapter (via vehicle CRUD)
- [x] CSV adapter
- [x] Nielsen DDC adapter
- [x] Reynolds adapter (stub)
- [ ] JSON adapter
- [ ] XML adapter
- [ ] Driveway test adapter
- [ ] Website verification placeholder

## Milestone 8 — Sync Engine

- [x] Define LabelPayload
- [x] Define DeviceProfile
- [x] Generate LabelPayload from vehicle
- [x] Define RendererAdapter
- [x] Define TransportAdapter
- [x] Stub renderer + stub transport
- [x] Create sync event worker (`app/workers/sync_worker.py`)
- [x] Add retry logic
- [x] Add failed sync status
- [x] Change detection on inventory import
- [x] Pairing triggers sync event

### Milestone 8.5 — Pre-Hardware (while waiting for Minew kit)

Complete in order. Hardware (M9) only swaps renderer/transport adapters.

- [x] **8.5.1** Deploy sync worker on Railway (second service) — see `railway.worker.toml`
- [x] **8.5.2** `POST /sync-events/process` — manual batch trigger + worker docs
- [x] **8.5.3** PNG label preview renderer + `GET /vehicles/{id}/label-preview`
- [x] **8.5.4** Dashboard label preview on vehicle detail page
- [x] **8.5.5** Supabase Auth (replace placeholder login) — see `docs/SUPABASE_AUTH.md`
- [x] **8.5.6** Scheduled Nielsen inventory sync — `scripts/sync_all_inventory.py` + `docs/INVENTORY_SYNC.md`
- [x] **8.5.7** Demo ESL seed for Nielsen rooftops — `scripts/seed_nielsen_esl_demo.py`
- [x] **8.5.8** Price mismatch detection rules

## Milestone 9 — Minew Kit + Hardware Validation

Kit integration and physical-lot checks (blocked until Minew kit arrives).

- [ ] Identify models
- [ ] Confirm NFC/QR
- [ ] Confirm local API
- [ ] Confirm local renderer
- [ ] Confirm gateway LAN IP control
- [ ] Create MinewLocalRenderer
- [ ] Create MinewLocalTransport
- [ ] Push test label
- [ ] Confirm physical ESL matches label preview
- [ ] Reassign tag (verify old tag clears, new vehicle shows on ESL)
- [ ] Simulate gateway failure (disconnect gateway/network; confirm retry + dashboard alert)

## Milestone 10 — Driveway Validation (stub dry run)

Software loop validated without hardware — stub renderer/transport, demo ESL seed, Dover Dodge PWA pairing (Jun 2026).

- [x] Use test inventory + demo ESL devices (Nielsen seed / Dover rooftop)
- [x] Pair vehicles to stub tags (2+ VINs via PWA manual entry)
- [x] Change price → enqueue sync event
- [x] Process sync queue → SYNCED + dashboard label preview
- [x] Confirm audit log (`pairing.create`, `vehicle.update`, `sync_event.create`)

## Future — Shared Packages & Native Mobile

Do not start until Milestone 4 pairing APIs are validated. Do not scaffold `apps/mobile` in earlier milestones.

- [ ] Create `packages/types` — shared TS types aligned with `/api/v1` schemas
- [ ] Create `packages/api-client` — shared HTTP client for web + mobile
- [ ] Create `packages/ui` — shared components/tokens where practical
- [ ] Scaffold `apps/mobile` (React Native / Expo)
- [ ] Native VIN + ESL camera scanning
- [ ] Offline-aware pairing UX (queue requests when signal is weak)
- [ ] App Store / Play Store pilot build
