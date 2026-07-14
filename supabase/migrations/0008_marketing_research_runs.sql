CREATE TABLE marketing_research_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  prompt TEXT NOT NULL,
  provider TEXT NOT NULL,
  grounded BOOLEAN NOT NULL DEFAULT false,
  result JSONB,
  cost_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_marketing_research_runs_user_id ON marketing_research_runs(user_id);
CREATE INDEX idx_marketing_research_runs_created_at ON marketing_research_runs(created_at);

ALTER TABLE marketing_research_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own research runs"
  ON marketing_research_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own research runs"
  ON marketing_research_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own research runs"
  ON marketing_research_runs FOR DELETE
  USING (auth.uid() = user_id);
