"""
Testes de aceitação — Bloqueio de conta após 5 tentativas de login falhadas (RN3).
"""
from datetime import datetime, timedelta, timezone
from unittest.mock import patch, MagicMock

import pytest


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture()
def mock_repo():
    """Mocka o repositório de usuários para isolar do banco de dados."""
    with patch("services.auth.users_repo") as m:
        yield m


def _make_user(failed_attempts: int = 0, locked_until: datetime | None = None) -> dict:
    return {
        "id": "user-uuid-123",
        "name": "Dr. Teste",
        "crm": "12345-SP",
        "email": "teste@interhealth.com",
        "specialty": "Clínica Geral",
        "ehr_provider": "iclinic",
        "terms_accepted": True,
        "password_hash": "$2b$12$validhashplaceholder",
        "failed_login_attempts": failed_attempts,
        "locked_until": locked_until.isoformat() if locked_until else None,
    }


# ---------------------------------------------------------------------------
# Testes unitários — services/auth.py
# ---------------------------------------------------------------------------

class TestLoginLockoutService:
    def test_login_valido_reseta_contador(self, mock_repo):
        """Login bem-sucedido deve zerar failed_login_attempts."""
        from schemas.auth import LoginRequest
        from services.auth import login

        mock_repo.get_by_email_with_hash.return_value = _make_user(failed_attempts=3)
        with patch("services.auth.verify_password", return_value=True):
            with patch("services.auth.create_access_token", return_value="token-abc"):
                login(LoginRequest(email="teste@interhealth.com", password="Senha@123"))

        mock_repo.reset_failed_attempts.assert_called_once_with("user-uuid-123")

    def test_senha_errada_incrementa_contador(self, mock_repo):
        """Senha incorreta deve chamar increment_failed_attempts."""
        from schemas.auth import LoginRequest
        from services.auth import login, InvalidCredentialsError

        mock_repo.get_by_email_with_hash.return_value = _make_user(failed_attempts=1)
        with patch("services.auth.verify_password", return_value=False):
            with pytest.raises(InvalidCredentialsError):
                login(LoginRequest(email="teste@interhealth.com", password="Errada@123"))

        mock_repo.increment_failed_attempts.assert_called_once_with("teste@interhealth.com")

    def test_email_inexistente_incrementa_contador(self, mock_repo):
        """E-mail não cadastrado também deve chamar increment_failed_attempts."""
        from schemas.auth import LoginRequest
        from services.auth import login, InvalidCredentialsError

        mock_repo.get_by_email_with_hash.return_value = None
        with pytest.raises(InvalidCredentialsError):
            login(LoginRequest(email="naoexiste@interhealth.com", password="Senha@123"))

        mock_repo.increment_failed_attempts.assert_called_once_with("naoexiste@interhealth.com")

    def test_conta_bloqueada_lanca_account_locked_error(self, mock_repo):
        """Conta com locked_until no futuro deve lançar AccountLockedError."""
        from schemas.auth import LoginRequest
        from services.auth import login, AccountLockedError

        locked_until = datetime.now(timezone.utc) + timedelta(minutes=10)
        mock_repo.get_by_email_with_hash.return_value = _make_user(
            failed_attempts=5, locked_until=locked_until
        )

        with pytest.raises(AccountLockedError) as exc_info:
            login(LoginRequest(email="teste@interhealth.com", password="Senha@123"))

        assert exc_info.value.locked_until.tzinfo is not None

    def test_conta_bloqueada_nao_verifica_senha(self, mock_repo):
        """Conta bloqueada deve ser rejeitada antes de verificar a senha."""
        from schemas.auth import LoginRequest
        from services.auth import login, AccountLockedError

        locked_until = datetime.now(timezone.utc) + timedelta(minutes=5)
        mock_repo.get_by_email_with_hash.return_value = _make_user(
            failed_attempts=5, locked_until=locked_until
        )

        with patch("services.auth.verify_password") as mock_verify:
            with pytest.raises(AccountLockedError):
                login(LoginRequest(email="teste@interhealth.com", password="Senha@123"))

        mock_verify.assert_not_called()

    def test_bloqueio_expirado_permite_login(self, mock_repo):
        """locked_until no passado não deve bloquear o login."""
        from schemas.auth import LoginRequest
        from services.auth import login

        locked_until = datetime.now(timezone.utc) - timedelta(minutes=1)
        mock_repo.get_by_email_with_hash.return_value = _make_user(
            failed_attempts=5, locked_until=locked_until
        )

        with patch("services.auth.verify_password", return_value=True):
            with patch("services.auth.create_access_token", return_value="token-abc"):
                user, token = login(LoginRequest(email="teste@interhealth.com", password="Senha@123"))

        assert token == "token-abc"


# ---------------------------------------------------------------------------
# Testes de integração — POST /auth/login
# ---------------------------------------------------------------------------

class TestLoginLockoutEndpoint:
    def test_conta_bloqueada_retorna_423(self):
        """Conta bloqueada deve retornar HTTP 423."""
        from fastapi.testclient import TestClient
        from main import app

        client = TestClient(app)
        locked_until = datetime.now(timezone.utc) + timedelta(minutes=10)

        with patch("services.auth.users_repo") as mock_repo:
            mock_repo.get_by_email_with_hash.return_value = _make_user(
                failed_attempts=5, locked_until=locked_until
            )
            res = client.post("/auth/login", json={
                "email": "teste@interhealth.com",
                "password": "Senha@123",
            })

        assert res.status_code == 423
        assert "bloqueada" in res.json()["detail"].lower()

    def test_credenciais_invalidas_retorna_401(self):
        """Credenciais erradas sem bloqueio devem retornar 401."""
        from fastapi.testclient import TestClient
        from main import app

        client = TestClient(app)

        with patch("services.auth.users_repo") as mock_repo:
            mock_repo.get_by_email_with_hash.return_value = _make_user()
            with patch("services.auth.verify_password", return_value=False):
                res = client.post("/auth/login", json={
                    "email": "teste@interhealth.com",
                    "password": "Errada@123",
                })

        assert res.status_code == 401

    def test_login_usuario_sem_specialty_retorna_200(self):
        """Usuário sem specialty/ehr_provider (onboarding incompleto) não deve retornar 500."""
        from fastapi.testclient import TestClient
        from main import app

        client = TestClient(app)
        user_sem_perfil = {**_make_user(), "specialty": None, "ehr_provider": None}

        with patch("services.auth.users_repo") as mock_repo:
            mock_repo.get_by_email_with_hash.return_value = user_sem_perfil
            with patch("services.auth.verify_password", return_value=True):
                with patch("services.auth.create_access_token", return_value="tok"):
                    res = client.post("/auth/login", json={
                        "email": "teste@interhealth.com",
                        "password": "Senha@123",
                    })

        assert res.status_code == 200
        data = res.json()
        assert data["user"]["specialty"] is None
        assert data["user"]["ehrProvider"] is None


# ---------------------------------------------------------------------------
# Testes unitários — repositories/users.py
# ---------------------------------------------------------------------------

class TestIncrementFailedAttempts:
    def test_chama_rpc_com_email_correto(self):
        """increment_failed_attempts deve chamar a RPC com o e-mail fornecido."""
        from repositories.users import increment_failed_attempts, MAX_FAILED_ATTEMPTS, LOCKOUT_MINUTES

        with patch("repositories.users.get_client") as mock_client:
            mock_rpc = MagicMock()
            mock_client.return_value.rpc.return_value = mock_rpc
            mock_rpc.execute.return_value.data = None

            increment_failed_attempts("teste@interhealth.com")

            mock_client.return_value.rpc.assert_called_once_with(
                "increment_failed_login_attempts",
                {
                    "p_email": "teste@interhealth.com",
                    "p_max_attempts": MAX_FAILED_ATTEMPTS,
                    "p_lockout_minutes": LOCKOUT_MINUTES,
                },
            )

    def test_rpc_executa_sem_lancam_excecao(self):
        """increment_failed_attempts não deve lançar exceção em chamada normal."""
        from repositories.users import increment_failed_attempts

        with patch("repositories.users.get_client") as mock_client:
            mock_rpc = MagicMock()
            mock_client.return_value.rpc.return_value = mock_rpc
            mock_rpc.execute.return_value.data = None

            # Não deve lançar exceção
            increment_failed_attempts("qualquer@email.com")

    def test_reset_zera_contador_e_remove_bloqueio(self):
        """reset_failed_attempts deve zerar contador e limpar locked_until."""
        from repositories.users import reset_failed_attempts

        with patch("repositories.users.get_client") as mock_client:
            mock_table = MagicMock()
            mock_client.return_value.table.return_value = mock_table

            reset_failed_attempts("user-uuid-123")

            update_call = mock_table.update.call_args[0][0]
            assert update_call["failed_login_attempts"] == 0
            assert update_call["locked_until"] is None
