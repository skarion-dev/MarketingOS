CREATE TYPE asset_kind AS ENUM ('image', 'carousel', 'doc');

CREATE TABLE assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  kind asset_kind NOT NULL DEFAULT 'image',
  storage_path TEXT,
  prompt TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assets_workspace_id ON assets(workspace_id);
CREATE INDEX idx_assets_content_id ON assets(content_id);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view assets"
  ON assets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = assets.workspace_id AND wm.user_id = auth.uid()
  ));
