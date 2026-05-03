-- Update all policies to treat 'ca' identically to 'admin'

DROP POLICY IF EXISTS "roles: admin manage" ON public.user_roles;
CREATE POLICY "roles: admin manage" ON public.user_roles
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ca'));

DROP POLICY IF EXISTS "services: admin manage" ON public.services;
CREATE POLICY "services: admin manage" ON public.services
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ca'));

DROP POLICY IF EXISTS "sr: admin all" ON public.service_requests;
CREATE POLICY "sr: admin all" ON public.service_requests
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ca'));

DROP POLICY IF EXISTS "pay: admin all" ON public.payments;
CREATE POLICY "pay: admin all" ON public.payments
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ca'));

DROP POLICY IF EXISTS "cd: admin all" ON public.client_documents;
CREATE POLICY "cd: admin all" ON public.client_documents
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ca'));

DROP POLICY IF EXISTS "notif: admin all" ON public.notifications;
CREATE POLICY "notif: admin all" ON public.notifications
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ca'));

DROP POLICY IF EXISTS "appt: admin all" ON public.appointments;
CREATE POLICY "appt: admin all" ON public.appointments
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ca'));

DROP POLICY IF EXISTS "inv: admin all" ON public.invoices;
CREATE POLICY "inv: admin all" ON public.invoices
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ca'));

DROP POLICY IF EXISTS "blog: admin all" ON public.blog_posts;
CREATE POLICY "blog: admin all" ON public.blog_posts
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ca'));

DROP POLICY IF EXISTS "test: admin all" ON public.testimonials;
CREATE POLICY "test: admin all" ON public.testimonials
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ca'));

DROP POLICY IF EXISTS "dm_conv: admin all" ON public.chat_conversations;
CREATE POLICY "dm_conv: admin all" ON public.chat_conversations
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ca'));

DROP POLICY IF EXISTS "dm_msg: admin all" ON public.chat_messages;
CREATE POLICY "dm_msg: admin all" ON public.chat_messages
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ca'));

DROP POLICY IF EXISTS "blocked_dates: admin manage" ON public.blocked_dates;
CREATE POLICY "blocked_dates: admin manage" ON public.blocked_dates
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ca'));
