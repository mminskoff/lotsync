# LotSync Skills

These are repeatable workflows for human or AI agents.

## Skill: Build API Endpoint

1. Define request/response schema.
2. Add service method.
3. Add route.
4. Enforce dealership scope.
5. Add audit log if data changes.
6. Add tests.
7. Update API docs.

## Skill: Build Database Table

1. Add SQL migration/schema.
2. Include dealership_id if dealer-owned.
3. Add indexes.
4. Add unique constraints.
5. Add RLS policy draft.
6. Add model/schema types.
7. Add seed data if needed.

## Skill: Build UI Page

1. Create route/page.
2. Add loading state.
3. Add empty state.
4. Add error state.
5. Add table/card layout.
6. Connect API.
7. Add action buttons.
8. Add toast notifications.

## Skill: Add Inventory Adapter

1. Implement InventoryAdapter interface.
2. Map external fields to NormalizedVehicle.
3. Validate VIN.
4. Normalize price.
5. Normalize status.
6. Add source metadata.
7. Add tests with sample payload.

## Skill: Add ESL Provider/Gateway Support

1. Do not call provider directly from business logic.
2. Add renderer if needed.
3. Add transport adapter.
4. Add device profile.
5. Add config fields.
6. Add test push.
7. Add status check.
8. Add retry behavior.

## Skill: Debug Failed Sync

1. Check vehicle source data.
2. Check active VIN-to-ESL assignment.
3. Check LabelPayload.
4. Check renderer response.
5. Check transport/gateway response.
6. Check device status.
7. Retry sync.
8. Log final result.

## Skill: Driveway Test

1. Create test vehicle.
2. Create test ESL device.
3. Pair VIN to ESL.
4. Change price.
5. Trigger sync.
6. Confirm rendered payload.
7. Confirm gateway push.
8. Confirm physical tag changed.
9. Record latency.
