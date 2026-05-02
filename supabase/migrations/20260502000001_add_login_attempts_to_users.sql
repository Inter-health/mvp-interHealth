-- Bloqueio de conta após 5 tentativas de login falhadas (RN3)
-- Conta fica bloqueada por 15 minutos; locked_until NULL = não bloqueada

ALTER TABLE users
  ADD COLUMN failed_login_attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN locked_until TIMESTAMPTZ;
