-- 1. Staff/member code on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS staff_code text UNIQUE;

CREATE OR REPLACE FUNCTION public.role_prefix(_role public.app_role)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE _role
    WHEN 'coach' THEN 'CO'
    WHEN 'physiotherapist' THEN 'PT'
    WHEN 'sports_scientist' THEN 'SS'
    WHEN 'administrator' THEN 'AD'
    ELSE 'AT' END;
$$;

UPDATE public.profiles p
SET staff_code = public.role_prefix(ur.role) || '-' || upper(substr(md5(p.id::text), 1, 5))
FROM public.user_roles ur
WHERE ur.user_id = p.id AND p.staff_code IS NULL;

-- 2. Coach assignment on athlete profiles
ALTER TABLE public.athlete_profiles
  ADD COLUMN IF NOT EXISTS coach_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS athlete_profiles_coach_idx ON public.athlete_profiles(coach_user_id);

-- 3. Signup trigger also mints the code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE
  _role public.app_role;
  _requested TEXT;
BEGIN
  _requested := NEW.raw_user_meta_data->>'role';
  IF _requested IN ('athlete','coach','physiotherapist','sports_scientist','administrator') THEN
    _role := _requested::public.app_role;
  ELSE
    _role := 'athlete';
  END IF;

  INSERT INTO public.profiles (id, full_name, staff_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    public.role_prefix(_role) || '-' || upper(substr(md5(NEW.id::text), 1, 5))
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END; $function$;

-- 4. Access helpers
CREATE OR REPLACE FUNCTION public.is_org_wide(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('physiotherapist','sports_scientist','administrator')
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_athlete_row(_athlete_user_id uuid, _coach_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() = _athlete_user_id
      OR public.is_org_wide(auth.uid())
      OR (public.has_role(auth.uid(), 'coach') AND _coach_user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.can_access_athlete_user(_athlete_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() = _athlete_user_id
      OR public.is_org_wide(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.athlete_profiles ap
        WHERE ap.user_id = _athlete_user_id AND ap.coach_user_id = auth.uid()
      );
$$;

-- 5. Staff directory (name + role + code), readable by any signed-in user
CREATE OR REPLACE FUNCTION public.staff_directory()
RETURNS TABLE (id uuid, full_name text, role public.app_role, staff_code text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.full_name, ur.role, p.staff_code
  FROM public.profiles p
  JOIN public.user_roles ur ON ur.user_id = p.id
  WHERE ur.role IN ('coach','physiotherapist','sports_scientist','administrator')
  ORDER BY ur.role, p.full_name;
$$;

GRANT EXECUTE ON FUNCTION public.role_prefix(public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_wide(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_athlete_row(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_athlete_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_directory() TO authenticated;

-- 6. Scoped policies
DROP POLICY IF EXISTS "Athlete or staff can view" ON public.athlete_profiles;
CREATE POLICY "Scoped athlete visibility" ON public.athlete_profiles
  FOR SELECT TO authenticated
  USING (public.can_access_athlete_row(user_id, coach_user_id));

DROP POLICY IF EXISTS "Staff or owner can update" ON public.athlete_profiles;
CREATE POLICY "Scoped athlete update" ON public.athlete_profiles
  FOR UPDATE TO authenticated
  USING (public.can_access_athlete_row(user_id, coach_user_id) AND (public.is_staff(auth.uid()) OR auth.uid() = user_id))
  WITH CHECK (public.is_staff(auth.uid()) OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Athlete or staff can view submissions" ON public.video_submissions;
CREATE POLICY "Scoped submission visibility" ON public.video_submissions
  FOR SELECT TO authenticated USING (public.can_access_athlete_user(athlete_user_id));

DROP POLICY IF EXISTS "Athlete or staff can view analyses" ON public.pose_analyses;
CREATE POLICY "Scoped analysis visibility" ON public.pose_analyses
  FOR SELECT TO authenticated USING (public.can_access_athlete_user(athlete_user_id));

DROP POLICY IF EXISTS "Athlete or staff can view alerts" ON public.alerts;
CREATE POLICY "Scoped alert visibility" ON public.alerts
  FOR SELECT TO authenticated USING (public.can_access_athlete_user(athlete_user_id));