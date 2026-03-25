-- =============================================================================
-- GMR & Associates — Migration: Blog Posts + Testimonials
-- Version: 1.0  Date: 2026-03-25
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. BLOG POSTS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  excerpt      TEXT,
  content      TEXT,
  category     TEXT NOT NULL DEFAULT 'General',
  emoji        TEXT NOT NULL DEFAULT '📄',
  read_time    TEXT NOT NULL DEFAULT '5 min',
  published    BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_published    ON public.blog_posts (published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_category     ON public.blog_posts (category);
CREATE INDEX IF NOT EXISTS idx_blog_slug         ON public.blog_posts (slug);

DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. RLS — BLOG POSTS
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blog: public read"    ON public.blog_posts;
DROP POLICY IF EXISTS "blog: ca insert"      ON public.blog_posts;
DROP POLICY IF EXISTS "blog: admin all"      ON public.blog_posts;

-- Anyone can read published posts
CREATE POLICY "blog: public read"
  ON public.blog_posts FOR SELECT
  USING (published = true OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ca'));

-- CA can create posts
CREATE POLICY "blog: ca insert"
  ON public.blog_posts FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'ca') OR public.has_role(auth.uid(), 'admin'));

-- Admin has full control
CREATE POLICY "blog: admin all"
  ON public.blog_posts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. TESTIMONIALS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.testimonials (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  role_title  TEXT,
  rating      INTEGER NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  text        TEXT NOT NULL,
  approved    BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_testimonials_approved    ON public.testimonials (approved);
CREATE INDEX IF NOT EXISTS idx_testimonials_client_id  ON public.testimonials (client_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_created_at ON public.testimonials (created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. RLS — TESTIMONIALS
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "test: public read approved"  ON public.testimonials;
DROP POLICY IF EXISTS "test: auth insert"            ON public.testimonials;
DROP POLICY IF EXISTS "test: admin all"              ON public.testimonials;

-- Anyone can read approved testimonials
CREATE POLICY "test: public read approved"
  ON public.testimonials FOR SELECT
  USING (approved = true OR public.has_role(auth.uid(), 'admin'));

-- Any authenticated user can submit a testimonial
CREATE POLICY "test: auth insert"
  ON public.testimonials FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Admin manages all (approve/reject/delete)
CREATE POLICY "test: admin all"
  ON public.testimonials FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));
