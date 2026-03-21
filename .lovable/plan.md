

# Modernizar Controles do Mapa + Botão WhatsApp

## O que será feito

1. **Estilizar os controles nativos do mapa** (zoom +/-, bússola, camadas, geocoder, notificação) com CSS customizado para visual moderno: cantos arredondados, glassmorphism, hover suave, sombras premium
2. **Adicionar botão flutuante de WhatsApp** no mapa como um controle customizado maplibre

## Mudanças Técnicas

### 1. CSS Global dos controles do mapa (`public/styles.css`)
- Sobrescrever `.maplibregl-ctrl-group` com: border-radius 12px, backdrop-filter blur, background semi-transparente, box-shadow suave, border sutil
- Estilizar botões internos (`.maplibregl-ctrl-group button`) com: hover com background teal suave, transições fluidas, ícones com cor cinza que ficam teal no hover
- Adicionar separadores sutis entre botões
- Manter responsivo para mobile

### 2. Geocoder (`src/map/geocoder/geocoder.css`)
- Atualizar estilo do input de busca para combinar com o tema dark/glassmorphism
- Border-radius mais arredondado, sombra premium

### 3. Notificação (`src/map/notification/notification.css`)
- Atualizar ícones SVG com cores teal para combinar com o tema

### 4. Botão WhatsApp (`src/map/MapWhatsApp.js` - novo arquivo)
- Criar controle customizado maplibre similar ao `MapNotification`
- Ícone WhatsApp em SVG verde
- Ao clicar, abre `https://wa.me/{numero}` em nova aba
- Número configurável via atributos do servidor ou hardcoded

### 5. Integrar no MainMap (`src/main/MainMap.jsx`)
- Importar e adicionar `<MapWhatsApp />` ao lado dos outros controles

