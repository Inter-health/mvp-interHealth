-- Incremento atômico de tentativas de login falhadas (fix C2 — race condition)
-- Substitui o read-then-write do Python por um UPDATE atômico no banco,
-- garantindo que o bloqueio dispare corretamente mesmo sob requisições concorrentes.

CREATE OR REPLACE FUNCTION increment_failed_login_attempts(
    p_email        TEXT,
    p_max_attempts INT  DEFAULT 5,
    p_lockout_minutes INT DEFAULT 15
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_attempts INT;
BEGIN
    UPDATE users
    SET failed_login_attempts = failed_login_attempts + 1
    WHERE email = p_email
    RETURNING failed_login_attempts INTO v_new_attempts;

    -- Se não encontrou o e-mail, retorna silenciosamente (comportamento atual mantido)
    IF NOT FOUND THEN
        RETURN;
    END IF;

    -- Bloqueia a conta ao atingir o limite
    IF v_new_attempts >= p_max_attempts THEN
        UPDATE users
        SET locked_until = NOW() + (p_lockout_minutes || ' minutes')::INTERVAL
        WHERE email = p_email
          AND (locked_until IS NULL OR locked_until < NOW());
    END IF;
END;
$$;
