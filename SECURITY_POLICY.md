# Security Policy — HyperTraccar

## Autenticação

### Fluxo de Login
1. Usuário envia credenciais (email/senha) ao frontend
2. Frontend chama `traccar-proxy` Edge Function com action `POST /api/session`
3. Edge Function autentica no Traccar server do tenant
4. Cookie de sessão Traccar armazenado em `traccar_sessions` (Supabase)
5. Requisições subsequentes usam sessão persistida

### Sessões
- Sessões armazenadas em `traccar_sessions` com `expires_at`
- Cada sessão vinculada a `(tenant_id, user_email)`
- Sessão expirada = reautenticação necessária

## Autorização

### Multi-Tenant Isolation
- **Todas** as tabelas possuem `tenant_id`
- Row Level Security (RLS) habilitado no Supabase
- Tenant resolvido por `slug` (localStorage) ou `custom_domain`
- Edge Functions validam `tenant_id` em todas as operações

### Papéis (Traccar)
- Administrador: acesso total dentro do tenant
- Usuário: acesso restrito aos dispositivos atribuídos
- Papéis gerenciados pelo Traccar server, não pelo Supabase

## Proteção de Dados

### Dados Sensíveis
| Dado | Armazenamento | Proteção |
|---|---|---|
| Senha do usuário | Traccar server | Hash (bcrypt) pelo Traccar |
| Token UAZAPI | `whatsapp_instances.uazapi_token` | RLS + acesso apenas via Edge Functions |
| Cookie Traccar | `traccar_sessions.session_cookie` | RLS + expiração |
| Chaves de API | Supabase Secrets | Não expostas no frontend |

### Chaves no Frontend
- Apenas chaves **públicas/anon** do Supabase no código
- Chaves privadas em Supabase Secrets (acessíveis apenas por Edge Functions)

## Edge Functions

### Segurança
- `verify_jwt = false` em todas as functions (autenticação customizada via Traccar)
- Validação de `tenant_id` em cada requisição
- Headers customizados: `x-tenant-slug`, `x-traccar-email`

### Proxy Pattern
- Frontend **nunca** se comunica diretamente com Traccar ou UAZAPI
- Todas as chamadas passam por Edge Functions
- Edge Functions adicionam credenciais/tokens antes de encaminhar

## LGPD

### Princípios Implementados
- **Minimização**: Apenas dados necessários são coletados
- **Isolamento**: Dados de cada tenant completamente separados
- **Logs**: `whatsapp_message_log` registra comunicações com clientes

### Pendências
- [ ] Endpoint de exportação de dados do usuário
- [ ] Endpoint de exclusão de dados (direito ao esquecimento)
- [ ] Registro de consentimento explícito
- [ ] Política de retenção de dados

## Vulnerabilidades Conhecidas

### Baixo Risco
- Edge Functions com `verify_jwt = false` — mitigado por autenticação Traccar
- Sem rate limiting nas Edge Functions — risco de abuso

### Recomendações
- Implementar rate limiting nas Edge Functions
- Adicionar audit log para ações administrativas
- Implementar rotação de tokens UAZAPI
- Adicionar 2FA para administradores

## Última Atualização
2026-03-08
