-- Organization groups for multi-rooftop dealer switcher

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Nielsen Auto Group (stable id for local seed scripts)
INSERT INTO organizations (id, name, slug)
VALUES (
    '00000000-0000-4000-8000-000000000001',
    'Nielsen Auto Group',
    'nielsen-auto-group'
)
ON CONFLICT (slug) DO NOTHING;

UPDATE dealerships
SET organization_id = '00000000-0000-4000-8000-000000000001'
WHERE slug = 'nielsen-ford-morristown'
  AND organization_id IS NULL;
