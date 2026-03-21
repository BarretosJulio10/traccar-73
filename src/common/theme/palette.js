import { grey } from '@mui/material/colors';

const validatedColor = (color) => (/^#([0-9A-Fa-f]{3}){1,2}$/.test(color) ? color : null);

export default (server, darkMode, tenant) => ({
  mode: darkMode ? 'dark' : 'light',
  background: {
    default: darkMode ? '#1a1b1e' : '#f5f7fa',
    paper: darkMode ? '#24262b' : '#ffffff',
  },
  primary: {
    main:
      validatedColor(tenant?.color_primary) ||
      validatedColor(server?.attributes?.colorPrimary) ||
      (darkMode ? '#39ff14' : '#0f766e'),
    light: darkMode ? '#99f6e4' : '#14b8a6',
    dark: darkMode ? '#2dd4bf' : '#0d4f47',
    contrastText: darkMode ? '#0f172a' : '#ffffff',
  },
  secondary: {
    main:
      validatedColor(tenant?.color_secondary) ||
      validatedColor(server?.attributes?.colorSecondary) ||
      (darkMode ? '#a78bfa' : '#1e293b'),
    contrastText: '#ffffff',
  },
  neutral: {
    main: grey[500],
  },
  geometry: {
    main: '#14b8a6',
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
    primary: darkMode ? '#f1f5f9' : '#1e293b',
    secondary: darkMode ? '#94a3b8' : '#64748b',
  },
  divider: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
});
