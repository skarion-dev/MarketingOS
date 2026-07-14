CREATE TABLE marketing_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prospect_id UUID REFERENCES marketing_prospects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  due_date TIMESTAMPTZ,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_marketing_tasks_user_id ON marketing_tasks(user_id);
CREATE INDEX idx_marketing_tasks_prospect_id ON marketing_tasks(prospect_id);
CREATE INDEX idx_marketing_tasks_assignee_id ON marketing_tasks(assignee_id);
CREATE INDEX idx_marketing_tasks_status ON marketing_tasks(status);

ALTER TABLE marketing_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks"
  ON marketing_tasks FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = assignee_id);

CREATE POLICY "Users can insert own tasks"
  ON marketing_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON marketing_tasks FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = assignee_id);

CREATE POLICY "Users can delete own tasks"
  ON marketing_tasks FOR DELETE
  USING (auth.uid() = user_id);
