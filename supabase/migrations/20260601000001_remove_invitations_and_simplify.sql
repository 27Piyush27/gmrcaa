-- =============================================================================
-- Migration: Remove Invitations & Simplify Auth to Admin-Approval Model
-- Date: 2026-06-01
-- =============================================================================

-- 1. Drop the invitations table as it is no longer needed
DROP TABLE IF EXISTS public.invitations CASCADE;

-- 2. Simplify the handle_new_user trigger
-- Now, EVERYONE who signs up defaults to the 'client' role. 
-- Admins must manually promote staff from the Admin Dashboard -> User Roles.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _assigned_role public.app_role;
  _company_id UUID;
BEGIN
  -- 1. Default EVERY single new user to 'client' for absolute security
  _assigned_role := 'client';
  
  -- 2. Get the default company ID (GMR Associates)
  SELECT id INTO _company_id FROM public.companies ORDER BY created_at ASC LIMIT 1;

  -- 3. Create their profile
  INSERT INTO public.profiles (user_id, name, email, company_id)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''), SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    _company_id
  )
  ON CONFLICT (user_id) DO UPDATE SET company_id = EXCLUDED.company_id;

  -- 4. Assign the 'client' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _assigned_role)
  ON CONFLICT (user_id, role) DO UPDATE SET role = EXCLUDED.role;

  RETURN NEW;
END;
$$;
