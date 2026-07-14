CREATE TABLE marketing_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  prospect_id UUID REFERENCES marketing_prospects(id) ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK (kind IN ('linkedin_post', 'cold_email', 'comment_reply', 'dm', 'other')),
  subject TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'sent')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_marketing_content_user_id ON marketing_content(user_id);
CREATE INDEX idx_marketing_content_campaign_id ON marketing_content(campaign_id);
CREATE INDEX idx_marketing_content_prospect_id ON marketing_content(prospect_id);
CREATE INDEX idx_marketing_content_status ON marketing_content(status);

ALTER TABLE marketing_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own content"
  ON marketing_content FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own content"
  ON marketing_content FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own content"
  ON marketing_content FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own content"
  ON marketing_content FOR DELETE
  USING (auth.uid() = user_id);
