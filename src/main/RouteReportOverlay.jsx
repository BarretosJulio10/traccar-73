import { createPortal } from 'react-dom';
import { useState } from 'react';
import dayjs from 'dayjs';
import CloseIcon from '@mui/icons-material/Close';
import RouteIcon from '@mui/icons-material/Route';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CodeIcon from '@mui/icons-material/Code';
import DataObjectIcon from '@mui/icons-material/DataObject';
import { useHudTheme } from '../common/util/ThemeContext';
import MapRoutePath from '../map/MapRoutePath';
import MapRoutePoints from '../map/MapRoutePoints';
import MapCamera from '../map/MapCamera';
import { exportToPdf, exportToXml, exportToHtml } from '../reports/common/exportUtils';

// Sidebar widths + 2 px gap
const LEFT = 362;  // 360px fleet sidebar + 2px
const RIGHT = 422; // 420px detail panel + 2px
const GAP = 2;

// ── Stats computation ─────────────────────────────────────────────────────────

const fmtMs = (ms) => {
  if (!ms || ms <= 0) return '0 min';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
};

const computeStats = (items) => {
  if (!items || items.length === 0) return null;

  const first = items[0];
  const last = items[items.length - 1];
  const durationMs = dayjs(last.fixTime).diff(dayjs(first.fixTime));

  const firstOdo = first.attributes?.totalDistance ?? 0;
  const lastOdo = last.attributes?.totalDistance ?? 0;
  const odoKm = Math.max(0, (lastOdo - firstOdo) / 1000).toFixed(1);

  let stoppedMs = 0;
  let stoppedIgnOnMs = 0;
  for (let i = 1; i < items.length; i += 1) {
    const prev = items[i - 1];
    const cur = items[i];
    const segMs = dayjs(cur.fixTime).diff(dayjs(prev.fixTime));
    if (segMs <= 0) continue;
    const speedKmh = (prev.speed || 0) * 1.852;
    if (speedKmh < 2) {
      stoppedMs += segMs;
      if (prev.attributes?.ignition) stoppedIgnOnMs += segMs;
    }
  }

  const movingMs = Math.max(0, durationMs - stoppedMs);
  const movingSpeeds = items
    .filter((p) => (p.speed || 0) * 1.852 >= 2)
    .map((p) => (p.speed || 0) * 1.852);
  const avgSpeed =
    movingSpeeds.length > 0
      ? (movingSpeeds.reduce((a, b) => a + b, 0) / movingSpeeds.length).toFixed(0)
      : '0';

  return {
    odometer: `${odoKm} km`,
    stoppedTime: fmtMs(stoppedMs),
    travelTime: fmtMs(movingMs),
    stoppedIgnOn: fmtMs(stoppedIgnOnMs),
    avgSpeed: `${avgSpeed} km/h`,
    totalPositions: items.length,
  };
};

// ── StatCard ──────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, theme }) => (
  <div
    className="flex flex-col items-center justify-center px-2 py-2.5 rounded-2xl border"
    style={{ background: theme.bgCard, borderColor: theme.borderCard, flex: '1 1 90px', minWidth: 0 }}
  >
    <span
      className="text-[7px] font-black uppercase tracking-widest text-center leading-tight mb-1"
      style={{ color: theme.textMuted }}
    >
      {label}
    </span>
    <span
      className="text-xs font-black tabular-nums text-center"
      style={{ color: theme.accent }}
    >
      {value}
    </span>
  </div>
);

// ── Main overlay ──────────────────────────────────────────────────────────────

// ── Export helpers ────────────────────────────────────────────────────────────

const COLUMNS = ['#', 'Data e Hora', 'Endereço', 'Bateria', 'Latitude / Longitude', 'Velocidade', 'Ignição', 'Hodômetro', 'Motorista'];

const buildRows = (items) =>
  items.map((item, idx) => [
    String(idx + 1),
    dayjs(item.fixTime).format('DD/MM/YYYY HH:mm:ss'),
    item.address || `${item.latitude?.toFixed(4)}, ${item.longitude?.toFixed(4)}`,
    item.attributes?.batteryLevel != null ? `${Math.round(item.attributes.batteryLevel)}%` : '--',
    `${item.latitude?.toFixed(5)}, ${item.longitude?.toFixed(5)}`,
    `${Math.round((item.speed || 0) * 1.852)} km/h`,
    item.attributes?.ignition ? 'Ligada' : 'Desligada',
    item.attributes?.totalDistance != null ? `${(item.attributes.totalDistance / 1000).toFixed(1)} km` : '--',
    item.attributes?.driverUniqueId || '--',
  ]);

// ── Main overlay ──────────────────────────────────────────────────────────────

const RouteReportOverlay = ({ device, routeItems, onClose }) => {
  const { theme } = useHudTheme();
  const [exporting, setExporting] = useState(null);
  const stats = computeStats(routeItems);

  const subtitle = `${device?.name || ''} | ${dayjs().format('DD/MM/YYYY')}`;

  const getTenantLogo = () => {
    try { return JSON.parse(localStorage.getItem('tenantConfig') || '{}').logoUrl || null; } catch { return null; }
  };

  const handleExport = async (type) => {
    setExporting(type);
    const rows = buildRows(routeItems);
    const logoUrl = getTenantLogo();
    try {
      if (type === 'pdf') {
        const dateFrom = routeItems.length ? dayjs(routeItems[0].fixTime).format('DD/MM/YYYY HH:mm') : '';
        const dateTo   = routeItems.length ? dayjs(routeItems[routeItems.length - 1].fixTime).format('DD/MM/YYYY HH:mm') : '';
        await exportToPdf({
          title: 'Relatório de Percurso',
          subtitle,
          columns: COLUMNS,
          rows,
          logoUrl,
          deviceName: device?.name || '',
          deviceImei: device?.uniqueId || '',
          dateFrom,
          dateTo,
          stats,
        });
      } else if (type === 'html') {
        await exportToHtml({ title: 'Relatório de Percurso', subtitle, columns: COLUMNS, rows, stats, logoUrl });
      } else if (type === 'xml') {
        exportToXml({ title: 'Relatório de Percurso', subtitle, columns: COLUMNS, rows });
      }
    } finally {
      setExporting(null);
    }
  };

  const bg = theme.isDark ? 'rgba(8,10,14,0.96)' : 'rgba(248,250,252,0.97)';
  const shadow = '0 8px 32px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.18)';
  const radius = 16;

  const baseStyle = {
    position: 'fixed',
    left: LEFT,
    right: RIGHT,
    zIndex: 1000,
    background: bg,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: shadow,
  };

  return createPortal(
    <>
      {/* Route drawn on the map */}
      <MapRoutePath positions={routeItems} />
      <MapRoutePoints positions={routeItems} />
      <MapCamera positions={routeItems} />

      {/* ── Header bar ───────────────────────────────────────────────────── */}
      <div
        style={{
          ...baseStyle,
          top: GAP,
          borderRadius: radius,
          border: `1px solid ${theme.border}`,
        }}
        className="flex items-center gap-2 px-3 py-2.5"
      >
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center border active:scale-95 transition-all flex-shrink-0"
          style={{ background: theme.bgCard, borderColor: theme.borderCard, color: theme.textPrimary }}
        >
          <CloseIcon sx={{ fontSize: 13 }} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: theme.textMuted }}>
            Relatório de Percurso
          </p>
          <p className="text-sm font-black leading-tight truncate" style={{ color: theme.textPrimary }}>
            {device?.name}
          </p>
        </div>
        <span className="text-[8px] font-bold flex-shrink-0 hidden sm:block" style={{ color: theme.textMuted }}>
          {routeItems.length} reg.
        </span>

        {/* Export buttons */}
        {[
          { type: 'pdf',  Icon: PictureAsPdfIcon, label: 'PDF',  color: '#ef4444' },
          { type: 'html', Icon: CodeIcon,          label: 'HTML', color: '#f59e0b' },
          { type: 'xml',  Icon: DataObjectIcon,    label: 'XML',  color: '#3b82f6' },
        ].map(({ type, Icon, label, color }) => (
          <button
            key={type}
            type="button"
            onClick={() => handleExport(type)}
            disabled={!!exporting}
            className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg border text-[8px] font-black uppercase tracking-wide active:scale-95 transition-all flex-shrink-0 disabled:opacity-40"
            style={{ background: `${color}12`, borderColor: `${color}35`, color }}
          >
            <Icon sx={{ fontSize: 10 }} />
            {exporting === type ? '…' : label}
          </button>
        ))}

        <RouteIcon sx={{ fontSize: 18, color: theme.accent, opacity: 0.7, flexShrink: 0 }} />
      </div>

      {/* ── Bottom panel: stats + table ──────────────────────────────────── */}
      {/* Map is visible in the gap between the header and this panel       */}
      <div
        style={{
          ...baseStyle,
          bottom: GAP,
          height: '50vh',
          borderRadius: radius,
          border: `1px solid ${theme.border}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Stats cards */}
        {stats && (
          <div className="px-4 pt-3 pb-2 flex-shrink-0">
            <p className="text-[8px] font-black uppercase tracking-widest mb-2" style={{ color: theme.textMuted }}>
              Resumo do Percurso
            </p>
            <div className="flex gap-1.5 flex-wrap">
              <StatCard label="Hodômetro" value={stats.odometer} theme={theme} />
              <StatCard label="Tempo Parado" value={stats.stoppedTime} theme={theme} />
              <StatCard label="Tempo Percurso" value={stats.travelTime} theme={theme} />
              <StatCard label="Parado c/ Ign." value={stats.stoppedIgnOn} theme={theme} />
              <StatCard label="Vel. Média" value={stats.avgSpeed} theme={theme} />
              <StatCard label="Posições" value={String(stats.totalPositions)} theme={theme} />
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="flex-shrink-0 mx-4 h-px" style={{ background: theme.border }} />

        {/* Table label */}
        <div className="px-4 pt-2 pb-1 flex-shrink-0">
          <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: theme.textMuted }}>
            Posições Detalhadas
          </p>
        </div>

        {/* Scrollable table */}
        <div className="flex-1 overflow-auto min-h-0 scrollbar-hide">
          <table className="w-full" style={{ borderCollapse: 'collapse', fontSize: 10 }}>
            <thead>
              <tr style={{ background: theme.bgCard, position: 'sticky', top: 0, zIndex: 1 }}>
                {['#', 'Data e Hora', 'Endereço', 'Bateria', 'Latitude / Longitude', 'Velocidade', 'Ignição', 'Hodômetro', 'Motorista'].map((h) => (
                  <th
                    key={h}
                    className="px-2 py-2 text-left font-black uppercase tracking-wider whitespace-nowrap"
                    style={{ color: theme.textMuted, borderBottom: `1px solid ${theme.border}` }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {routeItems.map((item, idx) => {
                const speedKmh = Math.round((item.speed || 0) * 1.852);
                const ignition = item.attributes?.ignition;
                const battery = item.attributes?.batteryLevel ?? item.attributes?.battery;
                const odoVal = item.attributes?.totalDistance != null
                  ? `${(item.attributes.totalDistance / 1000).toFixed(1)} km`
                  : '--';
                const driver = item.attributes?.driverUniqueId || '--';
                const coord = `${item.latitude?.toFixed(5)}, ${item.longitude?.toFixed(5)}`;

                return (
                  <tr key={item.id} style={{ borderBottom: `1px solid ${theme.borderCard}` }}>
                    <td className="px-2 py-1.5 font-bold tabular-nums" style={{ color: theme.textMuted }}>
                      {idx + 1}
                    </td>
                    <td className="px-2 py-1.5 font-bold tabular-nums whitespace-nowrap" style={{ color: theme.textPrimary }}>
                      {dayjs(item.fixTime).format('DD/MM HH:mm:ss')}
                    </td>
                    <td
                      className="px-2 py-1.5"
                      style={{ color: theme.textSecondary, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {item.address || `${item.latitude?.toFixed(4)}, ${item.longitude?.toFixed(4)}`}
                    </td>
                    <td className="px-2 py-1.5 tabular-nums" style={{ color: theme.textSecondary }}>
                      {battery != null ? `${Math.round(Number(battery))}%` : '--'}
                    </td>
                    <td className="px-2 py-1.5 tabular-nums whitespace-nowrap" style={{ color: theme.textSecondary, fontFamily: 'monospace' }}>
                      {coord}
                    </td>
                    <td className="px-2 py-1.5 font-bold tabular-nums whitespace-nowrap" style={{ color: speedKmh > 0 ? theme.accent : theme.textMuted }}>
                      {speedKmh} km/h
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap" style={{ color: ignition ? '#22c55e' : theme.textMuted }}>
                      {ignition ? 'Ligada' : 'Desligada'}
                    </td>
                    <td className="px-2 py-1.5 tabular-nums" style={{ color: theme.textSecondary }}>
                      {odoVal}
                    </td>
                    <td className="px-2 py-1.5" style={{ color: theme.textSecondary }}>
                      {driver}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>,
    document.body,
  );
};

export default RouteReportOverlay;
