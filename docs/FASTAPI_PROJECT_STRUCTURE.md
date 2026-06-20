# FastAPI Project Structure

All routes under `/api/v1` must be **mobile-compatible** — designed for `apps/mobile` (React Native / Expo), interim web PWA, and dashboard clients.

```
apps/api/
  app/
    main.py
    core/
      config.py
      auth.py
      tenancy.py
    models/
    schemas/
    routers/
      dealerships.py
      vehicles.py
      esl_devices.py
      pairings.py          # mobile-first pairing workflow
      mobile.py            # scan lookup helpers (/mobile/vehicle-by-vin, etc.)
      inventory_sources.py
      sync_events.py
      audit_logs.py
    services/
    adapters/
    workers/
    tests/
```

Pairing endpoints should return composite payloads (vehicle + device + assignment) suitable for mobile single-screen confirmation.

Important:
- routers are thin
- services contain business logic
- adapters isolate external systems
- no business logic in clients (`apps/web`, `apps/mobile`)
- tests cover VIN-to-ESL pairing and price updates
