-- =============================================================================
-- GMR & Associates — Contact Inquiries Table
-- Version: 1.0  Date: 2026-04-29
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.contact_inquiries (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  subject    TEXT NOT NULL,
  message    TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

-- Anyone (anon + authenticated) can insert contact inquiries
CREATE POLICY "Anyone can submit contact inquiry"
  ON public.contact_inquiries FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admin/CA can view all contact inquiries
CREATE POLICY "Admins can manage contact inquiries"
  ON public.contact_inquiries FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "CAs can view contact inquiries"
  ON public.contact_inquiries FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'ca'));
