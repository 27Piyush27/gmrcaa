-- 20260501000001_secure_auth_roles.sql

-- Replace the handle_new_user function to ignore the requested role
-- and forcefully assign the 'client' role to all new public signups.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Create the user profile
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
      SPLIT_PART(NEW.email, '@', 1)
    ),
    NEW.email
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- 2. FORCE the role to 'client' to prevent privilege escalation
  -- CAs and Admins must be manually elevated by an existing Admin
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;
