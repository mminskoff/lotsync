-- Run in Supabase SQL editor if esl_update_jobs is missing from production.

CREATE TABLE IF NOT EXISTS esl_update_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dealership_id UUID NOT NULL REFERENCES dealerships (id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles (id) ON DELETE SET NULL,
    esl_device_id UUID REFERENCES esl_devices (id) ON DELETE SET NULL,
    tag_mac TEXT NOT NULL,
    gateway_mac TEXT NOT NULL,
    image_path TEXT,
    encoded_payload_path TEXT,
    seq INT,
    status TEXT NOT NULL DEFAULT 'pending',
    error_message TEXT,
    gateway_response JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    sent_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_esl_update_jobs_dealership_id ON esl_update_jobs (dealership_id);
CREATE INDEX IF NOT EXISTS idx_esl_update_jobs_created_at ON esl_update_jobs (dealership_id, created_at DESC);

ALTER TABLE esl_update_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS esl_update_jobs_deny_api ON esl_update_jobs;
CREATE POLICY esl_update_jobs_deny_api ON esl_update_jobs FOR ALL TO anon, authenticated USING (false);
