import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Switch,
  TextField,
  IconButton,
  Typography,
  Box,
  Collapse,
  CircularProgress,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SaveIcon from '@mui/icons-material/Save';
import whatsappService from '../admin/whatsapp/whatsappService';
import { useTranslation } from '../common/components/LocalizationProvider';

const DEFAULT_ALERTS = [
  {
    alert_type: 'alarm',
    label: '🆘 Alarme SOS',
    template: '⚠️ ALERTA SOS!\nDispositivo: {device}\nHorário: {time}',
  },
  {
    alert_type: 'geofenceExit',
    label: '📍 Saída de Cerca',
    template: '🚨 {device} saiu da cerca virtual!\nHorário: {time}',
  },
  {
    alert_type: 'geofenceEnter',
    label: '📍 Entrada em Cerca',
    template: '✅ {device} entrou na cerca virtual.\nHorário: {time}',
  },
  {
    alert_type: 'speedLimit',
    label: '🏎️ Excesso de Velocidade',
    template: '⚡ {device} excedeu o limite de velocidade!\nHorário: {time}\n{data}',
  },
  {
    alert_type: 'ignitionOn',
    label: '🔑 Ignição Ligada',
    template: '🟢 {device} ligou a ignição.\nHorário: {time}',
  },
  {
    alert_type: 'ignitionOff',
    label: '🔑 Ignição Desligada',
    template: '🔴 {device} desligou a ignição.\nHorário: {time}',
  },
  {
    alert_type: 'maintenance',
    label: '🔧 Manutenção',
    template: '🔧 {device} precisa de manutenção!\n{data}',
  },
  {
    alert_type: 'deviceMoving',
    label: '🚗 Dispositivo em Movimento',
    template: '🚗 {device} começou a se mover.\nHorário: {time}',
  },
  {
    alert_type: 'deviceStopped',
    label: '🛑 Dispositivo Parado',
    template: '🛑 {device} parou.\nHorário: {time}',
  },
];

const WhatsAppAlertsDialog = ({ open, onClose }) => {
  const t = useTranslation();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [expandedType, setExpandedType] = useState(null);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await whatsappService.getAlerts();
      const saved = res.data || [];
      setAlerts(
        DEFAULT_ALERTS.map((def) => {
          const existing = saved.find((s) => s.alert_type === def.alert_type);
          return {
            alert_type: def.alert_type,
            label: def.label,
            enabled: existing?.enabled || false,
            template_message: existing?.template_message || def.template,
          };
        }),
      );
    } catch {
      setAlerts(
        DEFAULT_ALERTS.map((d) => ({
          alert_type: d.alert_type,
          label: d.label,
          enabled: false,
          template_message: d.template,
        })),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadAlerts();
  }, [open, loadAlerts]);

  const toggleAlert = (type) => {
    setAlerts((prev) =>
      prev.map((a) => (a.alert_type === type ? { ...a, enabled: !a.enabled } : a)),
    );
  };

  const updateTemplate = (type, value) => {
    setAlerts((prev) =>
      prev.map((a) => (a.alert_type === type ? { ...a, template_message: value } : a)),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await whatsappService.saveAlerts(
        alerts.map(({ alert_type, enabled, template_message }) => ({
          alert_type,
          enabled,
          template_message,
        })),
      );
      setMessage({ type: 'success', text: t('whatsappAlertsSaved') || '✅ Configurações salvas!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="span">
          🔔 {t('whatsappAlerts') || 'Configuração de Alertas WhatsApp'}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Selecione quais alertas serão enviados via WhatsApp. Use {'{device}'}, {'{event}'},{' '}
          {'{time}'}, {'{data}'} nos templates.
        </Typography>

        {message && (
          <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {alerts.map((alert) => (
              <Box
                key={alert.alert_type}
                sx={{
                  border: 1,
                  borderColor: alert.enabled ? 'success.main' : 'divider',
                  borderRadius: 2,
                  overflow: 'hidden',
                  transition: 'border-color 0.2s',
                  bgcolor: alert.enabled ? 'action.selected' : 'transparent',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 2,
                    py: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Switch
                      checked={alert.enabled}
                      onChange={() => toggleAlert(alert.alert_type)}
                      color="success"
                      size="small"
                    />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {alert.label}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() =>
                      setExpandedType(expandedType === alert.alert_type ? null : alert.alert_type)
                    }
                  >
                    {expandedType === alert.alert_type ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>

                <Collapse in={expandedType === alert.alert_type}>
                  <Box sx={{ px: 2, pb: 2 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      size="small"
                      label="Template da mensagem"
                      value={alert.template_message}
                      onChange={(e) => updateTemplate(alert.alert_type, e.target.value)}
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 0.5, display: 'block' }}
                    >
                      Variáveis: {'{device}'} {'{event}'} {'{time}'} {'{data}'}
                    </Typography>
                  </Box>
                </Collapse>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Fechar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="success"
          disabled={saving || loading}
          startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
        >
          {t('sharedSave') || 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WhatsAppAlertsDialog;
