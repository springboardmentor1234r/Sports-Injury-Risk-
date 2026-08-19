
ALTER TABLE public.athlete_profiles
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS contact_number TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
  ADD COLUMN IF NOT EXISTS current_medical_conditions TEXT,
  ADD COLUMN IF NOT EXISTS coach_name TEXT,
  ADD COLUMN IF NOT EXISTS team_club TEXT,
  ADD COLUMN IF NOT EXISTS training_experience TEXT;
