# FastAPI Project Structure

apps/api/
  app/
    main.py
    core/
      config.py
      auth.py
      tenancy.py
    models/
      vehicle.py
      esl_device.py
      dealership.py
      sync_event.py
    schemas/
      vehicle.py
      esl_device.py
      pairing.py
      inventory.py
    routers/
      vehicles.py
      esl_devices.py
      pairings.py
      inventory_sources.py
      sync_events.py
    services/
      vehicle_service.py
      esl_service.py
      pairing_service.py
      sync_engine.py
      label_renderer.py
      audit_service.py
    adapters/
      inventory/
        base.py
        csv_adapter.py
        json_adapter.py
        xml_adapter.py
        driveway_adapter.py
        website_verifier.py
      esl/
        base.py
        minew_provider.py
    workers/
      tasks.py
      queue.py
    tests/
      test_pairing.py
      test_sync_engine.py
      test_inventory_adapters.py

Important:
- routers are thin
- services contain business logic
- adapters isolate external systems
- tests cover VIN-to-ESL pairing and price updates
