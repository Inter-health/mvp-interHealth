-- Migration: cria tabela exam_suggestions
-- Feature: Sugestão de Exames por Hipótese Diagnóstica
--
-- Sugestões assistivas geradas por IA a partir do SOAP confirmado. NUNCA são
-- aplicadas automaticamente: o médico aceita/rejeita/edita cada uma (status).
-- O sistema não prescreve nem solicita exames.

CREATE TABLE IF NOT EXISTS exam_suggestions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID        NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES users(id),
  exam_name       TEXT        NOT NULL,
  category        TEXT        NOT NULL,
  justification   TEXT        NOT NULL,
  hypothesis_ref  TEXT        NOT NULL,
  priority        TEXT        NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'sugerido',
  is_manual       BOOLEAN     NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE exam_suggestions DROP CONSTRAINT IF EXISTS exam_suggestions_category_check;
ALTER TABLE exam_suggestions ADD CONSTRAINT exam_suggestions_category_check
  CHECK (category IN ('laboratorial', 'imagem', 'funcional', 'outro'));

ALTER TABLE exam_suggestions DROP CONSTRAINT IF EXISTS exam_suggestions_priority_check;
ALTER TABLE exam_suggestions ADD CONSTRAINT exam_suggestions_priority_check
  CHECK (priority IN ('alta', 'media', 'baixa'));

ALTER TABLE exam_suggestions DROP CONSTRAINT IF EXISTS exam_suggestions_status_check;
ALTER TABLE exam_suggestions ADD CONSTRAINT exam_suggestions_status_check
  CHECK (status IN ('sugerido', 'aceito', 'rejeitado', 'editado'));

CREATE INDEX IF NOT EXISTS idx_exam_suggestions_consultation
  ON exam_suggestions (consultation_id);

-- RLS: service role bypassa automaticamente; política protege acesso direto via client role
ALTER TABLE exam_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "medico_owns_exam_suggestions" ON exam_suggestions;
CREATE POLICY "medico_owns_exam_suggestions"
  ON exam_suggestions
  FOR ALL
  USING (user_id::text = auth.uid()::text);
