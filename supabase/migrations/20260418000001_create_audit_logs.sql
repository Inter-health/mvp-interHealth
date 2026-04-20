CREATE TABLE audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Apenas a service role (backend) pode acessar audit_logs.
-- Roles anon e authenticated são explicitamente bloqueadas.
CREATE POLICY "service_role_only"
ON audit_logs
FOR ALL
USING (false)
WITH CHECK (false);
