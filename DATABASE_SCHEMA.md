# Database Schema — HyperTraccar (Supabase)

## Tabelas

### `tenants`
Configuração principal de cada tenant.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid (PK) | ID do tenant |
| `slug` | text (unique) | Slug para URL |
| `company_name` | text | Nome da empresa |
| `traccar_url` | text | URL do servidor Traccar |
| `plan_type` | text | Tipo de plano (default: básico) |
| `subscription_status` | text | Status da assinatura |
| `max_devices` | integer | Limite de dispositivos |
| `owner_email` | text | Email do proprietário |
| `user_id` | uuid | ID do usuário Supabase |
| `logo_url` | text | URL do logo |
| `color_primary` | text | Cor primária (white-label) |
| `color_secondary` | text | Cor secundária |
| `login_bg_color` | text | Cor de fundo do login |
| `login_bg_image` | text | Imagem de fundo do login |
| `login_sidebar_color` | text | Cor da sidebar do login |
| `custom_domain` | text | Domínio customizado |
| `whatsapp_number` | text | Número WhatsApp do tenant |
| `whatsapp_message` | text | Mensagem padrão WhatsApp |
| `trial_ends_at` | timestamptz | Fim do período trial |
| `created_at` | timestamptz | Criação |
| `updated_at` | timestamptz | Última atualização |

### `traccar_sessions`
Sessões proxy entre Supabase e Traccar.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid (PK) | ID da sessão |
| `tenant_id` | uuid (FK → tenants) | Tenant |
| `user_email` | text | Email do usuário Traccar |
| `session_cookie` | text | Cookie de sessão Traccar |
| `traccar_user_id` | integer | ID do usuário no Traccar |
| `expires_at` | timestamptz | Expiração |
| `created_at` | timestamptz | Criação |

### `pwa_installations`
Tracking de instalações PWA.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid (PK) | ID |
| `tenant_id` | uuid (FK → tenants) | Tenant |
| `installed_at` | timestamptz | Data da instalação |
| `user_agent` | text | User agent do navegador |
| `created_at` | timestamptz | Criação |

### `whatsapp_instances`
Instâncias WhatsApp (UAZAPI) por tenant. Relação 1:1 com tenants.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid (PK) | ID |
| `tenant_id` | uuid (FK → tenants, unique) | Tenant |
| `uazapi_instance_id` | text | ID da instância UAZAPI |
| `uazapi_token` | text | Token de autenticação UAZAPI |
| `phone_number` | text | Número conectado |
| `status` | text | Status da conexão |
| `created_at` | timestamptz | Criação |
| `updated_at` | timestamptz | Atualização |

### `whatsapp_alert_configs`
Configurações de alertas WhatsApp por tenant.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid (PK) | ID |
| `tenant_id` | uuid (FK → tenants) | Tenant |
| `alert_type` | text | Tipo do alerta (ex: ignition, geofence) |
| `enabled` | boolean | Ativo/inativo |
| `template_message` | text | Template da mensagem |
| `created_at` | timestamptz | Criação |
| `updated_at` | timestamptz | Atualização |

### `whatsapp_device_alert_prefs`
Preferências de alerta por dispositivo/usuário.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid (PK) | ID |
| `tenant_id` | uuid (FK → tenants) | Tenant |
| `device_id` | integer | ID do dispositivo Traccar |
| `user_email` | text | Email do usuário |
| `alert_type` | text | Tipo do alerta |
| `enabled` | boolean | Ativo/inativo |
| `created_at` | timestamptz | Criação |
| `updated_at` | timestamptz | Atualização |

### `whatsapp_message_log`
Log de todas as mensagens WhatsApp enviadas.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid (PK) | ID |
| `tenant_id` | uuid (FK → tenants) | Tenant |
| `recipient_phone` | text | Telefone do destinatário |
| `message_content` | text | Conteúdo da mensagem |
| `message_type` | text | Tipo (manual, alert, etc.) |
| `status` | text | Status (sent, failed, etc.) |
| `error_message` | text | Mensagem de erro (se houver) |
| `created_at` | timestamptz | Criação |

## Relacionamentos

```
tenants (1) ──── (N) traccar_sessions
tenants (1) ──── (1) whatsapp_instances
tenants (1) ──── (N) whatsapp_alert_configs
tenants (1) ──── (N) whatsapp_device_alert_prefs
tenants (1) ──── (N) whatsapp_message_log
tenants (1) ──── (N) pwa_installations
```

## Última Atualização
2026-03-08
