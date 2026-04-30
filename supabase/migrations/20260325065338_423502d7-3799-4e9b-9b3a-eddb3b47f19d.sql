
-- Appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ca_id UUID,
  service_id TEXT REFERENCES public.services(id),
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'scheduled',
  meeting_type TEXT NOT NULL DEFAULT 'video',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Users can view their own appointments
CREATE POLICY "Users can view own appointments" ON public.appointments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own appointments
CREATE POLICY "Users can create own appointments" ON public.appointments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own appointments (reschedule/cancel)
CREATE POLICY "Users can update own appointments" ON public.appointments
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- CAs can view appointments assigned to them
CREATE POLICY "CAs can view assigned appointments" ON public.appointments
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'ca'));

-- CAs can update appointments assigned to them
CREATE POLICY "CAs can update assigned appointments" ON public.appointments
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'ca'));

-- Admins can manage all appointments
CREATE POLICY "Admins can manage all appointments" ON public.appointments
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Persistent notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- System/admins can insert notifications for any user
CREATE POLICY "Admins can manage all notifications" ON public.notifications
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Service role can insert notifications (for triggers/functions)
CREATE POLICY "Service can insert notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Trigger to auto-create notifications on service_request status changes
CREATE OR REPLACE FUNCTION public.notify_service_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  svc_name TEXT;
  notif_title TEXT;
  notif_message TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT name INTO svc_name FROM public.services WHERE id = NEW.service_id;
    
    CASE NEW.status
      WHEN 'in-progress', 'in_progress' THEN
        notif_title := '🚀 Service Started';
        notif_message := 'Your ' || COALESCE(svc_name, 'service') || ' request is now being worked on.';
      WHEN 'completed' THEN
        notif_title := '✅ Service Completed';
        notif_message := 'Your ' || COALESCE(svc_name, 'service') || ' is completed! You can now make the payment.';
      WHEN 'paid' THEN
        notif_title := '💳 Payment Confirmed';
        notif_message := 'Payment for ' || COALESCE(svc_name, 'service') || ' has been received. Thank you!';
      WHEN 'cancelled' THEN
        notif_title := '❌ Service Cancelled';
        notif_message := 'Your ' || COALESCE(svc_name, 'service') || ' request has been cancelled.';
      ELSE
        notif_title := '📋 Status Updated';
        notif_message := 'Your ' || COALESCE(svc_name, 'service') || ' status changed to ' || NEW.status || '.';
    END CASE;
    
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (NEW.user_id, notif_title, notif_message, 'service_update', '/dashboard');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_service_status_change
  AFTER UPDATE ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_service_status_change();

-- Updated_at trigger for appointments
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
