ALTER TABLE marketing_prospects ADD COLUMN IF NOT EXISTS embedding vector(768);

CREATE INDEX IF NOT EXISTS idx_marketing_prospects_embedding
  ON marketing_prospects USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
