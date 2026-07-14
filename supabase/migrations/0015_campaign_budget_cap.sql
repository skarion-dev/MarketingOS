ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS monthly_ai_budget_cents INTEGER DEFAULT 0;
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS ai_spend_this_month_cents INTEGER DEFAULT 0;
