-- Messages from CA/Admin to client (per service request)
CREATE TABLE public.service_request_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_request_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 500),
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_srm_request ON public.service_request_messages(service_request_id);
CREATE INDEX idx_srm_recipient ON public.service_request_messages(recipient_id, read);

ALTER TABLE public.service_request_messages ENABLE ROW LEVEL SECURITY;

-- Admins manage all
CREATE POLICY "Admins manage all request messages"
ON public.service_request_messages FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- CAs can insert and view
CREATE POLICY "CAs can view all request messages"
ON public.service_request_messages FOR SELECT
USING (public.has_role(auth.uid(), 'ca'));

CREATE POLICY "CAs can send request messages"
ON public.service_request_messages FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'ca') AND auth.uid() = sender_id);

-- Clients see messages addressed to them
CREATE POLICY "Clients view their own request messages"
ON public.service_request_messages FOR SELECT
USING (auth.uid() = recipient_id);

-- Clients can mark their messages as read
CREATE POLICY "Clients can update read flag on their messages"
ON public.service_request_messages FOR UPDATE
USING (auth.uid() = recipient_id);

-- Trigger: create a notification for the recipient when a new message arrives
CREATE OR REPLACE FUNCTION public.notify_service_request_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  svc_name TEXT;
BEGIN
  SELECT s.name INTO svc_name
  FROM public.service_requests sr
  LEFT JOIN public.services s ON s.id = sr.service_id
  WHERE sr.id = NEW.service_request_id;

  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (
    NEW.recipient_id,
    '💬 New note from your CA',
    'You received a note about ' || COALESCE(svc_name, 'your service') || ': ' || left(NEW.message, 120),
    'service_message',
    '/dashboard'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_service_request_message
AFTER INSERT ON public.service_request_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_service_request_message();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_request_messages;