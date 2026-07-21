CREATE TABLE channel_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  external_account_id TEXT,
  account_label TEXT,
  secret_id UUID REFERENCES workspace_secrets(id) ON DELETE SET NULL,
  scopes TEXT[],
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('disconnected', 'connecting', 'connected', 'error')),
  last_health_check TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_channel_connections_workspace_id ON channel_connections(workspace_id);
CREATE INDEX idx_channel_connections_channel_id ON channel_connections(channel_id);

ALTER TABLE channel_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage connections"
  ON channel_connections FOR ALL
  USING (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = channel_connections.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
  ));

CREATE POLICY "Members can view connections"
  ON channel_connections FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = channel_connections.workspace_id AND wm.user_id = auth.uid()
  ));
