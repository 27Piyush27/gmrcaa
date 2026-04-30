
-- 1. Service Ratings / Client Feedback table
CREATE TABLE public.service_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(service_request_id)
);

ALTER TABLE public.service_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can rate their own completed services" ON public.service_ratings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own ratings" ON public.service_ratings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins and CAs can view all ratings" ON public.service_ratings
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'ca'::app_role));

CREATE POLICY "Admins can manage all ratings" ON public.service_ratings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Document Expiry tracking table
CREATE TABLE public.document_expiry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  reminder_days INTEGER NOT NULL DEFAULT 30,
  notified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.document_expiry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own document expiry" ON public.document_expiry
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins and CAs can view all document expiry" ON public.document_expiry
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'ca'::app_role));

CREATE POLICY "Admins can manage all document expiry" ON public.document_expiry
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. CA workload view
CREATE OR REPLACE VIEW public.ca_workload AS
SELECT
  ur.user_id AS ca_id,
  p.name AS ca_name,
  p.email AS ca_email,
  COUNT(sr.id) FILTER (WHERE sr.status IN ('pending', 'in_progress', 'in-progress')) AS active_tasks,
  COUNT(sr.id) FILTER (WHERE sr.status = 'completed') AS completed_tasks,
  COUNT(sr.id) AS total_tasks
FROM public.user_roles ur
JOIN public.profiles p ON p.user_id = ur.user_id
LEFT JOIN public.service_requests sr ON sr.assigned_ca = ur.user_id
WHERE ur.role = 'ca'
GROUP BY ur.user_id, p.name, p.email;

-- Average rating view per CA
CREATE OR REPLACE VIEW public.ca_ratings AS
SELECT
  sr.assigned_ca AS ca_id,
  p.name AS ca_name,
  ROUND(AVG(srt.rating)::numeric, 1) AS avg_rating,
  COUNT(srt.id) AS total_reviews
FROM public.service_ratings srt
JOIN public.service_requests sr ON sr.id = srt.service_request_id
JOIN public.profiles p ON p.user_id = sr.assigned_ca
WHERE sr.assigned_ca IS NOT NULL
GROUP BY sr.assigned_ca, p.name;
