
CREATE TABLE public.careers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL DEFAULT 'full-time',
  category text,
  location text DEFAULT 'Gurgaon / Delhi',
  description text,
  requirements text[] DEFAULT '{}',
  highlights text[] DEFAULT '{}',
  duration text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.careers ENABLE ROW LEVEL SECURITY;

-- Anyone can view active careers
CREATE POLICY "Anyone can view active careers"
ON public.careers FOR SELECT
USING (is_active = true);

-- Admins can manage all careers
CREATE POLICY "Admins can manage all careers"
ON public.careers FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- CAs can insert careers
CREATE POLICY "CAs can insert careers"
ON public.careers FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'ca'::app_role));

-- CAs can update careers
CREATE POLICY "CAs can update careers"
ON public.careers FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'ca'::app_role));

-- CAs can delete careers
CREATE POLICY "CAs can delete careers"
ON public.careers FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'ca'::app_role));

-- Timestamp trigger
CREATE TRIGGER update_careers_updated_at
BEFORE UPDATE ON public.careers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
