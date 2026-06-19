# Local Deployment Notes

## Goal

Run LotSync without relying on Minew cloud whenever possible.

## Desired Setup

Dealer network contains:
- Minew gateway
- Optional local Minew on-prem renderer/server
- Optional LotSync local connector/agent

LotSync cloud contains:
- dealership account
- inventory data
- VIN assignments
- label templates
- sync jobs
- audit logs

## Update Flow

1. Inventory price changes.
2. LotSync SyncEngine creates LabelPayload.
3. RendererAdapter renders provider-ready payload.
4. TransportAdapter pushes payload to gateway over LAN/local connector.
5. Gateway updates ESL.
6. Result is reported to LotSync cloud.

## Connectivity Modes

### Local Mode

- No Minew cloud dependency
- Gateway controlled over LAN
- Preferred for production if stable

### Hybrid Mode

- LotSync cloud sends jobs to local connector
- Local connector talks to gateway
- Dealer internet required for new sync jobs
- Local queue may retry during short outages

### Cloud Fallback Mode

- Minew cloud/API may be used temporarily for testing
- Should not be required long term

## Questions to Answer When Kit Arrives

- Exact gateway model
- Exact ESL model numbers
- Does local API exist?
- Is local renderer included?
- HTTP or MQTT?
- Auth method?
- Payload format?
- Does device support NFC?
- Can gateway run without Minew cloud?
- Can tags be provisioned locally?
