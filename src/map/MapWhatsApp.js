import { useEffect, useMemo } from 'react';
import { useTheme } from '@mui/material';
import { map } from './core/MapView';

class WhatsAppControl {
  constructor(onClick) {
    this.onClick = onClick;
  }

  onAdd() {
    this.button = document.createElement('button');
    this.button.className = 'maplibregl-ctrl-whatsapp';
    this.icon = document.createElement('span');
    this.icon.className = 'maplibregl-ctrl-icon';
    this.button.appendChild(this.icon);
    this.button.type = 'button';
    this.button.title = 'WhatsApp Alertas';
    this.button.onclick = () => {
      if (this.onClick) this.onClick();
    };

    this.container = document.createElement('div');
    this.container.className = 'maplibregl-ctrl-group maplibregl-ctrl';
    this.container.appendChild(this.button);

    return this.container;
  }

  onRemove() {
    this.container.parentNode.removeChild(this.container);
  }
}

const MapWhatsApp = ({ onClick }) => {
  const theme = useTheme();
  const control = useMemo(() => new WhatsAppControl(onClick), [onClick]);

  useEffect(() => {
    map.addControl(control, theme.direction === 'rtl' ? 'top-left' : 'top-right');
    return () => map.removeControl(control);
  }, [control, theme.direction]);

  return null;
};

export default MapWhatsApp;
