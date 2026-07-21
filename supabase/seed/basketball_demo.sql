-- Demo seed: a male basketball athlete profile.
-- Self-contained (no FK to an auth user), so it's safe to run as-is in the
-- Supabase SQL editor. `user_id` is left NULL, meaning no one can log in as
-- this athlete — it exists purely as a staff-managed profile, the same as
-- any athlete a coach/physio registers without the athlete having their own
-- login. It will immediately show up in /athletes and /reports.
--
-- To see the *full* injury-risk picture (the biomechanical-deviation and
-- movement-asymmetry components), a video needs to be submitted and
-- analyzed for this athlete through the app itself — pose_analyses rows
-- require a real linked auth user + video_submission row, so they can't be
-- seeded this way. See scripts/demo-basketball-athlete.ts for a simulation
-- of what that looks like once video data exists.

INSERT INTO public.athlete_profiles (
  full_name, sport_type, position, gender, age, height_cm, weight_kg,
  dominant_side, training_load, training_experience, team_club, coach_name,
  injury_history, current_medical_conditions, notes
) VALUES (
  'Jordan Mitchell',
  'Basketball',
  'Shooting Guard',
  'male',
  24,
  196,
  88,
  'right',
  'high',
  'advanced',
  'Riverside Hawks',
  'Coach T. Alvarez',
  'Grade 2 right ankle sprain, March 2025 — fully rehabbed, cleared to play. History of patellar tendinopathy, load-managed.',
  '',
  'Recently increased training volume ahead of playoffs.'
);
