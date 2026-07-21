CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT,
  linkedin_url TEXT,
  email TEXT,
  degree TEXT,
  school TEXT,
  authorization TEXT,
  source_content_id UUID REFERENCES content(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'nurturing', 'agreement_signed', 'unqualified')),
  temperature TEXT NOT NULL DEFAULT 'cold' CHECK (temperature IN ('cold', 'warm', 'hot')),
  owner_id UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_leads_workspace ON leads(workspace_id);
CREATE INDEX idx_leads_temperature ON leads(workspace_id, temperature);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view leads"
  ON leads FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = leads.workspace_id AND wm.user_id = auth.uid()
  ));

CREATE POLICY "Editors and above can manage leads"
  ON leads FOR ALL
  USING (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = leads.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin', 'editor')
  ));
