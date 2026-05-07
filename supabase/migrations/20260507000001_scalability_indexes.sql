-- =============================================================================
-- Performance Indexes for 100+ Concurrent Users
-- Date: 2026-05-07
-- =============================================================================
-- These indexes ensure fast lookups for the most frequent query patterns
-- at scale (100+ concurrent users, each with multiple service requests,
-- appointments, invoices, and notifications).

-- ── Invoices: queried by user_id + generated_at DESC on every dashboard load
CREATE INDEX IF NOT EXISTS idx_invoices_user_id
  ON public.invoices (user_id);

CREATE INDEX IF NOT EXISTS idx_invoices_generated_at
  ON public.invoices (generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_invoices_user_generated
  ON public.invoices (user_id, generated_at DESC);

-- ── Appointments: compound index for user-scoped date-sorted queries
CREATE INDEX IF NOT EXISTS idx_appointments_user_date
  ON public.appointments (user_id, appointment_date DESC);

-- ── Notifications: compound index for unread-count badge (hot path on every page)
CREATE INDEX IF NOT EXISTS idx_notif_user_read_created
  ON public.notifications (user_id, read, created_at DESC);

-- ── Client documents: compound for user-scoped document listing
CREATE INDEX IF NOT EXISTS idx_cd_user_created
  ON public.client_documents (user_id, created_at DESC);

-- ── Service requests: compound for user-scoped status filtering
CREATE INDEX IF NOT EXISTS idx_sr_user_created
  ON public.service_requests (user_id, created_at DESC);

-- ── Blog posts: fast public listing (published + date)
CREATE INDEX IF NOT EXISTS idx_blog_published_at
  ON public.blog_posts (published, published_at DESC)
  WHERE published = true;

-- ── Contact inquiries: fast job application filtering
CREATE INDEX IF NOT EXISTS idx_ci_subject_created
  ON public.contact_inquiries (created_at DESC)
  WHERE subject LIKE '[Job Application]%';
