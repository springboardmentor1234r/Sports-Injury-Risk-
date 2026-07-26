-- Video submissions: lets an athlete submit a link to a training/movement
-- video (any domain — YouTube, Vimeo, Google Drive, a direct .mp4 URL, etc.)
-- for staff to review, since the "Upload a video" and "Video analysis"
-- pages previously had no table behind them at all.

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
