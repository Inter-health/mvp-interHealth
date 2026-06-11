-- Migration: adiciona campos SOAP à tabela consultations
-- MVP2 — Prontuário Inteligente (motor de geração SOAP)
--
-- O conteúdo SOAP é gerado por LLM a partir do transcript e armazenado
-- criptografado em repouso (Fernet/AES-256), mesmo padrão do transcript (LGPD).
-- soap_iv é placeholder de compatibilidade Fernet (o IV é embutido no token).

ALTER TABLE consultations
  ADD COLUMN IF NOT EXISTS soap_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS soap_iv        TEXT,
  ADD COLUMN IF NOT EXISTS soap_status    TEXT DEFAULT 'pending';

-- Constraint do fluxo human-in-the-loop:
-- pending → generated (LLM gerou) → confirmed (médico revisou) | rejected
ALTER TABLE consultations DROP CONSTRAINT IF EXISTS consultations_soap_status_check;

ALTER TABLE consultations ADD CONSTRAINT consultations_soap_status_check
  CHECK (soap_status IN ('pending', 'generated', 'confirmed', 'rejected'));
