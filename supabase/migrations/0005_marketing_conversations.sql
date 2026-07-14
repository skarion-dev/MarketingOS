CREATE TABLE marketing_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prospect_id UUID NOT NULL REFERENCES marketing_prospects(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES marketing_channels(id) ON DELETE CASCADE,
  subject TEXT,
  last_message_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_marketing_conversations_user_id ON marketing_conversations(user_id);
CREATE INDEX idx_marketing_conversations_prospect_id ON marketing_conversations(prospect_id);
CREATE INDEX idx_marketing_conversations_channel_id ON marketing_conversations(channel_id);

ALTER TABLE marketing_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON marketing_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON marketing_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON marketing_conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON marketing_conversations FOR DELETE
  USING (auth.uid() = user_id);
