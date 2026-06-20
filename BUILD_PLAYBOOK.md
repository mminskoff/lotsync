# LotSync Build Playbook

This file is the step-by-step build guide for both humans and AI agents.

## Architecture — Mobile-First Monorepo (v5)

LotSync is **mobile-first for lot operations**. VIN-to-ESL pairing happens on phones while walking the lot.

**Target monorepo layout:**

```
apps/
  api/      — FastAPI backend (shared by all clients)
  web/      — Next.js dashboard (monitoring, admin, inventory management)
  mobile/   — React Native / Expo (future; primary pairing & lot ops UX)
packages/
  types/        — Shared TypeScript types (API contracts)
  api-client/   — Shared API client
  ui/           — Shared UI primitives (where web + mobile overlap)
docs/
.cursor/rules/
```

**Client roles:**

| App | Role | Primary users |
|-----|------|----------------|
| `apps/mobile` | Pair, reassign, unpair, scan VIN/ESL, field sync status | lot_staff |
| `apps/web` | Dashboard, inventory, alerts, settings, audit | managers, owners |
| `apps/api` | Business logic, sync engine, audit — **design every endpoint mobile-compatible** | all clients |

Do **not** scaffold `apps/mobile` until Milestone 4 pairing APIs are validated. Milestone 5 uses an interim responsive web PWA in `apps/web` to prove flows before native investment.

## Rule

Do not start coding random features.

Follow this order:

1. Create repo
2. Add docs
3. Configure Cursor rules
4. Scaffold apps
5. Set up Git
6. Set up Supabase
7. Add environment variables
8. Create database schema
9. Run backend
10. Run frontend
11. Build core data models
12. Build VIN-to-ESL pairing
13. Build sync engine
14. Add renderer/transport adapters
15. Test with driveway vehicles
16. Test with Minew kit

## Phase 0 — Human Prep

Before coding, gather:

- GitHub account
- Supabase account
- Vercel account
- Railway or Render account
- Minew kit order confirmation
- Dealer pilot notes if available
- Local development machine with Node.js and Python

Recommended versions:

- Node.js 20+
- Python 3.11+
- Git
- pnpm
- Docker optional
- VS Code or Cursor

## Phase 1 — Create GitHub Repo

Human steps:

1. Go to GitHub.
2. Create new private repo:
   `lotsync`
3. Do not initialize with README if creating locally first.
4. Copy repo URL.

Terminal:

```bash
mkdir lotsync
cd lotsync
git init
git remote add origin git@github.com:YOUR_USERNAME/lotsync.git
```

Create base folders:

```bash
mkdir -p apps/api apps/web docs .cursor/rules
mkdir -p packages/types packages/api-client packages/ui   # scaffold when UI work starts
# apps/mobile — add later (React Native / Expo), after pairing APIs validated
```

Copy all Markdown docs into `/docs` or repo root as specified.

Initial commit:

```bash
git add .
git commit -m "Initial LotSync docs and project structure"
git branch -M main
git push -u origin main
```

## Phase 2 — Cursor Setup

Open repo in Cursor.

Add these files:

- `AGENTS.md`
- `TASK.md`
- `SKILLS.md`
- `MCP.md`
- `.cursor/rules/architecture.mdc`
- `.cursor/rules/backend.mdc`
- `.cursor/rules/frontend.mdc`
- `.cursor/rules/security.mdc`
- `.cursor/rules/hardware.mdc`

Cursor rule:

Cursor must always read:
- `AGENTS.md`
- `TASK.md`
- `docs/TECH_SPEC.md`
- `docs/RENDERING_STRATEGY.md`
- `docs/GATEWAY_TRANSPORT_STRATEGY.md`

before making major architecture changes.

## Phase 3 — Scaffold Backend

From repo root:

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn pydantic pydantic-settings python-dotenv httpx sqlalchemy psycopg[binary] pytest
pip freeze > requirements.txt
mkdir -p app/{core,models,schemas,routers,services,adapters,workers,tests}
touch app/main.py
```

Create `apps/api/app/main.py`:

```python
from fastapi import FastAPI

app = FastAPI(title="LotSync API")

@app.get("/health")
def health():
    return {"status": "ok"}
```

Run:

```bash
uvicorn app.main:app --reload
```

Validate:

Open:
`http://localhost:8000/health`

Expected:

```json
{"status":"ok"}
```

## Phase 4 — Scaffold Frontend

From repo root:

```bash
cd apps
pnpm create next-app web --typescript --tailwind --eslint --app --src-dir
cd web
pnpm install
pnpm dev
```

Validate:

Open:
`http://localhost:3000`

## Phase 5 — Supabase Setup

Human steps:

1. Go to Supabase.
2. Create new project:
   `lotsync-dev`
3. Save:
   - Project URL
   - anon key
   - service role key
   - database password
4. Open SQL Editor.
5. Run `SUPABASE_SCHEMA.sql`.
6. Confirm tables exist.

Create `.env.local` in `apps/web`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Create `.env` in `apps/api`:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
ENVIRONMENT=development
```

Important:
Never commit real `.env` files.

## Phase 6 — Backend Database Connection

Agent tasks:

1. Add config loader.
2. Add database client.
3. Add dealership-scoped base service.
4. Add health endpoint that checks database.
5. Add tests.

Success:

```bash
GET /health
GET /health/db
```

both return OK.

## Phase 7 — Core Models

Build in order:

1. Dealerships
2. Users
3. Vehicles
4. ESL devices
5. Vehicle ESL assignments
6. Inventory sources
7. Sync events
8. Audit logs

Do not build Minew integration yet.

## Phase 8 — VIN-to-ESL Pairing (Mobile-First API)

Primary consumer: future `apps/mobile` (React Native / Expo). Interim consumer: responsive PWA in `apps/web`.

Build mobile-compatible endpoints:

- `POST /api/v1/pairings`
- `POST /api/v1/pairings/reassign`
- `DELETE /api/v1/pairings/{id}`
- `GET /api/v1/vehicles/{vin}/assignment`
- `GET /api/v1/mobile/vehicle-by-vin/{vin}` (lookup after scan)
- `GET /api/v1/mobile/device-by-code/{code}` (lookup after scan)

API design rules for mobile:
- Return vehicle + device + assignment summary in pairing responses (minimize round-trips)
- Use clear HTTP status codes and JSON error bodies
- Avoid cookie-only or web-only auth patterns
- Support camera scan → lookup → confirm → pair in ≤3 requests

Rules:
- one active tag per vehicle
- one active vehicle per tag
- audit every pairing
- trigger sync event after pairing

## Phase 9 — Lot Operations UI (Interim Web PWA)

Build touch-first responsive screens in `apps/web` until `apps/mobile` exists:

1. Login placeholder
2. Scan VIN (manual entry first; camera later)
3. Scan ESL QR
4. Confirm pairing
5. Pairing success
6. Reassign tag
7. Resync tag
8. Unpair tag

Use shared API via `packages/api-client` once packages exist; until then call `NEXT_PUBLIC_API_URL` directly.

## Phase 9b — Native Mobile App (Future)

Scaffold `apps/mobile` with React Native / Expo **after** pairing APIs are validated in Phase 8/9.

1. Create `packages/types` from `/api/v1` contracts
2. Create `packages/api-client`
3. Scaffold Expo app with camera permissions for VIN/QR scanning
4. Implement pairing flow using same endpoints as web PWA
5. Pilot on iOS/Android with lot staff

Do not duplicate business logic in the mobile app—all logic stays in `apps/api`.

## Phase 10 — Dashboard UI (Web)

Build pages:

1. Dashboard overview
2. Inventory
3. Vehicle detail
4. ESL tags
5. Pairings
6. Sync events
7. Price mismatches
8. Inventory sources
9. Settings

## Phase 11 — Sync Engine

Build:

1. LabelPayload creation
2. SyncEvent creation
3. RendererAdapter interface
4. TransportAdapter interface
5. MinewLocalRenderer stub
6. MinewLocalTransport stub
7. Retry logic
8. Audit logging

## Phase 12 — Driveway Test Mode

Create seed data:

- Test dealership
- 3 test vehicles
- 3 test ESL devices

Test:

1. Pair VIN to ESL
2. Change price
3. Generate sync event
4. Render label payload
5. Push via stub transport
6. Confirm sync event success

## Phase 13 — Minew Kit Validation

When kit arrives:

1. Identify gateway model.
2. Identify ESL models.
3. Record device IDs.
4. Confirm QR/NFC.
5. Confirm local API.
6. Confirm local renderer.
7. Confirm LAN gateway control.
8. Push hello-world label.
9. Measure latency.
10. Document exact payload format.

Do not guess API behavior.
Update `MINEW_TEST_KIT_SETUP.md` with real findings.

## Phase 14 — Dealer Pilot Prep

Before real dealership:

- Working driveway test
- Pairing app works
- Dashboard works
- Price update flow works
- Sync event audit works
- Failed sync alert works
- Basic security/RLS reviewed
- Provisional patent discussion completed
