# Foreseen Issues and Mitigations

## 1. Inventory Source Confusion

Problem:
Dealers may not know where their website price actually comes from.

Mitigation:
During onboarding, identify the true source that feeds the website:
- DMS
- Inventory merchandising provider
- Website provider
- SFTP feed
- CSV/XML/JSON export

LotSync should integrate with the upstream feed when possible and use the website as verification.

## 2. Price Mismatch Risk

Problem:
ESL price could differ from dealer website price.

Mitigation:
- Store source price
- Store ESL rendered price
- Store website verified price
- Add PRICE_MISMATCH status
- Add alerts
- Add audit logs
- Do not silently overwrite when sources disagree unless dealer config allows it

## 3. Legal/Compliance Risk

Problem:
Vehicle pricing may include rebates, incentives, finance terms, lease offers, dealer fees, disclaimers, and expiration dates.

Mitigation:
- Allow disclaimer text on ESL template
- Store price type: MSRP, sale price, internet price, finance price, lease price
- Store incentive metadata
- Show warning if source price type is unknown
- Keep audit log of every displayed price

## 4. VIN-to-Tag Mistakes

Problem:
Employee may attach tag to wrong vehicle.

Mitigation:
- Require VIN scan plus ESL scan
- Show vehicle confirmation screen before pairing
- Display year/make/model/stock/photo if available
- Allow quick reassign
- Log who paired the tag and when

## 5. Vehicle Movement

Problem:
Cars move around the lot and tags may be removed or swapped.

Mitigation:
LotSync does not need GPS for MVP.
The system treats VIN-to-ESL pairing as the source of truth.
If the physical tag is moved, employee must re-scan and reassign.

## 6. Minew Dependency

Problem:
Building too directly on Minew APIs creates vendor lock-in.

Mitigation:
- Create ESLProvider interface
- Create MinewProvider implementation
- Business logic calls ESLService only
- Dealer-facing UI says LotSync, not Minew

## 7. Reynolds Over-Indexing

Problem:
Pilot dealer may use Reynolds & Reynolds, but future dealers may use other systems.

Mitigation:
- Build InventoryAdapter interface
- Reynolds/pilot connector is one adapter
- Normalize all external data into LotSync vehicle schema
- Never use Reynolds-specific fields downstream

## 8. Sync Timing Expectations

Problem:
"Real-time" may be limited by source feed update frequency.

Mitigation:
Marketing can say real-time synchronization after LotSync receives updated inventory data.
Documentation must clarify:
- API/webhook sources can be near real time
- Scheduled feeds depend on provider frequency
- LotSync records last received and last verified times

## 9. Gateway/Connectivity Problems

Problem:
ESL updates may fail if gateway is offline.

Mitigation:
- Queue update jobs
- Retry failed pushes
- Show gateway offline alert
- Track last successful device update
- Show stale tags in dashboard

## 10. Battery and Hardware Failure

Problem:
ESL tag battery or signal failure causes stale data.

Mitigation:
- Device health dashboard
- Battery alerts
- Stale update alerts
- Manual test push
- Replacement workflow

## 11. Image Rendering Issues

Problem:
ESL screen sizes and color limits vary.

Mitigation:
- Template per device model
- Render preview before push
- Store rendered image
- Provider adapter handles device constraints

## 12. Security/Multi-Tenant Risk

Problem:
Dealer A must never see Dealer B data.

Mitigation:
- Every table has dealership_id
- Supabase RLS policies
- API checks dealership membership
- Audit all sensitive actions
- Never expose provider secrets to frontend

## 13. Scraping Fragility

Problem:
Dealer websites may change layout or use JavaScript.

Mitigation:
- Prefer feeds/APIs
- Use scraping only as verification/fallback
- Detect failed scrape and alert
- Store parser version and last success time

## 14. Overbuilding

Problem:
Trying to support all dealers and all providers before pilot.

Mitigation:
Build a dealer-agnostic architecture but implement only:
- Manual entry
- CSV import
- JSON/XML feed adapter
- Pilot dealer feed adapter
- Minew provider adapter
- Driveway test workflow


## 15. Rendering Lock-In

Risk:
LotSync becomes dependent on Minew's rendering engine.

Mitigation:
- Business logic outputs LabelPayload only
- RendererAdapter handles provider-specific rendering
- MinewLocalRenderer is replaceable
- Future LotSyncRenderer can own bitmap generation

## 16. Transport Lock-In

Risk:
LotSync becomes dependent on one vendor's gateway/API.

Mitigation:
- All gateway communication goes through TransportAdapter
- MinewLocalTransport is only the first implementation
- Future transport adapters can support other ESL gateways

## 17. Raw Bitmap Complexity

Risk:
Building raw e-paper bitmap and hex payload generation too early slows MVP.

Mitigation:
Use Minew local/on-prem renderer first if available.
Only build LotSyncRenderer after dealer value is proven.
