
-- Login activity log table
CREATE TABLE public.login_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ip_address text,
  user_agent text,
  device_type text,
  browser text,
  login_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.login_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own login activity" ON public.login_activity
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert login activity" ON public.login_activity
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all login activity" ON public.login_activity
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Referrals table
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referral_code text UNIQUE NOT NULL,
  referred_email text,
  referred_user_id uuid,
  status text NOT NULL DEFAULT 'pending',
  discount_percent numeric DEFAULT 10,
  redeemed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals" ON public.referrals
  FOR SELECT TO authenticated
  USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

CREATE POLICY "Users can create referrals" ON public.referrals
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Admins can manage all referrals" ON public.referrals
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Revenue report view
CREATE OR REPLACE VIEW public.monthly_revenue AS
SELECT 
  date_trunc('month', p.created_at) AS month,
  COUNT(*) AS total_payments,
  SUM(p.amount) AS total_revenue,
  COUNT(DISTINCT p.user_id) AS unique_clients
FROM public.payments p
WHERE p.status = 'completed' OR p.status = 'paid'
GROUP BY date_trunc('month', p.created_at)
ORDER BY month DESC;

-- Top services view
CREATE OR REPLACE VIEW public.top_services AS
SELECT 
  s.name AS service_name,
  COUNT(sr.id) AS request_count,
  COALESCE(SUM(sr.amount), 0) AS total_revenue,
  COUNT(CASE WHEN sr.status = 'completed' OR sr.status = 'paid' THEN 1 END) AS completed_count
FROM public.services s
LEFT JOIN public.service_requests sr ON sr.service_id = s.id
GROUP BY s.id, s.name
ORDER BY request_count DESC;

-- Function to generate referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := 'REF-';
  i integer;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;
