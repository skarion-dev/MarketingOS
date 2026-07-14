CREATE TABLE marketing_channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'linkedin', 'phone', 'sms', 'other')),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_marketing_channels_user_id ON marketing_channels(user_id);

ALTER TABLE marketing_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own channels"
  ON marketing_channels FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own channels"
  ON marketing_channels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own channels"
  ON marketing_channels FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own channels"
  ON marketing_channels FOR DELETE
  USING (auth.uid() = user_id);
