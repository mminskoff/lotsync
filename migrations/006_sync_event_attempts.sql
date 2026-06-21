-- Milestone 8: sync event retry tracking

ALTER TABLE sync_events
    ADD COLUMN IF NOT EXISTS attempt_count INT NOT NULL DEFAULT 0;
