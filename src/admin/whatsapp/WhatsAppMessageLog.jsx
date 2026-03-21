import React, { useState, useEffect } from 'react';
import whatsappService from './whatsappService';

const WhatsAppMessageLog = ({ t }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const cardStyle = {
    padding: 24,
    borderRadius: 16,
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.08)',
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadMessages = async () => {
    try {
      const res = await whatsappService.getMessages(30);
      setMessages(res.data || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const statusIcon = {
    sent: '✅',
    delivered: '✅✅',
    failed: '❌',
  };

  const typeLabel = {
    alert: '🔔 Alerta',
    billing: '💳 Cobrança',
    manual: '📨 Manual',
  };

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
          📨 {t('whatsappMessageLog') || 'Log de Mensagens'}
        </h3>
        <button
          onClick={loadMessages}
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: 12,
            fontFamily: 'inherit',
          }}
        >
          🔄 {t('sharedRefresh') || 'Atualizar'}
        </button>
      </div>

      {loading ? (
        <p style={{ color: '#64748b', fontSize: 13 }}>Carregando...</p>
      ) : messages.length === 0 ? (
        <div
          style={{
            padding: 32,
            textAlign: 'center',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.02)',
            border: '1px dashed rgba(255,255,255,0.08)',
          }}
        >
          <p style={{ fontSize: 32, margin: '0 0 8px' }}>📭</p>
          <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
            {t('whatsappNoMessages') || 'Nenhuma mensagem enviada ainda'}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            maxHeight: 400,
            overflowY: 'auto',
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 14 }}>{statusIcon[msg.status] || '❓'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>
                      {msg.recipient_phone}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: 'rgba(255,255,255,0.06)',
                        color: '#94a3b8',
                      }}
                    >
                      {typeLabel[msg.message_type] || msg.message_type}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 12,
                      color: '#64748b',
                      margin: '2px 0 0',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {msg.message_content}
                  </p>
                </div>
              </div>
              <span style={{ fontSize: 11, color: '#475569', whiteSpace: 'nowrap', marginLeft: 8 }}>
                {new Date(msg.created_at).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WhatsAppMessageLog;
