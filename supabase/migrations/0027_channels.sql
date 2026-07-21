CREATE TYPE channel_kind AS ENUM ('linkedin_personal', 'linkedin_page', 'facebook', 'reddit', 'x', 'email', 'blog');

CREATE TABLE channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  kind channel_kind NOT NULL,
  name TEXT NOT NULL,
  rules JSONB DEFAULT '{}',
  cadence JSONB DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_channels_workspace_id ON channels(workspace_id);

ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view channels"
  ON channels FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = channels.workspace_id AND wm.user_id = auth.uid()
  ));

CREATE POLICY "Owners and admins can manage channels"
  ON channels FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = channels.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
  ));

CREATE POLICY "Owners and admins can update channels"
  ON channels FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = channels.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
  ));

CREATE POLICY "Owners and admins can delete channels"
  ON channels FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = channels.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
  ));
