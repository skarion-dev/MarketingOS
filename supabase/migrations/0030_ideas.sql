CREATE TYPE idea_status AS ENUM ('new', 'accepted', 'used', 'archived');

CREATE TABLE ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  angle TEXT,
  source TEXT,
  persona TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  status idea_status NOT NULL DEFAULT 'new',
  converted_content_id UUID REFERENCES content(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ideas_workspace_id ON ideas(workspace_id);
CREATE INDEX idx_ideas_priority ON ideas(workspace_id, priority DESC);

ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view ideas"
  ON ideas FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = ideas.workspace_id AND wm.user_id = auth.uid()
  ));

CREATE POLICY "Editors and above can manage ideas"
  ON ideas FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = ideas.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin', 'editor')
  ));

CREATE POLICY "Editors and above can update ideas"
  ON ideas FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = ideas.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin', 'editor')
  ));

CREATE POLICY "Editors and above can delete ideas"
  ON ideas FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = ideas.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin', 'editor')
  ));
