CREATE TABLE ai_usage_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'text',
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  cost_cents NUMERIC(10, 4) NOT NULL DEFAULT 0,
  entity TEXT,
  entity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_usage_log_workspace_id ON ai_usage_log(workspace_id);
CREATE INDEX idx_ai_usage_log_created_at ON ai_usage_log(workspace_id, created_at DESC);
CREATE INDEX idx_ai_usage_log_model ON ai_usage_log(workspace_id, model, created_at DESC);

ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view usage log for their workspaces"
  ON ai_usage_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = ai_usage_log.workspace_id AND wm.user_id = auth.uid()
  ));

CREATE POLICY "System can insert usage log"
  ON ai_usage_log FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = ai_usage_log.workspace_id AND wm.user_id = auth.uid()
  ));
