CREATE TABLE marketing_prompt_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

CREATE INDEX idx_marketing_prompt_templates_user_id ON marketing_prompt_templates(user_id);

ALTER TABLE marketing_prompt_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own templates"
  ON marketing_prompt_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates"
  ON marketing_prompt_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON marketing_prompt_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON marketing_prompt_templates FOR DELETE
  USING (auth.uid() = user_id);
