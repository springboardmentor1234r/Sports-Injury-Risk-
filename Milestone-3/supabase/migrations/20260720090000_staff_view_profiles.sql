-- Fix: Video analysis page shows "Unknown athlete" for every submission.
--
-- `profiles` only had a single SELECT policy — "Users view own profile"
-- (auth.uid() = id). That's fine for an athlete looking at their own
-- profile, but the video-analysis page joins video_submissions to
-- profiles(full_name) so sports scientists/administrators can see whose
-- video they're reviewing. Under RLS, a staff member querying another
-- athlete's profile row gets it filtered out (not an error — the row is
-- just silently omitted from the join), so `full_name` comes back null and
-- the UI falls back to "Unknown athlete".
--
-- Every other staff-facing table (athlete_profiles, video_submissions,
-- pose_analyses) already grants staff read access via is_staff(); profiles
-- was the one table that never got the same policy.

CREATE POLICY "Staff can view all profiles" ON public.profiles FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));