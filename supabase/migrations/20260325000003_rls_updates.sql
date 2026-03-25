-- =============================================================================
-- GMR & Associates — Migration: RLS Policy Updates
-- CA update/delete on blog_posts + CA select-all on testimonials
-- Date: 2026-03-25
-- =============================================================================

-- ── blog_posts: allow CA to update/delete their own posts ───────────────────
DROP POLICY IF EXISTS "blog: ca update own"   ON public.blog_posts;
DROP POLICY IF EXISTS "blog: ca delete own"   ON public.blog_posts;

CREATE POLICY "blog: ca update own"
  ON public.blog_posts FOR UPDATE
  USING (
    auth.uid() = author_id
    AND (public.has_role(auth.uid(), 'ca') OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "blog: ca delete own"
  ON public.blog_posts FOR DELETE
  USING (
    auth.uid() = author_id
    AND (public.has_role(auth.uid(), 'ca') OR public.has_role(auth.uid(), 'admin'))
  );

-- ── testimonials: allow CA to read all testimonials (including pending) ──────
DROP POLICY IF EXISTS "test: ca read all"     ON public.testimonials;

CREATE POLICY "test: ca read all"
  ON public.testimonials FOR SELECT
  USING (public.has_role(auth.uid(), 'ca'));

-- ── testimonials: allow CA to update approval status ─────────────────────────
DROP POLICY IF EXISTS "test: ca update"       ON public.testimonials;

CREATE POLICY "test: ca update"
  ON public.testimonials FOR UPDATE
  USING (public.has_role(auth.uid(), 'ca'));
