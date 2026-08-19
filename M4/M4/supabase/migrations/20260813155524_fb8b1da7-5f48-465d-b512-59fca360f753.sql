GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(UUID) TO authenticated;

CREATE POLICY "Staff can view all profiles" ON public.profiles FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE TABLE public.video_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_submissions TO authenticated;
GRANT ALL ON public.video_submissions TO service_role;
ALTER TABLE public.video_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athlete or staff can view submissions" ON public.video_submissions FOR SELECT TO authenticated
  USING (auth.uid() = athlete_user_id OR public.is_staff(auth.uid()));
CREATE POLICY "Athlete can submit own videos" ON public.video_submissions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = athlete_user_id);
CREATE POLICY "Athlete or staff can update submissions" ON public.video_submissions FOR UPDATE TO authenticated
  USING (auth.uid() = athlete_user_id OR public.is_staff(auth.uid()))
  WITH CHECK (auth.uid() = athlete_user_id OR public.is_staff(auth.uid()));
CREATE POLICY "Athlete or staff can delete submissions" ON public.video_submissions FOR DELETE TO authenticated
  USING (auth.uid() = athlete_user_id OR public.is_staff(auth.uid()));

CREATE TRIGGER trg_video_submissions_updated BEFORE UPDATE ON public.video_submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.pose_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_submission_id UUID NOT NULL UNIQUE REFERENCES public.video_submissions(id) ON DELETE CASCADE,
  athlete_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  analyzed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  frame_count INT NOT NULL DEFAULT 0,
  duration_seconds NUMERIC(8,2) NOT NULL DEFAULT 0,
  movement_quality_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  risk_flags TEXT[] NOT NULL DEFAULT '{}',
  joint_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pose_analyses TO authenticated;
GRANT ALL ON public.pose_analyses TO service_role;
ALTER TABLE public.pose_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athlete or staff can view analyses" ON public.pose_analyses FOR SELECT TO authenticated
  USING (auth.uid() = athlete_user_id OR public.is_staff(auth.uid()));
CREATE POLICY "Staff can insert analyses" ON public.pose_analyses FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update analyses" ON public.pose_analyses FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can delete analyses" ON public.pose_analyses FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE TRIGGER trg_pose_analyses_updated BEFORE UPDATE ON public.pose_analyses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_pose_analyses_athlete ON public.pose_analyses(athlete_user_id);

CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_submission_id UUID REFERENCES public.video_submissions(id) ON DELETE SET NULL,
  severity TEXT NOT NULL DEFAULT 'moderate' CHECK (severity IN ('low','moderate','high','critical')),
  category TEXT NOT NULL DEFAULT 'risk',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.alerts TO authenticated;
GRANT ALL ON public.alerts TO service_role;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athlete or staff can view alerts" ON public.alerts FOR SELECT TO authenticated
  USING (auth.uid() = athlete_user_id OR public.is_staff(auth.uid()));
CREATE POLICY "Staff or owner can insert alerts" ON public.alerts FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()) OR auth.uid() = athlete_user_id);
CREATE POLICY "Athlete or staff can update alerts" ON public.alerts FOR UPDATE TO authenticated
  USING (auth.uid() = athlete_user_id OR public.is_staff(auth.uid()))
  WITH CHECK (auth.uid() = athlete_user_id OR public.is_staff(auth.uid()));
CREATE POLICY "Athlete or staff can delete alerts" ON public.alerts FOR DELETE TO authenticated
  USING (auth.uid() = athlete_user_id OR public.is_staff(auth.uid()));

CREATE TRIGGER trg_alerts_updated BEFORE UPDATE ON public.alerts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_alerts_athlete ON public.alerts(athlete_user_id, is_read);