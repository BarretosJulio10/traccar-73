import { useEffect, useMemo } from 'react';
import { useTheme } from '@mui/material';
import { map } from '../core/MapView';
import { useTenant } from '../../common/components/TenantProvider';
import { useTranslation } from '../../common/components/LocalizationProvider';
import './whatsapp.css';

class WhatsAppControl {
  constructor(eventHandler) {
    this.eventHandler = eventHandler;
  }

  onAdd() {
    this.button = document.createElement('button');
    // Important: apply maplibregl-ctrl-icon to trigger the contrast filter in index.css
    this.button.className = 'maplibregl-ctrl-icon maplibre-ctrl-whatsapp';
    this.button.type = 'button';
    this.button.onclick = () => this.eventHandler(this);

    this.container = document.createElement('div');
    this.container.className = 'maplibregl-ctrl-group maplibregl-ctrl';
    this.container.appendChild(this.button);

    return this.container;
  }

  onRemove() {
    this.container.parentNode.removeChild(this.container);
  }
}

const MapWhatsApp = () => {
  const theme = useTheme();
  const t = useTranslation();
  const tenantCtx = useTenant();
  const tenant = tenantCtx?.tenant;

  const handleWhatsAppClick = () => {
    const number = tenant?.whatsapp_number;
    if (!number) {
      alert(t('supportWhatsappNotConfigured') || 'O WhatsApp de suporte não está configurado.');
      return;
    }
    const message = tenant?.whatsapp_message || 'Olá, preciso de suporte no sistema.';
    const encodedMessage = encodeURIComponent(message);
    const wppUrl = `https://wa.me/${number.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
    window.open(wppUrl, '_blank');
  };

  const control = useMemo(() => new WhatsAppControl(handleWhatsAppClick), [handleWhatsAppClick]);

  useEffect(() => {
    map.addControl(control, theme.direction === 'rtl' ? 'top-left' : 'top-right');
    return () => map.removeControl(control);
  }, [control, theme.direction]);

  return null;
};

export default MapWhatsApp;
