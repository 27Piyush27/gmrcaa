-- =============================================================================
-- Direct Messaging System — Client ↔ CA Real-time Chat
-- Version: 1.0  Date: 2026-04-28
-- =============================================================================

-- 1. Direct message conversations (one per client ↔ CA pair)
CREATE TABLE IF NOT EXISTS public.dm_conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ca_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message  TEXT,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, ca_id)
);

-- 2. Direct messages
CREATE TABLE IF NOT EXISTS public.dm_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.dm_conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  message_type    TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text','file','system')),
  file_url        TEXT,
  file_name       TEXT,
  read            BOOLEAN NOT NULL DEFAULT false,
  read_at         TIMESTAMPTZ,
  edited          BOOLEAN NOT NULL DEFAULT false,
  deleted         BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Typing indicators (ephemeral — rows auto-expire)
CREATE TABLE IF NOT EXISTS public.dm_typing (
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.dm_conversations(id) ON DELETE CASCADE,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, conversation_id)
);

-- 4. Online presence
CREATE TABLE IF NOT EXISTS public.dm_presence (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_online  BOOLEAN NOT NULL DEFAULT false,
  last_seen  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── INDEXES ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_dm_conv_client     ON public.dm_conversations (client_id);
CREATE INDEX IF NOT EXISTS idx_dm_conv_ca         ON public.dm_conversations (ca_id);
CREATE INDEX IF NOT EXISTS idx_dm_conv_last_msg   ON public.dm_conversations (last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_dm_msg_conv        ON public.dm_messages (conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_dm_msg_sender      ON public.dm_messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_dm_msg_read        ON public.dm_messages (conversation_id, read) WHERE NOT read;

-- ─── TRIGGERS ───────────────────────────────────────────────────────────────

-- Auto-update last_message on new message
CREATE OR REPLACE FUNCTION public.update_dm_conversation_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.dm_conversations
  SET last_message = NEW.content,
      last_message_at = NEW.created_at,
      updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_dm_message_insert ON public.dm_messages;
CREATE TRIGGER on_dm_message_insert
  AFTER INSERT ON public.dm_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_dm_conversation_last_message();

-- ─── ROW LEVEL SECURITY ────────────────────────────────────────────────────

ALTER TABLE public.dm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_typing        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_presence      ENABLE ROW LEVEL SECURITY;

-- dm_conversations: participants can see their own conversations
CREATE POLICY "dm_conv: own read"
  ON public.dm_conversations FOR SELECT
  USING (auth.uid() = client_id OR auth.uid() = ca_id);

CREATE POLICY "dm_conv: client insert"
  ON public.dm_conversations FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "dm_conv: own update"
  ON public.dm_conversations FOR UPDATE
  USING (auth.uid() = client_id OR auth.uid() = ca_id);

CREATE POLICY "dm_conv: admin all"
  ON public.dm_conversations FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- dm_messages: participants can read messages in their conversations
CREATE POLICY "dm_msg: read own conv"
  ON public.dm_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.dm_conversations c
    WHERE c.id = conversation_id
    AND (c.client_id = auth.uid() OR c.ca_id = auth.uid())
  ));

CREATE POLICY "dm_msg: insert own conv"
  ON public.dm_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.dm_conversations c
      WHERE c.id = conversation_id
      AND (c.client_id = auth.uid() OR c.ca_id = auth.uid())
    )
  );

CREATE POLICY "dm_msg: update own conv"
  ON public.dm_messages FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.dm_conversations c
    WHERE c.id = conversation_id
    AND (c.client_id = auth.uid() OR c.ca_id = auth.uid())
  ));

CREATE POLICY "dm_msg: admin all"
  ON public.dm_messages FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- dm_typing
CREATE POLICY "dm_typing: own manage"
  ON public.dm_typing FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "dm_typing: read conv"
  ON public.dm_typing FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.dm_conversations c
    WHERE c.id = conversation_id
    AND (c.client_id = auth.uid() OR c.ca_id = auth.uid())
  ));

-- dm_presence
CREATE POLICY "dm_presence: own manage"
  ON public.dm_presence FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "dm_presence: read all"
  ON public.dm_presence FOR SELECT
  USING (true);

-- ─── HELPER FUNCTION: Get or create conversation ────────────────────────────

CREATE OR REPLACE FUNCTION public.get_or_create_dm_conversation(
  _client_id UUID,
  _ca_id     UUID
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _conv_id UUID;
BEGIN
  -- Try to find existing
  SELECT id INTO _conv_id
  FROM public.dm_conversations
  WHERE client_id = _client_id AND ca_id = _ca_id;

  IF _conv_id IS NULL THEN
    INSERT INTO public.dm_conversations (client_id, ca_id)
    VALUES (_client_id, _ca_id)
    RETURNING id INTO _conv_id;
  END IF;

  RETURN _conv_id;
END;
$$;
