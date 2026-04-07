# Contexto do Projeto — InterHealth

Você está no repositório Inter-health/mvp-interHealth, um monorepo com a seguinte estrutura:

interhealth/
├── apps/
│   ├── web/        → Next.js 14 + TypeScript + Tailwind (frontend)
│   └── api/        → FastAPI (Python) — você trabalha aqui
├── packages/
│   ├── ai/         → WhisperX / prompts Claude
│   ├── ehr/        → adaptadores iClinic / Feegow
│   └── types/      → tipos TypeScript compartilhados

## Stack do backend (apps/api)
- FastAPI (Python)
- Supabase (PostgreSQL) hospedado na região São Paulo
- RLS (Row Level Security) ativado no banco
- Criptografia AES-256 via Python Fernet (IV armazenado junto ao dado)
- Deploy: Render free tier

## Schema da tabela users (já existente no Supabase):
- id (UUID, PK)
- name (text)
- crm (text)
- email (text, unique)
- specialty (text)
- ehrProvider (text)
- terms_accepted (boolean)

## Arquitetura em camadas obrigatória:
router → service → repository

Cada camada em arquivo separado. Nenhuma lógica de negócio no router. Nenhum acesso direto ao banco no service.

---

# Tarefa: Implementar criação de usuário com regras de negócio (SCRUM-22 + SCRUM-23 + SCRUM-11)

## User Story de referência (PI-3 — US01):
"Como médico, QUERO realizar login seguro PARA acessar os dados."

## O que implementar:

### 1. Endpoint (SCRUM-22)
- POST /users
- Body: name, crm, email, password, specialty, ehrProvider, terms_accepted
- Retorna HTTP 201 Created com os dados do usuário criado (sem expor a senha)

### 2. Regra de negócio — duplicidade de e-mail (SCRUM-23)
- Antes de inserir, verificar se já existe um usuário com o mesmo email
- Se existir: retornar HTTP 409 Conflict com mensagem: "E-mail já cadastrado."

### 3. Regras de negócio — senha LGPD (SCRUM-11 + RN1 + RN2 da US01)
- Validar que a senha contém: mínimo 8 caracteres, letra maiúscula, letra minúscula, número e caractere especial
- Se inválida: retornar HTTP 422 Unprocessable Entity com detalhes do critério não atendido
- Armazenar usando *bcrypt com salt* (nunca plain text, nunca reversível)
- RNF3: dados sensíveis criptografados em repouso

### 4. Requisitos não-funcionais obrigatórios
- RNF1: API deve operar exclusivamente via HTTPS
- RNF2: Após criação, o sistema deve emitir um *JWT com expiração de 12 horas* para a sessão do usuário recém-criado
- RN3 (para implementar junto ao login, mas já preparar a estrutura): bloqueio após 5 tentativas incorretas consecutivas

## Critérios de aceite:
- [ ] POST /users com dados válidos retorna 201 e JWT
- [ ] POST /users com e-mail duplicado retorna 409
- [ ] POST /users com senha fraca retorna 422 com detalhe do critério violado
- [ ] Senha nunca é armazenada em plain text no banco
- [ ] Código segue estritamente router → service → repository
- [ ] Nenhum dado sensível exposto no response

## Observação de compliance:
Este produto lida com dados de saúde de pacientes brasileiros. Toda implementação deve estar em conformidade com a *LGPD* (Lei 13.709/2018). O Supabase está configurado na região São Paulo para garantir residência de dados no Brasil.