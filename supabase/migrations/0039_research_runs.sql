CREATE TABLE research_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  subject TEXT NOT NULL,
  prompt TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT,
  grounded BOOLEAN NOT NULL DEFAULT false,
  result JSONB,
  cost_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_research_runs_workspace_id ON research_runs(workspace_id);
CREATE INDEX idx_research_runs_created_at ON research_runs(created_at);

ALTER TABLE research_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view research runs"
  ON research_runs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = research_runs.workspace_id AND wm.user_id = auth.uid()
  ));

CREATE POLICY "Members can insert research runs"
  ON research_runs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = research_runs.workspace_id AND wm.user_id = auth.uid()
  ));

CREATE POLICY "Members can delete research runs"
  ON research_runs FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = research_runs.workspace_id AND wm.user_id = auth.uid()
  ));
