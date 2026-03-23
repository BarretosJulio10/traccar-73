import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import maplibregl from 'maplibre-gl';
import { map } from './core/MapView';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const pill = (bg, color, icon, text) =>
  `<span style="display:inline-flex;align-items:center;gap:4px;background:${bg};color:${color};border-radius:999px;padding:3px 8px;font-size:10px;font-weight:700;white-space:nowrap;">${icon}<span>${text}</span></span>`;

const buildPopupHtml = (device, position) => {
  if (!device) return '';

  const attrs = position?.attributes || {};
  const speedKmh = position ? Math.round((position.speed || 0) * 1.852) : 0;
  const isOnline = device.status === 'online';
  const statusColor = isOnline ? '#10b981' : '#ef4444';
  const statusBg = isOnline ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)';
  const statusText = isOnline ? 'Online' : 'Offline';

  const fixTime = position?.fixTime
    ? dayjs(position.fixTime).format('DD/MM/YYYY HH:mm:ss')
    : '—';
  const timeAgo = position?.fixTime ? dayjs(position.fixTime).fromNow() : '';

  const battery = attrs.batteryLevel ?? attrs.battery;
  const batteryColor = battery == null ? '#94a3b8' : battery > 50 ? '#10b981' : battery > 20 ? '#f59e0b' : '#ef4444';
  const odometer = attrs.totalDistance
    ? (attrs.totalDistance / 1000).toFixed(1)
    : attrs.odometer
      ? (attrs.odometer / 1000).toFixed(1)
      : null;
  const altitude = position?.altitude ? Math.round(position.altitude) : null;
  const satellites = attrs.sat != null ? attrs.sat : null;

  // Status pills row
  const pills = [];

  if (attrs.ignition !== undefined) {
    const on = attrs.ignition;
    pills.push(pill(on ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.12)', on ? '#10b981' : '#94a3b8', on ? '⚡' : '○', on ? 'LIGADO' : 'DESLIG.'));
  }
  if (attrs.motion !== undefined) {
    const moving = attrs.motion;
    pills.push(pill(moving ? 'rgba(59,130,246,0.15)' : 'rgba(100,116,139,0.12)', moving ? '#3b82f6' : '#94a3b8', moving ? '▶' : '■', moving ? 'MOVENDO' : 'PARADO'));
  }
  if (attrs.blocked !== undefined) {
    const blocked = attrs.blocked;
    pills.push(pill(blocked ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.12)', blocked ? '#ef4444' : '#10b981', blocked ? '🔒' : '🔓', blocked ? 'BLOQUEADO' : 'LIVRE'));
  }

  // Telemetry chips (compact)
  const chips = [];
  if (satellites != null) chips.push(`<span title="Satélites" style="display:inline-flex;align-items:center;gap:3px;color:#94a3b8;font-size:10px;font-weight:600;">🛰 ${satellites}</span>`);
  if (battery != null) chips.push(`<span title="Bateria" style="display:inline-flex;align-items:center;gap:3px;color:${batteryColor};font-size:10px;font-weight:600;">🔋 ${Math.round(battery)}%</span>`);
  if (altitude != null) chips.push(`<span title="Altitude" style="display:inline-flex;align-items:center;gap:3px;color:#94a3b8;font-size:10px;font-weight:600;">⛰ ${altitude}m</span>`);
  if (odometer != null) chips.push(`<span title="Odômetro" style="display:inline-flex;align-items:center;gap:3px;color:#94a3b8;font-size:10px;font-weight:600;">🧭 ${odometer}km</span>`);

  const address = position?.address
    ? `<div style="display:flex;align-items:flex-start;gap:6px;margin-top:8px;padding:6px 8px;background:rgba(148,163,184,0.06);border-radius:8px;">
        <span style="font-size:12px;margin-top:1px;flex-shrink:0;">📍</span>
        <span style="font-size:11px;color:#cbd5e1;line-height:1.4;">${position.address}</span>
       </div>`
    : '';

  const coordsLine = position
    ? `<div style="font-size:10px;color:#64748b;margin-top:4px;font-family:monospace;letter-spacing:0.02em;">${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}</div>`
    : '';

  const pillsHtml = pills.length
    ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:10px;">${pills.join('')}</div>`
    : '';

  const chipsHtml = chips.length
    ? `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;padding-top:8px;border-top:1px solid rgba(148,163,184,0.12);">${chips.join('')}</div>`
    : '';

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Outfit','Segoe UI',Roboto,sans-serif;min-width:240px;max-width:300px;color:#e2e8f0;">

      <!-- Header: name + speed -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:6px;">
        <div style="min-width:0;">
          <div style="font-size:15px;font-weight:800;letter-spacing:-0.02em;color:#f1f5f9;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px;">${device.name}</div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:4px;">
            <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${statusColor};${isOnline ? 'box-shadow:0 0 0 3px rgba(16,185,129,0.2);' : ''}"></span>
            <span style="font-size:10px;font-weight:700;color:${statusColor};letter-spacing:0.05em;">${statusText}</span>
            ${device.uniqueId ? `<span style="font-size:10px;color:#64748b;font-weight:500;">· ${device.uniqueId}</span>` : ''}
          </div>
        </div>
        <div style="flex-shrink:0;display:flex;flex-direction:column;align-items:center;background:${speedKmh > 0 ? 'rgba(59,130,246,0.15)' : 'rgba(100,116,139,0.1)'};border-radius:10px;padding:6px 10px;min-width:52px;">
          <span style="font-size:18px;font-weight:900;color:${speedKmh > 80 ? '#ef4444' : speedKmh > 0 ? '#3b82f6' : '#64748b'};line-height:1;font-family:monospace;">${speedKmh}</span>
          <span style="font-size:8px;font-weight:700;color:#64748b;letter-spacing:0.08em;">KM/H</span>
        </div>
      </div>

      <!-- Time line -->
      <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#94a3b8;font-weight:500;">
        <span>🕐</span>
        <span>${fixTime}</span>
        ${timeAgo ? `<span style="color:#64748b;">· ${timeAgo}</span>` : ''}
      </div>

      <!-- Address -->
      ${address}
      ${coordsLine}

      <!-- Status pills -->
      ${pillsHtml}

      <!-- Telemetry chips -->
      ${chipsHtml}
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
      offset: [0, -24],
    });
    popupRef.current = popup;

    const onMouseEnter = (e) => {
      if (!e.features || !e.features.length) return;
      const deviceId = e.features[0].properties.deviceId;
      const device = devices[deviceId];
      const position = Object.values(positions).find((p) => p.deviceId === deviceId);
      if (!device) return;

      const html = buildPopupHtml(device, position);
      const coords = e.features[0].geometry.coordinates.slice();
      while (Math.abs(e.lngLat.lng - coords[0]) > 180) {
        coords[0] += e.lngLat.lng > coords[0] ? 360 : -360;
      }
      popup.setLngLat(coords).setHTML(html).addTo(map);
    };

    const onMouseLeave = () => popup.remove();

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
