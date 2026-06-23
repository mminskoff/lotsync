# Nielsen DDC inventory export

Place the Nielsen Excel export here as `nielsen-ddc.xlsx`.

Railway and local sync both read from this path (or `NIELSEN_WORKBOOK_PATH` env).

To refresh inventory: replace this file with a new export from Nielsen, then run
**Dashboard → Inventory → Sync now** or `python scripts/sync_all_inventory.py --type nielsen`.
