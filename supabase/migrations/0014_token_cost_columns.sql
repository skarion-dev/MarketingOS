ALTER TABLE marketing_research_runs ADD COLUMN IF NOT EXISTS prompt_tokens INTEGER DEFAULT 0;
ALTER TABLE marketing_research_runs ADD COLUMN IF NOT EXISTS completion_tokens INTEGER DEFAULT 0;

ALTER TABLE marketing_content ADD COLUMN IF NOT EXISTS prompt_tokens INTEGER DEFAULT 0;
ALTER TABLE marketing_content ADD COLUMN IF NOT EXISTS completion_tokens INTEGER DEFAULT 0;
