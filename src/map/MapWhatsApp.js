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
    this.button.type = 'button';
    this.button.title = 'Suporte WhatsApp';
    this.button.style.cssText = `
      width:44px;height:44px;display:flex;align-items:center;justify-content:center;
      background:transparent;border:none;cursor:pointer;padding:0;
    `;

    const img = document.createElement('img');
    img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%2325D366' d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z'/%3E%3Cpath fill='%2325D366' d='M12.001 2.002a9.998 9.998 0 0 0-8.653 14.992L2.001 22l5.174-1.354A9.997 9.997 0 1 0 12.001 2.002zm0 18.18a8.174 8.174 0 0 1-4.162-1.138l-.299-.177-3.07.804.822-2.991-.194-.307a8.183 8.183 0 1 1 6.903 3.809z'/%3E%3C/svg%3E";
    img.style.cssText = 'width:22px;height:22px;display:block;';
    img.alt = 'WhatsApp';

    this.button.appendChild(img);
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
