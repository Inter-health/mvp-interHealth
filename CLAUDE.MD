# InterHealth — Contexto do Projeto

Plataforma de saúde para médicos: autenticação segura, transcrição de consultas e prontuário eletrônico.
Compliance: **LGPD** (Lei 13.709/2018) — dados de pacientes brasileiros.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | Python 3.12 + FastAPI + Supabase SDK v2 + Pydantic v2 |
| Frontend | Next.js 16 + React 19 + TypeScript |
| Banco | Supabase (PostgreSQL) — São Paulo (residência de dados BR) |
| Auth | JWT HS256 (12h) + bcrypt |
| Criptografia | Fernet (AES-256) para transcrições em repouso |
| Rate limiting | slowapi (IP-based) |
| Deploy | Backend: Railway · Frontend: Netlify |

---

## Arquitetura obrigatória

```
Router → Service → Repository
```

- **Router** (`routers/`): recebe HTTP, delega ao service, retorna resposta. Sem lógica de negócio.
- **Service** (`services/`): toda regra de negócio. Sem acesso direto ao banco.
- **Repository** (`repositories/`): único ponto de acesso ao Supabase.

Toda nova feature segue essa separação. Sem exceções.

---

## Variáveis de Ambiente (`apps/api/.env`)

```env
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
JWT_SECRET=                        # mínimo 32 chars
TRANSCRIPT_ENCRYPTION_KEY=        # Fernet base64
CORS_ORIGINS=http://localhost:3000
ASSEMBLYAI_API_KEY=
GEMINI_API_KEY=                   # Google Gemini 2.5 Flash (SOAP + sugestão de exames)
```

Frontend (`apps/web/.env`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Nunca commitar `.env` com valores reais.

---

## Endpoints implementados

| Método | Rota | Status |
|--------|------|--------|
| `POST` | `/users` | ✅ Cadastro de médico (rate: 10/min) |
| `POST` | `/auth/login` | ✅ Login (rate: 10/min) |
| `GET` | `/users/me` | ✅ Dados do médico autenticado |
| `PATCH` | `/users/me` | ✅ Atualizar CRM/especialidade/EHR |
| `POST` | `/consultations/upload` | ✅ Upload de áudio (rate: 5/min) |
| `GET` | `/consultations/{id}/status` | ✅ Status + transcrição decriptada |
| `GET` | `/consultations` | ✅ Lista por médico (filtro patient_name) |
| `GET` | `/patients` | ✅ Lista de pacientes do médico |
| `POST` | `/patients` | ✅ Cadastro de paciente |
| `GET` | `/patients/{id}` | ✅ Detalhe do paciente |
| `POST` | `/consultations/{id}/soap/generate` | ✅ Gera SOAP via IA (rate: 10/min) |
| `GET` | `/consultations/{id}/soap` | ✅ Busca SOAP gerado/confirmado |
| `POST` | `/consultations/{id}/soap/confirm` | ✅ Confirma/rejeita SOAP (human-in-the-loop) |
| `POST` | `/consultations/{id}/exam-suggestions` | ✅ Gera sugestões de exame (rate: 10/min) |
| `GET` | `/consultations/{id}/exam-suggestions` | ✅ Lista sugestões |
| `PATCH` | `/consultations/{id}/exam-suggestions/{sid}` | ✅ Aceitar/rejeitar/editar |
| `POST` | `/consultations/{id}/exam-suggestions/manual` | ✅ Adicionar exame manual |
| `GET` | `/health` | ✅ Health check |

---

## Banco de dados — tabelas principais

```sql
users (id, name, crm, email, specialty, ehr_provider, terms_accepted, password_hash)
consultations (id, user_id, patient_name, patient_id, status, transcript_encrypted,
               transcript_expires_at, patient_consent_flag, error_msg, audio_path, created_at,
               soap_encrypted, soap_iv, soap_status)
-- status: PENDING → PROCESSING → TRANSCRIBED | ERROR
-- soap_status: pending → generated → confirmed | rejected (SOAP criptografado Fernet, igual ao transcript)
patients (id, user_id, name, cpf, date_of_birth, gender, phone, email, notes, created_at)
audit_logs (id, user_id, action, ip_address, created_at)
exam_suggestions (id, consultation_id, user_id, exam_name, category, justification,
                  hypothesis_ref, priority, status, is_manual, created_at, updated_at)
-- category: laboratorial|imagem|funcional|outro · priority: alta|media|baixa
-- status: sugerido → aceito|rejeitado|editado
```

---

## Páginas frontend

| Rota | Status | Backend conectado? |
|------|--------|--------------------|
| `/` | ✅ Landing page pública | — |
| `/solucao` | ✅ Página B2B enterprise | — |
| `/login` | ✅ Conectado | `POST /auth/login` |
| `/cadastro` | ✅ Conectado | `POST /users` |
| `/dashboard` | ✅ Conectado | `GET /users/me`, `GET /consultations` |
| `/dashboard/pacientes` | ✅ Conectado | `GET /patients` |
| `/dashboard/pacientes/novo` | ✅ Conectado | `POST /patients` |
| `/dashboard/nova-consulta` | ✅ Conectado | `POST /consultations/upload` + polling |
| `/dashboard/consulta/[id]` | ✅ Conectado | status/transcrição + SOAP + sugestão de exames |

---

## Fluxo de onboarding

1. Cadastro simplificado: nome, e-mail, senha, confirmação, termos.
2. Após cadastro → dashboard. Se `user.crm` vazio → exibe `OnboardingCard`.
3. `OnboardingCard` salva CRM/especialidade/EHR via `PATCH /users/me`.
4. Sem botão "Agora não" — card só some quando perfil está completo.
5. "Nova consulta" e "Consulta Ativa" bloqueados até perfil completo.
6. Sidebar sincronizada via `localStorage["ih_user_crm"]` + evento `ih_crm_updated`.

---

## Padrões e armadilhas conhecidas

### Supabase SDK v2 — update
```python
# ERRADO: SyncFilterRequestBuilder não tem .select()
get_client().table("users").update(data).eq("id", user_id).select().execute()

# CORRETO: dois queries separados
get_client().table("users").update(data).eq("id", user_id).execute()
return get_by_id(user_id)
```

### CORS — PATCH deve estar explícito
```python
allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"]
```

### Auth no frontend
- `saveToken(token)` → persiste em `localStorage` **e** cookie (para middleware edge).
- `logout()` → limpa ambos, redireciona para `/` (landing).
- `apiFetch` verifica expiração do token antes de cada chamada → redireciona para `/login` em 401.

### Segurança — propriedade de pacientes
Ao criar consulta com `patient_id`, o service valida `patient["user_id"] == user_id`.
Violação retorna `ValueError` → router responde 403.

### Transcrição (AssemblyAI)
- `speech_models=["universal-2"]` deve ser explícito.
- `TRANSCRIPT_ENCRYPTION_KEY` deve ser uma chave Fernet válida (base64 de 32 bytes).
- Áudio deletado de `/tmp` após processamento (LGPD — minimização de dados).
- Transcrição criptografada expira em 30 dias.

### LLM — SOAP e sugestão de exames (`services/llm_client.py`)
- Provedor: **Google Gemini 2.5 Flash** via `google-genai`. Função `call_llm(prompt, system, ...)`.
- `json_mode=True` força `response_mime_type=application/json` → JSON válido determinístico.
- Falhas (rede/cota) viram `LLMError` (retry interno) → service converte em erro amigável; nunca 500 cru.
- **Human-in-the-loop:** nenhum SOAP é salvo como `confirmed` nem exame aplicado sem ação explícita do médico.
- SOAP é criptografado em repouso (Fernet), igual ao transcript. Sugestões só são geradas com `soap_status='confirmed'`.
- Disclaimer clínico (`ClinicalDisclaimer`) sempre visível ao exibir SOAP/sugestões.
- Seed de teste sem áudio: `apps/api/scripts/seed_test_consultation.py [user_id]`.

---

## Regras de desenvolvimento

1. Arquitetura obrigatória: `router → service → repository`.
2. Senha sempre bcrypt antes de persistir. Nunca em plain text.
3. `UserResponse` nunca inclui `password_hash`.
4. Dados sensíveis de saúde (transcrições) só no Supabase São Paulo.
5. Nunca hardcodar segredos — sempre variáveis de ambiente.
6. Novos endpoints precisam de testes de aceitação.
7. Falhas de serviços auxiliares (e-mail, log de auditoria) não devem bloquear o fluxo principal (try/except isolado).
