-- LotSync initial schema (Milestone 2)
-- Source: docs/DATABASE_SCHEMA.md

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- dealerships
CREATE TABLE dealerships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    website_url TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- users (id aligns with auth.users when Supabase Auth is wired)
CREATE TABLE users (
    id UUID PRIMARY KEY,
    dealership_id UUID NOT NULL REFERENCES dealerships (id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'lot_staff', 'viewer', 'support_admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (dealership_id, email)
);

CREATE INDEX idx_users_dealership_id ON users (dealership_id);

-- vehicles
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dealership_id UUID NOT NULL REFERENCES dealerships (id) ON DELETE CASCADE,
    vin TEXT NOT NULL,
    stock_number TEXT,
    year INT,
    make TEXT,
    model TEXT,
    trim TEXT,
    mileage INT,
    status TEXT,
    source_price NUMERIC(12, 2),
    displayed_price NUMERIC(12, 2),
    website_verified_price NUMERIC(12, 2),
    price_type TEXT,
    source_type TEXT,
    source_url TEXT,
    vehicle_url TEXT,
    last_source_update_at TIMESTAMPTZ,
    last_website_verified_at TIMESTAMPTZ,
    price_verified BOOLEAN NOT NULL DEFAULT false,
    sync_status TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (dealership_id, vin)
);

CREATE INDEX idx_vehicles_dealership_id ON vehicles (dealership_id);
CREATE INDEX idx_vehicles_sync_status ON vehicles (dealership_id, sync_status);

-- esl_devices
CREATE TABLE esl_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dealership_id UUID NOT NULL REFERENCES dealerships (id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    provider TEXT,
    provider_device_id TEXT,
    model TEXT,
    screen_width INT,
    screen_height INT,
    battery_level INT,
    signal_status TEXT,
    gateway_id TEXT,
    status TEXT,
    last_seen_at TIMESTAMPTZ,
    last_updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (dealership_id, device_id)
);

CREATE INDEX idx_esl_devices_dealership_id ON esl_devices (dealership_id);

-- vehicle_esl_assignments
CREATE TABLE vehicle_esl_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dealership_id UUID NOT NULL REFERENCES dealerships (id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles (id) ON DELETE CASCADE,
    esl_device_id UUID NOT NULL REFERENCES esl_devices (id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users (id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    unassigned_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active'
);

CREATE INDEX idx_vehicle_esl_assignments_dealership_id ON vehicle_esl_assignments (dealership_id);

CREATE UNIQUE INDEX idx_vehicle_esl_assignments_active_vehicle
    ON vehicle_esl_assignments (vehicle_id)
    WHERE status = 'active' AND unassigned_at IS NULL;

CREATE UNIQUE INDEX idx_vehicle_esl_assignments_active_esl
    ON vehicle_esl_assignments (esl_device_id)
    WHERE status = 'active' AND unassigned_at IS NULL;

-- inventory_sources
CREATE TABLE inventory_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dealership_id UUID NOT NULL REFERENCES dealerships (id) ON DELETE CASCADE,
    source_type TEXT NOT NULL,
    name TEXT NOT NULL,
    config_json JSONB NOT NULL DEFAULT '{}',
    enabled BOOLEAN NOT NULL DEFAULT true,
    last_sync_at TIMESTAMPTZ,
    last_success_at TIMESTAMPTZ,
    last_error TEXT
);

CREATE INDEX idx_inventory_sources_dealership_id ON inventory_sources (dealership_id);

-- sync_events
CREATE TABLE sync_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dealership_id UUID NOT NULL REFERENCES dealerships (id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles (id) ON DELETE SET NULL,
    esl_device_id UUID REFERENCES esl_devices (id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    status TEXT NOT NULL,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at TIMESTAMPTZ
);

CREATE INDEX idx_sync_events_dealership_id ON sync_events (dealership_id);
CREATE INDEX idx_sync_events_created_at ON sync_events (dealership_id, created_at DESC);

-- label_templates
CREATE TABLE label_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dealership_id UUID NOT NULL REFERENCES dealerships (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    provider TEXT,
    device_model TEXT,
    width INT,
    height INT,
    template_json JSONB NOT NULL DEFAULT '{}',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_label_templates_dealership_id ON label_templates (dealership_id);

-- rendered_labels
CREATE TABLE rendered_labels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dealership_id UUID NOT NULL REFERENCES dealerships (id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles (id) ON DELETE SET NULL,
    esl_device_id UUID REFERENCES esl_devices (id) ON DELETE SET NULL,
    template_id UUID REFERENCES label_templates (id) ON DELETE SET NULL,
    image_url TEXT,
    price NUMERIC(12, 2),
    payload_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rendered_labels_dealership_id ON rendered_labels (dealership_id);

-- audit_logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dealership_id UUID NOT NULL REFERENCES dealerships (id) ON DELETE CASCADE,
    user_id UUID REFERENCES users (id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_dealership_id ON audit_logs (dealership_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (dealership_id, created_at DESC);

-- Row Level Security (draft — policies expand when Supabase Auth is wired)
ALTER TABLE dealerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE esl_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_esl_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE label_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE rendered_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Deny direct API access until auth policies are added (backend uses postgres connection)
CREATE POLICY dealerships_deny_api ON dealerships FOR ALL TO anon, authenticated USING (false);
CREATE POLICY users_deny_api ON users FOR ALL TO anon, authenticated USING (false);
CREATE POLICY vehicles_deny_api ON vehicles FOR ALL TO anon, authenticated USING (false);
CREATE POLICY esl_devices_deny_api ON esl_devices FOR ALL TO anon, authenticated USING (false);
CREATE POLICY vehicle_esl_assignments_deny_api ON vehicle_esl_assignments FOR ALL TO anon, authenticated USING (false);
CREATE POLICY inventory_sources_deny_api ON inventory_sources FOR ALL TO anon, authenticated USING (false);
CREATE POLICY sync_events_deny_api ON sync_events FOR ALL TO anon, authenticated USING (false);
CREATE POLICY label_templates_deny_api ON label_templates FOR ALL TO anon, authenticated USING (false);
CREATE POLICY rendered_labels_deny_api ON rendered_labels FOR ALL TO anon, authenticated USING (false);
CREATE POLICY audit_logs_deny_api ON audit_logs FOR ALL TO anon, authenticated USING (false);
