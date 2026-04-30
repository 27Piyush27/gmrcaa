
-- Fix security definer views
ALTER VIEW public.monthly_revenue SET (security_invoker = on);
ALTER VIEW public.top_services SET (security_invoker = on);

-- Fix function search path
ALTER FUNCTION public.generate_referral_code() SET search_path = public;
