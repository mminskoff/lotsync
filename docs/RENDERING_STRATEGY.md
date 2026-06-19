# Rendering Strategy

## Purpose

LotSync must own the logical label template and data model while keeping low-level e-paper rendering replaceable.

## Core Concept

LotSync produces a normalized `LabelPayload`.

Example:

```json
{
  "vin": "1FMEE...",
  "stock_number": "A1234",
  "price": "$47,995",
  "year": "2024",
  "make": "Ford",
  "model": "Bronco",
  "mileage": "12,300",
  "status": "available"
}
```

The payload is then passed to a `RendererAdapter`.

## Architecture

Inventory Adapter
    ↓
Normalized Vehicle
    ↓
Sync Engine
    ↓
Label Template Engine
    ↓
LabelPayload
    ↓
RendererAdapter
    ↓
RenderedPayload
    ↓
TransportAdapter
    ↓
Gateway
    ↓
ESL

## Phase 1: Minew Local Renderer

Use Minew's local/on-prem rendering engine if available.

LotSync sends:
- template ID
- device ID
- field values
- barcode/QR values
- optional static image references

Minew local renderer handles:
- rasterization
- black/red/yellow layer separation
- bitmap conversion
- compression/hex formatting
- gateway-ready payload generation

Goal:
Launch quickly without using Minew cloud.

## Phase 2: LotSync Renderer

Build LotSync-owned rendering for stronger vendor independence.

Responsibilities:
- Template rendering
- Multi-resolution support
- Device capability profiles
- Black/white/red layer generation
- 1-bit/2-bit bitmap conversion
- Byte packing
- Optional compression
- Output provider-specific rendered payloads

## Phase 3: Multi-Vendor Renderer Support

Support multiple renderers:

- MinewRenderer
- LotSyncRenderer
- HanshowRenderer
- SESRenderer
- SoluMRenderer

## Non-Goal for MVP

Do not write raw e-paper hex stream generation from scratch unless required.

The MVP should prove:
- VIN pairing
- real-time inventory sync
- label payload generation
- local gateway update
- dealer workflow

## Rendering Ownership Rule

LotSync owns label templates and logical payloads.

Provider rendering is allowed in MVP but must be replaceable.

Business logic must never depend on provider-specific bitmap formats.
