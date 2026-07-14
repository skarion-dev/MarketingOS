CREATE TABLE marketing_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_marketing_roles_user_id ON marketing_roles(user_id);

ALTER TABLE marketing_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own role"
  ON marketing_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON marketing_roles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM marketing_roles mr WHERE mr.user_id = auth.uid() AND mr.role = 'admin'
  ));
