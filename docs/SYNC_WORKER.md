# Sync worker deployment

The sync worker polls Postgres for pending ESL sync events and runs them through the renderer + transport adapters (stub today; Minew when hardware arrives).

## Local

```bash
cd apps/api
source .venv/bin/activate

# One batch
python -m app.workers.sync_worker --once

# Continuous loop (default 5s interval)
python -m app.workers.sync_worker

# Manual trigger via API (same logic)
curl -X POST http://127.0.0.1:8000/api/v1/sync-events/process \
  -H "X-Dealership-Id: YOUR_DEALERSHIP_UUID"
```

## Railway — second service

1. In the LotSync Railway project, click **New** → **Service** → **GitHub Repo** → same `lotsync` repo.
2. Set **Root Directory** to `apps/api`.
3. Set **Start Command**:

   ```bash
   python -m app.workers.sync_worker --interval 5
   ```

4. Copy the same env vars from the API service:
   - `DATABASE_URL`
   - `SUPABASE_*`
   - `ENVIRONMENT=production`
   - `RENDERER_ADAPTER=stub`
   - `TRANSPORT_ADAPTER=stub`
5. Do **not** expose HTTP on the worker service (no public domain needed).
6. Deploy. Check logs for `Sync worker started`.

The web API service keeps its existing start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## Environment

| Variable | Default | Notes |
|----------|---------|-------|
| `SYNC_WORKER_POLL_INTERVAL_SECONDS` | `5` | Worker sleep between batches |
| `RENDERER_ADAPTER` | `stub` | Use `preview` only for PNG mockups, not production sync |
| `TRANSPORT_ADAPTER` | `stub` | Swap to `minew` when M9 is complete |
| `STUB_TRANSPORT_FAIL` | `false` | Set `true` to simulate transport failures in tests |

## Flow

```
Pairing / price change
  → sync_events row (status=pending)
  → worker picks up batch
  → build LabelPayload
  → renderer (stub logs JSON)
  → transport (stub accepts)
  → status=synced, vehicle.sync_status=synced
```

When the Minew kit arrives, change `RENDERER_ADAPTER` and `TRANSPORT_ADAPTER` on the worker service only — business logic stays the same.
