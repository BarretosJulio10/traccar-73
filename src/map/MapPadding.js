import { useEffect } from 'react';

import { map } from './core/MapView';
import { useTheme } from '@mui/material';

const MapPadding = ({ start, top = 0 }) => {
  const theme = useTheme();

  useEffect(() => {
    const startKey = theme.direction === 'rtl' ? 'right' : 'left';
    
    // Controles no lado dinâmico
    const topStart = document.querySelector(`.maplibregl-ctrl-top-${startKey}`);
    const bottomStart = document.querySelector(`.maplibregl-ctrl-bottom-${startKey}`);
    // Caso hajam botões do outro lado no topo
    const topRight = document.querySelector(`.maplibregl-ctrl-top-right`);

    if (topStart) {
      topStart.style.insetInlineStart = `${start}px`;
      topStart.style.top = `${top}px`;
    }
    if (bottomStart) {
      bottomStart.style.insetInlineStart = `${start}px`;
    }
    if (topRight) {
      topRight.style.top = `${top}px`;
    }

    map.setPadding({ top: top, bottom: 0, right: 0, [theme.direction === 'rtl' ? 'right' : 'left']: start });
    
    return () => {
      if (topStart) {
        topStart.style.insetInlineStart = 0;
        topStart.style.top = 0;
      }
      if (topRight) topRight.style.top = 0;
      if (bottomStart) bottomStart.style.insetInlineStart = 0;
      map.setPadding({ top: 0, right: 0, bottom: 0, left: 0 });
    };
  }, [start, top, theme.direction]);

  return null;
};

export default MapPadding;
