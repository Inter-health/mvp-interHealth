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
