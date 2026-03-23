import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Paper,
  Typography,
  Switch,
  IconButton,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { makeStyles } from 'tss-react/mui';
import { supabase } from '../../integrations/supabase/client';

const ALERT_TYPES = [
  { key: 'deviceOnline', label: 'Dispositivo Online' },
  { key: 'deviceOffline', label: 'Dispositivo Offline' },
  { key: 'deviceMoving', label: 'Em Movimento' },
  { key: 'deviceStopped', label: 'Parado' },
  { key: 'deviceOverspeed', label: 'Excesso de Velocidade' },
  { key: 'geofenceEnter', label: 'Entrada em Cerca' },
  { key: 'geofenceExit', label: 'Saída de Cerca' },
  { key: 'ignitionOn', label: 'Ignição Ligada' },
  { key: 'ignitionOff', label: 'Ignição Desligada' },
];

const useStyles = makeStyles()((theme) => ({
  root: {
    position: 'fixed',
    top: 16,
    right: 16,
    zIndex: 300,
    width: 320,
    maxHeight: '70vh',
    overflowY: 'auto',
    background: 'rgba(15, 23, 42, 0.85)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(45, 212, 191, 0.15)',
    borderRadius: 16,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    color: '#e2e8f0',
    padding: theme.spacing(1),
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(1, 1.5),
  },
  title: {
    fontWeight: 600,
    fontSize: '0.95rem',
    color: '#2dd4bf',
  },
  deviceName: {
    fontWeight: 500,
    fontSize: '0.85rem',
    color: '#94a3b8',
    padding: theme.spacing(0, 1.5, 1),
  },
  listItem: {
    paddingTop: 4,
    paddingBottom: 4,
  },
  label: {
    color: '#e2e8f0',
    fontSize: '0.85rem',
  },
  noDevice: {
    padding: theme.spacing(3),
    textAlign: 'center',
    color: '#94a3b8',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    padding: theme.spacing(3),
  },
}));

const WhatsAppDeviceAlerts = ({ deviceId, tenantId, onClose }) => {
  const { classes } = useStyles();
  const [prefs, setPrefs] = useState({});
  const [loading, setLoading] = useState(false);

  const device = useSelector((state) => (deviceId ? state.devices.items[deviceId] : null));

  const user = useSelector((state) => state.session.user);
  const userEmail = user?.email || '';

  // Load prefs from Supabase
  useEffect(() => {
    if (!deviceId || !tenantId || !userEmail) return;

    const load = async () => {
      setLoading(true);
      try {
        // Fetch device-specific prefs
        const { data: devicePrefs } = await supabase
          .from('whatsapp_device_alert_prefs')
          .select('alert_type, enabled')
          .eq('tenant_id', tenantId)
          .eq('device_id', deviceId)
          .eq('user_email', userEmail);

        // Fetch tenant defaults
        const { data: tenantDefaults } = await supabase
          .from('whatsapp_alert_configs')
          .select('alert_type, enabled')
          .eq('tenant_id', tenantId);

        // Build prefs map: start with tenant defaults, override with device prefs
        const map = {};
        ALERT_TYPES.forEach((a) => {
          map[a.key] = false;
        });
        tenantDefaults?.forEach((d) => {
          map[d.alert_type] = d.enabled;
        });
        devicePrefs?.forEach((p) => {
          map[p.alert_type] = p.enabled;
        });

        setPrefs(map);
      } catch (err) {
        console.error('Error loading alert prefs:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [deviceId, tenantId, userEmail]);

  const handleToggle = useCallback(
    async (alertType, enabled) => {
      setPrefs((prev) => ({ ...prev, [alertType]: enabled }));

      try {
        await supabase.from('whatsapp_device_alert_prefs').upsert(
          {
            tenant_id: tenantId,
            device_id: deviceId,
            user_email: userEmail,
            alert_type: alertType,
            enabled,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'tenant_id,device_id,user_email,alert_type' },
        );
      } catch (err) {
        console.error('Error saving alert pref:', err);
        // Revert on error
        setPrefs((prev) => ({ ...prev, [alertType]: !enabled }));
      }
    },
    [tenantId, deviceId, userEmail],
  );

  if (!deviceId) {
    return (
      <Paper className={classes.root} elevation={0}>
        <div className={classes.header}>
          <Typography className={classes.title}>Alertas WhatsApp</Typography>
          <IconButton size="small" onClick={onClose} sx={{ color: '#94a3b8' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>
        <Typography className={classes.noDevice}>
          Selecione um veículo no mapa para configurar os alertas.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper className={classes.root} elevation={0}>
      <div className={classes.header}>
        <Typography className={classes.title}>Alertas WhatsApp</Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: '#94a3b8' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>
      <Typography className={classes.deviceName}>{device?.name || `Device ${deviceId}`}</Typography>
      <Divider sx={{ borderColor: 'rgba(45, 212, 191, 0.1)' }} />
      {loading ? (
        <div className={classes.loading}>
          <CircularProgress size={28} sx={{ color: '#2dd4bf' }} />
        </div>
      ) : (
        <List dense disablePadding>
          {ALERT_TYPES.map((alert) => (
            <ListItem key={alert.key} className={classes.listItem}>
              <ListItemText
                primary={alert.label}
                primaryTypographyProps={{ className: classes.label }}
              />
              <ListItemSecondaryAction>
                <Switch
                  size="small"
                  checked={!!prefs[alert.key]}
                  onChange={(e) => handleToggle(alert.key, e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#2dd4bf' },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#2dd4bf',
                    },
                  }}
                />
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default WhatsAppDeviceAlerts;
