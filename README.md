# LotSync v3 Founder Package

## Mission

LotSync is a real-time vehicle inventory and pricing synchronization platform for automotive dealerships.

LotSync keeps electronic vehicle display tags synchronized with the dealership's primary consumer-facing inventory channel.

The product combines:

- Dealer-agnostic inventory integrations
- Real-time pricing synchronization
- VIN-to-ESL pairing
- White-labeled ESL hardware
- Dealer mobile app
- Dealer dashboard
- Sync/audit/compliance records

## Core Product Promise

When a vehicle price, availability, or status changes in the dealer's inventory workflow, LotSync updates the assigned ESL tag in near real time.

## Important Positioning

LotSync is not simply an ESL control panel.

LotSync is the synchronization layer between dealership inventory systems, dealer websites, and physical electronic vehicle display tags.

Hardware is replaceable. The synchronization layer is the product.

## Current Hardware Target

Initial test and MVP hardware target:

- Minew ESL test kit
- Minew gateway
- Minew cloud/API if available
- White-labeled dealer-facing experience

Minew should never be hardcoded into business logic. Minew is an ESL provider adapter.


## v5 Architecture — Mobile-First Monorepo

LotSync is **mobile-first for lot operations**. Employees pair VIN to ESL tags on phones while walking the lot.

```
apps/api      — FastAPI backend (shared API layer)
apps/web      — Next.js dashboard (monitoring & admin)
apps/mobile   — React Native / Expo (future; primary pairing UX)
packages/     — types, api-client, ui (shared across web + mobile)
```

Design all APIs mobile-compatible. Do not build `apps/mobile` until pairing APIs are validated.

LotSync should own the full software workflow wherever practical.

LotSync owns:
- Inventory integrations
- Vehicle records
- VIN-to-ESL assignments
- Real-time sync engine
- Dealer dashboard
- Mobile pairing app
- Label templates
- Audit/compliance logs
- Billing/user management

Hardware vendors provide:
- E-paper screens
- Gateways
- Radio transport hardware

## Founder Rule

Do not build LotSync as a Minew reseller platform.

Build LotSync as the dealer-facing real-time synchronization platform.

Minew is an initial hardware supplier. Provider-specific rendering, gateway communication, and transport must remain behind adapters.

Preferred architecture:

Inventory Adapter
    -> Normalized Vehicle
    -> Sync Engine
    -> Label Template Engine
    -> Renderer Adapter
    -> Transport Adapter
    -> Gateway
    -> ESL


## Build Start Files

For actual development, start with:

1. `BUILD_PLAYBOOK.md`
2. `TASK.md`
3. `AGENTS.md`
4. `SKILLS.md`
5. `.cursor/rules/*`

`TASK.md` is the ordered build list.
`BUILD_PLAYBOOK.md` is the human + agent setup guide.
