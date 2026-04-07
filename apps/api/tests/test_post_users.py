"""
Testes de aceite — POST /users
Cobre: SCRUM-22 (endpoint), SCRUM-23 (duplicidade), SCRUM-11 (senha LGPD)
"""
import uuid
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

VALID_USER = {
    "name": "Dr. Teste",
    "crm": "12345-SP",
    "email": f"teste_{uuid.uuid4().hex[:8]}@interhealth.com",
    "password": "Senha@123",
    "specialty": "Clínica Geral",
    "ehrProvider": "iclinic",
    "terms_accepted": True,
}


# ─── SCRUM-22 ────────────────────────────────────────────────────────────────

class TestPostUsersEndpoint:
    """SCRUM-22 — Endpoint POST /users"""

    def test_returns_201_on_valid_data(self):
        """POST /users com dados válidos retorna 201 Created."""
        payload = {**VALID_USER, "email": f"u_{uuid.uuid4().hex[:8]}@interhealth.com"}
        res = client.post("/users", json=payload)
        assert res.status_code == 201

    def test_response_contains_user_and_token(self):
        """Response inclui objeto user e access_token JWT."""
        payload = {**VALID_USER, "email": f"u_{uuid.uuid4().hex[:8]}@interhealth.com"}
        res = client.post("/users", json=payload)
        body = res.json()
        assert "user" in body
        assert "access_token" in body
        assert body["token_type"] == "bearer"

    def test_response_user_fields(self):
        """Response user contém todos os campos esperados."""
        payload = {**VALID_USER, "email": f"u_{uuid.uuid4().hex[:8]}@interhealth.com"}
        res = client.post("/users", json=payload)
        user = res.json()["user"]
        for field in ("id", "name", "crm", "email", "specialty", "ehrProvider", "terms_accepted"):
            assert field in user, f"Campo ausente: {field}"

    def test_password_not_exposed_in_response(self):
        """Senha nunca é exposta no response (LGPD / RNF3)."""
        payload = {**VALID_USER, "email": f"u_{uuid.uuid4().hex[:8]}@interhealth.com"}
        res = client.post("/users", json=payload)
        body_str = res.text
        assert "Senha@123" not in body_str
        assert "password" not in res.json()["user"]

    def test_jwt_is_string(self):
        """access_token é uma string JWT não vazia."""
        payload = {**VALID_USER, "email": f"u_{uuid.uuid4().hex[:8]}@interhealth.com"}
        res = client.post("/users", json=payload)
        token = res.json()["access_token"]
        assert isinstance(token, str) and len(token) > 0
        # JWT tem 3 segmentos separados por ponto
        assert token.count(".") == 2


# ─── SCRUM-23 ────────────────────────────────────────────────────────────────

class TestDuplicateEmail:
    """SCRUM-23 — Duplicidade de e-mail"""

    def test_409_on_duplicate_email(self):
        """POST /users com e-mail já cadastrado retorna 409 Conflict."""
        email = f"dup_{uuid.uuid4().hex[:8]}@interhealth.com"
        payload = {**VALID_USER, "email": email}
        client.post("/users", json=payload)          # primeiro cadastro
        res = client.post("/users", json=payload)    # duplicado
        assert res.status_code == 409

    def test_409_detail_message(self):
        """Mensagem de erro de duplicidade é 'E-mail já cadastrado.'"""
        email = f"dup_{uuid.uuid4().hex[:8]}@interhealth.com"
        payload = {**VALID_USER, "email": email}
        client.post("/users", json=payload)
        res = client.post("/users", json=payload)
        assert res.json()["detail"] == "E-mail já cadastrado."


# ─── SCRUM-11 ────────────────────────────────────────────────────────────────

class TestPasswordValidation:
    """SCRUM-11 — Regras de senha LGPD (RN1 + RN2)"""

    def _post(self, password: str):
        payload = {**VALID_USER, "email": f"u_{uuid.uuid4().hex[:8]}@interhealth.com", "password": password}
        return client.post("/users", json=payload)

    def test_422_on_short_password(self):
        """Senha com menos de 8 caracteres retorna 422."""
        res = self._post("Ab1!")
        assert res.status_code == 422

    def test_422_on_missing_uppercase(self):
        """Senha sem letra maiúscula retorna 422."""
        res = self._post("senha@123")
        assert res.status_code == 422

    def test_422_on_missing_lowercase(self):
        """Senha sem letra minúscula retorna 422."""
        res = self._post("SENHA@123")
        assert res.status_code == 422

    def test_422_on_missing_digit(self):
        """Senha sem número retorna 422."""
        res = self._post("Senha@abc")
        assert res.status_code == 422

    def test_422_on_missing_special_char(self):
        """Senha sem caractere especial retorna 422."""
        res = self._post("Senha1234")
        assert res.status_code == 422

    def test_422_response_contains_violations_list(self):
        """Response 422 contém lista de critérios não atendidos."""
        res = self._post("abc")
        body = res.json()
        assert "violations" in body["detail"]
        assert isinstance(body["detail"]["violations"], list)
        assert len(body["detail"]["violations"]) > 0

    def test_422_violation_describes_failed_criterion(self):
        """Cada violation descreve o critério específico não atendido."""
        res = self._post("senha@123")   # só falta maiúscula
        violations = res.json()["detail"]["violations"]
        assert any("maiúscula" in v for v in violations)

    def test_valid_password_passes_all_rules(self):
        """Senha com todos os critérios não gera 422."""
        res = self._post("Senha@123")
        assert res.status_code != 422
