-- Fix: "permission denied for function is_staff" when adding/updating athlete profiles.
--
-- has_role() and is_staff() are SECURITY DEFINER, but Postgres still requires
-- the calling role to hold EXECUTE privilege on a function to invoke it at
-- all — SECURITY DEFINER only changes whose privileges the function body
-- runs with, it does not waive the caller's need for EXECUTE.
--
-- Migration 20260710161434 revoked EXECUTE on these functions from
-- `authenticated`. Since they are referenced inside the RLS policies for
-- athlete_profiles (insert/update/select) and user_roles, every one of
-- those policy checks then fails with "permission denied for function
-- is_staff" / "permission denied for function has_role" — breaking
-- "Add athlete", staff editing an athlete profile, and an athlete updating
-- their own profile.

GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(UUID) TO authenticated;
