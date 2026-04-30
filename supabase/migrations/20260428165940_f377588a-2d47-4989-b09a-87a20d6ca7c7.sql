CREATE TABLE IF NOT EXISTS public.ca_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.ca_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own CA application"
  ON public.ca_applications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can submit their own CA application"
  ON public.ca_applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage CA applications"
  ON public.ca_applications FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.handle_ca_application_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    DELETE FROM public.user_roles WHERE user_id = NEW.user_id;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.user_id, 'ca')
      ON CONFLICT DO NOTHING;
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (NEW.user_id, 'CA Application Approved',
            'Your Chartered Accountant application has been approved. You now have CA access.',
            'success');
  ELSIF NEW.status = 'rejected' AND (OLD.status IS DISTINCT FROM 'rejected') THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (NEW.user_id, 'CA Application Update',
            COALESCE('Your CA application was not approved. ' || NEW.notes, 'Your CA application was not approved.'),
            'info');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ca_application_approval ON public.ca_applications;
CREATE TRIGGER trg_ca_application_approval
  AFTER UPDATE ON public.ca_applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_ca_application_approval();