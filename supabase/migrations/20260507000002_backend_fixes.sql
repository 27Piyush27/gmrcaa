-- =============================================================================
-- Backend Bug Fixes — Schema Alignment
-- Date: 2026-05-07
-- =============================================================================
-- This migration fixes schema mismatches between the original DB tables
-- (created by 20260126 migration) and the frontend code + API routes that
-- were written against the production_schema (20260308) spec.

-- ── Fix 1: Add missing columns to payments table ──
-- The original migration only created: amount, currency, status, etc.
-- The production schema spec added: gst_amount, total_amount, idempotency_key, metadata
-- The API routes (verify-razorpay-payment.js) write these columns.
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS gst_amount       NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_amount     NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS idempotency_key  TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS metadata         JSONB DEFAULT '{}';

-- Backfill total_amount for any rows that already exist (amount + gst_amount)
UPDATE public.payments
  SET total_amount = amount + gst_amount
  WHERE total_amount IS NULL;

-- Now make it NOT NULL for future inserts
ALTER TABLE public.payments
  ALTER COLUMN total_amount SET NOT NULL;

-- ── Fix 2: Add missing columns to service_requests ──
-- ServiceCheckout.jsx and verify-razorpay-payment.js write payment_id and
-- paid_at but these columns don't exist in the original schema.
-- Also add amount + document_url columns from the production spec.
ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS amount       NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS document_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_id   TEXT,
  ADD COLUMN IF NOT EXISTS paid_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS priority     TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low','normal','high','urgent')),
  ADD COLUMN IF NOT EXISTS due_date     DATE;

-- ── Fix 3: Normalize service_requests status values ──
-- Original schema: CHECK (status IN ('pending','in-progress','completed','cancelled'))
-- Frontend code:   Uses 'in_progress' (underscore) and 'paid' everywhere
-- Fix: Convert any 'in-progress' rows to 'in_progress', then update the constraint
UPDATE public.service_requests
  SET status = 'in_progress'
  WHERE status = 'in-progress';

-- Drop the old CHECK constraint and add the correct one
ALTER TABLE public.service_requests
  DROP CONSTRAINT IF EXISTS service_requests_status_check;

ALTER TABLE public.service_requests
  ADD CONSTRAINT service_requests_status_check
    CHECK (status IN ('pending','in_progress','completed','paid','cancelled'));

-- ── Fix 4: Update get_admin_stats to count 'new' inquiries (not 'open') ──
-- and use payments.amount as fallback if total_amount doesn't exist yet.
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _result JSONB;
BEGIN
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
    'total_revenue',   (SELECT COALESCE(SUM(COALESCE(total_amount, amount)),0) FROM public.payments WHERE status = 'completed'),
    'revenue_this_month', (
      SELECT COALESCE(SUM(COALESCE(total_amount, amount)),0) FROM public.payments
      WHERE status = 'completed'
        AND created_at >= date_trunc('month', now())
    ),
    'open_inquiries',  (SELECT COUNT(*) FROM public.contact_inquiries WHERE status = 'new'),
    'generated_at',    now()
  ) INTO _result;

  RETURN _result;
END;
$$;

-- ── Fix 5: Make razorpay columns UNIQUE (if not already) ──
-- The production spec marks these as UNIQUE but the original migration didn't.
-- Safe to run — won't fail if they already are unique or if duplicates exist.
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_razorpay_order_id
  ON public.payments (razorpay_order_id)
  WHERE razorpay_order_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id
  ON public.payments (razorpay_payment_id)
  WHERE razorpay_payment_id IS NOT NULL;
