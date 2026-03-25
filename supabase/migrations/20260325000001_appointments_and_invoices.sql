-- =============================================================================
-- GMR & Associates — Migration: Appointments + Invoices
-- Version: 1.0  Date: 2026-03-25
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. APPOINTMENTS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.appointments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  time_slot   TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'video'
                CHECK (type IN ('video', 'phone', 'in_person')),
  topic       TEXT NOT NULL,
  notes       TEXT,
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  assigned_ca UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_appt_user_id   ON public.appointments (user_id);
CREATE INDEX IF NOT EXISTS idx_appt_date       ON public.appointments (date);
CREATE INDEX IF NOT EXISTS idx_appt_status     ON public.appointments (status);
CREATE INDEX IF NOT EXISTS idx_appt_created_at ON public.appointments (created_at DESC);

-- updated_at trigger
DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. ROW LEVEL SECURITY — APPOINTMENTS
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Clients: see and create their own appointments
DROP POLICY IF EXISTS "appt: client select own"  ON public.appointments;
DROP POLICY IF EXISTS "appt: client insert own"  ON public.appointments;
DROP POLICY IF EXISTS "appt: ca select all"      ON public.appointments;
DROP POLICY IF EXISTS "appt: ca update all"      ON public.appointments;
DROP POLICY IF EXISTS "appt: admin all"          ON public.appointments;

CREATE POLICY "appt: client select own"
  ON public.appointments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "appt: client insert own"
  ON public.appointments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- CA: can see all appointments and update them (confirm/cancel)
CREATE POLICY "appt: ca select all"
  ON public.appointments FOR SELECT
  USING (public.has_role(auth.uid(), 'ca'));

CREATE POLICY "appt: ca update all"
  ON public.appointments FOR UPDATE
  USING (public.has_role(auth.uid(), 'ca'));

-- Admin: full access
CREATE POLICY "appt: admin all"
  ON public.appointments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. INVOICES TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.invoices (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_id     UUID REFERENCES public.payments(id),
  invoice_number TEXT NOT NULL UNIQUE,
  service_title  TEXT,
  base_amount    NUMERIC(12,2) NOT NULL DEFAULT 0,
  gst_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount   NUMERIC(12,2) NOT NULL DEFAULT 0,
  generated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_user_id      ON public.invoices (user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_id   ON public.invoices (payment_id);
CREATE INDEX IF NOT EXISTS idx_invoices_generated_at ON public.invoices (generated_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. ROW LEVEL SECURITY — INVOICES
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inv: client select own"  ON public.invoices;
DROP POLICY IF EXISTS "inv: client insert own"  ON public.invoices;
DROP POLICY IF EXISTS "inv: ca select all"      ON public.invoices;
DROP POLICY IF EXISTS "inv: admin all"          ON public.invoices;

CREATE POLICY "inv: client select own"
  ON public.invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "inv: client insert own"
  ON public.invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "inv: ca select all"
  ON public.invoices FOR SELECT
  USING (public.has_role(auth.uid(), 'ca'));

CREATE POLICY "inv: admin all"
  ON public.invoices FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. REALTIME — enable for appointments table
-- ─────────────────────────────────────────────────────────────────────────────
-- Run this in Supabase dashboard: Database → Replication → enable appointments
-- (Cannot be done via SQL migration in all Supabase versions)
