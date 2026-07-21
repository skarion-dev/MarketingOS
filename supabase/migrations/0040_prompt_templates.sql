CREATE TABLE prompt_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('research', 'content', 'image')),
  subtype TEXT,
  system_prompt TEXT,
  user_prompt TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_prompt_templates_workspace_id ON prompt_templates(workspace_id);

ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view prompt templates"
  ON prompt_templates FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = prompt_templates.workspace_id AND wm.user_id = auth.uid()
  ));

CREATE POLICY "Members can insert prompt templates"
  ON prompt_templates FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = prompt_templates.workspace_id AND wm.user_id = auth.uid()
  ));

CREATE POLICY "Members can update prompt templates"
  ON prompt_templates FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = prompt_templates.workspace_id AND wm.user_id = auth.uid()
  ));

CREATE POLICY "Members can delete prompt templates"
  ON prompt_templates FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = prompt_templates.workspace_id AND wm.user_id = auth.uid()
  ));
