# API Documentation — HyperTraccar

> Última atualização: 2026-03-08

## Visão Geral

O HyperTraccar utiliza **Supabase Edge Functions** como camada de backend. Todas as funções são servidas em:

```
https://foifugnuaehjtjftpkrk.supabase.co/functions/v1/{function-name}
```

| Função | Autenticação | Propósito |
|---|---|---|
| `traccar-proxy` | Headers customizados | Proxy multi-tenant para API Traccar |
| `whatsapp-proxy` | Bearer JWT (Supabase Auth) | Proxy autenticado para API UAZAPI |
| `whatsapp-webhook` | Nenhuma (público) | Receptor de webhooks WhatsApp |
| `create-tenant` | Nenhuma (público) | Onboarding — criação de tenants |

### Padrão de Resposta

Todas as funções seguem o padrão:

```json
{
  "success": true,
  "data": {},
  "message": "Descrição opcional"
}
```

---

## 1. `traccar-proxy`

Proxy multi-tenant que encaminha requisições para a API Traccar do tenant, gerenciando sessões (`JSESSIONID`) de forma transparente.

### Base URL

```
POST|GET|PUT|DELETE /functions/v1/traccar-proxy?path={traccar-api-path}
```

### Autenticação

Sem JWT. Utiliza headers customizados:

| Header | Obrigatório | Descrição |
|---|---|---|
| `x-tenant-slug` | ✅ | Slug do tenant |
| `x-traccar-email` | ✅ | Email do usuário Traccar (para gerenciamento de sessão) |

### Parâmetros

| Query Param | Obrigatório | Descrição |
|---|---|---|
| `path` | ✅ | Caminho da API Traccar (ex: `/api/devices`, `/api/session`) |
| Outros params | ❌ | Repassados diretamente para a API Traccar |

### Validações

- **Subscription**: Bloqueia tenants com `subscription_status` = `suspended` ou `cancelled` (HTTP 403)
- **Sessão expirada**: Se Traccar retorna 401, a sessão armazenada é deletada automaticamente

---

### 1.1 Login — `POST /api/session`

Autentica no Traccar e armazena a sessão.

**Request:**
```http
POST /functions/v1/traccar-proxy?path=/api/session
Content-Type: application/x-www-form-urlencoded
x-tenant-slug: minha-empresa
x-traccar-email: admin@empresa.com

email=admin@empresa.com&password=senha123
```

**Response (200):**
```json
{
  "id": 1,
  "name": "Admin",
  "email": "admin@empresa.com",
  "administrator": true
}
```

**Headers de resposta:**
| Header | Descrição |
|---|---|
| `x-traccar-session` | JSESSIONID armazenado (para referência do cliente) |

**Efeito colateral:** Sessão salva na tabela `traccar_sessions` com expiração de 24h.

---

### 1.2 Logout — `DELETE /api/session`

Encerra sessão no Traccar e limpa o registro armazenado.

**Request:**
```http
DELETE /functions/v1/traccar-proxy?path=/api/session
x-tenant-slug: minha-empresa
x-traccar-email: admin@empresa.com
```

**Response (200):**
```json
{ "success": true }
```

---

### 1.3 Proxy Genérico — Qualquer rota `/api/*`

Todas as demais requisições são encaminhadas ao Traccar usando a sessão armazenada.

**Request:**
```http
GET /functions/v1/traccar-proxy?path=/api/devices
x-tenant-slug: minha-empresa
x-traccar-email: admin@empresa.com
```

**Response:** Repassa o status code e body da API Traccar diretamente.

### Códigos de Erro

| Status | Motivo |
|---|---|
| 400 | `path` ausente ou `x-tenant-slug` ausente |
| 403 | Subscription inativa (`suspended`/`cancelled`) |
| 401 | Sessão expirada (auto-limpeza executada) |
| 500 | Erro interno do proxy |

---

## 2. `whatsapp-proxy`

Proxy autenticado para a API UAZAPI (WhatsApp Business). Resolve o tenant automaticamente pelo `user_id` do JWT.

### Base URL

```
GET|POST /functions/v1/whatsapp-proxy?action={action}
```

### Autenticação

```http
Authorization: Bearer {supabase-jwt-token}
```

O JWT é validado via `supabase.auth.getUser()`. O `user_id` é usado para resolver o tenant na tabela `tenants`.

### Secrets Necessários

| Secret | Descrição |
|---|---|
| `UAZAPI_BASE_URL` | URL base da API UAZAPI |
| `UAZAPI_ADMIN_TOKEN` | Token admin para criação de instâncias |

---

### 2.1 `create-instance` — Criar instância WhatsApp

Cria uma instância UAZAPI para o tenant. Se já existir, retorna a existente.

**Request:**
```http
POST /functions/v1/whatsapp-proxy?action=create-instance
Authorization: Bearer {token}
Content-Type: application/json

{}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "instance_id": "tenant-abc12345",
    "status": "disconnected"
  }
}
```

**Efeito colateral:** Registro criado/atualizado em `whatsapp_instances`.

---

### 2.2 `connect` / `qrcode` — Status de conexão + QR Code

Consulta o estado da conexão WhatsApp. Retorna QR Code se desconectado.

**Request:**
```http
GET /functions/v1/whatsapp-proxy?action=connect
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "disconnected",
    "qrCode": "data:image/png;base64,...",
    "phoneNumber": null,
    "instance_id": "tenant-abc12345"
  }
}
```

| Campo | Tipo | Descrição |
|---|---|---|
| `status` | string | `connected`, `disconnected`, `connecting` |
| `qrCode` | string\|null | Base64 do QR Code (quando desconectado) |
| `phoneNumber` | string\|null | Número conectado |

**Efeito colateral:** Status atualizado em `whatsapp_instances`.

---

### 2.3 `disconnect` — Desconectar WhatsApp

Desconecta a instância do WhatsApp.

**Request:**
```http
POST /functions/v1/whatsapp-proxy?action=disconnect
Authorization: Bearer {token}
Content-Type: application/json

{}
```

**Response (200):**
```json
{
  "success": true,
  "data": { "status": "disconnected" }
}
```

**Efeito colateral:** `phone_number` limpo e `status` = `disconnected` em `whatsapp_instances`.

---

### 2.4 `send-text` — Enviar mensagem de texto

Envia uma mensagem via WhatsApp.

**Request:**
```http
POST /functions/v1/whatsapp-proxy?action=send-text
Authorization: Bearer {token}
Content-Type: application/json

{
  "phone": "5511999999999",
  "message": "Olá, seu veículo foi movido!",
  "messageType": "manual"
}
```

| Campo | Obrigatório | Descrição |
|---|---|---|
| `phone` | ✅ | Número com código do país |
| `message` | ✅ | Conteúdo da mensagem |
| `messageType` | ❌ | Tipo para log (`manual`, `alert`, etc.) Default: `manual` |

**Response (200):**
```json
{
  "success": true,
  "data": { "messageId": "..." }
}
```

**Efeito colateral:** Mensagem registrada em `whatsapp_message_log`.

---

### 2.5 `get-alerts` — Listar configurações de alerta

Retorna todas as configurações de alerta do tenant.

**Request:**
```http
GET /functions/v1/whatsapp-proxy?action=get-alerts
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "alert_type": "deviceMoving",
      "enabled": true,
      "template_message": "🚨 {device} em movimento às {time}",
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

### 2.6 `save-alerts` — Salvar configurações de alerta

Salva (upsert) configurações de alertas.

**Request:**
```http
POST /functions/v1/whatsapp-proxy?action=save-alerts
Authorization: Bearer {token}
Content-Type: application/json

{
  "alerts": [
    {
      "alert_type": "deviceMoving",
      "enabled": true,
      "template_message": "🚨 {device} em movimento às {time}"
    },
    {
      "alert_type": "deviceStopped",
      "enabled": false,
      "template_message": "⏹️ {device} parado desde {time}"
    }
  ]
}
```

**Response (200):**
```json
{ "success": true, "message": "Alerts saved" }
```

**Efeito colateral:** Upsert na tabela `whatsapp_alert_configs` (conflict em `tenant_id,alert_type`).

---

### 2.7 `get-messages` — Histórico de mensagens

Retorna o log de mensagens enviadas.

**Request:**
```http
GET /functions/v1/whatsapp-proxy?action=get-messages&limit=50
Authorization: Bearer {token}
```

| Query Param | Obrigatório | Default | Descrição |
|---|---|---|---|
| `limit` | ❌ | `50` | Número máximo de mensagens |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "recipient_phone": "5511999999999",
      "message_type": "alert",
      "message_content": "🚨 Veículo XYZ em movimento",
      "status": "sent",
      "error_message": null,
      "created_at": "2026-03-08T10:00:00Z"
    }
  ]
}
```

---

### 2.8 `set-webhook` — Configurar webhook UAZAPI

Configura a URL de webhook na instância UAZAPI.

**Request:**
```http
POST /functions/v1/whatsapp-proxy?action=set-webhook
Authorization: Bearer {token}
Content-Type: application/json

{
  "webhookUrl": "https://foifugnuaehjtjftpkrk.supabase.co/functions/v1/whatsapp-webhook?action=delivery-receipt"
}
```

**Response (200):**
```json
{ "success": true, "data": { ... } }
```

### Códigos de Erro (whatsapp-proxy)

| Status | Motivo |
|---|---|
| 400 | Action desconhecida, instância não encontrada, ou campos obrigatórios ausentes |
| 401 | JWT inválido ou ausente |
| 403 | Tenant não encontrado para o `user_id` |
| 500 | UAZAPI não configurado ou erro interno |

---

## 3. `whatsapp-webhook`

Endpoint público para receber webhooks. Processa eventos Traccar e os transforma em alertas WhatsApp.

### Base URL

```
POST /functions/v1/whatsapp-webhook?action={action}
```

### Autenticação

Nenhuma — endpoint público. **Não expõe dados sensíveis.**

---

### 3.1 `process-event` — Processar evento Traccar

Recebe um evento do Traccar e, se configurado, envia alerta via WhatsApp.

**Request:**
```http
POST /functions/v1/whatsapp-webhook?action=process-event
Content-Type: application/json

{
  "tenantId": "uuid-do-tenant",
  "eventType": "deviceMoving",
  "deviceName": "Veículo ABC",
  "eventTime": "08/03/2026 14:30",
  "phone": "5511999999999",
  "extraData": "Velocidade: 80 km/h"
}
```

| Campo | Obrigatório | Descrição |
|---|---|---|
| `tenantId` | ✅ | UUID do tenant |
| `eventType` | ✅ | Tipo do evento Traccar |
| `phone` | ✅ | Número destinatário |
| `deviceName` | ❌ | Nome do dispositivo |
| `eventTime` | ❌ | Horário do evento (default: `now()`) |
| `extraData` | ❌ | Dados adicionais |

**Template Variables:**

| Variável | Substituição |
|---|---|
| `{device}` | `deviceName` ou `"Desconhecido"` |
| `{event}` | `eventType` |
| `{time}` | `eventTime` ou timestamp atual |
| `{data}` | `extraData` ou vazio |

**Response — alerta enviado (200):**
```json
{ "success": true, "sent": true, "data": { "messageId": "..." } }
```

**Response — alerta não habilitado (200):**
```json
{ "success": true, "sent": false, "message": "Alert not enabled for this type" }
```

**Fluxo interno:**
1. Verifica se alerta está habilitado em `whatsapp_alert_configs` (tenant + tipo + enabled)
2. Busca instância WhatsApp conectada em `whatsapp_instances`
3. Aplica template variables na mensagem
4. Envia via UAZAPI
5. Registra em `whatsapp_message_log`

---

### 3.2 `delivery-receipt` — Recibo de entrega

Recebe notificações de status de entrega da UAZAPI.

**Request:**
```http
POST /functions/v1/whatsapp-webhook?action=delivery-receipt
Content-Type: application/json

{
  "messageId": "msg-id-123",
  "status": "delivered"
}
```

**Response (200):**
```json
{ "success": true }
```

> **Nota:** Atualmente apenas loga no console. Implementação de atualização de status no `whatsapp_message_log` pendente.

### Códigos de Erro (whatsapp-webhook)

| Status | Motivo |
|---|---|
| 400 | Campos obrigatórios ausentes, instância não conectada, ou action desconhecida |
| 500 | Erro interno |

---

## 4. `create-tenant`

Endpoint público de onboarding. Cria um novo tenant com usuário Supabase Auth e período trial.

### Base URL

```
POST /functions/v1/create-tenant
```

### Autenticação

Nenhuma — endpoint público.

### Request

```http
POST /functions/v1/create-tenant
Content-Type: application/json

{
  "company_name": "Transportes XYZ",
  "owner_email": "admin@xyz.com",
  "password": "senha-segura-123",
  "traccar_url": "https://traccar.xyz.com",
  "color_primary": "#1a73e8",
  "color_secondary": "#ffffff"
}
```

| Campo | Obrigatório | Default | Descrição |
|---|---|---|---|
| `company_name` | ✅ | — | Nome da empresa |
| `owner_email` | ✅ | — | Email do proprietário (validado via regex) |
| `password` | ✅ | — | Senha do usuário |
| `traccar_url` | ❌ | `https://pending-setup.example.com` | URL do servidor Traccar |
| `color_primary` | ❌ | `#1a73e8` | Cor primária do tema |
| `color_secondary` | ❌ | `#ffffff` | Cor secundária do tema |

### Response — Sucesso (201)

```json
{
  "success": true,
  "message": "Conta criada com sucesso!",
  "data": {
    "slug": "transportes-xyz",
    "company_name": "Transportes XYZ",
    "trial_ends_at": "2026-03-15T00:00:00.000Z"
  }
}
```

### Fluxo Interno

1. Valida campos obrigatórios e formato de email
2. Verifica duplicidade por `owner_email` na tabela `tenants`
3. Cria usuário no Supabase Auth (`email_confirm: true`)
4. Gera slug a partir do `company_name` (normalizado, sem acentos)
5. Verifica duplicidade de slug (adiciona sufixo se necessário)
6. Cria registro em `tenants` com `subscription_status: trial` e `plan_type: basic`
7. Trial de **7 dias**
8. **Rollback:** Se criação do tenant falhar, deleta o usuário Auth criado

### Códigos de Erro

| Status | Motivo |
|---|---|
| 400 | Campos obrigatórios ausentes, email inválido, ou erro Auth |
| 405 | Método não permitido (apenas POST) |
| 409 | Email já cadastrado |
| 500 | Erro interno (com rollback de Auth user) |

---

## Configuração CORS

Todas as funções incluem headers CORS:

```json
{
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, ...",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS"
}
```

Todas respondem `200` para `OPTIONS` (preflight).

---

## Tabelas Envolvidas

| Tabela | Funções que utilizam |
|---|---|
| `tenants` | `traccar-proxy`, `whatsapp-proxy`, `create-tenant` |
| `traccar_sessions` | `traccar-proxy` |
| `whatsapp_instances` | `whatsapp-proxy`, `whatsapp-webhook` |
| `whatsapp_alert_configs` | `whatsapp-proxy`, `whatsapp-webhook` |
| `whatsapp_message_log` | `whatsapp-proxy`, `whatsapp-webhook` |
