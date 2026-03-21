import React, { useState, useEffect } from 'react';
import whatsappService from './whatsappService';

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

const WhatsAppAlerts = ({ t }) => {
  const [alerts, setAlerts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [editingType, setEditingType] = useState(null);

  const cardStyle = {
    padding: 24,
    borderRadius: 16,
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.08)',
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const res = await whatsappService.getAlerts();
      const saved = res.data || [];

      // Merge defaults with saved
      const merged = DEFAULT_ALERTS.map((def) => {
        const existing = saved.find((s) => s.alert_type === def.alert_type);
        return {
          alert_type: def.alert_type,
          label: def.label,
          enabled: existing?.enabled || false,
          template_message: existing?.template_message || def.template,
        };
      });
      setAlerts(merged);
    } catch (err) {
      console.error('Failed to load alerts:', err);
      // Use defaults
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
  };

  const toggleAlert = (alertType) => {
    setAlerts((prev) =>
      prev.map((a) => (a.alert_type === alertType ? { ...a, enabled: !a.enabled } : a)),
    );
  };

  const updateTemplate = (alertType, value) => {
    setAlerts((prev) =>
      prev.map((a) => (a.alert_type === alertType ? { ...a, template_message: value } : a)),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await whatsappService.saveAlerts(
        alerts.map(({ alert_type, enabled, template_message }) => ({
          alert_type,
          enabled,
          template_message,
        })),
      );
      setMessage(t('whatsappAlertsSaved') || '✅ Configurações salvas!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={cardStyle}>
        <p style={{ color: '#64748b' }}>Carregando alertas...</p>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <h3
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: '#fff',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          🔔 {t('whatsappAlerts') || 'Configuração de Alertas'}
        </h3>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '8px 18px',
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            background: 'linear-gradient(135deg, #00f5a0, #00d9f5)',
            color: '#0a0a0f',
            fontWeight: 700,
            fontSize: 13,
            fontFamily: 'inherit',
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? '⏳' : '💾'} {t('sharedSave') || 'Salvar'}
        </button>
      </div>

      <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
        {t('whatsappAlertsDesc') ||
          'Selecione quais alertas do Traccar serão enviados via WhatsApp. Use {device}, {event}, {time}, {data} nos templates.'}
      </p>

      {message && (
        <div
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            background: message.startsWith('❌') ? 'rgba(255,100,100,0.1)' : 'rgba(0,245,160,0.1)',
            color: message.startsWith('❌') ? '#ff6b6b' : '#00f5a0',
          }}
        >
          {message}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {alerts.map((alert) => (
          <div key={alert.alert_type}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: 10,
                background: alert.enabled ? 'rgba(0,245,160,0.05)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${alert.enabled ? 'rgba(0,245,160,0.15)' : 'rgba(255,255,255,0.06)'}`,
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <label style={{ position: 'relative', width: 44, height: 24, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={alert.enabled}
                    onChange={() => toggleAlert(alert.alert_type)}
                    style={{ display: 'none' }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 12,
                      background: alert.enabled ? '#00f5a0' : 'rgba(255,255,255,0.15)',
                      transition: 'background 0.2s',
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      top: 2,
                      left: alert.enabled ? 22 : 2,
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: '#fff',
                      transition: 'left 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    }}
                  />
                </label>
                <span
                  style={{
                    fontSize: 14,
                    color: alert.enabled ? '#e2e8f0' : '#64748b',
                    fontWeight: 500,
                  }}
                >
                  {alert.label}
                </span>
              </div>
              <button
                onClick={() =>
                  setEditingType(editingType === alert.alert_type ? null : alert.alert_type)
                }
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontFamily: 'inherit',
                }}
              >
                ✏️ Template
              </button>
            </div>

            {/* Template editor */}
            {editingType === alert.alert_type && (
              <div style={{ padding: '12px 14px', marginTop: 4 }}>
                <textarea
                  value={alert.template_message}
                  onChange={(e) => updateTemplate(alert.alert_type, e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: 10,
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#e2e8f0',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <p style={{ fontSize: 11, color: '#475569', margin: '4px 0 0' }}>
                  Variáveis: {'{device}'} {'{event}'} {'{time}'} {'{data}'}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WhatsAppAlerts;
