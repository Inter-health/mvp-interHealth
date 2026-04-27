-- Migration: create consultations table (e corrigir check constraint se a tabela já existia)
-- Sprint 2 — SCRUM-26 (upload de áudio) + SCRUM-27 (pipeline WhisperX)

CREATE TABLE IF NOT EXISTS consultations (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  patient_name          TEXT,
  patient_consent       BOOLEAN     NOT NULL DEFAULT false,
  status                TEXT        NOT NULL DEFAULT 'PENDING',
  audio_path            TEXT,                        -- caminho temporário do áudio (apagado após processamento — LGPD)
  transcript_encrypted  TEXT,                        -- transcript criptografado com Fernet (AES-256)
  transcript_iv         TEXT,                        -- IV placeholder (compatibilidade Fernet)
  transcript_expires_at TIMESTAMPTZ,                 -- TTL de 30 dias (LGPD — minimização de dados)
  error_msg             TEXT,                        -- motivo do erro se status = ERROR
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ
);

-- Corrigir check constraint legado (pode ter sido criado com valores incorretos)
ALTER TABLE consultations DROP CONSTRAINT IF EXISTS consultations_status_check;

ALTER TABLE consultations ADD CONSTRAINT consultations_status_check
  CHECK (status IN ('PENDING', 'PROCESSING', 'TRANSCRIBED', 'ERROR', 'RECORDING'));

-- RLS: service role bypassa automaticamente; política protege acesso direto via client role
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "users_own_consultations"
  ON consultations
  FOR ALL
  USING (user_id::text = auth.uid()::text);
