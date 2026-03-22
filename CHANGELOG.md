# Changelog — HyperTraccar

Formato: [Semantic Versioning](https://semver.org/)

---

## [0.14.0] — 2026-03-21
 
### Added
- **UI: Rebranding Total "EV Lifestyle" (Phase 9)**
  - **Contexto:** Transformar a interface em uma experiência premium e tecnológica inspirada em EVs (Tesla/Rivian style).
  - **Design System:** Implementada paleta Cyan (#06b6d4) e arredondamento global de **28px** para todos os containers (Card, Paper, Dialog).
  - **Layout:** Sidebar do desktop agora é "floating" com margens de 16px, removendo o visual monolítico antigo.
  - **Componente `SlideAction.jsx`:** Novo slider de segurança "Slide to Unlock" para ações críticas de bloqueio/desbloqueio no HUD.
- **Fix: Restauração da API de Listas Virtuais (EV-Fix-Index-2)**
  - **Contexto:** Crash "Invalid index 0" que persistia na visualização de mapa pelo desktop.
  - **Correção:** Atualizada a implementação em `DeviceList.jsx` para utilizar o padrão da API customizada (`rowCount`, `rowHeight`, `rowComponent`), substituindo as interfaces incompatíveis do `VariableSizeList` original.
- **Fix: Erro de Inicialização "Invalid index 0" (EV-Fix-Index)**
  - **Contexto:** Crash ao carregar a lista de dispositivos pela primeira vez (quando vazia).
  - **Correção:** Adicionado guardião no `DeviceList.jsx` para evitar renderização da lista virtual sem itens.
- **Fix: Erro de Login "ReferenceError: bgImage" (EV-Fix-Login)**
  - **Contexto:** Crash na página de login ao tentar carregar customizações do tenant.
  - **Correção:** Definição correta das variáveis `bgImage` e `bgColor` a partir do Provedor de Tenant.
- **Fix: Erro de Execução "TypeError: Object.values" (EV-Fix-Runtime)**
  - **Contexto:** Crash ao abrir a lista de dispositivos no Vercel.
  - **Correção:** Fornecido `rowProps={{}}` para o componente `List` evitar falha interna na biblioteca.
- **Fix: Erro de Build no Vercel (EV-Fix-Build-2)**
  - **Contexto:** Exportação `VariableSizeList` inexistente na versão customizada do `react-window`.
  - **Correção:** Alterado para usar o componente `List` nativo com suporte a `itemSize` dinâmico.
- **Fix: Erro de Build no Vercel (EV-Fix-Build)**
  - **Contexto:** Importação incorreta do utilitário `catch` no `DeviceRow.jsx`.
  - **Correção:** Caminho ajustado para o `reactHelper.js` consolidado.
- **UI: Correção de Sobreposição no Desktop (EV-Fix)**
  - **Contexto:** A nova Sidebar flutuante estava cobrindo o `MapSideMenu` posicionado à esquerda.
  - **Correção:** O `MapSideMenu` foi movido para `right: 16` e `top: 100`, com visual atualizado para o tema Cyan.
- **Novos Cards de Dispositivos Expansíveis (EV-7)**
  - **ExpandableRow:** `DeviceRow.jsx` agora conta com modo expandido (240px) exibindo telemetria completa.
  - **Controles Integrados:** Inclusão de sliders `SlideAction` de bloqueio/desbloqueio e botão de 'Âncora' diretamente na lista.
  - **Navegação:** Novo atalho 'Seta' para foco instantâneo do veículo no mapa.
- **Header Superior Unificado (EV-8)**
  - **Componente `DesktopHeader.jsx`:** Barra horizontal centralizada a `2px` do topo para Desktop.
  - **Consolidação:** Reúne ações do `BottomMenu` e `MapSideMenu` em um único lugar, otimizando o espaço de trabalho.
  - **Estética:** Glassmorphism com bordas arredondadas e sombra dinâmica.
- **Mobile: Gestos de Swipe no `InnovatorHUD.jsx` (EV-4)**
  - **Contexto:** Melhorar a ergonomia mobile permitindo expansão/colapso via gestos naturais.
  - **Implementação:** Handlers `onTouchStart`/`onTouchEnd` para detecção de deslize vertical. O HUD agora alterna entre 50vh e 85vh suavemente.

### Changed
- **Mapa: Marcadores no estilo "Pill" (EV-5)**
  - **Contexto:** Alinhar os ícones do mapa com a nova linguagem visual arredondada.
  - **Mudança:** `background.svg` alterado de círculo para retângulo arredondado (pill).
  - **Cores:** Todos os veículos agora usam Cyan como cor base de status ativo.
- **HUD: Gauge Circular de Bateria (EV-3)**
  - **Contexto:** Visualização mais intuitiva e moderna do nível de energia.
  - **Implementação:** Novo componente `CircularBattery` baseado em SVG com animação de stroke-dashoffset.
- **Login: Refatoração para Visual "Pure White" (EV-2)**
  - **Contexto:** Criar uma primeira impressão de leveza e tecnologia.
  - **Design:** Inputs arredondados (16px), botões pill, e glassmorphism refinado na barra lateral de boas-vindas.

---


### Added
- **PWA: Smart Install Banner no `LoginPage` (UX-2)**
  - Contexto: Melhorar a taxa de conversão de usuários mobile para o App instalado.
  - Implementação: Banner deslizante no topo da tela com glassmorphism. Detecta mobile e estado de instalação.
  - Funcionalidade: Botão "INSTALAR" para instalação e botão de descarte (X) persistente na sessão.

- **PWA: Fluxo de instalação direta ("One-Click Install") (UX-3)**
  - Contexto: Reduzir fricção e tornar a instalação tão simples quanto um app nativo.
  - Implementação: O botão "INSTALAR" agora solicita permissões de Geolocation e Notification e dispara o prompt nativo do browser imediatamente em dispositivos compatíveis.
  - UX: Remove a necessidade de navegar para a tela de guia em Android/Chrome/Edge.

- **Tracking: Toggle de Rastro em Tempo Real no Mapa (TRACK-3)**
  - Contexto: Usuários solicitaram controle rápido sobre o rastro visual dos veículos sem ir às configurações.
  - Implementação: Botão flutuante no mapa (`MapLiveTrailToggle`) com 3 estados: Desativado, Selecionado (Blue) e Todos (Neon Green).
  - Backend: Utiliza `liveRoutesOverride` no Redux para controle instantâneo.

- **Security: Sistema de Auditoria de Sessão (SEC-3)**
  - Contexto: Necessidade de rastrear acessos e saídas por motivos de segurança e conformidade.
  - Implementação: Nova tabela `audit_logs` no Supabase e utilitário `audit.js`.
  - Eventos: Logins (Sucesso/Demo) e Logouts agora são registrados permanentemente com metadados do cliente.

### Fixed
- **PWA: Correção de erro de runtime `TypeError: o is not a function` na `InstallPage.jsx`**
  - Causa: Tentativa de desestruturar `t` do hook `useLocalization` ao invés do `useTranslation`.
  - Correção: Refatorado para usar os hooks corretos do `LocalizationProvider`.
- **UI: Botão Smart Banner renomeado para "INSTALAR"**
  - O botão de ação no smart banner do `LoginPage` foi renomeado de "OBTER" para "INSTALAR" para maior clareza visual e UX.
- **UI: Restauração do HUD de Detalhes do Veículo no Mobile (UX-4)**
  - Causa: O `StatusCard` (componente mobile de "meia tela") estava ausente nas rotas novas.
  - Correção: Integrado `StatusCard` diretamente no `App.jsx` para usuários mobile.
  - UX: Restaura a visualização de velocidade, bateria, endereço e botões de bloqueio (Vermelho/Verde) no smartphone.
- **UI: Erros de sintaxe JSX no `LoginPage.jsx`**
  - Correção de tags mal fechadas e restauração do conteúdo do botão de login Demo.

---

## [0.13.0] — 2026-03-21

### Fixed
- **PWA: Hotfix para erro de runtime `TypeError: o is not a function`**
  - Contexto: A página `/install` estava crashando em produção (Android/iOS) devido à instabilidade dos componentes `Stepper`/`StepContent` do MUI v7 em ambientes builds.
  - Correção: `InstallPage.jsx` reescrito para usar componentes base (`Box`, `Typography`) simulando visualmente os passos.
  - Adicionado: Proteção (Optional Chaining) no `useTenant` para prevenir crash caso o provider retorne null.

- **PWA: Placeholders não resolvidos em `index.html`**
  - Contexto: `<meta name="theme-color" content="${colorPrimary}">`, `<title>${title}</title>`, `<meta description="${description}">` geravam valores literais no HTML final, quebrando o manifest e a instalabilidade PWA.
  - Correção: Substituidos por valores literais (`#0d9488`, `HyperTraccar - Rastreador GPS`, descrição PT-BR).
  - Adicionadas: `meta name="mobile-web-app-capable"` (Android) e `meta name="apple-mobile-web-app-title"`.
  - Impacto: PWA agora passável no Lighthouse PWA Installability audit.

- **PWA: `purpose: 'any maskable'` combinado violava spec Chrome 93+**
  - Contexto: Chrome 93+ exige entradas separadas para `purpose: 'any'` e `purpose: 'maskable'`. O critério de instalabilidade falhava silenciosamente.
  - Correção: `vite.config.js` atualizado com 4 entradas separadas de ícone.
  - Adicionados: `scope`, `id`, `lang`, `description`, `screenshots`, `categories` ao manifest.
  - SW atualizado: `registerType: autoUpdate`, `skipWaiting: true`, `clientsClaim: true`, `cleanupOutdatedCaches: true`.

- **PWA: Bug em `usePwaInstallPrompt.js` — `isIos()`/`isSafari()` instabilidade**
  - Contexto: Funções eram invocadas inline, recriando valores a cada render sem memoização.
  - Correção: Refatorado para `useMemo` com detecção robusta: iPadOS 13+ (`navigator.maxTouchPoints`), Android, Samsung Browser, Firefox, Edge.
  - Retorno expandido: `isAndroid`, `isSamsungBrowser`, `isFirefox`, `isChrome`, `isEdge`.

### Security
- **Chave Supabase hardcoded removida de `ServerProvider.jsx`**
  - Contexto: A chave anon do Supabase estava exposta literalmente no código-fonte (linha 35), vazável a qualquer usuário com acesso ao repositório.
  - Correção: Removida. Agora usa exclusivamente `import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY`. Se ausente, erro claro é lançado.
  - Impacto de segurança: Elimina vetor de exfiltration de credencial.

- **Security headers adicionados ao `vercel.json`**
  - Headers implementados: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`.
  - CSP configurada para permitir: Supabase (wss + https), Google Fonts, blob: workers (MapLibre), data: images.

### Added
- **`useGeofenceAlerts.js` — Alertas sonoros de geocercas em tempo real**
  - Novo hook que monitora eventos Redux `geofenceEnter`/`geofenceExit`.
  - Emite tom sintetizado via Web Audio API (sem arquivo de áudio externo) + Web Notification nativa.
  - Deduplicado via `Set` com limite de 500 IDs (auto-poda para 250).
  - Integrado no `SocketController.jsx`.

- **`InstallPage.jsx` — UX premium reescrita**
  - Glassmorphism card com backdrop-blur e gradiente adaptativo (dark/light mode).
  - Guias step-by-step para: iOS Safari, Android Chrome, Samsung Browser, Desktop.
  - Detecção correta de plataforma via `usePwaInstallPrompt` refatorado.
  - Animação `Fade` na entrada, botão premium com gradiente teal.
  - Botão "Ir para o App" sempre visível (não bloqueado por `&&`).
  - Impacto: Taxa de instalação esperada aumenta significativamente em mobile.

---

## [0.12.3] — 2026-03-21

### Fixed
- **Login Page 404 em Produção (Routing/ServerProvider)**
  - Contexto: Ao acessar `https://traccar-73.vercel.app/login?tenant=hyper-tracker`, o usuário recebia erro 404.
  - Causa raiz: `/login`, `/register`, `/reset-password`, `/change-server` e `/install` não estavam na lista `PUBLIC_ROUTES` do `ServerProvider.jsx`. Isso fazia com que o app tentasse buscar a API Traccar antes de renderizar o formulário de login, resultando em falha silenciosa e página em branco interpretada como 404 pelo Vercel.
  - Justificativa técnica: Rotas de autenticação devem ser públicas — não dependem de nenhum servidor Traccar configurado.
  - Impacto em banco: Nenhum.
  - Impacto em APIs: Nenhum (o proxy não é mais chamado em rotas de autenticação).
  - Impacto em regras de negócio: A página de login agora carrega corretamente para qualquer tenant, mesmo sem `traccar_url` configurado.

---

## [0.12.2] — 2026-03-21

### Fixed
- **Mobile Rendering: Disappearing Cars (UI/UX)**
  - Context: The `DeviceRow.jsx` rendered nothing on mobile/tablet devices because it lacked a specific mobile layout.
  - Justificativa técnica: Adição de layout responsivo no `DeviceRow.jsx` para garantir que a lista de veículos seja visível em todos os dispositivos (desktop/mobile).
- **Theme Inconsistency: Forced Dark Mode in Settings (UI/Theming)**
  - Context: Multiple settings and report pages had hardcoded dark styles, appearing broken in light mode.
  - Justificativa técnica: Refatoração de diversos componentes (`EditItemView`, `ReportsHubPage`, `PreferencesPage`, etc.) para utilizar o hook `useHudTheme`, permitindo adaptação dinâmica ao tema global.
- **Map Visibility: Obscured Features (Map/UI)**
  - Context: `PwaPageLayout` tinha um background fixo que bloqueava elementos do mapa como Cercas e Heatmaps.
  - Justificativa técnica: Implementação da prop `transparent` no `PwaPageLayout` e refatoração da `GeofencesPage` para permitir visão clara do mapa em background.
- **Demo Mode: Missing Geofences (Functional/Demo)**
  - Context: Funcionalidades de cercas não podiam ser testadas em modo demo.
  - Justificativa técnica: Injeção de `DEMO_GEOFENCES` no `DemoController.jsx` e correção de erro de sintaxe na simulação de movimento.

### Added
- **Global Branding: Logo Integration**
  - Context: Logotipo da empresa ausente em áreas críticas do dashboard.
  - Justificativa técnica: Integração do componente `LogoImage` na `MainToolbar` (mobile), `FleetSidebar` e `DashboardPage` para visibilidade consistente da marca.
- **Innovative Reports Hub (UX/Data)**
  - Context: Demanda por visual inovador e dados reais/demo nos relatórios.
  - Justificativa técnica: Novo layout em grid para o Reports Hub com cabeçalho de estatísticas em tempo real (veículos ativos, movimento e velocidade média).

---

## [0.12.1] — 2026-03-20

### Fixed
- **Loop Infinito de Requisições na API `devices` (Performance/Network)**
  - Contexto: O array de dependências do `useEffect` principal do `SocketController.jsx` continha `pollData`. Durante a inicialização ou a cada polling, a busca de dispositivos alterava o array Redux `devices`, causando recriação do observer de notificações e do `pollData`, gerando chamadas consecutivas infinitas da API.
  - Justificativa técnica: Implementação do padrão `useRef` para armazenar e invocar o `pollData` dentro do `setInterval` sem recriar as subscrições dos React Hooks, quebrando a cascata de recriações. 
  - Impacto em APIs: Redução drástica na sobrecarga do Traccar ocasionada por infinitas chamadas de `GET /api/devices`.
  - Impacto em regras de negócio: O polling volta à cadência original de 5000ms.

- **Deduplicação Falha de Notificações de Evento (Bug Lógico)**
  - Contexto: O limite máximo do Set `processedEventIdsRef` ficava estagnado em 200 itens, sendo truncado para 100. Picos de conexão rodando eventos simultaneamente faziam eventos esquecidos caírem na rede do polling, disparando notificações duplicadas.
  - Justificativa técnica: Aumento do teto seguro de limpeza do buffer de eventos para 5000 para impedir reprocessamento cíclico dos loops em janelas sub-10s.

---

## [0.12.0] — 2026-03-09

### Fixed
- **Botão Modo Demo inoperante (Validação de Termos de Uso)**
  - Contexto: Após o ajuste do `demoMode` via `sessionStorage`, clicar em "Entrar como Cliente Demo" silenciosamente falhava ao renderizar o `/app`. Isso acontecia pois o usuário fake possui `attributes: {}`, o que obrigava o `App.jsx` a abrir o popup de "Aceitar Termos" sem um ID válido.
  - Justificativa técnica: O `App.jsx` foi atualizado para ignorar a condição de aceite de termos caso o estado da sessão seja `demoMode=true`.

- **Crash (ReferenceError: useCallback is not defined)**
  - Contexto: O sistema quebrava ao carregar o `App.jsx` devido à falta da importação do hook `useCallback` do React.
  - Justificativa técnica: Adição do import `{ useCallback }` no `App.jsx`.

- **Modo Demo intermitente (Submit de Form e Perda de Sessão)**
  - Contexto: O botão de Demo dentro de um `<form>` causava refresh antes da navegação, e o sistema não recuperava o `DEMO_USER` após F5.
  - Correção: Adição de `type="button"` nos botões de login e lógica de auto-restore do `DEMO_USER` no `App.jsx`.

- **PWA: Suporte nativo a iOS e Manifest inválido**
  - Contexto: O app não rodava em tela cheia no iPhone e o manifest do Android estava quebrado com placeholders `${title}`.
  - Correção: Adição de meta tags `apple-mobile-web-app-capable` e normalização das strings literais no `vite.config.js`.

### Added
- **Botão "Instalar App" no Login Mobile**
  - Contexto: Adicionado botão de instalação do PWA que aparece apenas em dispositivos móveis, guiando o usuário para a tela de permissões `/install`.

### Fixed
- **Modo Demo (Dashboard redirecionando p/ Login e vazando dados)**
  - Contexto: A sessão do modo demo "caía" instantaneamente ao recarregar a página (perdendo a flag `demoMode`) e exibindo veículos reais da conta admin em background (cache residente + WebSocket ativo).
  - Justificativa técnica: O `App.jsx` excluía imperativamente a flag do sessionStorage, e o `LoginPage` herdava o estado do Redux das conexões passadas.
  - Impacto em banco: Nenhum
  - Impacto em APIs: Alterado interceptador `fetchOrThrow.js` para ignorar HTTP 401 em modo Demo.
  - Impacto em regras de negócio: O ambiente Demo passa a ser um sandbox limpo através da deleção dos stores `devices`, `positions` e `events`.

### Added
- **Página de instalação PWA** (`src/pwa/InstallPage.jsx`)
  - Contexto: Página dedicada rota `/install` para guiar usuário na instalação do PWA no celular
  - Hooks modulares: `usePwaInstallPrompt.js` (captura `beforeinstallprompt`, detecta standalone) e `useDevicePermissions.js` (gerencia Notification, Geolocation, Camera)
  - Suporte iOS: instruções visuais "Compartilhar → Adicionar à Tela de Início"
  - Dashboard de permissões com status visual (granted/denied/pending) e botão "Permitir Todas"
  - Manifest atualizado: `display: standalone`, `orientation: portrait`, `start_url: /`
  - Impacto em banco: Nenhum
  - Impacto em APIs: Nenhum

---

## [0.11.0] — 2026-03-09

### Added
- **Push Notifications nativas no PWA** (módulo `src/common/notifications/`)
  - Contexto: Implementação modular de notificações push usando Web Notifications API
  - Módulos: `notificationManager.js` (permissão + exibição), `notificationEvents.js` (formatação de eventos Traccar), `useNotifications.js` (hook React)
  - Tipos de evento suportados: ignitionOn/Off, geofenceEnter/Exit, alarm, deviceOnline/Offline, deviceMoving/Stopped, deviceOverspeed, fuelDrop/Increase, maintenance, driverChanged, commandResult, textMessage
  - Funciona em desktop browser e PWA instalado (background notifications via service worker)
  - Deduplicação via tag por event.id
  - Justificativa: Usuários precisam de alertas em tempo real mesmo com app em background
  - Impacto em banco: Nenhum (usa apenas API Traccar)
  - Impacto em APIs: Novo polling de `GET /api/events` no SocketController (janela de 10s)
  - Impacto em regras de negócio: Auto-request de permissão na primeira visita

---



### Fixed
- **HTTP 415 ao excluir geocercas via DELETE** (`traccar-proxy`)
  - Contexto: Proxy encaminhava body vazio em requests DELETE, causando rejeição pelo Traccar (415 Unsupported Media Type)
  - Justificativa: Restringir forwarding de body apenas para POST/PUT/PATCH, conforme protocolo HTTP
  - Impacto em banco: Nenhum
  - Impacto em APIs: Corrige exclusão de geocercas, dispositivos, notificações e qualquer recurso via DELETE
  - Impacto em regras de negócio: Nenhum

---

## [0.10.0] — 2026-03-08

### Added
- **Documentação completa das APIs** (`API_DOCS.md`)
  - Contexto: Documentação técnica das 4 Edge Functions com endpoints, autenticação, parâmetros e exemplos
  - Impacto em banco: Nenhum
  - Impacto em APIs: Nenhum (apenas documentação)

- **Guia de deploy** (`DEPLOY_GUIDE.md`)
  - Contexto: Instruções de deploy, variáveis de ambiente, configuração Supabase, troubleshooting
  - Impacto em banco: Nenhum

- **AI System Prompt** (`AI_SYSTEM_PROMPT.md`)
  - Contexto: 5º e último arquivo de controle da IA — contém regras de comportamento, padrões de código, segurança e fluxo de trabalho obrigatório
  - Justificativa: Exigido pelo Knowledge do projeto para manter consistência da IA
  - Impacto em banco: Nenhum

---

## [0.9.0] — 2026-03-08

### Fixed
- **Controles duplicados na tela de geofences**
  - Contexto: Página `/app/geofences` era incluída em `isSettingsRoute`, causando renderização de `MainMap` como background simultaneamente ao `MapView` da `GeofencesPage`
  - Justificativa: Como o mapa é singleton, ambos adicionavam controles à mesma instância (NavigationControl, SwitcherControl, GeolocateControl, WhatsApp)
  - Correção: Removido `/app/geofences` de `isSettingsRoute` em `App.jsx`
  - Impacto em banco: Nenhum
  - Impacto em APIs: Nenhum

- **Demo mode: categoria `pickup` normalizada para `car`**
  - Contexto: Veículos demo usavam categoria `pickup` que não existe nos ícones SVG
  - Correção: Normalização para `car` + campos obrigatórios adicionados
  - Impacto em banco: Nenhum

### Changed
- **UI: Controles do mapa com tema glassmorphism**
  - Contexto: Controles nativos do MapLibre estilizados com backdrop-filter, cantos arredondados, accent teal
  - Inclui: NavigationControl, GeolocateControl, SwitcherControl, geocoder, draw controls
  - Impacto: Apenas CSS, sem mudança funcional

### Added
- **Botão WhatsApp flutuante no mapa** (`MapWhatsApp.js`)
  - Contexto: Controle customizado MapLibre com ícone WhatsApp SVG
  - Número carregado do tenant via Supabase
  - Impacto em banco: Leitura de `tenants.whatsapp_number`

- **Alertas WhatsApp por dispositivo** (`WhatsAppDeviceAlerts.jsx`)
  - Contexto: Componente para configurar alertas WhatsApp individualmente por dispositivo
  - Impacto em banco: CRUD em `whatsapp_device_alert_prefs`

- **Arquivos de controle do projeto**
  - Criados: `AI_MEMORY.md`, `ARCHITECTURE.md`, `DATABASE_SCHEMA.md`, `CHANGELOG.md`, `SECURITY_POLICY.md`
  - Propósito: Manter contexto consistente para IA e equipe

---

## Última Atualização
2026-03-21
