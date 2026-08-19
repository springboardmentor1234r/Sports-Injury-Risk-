-- Notification preferences (Milestone: Notification & Alert System).
-- Per-user opt in/out for the alert categories the app raises. Alert-writing
-- code checks this before inserting a non-critical alert so a user can quiet
-- categories they don't want without losing high/critical risk alerts,
-- which always fire regardless of preference.
ALTER TABLE public.profiles
  ADD COLUMN notification_preferences JSONB NOT NULL DEFAULT jsonb_build_object(
    'risk_alerts', true,
    'training_load', true,
    'recovery_reminders', true,
    'assessment_complete', true
  );
