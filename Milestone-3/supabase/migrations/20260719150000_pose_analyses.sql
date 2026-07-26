-- Milestone 2: Pose Estimation & Biomechanical Analysis
--
-- Pose estimation itself runs client-side in the sports scientist's browser
-- (see src/lib/pose-estimation.ts) — this table stores the *results* of that
-- analysis: aggregated joint-angle metrics, a movement quality score, and
-- heuristic risk flags, keyed to the video submission they came from.
--
-- One row per video_submission (re-running analysis upserts the same row
-- rather than accumulating duplicates).

CREATE TABLE public.pose_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_submission_id UUID NOT NULL UNIQUE REFERENCES public.video_submissions(id) ON DELETE CASCADE,
  athlete_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  analyzed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  frame_count INT NOT NULL DEFAULT 0,
  duration_seconds NUMERIC(8,2) NOT NULL DEFAULT 0,
  movement_quality_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  risk_flags TEXT[] NOT NULL DEFAULT '{}',
  -- { timeSeries: [{t, leftKnee, rightKnee, leftHip, rightHip, trunkLean,
  --   kneeValgusLeft, kneeValgusRight}], aggregates: {...} }
  -- See src/lib/biomechanics.ts for the exact shape this is computed into.
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
