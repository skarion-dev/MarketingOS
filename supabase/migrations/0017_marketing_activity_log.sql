CREATE TABLE marketing_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  changes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_marketing_activity_log_user_id ON marketing_activity_log(user_id);
CREATE INDEX idx_marketing_activity_log_entity ON marketing_activity_log(entity_type, entity_id);

ALTER TABLE marketing_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity"
  ON marketing_activity_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity"
  ON marketing_activity_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);
