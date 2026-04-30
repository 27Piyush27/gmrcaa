
-- Fix the overly permissive INSERT policy on notifications
DROP POLICY "Service can insert notifications" ON public.notifications;

-- Replace with a policy that only allows inserting notifications for yourself (or admin handles it via ALL policy)
CREATE POLICY "Users can receive notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
