// ─── Design Tokens — Modelo Default ──────────────────────────────────────────
// Tokens base deste modelo. O ModelThemeProvider (fase futura) aplicará estes
// tokens + overrides do tenant (colors do Supabase) no sistema unificado.

export const defaultTokens = {
  // Layout
  layout: {
    sidebar:    { width: 360 },
    panel:      { width: 420 },
    bottomBar:  { height: 64, position: 'bottom', style: 'pill' },
  },

  // Cores base (dark mode — light mode definido via ThemeContext isDark)
  colors: {
    dark: {
      bg:          '#08090a',
      bgSecondary: '#111218',
      bgCard:      '#16171c',
      accent:      '#39ff14',
      accentRgb:   '57,255,20',
      textPrimary: '#f8fafc',
      textMuted:   '#64748b',
      border:      '#1e2025',
      borderCard:  '#232631',
    },
    light: {
      bg:          '#f8fafc',
      bgSecondary: '#f1f5f9',
      bgCard:      '#ffffff',
      accent:      '#06b6d4',
      accentRgb:   '6,182,212',
      textPrimary: '#0f172a',
      textMuted:   '#94a3b8',
      border:      '#e2e8f0',
      borderCard:  '#e2e8f0',
    },
  },

  // Tipografia
  fonts: {
    body:    "'Quicksand', 'Outfit', sans-serif",
    heading: "'Outfit', sans-serif",
    mono:    "'JetBrains Mono', monospace",
  },

  // Componentes específicos deste modelo
  components: {
    deviceCard: {
      compactHeight:  80,
      expandedHeight: 430,
      anchorHeight:   540,
    },
    mapControls: {
      position: 'top-right',
    },
  },
};
