CREATE TYPE view_entity AS ENUM ('content', 'ideas', 'campaigns');
CREATE TYPE view_type AS ENUM ('grid', 'kanban', 'calendar');

CREATE TABLE saved_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  entity view_entity NOT NULL DEFAULT 'content',
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  view_type view_type NOT NULL DEFAULT 'grid',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_saved_views_workspace_id ON saved_views(workspace_id);

ALTER TABLE saved_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view saved views"
  ON saved_views FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = saved_views.workspace_id AND wm.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own saved views"
  ON saved_views FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = saved_views.workspace_id AND wm.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own saved views"
  ON saved_views FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = saved_views.workspace_id AND wm.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own saved views"
  ON saved_views FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = saved_views.workspace_id AND wm.user_id = auth.uid()
  ));
