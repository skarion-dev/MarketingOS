CREATE TABLE marketing_opportunities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prospect_id UUID NOT NULL REFERENCES marketing_prospects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'identified' CHECK (stage IN ('identified', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
  value_cents BIGINT NOT NULL DEFAULT 0,
  probability INTEGER NOT NULL DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_marketing_opportunities_user_id ON marketing_opportunities(user_id);
CREATE INDEX idx_marketing_opportunities_prospect_id ON marketing_opportunities(prospect_id);
CREATE INDEX idx_marketing_opportunities_stage ON marketing_opportunities(stage);

ALTER TABLE marketing_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own opportunities"
  ON marketing_opportunities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own opportunities"
  ON marketing_opportunities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own opportunities"
  ON marketing_opportunities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own opportunities"
  ON marketing_opportunities FOR DELETE
  USING (auth.uid() = user_id);
