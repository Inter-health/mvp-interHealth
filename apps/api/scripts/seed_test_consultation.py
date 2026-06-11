"""Seed de consulta de teste com transcript — valida o fluxo SOAP/Exames sem
depender do pipeline real de áudio.

Insere uma consulta com status TRANSCRIBED e transcript criptografado (Fernet),
vinculada a um médico existente. Use o consultation_id impresso para testar
POST /consultations/{id}/soap/generate etc.

Uso (a partir de apps/api, com o venv ativo):
    .venv/Scripts/python.exe scripts/seed_test_consultation.py [user_id]

Se user_id não for informado, usa o primeiro médico cadastrado.
"""
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Permite rodar como script solto (adiciona apps/api ao path).
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from core.database import get_client  # noqa: E402
from core.security import encrypt_text  # noqa: E402

SAMPLE_TRANSCRIPT = (
    "[MÉDICO]: Bom dia, em que posso ajudar?\n"
    "[PACIENTE]: Estou com dor de cabeça há 3 dias e enjoo.\n"
    "[MÉDICO]: A dor piora com luz ou barulho?\n"
    "[PACIENTE]: Sim, muito. Especialmente luz.\n"
    "[MÉDICO]: Você tem histórico de enxaqueca na família?\n"
    "[PACIENTE]: Minha mãe tem. Tomo dipirona mas alivia pouco.\n"
    "[MÉDICO]: Pressão 120/80, exame neurológico sem alterações. "
    "Quadro compatível com enxaqueca com aura. Vou prescrever sumatriptano.\n"
    "[PACIENTE]: Preciso fazer exames?\n"
    "[MÉDICO]: Não por ora. Retorne em 30 dias se não melhorar."
)


def main() -> None:
    client = get_client()

    user_id = sys.argv[1] if len(sys.argv) > 1 else None
    if not user_id:
        users = client.table("users").select("id").limit(1).execute()
        if not users.data:
            raise SystemExit("Nenhum médico cadastrado — informe um user_id válido.")
        user_id = users.data[0]["id"]

    encrypted, iv = encrypt_text(SAMPLE_TRANSCRIPT)
    expires_at = datetime.now(timezone.utc) + timedelta(days=30)

    payload = {
        "user_id": user_id,
        "patient_name": "Paciente de Teste (seed)",
        "patient_consent": True,
        "status": "TRANSCRIBED",
        "transcript_encrypted": encrypted,
        "transcript_iv": iv,
        "transcript_expires_at": expires_at.isoformat(),
    }
    row = client.table("consultations").insert(payload).execute().data[0]

    print("Consulta de teste criada:")
    print(f"  consultation_id = {row['id']}")
    print(f"  user_id         = {user_id}")
    print(f"  status          = {row['status']}")


if __name__ == "__main__":
    main()
