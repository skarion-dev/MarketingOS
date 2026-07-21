CREATE TABLE ai_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'anthropic', 'nvidia')),
  key TEXT NOT NULL,
  model TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_keys_user_id ON ai_keys(user_id);
CREATE INDEX idx_ai_keys_provider_active ON ai_keys(provider, is_active);

ALTER TABLE ai_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI keys"
  ON ai_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI keys"
  ON ai_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI keys"
  ON ai_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own AI keys"
  ON ai_keys FOR DELETE
  USING (auth.uid() = user_id);
