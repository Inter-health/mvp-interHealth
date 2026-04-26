-- Migration: tabela de pacientes + FK em consultas
-- Sprint 2 — cadastro de pacientes

CREATE TABLE IF NOT EXISTS patients (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  cpf           TEXT,                     -- TODO Sprint 3: criptografar (LGPD — dado sensível)
  date_of_birth DATE,
  gender        TEXT        CHECK (gender IN ('M', 'F', 'O')),
  phone         TEXT,
  email         TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'patients' AND policyname = 'doctors_own_patients'
  ) THEN
    CREATE POLICY "doctors_own_patients"
      ON patients FOR ALL
      USING (user_id::text = auth.uid()::text);
  END IF;
END $$;

-- Linkar consultas ao cadastro de pacientes
ALTER TABLE consultations
  ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES patients(id) ON DELETE SET NULL;
