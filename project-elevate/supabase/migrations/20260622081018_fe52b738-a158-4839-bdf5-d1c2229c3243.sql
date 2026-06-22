
CREATE TABLE public.jobs (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'queued',
  brief JSONB NOT NULL,
  stages JSONB NOT NULL DEFAULT '[]'::jsonb,
  progress INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.jobs TO anon;
GRANT SELECT, INSERT, UPDATE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Public read for status polling and the shareable /gift/[id] page.
-- Writes happen exclusively through server functions using the service-role key,
-- so no insert/update policies are needed for anon/authenticated roles.
CREATE POLICY "Anyone can read jobs"
ON public.jobs FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER jobs_touch_updated_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
