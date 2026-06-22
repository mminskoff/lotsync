# Inventory sync (scheduled)

## Manual sync

```bash
cd apps/api
PYTHONPATH=. .venv/bin/python scripts/sync_all_inventory.py
PYTHONPATH=. .venv/bin/python scripts/sync_all_inventory.py --type nielsen
```

## Railway cron (recommended for Nielsen rooftops)

1. In Railway, click **New** → **Cron Job** (or add a cron service to the project).
2. Root directory: `apps/api`
3. Schedule: `0 * * * *` (hourly) or `0 */6 * * *` (every 6 hours)
4. Command:

   ```bash
   python scripts/sync_all_inventory.py --type nielsen
   ```

5. Same env vars as the API service (`DATABASE_URL`, `SUPABASE_*`).

## Nielsen ESL demo seed

After inventory is imported, seed demo tags on one rooftop:

```bash
cd apps/api
PYTHONPATH=. .venv/bin/python scripts/seed_nielsen_esl_demo.py --list
PYTHONPATH=. .venv/bin/python scripts/seed_nielsen_esl_demo.py --slug YOUR-ROOFTOP-SLUG
```

Creates 12 ESL devices, 8 pairings, and mixed sync event states for dashboard demos.
