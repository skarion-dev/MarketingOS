CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'paused', 'completed');

CREATE TABLE campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  theme TEXT,
  goal TEXT,
  start_date DATE,
  end_date DATE,
  status campaign_status NOT NULL DEFAULT 'draft',
  ai_budget_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaigns_workspace_id ON campaigns(workspace_id);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view campaigns"
  ON campaigns FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = campaigns.workspace_id AND wm.user_id = auth.uid()
  ));

CREATE POLICY "Editors and above can manage campaigns"
  ON campaigns FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = campaigns.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin', 'editor')
  ));

CREATE POLICY "Editors and above can update campaigns"
  ON campaigns FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = campaigns.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin', 'editor')
  ));

CREATE POLICY "Editors and above can delete campaigns"
  ON campaigns FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = campaigns.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin', 'editor')
  ));
