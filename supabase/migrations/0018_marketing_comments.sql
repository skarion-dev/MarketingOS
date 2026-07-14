CREATE TABLE marketing_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_marketing_comments_entity ON marketing_comments(entity_type, entity_id);

ALTER TABLE marketing_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on their entities"
  ON marketing_comments FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own comments"
  ON marketing_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON marketing_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON marketing_comments FOR DELETE
  USING (auth.uid() = user_id);
