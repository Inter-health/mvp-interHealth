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
│       │   ├── layout.tsx            → Layout raiz (Geist, lang=pt-BR)
│       │   ├── page.tsx              → Landing page pública (PublicNavbar, Hero, Features, Pricing, CTA, Footer)
│       │   ├── globals.css           → Design system tokens (CSS vars, @keyframes, classes rsp-* para responsividade)
│       │   ├── not-found.tsx         → 404 adaptativo (sidebar se logado, header público se não). Logo usa miniLogoInterHealth.png
│       │   ├── solucao/
│       │   │   └── page.tsx          → Página B2B Enterprise (/solução → rewrite para /solucao)
│       │   ├── login/
│       │   │   └── page.tsx          → Login (POST /auth/login, usa saveToken())
│       │   ├── cadastro/
│       │   │   └── page.tsx          → Cadastro de médico (POST /users, usa saveToken())
│       │   └── dashboard/
│       │       ├── layout.tsx        → Sidebar + main area
│       │       ├── page.tsx          → Dashboard: hero, 4 KPIs, tabela de consultas (mock)
│       │       ├── pacientes/
│       │       │   └── page.tsx      → Grid de pacientes com filtros (mock)
│       │       └── nova-consulta/
│       │           └── page.tsx      → UI de gravação/upload + painel de transcrição (mock)
│       ├── components/
│       │   ├── ui/
│       │   │   ├── Avatar.tsx        → Avatar com iniciais
│       │   │   ├── Button.tsx        → Botão com variantes
│       │   │   ├── Card.tsx          → Card genérico
│       │   │   ├── Icon.tsx          → Ícones SVG inline (dashboard, users, mic, etc.)
│       │   │   ├── LiveDot.tsx       → Indicador animado de status ativo
│       │   │   └── Pill.tsx          → Badge de status
│       │   └── layout/
│       │       ├── Sidebar.tsx       → Nav lateral: botão "+ Nova consulta" (CTA verde, antes do Dashboard), nav, botão "Sair da conta" (redireciona para /)
│       │       └── PublicNavbar.tsx  → Navbar pública reutilizável (landing + /solução). Hamburger esquerdo, sidebar animada, mobile-responsive
│       ├── lib/
│       │   ├── api.ts                → Cliente HTTP (apiFetch, apiUpload, saveToken, logout → redireciona para /)
│       │   └── types.ts              → Interfaces TypeScript alinhadas com a API
│       ├── middleware.ts             → Proteção /dashboard/** via cookie (edge runtime). NÃO intercepta /
│       ├── public/
│       │   ├── LogoInterHealth.svg
│       │   ├── LogoInterHealth-white.svg
│       │   ├── miniLogoInterHealth.png
│       │   ├── figma-landing-hero.png               → Imagem hero da landing (médico com paciente)
│       │   ├── Análise de dados de saúde.png        → Card "Análise Preditiva" na landing
│       │   ├── Interface de prontuário inteligente.png → Card "Prontuário Inteligente" na landing
│       │   └── Formas abstratas.png                 → Background da seção CTA da landing
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
| Python | **3.12** (venv recriado — 3.9 era incompatível com as dependências) | Linguagem principal |
| FastAPI | 0.135.2 | Framework REST API |
| Supabase Python SDK | 2.28.3 | Cliente PostgreSQL + Auth |
| Pydantic | 2.12.5 | Validação de request/response |
| bcrypt | - | Hash de senhas com salt automático (**não estava no requirements.txt — instalar manualmente**) |
| PyJWT | 2.12.1 | Criação e verificação de JWT |
| slowapi | - | Rate limiting por IP (**não estava no requirements.txt — instalar manualmente**) |
| email-validator | - | Validação de EmailStr do Pydantic (**não estava no requirements.txt**) |
| passlib | - | Utilitários de hashing (**não estava no requirements.txt**) |
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
- Chama `POST /auth/login` via fetch direto (sem `apiFetch` — sem token ainda)
- Em sucesso: chama `saveToken()` → persiste em localStorage + cookie, redireciona para `/dashboard`
- Trata erros: 401 (credenciais inválidas), 500, falha de conexão
- Visual: card centralizado com blobs decorativos verdes, gradiente (#2ECC71 → #26A69A)

### `/cadastro` (`apps/web/app/cadastro/page.tsx`)
- Campos: name, crm, specialty, ehrProvider (select), email, password, terms_accepted (checkbox)
- **Validação client-side** de senha em tempo real (espelha as 5 regras do backend)
- Chama `POST /users` via fetch direto
- Em sucesso: chama `saveToken()`, redireciona para `/dashboard`
- Trata erros: 409 (email duplicado), 422 (senha fraca + lista de violações), 500
- Visual: split-screen — painel verde com branding (desktop) + formulário responsivo à direita

### `/dashboard` (`apps/web/app/dashboard/page.tsx`)
- Layout: `dashboard/layout.tsx` com `<Sidebar>` + `<main>` (protegido via `middleware.ts`)
- Hero com gradiente verde, saudação, botão "Nova Consulta"
- 4 KPIs: Pacientes atendidos, Prontuários gerados, Consultas esta semana, Consulta ativa
- Tabela de consultas do dia com avatar, nome, hora, tipo, status colorido
- **Dados: todos mockados** — aguarda `GET /consultations` e `GET /users/me`

### `/dashboard/pacientes` (`apps/web/app/dashboard/pacientes/page.tsx`)
- Grid de cards de pacientes com foto/avatar, nome, última consulta, status
- Filtros por aba: Todos, Ativos, Pendentes, Arquivados
- Campo de busca
- **Dados: todos mockados** — aguarda `GET /consultations`

### `/dashboard/nova-consulta` (`apps/web/app/dashboard/nova-consulta/page.tsx`)
- Painel esquerdo: controles de gravação (botão mic, timer, waveform animado)
- Painel direito: transcrição em tempo real + painel de insights de IA
- **Dados: UI estática** — aguarda `POST /consultations/upload` + polling de status

### `/not-found` (`apps/web/app/not-found.tsx`)
- Detecta autenticação via localStorage no cliente
- Se logado: exibe `<Sidebar>` + layout do dashboard com número 404 e mensagem
- Se não logado: exibe header/footer público
- Número 404 em `#BBC5CC` (visível sobre fundo branco)
- **Logo:** usa `<Image src="/miniLogoInterHealth.png">` — o SVG `LeafMark` gerado manualmente foi removido

### `/solução` → `/solucao` (`apps/web/app/solucao/page.tsx`) — ✅ IMPLEMENTADA
- Página B2B Enterprise (acessível via `/solução` graças ao rewrite no `next.config.ts`)
- **Seções:**
  1. `<PublicNavbar activePage="solucao">` — link "Solução" ativo (underline verde)
  2. Hero — H1 "Infraestrutura Digital / para Saúde Corporativa", badge "B2B · ENTERPRISE", formulário "Agendar uma Demo" com `id="agendar-demo"`
  3. Imagem hospital — foto full-width com overlay escuro
  4. Arquitetura — grid 3 cards: Segurança & Compliance LGPD, Integrações EHR, IA Clínica
  5. CTA — fundo escuro, botão "Agendar Demo Agora" âncora `#agendar-demo`
  6. Footer
- Botão hero "Agendar uma Demo" usa `href="#agendar-demo"` para scroll suave ao formulário
- Server component puro (sem `"use client"`)

### `/` (`apps/web/app/page.tsx`) — ✅ LANDING PAGE IMPLEMENTADA
- **Antes:** redirecionava para `/login`
- **Agora:** landing page pública completa, fiel ao design Figma
- **Seções:**
  1. `<PublicNavbar>` — fixo, logo + links (Solução / Preços) + Login + "Começar Agora"
  2. `<Hero>` — 2 colunas: headline "A Precisão Empática / ao seu Alcance", subtítulo, 2 CTAs; lado direito: `figma-landing-hero.png` + 2 floating cards sobrepostos (Vitality Chip + transcrição ao vivo)
  3. `<Features>` — heading centralizado, 2 cards escuros (`#0A1A0F`): "Prontuário Inteligente" (pill PRONTUÁRIO, imagem `Interface de prontuário inteligente.png`) e "Análise Preditiva" (pill INTELIGÊNCIA ARTIFICIAL, imagem `Análise de dados de saúde.png`)
  4. `<Pricing>` — 3 colunas: Teste Gratuito (14 Dias), Plano Clínico (R$119,90/mês, gradiente verde, badge Popular), Planos Hospitalar (Sob Consulta)
  5. `<Compliance>` — badge LGPD, "Privacidade que excede os padrões clínicos mundiais."
  6. `<CTA>` — fundo `#0A1A0F` + `Formas abstratas.png` como overlay (opacity 0.25), botões "Começar Teste Grátis" e "Ver Vídeo Demo"
  7. `<Footer>` — logo + copyright + links + ícones sociais
- **Não usa `"use client"`** — server component puro (sem hooks)
- **Middleware:** `matcher` não inclui `/`, landing page não é interceptada

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

## 12. Backlog de Segurança e Melhorias

| Item | Prioridade | Status | Observação |
|---|---|---|---|
| Bloqueio após 5 tentativas de login (RN3) | Alta | ⬜ Pendente | Estrutura de rate-limit já existe via slowapi |
| Proteção de rota no dashboard (middleware JWT) | Alta | ✅ Feito | `middleware.ts` + dual storage cookie/localStorage |
| Troca de localStorage por httpOnly cookie | Alta | ⚠️ Parcial | Cookie SameSite=Strict implementado; httpOnly exige endpoint de refresh no backend |
| Dashboard conectado à API real | Alta | ⬜ Pendente | Aguarda `GET /consultations` + `GET /users/me` no backend |
| Endpoint `GET /users/me` no backend | Alta | ⬜ Pendente | Dashboard e sidebar precisam do nome do médico |
| Refresh token | Média | ⬜ Pendente | Evitar relogin a cada 12h |
| Recuperação de senha | Média | ⬜ Pendente | Flow via e-mail |
| `packages/ai/` — integração WhisperX/Claude | Futura | ⬜ Pendente | MVP2+ |
| `packages/ehr/` — adaptadores iClinic/Feegow | Futura | ⬜ Pendente | MVP3+ |
| `packages/types/` — tipos TypeScript compartilhados | Futura | ⬜ Pendente | — |

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

### 14.7 Frontend — Sprint 2 — Estado de Implementação

**Design system:** tokens em `globals.css` (`--ih-green`, `--ih-font-display`, etc.) + `@keyframes ih-pulse`
**Referência de design:** Figma `Prq6T3knlDTKil52l4MeEH`

---

#### Infraestrutura de API ✅ CONCLUÍDA

| Arquivo | O que faz | Status |
|---|---|---|
| `lib/api.ts` | `apiFetch`, `apiUpload`, `saveToken`, `logout` | ✅ Criado |
| `lib/types.ts` | Interfaces TypeScript alinhadas com a API | ✅ Criado |
| `middleware.ts` | Proteção `/dashboard/**` via cookie no edge | ✅ Criado |
| `login/page.tsx` | Usa `saveToken()` após autenticação | ✅ Atualizado |
| `cadastro/page.tsx` | Usa `saveToken()` após cadastro | ✅ Atualizado |
| `Sidebar.tsx` | Usa `logout()` de `lib/api.ts` | ✅ Atualizado |

---

#### Telas de UI ✅ CONCLUÍDAS (dados mockados)

| Tela | Rota | Status | Aguarda backend |
|---|---|---|---|
| Dashboard | `/dashboard` | ✅ UI pronta | `GET /consultations`, `GET /users/me` |
| Pacientes | `/dashboard/pacientes` | ✅ UI pronta | `GET /consultations` |
| Nova Consulta | `/dashboard/nova-consulta` | ✅ UI pronta | `POST /consultations/upload` |
| 404 | `/*` (not-found) | ✅ Pronto | — |

---

#### Próximos passos — conectar UI à API real

Quando os endpoints de backend estiverem prontos, a ordem de conexão é:

1. **`GET /users/me`** → substituir nome mockado no hero do dashboard e na sidebar
2. **`GET /consultations`** → substituir tabela do dashboard e grid de pacientes
3. **`POST /consultations/upload`** + polling de status → conectar nova-consulta
4. **`GET /consultations/{id}/status`** → criar tela `dashboard/consulta/[id]` com transcrição diarizada

**Padrão de fetch obrigatório:**
```typescript
"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Consultation, User } from "@/lib/types";
```

**Upload multipart — usar `apiUpload`, não `apiFetch`:**
```typescript
const formData = new FormData();
formData.append("audio_file", audioBlob, "consulta.webm");
formData.append("patient_name", patientName);
formData.append("patient_consent_flag", String(consent));
const res = await apiUpload("/consultations/upload", formData);
```

**Polling de status:**
```typescript
const poll = setInterval(async () => {
  const res = await apiFetch(`/consultations/${id}/status`);
  const data: ConsultationDetail = await res.json();
  setStatus(data.status);
  if (data.status === "TRANSCRIBED" || data.status === "ERROR") clearInterval(poll);
}, 3000);
// cleanup: return () => clearInterval(poll);
```

---

#### Checklist de Aceite — Frontend Sprint 2

- [x] Infraestrutura de auth (saveToken, logout, middleware) implementada
- [x] Rotas protegidas redirecionam para `/login` se não autenticado
- [x] Token expirado → logout automático + redirect para `/login`
- [x] UI do dashboard, pacientes e nova consulta implementada (design system)
- [ ] Dashboard exibe dados reais do médico autenticado
- [ ] Consultas em processamento atualizam status automaticamente (polling)
- [ ] Médico consegue fazer upload de arquivo de áudio
- [ ] Feedback visual claro durante upload e transcrição
- [ ] Tela de consulta exibe transcrição diarizada com speakers identificados

---

## 15. Integração Frontend ↔ Backend — Estado Atual (Sprint 2)

> Esta seção descreve o estado real da integração no início da Sprint 2. Os arquivos de infraestrutura de API já foram criados; as páginas de dashboard ainda usam dados mockados à espera dos endpoints de backend.

---

### 15.1 Estado Atual de Cada Página

| Página | Rota | Dados reais do backend? | O que ainda usa mock/hardcode |
|---|---|---|---|
| **Landing Page** | `/` | ✅ Estática (sem backend) | — |
| Login | `/login` | ✅ Conectado (`POST /auth/login`) | — |
| Cadastro | `/cadastro` | ✅ Conectado (`POST /users`) | — |
| Dashboard principal | `/dashboard` | ❌ 100% mock | Nome do médico, agenda, KPIs |
| Pacientes | `/dashboard/pacientes` | ❌ 100% mock | Lista de pacientes, status |
| Nova Consulta | `/dashboard/nova-consulta` | ❌ 100% mock | Timer, transcrição, insights |
| 404 | `/*` (not-found) | ✅ Lê localStorage | — |

---

### 15.2 Variável de Ambiente Obrigatória no Frontend

Arquivo: `apps/web/.env`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Em produção (Vercel), substituir pelo URL do backend no Render. **Nunca commitar com valor de produção.**

> Todas as chamadas à API devem usar `process.env.NEXT_PUBLIC_API_URL` como base — nunca URL hardcoded.

---

### 15.3 Cliente HTTP — `apps/web/lib/api.ts` ✅ CRIADO

Centraliza todas as chamadas HTTP. Exporta:

- `apiFetch(path, options)` — todas as chamadas autenticadas (JSON). Verifica expiração do token antes de cada chamada. Redireciona para `/login` em caso de 401 ou token expirado.
- `apiUpload(path, formData)` — upload multipart sem `Content-Type` (browser define o boundary).
- `saveToken(token)` — persiste o token no `localStorage` **e** como cookie (`max-age=43200`, 12h), necessário para o middleware do Next.js funcionar no edge.
- `logout()` — remove token do `localStorage` e do cookie, **redireciona para `/`** (landing page). ⚠️ Era `/login` — alterado para levar o médico à landing page ao sair.

> **Regra:** login (`/login`) e cadastro (`/cadastro`) usam `saveToken()`. Sidebar usa `logout()`. Nenhum outro arquivo deve tocar em `localStorage` diretamente para auth.

---

### 15.4 Proteção de Rotas — `apps/web/middleware.ts` ✅ CRIADO

Executa no edge runtime do Next.js antes de renderizar qualquer página.

- Lê o cookie `access_token` (não localStorage — edge não tem acesso ao browser).
- `/dashboard/**` sem token → redireciona para `/login`.
- `/login` ou `/cadastro` com token → redireciona para `/dashboard`.
- `matcher`: `["/dashboard/:path*", "/login", "/cadastro"]`.

> O cookie é definido por `saveToken()` e removido por `logout()` — os dois lados estão sincronizados.

---

### 15.5 Tipos TypeScript — `apps/web/lib/types.ts` ✅ CRIADO

Interfaces alinhadas com os schemas Pydantic do backend:

- `User` — dados do médico (sem `password_hash`)
- `AuthResponse` — resposta de login/cadastro (`user` + `access_token`)
- `ConsultationStatus` — `"PENDING" | "PROCESSING" | "TRANSCRIBED" | "ERROR"`
- `Consultation` — item da lista de consultas
- `ConsultationDetail` — consulta individual com `transcript` (quando TRANSCRIBED)
- `ConsultationUploadResponse` — resposta do `POST /consultations/upload`
- `ApiError` — `{ detail: string | { violations: string[] } }`

---

### 15.6 Endpoint em Falta — `GET /users/me`

O dashboard exibe o nome do médico ("Bem-vindo de volta, Dr. Médico.") mas o backend **não possui** um endpoint `GET /users/me`. O frontend não consegue recuperar o nome do médico logado sem isso.

**O que implementar no backend:**

```python
# routers/users.py — adicionar:
@router.get("/users/me")
async def get_me(current_user_id: str = Depends(get_current_user)):
    user = user_repo.get_by_id(current_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return UserResponse(**user)
```

**Como o frontend deve consumir:**

```typescript
// No dashboard/layout.tsx ou em um contexto global:
const res = await apiFetch("/users/me");
const user: User = await res.json();
// Exibir user.name no hero do dashboard e no topo da sidebar
```

Enquanto esse endpoint não existir, o nome pode ser extraído do JWT (o payload não inclui `name` hoje — apenas `sub: user_id`). **Não decodificar dados sensíveis no frontend.** A solução correta é implementar `GET /users/me`.

---

### 15.7 Conexão do Dashboard Principal com a API

**Arquivo:** `apps/web/app/dashboard/page.tsx`

Substituições necessárias (dados mock → dados reais):

| Elemento | Mock atual | Chamada real |
|---|---|---|
| Nome do médico no hero | `"Dr. Médico"` | `GET /users/me` → `user.name` |
| Agenda do dia (appointments) | Array hardcoded | `GET /consultations` → lista de consultas do dia |
| KPI "Pacientes atendidos" | `"128"` | Derivado de `GET /consultations` (count) |
| KPI "Prontuários gerados" | `"94"` | Derivado de `GET /consultations` (count TRANSCRIBED) |
| KPI "Consulta ativa" | `"Gravando"` | Consulta com status `PROCESSING` (se existir) |

**Padrão de fetch a usar no componente:**

```typescript
"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Consultation, User } from "@/lib/types";

// Dentro do componente:
const [consultations, setConsultations] = useState<Consultation[]>([]);
const [user, setUser] = useState<User | null>(null);

useEffect(() => {
  Promise.all([
    apiFetch("/users/me").then(r => r.json()),
    apiFetch("/consultations").then(r => r.json()),
  ]).then(([userData, consultData]) => {
    setUser(userData);
    setConsultations(consultData);
  });
}, []);
```

---

### 15.8 Conexão da Página Pacientes com a API

**Arquivo:** `apps/web/app/dashboard/pacientes/page.tsx`

A lista atual é hardcoded. O backend retorna consultas, não pacientes diretamente. O mapeamento é:

- Cada `Consultation` com `patient_name` não nulo representa uma entrada de paciente
- Agrupar por `patient_name` para deduplificar
- Filtro `?patient_name=` já existe no `GET /consultations`

```typescript
// Buscar consultas e derivar lista de pacientes:
const res = await apiFetch("/consultations");
const consultations: Consultation[] = await res.json();

// Agrupar por patient_name (dedup):
const patients = Array.from(
  consultations
    .filter(c => c.patient_name)
    .reduce((map, c) => {
      if (!map.has(c.patient_name!)) map.set(c.patient_name!, c);
      return map;
    }, new Map<string, Consultation>())
    .values()
);
```

---

### 15.9 Conexão da Nova Consulta com a API

**Arquivo:** `apps/web/app/dashboard/nova-consulta/page.tsx`

A página atual é um mock estático. O fluxo real deve ser:

```
1. Médico grava (MediaRecorder → .webm) ou faz upload de arquivo
2. POST /consultations/upload (multipart/form-data)
   - campo: audio_file (File)
   - campo: patient_name (string, opcional)
   - campo: patient_consent_flag (boolean)
   - header: Authorization: Bearer <token>
3. Recebe { consultation_id, status: "PENDING" }
4. Inicia polling: GET /consultations/{consultation_id}/status a cada 3s
5. status === "PROCESSING" → exibe "Transcrevendo..."
6. status === "TRANSCRIBED" → exibe transcrição ou redireciona para /dashboard/consulta/{id}
7. status === "ERROR" → exibe error_reason
```

**Polling:**

```typescript
const poll = setInterval(async () => {
  const res = await apiFetch(`/consultations/${consultationId}/status`);
  const data: ConsultationDetail = await res.json();
  setStatus(data.status);
  if (data.status === "TRANSCRIBED" || data.status === "ERROR") {
    clearInterval(poll);
  }
}, 3000);
```

**Upload multipart (NÃO usar `apiFetch` para isso — usar `apiUpload`):**

```typescript
const formData = new FormData();
formData.append("audio_file", audioBlob, "consulta.webm");
formData.append("patient_name", patientName);
formData.append("patient_consent_flag", String(consent));

const res = await apiUpload("/consultations/upload", formData);
```

---

### 15.10 Regras de Integração (Obrigatórias)

1. **Toda requisição autenticada** deve enviar `Authorization: Bearer <token>` via `apiFetch`.
2. **Token expirado** (verificar `exp` no payload JWT) → redirecionar para `/login` antes da chamada.
3. **Nunca hardcodar URLs** — sempre usar `process.env.NEXT_PUBLIC_API_URL`.
4. **Nunca exibir `password_hash`** — o backend já garante isso, mas nenhum campo de senha deve ser logado ou exibido.
5. **Erros da API** devem ser traduzidos para mensagens em pt-BR antes de exibir ao usuário.
6. **Loading states** obrigatórios em qualquer chamada — desabilitar botões durante fetch.
7. **Dados sensíveis** (transcrições médicas) não devem ser armazenados em localStorage — apenas exibir em memória.
8. **Polling** deve ser cancelado com `clearInterval` no cleanup do `useEffect` (`return () => clearInterval(poll)`).

---

### 15.11 Estrutura de Arquivos Frontend — Estado Atual Real

```
apps/web/
├── app/
│   ├── layout.tsx                        → Layout raiz (Geist, globals.css)
│   ├── globals.css                       → Tokens do design system InterHealth
│   ├── page.tsx                          → ✅ Landing page pública (Navbar, Hero, Features, Pricing, Compliance, CTA, Footer)
│   ├── not-found.tsx                     → ✅ 404 adaptativo (com/sem sidebar) — logo usa miniLogoInterHealth.png
│   ├── login/page.tsx                    → ✅ Conectado à API, usa saveToken()
│   ├── cadastro/page.tsx                 → ✅ Conectado à API, usa saveToken()
│   └── dashboard/
│       ├── layout.tsx                    → Sidebar + main (auth guard via middleware.ts)
│       ├── page.tsx                      → ❌ Mock — aguarda GET /consultations e GET /users/me
│       ├── pacientes/page.tsx            → ❌ Mock — aguarda GET /consultations
│       └── nova-consulta/page.tsx        → ❌ Mock — aguarda POST /consultations/upload
├── components/
│   ├── ui/
│   │   ├── Avatar.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Icon.tsx
│   │   ├── LiveDot.tsx
│   │   └── Pill.tsx
│   └── layout/
│       └── Sidebar.tsx                   → ✅ Botão CTA "+ Nova consulta" (antes do Dashboard), nav, "Sair da conta" → /
├── lib/
│   ├── api.ts                            → ✅ Cliente HTTP centralizado — logout() redireciona para / (era /login)
│   └── types.ts                          → ✅ Tipos TypeScript das respostas da API
├── middleware.ts                         → ✅ Proteção de rotas /dashboard/** via cookie. / NÃO interceptado
└── public/
    ├── miniLogoInterHealth.png           → Logo usada em Sidebar, not-found, landing
    ├── figma-landing-hero.png            → Imagem hero (médico com paciente)
    ├── Análise de dados de saúde.png     → Card Análise Preditiva (landing)
    ├── Interface de prontuário inteligente.png → Card Prontuário Inteligente (landing)
    └── Formas abstratas.png              → Background overlay CTA (landing)
```

---

## 16. Histórico de Mudanças — Sessão de 2026-04-20

### 16.1 Correção do Ambiente de Desenvolvimento (Backend)

**Problema:** O venv estava criado com Python 3.9, que não suporta a sintaxe `X | Y` para unions de tipo (requer Python 3.10+). As dependências pinadas no `requirements.txt` também referenciavam `anyio==4.13.0`, versão inexistente no PyPI.

**Solução:**
- Venv recriado com **Python 3.12** (`python3.12 -m venv venv`)
- Pacotes ausentes no `requirements.txt` instalados manualmente:
  - `slowapi` — rate limiting
  - `pydantic[email]` — validação de EmailStr
  - `bcrypt` — hashing de senhas
  - `python-jose` — utilitários JWT
  - `passlib` — utilitários de hashing

> ⚠️ **TODO:** O `requirements.txt` está desatualizado e incompleto. Regenerar com `pip freeze > requirements.txt` após confirmar todos os pacotes necessários.

---

### 16.2 Sidebar — Botão "+ Nova consulta"

**Arquivo:** `apps/web/components/layout/Sidebar.tsx`

**O que mudou:**
- Adicionado `useRouter` do `next/navigation`
- Adicionada variável `isNovaConsulta` para detectar rota ativa
- Botão CTA verde "+ Nova consulta" adicionado **antes** do item "Dashboard" na nav
  - Quando na rota `/dashboard/nova-consulta`: exibe estado ativo (fundo `#EAFAF1`, borda e ícone verdes)
  - Quando em outra rota: fundo verde sólido `#2ECC71`, texto branco
  - Integrado com o botão homônimo da página `dashboard/page.tsx` — ambos fazem `router.push("/dashboard/nova-consulta")`
- Botão "Sair da conta" no rodapé:
  - Label atualizado de "Sair" para "Sair da conta"
  - Efeito hover (fundo `#FEF2F2`, borda `#FECACA`)
  - Redireciona para `/` via `logout()` (era `/login`)

---

### 16.3 lib/api.ts — logout() redireciona para landing

**Arquivo:** `apps/web/lib/api.ts`

**O que mudou:**
```typescript
// ANTES:
export function logout() {
  clearAuth();
  window.location.href = "/login";
}

// DEPOIS:
export function logout() {
  clearAuth();
  window.location.href = "/";
}
```

**Motivo:** Ao sair da conta, o médico deve ser levado à landing page (ponto de entrada público do produto), não diretamente ao formulário de login.

---

### 16.4 not-found.tsx — Substituição do SVG `LeafMark`

**Arquivo:** `apps/web/app/not-found.tsx`

**O que mudou:**
- Removido o componente `LeafMark` (SVG gerado manualmente com dois blobs sobrepostos) que não correspondia à identidade visual real da marca
- Adicionado `import Image from "next/image"`
- Substituídas as 3 ocorrências de `<LeafMark size={N} />` por `<Image src="/miniLogoInterHealth.png" ... />`:
  - Card central do 404: `width={68} height={68}`
  - `LandingHeader` (não autenticado): `width={34} height={34}`
  - `LandingFooter` (não autenticado): `width={30} height={30}`

---

### 16.5 Landing Page — app/page.tsx

**Arquivo:** `apps/web/app/page.tsx`

**O que mudou:** Substituído o redirect para `/login` pela landing page completa do produto.

**Estrutura implementada:**

| Componente | Conteúdo |
|---|---|
| `<Navbar>` | Fixo, `z-index: 100`, logo + links Produto/Preços/Empresas + Login + "Começar Agora" (verde) |
| `<Hero>` | Grid 2 colunas: badge "PARA MÉDICOS INDEPENDENTES", H1 com "ao seu Alcance" em verde, subtítulo, CTAs. Lado direito: `figma-landing-hero.png` + floating card "Vitality Chip" (branco, bottom-left) + floating card transcrição (escuro, bottom-right) |
| `<Features>` | Heading + subtítulo à esquerda; 2 cards `#0A1A0F` com pill, título, descrição e imagem: Prontuário Inteligente (`Interface de prontuário inteligente.png`) e Análise Preditiva (`Análise de dados de saúde.png`) |
| `<Pricing>` | 3 colunas: Teste Gratuito (14 Dias, ghost button), Plano Clínico (R$119,90, gradiente verde, badge Popular, button branco), Planos Hospitalar (Sob Consulta, ghost button) |
| `<Compliance>` | Centrado: label "CONFORMIDADE E SEGURANÇA", heading, badge LGPD com ícone shield |
| `<CTA>` | Fundo `#0A1A0F` + `Formas abstratas.png` (opacity 0.25) overlay; heading branco; botões "Começar Teste Grátis" (verde) e "Ver Vídeo Demo" (outline branco) |
| `<Footer>` | Logo + copyright © 2026, links Privacidade/Termos, ícones sociais |

**Imagens utilizadas (em `public/`):**
- `figma-landing-hero.png` — foto do médico com paciente (seção Hero)
- `Interface de prontuário inteligente.png` — screenshot da interface (card Features esquerdo)
- `Análise de dados de saúde.png` — visualização de dados (card Features direito)
- `Formas abstratas.png` — formas abstratas (background overlay CTA)

**Decisões técnicas:**
- Server component puro (sem `"use client"`) — sem hooks, sem estado
- `middleware.ts` não intercepta `/` — o `matcher` cobre apenas `/dashboard/**`, `/login`, `/cadastro`
- Ancora `#produto`, `#precos`, `#empresas` nos links da navbar para scroll futuro
- Constante `C` define container centralizado (`maxWidth: 1200, margin: "0 auto", padding: "0 48px"`) reutilizado em todas as seções
- **Atenção:** o `<Navbar>` inline original foi substituído pelo componente `<PublicNavbar>` (ver seção 17)

---

## 17. Histórico de Mudanças — Sessão de 2026-04-22

### 17.1 Renomeação "Produto" → "Solução" no header

**Arquivos:** `apps/web/app/page.tsx`, `apps/web/app/solucao/page.tsx` (criado)

- Link "Produto" renomeado para "Solução" em todos os headers públicos
- Âncora `#produto` substituída por `#solução` (e depois `href="/solução"` para a nova página)
- Botão "Empresas" removido do header — links ficaram apenas: Solução / Preços

---

### 17.2 Nova Página `/solução` — B2B Enterprise

**Arquivo:** `apps/web/app/solucao/page.tsx` (novo)
**Rewrite:** `apps/web/next.config.ts` (atualizado)

**Por que `solucao` em vez de `solução`:**
Next.js não suporta caracteres Unicode em nomes de pasta para roteamento. A solução foi:
1. Criar a pasta `app/solucao/`
2. Adicionar rewrites no `next.config.ts`:
   ```ts
   { source: "/solu%C3%A7%C3%A3o", destination: "/solucao" },
   { source: "/solução", destination: "/solucao" },
   ```

**Seções da página:**
- Hero com H1 B2B, badge ENTERPRISE, formulário "Agendar uma Demo" (`id="agendar-demo"`)
- Botão "Agendar uma Demo" usa `href="#agendar-demo"` → scroll suave ao formulário
- Imagem hospital com overlay escuro
- Grid 3 cards de arquitetura (Segurança LGPD, Integrações EHR, IA Clínica)
- CTA final com botão âncora ao formulário
- Footer

**Decisões técnicas:**
- Server component puro (sem `"use client"`)
- Usa `<PublicNavbar activePage="solucao">` — link "Solução" exibe underline verde quando ativo
- Constante `C` mantida para reutilização no Footer

---

### 17.3 Componente `PublicNavbar` — Extraído e Componentizado

**Arquivo:** `apps/web/components/layout/PublicNavbar.tsx` (novo)

O `<Navbar>` inline que existia dentro de `app/page.tsx` foi extraído para um componente reutilizável, permitindo que tanto `/` quanto `/solução` usem o mesmo header.

**Props:**
```tsx
interface Props {
  activePage?: "solucao"; // extensível para outras páginas
}
```

**Funcionalidades:**
- Link ativo exibe underline verde (`textDecoration: "underline"`, cor `#2ECC71`) — não mais fundo verde
- `"use client"` com `useState(false)` para controle do menu mobile
- Desktop: `padding: "0 64px"`, `maxWidth: 1200` para evitar que logo/botões fiquem colados nas bordas
- Mobile: hamburger + sidebar (ver 17.4)

---

### 17.4 Responsividade Mobile — PublicNavbar

**Arquivos:** `apps/web/components/layout/PublicNavbar.tsx`, `apps/web/app/globals.css`

**Padrão adotado (crítico):**
> Estilos desktop ficam 100% em `style={{...}}` inline. Overrides mobile ficam em classes CSS com `!important` no media query — nunca substituir estilos inline.

**Classes CSS adicionadas em `globals.css`:**
```css
.pub-nav-links  { display: flex; }
.pub-nav-mobile { display: none !important; }

@media (max-width: 768px) {
  .pub-nav-links  { display: none !important; }   /* esconde nav + ações desktop */
  .pub-nav-mobile { display: flex !important; }    /* mostra hamburger */
  .pub-nav-header { position: relative !important; }
  .pub-nav-logo {
    position: absolute !important;
    left: 50% !important;
    transform: translateX(-50%) !important;  /* logo centralizada no mobile */
  }
}
```

**Classes rsp-* para páginas (landing + solução):**
```css
@media (max-width: 768px) {
  .rsp-c        { padding: 0 20px !important; }
  .rsp-grid     { grid-template-columns: 1fr !important; }
  .rsp-grid-3   { grid-template-columns: 1fr !important; }
  .rsp-hide     { display: none !important; }
  .rsp-h1       { font-size: 36px !important; }
  /* ... outras escalas tipográficas */
}
```

---

### 17.5 Sidebar Mobile — Hamburger à Esquerda, Animação Suave

**Arquivo:** `apps/web/components/layout/PublicNavbar.tsx`

**Posicionamento:**
- Hamburger no lado **esquerdo** (`marginRight: "auto"` no botão)
- Sidebar desliza da **esquerda** (`translateX(-100%)` → `translateX(0)`)

**Padrão "always-rendered overlay" com CSS transitions:**

Abordagem adotada após falha com `@keyframes`:
> CSS `@keyframes` não restarteiam quando o nome da animação muda em elemento já montado. A solução correta é `transition` — renderizar o overlay sempre, controlar visibilidade com `opacity`, `transform` e `pointerEvents`.

```tsx
{/* Overlay — sempre renderizado */}
<div style={{
  position: "fixed", inset: 0, zIndex: 200,
  pointerEvents: open ? "auto" : "none",   // bloqueia cliques quando fechado
}}>
  {/* Backdrop */}
  <div style={{
    opacity: open ? 1 : 0,
    transition: "opacity 280ms ease",
  }} />
  {/* Sidebar */}
  <aside style={{
    transform: open ? "translateX(0)" : "translateX(-100%)",
    transition: "transform 280ms cubic-bezier(0.4, 0, 0.2, 1)",
  }}>
```

**Conteúdo da sidebar:**
- Linha superior: logo + botão fechar (X)
- Links de navegação com estado ativo (fundo `#EAFAF1`, borda esquerda verde)
- Rodapé: botão Login (outline) + botão "Começar Agora" (verde)