
-- Create chat conversations table
CREATE TABLE public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text DEFAULT 'New Conversation',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations"
ON public.chat_conversations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
ON public.chat_conversations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
ON public.chat_conversations FOR DELETE
USING (auth.uid() = user_id);

-- Create chat messages table
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages of their conversations"
ON public.chat_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.chat_conversations
  WHERE id = chat_messages.conversation_id AND user_id = auth.uid()
));

CREATE POLICY "Users can insert messages to their conversations"
ON public.chat_messages FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.chat_conversations
  WHERE id = chat_messages.conversation_id AND user_id = auth.uid()
));

-- Triggers for updated_at
CREATE TRIGGER update_chat_conversations_updated_at
BEFORE UPDATE ON public.chat_conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
