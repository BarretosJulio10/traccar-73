import { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import maplibregl from 'maplibre-gl';
import { map } from '../core/MapView';
import { devicesActions } from '../../store';

class CenterControl {
    constructor(onClick) {
        this.onClick = onClick;
    }

    onAdd(map) {
        this.map = map;
        this.container = document.createElement('div');
        this.container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        this.button = document.createElement('button');
        this.button.type = 'button';
        this.button.className = 'maplibregl-ctrl-icon';
        this.button.title = 'Mostrar Todos';
        this.button.style.display = 'flex';
        this.button.style.alignItems = 'center';
        this.button.style.justifyContent = 'center';
        this.button.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="#94a3b8"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>';
        this.button.onclick = this.onClick;
        this.container.appendChild(this.button);
        return this.container;
    }

    onRemove() {
        this.container.parentNode.removeChild(this.container);
        this.map = undefined;
    }
}

const MapCenterControl = () => {
    const positions = useSelector((state) => state.session.positions);
    const dispatch = useDispatch();

    const handleCenter = useCallback(() => {
        // Close any open panel / selected device
        dispatch(devicesActions.selectId(null));
        window.dispatchEvent(new CustomEvent('center-all'));

        const coordinates = Object.values(positions).map((item) => [item.longitude, item.latitude]);
        if (coordinates.length > 0) {
            const bounds = coordinates.reduce(
                (bounds, item) => bounds.extend(item),
                new maplibregl.LngLatBounds(coordinates[0], coordinates[0]),
            );
            map.fitBounds(bounds, {
                padding: 80,
                maxZoom: 16,
            });
        }
    }, [positions, dispatch]);

    useEffect(() => {
        const control = new CenterControl(handleCenter);
        map.addControl(control, 'top-right');
        return () => {
            map.removeControl(control);
        };
    }, [handleCenter]);

    return null;
};

export default MapCenterControl;
