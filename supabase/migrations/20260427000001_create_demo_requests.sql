CREATE TABLE demo_requests (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT        NOT NULL,
  role         TEXT        NOT NULL,
  doctor_count TEXT        NOT NULL,
  email        TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE demo_requests ENABLE ROW LEVEL SECURITY;
