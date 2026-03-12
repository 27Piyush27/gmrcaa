-- =============================================================================
-- GMR & Associates — Production Schema (Consolidated)
-- Version: 1.0  Date: 2026-03-08
-- =============================================================================
-- This is the canonical single-file schema for the GMR CA Firm platform.
-- It is safe to apply on a fresh database or after the previous 7 migrations.
-- All new objects use IF NOT EXISTS / OR REPLACE to be idempotent.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. EXTENSIONS
-- ─────────────────────────────────────────────────────────────────────────────

-- pgcrypto for gen_random_uuid (already included in Supabase but idempotent)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. TYPES
-- ─────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'ca', 'client');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.service_status AS ENUM (
    'pending', 'in_progress', 'completed', 'paid', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM (
    'pending', 'processing', 'completed', 'failed', 'refunded'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.notification_type AS ENUM (
    'service_update', 'payment_received', 'document_uploaded',
    'document_reviewed', 'system', 'chat'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. CORE TABLES
-- ─────────────────────────────────────────────────────────────────────────────

-- 2.1  profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.2  user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       public.app_role NOT NULL DEFAULT 'client',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 2.3  services  (catalogue — managed by admin)
CREATE TABLE IF NOT EXISTS public.services (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  long_desc   TEXT,
  icon        TEXT,
  category    TEXT,
  price_range TEXT,
  features    TEXT[],
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.4  service_requests
CREATE TABLE IF NOT EXISTS public.service_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id    TEXT NOT NULL REFERENCES public.services(id),
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','in_progress','completed','paid','cancelled')),
  progress      INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  notes         TEXT,
  amount        NUMERIC(12,2),
  document_url  TEXT,
  assigned_ca   UUID REFERENCES auth.users(id),
  priority      TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  due_date      DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.5  payments
CREATE TABLE IF NOT EXISTS public.payments (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_request_id   UUID REFERENCES public.service_requests(id),
  amount               NUMERIC(12,2) NOT NULL,
  gst_amount           NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount         NUMERIC(12,2) NOT NULL,
  currency             TEXT NOT NULL DEFAULT 'INR',
  razorpay_order_id    TEXT UNIQUE,
  razorpay_payment_id  TEXT UNIQUE,
  razorpay_signature   TEXT,
  status               TEXT NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','processing','completed','failed','refunded')),
  payment_method       TEXT,
  description          TEXT,
  idempotency_key      TEXT UNIQUE,
  metadata             JSONB DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.6  client_documents
CREATE TABLE IF NOT EXISTS public.client_documents (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id  UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name           TEXT NOT NULL,
  file_path           TEXT NOT NULL,
  file_size           INTEGER,
  mime_type           TEXT,
  notes               TEXT,
  reviewed            BOOLEAN NOT NULL DEFAULT false,
  reviewed_by         UUID REFERENCES auth.users(id),
  reviewed_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.7  notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        public.notification_type NOT NULL DEFAULT 'system',
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  data        JSONB DEFAULT '{}',
  read        BOOLEAN NOT NULL DEFAULT false,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.8  chat_conversations
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.9  chat_messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  role             TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content          TEXT NOT NULL,
  token_count      INTEGER,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.10 contact_inquiries
CREATE TABLE IF NOT EXISTS public.contact_inquiries (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  phone      TEXT,
  subject    TEXT NOT NULL,
  message    TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','spam')),
  replied_by UUID REFERENCES auth.users(id),
  replied_at TIMESTAMPTZ,
  user_id    UUID REFERENCES auth.users(id),  -- populated if logged in
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.11 audit_logs  (append-only — no UPDATE/DELETE policies)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES auth.users(id),
  target_type TEXT NOT NULL,
  target_id   TEXT,
  action      TEXT NOT NULL,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. INDEXES  (performance — all FK columns + common query patterns)
-- ─────────────────────────────────────────────────────────────────────────────

-- profiles
CREATE INDEX IF NOT EXISTS idx_profiles_user_id      ON public.profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email        ON public.profiles (email);

-- user_roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id    ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role       ON public.user_roles (role);

-- service_requests
CREATE INDEX IF NOT EXISTS idx_sr_user_id            ON public.service_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_sr_service_id         ON public.service_requests (service_id);
CREATE INDEX IF NOT EXISTS idx_sr_status             ON public.service_requests (status);
CREATE INDEX IF NOT EXISTS idx_sr_assigned_ca        ON public.service_requests (assigned_ca);
CREATE INDEX IF NOT EXISTS idx_sr_created_at         ON public.service_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sr_user_status        ON public.service_requests (user_id, status);

-- payments
CREATE INDEX IF NOT EXISTS idx_payments_user_id      ON public.payments (user_id);
CREATE INDEX IF NOT EXISTS idx_payments_sr_id        ON public.payments (service_request_id);
CREATE INDEX IF NOT EXISTS idx_payments_status       ON public.payments (status);
CREATE INDEX IF NOT EXISTS idx_payments_rzp_order    ON public.payments (razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_idempotency  ON public.payments (idempotency_key);

-- client_documents
CREATE INDEX IF NOT EXISTS idx_cd_sr_id              ON public.client_documents (service_request_id);
CREATE INDEX IF NOT EXISTS idx_cd_user_id            ON public.client_documents (user_id);
CREATE INDEX IF NOT EXISTS idx_cd_reviewed           ON public.client_documents (reviewed);

-- notifications
CREATE INDEX IF NOT EXISTS idx_notif_user_id         ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notif_user_read       ON public.notifications (user_id, read);
CREATE INDEX IF NOT EXISTS idx_notif_created_at      ON public.notifications (created_at DESC);

-- chat
CREATE INDEX IF NOT EXISTS idx_chat_conv_user_id     ON public.chat_conversations (user_id);
CREATE INDEX IF NOT EXISTS idx_chat_msg_conv_id      ON public.chat_messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_msg_created_at   ON public.chat_messages (created_at ASC);

-- contact_inquiries
CREATE INDEX IF NOT EXISTS idx_ci_status             ON public.contact_inquiries (status);
CREATE INDEX IF NOT EXISTS idx_ci_email              ON public.contact_inquiries (email);
CREATE INDEX IF NOT EXISTS idx_ci_created_at         ON public.contact_inquiries (created_at DESC);

-- audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_actor_id        ON public.audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_target          ON public.audit_logs (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at      ON public.audit_logs (created_at DESC);

-- services
CREATE INDEX IF NOT EXISTS idx_services_active       ON public.services (is_active);
CREATE INDEX IF NOT EXISTS idx_services_category     ON public.services (category);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. HELPER FUNCTIONS
-- ─────────────────────────────────────────────────────────────────────────────

-- 4.1  has_role — used in RLS policies
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4.2  get_user_role — returns primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY CASE role
    WHEN 'admin' THEN 1
    WHEN 'ca' THEN 2
    ELSE 3
  END
  LIMIT 1
$$;

-- 4.3  update_updated_at_column — generic trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 4.4  handle_new_user — auto-creates profile + role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role public.app_role;
BEGIN
  -- Determine role from metadata, default to client
  BEGIN
    _role := COALESCE(
      (NEW.raw_user_meta_data->>'role')::public.app_role,
      'client'
    );
  EXCEPTION WHEN invalid_text_representation THEN
    _role := 'client';
  END;

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

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 4.5  create_notification — inserts a notification row
CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id     UUID,
  _type        public.notification_type,
  _title       TEXT,
  _body        TEXT,
  _data        JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (_user_id, _type, _title, _body, _data)
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

-- 4.6  notify_on_service_status_change — auto-notification trigger
CREATE OR REPLACE FUNCTION public.notify_on_service_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _title TEXT;
  _body  TEXT;
  _type  public.notification_type := 'service_update';
BEGIN
  -- Only fire when status actually changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  CASE NEW.status
    WHEN 'in_progress' THEN
      _title := 'Service Started';
      _body  := 'Your service request is now in progress. We will keep you updated.';
    WHEN 'completed' THEN
      _title := 'Service Completed — Payment Ready';
      _body  := format(
        'Your service has been completed. Final amount: ₹%s. Please proceed to payment.',
        COALESCE(NEW.amount::TEXT, '0')
      );
    WHEN 'paid' THEN
      _title := 'Payment Received';
      _body  := 'Thank you! Your payment has been received and your service is now fully processed.';
      _type  := 'payment_received';
    WHEN 'cancelled' THEN
      _title := 'Service Cancelled';
      _body  := 'Your service request has been cancelled. Please contact us if you have questions.';
    ELSE
      RETURN NEW; -- no notification for other transitions
  END CASE;

  PERFORM public.create_notification(
    NEW.user_id, _type, _title, _body,
    jsonb_build_object('service_request_id', NEW.id, 'service_id', NEW.service_id)
  );

  RETURN NEW;
END;
$$;

-- 4.7  log_audit_event — write-only audit trail
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _actor_id    UUID,
  _target_type TEXT,
  _target_id   TEXT,
  _action      TEXT,
  _old_data    JSONB DEFAULT NULL,
  _new_data    JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (actor_id, target_type, target_id, action, old_data, new_data)
  VALUES (_actor_id, _target_type, _target_id, _action, _old_data, _new_data);
END;
$$;

-- 4.8  audit trigger function for service_requests
CREATE OR REPLACE FUNCTION public.audit_service_request_changes()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    PERFORM public.log_audit_event(
      auth.uid(),
      'service_request',
      OLD.id::TEXT,
      'update',
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit_event(
      NEW.user_id,
      'service_request',
      NEW.id::TEXT,
      'create',
      NULL,
      to_jsonb(NEW)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- 4.9  audit trigger function for payments
CREATE OR REPLACE FUNCTION public.audit_payment_changes()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    PERFORM public.log_audit_event(
      auth.uid(),
      'payment',
      OLD.id::TEXT,
      'update',
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit_event(
      NEW.user_id,
      'payment',
      NEW.id::TEXT,
      'create',
      NULL,
      to_jsonb(NEW)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- 4.10 mark_notification_read
CREATE OR REPLACE FUNCTION public.mark_notification_read(_notification_id UUID, _user_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notifications
  SET read = true, read_at = now()
  WHERE id = _notification_id AND user_id = _user_id;
END;
$$;

-- 4.11 get_admin_stats — aggregated stats for admin dashboard
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _result JSONB;
BEGIN
  -- Only callable by admin or ca
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ca')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT jsonb_build_object(
    'total_clients',   (SELECT COUNT(DISTINCT user_id) FROM public.user_roles WHERE role = 'client'),
    'total_requests',  (SELECT COUNT(*) FROM public.service_requests),
    'pending',         (SELECT COUNT(*) FROM public.service_requests WHERE status = 'pending'),
    'in_progress',     (SELECT COUNT(*) FROM public.service_requests WHERE status = 'in_progress'),
    'completed',       (SELECT COUNT(*) FROM public.service_requests WHERE status = 'completed'),
    'paid',            (SELECT COUNT(*) FROM public.service_requests WHERE status = 'paid'),
    'total_revenue',   (SELECT COALESCE(SUM(total_amount),0) FROM public.payments WHERE status = 'completed'),
    'revenue_this_month', (
      SELECT COALESCE(SUM(total_amount),0) FROM public.payments
      WHERE status = 'completed'
        AND created_at >= date_trunc('month', now())
    ),
    'open_inquiries',  (SELECT COUNT(*) FROM public.contact_inquiries WHERE status = 'open'),
    'generated_at',    now()
  ) INTO _result;

  RETURN _result;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. TRIGGERS
-- ─────────────────────────────────────────────────────────────────────────────

-- updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at     ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at     ON public.services;
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_sr_updated_at           ON public.service_requests;
CREATE TRIGGER update_sr_updated_at
  BEFORE UPDATE ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at     ON public.payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_conv_updated_at    ON public.chat_conversations;
CREATE TRIGGER update_chat_conv_updated_at
  BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_contact_updated_at      ON public.contact_inquiries;
CREATE TRIGGER update_contact_updated_at
  BEFORE UPDATE ON public.contact_inquiries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- new-user trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- service_request notifications trigger
DROP TRIGGER IF EXISTS on_service_request_status_change ON public.service_requests;
CREATE TRIGGER on_service_request_status_change
  AFTER UPDATE ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_service_status_change();

-- audit triggers
DROP TRIGGER IF EXISTS audit_service_requests ON public.service_requests;
CREATE TRIGGER audit_service_requests
  AFTER INSERT OR UPDATE ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.audit_service_request_changes();

DROP TRIGGER IF EXISTS audit_payments ON public.payments;
CREATE TRIGGER audit_payments
  AFTER INSERT OR UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.audit_payment_changes();

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_documents   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_inquiries  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs         ENABLE ROW LEVEL SECURITY;

-- ─── profiles ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "profiles: own read"         ON public.profiles;
DROP POLICY IF EXISTS "profiles: own write"        ON public.profiles;
DROP POLICY IF EXISTS "profiles: own insert"       ON public.profiles;
DROP POLICY IF EXISTS "profiles: staff read all"   ON public.profiles;

CREATE POLICY "profiles: own read"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "profiles: own write"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles: own insert"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles: staff read all"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ca'));

-- ─── user_roles ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "roles: own read"       ON public.user_roles;
DROP POLICY IF EXISTS "roles: own insert"     ON public.user_roles;
DROP POLICY IF EXISTS "roles: admin manage"   ON public.user_roles;

CREATE POLICY "roles: own read"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "roles: own insert"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "roles: admin manage"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ─── services ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "services: public read"   ON public.services;
DROP POLICY IF EXISTS "services: admin manage"  ON public.services;

CREATE POLICY "services: public read"
  ON public.services FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "services: admin manage"
  ON public.services FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ─── service_requests ───────────────────────────────────────────────────────

DROP POLICY IF EXISTS "sr: client select own"   ON public.service_requests;
DROP POLICY IF EXISTS "sr: client insert own"   ON public.service_requests;
DROP POLICY IF EXISTS "sr: client update own"   ON public.service_requests;
DROP POLICY IF EXISTS "sr: ca select all"       ON public.service_requests;
DROP POLICY IF EXISTS "sr: ca update all"       ON public.service_requests;
DROP POLICY IF EXISTS "sr: admin all"           ON public.service_requests;

CREATE POLICY "sr: client select own"
  ON public.service_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "sr: client insert own"
  ON public.service_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Clients can update only notes/docs (not status/amount)
CREATE POLICY "sr: client update own"
  ON public.service_requests FOR UPDATE
  USING (auth.uid() = user_id AND status NOT IN ('paid', 'cancelled'));

CREATE POLICY "sr: ca select all"
  ON public.service_requests FOR SELECT
  USING (public.has_role(auth.uid(), 'ca'));

CREATE POLICY "sr: ca update all"
  ON public.service_requests FOR UPDATE
  USING (public.has_role(auth.uid(), 'ca'));

CREATE POLICY "sr: admin all"
  ON public.service_requests FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ─── payments ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "pay: client select own"   ON public.payments;
DROP POLICY IF EXISTS "pay: client insert own"   ON public.payments;
DROP POLICY IF EXISTS "pay: admin all"           ON public.payments;
DROP POLICY IF EXISTS "pay: ca select all"       ON public.payments;

CREATE POLICY "pay: client select own"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "pay: client insert own"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pay: ca select all"
  ON public.payments FOR SELECT
  USING (public.has_role(auth.uid(), 'ca'));

CREATE POLICY "pay: admin all"
  ON public.payments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ─── client_documents ───────────────────────────────────────────────────────

DROP POLICY IF EXISTS "cd: client select own"     ON public.client_documents;
DROP POLICY IF EXISTS "cd: client insert own"     ON public.client_documents;
DROP POLICY IF EXISTS "cd: client delete own"     ON public.client_documents;
DROP POLICY IF EXISTS "cd: ca select all"         ON public.client_documents;
DROP POLICY IF EXISTS "cd: ca update reviewed"    ON public.client_documents;
DROP POLICY IF EXISTS "cd: admin all"             ON public.client_documents;

CREATE POLICY "cd: client select own"
  ON public.client_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "cd: client insert own"
  ON public.client_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cd: client delete own"
  ON public.client_documents FOR DELETE
  USING (auth.uid() = user_id AND reviewed = false);

CREATE POLICY "cd: ca select all"
  ON public.client_documents FOR SELECT
  USING (public.has_role(auth.uid(), 'ca'));

CREATE POLICY "cd: ca update reviewed"
  ON public.client_documents FOR UPDATE
  USING (public.has_role(auth.uid(), 'ca'));

CREATE POLICY "cd: admin all"
  ON public.client_documents FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ─── notifications ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "notif: own read"      ON public.notifications;
DROP POLICY IF EXISTS "notif: own update"    ON public.notifications;
DROP POLICY IF EXISTS "notif: admin all"     ON public.notifications;

CREATE POLICY "notif: own read"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only mark as read (update `read` and `read_at`)
CREATE POLICY "notif: own update"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notif: admin all"
  ON public.notifications FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ─── chat_conversations ─────────────────────────────────────────────────────

DROP POLICY IF EXISTS "chat_c: own crud"     ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_c: admin read"   ON public.chat_conversations;

CREATE POLICY "chat_c: own crud"
  ON public.chat_conversations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chat_c: admin read"
  ON public.chat_conversations FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- ─── chat_messages ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "chat_m: own conv read"    ON public.chat_messages;
DROP POLICY IF EXISTS "chat_m: own conv insert"  ON public.chat_messages;
DROP POLICY IF EXISTS "chat_m: admin read"       ON public.chat_messages;

CREATE POLICY "chat_m: own conv read"
  ON public.chat_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = chat_messages.conversation_id AND c.user_id = auth.uid()
  ));

CREATE POLICY "chat_m: own conv insert"
  ON public.chat_messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = chat_messages.conversation_id AND c.user_id = auth.uid()
  ));

CREATE POLICY "chat_m: admin read"
  ON public.chat_messages FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- ─── contact_inquiries ──────────────────────────────────────────────────────

DROP POLICY IF EXISTS "ci: public insert"    ON public.contact_inquiries;
DROP POLICY IF EXISTS "ci: own read"         ON public.contact_inquiries;
DROP POLICY IF EXISTS "ci: staff all"        ON public.contact_inquiries;

-- Anyone (incl. anonymous) can submit an inquiry
CREATE POLICY "ci: public insert"
  ON public.contact_inquiries FOR INSERT
  WITH CHECK (true);

-- Logged-in users can view their own submissions
CREATE POLICY "ci: own read"
  ON public.contact_inquiries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "ci: staff all"
  ON public.contact_inquiries FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ca'));

-- ─── audit_logs ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "audit: admin read"    ON public.audit_logs;

-- Only admins can read; no user or CA can modify
CREATE POLICY "audit: admin read"
  ON public.audit_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. STORAGE BUCKETS
-- ─────────────────────────────────────────────────────────────────────────────

-- service-documents (CA-uploaded deliverables — private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-documents', 'service-documents', false,
  52428800,  -- 50 MB
  ARRAY['application/pdf','application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/zip','application/x-zip-compressed',
        'image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- client-uploads (client document submissions — private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client-uploads', 'client-uploads', false,
  20971520,  -- 20 MB
  ARRAY['application/pdf','application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg','image/png','image/webp','image/heic']
)
ON CONFLICT (id) DO UPDATE
  SET file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- avatars (public CDN bucket)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 'avatars', true,
  2097152,   -- 2 MB
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ─── Storage RLS ─────────────────────────────────────────────────────────────

-- service-documents: CA/Admin upload
DROP POLICY IF EXISTS "svc-docs: staff upload"   ON storage.objects;
DROP POLICY IF EXISTS "svc-docs: staff update"   ON storage.objects;
DROP POLICY IF EXISTS "svc-docs: client read"    ON storage.objects;
DROP POLICY IF EXISTS "svc-docs: staff read all" ON storage.objects;
DROP POLICY IF EXISTS "svc-docs: staff delete"   ON storage.objects;

CREATE POLICY "svc-docs: staff upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'service-documents'
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ca'))
  );

CREATE POLICY "svc-docs: staff update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'service-documents'
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ca'))
  );

CREATE POLICY "svc-docs: staff delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'service-documents'
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ca'))
  );

-- Clients can read files in their own user folder (path: {user_id}/...)
CREATE POLICY "svc-docs: client read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'service-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "svc-docs: staff read all"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'service-documents'
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ca'))
  );

-- client-uploads: users upload to their own folder
DROP POLICY IF EXISTS "cli-up: own upload"    ON storage.objects;
DROP POLICY IF EXISTS "cli-up: own read"      ON storage.objects;
DROP POLICY IF EXISTS "cli-up: own delete"    ON storage.objects;
DROP POLICY IF EXISTS "cli-up: staff read"    ON storage.objects;

CREATE POLICY "cli-up: own upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'client-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "cli-up: own read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'client-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "cli-up: own delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'client-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "cli-up: staff read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'client-uploads'
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ca'))
  );

-- avatars: public read, owner write
DROP POLICY IF EXISTS "avatars: public read"   ON storage.objects;
DROP POLICY IF EXISTS "avatars: own upload"    ON storage.objects;
DROP POLICY IF EXISTS "avatars: own delete"    ON storage.objects;

CREATE POLICY "avatars: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars: own upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars: own delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. REALTIME
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable realtime for live-update tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'service_requests', 'notifications', 'client_documents', 'chat_messages'
  ] LOOP
    BEGIN
      EXECUTE format(
        'ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. SEED DATA — Default Services
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.services
  (id, name, description, long_desc, icon, category, price_range, features, sort_order)
VALUES
  ('accounting',
   'Accounting & Bookkeeping',
   'Precision bookkeeping and financial reporting compliant with IAS/IND AS.',
   'We handle your complete financial record management — from daily transactions to monthly MIS reports, reconciliations, and year-end financial statements fully compliant with IAS, US GAAP, and IND AS standards.',
   'Calculator', 'Financial', '₹5,000 – ₹25,000/month',
   ARRAY['Monthly bookkeeping','Financial statements','Bank reconciliation','Cash flow management','MIS reports','IAS/IND AS compliance'],
   1),
  ('auditing',
   'Auditing & Assurance',
   'Statutory, internal, and tax audits with thorough assurance services.',
   'Independent and objective audit services covering statutory audits, internal audits, tax audits under various sections, and management audits to ensure governance and financial integrity.',
   'FileCheck', 'Compliance', '₹15,000 – ₹1,00,000+',
   ARRAY['Statutory audits','Internal audits','Tax audits','Due diligence','Management audits','Compliance reviews'],
   2),
  ('tax',
   'Tax Advisory & Compliance',
   'End-to-end Income Tax, GST, and TDS compliance and strategic tax planning.',
   'Expert advisory covering filing of all ITR forms (ITR-1 to ITR-7), GST registration, GSTR returns, TDS compliance, advance tax computation, and proactive tax planning to minimise your liability legally.',
   'Receipt', 'Tax', '₹2,000 – ₹50,000',
   ARRAY['ITR filing (all forms)','GST registration & returns','TDS compliance','Advance tax planning','Tax notices handling','Form 15CA/CB'],
   3),
  ('company-law',
   'Company Law & Secretarial',
   'Company incorporation, ROC filings, and annual statutory compliance.',
   'Comprehensive corporate governance services from inception — company/LLP/OPC registration, drafting of MOA/AOA, ROC filings, annual compliance, board meeting support, and secretarial records maintenance.',
   'Building2', 'Legal', '₹5,000 – ₹50,000',
   ARRAY['Company/LLP/OPC registration','ROC filings','Annual compliance','Board meeting minutes','MOA/AOA drafting','Statutory registers'],
   4),
  ('payroll',
   'Payroll Management',
   'Complete payroll processing with PF, ESI, TDS compliance, and payslips.',
   'Full-cycle payroll services: salary computation, PF/ESI challan preparation, TDS deduction and filing, Form 16, payslip generation, leave management, and compliance with labour laws.',
   'Users', 'HR', '₹3,000 – ₹20,000/month',
   ARRAY['Salary processing','PF/ESI compliance','TDS on salaries','Form 16 issuance','Payslip generation','Leave management'],
   5),
  ('finance-advisory',
   'Finance & Project Advisory',
   'Strategic financial consulting, business valuation, and project financing.',
   'Senior-level advisory for business valuation, CMA data preparation, fund raising, project reports for bank finance, due diligence, financial modelling, and investment facilitation.',
   'TrendingUp', 'Advisory', '₹20,000 – ₹2,00,000+',
   ARRAY['Business valuation','Project financing','CMA data preparation','Due diligence','Financial modelling','Investment advisory'],
   6)
ON CONFLICT (id) DO UPDATE
  SET name        = EXCLUDED.name,
      description = EXCLUDED.description,
      long_desc   = EXCLUDED.long_desc,
      icon        = EXCLUDED.icon,
      category    = EXCLUDED.category,
      price_range = EXCLUDED.price_range,
      features    = EXCLUDED.features,
      sort_order  = EXCLUDED.sort_order,
      updated_at  = now();

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
