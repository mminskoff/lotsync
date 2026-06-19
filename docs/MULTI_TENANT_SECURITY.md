# Multi-Tenant Security

## Core Requirement

Dealer A must never access Dealer B data.

## Rules

- Every dealership-owned table includes dealership_id.
- Backend derives dealership_id from authenticated user context.
- Frontend never sends arbitrary dealership_id for access control.
- Supabase RLS should enforce dealership isolation.
- Support admin access must be logged.
- Provider API credentials are encrypted/stored server-side only.
- No provider credentials in browser.

## Roles

owner:
- manage billing/settings/users

manager:
- manage vehicles/tags/sources

lot_staff:
- pair/reassign/unpair tags

viewer:
- view dashboard only

support_admin:
- internal LotSync support with audit logging

## Audit Events

Log:
- login if available
- vehicle create/update/delete
- price change
- source sync
- tag pairing
- tag reassignment
- tag unpairing
- manual push
- provider failure
- user permission changes
