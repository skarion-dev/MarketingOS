CREATE TABLE audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  actor UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  before JSONB,
  after JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_workspace_id ON audit_log(workspace_id);
CREATE INDEX idx_audit_log_entity ON audit_log(workspace_id, entity, entity_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(workspace_id, created_at DESC);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view audit log for their workspaces"
  ON audit_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = audit_log.workspace_id AND wm.user_id = auth.uid()
  ));

CREATE POLICY "Members can insert audit entries for their workspaces"
  ON audit_log FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = audit_log.workspace_id AND wm.user_id = auth.uid()
  ));
