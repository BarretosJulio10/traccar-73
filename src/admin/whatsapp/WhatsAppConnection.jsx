import React, { useState, useEffect, useRef } from 'react';
import whatsappService from './whatsappService';

const WhatsAppConnection = ({ t }) => {
  const [status, setStatus] = useState('disconnected');
  const [qrCode, setQrCode] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [instanceExists, setInstanceExists] = useState(false);
  const pollRef = useRef(null);

  const cardStyle = {
    padding: 24,
    borderRadius: 16,
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.08)',
  };

  const fetchStatus = async () => {
    try {
      const res = await whatsappService.getConnectionStatus();
      const data = res.data;
      setStatus(data.status || 'disconnected');
      setQrCode(data.qrCode || null);
      setPhoneNumber(data.phoneNumber || null);
      setInstanceExists(true);
      setError('');

      if (data.status === 'connected') {
        stopPolling();
      }
    } catch (err) {
      // Instance doesn't exist yet — expected state for new tenants
      if (err.message?.includes('No instance found') || err.message?.includes('Create one first')) {
        setInstanceExists(false);
        setStatus('disconnected');
      } else {
        setError(err.message);
      }
    }
  };

  const startPolling = () => {
    stopPolling();
    pollRef.current = setInterval(fetchStatus, 5000);
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => {
    fetchStatus();
    return () => stopPolling();
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    setError('');
    try {
      await whatsappService.createInstance();
      setInstanceExists(true);
      await fetchStatus();
      startPolling();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    setError('');
    try {
      await whatsappService.disconnect();
      setStatus('disconnected');
      setQrCode(null);
      setPhoneNumber(null);
      stopPolling();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshQr = async () => {
    setLoading(true);
    try {
      await fetchStatus();
      if (status !== 'connected') startPolling();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    connected: { bg: 'rgba(0,245,160,0.15)', color: '#00f5a0', label: '🟢 Conectado' },
    connecting: { bg: 'rgba(255,200,0,0.15)', color: '#ffc800', label: '🟡 Conectando...' },
    disconnected: { bg: 'rgba(255,100,100,0.15)', color: '#ff6b6b', label: '🔴 Desconectado' },
  };

  const statusInfo = statusColors[status] || statusColors.disconnected;

  return (
    <div style={cardStyle}>
      <h3
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: '#fff',
          margin: '0 0 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        📱 {t('whatsappConnection') || 'Conexão WhatsApp'}
      </h3>

      {/* Status Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <span
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            background: statusInfo.bg,
            color: statusInfo.color,
          }}
        >
          {statusInfo.label}
        </span>
        {phoneNumber && <span style={{ fontSize: 13, color: '#94a3b8' }}>📞 {phoneNumber}</span>}
      </div>

      {/* QR Code */}
      {status !== 'connected' && qrCode && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            padding: 20,
            borderRadius: 12,
            background: '#fff',
            marginBottom: 20,
            maxWidth: 280,
            margin: '0 auto 20px',
          }}
        >
          <img
            src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
            alt="QR Code WhatsApp"
            style={{ width: 240, height: 240, imageRendering: 'pixelated' }}
          />
          <p style={{ fontSize: 12, color: '#475569', textAlign: 'center', margin: 0 }}>
            {t('whatsappScanQr') ||
              'Abra o WhatsApp Business > Dispositivos vinculados > Vincular dispositivo'}
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            marginBottom: 16,
            background: 'rgba(255,100,100,0.1)',
            border: '1px solid rgba(255,100,100,0.2)',
            color: '#ff6b6b',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {status === 'disconnected' && (
          <button
            onClick={handleConnect}
            disabled={loading}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              background: 'linear-gradient(135deg, #25D366, #128C7E)',
              color: '#fff',
              fontWeight: 600,
              fontSize: 13,
              fontFamily: 'inherit',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? '⏳' : '🔗'} {t('whatsappConnect') || 'Conectar WhatsApp'}
          </button>
        )}

        {(status === 'connecting' || (status !== 'connected' && qrCode)) && (
          <button
            onClick={handleRefreshQr}
            disabled={loading}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.06)',
              color: '#e2e8f0',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
              fontFamily: 'inherit',
            }}
          >
            🔄 {t('whatsappRefreshQr') || 'Atualizar QR'}
          </button>
        )}

        {status === 'connected' && (
          <button
            onClick={handleDisconnect}
            disabled={loading}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: '1px solid rgba(255,100,100,0.3)',
              background: 'rgba(255,100,100,0.1)',
              color: '#ff6b6b',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
              fontFamily: 'inherit',
            }}
          >
            ❌ {t('whatsappDisconnect') || 'Desconectar'}
          </button>
        )}
      </div>
    </div>
  );
};

export default WhatsAppConnection;
