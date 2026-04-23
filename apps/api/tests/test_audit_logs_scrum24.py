"""
Testes de aceite — SCRUM-24: Audit logs para criação de usuário
Critérios:
  - Toda criação de usuário gera registro em audit_logs
  - Falha no log NÃO bloqueia o cadastro
  - Registro contém user_id, action, ip_address
"""
import uuid
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from main import app
from schemas.audit_logs import AuditAction

client = TestClient(app)

VALID_USER = {
    "name": "Dr. Audit",
    "crm": "99999-SP",
    "specialty": "Clínica Geral",
    "ehrProvider": "iclinic",
    "terms_accepted": True,
    "password": "Senha@123",
}


def _payload():
    return {**VALID_USER, "email": f"audit_{uuid.uuid4().hex[:8]}@interhealth.com"}


class TestAuditLogCreation:
    """SCRUM-24 — Audit log gerado em criações bem-sucedidas"""

    def test_audit_log_called_on_successful_registration(self):
        """Criar usuário válido chama create_audit_log exatamente uma vez."""
        with patch("repositories.audit_logs.create_audit_log") as mock_log:
            res = client.post("/users", json=_payload())
            assert res.status_code == 201
            mock_log.assert_called_once()

    def test_audit_log_receives_correct_action(self):
        """Audit log registra action=AuditAction.USER_CREATED."""
        with patch("repositories.audit_logs.create_audit_log") as mock_log:
            client.post("/users", json=_payload())
            action = mock_log.call_args[0][1]
            assert action == AuditAction.USER_CREATED

    def test_audit_log_receives_user_id(self):
        """Audit log recebe o user_id do usuário criado."""
        with patch("repositories.audit_logs.create_audit_log") as mock_log:
            res = client.post("/users", json=_payload())
            user_id_in_log = mock_log.call_args[0][0]
            user_id_in_response = res.json()["user"]["id"]
            assert user_id_in_log == user_id_in_response

    def test_audit_log_receives_ip_address(self):
        """Audit log recebe ip_address como string ou None (nunca string inválida)."""
        with patch("repositories.audit_logs.create_audit_log") as mock_log:
            client.post("/users", json=_payload())
            ip = mock_log.call_args[0][2]
            assert ip is None or isinstance(ip, str)

    def test_audit_log_not_called_on_weak_password(self):
        """Audit log NÃO é chamado quando cadastro falha por senha fraca."""
        with patch("repositories.audit_logs.create_audit_log") as mock_log:
            payload = {**_payload(), "password": "fraca"}
            res = client.post("/users", json=payload)
            assert res.status_code == 422
            mock_log.assert_not_called()

    def test_audit_log_not_called_on_duplicate_email(self):
        """Audit log NÃO é chamado quando cadastro falha por e-mail duplicado."""
        email = f"dup_audit_{uuid.uuid4().hex[:8]}@interhealth.com"
        payload = {**VALID_USER, "email": email}
        client.post("/users", json=payload)  # primeiro cadastro (real)

        with patch("repositories.audit_logs.create_audit_log") as mock_log:
            res = client.post("/users", json=payload)  # duplicado
            assert res.status_code == 409
            mock_log.assert_not_called()


class TestAuditLogIsolation:
    """SCRUM-24 — Falha no log não bloqueia o cadastro"""

    def test_registration_succeeds_even_if_audit_log_raises(self):
        """Se create_audit_log lançar exceção, cadastro ainda retorna 201."""
        with patch(
            "repositories.audit_logs.create_audit_log",
            side_effect=Exception("Supabase indisponível"),
        ):
            res = client.post("/users", json=_payload())
            assert res.status_code == 201

    def test_response_intact_when_audit_log_fails(self):
        """Response continua com user e access_token mesmo com falha no log."""
        with patch(
            "repositories.audit_logs.create_audit_log",
            side_effect=Exception("timeout"),
        ):
            res = client.post("/users", json=_payload())
            body = res.json()
            assert "user" in body
            assert "access_token" in body


class TestAuditLogSecurity:
    """SCRUM-24 — Garantias de segurança"""

    def test_500_handler_does_not_leak_internal_details(self):
        """Erro 500 retorna mensagem genérica, sem detalhes internos."""
        with patch("routers.users.create_user", side_effect=RuntimeError("detalhe interno secreto")):
            res = client.post("/users", json=_payload())
            assert res.status_code == 500
            assert "detalhe interno secreto" not in res.text
            assert "Erro interno" in res.json()["detail"]
