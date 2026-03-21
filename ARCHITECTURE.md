# Arquitetura — HyperTraccar

## Visão Geral

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Frontend   │────▶│  Supabase Edge   │────▶│   Traccar    │
│  React SPA   │     │   Functions      │     │   Server     │
└─────────────┘     └──────────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │  Supabase   │
                    │  Database   │
                    └─────────────┘
```

## Frontend

| Tecnologia | Versão | Propósito |
|---|---|---|
| React | 19 | UI Framework |
| Vite | - | Build tool |
| MUI | 7 | Component library |
| MapLibre GL | 5 | Renderização de mapas |
| Redux Toolkit | 2 | Gerenciamento de estado |
| tss-react | 4 | CSS-in-JS (makeStyles) |
| React Router | 7 | Roteamento SPA |

## Estrutura de Diretórios

```
src/
├── admin/              # Painel administrativo
│   └── whatsapp/       # Módulo WhatsApp (connection, alerts, logs)
├── common/
│   ├── attributes/     # Hooks de atributos (device, user, server, etc.)
│   ├── components/     # Componentes compartilhados (BottomMenu, Loader, etc.)
│   ├── notifications/ # Push notifications (manager, events, hook)
│   ├── theme/          # Tema MUI (palette, components, dimensions)
│   └── util/           # Utilitários (formatter, permissions, constants)
├── landing/            # Landing page e onboarding
├── login/              # Autenticação (login, registro, reset)
├── main/               # Página principal (mapa, dispositivos, toolbar)
├── map/                # Camadas e controles do mapa
│   ├── core/           # MapView, mapUtil, preloadImages
│   ├── draw/           # Edição de geofences
│   ├── geocoder/       # Busca de endereços
│   ├── legend/         # Legendas
│   ├── main/           # Câmera, rotas ao vivo, device selecionado
│   ├── notification/   # Notificações no mapa
│   ├── overlay/        # Overlays
│   └── switcher/       # Seletor de estilos de mapa
├── other/              # Páginas auxiliares (replay, geofences, emulator)
├── reports/            # Relatórios (trip, stop, summary, events, etc.)
├── resources/          # Assets estáticos (ícones SVG, sons, traduções l10n)
├── settings/           # Configurações (devices, users, groups, notifications)
├── store/              # Redux slices
└── integrations/
    └── supabase/       # Cliente e tipos Supabase
```

## Estado Global (Redux)

| Slice | Responsabilidade |
|---|---|
| `session` | Usuário logado + config do servidor |
| `devices` | Lista de dispositivos do tenant |
| `events` | Eventos em tempo real |
| `geofences` | Cercas virtuais |
| `groups` | Grupos de dispositivos |
| `drivers` | Motoristas |
| `maintenances` | Manutenções programadas |
| `calendars` | Calendários |
| `motion` | Estado de movimento dos dispositivos |
| `errors` | Erros globais |

## Backend (Supabase Edge Functions)

| Função | JWT | Descrição |
|---|---|---|
| `traccar-proxy` | Não | Proxy para API Traccar com sessão persistente |
| `whatsapp-proxy` | Não | Proxy para API UAZAPI |
| `whatsapp-webhook` | Não | Receptor de webhooks WhatsApp |
| `create-tenant` | Não | Provisiona novo tenant |

## Multi-Tenant

1. `TenantProvider` resolve tenant via `slug` (localStorage) ou `custom_domain`
2. Cada tenant tem `traccar_url` próprio
3. `traccar-proxy` mantém sessão por `(tenant_id, user_email)` em `traccar_sessions`
4. White-label: cores, logo, background configuráveis por tenant

## Mapa

- **MapView**: Componente singleton que inicializa MapLibre GL
- **Controles**: NavigationControl, GeolocateControl, SwitcherControl, WhatsApp button
- **Camadas modulares**: MapPositions, MapRouteCoordinates, MapGeofence, MapAccuracy, MapOverlay, MapLiveRoutes
- **Tema visual**: Glassmorphism com accent teal (#0d9488)

## Última Atualização
2026-03-08
