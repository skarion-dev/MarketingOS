CREATE TABLE touchpoints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  content_id UUID REFERENCES content(id) ON DELETE SET NULL,
  lead_id UUID,
  channel TEXT,
  kind TEXT NOT NULL,
  source_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_touchpoints_workspace ON touchpoints(workspace_id);
CREATE INDEX idx_touchpoints_content ON touchpoints(content_id);

ALTER TABLE touchpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view touchpoints"
  ON touchpoints FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = touchpoints.workspace_id AND wm.user_id = auth.uid()
  ));
