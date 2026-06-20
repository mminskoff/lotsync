# LotSync Agent Instructions

## Identity

You are working on LotSync, a real-time vehicle inventory and pricing synchronization platform for automotive dealerships.

## Core Architecture

Inventory Adapter
    -> Normalized Vehicle
    -> Sync Engine
    -> Label Template Engine
    -> Renderer Adapter
    -> Transport Adapter
    -> Gateway
    -> ESL

## Client Architecture

```
apps/mobile  ──┐
apps/web     ──┼──> packages/api-client ──> apps/api (/api/v1) ──> Postgres
               └──> packages/types
```

Pairing workflow: mobile first. Dashboard reads sync status, mismatches, and audit logs.

## Non-Negotiable Rules

1. Do not hardcode Minew into business logic.
2. Do not hardcode Reynolds & Reynolds into business logic.
3. Do not assume website HTML is the source of truth.
4. Do not build raw e-paper bitmap generation for MVP.
5. Do not bypass RendererAdapter.
6. Do not bypass TransportAdapter.
7. Every dealer-owned table needs dealership_id.
8. VIN is primary matching key.
9. Stock number is secondary.
10. Pairing requires VIN + ESL device identification.
11. Every critical state change must create an audit log.
12. Design all API endpoints mobile-compatible (`apps/mobile` is the primary pairing client).
13. Do not scaffold `apps/mobile` until pairing APIs (Milestone 4) are validated.

## What LotSync Owns

- Dealer accounts
- Inventory integrations
- Vehicle records
- VIN-to-ESL assignments
- Label templates
- Sync engine
- Dealer dashboard (`apps/web`)
- Lot operations mobile app (`apps/mobile`, future)
- Shared packages (`packages/types`, `packages/api-client`, `packages/ui`)
- Audit trail
- Billing

## What Hardware Vendors Provide

- E-paper screens
- Gateway hardware
- Radio transport

## MVP Scope

Build the workflow first:

Vehicle
    -> ESL Device
    -> VIN-to-tag pairing
    -> Price change
    -> Sync event
    -> Renderer stub
    -> Transport stub
    -> Dashboard status

## Commit Rule

After each completed task, create a small commit with a clear message.

Example:
`feat(api): add vehicle CRUD endpoints`
