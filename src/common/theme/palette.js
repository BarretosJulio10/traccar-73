import { grey } from '@mui/material/colors';

const validatedColor = (color) => (/^#([0-9A-Fa-f]{3}){1,2}$/.test(color) ? color : null);

export default (server, darkMode, tenant) => ({
  mode: darkMode ? 'dark' : 'light',
  background: {
    default: darkMode ? '#1a1b1e' : '#f8fafc', // Slate 50
    paper: darkMode ? '#24262b' : '#ffffff',
  },
  primary: {
    main:
      validatedColor(tenant?.color_primary) ||
      validatedColor(server?.attributes?.colorPrimary) ||
      (darkMode ? '#22d3ee' : '#06b6d4'),
    light: darkMode ? '#67e8f9' : '#22d3ee',
    dark: darkMode ? '#0891b2' : '#0e7490',
    contrastText: '#ffffff',
  },
  secondary: {
    main:
      validatedColor(tenant?.color_secondary) ||
      validatedColor(server?.attributes?.colorSecondary) ||
      (darkMode ? '#94a3b8' : '#1e293b'),
    contrastText: '#ffffff',
  },
  neutral: {
    main: grey[500],
  },
  geometry: {
    main: '#06b6d4',
  },
  alwaysDark: {
    main: grey[900],
  },
  success: {
    main: '#10b981',
  },
  warning: {
    main: '#f59e0b',
  },
  error: {
    main: '#ef4444',
  },
  text: {
    primary: darkMode ? '#f1f5f9' : '#0f172a', // Slate 900
    secondary: darkMode ? '#94a3b8' : '#475569', // Slate 600
  },
  divider: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
});
