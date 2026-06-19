# Cursor Prompts

## Master System Prompt

You are building LotSync, a real-time vehicle inventory and pricing synchronization platform for automotive dealerships.

LotSync keeps physical electronic vehicle display tags synchronized with the dealership's primary consumer-facing inventory channel.

The system must be dealer-agnostic, inventory-source agnostic, and ESL-provider agnostic.

Current test hardware target is Minew ESL hardware, white-labeled as LotSync.

Do not hardcode Minew into business logic.
Do not hardcode Reynolds & Reynolds into business logic.
Do not assume the public website HTML is always the source of truth.
Prefer the same inventory feed/API that powers the dealer website.

Architecture:
Inventory Adapter -> Normalized Vehicle Model -> Sync Engine -> Label Renderer -> ESL Provider Interface -> Minew Provider

Every relevant table must include dealership_id.
Every critical action must be audit logged.
VIN is the primary vehicle matching key.
Stock number is secondary only.

## Prompt 1: Scaffold Project

Create a monorepo for LotSync with:
- apps/api FastAPI backend
- apps/web Next.js TypeScript frontend
- docs folder
- .env.example

Use clean architecture and adapter patterns.

Do not implement Minew yet.
Create provider interfaces only.

## Prompt 2: Database Models

Create database models for:
- dealerships
- users
- vehicles
- esl_devices
- vehicle_esl_assignments
- inventory_sources
- sync_events
- rendered_labels
- audit_logs

All dealer-owned entities need dealership_id.

Add enum-like status values for sync status.

## Prompt 3: Vehicle API

Build FastAPI endpoints for vehicle CRUD.

Requirements:
- dealership scoped
- VIN unique per dealership
- support price fields
- support source fields
- support sync_status
- audit changes

## Prompt 4: ESL Device API

Build endpoints for ESL devices:
- list
- create/register
- update
- status
- test push placeholder

Do not call Minew directly.
Use ESLProvider interface.

## Prompt 5: VIN-to-ESL Pairing

Build pairing endpoints:
- pair VIN to ESL
- reassign ESL
- unpair ESL
- get active assignment

Rules:
- one active ESL per vehicle
- one active vehicle per ESL
- audit every assignment
- trigger label sync event after pairing

## Prompt 6: Dealer Mobile App

Build mobile-first PWA screens:
- login placeholder
- scan VIN
- scan ESL
- confirm pairing
- pairing success
- reassign
- unpair
- sync status

Use camera scanning library placeholders if needed.

## Prompt 7: Dashboard

Build dashboard pages:
- inventory
- ESL tags
- pairings
- sync events
- price mismatches
- inventory sources
- label templates
- settings

Use shadcn/ui and clean tables.

## Prompt 8: Inventory Adapter Framework

Create InventoryAdapter interface and implement:
- manual adapter
- CSV adapter
- JSON adapter
- XML adapter
- driveway test adapter

All adapters return NormalizedVehicle.

## Prompt 9: Sync Engine

Implement sync engine:
- detect price/status changes
- create sync events
- queue label render
- queue ESL push
- retry failures
- mark mismatches

## Prompt 10: Label Renderer

Build label rendering service that outputs image files for ESLs.

Template should include:
- year/make/model
- stock number
- price
- QR code placeholder
- disclaimer area
- LotSync branding option

## Prompt 11: Minew Provider Stub

Create MinewProvider class implementing ESLProvider.

Add methods as stubs with TODOs:
- register_device
- update_label
- get_device_status
- get_battery
- get_gateway_status

Do not invent API endpoints.
Wait for Minew API docs/test kit details.

## Prompt 12: Driveway Test Mode

Add test mode:
- create test dealership
- create 3 driveway vehicles
- create 3 ESL devices
- allow manual price changes
- allow pairing workflow
- show sync event history


## v4 Critical Renderer/Transport Rules

Do not couple business logic to Minew rendering.

Business logic outputs `LabelPayload`.

All rendering occurs through `RendererAdapter`.

All gateway communication occurs through `TransportAdapter`.

Minew local renderer and Minew local transport are implementation details.

Do not build raw e-paper hex generation for MVP unless no local renderer is available.

## Prompt 13: Renderer Abstraction

Create a renderer abstraction layer.

Requirements:
- Define LabelPayload
- Define DeviceProfile
- Define RendererAdapter
- Implement MinewLocalRenderer stub
- Implement LotSyncRenderer placeholder
- No business logic may import Minew renderer directly

## Prompt 14: Transport Abstraction

Create a transport abstraction layer.

Requirements:
- Define TransportAdapter
- Implement MinewLocalTransport stub
- Support LAN HTTP/MQTT config placeholders
- Add gateway status method
- Add push label method
- Add retry push method

## Prompt 15: Local-Only Hardware Mode

Add configuration for local-only deployment.

Requirements:
- dealership gateway LAN IP
- local renderer endpoint
- local MQTT broker optional
- disable Minew cloud dependency
- dashboard should show gateway mode: local, cloud, hybrid
