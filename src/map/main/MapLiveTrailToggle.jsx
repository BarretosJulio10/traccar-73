import { useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material';
import { sessionActions } from '../../store';
import { useAttributePreference } from '../../common/util/preferences';
import { map } from '../core/MapView';

class TrailControl {
  constructor(onClick) {
    this.onClick = onClick;
    this.currentType = 'none';
  }

  onAdd() {
    this.container = document.createElement('div');
    this.container.className = 'maplibregl-ctrl-group maplibregl-ctrl';
    
    this.button = document.createElement('button');
    this.button.className = 'maplibregl-ctrl-icon';
    this.button.type = 'button';
    this.button.onclick = () => this.onClick && this.onClick();
    
    // Timeline Icon SVG
    this.button.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M23 8c0 1.1-.9 2-2 2-.18 0-.35-.02-.51-.07l-3.56 3.55c.05.16.07.34.07.52 0 1.1-.9 2-2 2s-2-.9-2-2c0-.18.02-.36.07-.52l-2.55-2.55c-.16.05-.34.07-.52.07s-.36-.02-.52-.07l-4.55 4.56c.05.16.07.33.07.51 0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2c.18 0 .35.02.51.07l4.56-4.55C8.02 9.36 8 9.18 8 9c0-1.1.9-2 2-2s2 .9 2 2c0 .18-.02.36-.07.52l2.55 2.55c.16-.05.34-.07.52-.07s.36.02.52.07l3.55-3.56C19.02 8.35 19 8.18 19 8c0-1.1.9-2 2-2s2 .9 2 2z"/></svg>`;
    
    // Apply styling so SVG respects color inheritance
    this.button.style.color = 'currentColor';
    
    this.container.appendChild(this.button);
    this.updateStyle();
    
    return this.container;
  }

  onRemove() {
    this.container.parentNode.removeChild(this.container);
  }

  setType(type) {
    this.currentType = type;
    if (this.button) this.updateStyle();
  }

  updateStyle() {
    let color = 'rgba(255, 255, 255, 0.5)';
    let title = 'Rastro: Desativado';
    if (this.currentType === 'all') {
      color = '#39ff14';
      title = 'Rastro: Todos';
    } else if (this.currentType === 'selected') {
      color = '#3b82f6';
      title = 'Rastro: Selecionado';
    }
    this.button.style.color = color;
    this.button.title = title;
  }
}

const MapLiveTrailToggle = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const liveRoutesOverride = useSelector((state) => state.session.liveRoutesOverride);
  const liveRoutesPref = useAttributePreference('mapLiveRoutes', 'none');
  const currentType = liveRoutesOverride || liveRoutesPref;

  const toggleRef = useRef(null);
  toggleRef.current = () => {
    const next = currentType === 'none' ? 'selected' : currentType === 'selected' ? 'all' : 'none';
    dispatch(sessionActions.updateLiveRoutes(next));
  };

  const control = useMemo(() => new TrailControl(() => toggleRef.current()), []);

  // Handle addition/removal of MapLibre Control
  useEffect(() => {
    map.addControl(control, theme.direction === 'rtl' ? 'top-left' : 'top-right');
    return () => map.removeControl(control);
  }, [control, theme.direction]);

  // Handle state updates natively
  useEffect(() => {
    control.setType(currentType);
  }, [currentType, control]);

  return null;
};

export default MapLiveTrailToggle;
