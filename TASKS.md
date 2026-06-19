# Cursor Build Tasks

## Rules for Cursor

Do tasks in order.
Do not skip ahead.
Do not build direct Minew business logic.
Do not build Reynolds-specific core logic.
Every table must include dealership_id where relevant.
Every critical action must create an audit log.

## Phase 0: Project Setup

1. Create monorepo structure:
   - apps/web
   - apps/api
   - packages/shared
   - docs

2. Scaffold FastAPI backend.

3. Scaffold Next.js frontend.

4. Add environment config and .env.example.

5. Add shared TypeScript/Python schema notes.

## Phase 1: Database

6. Create Supabase project notes.

7. Implement core tables:
   - dealerships
   - users
   - vehicles
   - esl_devices
   - vehicle_esl_assignments
   - inventory_sources
   - sync_events
   - rendered_labels
   - audit_logs

8. Add indexes:
   - dealership_id + vin
   - dealership_id + device_id
   - sync status
   - active assignments

9. Add RLS policy drafts.

## Phase 2: Backend Core

10. Implement dealership context middleware.

11. Implement vehicle CRUD.

12. Implement ESL device CRUD.

13. Implement pairing endpoints.

14. Implement audit log service.

15. Implement sync event model.

## Phase 3: Dealer Mobile App

16. Build responsive mobile layout.

17. Add VIN scan screen.

18. Add ESL scan screen.

19. Add confirmation screen.

20. Add pairing success screen.

21. Add reassign flow.

22. Add unpair flow.

23. Add mobile sync status screen.

## Phase 4: Dashboard UI

24. Build dashboard shell.

25. Build inventory table.

26. Build vehicle detail page.

27. Build ESL tags page.

28. Build pairings page.

29. Build sync events page.

30. Build price mismatch page.

31. Build inventory source settings page.

32. Build label preview page.

## Phase 5: Inventory Adapter Framework

33. Create InventoryAdapter interface.

34. Implement manual adapter.

35. Implement CSV import adapter.

36. Implement JSON feed adapter.

37. Implement XML feed adapter.

38. Implement test/driveway adapter.

39. Implement website verification adapter.

## Phase 6: Sync Engine

40. Implement change detection.

41. Implement sync event creation.

42. Implement queue worker.

43. Implement retry logic.

44. Implement price mismatch detection.

45. Implement stale tag detection.

## Phase 7: Label Rendering

46. Create label template model.

47. Implement image renderer.

48. Generate preview images.

49. Store rendered label image.

50. Add disclaimers and price type.

## Phase 8: Minew Adapter

51. Create ESLProvider interface.

52. Create MinewProvider stub.

53. Add config for Minew API credentials.

54. Implement test push method once API docs are available.

55. Implement device status method once API docs are available.

56. Implement battery method once API docs are available.

## Phase 9: Driveway Pilot

57. Add driveway test seed data.

58. Add test vehicles.

59. Add test ESL devices.

60. Run VIN-to-tag pairing test.

61. Run price update test.

62. Run mismatch test.

63. Run reassignment test.

64. Run gateway offline test.

## Phase 10: Dealer Pilot Prep

65. Add dealer onboarding checklist.

66. Add inventory source discovery form.

67. Add user roles.

68. Add support admin controls.

69. Add exportable audit report.

70. Add production deployment checklist.


## Phase 11: v4 Renderer and Transport Architecture

71. Add LabelPayload model.

72. Add DeviceProfile model.

73. Add RendererAdapter interface.

74. Add MinewLocalRenderer stub.

75. Add LotSyncRenderer placeholder.

76. Add TransportAdapter interface.

77. Add MinewLocalTransport stub.

78. Add dealership gateway configuration.

79. Add local-only gateway mode to dashboard.

80. Add sync event fields for:
    - renderer_type
    - transport_type
    - rendered_payload_id
    - gateway_response

81. Update SyncEngine so it outputs LabelPayload only.

82. Update ESL push flow:
    LabelPayload -> RendererAdapter -> TransportAdapter -> Gateway.

83. Add tests proving VehicleService does not import Minew classes.

84. Add driveway test for local renderer/transport once kit arrives.
