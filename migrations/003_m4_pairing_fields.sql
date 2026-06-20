-- Milestone 4: pairing metadata and organization scoping

ALTER TABLE dealerships
    ADD COLUMN IF NOT EXISTS organization_id UUID;

ALTER TABLE vehicle_esl_assignments
    ADD COLUMN IF NOT EXISTS assignment_source TEXT NOT NULL DEFAULT 'api',
    ADD COLUMN IF NOT EXISTS scan_type TEXT,
    ADD COLUMN IF NOT EXISTS nfc_uid TEXT;

CREATE INDEX IF NOT EXISTS idx_dealerships_organization_id ON dealerships (organization_id);
