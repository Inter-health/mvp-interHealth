-- Migration 001: adiciona password_hash e ehr_provider à tabela users
-- Execute no SQL Editor do Supabase

-- 1. Adiciona coluna password_hash (obrigatória — bcrypt)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_hash TEXT NOT NULL DEFAULT '';

-- 2. Adiciona coluna ehr_provider (snake_case) se a coluna ehrProvider existir com camelCase,
--    migra os dados e remove a antiga.
DO $$
BEGIN
  -- Se a coluna antiga "ehrProvider" (camelCase) existir, migra
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'ehrProvider'
  ) THEN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS ehr_provider TEXT NOT NULL DEFAULT '';
    UPDATE users SET ehr_provider = "ehrProvider";
    ALTER TABLE users DROP COLUMN "ehrProvider";
  ELSE
    -- Coluna já está em snake_case ou não existe ainda
    ALTER TABLE users ADD COLUMN IF NOT EXISTS ehr_provider TEXT NOT NULL DEFAULT '';
  END IF;
END;
$$;

-- 3. Remove o DEFAULT temporário de password_hash
ALTER TABLE users ALTER COLUMN password_hash DROP DEFAULT;

-- 4. Garante unicidade no email
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_email_key'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
  END IF;
END;
$$;
