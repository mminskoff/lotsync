# Technical Specification

## Stack

Frontend:
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Query or TanStack Query

Backend:
- Python
- FastAPI
- Pydantic
- SQLAlchemy or Supabase client
- Celery/RQ for jobs

Database:
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase Realtime where useful

Queue:
- Redis
- Celery/RQ
- Scheduled polling jobs

Hosting:
- Frontend: Vercel
- Backend: Railway or Render
- Database: Supabase
- Redis: Upstash/Redis Cloud

## Architecture

Inventory Sources
    ↓
Inventory Adapters
    ↓
Normalized Vehicle Model
    ↓
Sync Engine
    ↓
VIN-to-ESL Assignment
    ↓
ESL Rendering Service
    ↓
ESL Provider Interface
    ↓
Minew Provider Adapter

## Core Interfaces

### InventoryAdapter

Each external source must implement:

```python
class InventoryAdapter:
    async def fetch_inventory(self, dealership_id: str) -> list[NormalizedVehicle]:
        pass

    async def verify_vehicle(self, vin: str) -> VehicleVerificationResult:
        pass
```

### ESLProvider

Each hardware provider must implement:

```python
class ESLProvider:
    async def register_device(self, dealership_id: str, provider_device_id: str):
        pass

    async def update_label(self, device_id: str, image_url: str, metadata: dict):
        pass

    async def get_device_status(self, device_id: str):
        pass

    async def get_battery(self, device_id: str):
        pass
```

## Sync Engine

Responsibilities:
- Detect vehicle changes
- Compare current normalized price with last displayed ESL price
- Generate sync event
- Render ESL image
- Push update to ESL provider
- Record success/failure
- Retry failed updates
- Mark stale or mismatched tags

## Sync Status Values

- SYNCED
- PENDING
- UPDATING
- FAILED
- PRICE_MISMATCH
- SOURCE_UNVERIFIED
- TAG_UNASSIGNED
- GATEWAY_OFFLINE
- STALE

## Real-Time Design

Use event-driven updates where possible:
- API webhook received
- Feed poll detects change
- Manual edit occurs
- VIN-to-tag pairing created
- Sold status changes

Fallback:
- Scheduled polling every 1-5 minutes during pilot
- Configurable per dealership

## Business Logic Rules

- Business logic must never call Minew directly
- Business logic must never depend on Reynolds-specific fields
- All external inventory data maps into NormalizedVehicle
- All ESL hardware calls go through ESLProvider
- All user actions must be audit logged


## v4 Rendering and Transport Abstraction

LotSync must separate business logic, rendering, and gateway transport.

### LabelPayload

Business logic outputs a provider-neutral label payload.

```python
class LabelPayload:
    vin: str
    stock_number: str | None
    price: str
    year: str | None
    make: str | None
    model: str | None
    trim: str | None
    mileage: str | None
    status: str
    qr_url: str | None
    disclaimer: str | None
```

### DeviceProfile

```python
class DeviceProfile:
    provider: str
    model: str
    width: int
    height: int
    color_mode: str  # BW, BWR, BWY
    supports_nfc: bool
    supports_qr: bool
```

### RendererAdapter

```python
class RendererAdapter:
    async def render(
        self,
        payload: LabelPayload,
        device_profile: DeviceProfile
    ) -> dict | bytes:
        pass
```

### TransportAdapter

```python
class TransportAdapter:
    async def push_label(
        self,
        device_id: str,
        rendered_payload: dict | bytes,
        metadata: dict
    ) -> dict:
        pass
```

## Required Implementations

MVP:
- MinewLocalRenderer
- MinewLocalTransport

Future:
- LotSyncRenderer
- GenericMQTTTransport
- Vendor-specific transport adapters

## Critical Rule

VehicleService and SyncEngine must never call Minew directly.

They produce LabelPayload and create sync jobs only.
