CREATE TABLE marketing_prospects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  company TEXT,
  title TEXT,
  linkedin_url TEXT,
  type TEXT NOT NULL DEFAULT 'individual' CHECK (type IN ('individual', 'company')),
  source TEXT,
  stage TEXT NOT NULL DEFAULT 'new' CHECK (stage IN ('new', 'contacted', 'qualified', 'nurturing', 'unqualified')),
  dedupe_key TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_marketing_prospects_dedupe_key ON marketing_prospects(dedupe_key);
CREATE INDEX idx_marketing_prospects_user_id ON marketing_prospects(user_id);
CREATE INDEX idx_marketing_prospects_stage ON marketing_prospects(stage);

ALTER TABLE marketing_prospects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own prospects"
  ON marketing_prospects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prospects"
  ON marketing_prospects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prospects"
  ON marketing_prospects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own prospects"
  ON marketing_prospects FOR DELETE
  USING (auth.uid() = user_id);
