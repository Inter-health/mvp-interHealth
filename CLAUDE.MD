# Contexto do Projeto — InterHealth

Repositório: `Inter-health/mvp-interHealth`
Plataforma de saúde focada em autenticação segura de médicos e integração com prontuários eletrônicos (EHR).
Compliance: **LGPD** (Lei 13.709/2018) — dados de saúde de pacientes brasileiros.

---

## 1. Estrutura de Pastas e Arquivos 

```
projeto-interhealth/
├── apps/
│   ├── api/                          → Backend FastAPI (Python)
│   │   ├── main.py                   → Entrypoint FastAPI (CORS, routers, health check)
│   │   ├── requirements.txt          → Dependências Python
│   │   ├── .env                      → Variáveis de ambiente (NÃO commitar)
│   │   ├── .env.example              → Template das variáveis de ambiente
│   │   ├── core/
│   │   │   ├── database.py           → Cliente Supabase (thread-local connection pool)
│   │   │   ├── security.py           → Hashing bcrypt, JWT, validação de senha
│   │   │   └── limiter.py            → Rate limiting via slowapi (IP-based)
│   │   ├── routers/
│   │   │   ├── users.py              → POST /users (registro)
│   │   │   └── auth.py               → POST /auth/login (login)
│   │   ├── services/
│   │   │   ├── users.py              → Lógica de negócio: criação de usuário
│   │   │   └── auth.py               → Lógica de negócio: autenticação
│   │   ├── repositories/
│   │   │   └── users.py              → Acesso ao banco via Supabase
│   │   ├── schemas/
│   │   │   ├── users.py              → Pydantic models: UserCreate, UserResponse
│   │   │   └── auth.py               → Pydantic models: LoginRequest
│   │   ├── migrations/
│   │   │   └── 001_add_password_hash_ehr_provider.sql
│   │   └── tests/
│   │       ├── conftest.py           → Fixtures pytest (desativa rate limiter em testes)
│   │       └── test_post_users.py    → Testes de aceitação SCRUM-22/23/11
│   │
│   └── web/                          → Frontend Next.js (TypeScript)
│       ├── app/
│       │   ├── layout.tsx            → Layout raiz (Tailwind, lang=pt-BR, fontes Geist)
│       │   ├── page.tsx              → Home (redirect para /login)
│       │   ├── globals.css           → Estilos globais
│       │   ├── login/
│       │   │   └── page.tsx          → Página de login
│       │   ├── cadastro/
│       │   │   └── page.tsx          → Página de cadastro de médico
│       │   └── dashboard/
│       │       └── page.tsx          → Dashboard (placeholder "Em construção")
│       ├── public/
│       │   ├── LogoInterHealth.svg
│       │   └── LogoInterHealth-white.svg
│       ├── package.json
│       ├── tsconfig.json
│       ├── next.config.ts
│       ├── postcss.config.mjs
│       └── eslint.config.mjs
│
├── supabase/
│   └── migrations/
│       └── 20260406000001_add_password_hash_to_users.sql
│
├── References/                        → Mockups de design (SVG exportados do Figma)
└── CLAUDE.md                          → Este arquivo
```

> `packages/` (ai/, ehr/, types/) estão previstos no roadmap mas ainda não implementados.

---

## 2. Stack Tecnológica

### Backend (`apps/api`)
| Tecnologia | Versão | Uso |
|---|---|---|
| Python | 3.x | Linguagem principal |
| FastAPI | 0.135.2 | Framework REST API |
| Supabase Python SDK | 2.28.3 | Cliente PostgreSQL + Auth |
| Pydantic | 2.12.5 | Validação de request/response |
| bcrypt | - | Hash de senhas com salt automático |
| PyJWT | 2.12.1 | Criação e verificação de JWT |
| slowapi | - | Rate limiting por IP |
| uvicorn | 0.42.0 | Servidor ASGI |
| python-dotenv | 1.2.2 | Variáveis de ambiente |
| cryptography (Fernet) | - | Criptografia AES-256 (dados em repouso) |

### Frontend (`apps/web`)
| Tecnologia | Versão | Uso |
|---|---|---|
| Next.js | 16.2.1 | Framework React SSR/SSG |
| React | 19.2.4 | Biblioteca de UI |
| TypeScript | ^5 | Tipagem estática |
| Tailwind CSS | ^4 | Estilização utility-first |

### Infraestrutura
| Serviço | Detalhes |
|---|---|
| Supabase | PostgreSQL hospedado em São Paulo (residência de dados BR) |
| Render | Deploy do backend (free tier) |
| Vercel (previsto) | Deploy do frontend |
| RLS | Row Level Security ativado no Supabase |

---

## 3. Schema do Banco de Dados

### Tabela `users`
```sql
CREATE TABLE users (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT    NOT NULL,
  crm           TEXT    NOT NULL,
  email         TEXT    UNIQUE NOT NULL,
  specialty     TEXT,
  ehr_provider  TEXT,
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  password_hash TEXT    NOT NULL
);
```

**Observações:**
- `password_hash`: armazena somente o hash bcrypt, nunca a senha em texto claro.
- `ehr_provider`: nome em snake_case (migrado de `ehrProvider` camelCase).
- RLS ativo: operações server-side usam `SUPABASE_SERVICE_KEY` (service role).

---

## 4. Arquitetura em Camadas (Obrigatória)

```
Router → Service → Repository
```

- **Router** (`routers/`): recebe a requisição HTTP, chama o service, retorna a resposta. **Sem lógica de negócio.**
- **Service** (`services/`): contém toda regra de negócio. **Sem acesso direto ao banco.**
- **Repository** (`repositories/`): único ponto de acesso ao banco via Supabase SDK.

Esta separação é **obrigatória** em toda nova feature.

---

## 5. Endpoints Implementados

### `POST /users` — Cadastro de médico
- **Rate limit:** 10 req/min por IP
- **Request body:**
  ```json
  {
    "name": "Dr. João Silva",
    "crm": "12345-SP",
    "email": "joao@email.com",
    "password": "Senha@123",
    "specialty": "Clínica Geral",
    "ehrProvider": "iClinic",
    "terms_accepted": true
  }
  ```
- **Respostas:**
  - `201 Created` — usuário criado com sucesso
    ```json
    {
      "user": { "id": "uuid", "name": "...", "crm": "...", "email": "...", "specialty": "...", "ehrProvider": "...", "terms_accepted": true },
      "access_token": "<JWT>",
      "token_type": "bearer"
    }
    ```
  - `409 Conflict` — e-mail já cadastrado
    ```json
    { "detail": "E-mail já cadastrado." }
    ```
  - `422 Unprocessable Entity` — senha fraca
    ```json
    { "detail": { "violations": ["Mínimo 8 caracteres", "..."] } }
    ```

### `POST /auth/login` — Login
- **Rate limit:** 10 req/min por IP
- **Request body:**
  ```json
  { "email": "joao@email.com", "password": "Senha@123" }
  ```
- **Respostas:**
  - `200 OK` — login bem-sucedido
    ```json
    {
      "user": { "id": "uuid", "name": "...", ... },
      "access_token": "<JWT>",
      "token_type": "bearer"
    }
    ```
  - `401 Unauthorized` — credenciais inválidas
    ```json
    { "detail": "Credenciais inválidas." }
    ```

### `GET /health` — Health check
- Retorna `{ "status": "ok" }`

---

## 6. Fluxo de Cadastro (POST /users)

```
1. Router recebe UserCreate (Pydantic valida formato/tipos)
2. Service: validate_password(password) → retorna lista de violações
   - Se violações: raise WeakPasswordError(violations)
3. Service: repo.get_by_email(email) → verifica existência
   - Se existe: raise EmailAlreadyExistsError
4. Service: hash_password(password) → bcrypt com salt automático
5. Service: repo.create({...dados, password_hash}) → insere no Supabase
6. Service: create_access_token(user_id) → JWT HS256, exp 12h
7. Router retorna 201 + UserResponse (sem password) + token
```

---

## 7. Fluxo de Login (POST /auth/login)

```
1. Router recebe LoginRequest (email + password)
2. Service: repo.get_by_email_with_hash(email) → busca usuário + hash
   - Se não encontrado: raise InvalidCredentialsError
3. Service: verify_password(password, hash) → bcrypt comparação
   - Se incorreto: raise InvalidCredentialsError
4. Service: create_access_token(user_id) → JWT HS256, exp 12h
5. Router retorna 200 + UserResponse + token
```

---

## 8. Segurança Implementada

### Senhas
- **Hashing:** bcrypt com salt automático (nunca reversível)
- **Validação obrigatória** (5 critérios, LGPD RN1/RN2):
  - Mínimo 8 caracteres
  - Pelo menos 1 letra maiúscula
  - Pelo menos 1 letra minúscula
  - Pelo menos 1 número
  - Pelo menos 1 caractere especial
- **Nunca exposta** no response (UserResponse não inclui `password_hash`)

### JWT
- **Algoritmo:** HS256
- **Expiração:** 12 horas
- **Payload:** `{ sub: user_id, exp, iat }`
- **Secret:** variável de ambiente `JWT_SECRET`

### API Protection
- **Rate limiting:** 10 req/min por IP (slowapi)
- **CORS:** whitelist de origens via `CORS_ORIGINS`
- **Pydantic:** validação automática de tipos e formatos (ex: EmailStr)

### Infraestrutura
- **Criptografia em repouso:** Fernet (AES-256) disponível via `core/security.py`
- **RLS:** Row Level Security no Supabase
- **Residência de dados:** Supabase São Paulo (compliance LGPD)

---

## 9. Variáveis de Ambiente (`apps/api/.env`)

```env
SUPABASE_URL=https://<projeto>.supabase.co
SUPABASE_SERVICE_KEY=<service-role-key>
JWT_SECRET=<string-aleatoria-minimo-32-chars>
TRANSCRIPT_ENCRYPTION_KEY=<chave-fernet-base64-32-bytes>
CORS_ORIGINS=http://localhost:3000
```

> **NUNCA commitar o `.env` com valores reais.** Use `.env.example` como template.

---

## 10. Frontend — Páginas Implementadas

### `/login` (`apps/web/app/login/page.tsx`)
- Campos: email, password
- Chama `POST {NEXT_PUBLIC_API_URL}/auth/login`
- Em sucesso: salva `access_token` no localStorage, redireciona para `/dashboard`
- Trata erros: 401 (credenciais inválidas), 500, falha de conexão
- Visual: painel verde com gradiente (#2ECC71 → #26A69A) + formulário responsivo

### `/cadastro` (`apps/web/app/cadastro/page.tsx`)
- Campos: name, crm, specialty, ehrProvider (select), email, password, terms_accepted (checkbox)
- **Validação client-side** de senha em tempo real (espelha regras do backend)
- Chama `POST {NEXT_PUBLIC_API_URL}/users`
- Em sucesso: salva token no localStorage, redireciona para `/dashboard`
- Trata erros: 409 (email duplicado), 422 (senha fraca + lista de violações), 500
- Visual: painel esquerdo com branding (desktop) + formulário responsivo à direita

### `/dashboard` (`apps/web/app/dashboard/page.tsx`)
- Placeholder "Em construção" — funcionalidade a implementar

### `/` (`apps/web/app/page.tsx`)
- Redireciona automaticamente para `/login`

---

## 11. Testes

**Localização:** `apps/api/tests/test_post_users.py`

### Cobertura atual
- `POST /users` com dados válidos → 201 + JWT
- `POST /users` com e-mail duplicado → 409
- `POST /users` com senha sem maiúscula → 422
- `POST /users` com senha sem minúscula → 422
- `POST /users` com senha sem número → 422
- `POST /users` com senha sem caractere especial → 422
- `POST /users` com senha curta → 422
- `POST /users` senha válida não retorna violações

**Nota:** Rate limiter desativado nos testes via `conftest.py`.

---

## 12. O Que Está Faltando (Backlog)

| Item | Prioridade | Observação |
|---|---|---|
| Bloqueio após 5 tentativas de login (RN3) | Alta | Estrutura de rate-limit já existe |
| Proteção de rota no dashboard (middleware JWT) | Alta | Token salvo no localStorage |
| Troca de localStorage por httpOnly cookie | Alta | Vulnerabilidade XSS atual |
| Refresh token | Média | Evitar relogin a cada 12h |
| Recuperação de senha | Média | Flow via e-mail |
| Funcionalidade do dashboard | Alta | Placeholder atual |
| `packages/ai/` — integração WhisperX/Claude | Futura | MVP2+ |
| `packages/ehr/` — adaptadores iClinic/Feegow | Futura | MVP3+ |
| `packages/types/` — tipos TypeScript compartilhados | Futura | - |

---

## 13. Regras de Desenvolvimento

1. **Arquitetura obrigatória:** toda feature segue `router → service → repository`. Sem exceções.
2. **Sem lógica no router:** apenas receber, delegar ao service e retornar.
3. **Sem acesso ao banco no service:** toda query passa pelo repository.
4. **Senha nunca em plain text:** sempre bcrypt antes de persistir.
5. **Sem dados sensíveis no response:** `UserResponse` nunca inclui `password_hash`.
6. **Compliance LGPD:** dados de saúde só no Supabase São Paulo.
7. **Variáveis de ambiente:** nunca hardcodar segredos no código.
8. **Testes:** novos endpoints precisam de testes de aceitação correspondentes.

---

## 14. **Sprint 2 — Roadmap e Contexto**

### Objetivo da Sprint
"Ao final desta sprint, o médico consegue se cadastrar na plataforma com segurança
e enviar um áudio de consulta que é automaticamente transcrito e separado por speaker."

---

### 14.1 Tickets Arrastados da Sprint 1 (concluir primeiro)

#### SCRUM-24 — Logs de auditoria para criação de usuário (3 SP)
**Branch:** `feature/SCRUM-24-audit-logs`

**Nova tabela necessária:**
```sql
CREATE TABLE audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: somente service role pode inserir
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
```

**O que implementar:**
- Criar `repositories/audit_logs.py`:
```python
  def create_audit_log(user_id: str, action: str, ip_address: str) -> None
```
- Em `services/users.py`, após `repo.create()` bem-sucedido:
```python
  audit_repo.create_audit_log(user.id, action="USER_CREATED", ip_address=ip)
```
- Extrair IP real do request via `Request.client.host` no router,
  passar como parâmetro ao service
- Arquitetura obrigatória: `router → service → repository`
- Adicionar migration em `supabase/migrations/`

**Critérios de aceite:**
- [ ] Toda criação de usuário gera registro em `audit_logs`
- [ ] Falha no log NÃO deve bloquear o cadastro (try/except isolado)
- [ ] Registro contém `user_id`, `action`, `ip_address`, `created_at`

---

#### SCRUM-10 — Envio de e-mail de confirmação de conta (5 SP)
**Branch:** `feature/SCRUM-10-email-confirmacao`

**Novas tabelas necessárias:**
```sql
ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE email_verification_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Dependência a instalar:**
```
resend==2.x        # pip install resend
```

**Nova variável de ambiente:**
```env
RESEND_API_KEY=<key>
EMAIL_FROM=noreply@interhealth.com.br
```

**O que implementar:**

1. `repositories/email_tokens.py`:
```python
   def create_token(user_id: str, token: str, expires_at: datetime) -> None
   def get_token(token: str) -> dict | None
   def mark_as_used(token: str) -> None
```

2. `services/email.py`:
```python
   def send_verification_email(user_email: str, user_name: str, token: str) -> None
   # Usa resend.Emails.send() com template HTML
   # Link: {FRONTEND_URL}/verificar-email?token={token}
```

3. Em `services/users.py`, após criação do usuário:
```python
   token = str(uuid4())
   expires_at = datetime.utcnow() + timedelta(hours=24)
   email_token_repo.create_token(user_id, token, expires_at)
   email_service.send_verification_email(email, name, token)
```

4. Novo endpoint `GET /auth/verify-email?token=<token>`:
   - Busca token → valida existência, expiração (`expires_at > now()`), não usado
   - Se válido: `UPDATE users SET email_verified = true` + marca token como usado
   - Retorna `200 OK` com `{ "message": "E-mail verificado com sucesso." }`
   - Se inválido/expirado: `400 Bad Request`
   - Se já usado: `409 Conflict`

**Critérios de aceite:**
- [ ] Cadastro dispara envio de e-mail com link de verificação
- [ ] Link expira em 24h
- [ ] `GET /auth/verify-email?token=<token>` válido → `email_verified = true`
- [ ] Token inválido/expirado retorna erro descritivo
- [ ] Falha no envio de e-mail NÃO bloqueia o cadastro (try/except isolado)

---

### 14.2 Pipeline de Transcrição de Áudio (RF2 — Epic SCRUM-12)

**Contexto geral:**
O médico grava ou faz upload de áudio da consulta. O backend processa
de forma assíncrona via BackgroundTasks do FastAPI: transcreve com
WhisperX (pt-BR), diariza com pyannote-audio 3.1 identificando
[MÉDICO] e [PACIENTE], e salva o resultado criptografado no Supabase.
O áudio é deletado após processamento (LGPD — minimização de dados).

**Novos arquivos a criar:**
```
apps/api/
├── routers/
│   └── consultations.py       → POST /consultations/upload
│                                 GET  /consultations/{id}/status
│                                 GET  /consultations
├── services/
│   ├── consultations.py       → Lógica de negócio de consultas
│   └── transcription.py       → Pipeline WhisperX + pyannote
└── repositories/
    └── consultations.py       → Acesso ao banco (tabela consultations)
```

**Nova tabela necessária:**
```sql
CREATE TABLE consultations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES users(id) NOT NULL,
  patient_name          TEXT,
  status                TEXT NOT NULL DEFAULT 'PENDING',
  encrypted_transcript  TEXT,
  transcript_iv         TEXT,
  transcript_expires_at TIMESTAMPTZ,
  patient_consent_flag  BOOLEAN DEFAULT false,
  error_reason          TEXT,
  created_at            TIMESTAMPTZ DEFAULT now()
);
-- status: PENDING → PROCESSING → TRANSCRIBED → ERROR

ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_consultations"
ON consultations FOR ALL
USING (user_id = auth.uid());
```

---

#### SCRUM-26 — Endpoint para upload e validação de arquivo de áudio (5 SP)
**Branch:** `feature/SCRUM-26-upload-audio`

**Novo schema Pydantic (`schemas/consultations.py`):**
```python
class ConsultationCreate(BaseModel):
    patient_name: Optional[str] = None
    patient_consent_flag: bool = False

class ConsultationResponse(BaseModel):
    consultation_id: str
    status: str
    message: str

class ConsultationStatusResponse(BaseModel):
    consultation_id: str
    status: str
    transcript: Optional[str] = None   # só se status == TRANSCRIBED
    error_reason: Optional[str] = None # só se status == ERROR
    created_at: str
```

**Endpoint `POST /consultations/upload`:**
```python
# routers/consultations.py
@router.post("/consultations/upload", status_code=202)
async def upload_audio(
    audio_file: UploadFile = File(...),
    patient_name: Optional[str] = Form(None),
    patient_consent_flag: bool = Form(False),
    background_tasks: BackgroundTasks,
    current_user_id: str = Depends(get_current_user),  # JWT obrigatório
):
```

**Validações obrigatórias:**
- Formatos aceitos: `.wav`, `.mp3`, `.m4a`, `.webm`
- Tamanho máximo: 100MB (`content_length <= 100 * 1024 * 1024`)
- MIME types válidos: `audio/wav`, `audio/mpeg`, `audio/mp4`, `audio/webm`
- Se inválido: `422 Unprocessable Entity` com mensagem descritiva

**Fluxo:**
```
1. Validar arquivo (formato + tamanho)
2. service.create_consultation(user_id, patient_name, consent) → consultation_id
3. Salvar arquivo em /tmp/{consultation_id}.{ext}
4. background_tasks.add_task(transcription_service.process, consultation_id, file_path)
5. Retornar 202 Accepted + consultation_id
```

**Rate limit:** 5 uploads/min por IP (adicionar ao `limiter.py`)

---

#### SCRUM-27 — Integrar WhisperX + pyannote-audio (8 SP)
**Branch:** `feature/SCRUM-27-whisperx-pipeline`

**Dependências a instalar (`requirements.txt`):**
```
whisperx
pyannote.audio==3.1.0
torch
torchaudio
```

**Nova variável de ambiente:**
```env
HUGGINGFACE_TOKEN=<token>   # necessário para pyannote.audio
```

**Implementar `services/transcription.py`:**
```python
import whisperx
from pyannote.audio import Pipeline

async def process(consultation_id: str, file_path: str) -> None:
    try:
        # 1. Atualizar status → PROCESSING
        await repo.update_status(consultation_id, "PROCESSING")

        # 2. Carregar modelo WhisperX
        model = whisperx.load_model(
            "large-v3-turbo",
            device="cpu",          # cpu para Render free tier
            language="pt",
            compute_type="int8"    # otimização de memória
        )

        # 3. Transcrever
        audio = whisperx.load_audio(file_path)
        result = model.transcribe(audio, language="pt")

        # 4. Alinhar timestamps
        model_a, metadata = whisperx.load_align_model(language_code="pt", device="cpu")
        result = whisperx.align(result["segments"], model_a, metadata, audio, device="cpu")

        # 5. Diarização com pyannote
        diarize_pipeline = Pipeline.from_pretrained(
            "pyannote/speaker-diarization-3.1",
            use_auth_token=HUGGINGFACE_TOKEN
        )
        diarize_segments = diarize_pipeline(file_path)

        # 6. Atribuir speakers aos segmentos
        result = whisperx.assign_word_speakers(diarize_segments, result)

        # 7. Formatar transcript diarizado
        transcript = format_transcript(result["segments"])
        # Formato: "[MÉDICO]: texto\n[PACIENTE]: texto\n..."
        # SPEAKER_00 → [MÉDICO], SPEAKER_01 → [PACIENTE]

        # 8. Criptografar com Fernet (core/security.py já tem encrypt())
        encrypted, iv = encrypt(transcript)

        # 9. Salvar no Supabase + definir expiração (30 dias)
        expires_at = datetime.utcnow() + timedelta(days=30)
        await repo.save_transcript(consultation_id, encrypted, iv, expires_at)
        await repo.update_status(consultation_id, "TRANSCRIBED")

    except Exception as e:
        await repo.update_status(consultation_id, "ERROR", error_reason=str(e))
    finally:
        # 10. LGPD — deletar áudio após processamento
        if os.path.exists(file_path):
            os.remove(file_path)
```

**Endpoint `GET /consultations/{id}/status`:**
- Autenticação JWT obrigatória
- Verifica que `consultation.user_id == current_user_id` (não acessar consulta de outro médico)
- Retorna `ConsultationStatusResponse`
- Só decripta e retorna `transcript` se `status == "TRANSCRIBED"`

---

#### SCRUM-14 — Validar transcrição antes de salvar (3 SP)
**Branch:** `feature/SCRUM-14-validar-transcricao`

**Implementar em `services/transcription.py`** antes do `encrypt()`:
```python
def validate_transcript(transcript: str, segments: list) -> list[str]:
    errors = []
    if not transcript or len(transcript.strip()) == 0:
        errors.append("Transcrição vazia.")
    if len(transcript.split()) < 20:
        errors.append("Transcrição muito curta (menos de 20 palavras).")
    speakers = set(s.get("speaker") for s in segments if s.get("speaker"))
    if len(speakers) < 1:
        errors.append("Nenhum speaker identificado.")
    return errors
```

- Se `errors` não vazio: `status = "ERROR"`, `error_reason = "; ".join(errors)`
- Não salvar transcript inválido

**Critérios de aceite:**
- [ ] Transcript vazio → ERROR com razão descritiva
- [ ] Menos de 20 palavras → ERROR
- [ ] Nenhum speaker identificado → ERROR
- [ ] Transcript válido → segue fluxo normal

---

#### SCRUM-13 — Separar consultas por paciente (3 SP)
**Branch:** `feature/SCRUM-13-listagem-consultas`

**Endpoint `GET /consultations`:**
```python
@router.get("/consultations")
async def list_consultations(
    patient_name: Optional[str] = Query(None),
    current_user_id: str = Depends(get_current_user),
):
```

**Repository `repositories/consultations.py`:**
```python
def list_by_user(user_id: str, patient_name: Optional[str] = None) -> list[dict]:
    query = supabase.table("consultations") \
        .select("id, patient_name, status, created_at, error_reason") \
        .eq("user_id", user_id) \
        .order("created_at", desc=True)
    if patient_name:
        query = query.ilike("patient_name", f"%{patient_name}%")
    return query.execute().data
```

**Response:**
```json
[
  {
    "id": "uuid",
    "patient_name": "Maria Silva",
    "status": "TRANSCRIBED",
    "created_at": "2026-04-14T10:00:00Z"
  }
]
```

**Critérios de aceite:**
- [ ] Retorna apenas consultas do médico autenticado (`user_id` do JWT)
- [ ] Filtro por `patient_name` funciona (case-insensitive)
- [ ] Ordenação: mais recente primeiro
- [ ] Médico não consegue acessar consultas de outro médico (403)

---

### 14.3 Preparação para Sprint 3 — LLM/SOAP

#### SCRUM-31 — Configurar Claude Haiku como provider LLM (3 SP)
**Branch:** `feature/SCRUM-31-llm-client`

**Dependência:**
```
anthropic>=0.40.0
```

**Nova variável de ambiente:**
```env
ANTHROPIC_API_KEY=<key>
```

**Criar `apps/api/services/llm_client.py`:**
```python
import anthropic
import logging

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

def call_claude(
    prompt: str,
    system: str,
    model: str = "claude-haiku-4-5-20251001",
    max_tokens: int = 1000,
) -> str:
    try:
        message = client.messages.create(
            model=model,
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": prompt}],
        )
        # Log de tokens para controle de custo
        logging.info(
            f"Claude tokens — input: {message.usage.input_tokens}, "
            f"output: {message.usage.output_tokens}"
        )
        return message.content[0].text
    except anthropic.RateLimitError:
        raise Exception("LLM rate limit atingido. Tente novamente em instantes.")
    except anthropic.APITimeoutError:
        raise Exception("Timeout na chamada ao LLM.")
    except Exception as e:
        raise Exception(f"Erro ao chamar LLM: {str(e)}")
```

**Critérios de aceite:**
- [ ] `call_claude()` retorna texto do modelo com sucesso
- [ ] Erros de rate limit e timeout tratados com mensagem amigável
- [ ] Tokens logados a cada chamada (controle de custo ~R$0,05/consulta)
- [ ] `ANTHROPIC_API_KEY` nunca hardcodada no código

---

#### SCRUM-28 — Definir tipos de análise (2 SP)

**Entregável:** Documento descrevendo:
- Campos obrigatórios SOAP (CFM Resolução 1.638/2002):
  - **S** — Subjetivo: queixa principal + história
  - **O** — Objetivo: exame físico + sinais vitais
  - **A** — Avaliação: hipóteses diagnósticas + CID
  - **P** — Plano: conduta, prescrições, retorno
- Formato JSON esperado do output do LLM:
```json
  {
    "subjetivo": "...",
    "objetivo": "...",
    "avaliacao": "...",
    "plano": "...",
    "cid": "A00.0",
    "hipoteses_diagnosticas": ["..."]
  }
```
- 2 exemplos reais de input (transcript) → output (SOAP esperado)

---

### 14.4 Novas Variáveis de Ambiente (Sprint 2)

Adicionar ao `.env` e `.env.example`:
```env
# E-mail — SCRUM-10
RESEND_API_KEY=<key>
EMAIL_FROM=noreply@interhealth.com.br
FRONTEND_URL=http://localhost:3000

# Transcrição — SCRUM-27
HUGGINGFACE_TOKEN=<token>

# LLM — SCRUM-31
ANTHROPIC_API_KEY=<key>
```

---

### 14.5 Novos Endpoints Backend (Sprint 2)

| Método | Rota | Issue | Status |
|---|---|---|---|
| `POST` | `/consultations/upload` | SCRUM-26 | A implementar |
| `GET` | `/consultations/{id}/status` | SCRUM-27 | A implementar |
| `GET` | `/consultations` | SCRUM-13 | A implementar |
| `GET` | `/auth/verify-email` | SCRUM-10 | A implementar |

---

### 14.6 Ordem de Implementação Backend

1. SCRUM-24 → Audit logs         (desbloqueia auditoria)
2. SCRUM-10 → E-mail confirmação (paralelo ao SCRUM-24)
3. SCRUM-26 → Upload de áudio    (base do pipeline)
4. SCRUM-27 → WhisperX pipeline  (após SCRUM-26)
5. SCRUM-14 → Validar transcript (após SCRUM-27)
6. SCRUM-13 → Listar consultas   (após SCRUM-26)
7. SCRUM-31 → LLM client         (paralelo, fim da sprint)
8. SCRUM-28 → Definição SOAP     (descoberta, sem dependência)

### 14.7 Frontend — Dashboard e Tela de Consulta (Sprint 2)

**Referência de design:** Figma `Prq6T3knlDTKil52l4MeEH`
**Branch:** `feature/SCRUM-15-dashboard-consulta-ui`

> Todas as telas seguem o design system já estabelecido:
> - Cor primária: `#006d37` (verde InterHealth)
> - Fontes: Geist (já configurado em `layout.tsx`)
> - Estilização: Tailwind CSS ^4
> - Framework: Next.js 16 + React 19 + TypeScript

---

#### Tela 1 — Dashboard Principal (`/dashboard`)

**Substituir o placeholder atual** (`"Em construção"`) pela tela real.

**Estrutura de layout:**
```
apps/web/app/dashboard/
├── page.tsx           → Dashboard principal
├── layout.tsx         → Layout compartilhado (sidebar + header)
└── nova-consulta/
│   └── page.tsx       → Tela de nova consulta / upload de áudio
└── consulta/
    └── [id]/
        └── page.tsx   → Tela de visualização de consulta individual
```

**Componentes a implementar em `apps/web/components/`:**
```
components/
├── layout/
│   ├── Sidebar.tsx         → Menu lateral (Dashboard, Nova Consulta, Histórico)
│   └── Header.tsx          → Barra superior (nome do médico, logout)
├── dashboard/
│   ├── ConsultaCard.tsx     → Card de consulta com status visual
│   └── ConsultaList.tsx     → Lista de consultas do médico
└── consulta/
    ├── AudioRecorder.tsx    → Gravação via MediaRecorder API
    ├── AudioUploader.tsx    → Upload de arquivo de áudio existente
    ├── TranscriptViewer.tsx → Exibição diarizada por speaker
    └── StatusBadge.tsx      → Badge de status (PENDING/PROCESSING/TRANSCRIBED/ERROR)
```

**Funcionalidade do Dashboard (`/dashboard`):**
- Middleware de autenticação: verificar `access_token` no localStorage
  - Se ausente ou expirado → redirecionar para `/login`
- Buscar consultas do médico: `GET /consultations` (header `Authorization: Bearer <token>`)
- Exibir lista de consultas com `ConsultaCard`:
  - Nome do paciente, data, status com cor por estado:
    - `PENDING` → cinza
    - `PROCESSING` → amarelo (animado)
    - `TRANSCRIBED` → verde
    - `ERROR` → vermelho
- Botão "Nova Consulta" → navega para `/dashboard/nova-consulta`
- Polling automático a cada 5s para atualizar status de consultas em andamento

---

#### Tela 2 — Nova Consulta (`/dashboard/nova-consulta`)

**Funcionalidade:**
- Duas opções de entrada de áudio:
  1. **Gravar agora** — `AudioRecorder.tsx` usando MediaRecorder API (grava `.webm`)
  2. **Upload de arquivo** — `AudioUploader.tsx` aceita `.wav`, `.mp3`, `.m4a`, `.webm`
- Campo opcional: nome do paciente (para organização)
- Campo opcional: checkbox "Consentimento do paciente registrado"
- Ao confirmar:
  - `POST /consultations/upload` com `multipart/form-data`
  - Header: `Authorization: Bearer <token>`
  - Exibir estados visuais progressivos:
    - "Enviando áudio..." (upload em andamento)
    - "Transcrevendo consulta..." (polling `GET /consultations/{id}/status`)
    - "Transcrição concluída! ✓" → redirecionar para `/dashboard/consulta/{id}`
    - "Erro ao processar áudio" → exibir mensagem + botão de retry

**Tratamento de erros:**
- Arquivo muito grande (>100MB) → alerta antes do upload
- Formato inválido → alerta com formatos aceitos
- Timeout na transcrição (>5 min) → mensagem de erro amigável

---

#### Tela 3 — Visualização de Consulta (`/dashboard/consulta/[id]`)

**Funcionalidade:**
- Buscar consulta: `GET /consultations/{id}/status`
- Exibir transcrição diarizada com `TranscriptViewer.tsx`:
```
  ┌─────────────────────────────────────────┐
  │  👨‍⚕️ MÉDICO                              │
  │  "Bom dia, como você está se sentindo?" │
  ├─────────────────────────────────────────┤
  │  👤 PACIENTE                            │
  │  "Tenho sentido dores de cabeça..."     │
  └─────────────────────────────────────────┘
```
- Cores distintas por speaker:
  - `[MÉDICO]` → fundo verde claro `#e8f5e9`, texto `#006d37`
  - `[PACIENTE]` → fundo cinza claro `#f5f5f5`, texto `#333`
- Metadados da consulta: data, hora, nome do paciente, duração estimada
- Botão "Voltar ao Dashboard"
- Botão "Gerar SOAP" (desabilitado por ora — Sprint 3) com tooltip "Em breve"

---

#### Variáveis de Ambiente Frontend (adicionar ao `.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

#### Checklist de Aceite — Frontend Sprint 2

- [ ] Dashboard exibe lista real de consultas do médico autenticado
- [ ] Consultas em processamento atualizam status automaticamente (polling)
- [ ] Médico consegue gravar áudio diretamente no browser
- [ ] Médico consegue fazer upload de arquivo de áudio
- [ ] Feedback visual claro durante upload e transcrição
- [ ] Tela de consulta exibe transcrição diarizada com speakers identificados
- [ ] Rotas protegidas redirecionam para `/login` se não autenticado
- [ ] Layout responsivo (desktop e mobile)
- [ ] Token expirado → logout automático + redirect para `/login`