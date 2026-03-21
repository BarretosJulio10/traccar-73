# AI Memory — HyperTraccar

## Projeto
**HyperTraccar** — Plataforma SaaS multi-tenant de rastreamento veicular baseada no Traccar.

## Stack
- **Frontend**: React 19 + Vite + MUI 7 + MapLibre GL + Redux Toolkit + tss-react
- **Backend**: Supabase Edge Functions (proxy para Traccar API)
- **Mapa**: MapLibre GL com controles customizados (glassmorphism/teal theme)
- **Integrações**: WhatsApp via UAZAPI, PWA com tracking de instalações

## Multi-Tenant
- Cada tenant possui: slug, traccar_url, cores, logo, plano, WhatsApp
- `TenantProvider` resolve tenant por slug ou domínio customizado
- Isolamento via `tenant_id` em todas as tabelas Supabase

## Edge Functions
| Função | Propósito |
|---|---|
| `traccar-proxy` | Proxy autenticado para API Traccar |
| `whatsapp-proxy` | Proxy para API UAZAPI (WhatsApp) |
| `whatsapp-webhook` | Webhook receptor de mensagens WhatsApp |
| `create-tenant` | Criação de novos tenants |

## Estado (Redux)
Slices: `devices`, `session`, `events`, `geofences`, `groups`, `drivers`, `maintenances`, `calendars`, `motion`, `errors`

## Rotas Principais
- `/` — Landing page
- `/login` — Login (proxy Traccar)
- `/app/*` — App principal (mapa, dispositivos, relatórios, settings)
- `/admin/*` — Painel administrativo (WhatsApp, dashboard)

## Decisões Recentes
- Controles do mapa usam tema teal + glassmorphism
- Geofences page tem MapView próprio — não usa MainMap de background
- Demo mode normaliza categoria `pickup` → `car`
- Push notifications nativas via Web Notifications API (modular: notificationManager, notificationEvents, useNotifications)
- Página `/install` para instalação PWA + solicitação de permissões (Notification, Geolocation, Camera)
- Hooks modulares: `usePwaInstallPrompt`, `useDevicePermissions`, `usePwaInstallTracker`
- `usePwaInstallPrompt` refatorado com `useMemo` — detecta iOS (incl. iPadOS 13+), Android, Samsung, Firefox, Edge
- `useGeofenceAlerts` — alertas sonoros (Web Audio API) + Web Notification para geocercas em tempo real
- PWA manifest: ícones separados `any`/`maskable`, `scope`, `id`, `lang: pt-BR`, `screenshots`
- SW: `registerType: autoUpdate`, `skipWaiting`, `clientsClaim`, `cleanupOutdatedCaches`
- Chave Supabase removida do código — exclusivamente via `import.meta.env`
- Security headers em `vercel.json`: CSP, HSTS, X-Frame-Options, Permissions-Policy

## Última Atualização
2026-03-21
