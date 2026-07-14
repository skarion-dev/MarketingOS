CREATE TABLE marketing_saved_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  entity TEXT NOT NULL CHECK (entity IN ('prospects', 'campaigns', 'content', 'tasks', 'opportunities')),
  filters JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_marketing_saved_views_user_id ON marketing_saved_views(user_id);

ALTER TABLE marketing_saved_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved views"
  ON marketing_saved_views FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved views"
  ON marketing_saved_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved views"
  ON marketing_saved_views FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved views"
  ON marketing_saved_views FOR DELETE
  USING (auth.uid() = user_id);
