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


# ---------------------------------------------------------------------------
# Testes unitários — repositories/users.py
# ---------------------------------------------------------------------------

class TestIncrementFailedAttempts:
    def test_incrementa_contador(self):
        """increment_failed_attempts deve incrementar o campo no banco."""
        from repositories.users import increment_failed_attempts

        user = _make_user(failed_attempts=2)
        with patch("repositories.users.get_client") as mock_client:
            mock_table = MagicMock()
            mock_client.return_value.table.return_value = mock_table
            mock_table.select.return_value.eq.return_value.execute.return_value.data = [user]

            increment_failed_attempts("teste@interhealth.com")

            update_call = mock_table.update.call_args[0][0]
            assert update_call["failed_login_attempts"] == 3
            assert "locked_until" not in update_call

    def test_bloqueia_na_quinta_tentativa(self):
        """Na 5ª tentativa, deve setar locked_until."""
        from repositories.users import increment_failed_attempts

        user = _make_user(failed_attempts=4)
        with patch("repositories.users.get_client") as mock_client:
            mock_table = MagicMock()
            mock_client.return_value.table.return_value = mock_table
            mock_table.select.return_value.eq.return_value.execute.return_value.data = [user]

            increment_failed_attempts("teste@interhealth.com")

            update_call = mock_table.update.call_args[0][0]
            assert update_call["failed_login_attempts"] == 5
            assert "locked_until" in update_call

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
