import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import maplibregl from 'maplibre-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { useEffect, useMemo, useCallback, useState, useRef } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { map } from '../core/MapView';
import { findFonts, geofenceToFeature, geometryToArea } from '../core/mapUtil';
import { errorsActions, geofencesActions } from '../../store';
import { useCatchCallback } from '../../reactHelper';
import drawTheme from './theme';
import { useTranslation } from '../../common/components/LocalizationProvider';
import fetchOrThrow from '../../common/util/fetchOrThrow';
import CircleControl from './CircleControl';
import GeofenceCreateDialog from './GeofenceCreateDialog';

MapboxDraw.constants.classes.CONTROL_BASE = 'maplibregl-ctrl';
MapboxDraw.constants.classes.CONTROL_PREFIX = 'maplibregl-ctrl-';
MapboxDraw.constants.classes.CONTROL_GROUP = 'maplibregl-ctrl-group';

const MapGeofenceEdit = ({ selectedGeofenceId, onDrawingChange }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const t = useTranslation();

  const [pendingArea, setPendingArea] = useState(null);
  const onDrawingChangeRef = useRef(onDrawingChange);
  useEffect(() => { onDrawingChangeRef.current = onDrawingChange; }, [onDrawingChange]);

  const draw = useMemo(
    () =>
      new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          line_string: true,
          trash: true,
        },
        userProperties: true,
        styles: [
          ...drawTheme,
          {
            id: 'gl-draw-title',
            type: 'symbol',
            filter: ['all'],
            layout: {
              'text-field': '{user_name}',
              'text-font': findFonts(map),
              'text-size': 12,
            },
            paint: {
              'text-halo-color': 'white',
              'text-halo-width': 1,
            },
          },
        ],
      }),
    [],
  );

  const geofences = useSelector((state) => state.geofences.items);

  const refreshGeofences = useCatchCallback(async () => {
    const response = await fetchOrThrow('/api/geofences');
    dispatch(geofencesActions.refresh(await response.json()));
  }, [dispatch]);

  const handleCircleCreated = useCallback((area) => {
    setPendingArea(area);
  }, []);

  const circleControl = useMemo(
    () => new CircleControl({
      onCircleCreated: handleCircleCreated,
      onActiveChange: (active) => onDrawingChangeRef.current?.(active),
    }),
    [handleCircleCreated],
  );

  const handleDialogSave = useCallback(
    async (data) => {
      if (!pendingArea) return;
      try {
        let calendarId;

        // If calendar data was generated, create calendar first via Traccar API
        if (data.calendarData) {
          const calendarResponse = await fetchOrThrow('/api/calendars', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: `${data.name} - Agenda`,
              data: data.calendarData,
              attributes: {},
            }),
          });
          const calendar = await calendarResponse.json();
          calendarId = calendar.id;
        }

        const newItem = {
          name: data.name,
          area: pendingArea,
          description: data.description,
          calendarId: calendarId || undefined,
          attributes: data.attributes || {},
        };
        const geofenceResponse = await fetchOrThrow('/api/geofences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newItem),
        });
        const geofence = await geofenceResponse.json();

        // Link geofence to specific devices/groups via permissions API.
        // 'all' mode: geofence is auto-associated with the creating user — no extra call needed.
        if (data.linkMode === 'devices' && data.selectedDeviceIds?.length) {
          await Promise.all(
            data.selectedDeviceIds.map((deviceId) =>
              fetchOrThrow('/api/permissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceId, geofenceId: geofence.id }),
              }).catch(() => {}),
            ),
          );
        } else if (data.linkMode === 'groups' && data.selectedGroupIds?.length) {
          await Promise.all(
            data.selectedGroupIds.map((groupId) =>
              fetchOrThrow('/api/permissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ groupId, geofenceId: geofence.id }),
              }).catch(() => {}),
            ),
          );
        }

        refreshGeofences();
      } catch (error) {
        dispatch(errorsActions.push(error.message));
      }
      setPendingArea(null);
    },
    [pendingArea, dispatch, refreshGeofences],
  );

  const handleDialogCancel = useCallback(() => {
    setPendingArea(null);
  }, []);

  useEffect(() => {
    refreshGeofences();

    map.addControl(draw, 'top-right');

    // Use rAF so the draw control buttons are in the DOM before we query them
    let rafId = requestAnimationFrame(() => {
      const drawContainer = document.querySelector(
        '.maplibregl-ctrl-group .mapbox-gl-draw_ctrl-draw-btn',
      )?.parentElement;
      if (drawContainer) {
        circleControl.attach(map, drawContainer);
      }
    });

    return () => {
      cancelAnimationFrame(rafId);
      circleControl.detach();
      map.removeControl(draw);
      onDrawingChangeRef.current?.(false);
    };
  }, [refreshGeofences, circleControl]);

  // Notify parent when MapboxDraw enters/exits a drawing mode
  useEffect(() => {
    const onModeChange = ({ mode }) => {
      onDrawingChangeRef.current?.(mode !== 'simple_select');
    };
    map.on('draw.modechange', onModeChange);
    return () => map.off('draw.modechange', onModeChange);
  }, []);

  useEffect(() => {
    const listener = (event) => {
      const feature = event.features[0];
      const area = geometryToArea(feature.geometry);
      if (!area) {
        dispatch(errorsActions.push('Invalid geometry — could not convert to WKT'));
        return;
      }
      draw.delete(feature.id);
      onDrawingChangeRef.current?.(false);
      setPendingArea(area);
    };

    map.on('draw.create', listener);
    return () => map.off('draw.create', listener);
  }, [dispatch, t, draw]);

  useEffect(() => {
    const listener = async (event) => {
      const feature = event.features[0];
      try {
        await fetchOrThrow(`/api/geofences/${feature.id}`, { method: 'DELETE' });
        refreshGeofences();
      } catch (error) {
        dispatch(errorsActions.push(error.message));
        refreshGeofences();
      }
    };

    map.on('draw.delete', listener);
    return () => map.off('draw.delete', listener);
  }, [dispatch, refreshGeofences, draw]);

  useEffect(() => {
    const listener = async (event) => {
      const feature = event.features[0];
      const item = Object.values(geofences).find((i) => i.id === feature.id);
      if (item) {
        const updatedItem = { ...item, area: geometryToArea(feature.geometry) };
        try {
          await fetchOrThrow(`/api/geofences/${feature.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedItem),
          });
          refreshGeofences();
        } catch (error) {
          dispatch(errorsActions.push(error.message));
        }
      }
    };

    map.on('draw.update', listener);
    return () => map.off('draw.update', listener);
  }, [dispatch, geofences, refreshGeofences, draw]);

  useEffect(() => {
    draw.deleteAll();
    Object.values(geofences).forEach((geofence) => {
      draw.add(geofenceToFeature(theme, geofence));
    });
  }, [geofences]);

  useEffect(() => {
    if (selectedGeofenceId) {
      const feature = draw.get(selectedGeofenceId);
      let { coordinates } = feature.geometry;
      if (Array.isArray(coordinates[0][0])) {
        [coordinates] = coordinates;
      }
      const bounds = coordinates.reduce(
        (bounds, coordinate) => bounds.extend(coordinate),
        new maplibregl.LngLatBounds(coordinates[0], coordinates[1]),
      );
      const canvas = map.getCanvas();
      map.fitBounds(bounds, { padding: Math.min(canvas.width, canvas.height) * 0.1 });
    }
  }, [selectedGeofenceId]);

  return (
    <GeofenceCreateDialog
      open={pendingArea !== null}
      onSave={handleDialogSave}
      onCancel={handleDialogCancel}
    />
  );
};

export default MapGeofenceEdit;
