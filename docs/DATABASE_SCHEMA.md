# Database Schema

## dealerships

- id UUID primary key
- name text
- slug text unique
- website_url text
- status text
- created_at timestamp

## users

- id UUID primary key
- dealership_id UUID foreign key
- email text
- role text
- created_at timestamp

Roles:
- owner
- manager
- lot_staff
- viewer
- support_admin

## vehicles

- id UUID primary key
- dealership_id UUID foreign key
- vin text not null
- stock_number text
- year int
- make text
- model text
- trim text
- mileage int
- status text
- source_price numeric
- displayed_price numeric
- website_verified_price numeric
- price_type text
- source_type text
- source_url text
- vehicle_url text
- last_source_update_at timestamp
- last_website_verified_at timestamp
- price_verified boolean default false
- sync_status text
- created_at timestamp
- updated_at timestamp

Unique:
- dealership_id + vin

## esl_devices

- id UUID primary key
- dealership_id UUID foreign key
- device_id text
- provider text
- provider_device_id text
- model text
- screen_width int
- screen_height int
- battery_level int
- signal_status text
- gateway_id text
- status text
- last_seen_at timestamp
- last_updated_at timestamp
- created_at timestamp

Unique:
- dealership_id + device_id

## vehicle_esl_assignments

- id UUID primary key
- dealership_id UUID foreign key
- vehicle_id UUID foreign key
- esl_device_id UUID foreign key
- assigned_by UUID
- assigned_at timestamp
- unassigned_at timestamp
- status text

Only one active ESL assignment per vehicle.
Only one active vehicle assignment per ESL.

## inventory_sources

- id UUID primary key
- dealership_id UUID foreign key
- source_type text
- name text
- config_json jsonb
- enabled boolean
- last_sync_at timestamp
- last_success_at timestamp
- last_error text

## sync_events

- id UUID primary key
- dealership_id UUID foreign key
- vehicle_id UUID
- esl_device_id UUID
- event_type text
- old_value jsonb
- new_value jsonb
- status text
- error_message text
- created_at timestamp
- processed_at timestamp

## rendered_labels

- id UUID primary key
- dealership_id UUID foreign key
- vehicle_id UUID
- esl_device_id UUID
- template_id UUID
- image_url text
- price numeric
- payload_json jsonb
- created_at timestamp

## audit_logs

- id UUID primary key
- dealership_id UUID foreign key
- user_id UUID
- action text
- entity_type text
- entity_id UUID
- metadata jsonb
- created_at timestamp

## label_templates

- id UUID primary key
- dealership_id UUID foreign key
- name text
- provider text
- device_model text
- width int
- height int
- template_json jsonb
- active boolean
- created_at timestamp

## RLS Requirements

Every dealership-owned table must have dealership_id.
Supabase RLS must prevent cross-dealer access.
Support admin access must be explicitly controlled and audit logged.
