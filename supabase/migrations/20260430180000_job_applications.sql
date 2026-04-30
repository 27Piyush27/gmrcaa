CREATE TABLE IF NOT EXISTS public.job_applications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_applied TEXT NOT NULL,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT NOT NULL,
  message     TEXT,
  status      TEXT NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "job_apps: insert any"
  ON public.job_applications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "job_apps: staff select all"
  ON public.job_applications FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ca'));

CREATE POLICY "job_apps: staff update all"
  ON public.job_applications FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ca'));

CREATE POLICY "job_apps: staff delete all"
  ON public.job_applications FOR DELETE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ca'));
