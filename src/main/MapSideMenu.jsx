import { Tooltip, Box } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useNavigate } from 'react-router-dom';
import FenceIcon from '@mui/icons-material/Fence';
import SettingsIcon from '@mui/icons-material/Settings';
import DescriptionIcon from '@mui/icons-material/Description';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useHudTheme } from '../common/util/ThemeContext';

// Static styles using CSS variables set by ThemeContext on :root
const useStyles = makeStyles()((muiTheme) => {
  const desktop = muiTheme.breakpoints.up('md');
  return {
    root: {
      position: 'absolute',
      left: desktop ? 2 : 'auto',
      right: desktop ? 'auto' : 16,
      top: desktop ? 2 : 100,
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: muiTheme.spacing(1),
      padding: '8px 6px',
      borderRadius: 14,
      backgroundColor: 'var(--hud-bg2)',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      border: '1px solid var(--hud-border)',
    },
    item: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 38,
      height: 38,
      borderRadius: 10,
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      color: 'var(--hud-text2)',
      background: 'var(--hud-bgcard)',
      border: '1px solid var(--hud-bordercard)',
      '&:hover': {
        backgroundColor: 'rgba(var(--hud-accent-rgb), 0.1)',
        color: 'var(--hud-accent)',
        border: '1px solid rgba(var(--hud-accent-rgb), 0.3)',
        boxShadow: '0 0 15px rgba(var(--hud-accent-rgb), 0.15)',
        transform: 'translateX(-2px)',
      },
    },
    icon: {
      fontSize: '1.2rem',
    },
  };
});

const MapSideMenu = ({ inline = false }) => {
  const { classes } = useStyles();
  const navigate = useNavigate();
  const t = useTranslation();
  const { theme } = useHudTheme();

  const items = [
    { label: 'Mapa', icon: <DashboardIcon className={classes.icon} />, path: '/app' },
    { label: 'Cercas', icon: <FenceIcon className={classes.icon} />, path: '/app/geofences' },
    {
      label: t('reportTitle'),
      icon: <DescriptionIcon className={classes.icon} />,
      path: '/app/reports',
    },
    {
      label: t('sharedPreferences'),
      icon: <SettingsIcon className={classes.icon} />,
      path: '/app/settings/preferences',
    },
  ];

  const containerStyle = inline
    ? {
        display: 'flex',
        flexDirection: 'row',
        gap: 8,
        padding: '6px 10px',
        borderRadius: 14,
        backgroundColor: theme.bgSecondary,
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        border: `1px solid ${theme.border}`,
      }
    : {};

  return (
    <div className={inline ? '' : classes.root} style={containerStyle}>
      {items.map((item) => (
        <Tooltip key={item.path || item.label} title={item.label} placement="right" arrow>
          <Box className={classes.item} onClick={item.onClick || (() => navigate(item.path))}>
            {item.icon}
          </Box>
        </Tooltip>
      ))}
    </div>
  );
};

export default MapSideMenu;
