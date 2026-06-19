# Hardware Strategy

## Phase 1

White-label Minew ESL hardware.

Reasons:
- Fastest route to market
- Existing gateway/cloud ecosystem
- No hardware engineering
- Good for MVP and dealer pilot

## Phase 2

Support multiple ESL vendors through provider adapters.

Potential future providers:
- Minew
- Hanshow
- SES-imagotag/Vusion
- SoluM
- Other ESL vendors

## Phase 3

Consider custom hardware only after proving demand.

Custom hardware is not required for MVP.

## Dealer-Facing Rule

Dealers buy LotSync hardware kits.

They should not need to understand or manage the underlying hardware vendor.


## v4 Hardware Ownership Philosophy

LotSync should own the software stack wherever practical.

Hardware vendors should provide:
- physical e-paper displays
- gateway hardware
- radio infrastructure

LotSync should own:
- dealer accounts
- inventory integrations
- VIN-to-tag assignments
- label templates
- rendering abstraction
- gateway transport abstraction
- sync logic
- audit logs

## Local-Only Preferred Path

Preferred MVP path if supported:

LotSync Cloud
    ↓
LotSync local connector or local API call
    ↓
Minew local/on-prem renderer
    ↓
Minew gateway LAN API / MQTT / HTTP
    ↓
ESL

Minew cloud should not be required for core operation if local deployment is available.

## Vendor Independence Roadmap

Phase 1:
Use Minew hardware and local/on-prem rendering/transport.

Phase 2:
Own LotSync rendering engine.

Phase 3:
Support multiple gateway transports.

Phase 4:
Hardware vendors become interchangeable screen/gateway suppliers.
