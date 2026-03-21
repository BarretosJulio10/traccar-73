# Deploy Guide — HyperTraccar

> Última atualização: 2026-03-08

## Visão Geral

O HyperTraccar é composto por:

| Componente | Tecnologia | Hospedagem |
|---|---|---|
| Frontend | React 19 + Vite + MUI 7 | Lovable (lovable.app) |
| Backend | Supabase Edge Functions | Supabase Cloud |
| Banco de Dados | PostgreSQL | Supabase Cloud |
| Storage | Supabase Storage | Supabase Cloud |
| Rastreamento | Traccar Server | Servidor próprio do tenant |
| WhatsApp | UAZAPI | Servidor próprio ou cloud |

---

## 1. Pré-requisitos

- Conta no [Lovable](https://lovable.dev)
- Projeto Supabase conectado (ID: `foifugnuaehjtjftpkrk`)
- Servidor Traccar configurado e acessível via HTTPS
- (Opcional) Instância UAZAPI para integração WhatsApp

---

## 2. Variáveis de Ambiente

### 2.1 Frontend (`.env` — auto-populado pelo Lovable)

| Variável | Descrição | Exemplo |
|---|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | `https://foifugnuaehjtjftpkrk.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon key do Supabase | `eyJhbGciOi...` |
| `VITE_SUPABASE_PROJECT_ID` | ID do projeto Supabase | `foifugnuaehjtjftpkrk` |

> **Nota:** O arquivo `.env` é gerenciado automaticamente pelo Lovable. Não editar manualmente.

### 2.2 Supabase Secrets (Edge Functions)

Configurados em **Supabase Dashboard > Settings > Edge Functions > Secrets**.

| Secret | Obrigatório | Descrição |
|---|---|---|
| `SUPABASE_URL` | ✅ (auto) | URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | ✅ (auto) | Chave anônima |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ (auto) | Chave de serviço (nunca expor no frontend) |
| `SUPABASE_DB_URL` | ✅ (auto) | URL de conexão do banco |
| `UAZAPI_BASE_URL` | ⚠️ WhatsApp | URL base da API UAZAPI |
| `UAZAPI_ADMIN_TOKEN` | ⚠️ WhatsApp | Token admin da UAZAPI |

> Secrets marcados como **(auto)** são provisionados automaticamente pelo Supabase.  
> Secrets marcados como **⚠️ WhatsApp** são necessários apenas se a integração WhatsApp estiver habilitada.

---

## 3. Banco de Dados

### 3.1 Tabelas

O schema completo está documentado em [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md).

| Tabela | Propósito |
|---|---|
| `tenants` | Dados dos tenants (empresa, URL Traccar, plano, cores) |
| `traccar_sessions` | Cache de sessões JSESSIONID do Traccar |
| `pwa_installations` | Tracking de instalações PWA |
| `whatsapp_instances` | Instâncias WhatsApp (UAZAPI) por tenant |
| `whatsapp_alert_configs` | Configurações de alertas WhatsApp |
| `whatsapp_device_alert_prefs` | Preferências de alerta por dispositivo |
| `whatsapp_message_log` | Log de mensagens enviadas |

### 3.2 Migrations

As migrations ficam em `supabase/migrations/` e são executadas automaticamente pelo Lovable ao publicar.

> **⚠️ Importante:** Nunca edite o arquivo `src/integrations/supabase/types.ts` manualmente. Ele é gerado automaticamente a partir do schema do banco.

### 3.3 RLS (Row Level Security)

- RLS está habilitado automaticamente em todas as tabelas via trigger `rls_auto_enable`
- Cada tabela deve ter políticas RLS adequadas para isolamento multi-tenant
- Consulte [`SECURITY_POLICY.md`](./SECURITY_POLICY.md) para detalhes

### 3.4 Storage

| Bucket | Público | Propósito |
|---|---|---|
| `logos` | ✅ | Logos dos tenants |

---

## 4. Edge Functions

### 4.1 Configuração

O arquivo `supabase/config.toml` define as funções e suas configurações:

```toml
[functions.traccar-proxy]
verify_jwt = false

[functions.create-tenant]
verify_jwt = false

[functions.whatsapp-proxy]
verify_jwt = false

[functions.whatsapp-webhook]
verify_jwt = false
```

> **Nota:** `verify_jwt = false` é intencional. A validação JWT é feita em código (via `getUser()` / `getClaims()`) nas funções que requerem autenticação. Funções públicas (`create-tenant`, `whatsapp-webhook`) não validam JWT.

### 4.2 Deploy

As Edge Functions são deployadas automaticamente pelo Lovable ao salvar alterações nos arquivos em `supabase/functions/`.

### 4.3 Funções Disponíveis

| Função | Arquivo | Documentação |
|---|---|---|
| `traccar-proxy` | `supabase/functions/traccar-proxy/index.ts` | [API_DOCS.md#1](./API_DOCS.md) |
| `whatsapp-proxy` | `supabase/functions/whatsapp-proxy/index.ts` | [API_DOCS.md#2](./API_DOCS.md) |
| `whatsapp-webhook` | `supabase/functions/whatsapp-webhook/index.ts` | [API_DOCS.md#3](./API_DOCS.md) |
| `create-tenant` | `supabase/functions/create-tenant/index.ts` | [API_DOCS.md#4](./API_DOCS.md) |

### 4.4 Logs

Acessíveis em: **Supabase Dashboard > Edge Functions > [função] > Logs**

---

## 5. Deploy do Frontend

### 5.1 Via Lovable (Recomendado)

1. Acesse o projeto no Lovable
2. Clique em **Publish** no canto superior direito
3. O deploy é feito automaticamente para `https://hypertraccar.lovable.app`

### 5.2 Domínio Customizado

Para configurar um domínio customizado:

1. No Lovable, acesse **Settings > Custom Domain**
2. Adicione o domínio desejado
3. Configure os registros DNS conforme instruído
4. O sistema de multi-tenant suporta resolução por domínio customizado via campo `custom_domain` na tabela `tenants`

---

## 6. Configuração de Novo Tenant

### 6.1 Via API (Onboarding)

```bash
curl -X POST https://foifugnuaehjtjftpkrk.supabase.co/functions/v1/create-tenant \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Transportes XYZ",
    "owner_email": "admin@xyz.com",
    "password": "senha-segura",
    "traccar_url": "https://traccar.xyz.com",
    "color_primary": "#1a73e8",
    "color_secondary": "#ffffff"
  }'
```

### 6.2 Checklist Pós-Criação

- [ ] Verificar registro na tabela `tenants`
- [ ] Confirmar que o usuário Auth foi criado
- [ ] Testar login via `/{slug}/login`
- [ ] Configurar URL do Traccar (se não fornecida no onboarding)
- [ ] (Opcional) Upload do logo no bucket `logos`
- [ ] (Opcional) Configurar integração WhatsApp

---

## 7. Integração WhatsApp (Opcional)

### 7.1 Pré-requisitos

1. Instância UAZAPI rodando e acessível
2. Secrets configurados: `UAZAPI_BASE_URL` e `UAZAPI_ADMIN_TOKEN`

### 7.2 Setup por Tenant

1. Acessar painel admin (`/admin`)
2. Navegar até aba **WhatsApp**
3. Clicar em **Criar Instância**
4. Escanear QR Code com o WhatsApp
5. Configurar alertas desejados
6. (Opcional) Configurar webhook para recibos de entrega

---

## 8. Monitoramento

| O quê | Onde |
|---|---|
| Logs das Edge Functions | Supabase Dashboard > Edge Functions > Logs |
| Erros de autenticação | Supabase Dashboard > Auth > Users |
| Mensagens WhatsApp | Tabela `whatsapp_message_log` |
| Sessões Traccar | Tabela `traccar_sessions` |
| Instalações PWA | Tabela `pwa_installations` |

---

## 9. Troubleshooting

### Edge Functions retornando 500

1. Verificar logs no Supabase Dashboard
2. Confirmar que todos os secrets estão configurados
3. Se persistir, remover `deno.lock` e redeployar

### Erro 401 no Traccar

1. Sessão pode ter expirado (auto-limpeza em 24h)
2. Verificar se o servidor Traccar está acessível
3. Confirmar credenciais do usuário

### WhatsApp não conecta

1. Verificar se `UAZAPI_BASE_URL` e `UAZAPI_ADMIN_TOKEN` estão configurados
2. Confirmar que a instância UAZAPI está online
3. Tentar desconectar e reconectar (novo QR Code)

### Tenant não encontrado

1. Verificar se o slug está correto na URL
2. Confirmar registro na tabela `tenants`
3. Verificar se `subscription_status` não é `suspended` ou `cancelled`
