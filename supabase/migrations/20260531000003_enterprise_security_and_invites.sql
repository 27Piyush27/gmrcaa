-- =============================================================================
-- Migration: Enterprise Security, Multi-Tenancy, and Cryptographic Invites
-- Date: 2026-05-31
-- =============================================================================

-- 1. Create Companies (Tenants) Table
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Default Company (GMR Associates)
INSERT INTO public.companies (name) VALUES ('GMR Associates');

-- 2. Create Secure Invitations Table
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role public.app_role NOT NULL,
    token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
    used_at TIMESTAMPTZ
);

-- 3. Add Multi-Tenant Link to Profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- 4. Secure the Trigger (Cryptographic Token Verification)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _invite_token UUID;
  _invite_record RECORD;
  _assigned_role public.app_role;
  _company_id UUID;
BEGIN
  -- Default to client and default company
  _assigned_role := 'client';
  
  -- Get the default company ID
  SELECT id INTO _company_id FROM public.companies ORDER BY created_at ASC LIMIT 1;

  -- Extract token securely
  BEGIN
    _invite_token := (NEW.raw_user_meta_data->>'invite_token')::UUID;
  EXCEPTION WHEN OTHERS THEN
    _invite_token := NULL;
  END;

  IF _invite_token IS NOT NULL THEN
    -- Verify the token (Must exist, match email, not be used, and not expired)
    SELECT * INTO _invite_record 
    FROM public.invitations 
    WHERE token = _invite_token 
      AND email = NEW.email 
      AND used_at IS NULL 
      AND expires_at > NOW()
    FOR UPDATE; -- Prevent race condition attacks

    IF FOUND THEN
      _assigned_role := _invite_record.role;
      _company_id := _invite_record.company_id;
      
      -- Mark cryptographic token as permanently used
      UPDATE public.invitations 
      SET used_at = NOW() 
      WHERE token = _invite_token;
    END IF;
  END IF;

  -- Create profile with company linkage
  INSERT INTO public.profiles (user_id, name, email, company_id)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''), SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    _company_id
  )
  ON CONFLICT (user_id) DO UPDATE SET company_id = EXCLUDED.company_id;

  -- Assign securely verified role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _assigned_role)
  ON CONFLICT (user_id, role) DO UPDATE SET role = EXCLUDED.role;

  RETURN NEW;
END;
$$;

-- 5. Row Level Security for Invitations
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view and create invitations"
    ON public.invitations
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
        )
    );

-- Unauthenticated users cannot read the invitations table directly.
-- The trigger functions as SECURITY DEFINER so it bypasses RLS securely.
