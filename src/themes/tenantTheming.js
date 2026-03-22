/**
 * Motor central Injetável de Temas e UI.
 * Este utilitário recebe a instância de `theme` (e futuramente do `tenant`)
 * para gerar os estilos de layout consistentes do White-label PWA (FAAS).
 */

export const getGlassmorphismStyle = (theme) => ({
  background: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.75)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}`,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.palette.mode === 'dark' 
    ? '0 10px 40px rgba(0,0,0,0.5)' 
    : '0 10px 40px rgba(0,0,0,0.06)'
});

export const getPageContainerStyle = (theme) => ({
  height: '100%',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
  overflowX: 'hidden',
  backgroundColor: theme.palette.background.default,
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(4), // Afastamento premium
  },
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(2),
    paddingBottom: `calc(${theme.spacing(2)} + 56px)`, // Espaço do BottomMenu celular
  }
});
