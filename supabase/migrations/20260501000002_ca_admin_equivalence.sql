-- 20260501000002_ca_admin_equivalence.sql

-- Update the has_role function to treat 'ca' and 'admin' as having identical permissions.
-- Any policy checking for 'admin' will now return true if the user is a 'ca'.
-- Any policy checking for 'ca' will now return true if the user is an 'admin'.
-- This universally elevates the 'ca' role to have all admin rights across all RLS policies.

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id 
      AND (
        role = _role 
        OR (role = 'ca'::public.app_role AND _role = 'admin'::public.app_role)
        OR (role = 'admin'::public.app_role AND _role = 'ca'::public.app_role)
      )
  )
$$;
