import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import maplibregl from 'maplibre-gl';
import { map } from './core/MapView';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const buildPopupHtml = (device, position) => {
  if (!device || !position) return '';

  const attrs = position.attributes || {};
  const speedKmh = Math.round((position.speed || 0) * 1.852);
  const isOnline = device.status === 'online';
  const statusColor = isOnline ? '#10b981' : '#ef4444';
  const statusDot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${statusColor};margin-right:4px;"></span>`;
  const statusText = isOnline ? 'Online' : 'Offline';

  const ignitionText =
    attrs.ignition !== undefined ? (attrs.ignition ? '🟢 Ligada' : '🔴 Desligada') : '—';

  const blockedText =
    attrs.blocked !== undefined ? (attrs.blocked ? '🔒 Bloqueado' : '🔓 Desbloqueado') : '—';

  const lastUpdate = position.fixTime ? dayjs(position.fixTime).fromNow() : '—';

  const rows = [
    { label: 'IMEI', value: device.uniqueId || '—' },
    { label: 'Telefone', value: device.phone || '—' },
    { label: 'Status', value: `${statusDot}${statusText}` },
    { label: 'Ignição', value: ignitionText },
    { label: 'Bloqueio', value: blockedText },
    { label: 'Velocidade', value: `${speedKmh} km/h` },
    { label: 'Satélites', value: attrs.sat != null ? attrs.sat : '—' },
    { label: 'Protocolo', value: position.protocol || '—' },
    {
      label: 'Coordenadas',
      value: `${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}`,
    },
    { label: 'Última att.', value: lastUpdate },
  ];

  if (position.address) {
    rows.splice(5, 0, { label: 'Endereço', value: position.address });
  }

  const rowsHtml = rows
    .map(
      (r) =>
        `<tr><td style="padding:2px 8px 2px 0;color:#94a3b8;font-size:11px;white-space:nowrap;">${r.label}</td><td style="padding:2px 0;font-size:11px;font-weight:600;">${r.value}</td></tr>`,
    )
    .join('');

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;min-width:220px;">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;padding-bottom:5px;border-bottom:1px solid rgba(148,163,184,0.2);">
        <span style="font-size:14px;">🚗</span>
        <span style="font-weight:700;font-size:13px;color:#e2e8f0;">${device.name}</span>
      </div>
      <table style="border-collapse:collapse;width:100%;color:#e2e8f0;">
        ${rowsHtml}
      </table>
    </div>
  `;
};

const MapHoverPopup = ({ sourceIds }) => {
  const popupRef = useRef(null);
  const devices = useSelector((state) => state.devices.items);
  const positions = useSelector((state) => state.session.positions);

  useEffect(() => {
    if (!sourceIds || sourceIds.length === 0) return;

    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: 'map-hover-popup',
      maxWidth: '320px',
      offset: [0, -20],
    });
    popupRef.current = popup;

    const onMouseEnter = (e) => {
      if (!e.features || !e.features.length) return;
      const feature = e.features[0];
      const deviceId = feature.properties.deviceId;
      const device = devices[deviceId];

      // Find position for this device
      const position = Object.values(positions).find((p) => p.deviceId === deviceId);
      if (!device) return;

      const html = buildPopupHtml(device, position);
      const coords = feature.geometry.coordinates.slice();

      // Ensure proper wrapping
      while (Math.abs(e.lngLat.lng - coords[0]) > 180) {
        coords[0] += e.lngLat.lng > coords[0] ? 360 : -360;
      }

      popup.setLngLat(coords).setHTML(html).addTo(map);
    };

    const onMouseLeave = () => {
      popup.remove();
    };

    sourceIds.forEach((sourceId) => {
      map.on('mouseenter', sourceId, onMouseEnter);
      map.on('mouseleave', sourceId, onMouseLeave);
    });

    return () => {
      sourceIds.forEach((sourceId) => {
        map.off('mouseenter', sourceId, onMouseEnter);
        map.off('mouseleave', sourceId, onMouseLeave);
      });
      popup.remove();
    };
  }, [sourceIds, devices, positions]);

  return null;
};

export default MapHoverPopup;
