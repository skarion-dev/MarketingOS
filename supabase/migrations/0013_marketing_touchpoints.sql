CREATE TABLE marketing_touchpoints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE SET NULL,
  channel_id UUID REFERENCES marketing_channels(id) ON DELETE SET NULL,
  prospect_id UUID REFERENCES marketing_prospects(id) ON DELETE SET NULL,
  content_id UUID REFERENCES marketing_content(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES marketing_conversations(id) ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK (kind IN ('content_sent', 'conversation_logged', 'opportunity_created')),
  metadata JSONB DEFAULT '{}',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_marketing_touchpoints_user_id ON marketing_touchpoints(user_id);
CREATE INDEX idx_marketing_touchpoints_campaign_id ON marketing_touchpoints(campaign_id);
CREATE INDEX idx_marketing_touchpoints_occurred_at ON marketing_touchpoints(occurred_at);

ALTER TABLE marketing_touchpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own touchpoints"
  ON marketing_touchpoints FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own touchpoints"
  ON marketing_touchpoints FOR INSERT
  WITH CHECK (auth.uid() = user_id);
