CREATE TABLE IF NOT EXISTS public.chatbot_documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name   TEXT NOT NULL,
  file_path   TEXT NOT NULL,
  mime_type   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chatbot_documents ENABLE ROW LEVEL SECURITY;

-- Clients can see their own
CREATE POLICY "chatbot_docs: client select own"
  ON public.chatbot_documents FOR SELECT
  USING (auth.uid() = user_id);

-- Clients can insert their own
CREATE POLICY "chatbot_docs: client insert own"
  ON public.chatbot_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- CA/Admin can see all
CREATE POLICY "chatbot_docs: staff select all"
  ON public.chatbot_documents FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ca'));

-- CA/Admin can delete any
CREATE POLICY "chatbot_docs: staff delete all"
  ON public.chatbot_documents FOR DELETE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ca'));

-- Client can delete their own
CREATE POLICY "chatbot_docs: client delete own"
  ON public.chatbot_documents FOR DELETE
  USING (auth.uid() = user_id);
