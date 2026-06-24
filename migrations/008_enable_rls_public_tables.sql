-- Fix Supabase security advisor: organizations was missing RLS.
-- Also allow authenticated users to read their own public.users row (dealership bootstrap).

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS organizations_deny_api ON public.organizations;
CREATE POLICY organizations_deny_api ON public.organizations
  AS PERMISSIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS users_select_own ON public.users;
CREATE POLICY users_select_own ON public.users
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());
