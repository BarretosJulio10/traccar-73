import { Tooltip, Box, useMediaQuery, useTheme } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useNavigate } from 'react-router-dom';
import DevicesIcon from '@mui/icons-material/Devices';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import FenceIcon from '@mui/icons-material/Fence';
import NotificationsIcon from '@mui/icons-material/Notifications';
import BuildIcon from '@mui/icons-material/Build';
import SettingsIcon from '@mui/icons-material/Settings';
import DescriptionIcon from '@mui/icons-material/Description';
import PeopleIcon from '@mui/icons-material/People';
import StorageIcon from '@mui/icons-material/Storage';
import DashboardIcon from '@mui/icons-material/Dashboard';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useState } from 'react';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useAdministrator } from '../common/util/permissions';
import WhatsAppAlertsDialog from '../settings/WhatsAppAlertsDialog';

const useStyles = makeStyles()((theme) => {
  const desktop = theme.breakpoints.up('md');
  return {
    root: {
      position: 'absolute',
      right: 16,
      top: 100,
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
      padding: '8px 6px',
      borderRadius: 14,
      backgroundColor: '#ffffffcc',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
      border: '1px solid rgba(6,182,212,0.1)',
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
      color: '#64748b',
      background: '#f1f5f988',
      border: '1px solid transparent',
      '&:hover': {
        backgroundColor: '#06b6d411',
        color: '#06b6d4',
        border: '1px solid #06b6d433',
        boxShadow: '0 0 15px rgba(6,182,212,0.15)',
        transform: 'translateX(-2px)',
      },
    },
    icon: {
      fontSize: '1.2rem',
    },
  };
});

const MapSideMenu = () => {
  const { classes } = useStyles();
  const navigate = useNavigate();
  const t = useTranslation();
  const admin = useAdministrator();
  const [whatsappOpen, setWhatsappOpen] = useState(false);

  const items = [
    { label: 'Mapa', icon: <DashboardIcon className={classes.icon} />, path: '/app' },
    { label: 'Cercas', icon: <FenceIcon className={classes.icon} />, path: '/app/geofences' },
    {
      label: t('reportTitle'),
      icon: <DescriptionIcon className={classes.icon} />,
      path: '/app/reports/combined',
    },
    {
      label: t('sharedPreferences'),
      icon: <SettingsIcon className={classes.icon} />,
      path: '/app/settings/preferences',
    },
  ];

  return (
    <>
      <div className={classes.root}>
        {items.map((item) => (
          <Tooltip key={item.path || item.label} title={item.label} placement="right" arrow>
            <Box className={classes.item} onClick={item.onClick || (() => navigate(item.path))}>
              {item.icon}
            </Box>
          </Tooltip>
        ))}
      </div>
      <WhatsAppAlertsDialog open={whatsappOpen} onClose={() => setWhatsappOpen(false)} />
    </>
  );
};

export default MapSideMenu;
