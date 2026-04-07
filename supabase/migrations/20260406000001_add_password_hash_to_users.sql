-- Migration: adiciona colunas necessárias para autenticação própria (SCRUM-11)
-- A tabela users já existe; apenas adicionamos as colunas que faltam.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_hash TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS ehr_provider  TEXT;

-- Remove o default temporário (o NOT NULL agora é garantido pela aplicação)
ALTER TABLE users ALTER COLUMN password_hash DROP DEFAULT;

-- Renomeia ehrProvider para ehr_provider caso exista com camelCase
-- (safe: IF EXISTS evita erro se já estiver correto)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'ehrprovider'
  ) THEN
    ALTER TABLE users RENAME COLUMN "ehrProvider" TO ehr_provider;
  END IF;
END $$;
