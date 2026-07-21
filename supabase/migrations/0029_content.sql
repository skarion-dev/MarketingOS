CREATE TYPE content_kind AS ENUM ('post', 'dm', 'email', 'comment', 'article');
CREATE TYPE content_status AS ENUM ('idea', 'draft', 'in_review', 'approved', 'scheduled', 'published', 'rejected');

CREATE TABLE content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE RESTRICT,
  kind content_kind NOT NULL DEFAULT 'post',
  status content_status NOT NULL DEFAULT 'idea',
  title TEXT,
  hook TEXT,
  body TEXT,
  cta TEXT,
  persona TEXT,
  planned_at TIMESTAMPTZ,
  published_url TEXT,
  external_id TEXT,
  lint_result JSONB DEFAULT '[]',
  metrics JSONB DEFAULT '{}',
  owner_id UUID REFERENCES auth.users(id),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_content_workspace_status ON content(workspace_id, status);
CREATE INDEX idx_content_workspace_planned ON content(workspace_id, planned_at);
CREATE INDEX idx_content_channel_id ON content(channel_id);
CREATE INDEX idx_content_campaign_id ON content(campaign_id);

ALTER TABLE content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view content"
  ON content FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = content.workspace_id AND wm.user_id = auth.uid()
  ));

CREATE POLICY "Editors and above can insert content"
  ON content FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = content.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin', 'editor')
  ));

CREATE POLICY "Editors and above can update content"
  ON content FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = content.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin', 'editor')
  ));

CREATE POLICY "Editors and above can delete content"
  ON content FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = content.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin', 'editor')
  ));
