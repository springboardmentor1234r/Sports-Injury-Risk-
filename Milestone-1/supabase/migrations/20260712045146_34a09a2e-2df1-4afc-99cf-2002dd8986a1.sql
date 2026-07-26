
-- Grant table privileges required by PostgREST/Data API.
-- RLS policies already exist; without these GRANTs every query is denied.

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.athlete_profiles TO authenticated;
GRANT ALL ON public.athlete_profiles TO service_role;
