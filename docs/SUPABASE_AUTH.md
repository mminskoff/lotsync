# Supabase Auth setup

LotSync uses Supabase Auth for email/password sign-in. Roles are stored in user **app metadata** (not chosen at login).

## Dashboard admin (recommended)

Once you have at least one **owner** or **manager** account:

1. Sign in → open **Dashboard** → **Team** (sidebar, under Manage)
2. **Email invite** tab → enter partner's email + role → **Send invite email**
3. They receive an email, click the link, set their password, and land in the app

**Manual fallback:** use the **Set password** tab if you want to pick the password yourself and share it.

Requires `SUPABASE_SERVICE_ROLE_KEY` in Vercel / `apps/web/.env.local` (server-only, never `NEXT_PUBLIC_`).

### Supabase redirect URLs (required for email invites)

In Supabase → **Authentication** → **URL Configuration**:

- **Site URL:** `https://lotsync-chi.vercel.app` (not localhost)
- **Redirect URLs** — add:
  - `https://lotsync-chi.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback`

If Site URL is `http://localhost:3000`, invite links will redirect there even from production.

**Bootstrap:** the first owner must be created in the Supabase dashboard (see below). After that, owners can invite everyone from the UI.

## 1. Create a user (Supabase dashboard — bootstrap only)

In the [Supabase dashboard](https://supabase.com/dashboard) → **Authentication** → **Users** → **Add user**:

- Email + password
- Confirm the user (auto-confirm in dev)

## 2. Set role metadata

Edit the user → **Raw user meta data** or use SQL:

```sql
-- Example: manager at Premier Auto Demo
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "manager"}'::jsonb
WHERE email = 'you@dealership.com';
```

Supported roles: `owner`, `manager`, `lot_staff`, `viewer`, `support_admin`.

Lot staff are routed to `/pairing` after login; managers and owners go to `/dashboard`.

## 3. Environment variables

### Web (Vercel / `.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_APP_URL` | `https://lotsync-chi.vercel.app` (required for invite emails) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable (anon) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-only, for Users admin page) |

### API (Railway / `apps/api/.env`)

| Variable | Description |
|----------|-------------|
| `SUPABASE_JWT_SECRET` | JWT secret from Supabase → Project Settings → API |

When set, the API validates `Authorization: Bearer <access_token>` on proxied requests. Without it, tenancy still uses `X-Dealership-Id` only.

## 4. Sync `users` table (optional)

The `users` table mirrors auth for RLS and audit. After creating an auth user, insert a row with the same UUID:

```sql
INSERT INTO users (id, dealership_id, email, role)
VALUES (
  '<auth-user-uuid>',
  'de000000-0000-4000-8000-000000000001',
  'you@dealership.com',
  'manager'
);
```

## 5. Local dev

1. Start API: `cd apps/api && uvicorn app.main:app --reload --port 8000`
2. Start web: `cd apps/web && npm run dev`
3. Sign in at `/login` with your Supabase user
