-- =============================================================================
-- GMR & Associates — Migration: Appointment System Enhancements
-- Version: 2.0  Date: 2026-04-29
-- Safe migration: Uses IF NOT EXISTS / IF EXISTS guards throughout.
-- Only creates blocked_dates table (for admin date management).
-- All appointment columns already exist in production.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. BLOCKED DATES TABLE — Admin can block dates from receiving bookings
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.blocked_dates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocked_date DATE NOT NULL UNIQUE,
  reason      TEXT,
  blocked_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blocked_dates_date
  ON public.blocked_dates (blocked_date);

-- RLS for blocked_dates
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;

-- Anyone can read blocked dates (needed to disable slots on the booking form)
DROP POLICY IF EXISTS "blocked_dates: public read" ON public.blocked_dates;
CREATE POLICY "blocked_dates: public read"
  ON public.blocked_dates FOR SELECT
  USING (true);

-- Only admin/ca can manage blocked dates
DROP POLICY IF EXISTS "blocked_dates: admin manage" ON public.blocked_dates;
CREATE POLICY "blocked_dates: admin manage"
  ON public.blocked_dates FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "blocked_dates: ca manage" ON public.blocked_dates;
CREATE POLICY "blocked_dates: ca manage"
  ON public.blocked_dates FOR ALL
  USING (public.has_role(auth.uid(), 'ca'));
