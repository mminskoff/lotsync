-- Milestone 7: inventory import sync history

CREATE TABLE inventory_sync_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dealership_id UUID NOT NULL REFERENCES dealerships (id) ON DELETE CASCADE,
    inventory_source_id UUID NOT NULL REFERENCES inventory_sources (id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at TIMESTAMPTZ,
    records_processed INT NOT NULL DEFAULT 0,
    vehicles_created INT NOT NULL DEFAULT 0,
    vehicles_updated INT NOT NULL DEFAULT 0,
    vehicles_off_lot INT NOT NULL DEFAULT 0,
    error_message TEXT
);

CREATE INDEX idx_inventory_sync_runs_dealership ON inventory_sync_runs (dealership_id, started_at DESC);
CREATE INDEX idx_inventory_sync_runs_source ON inventory_sync_runs (inventory_source_id, started_at DESC);

ALTER TABLE inventory_sync_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY inventory_sync_runs_deny_api ON inventory_sync_runs FOR ALL TO anon, authenticated USING (false);
