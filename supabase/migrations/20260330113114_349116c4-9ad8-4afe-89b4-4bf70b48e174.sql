
-- Fix security definer views by setting them to SECURITY INVOKER
ALTER VIEW public.ca_workload SET (security_invoker = on);
ALTER VIEW public.ca_ratings SET (security_invoker = on);
