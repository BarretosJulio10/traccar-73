import React from 'react';
import WhatsAppConnection from './WhatsAppConnection';
import WhatsAppAlerts from './WhatsAppAlerts';
import WhatsAppMessageLog from './WhatsAppMessageLog';

const WhatsAppTab = ({ t }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <WhatsAppConnection t={t} />
      <WhatsAppAlerts t={t} />
      <WhatsAppMessageLog t={t} />
    </div>
  );
};

export default WhatsAppTab;
