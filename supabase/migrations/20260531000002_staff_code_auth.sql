-- =============================================================================
-- Migration: Simplified Staff Code Auth Logic
-- Date: 2026-05-31
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _requested_role TEXT;
  _staff_code TEXT;
  _assigned_role public.app_role;
BEGIN
  -- 1. Default everyone to 'client' for security
  _assigned_role := 'client';

  -- 2. Extract requested role and staff code from signup metadata
  _requested_role := NEW.raw_user_meta_data->>'requested_role';
  _staff_code := NEW.raw_user_meta_data->>'staff_code';

  -- 3. Verify the secret Staff Code! 
  -- If they want to be a CA and they know the secret code, promote them instantly.
  IF _requested_role = 'ca' AND _staff_code = 'GMR-CA-2026' THEN
    _assigned_role := 'ca';
  END IF;

  -- 4. Create the user profile
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

  -- 5. Assign the securely verified role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _assigned_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;
