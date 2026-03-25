import { Fragment, useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Collapse } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';

import ReportFilter from './components/ReportFilter';
import PwaPageLayout from '../common/components/PwaPageLayout';
import { useHudTheme } from '../common/util/ThemeContext';
import { useCatch } from '../reactHelper';
import MapView from '../map/core/MapView';
import MapRoutePath from '../map/MapRoutePath';
import MapRoutePoints from '../map/MapRoutePoints';
import MapPositions from '../map/MapPositions';
import MapCamera from '../map/MapCamera';
import MapGeofence from '../map/MapGeofence';
import MapScale from '../map/MapScale';
import fetchOrThrow from '../common/util/fetchOrThrow';
import dayjs from 'dayjs';
import { getMockReportData } from '../main/DemoController';
import ReportTable from './components/ReportTable';
import { exportToPdf, exportToHtml, exportToXml } from './common/exportUtils';

const COLUMNS = ['Veículo', 'Data', 'Hora', 'Velocidade', 'Endereço', 'Latitude', 'Longitude'];

const PositionsReportPage = () => {
  const { theme } = useHudTheme();
  const devices = useSelector((state) => state.devices.items);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [filterInfo, setFilterInfo] = useState('');
  const [mapExpanded, setMapExpanded] = useState(false);

  const onMapPointClick = useCallback(
    (positionId) => {
      const item = items.find((it) => it.id === positionId);
      setSelectedItem(item);
      setShowMap(true);
    },
    [items],
  );

  const onShow = useCatch(async ({ deviceIds, from, to }) => {
    const isDemo = window.sessionStorage.getItem('demoMode') === 'true';
    setLoading(true);
    const deviceNames = deviceIds.map((id) => devices[id]?.name).filter(Boolean).join(', ');
    setFilterInfo(`${deviceNames || 'Todos'} | ${dayjs(from).format('DD/MM/YYYY HH:mm')} – ${dayjs(to).format('DD/MM/YYYY HH:mm')}`);
    try {
      if (isDemo) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setItems(getMockReportData('positions', deviceIds, from, to));
      } else {
        const query = new URLSearchParams({ from, to });
        deviceIds.forEach((deviceId) => query.append('deviceId', deviceId));
        const response = await fetchOrThrow(`/api/positions?${query.toString()}`, {
          headers: { Accept: 'application/json' },
        });
        setItems(await response.json());
      }
    } finally {
      setLoading(false);
    }
  });

  const exportRows = useMemo(
    () =>
      items.map((item) => [
        devices[item.deviceId]?.name || String(item.deviceId),
        dayjs(item.fixTime).format('DD/MM/YYYY'),
        dayjs(item.fixTime).format('HH:mm:ss'),
        `${(item.speed * 1.852).toFixed(0)} km/h`,
        item.address || '',
        item.latitude?.toFixed(5) || '',
        item.longitude?.toFixed(5) || '',
      ]),
    [items, devices],
  );

  const displayRows = useMemo(
    () =>
      items.map((item) => [
        <span style={{ color: theme.textPrimary, fontWeight: 700 }}>{devices[item.deviceId]?.name || item.deviceId}</span>,
        dayjs(item.fixTime).format('DD/MM/YYYY'),
        dayjs(item.fixTime).format('HH:mm:ss'),
        <span style={{ color: theme.accent, fontWeight: 700 }}>{(item.speed * 1.852).toFixed(0)} km/h</span>,
        item.address ? (
          <button
            onClick={() => { setSelectedItem(item); setShowMap(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            style={{ color: theme.accent, fontSize: 10, textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none' }}
          >
            {item.address}
          </button>
        ) : '—',
        item.latitude?.toFixed(5),
        item.longitude?.toFixed(5),
      ]),
    [items, devices, theme],
  );

  const getTenantLogo = () => {
    try { return JSON.parse(localStorage.getItem('tenantConfig') || '{}').logoUrl || null; } catch { return null; }
  };

  const handleExportPdf = useCatch(async () => {
    setExporting(true);
    try {
      await exportToPdf({ title: 'Relatório de Percurso', subtitle: filterInfo, columns: COLUMNS, rows: exportRows, logoUrl: getTenantLogo() });
    } finally {
      setExporting(false);
    }
  });

  const handleExportHtml = useCatch(async () => {
    setExporting(true);
    try {
      await exportToHtml({ title: 'Relatório de Percurso', subtitle: filterInfo, columns: COLUMNS, rows: exportRows, logoUrl: getTenantLogo() });
    } finally {
      setExporting(false);
    }
  });

  const handleExportXml = () => exportToXml({ title: 'Relatório de Percurso', subtitle: filterInfo, columns: COLUMNS, rows: exportRows });

  const headerActions = (
    <button
      onClick={() => setShowMap((v) => !v)}
      className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-md transition-all duration-300 active:scale-95"
      style={{ background: theme.bgSecondary, color: showMap ? theme.accent : theme.textMuted, border: `1px solid ${theme.border}` }}
    >
      <MapIcon sx={{ fontSize: 20 }} />
    </button>
  );

  return (
    <PwaPageLayout title="Relatório de Percurso" actions={headerActions}>
      <div className="flex flex-col gap-4">
        <ReportFilter onShow={onShow} deviceType="single" loading={loading} />

        <Collapse in={showMap}>
          <div
            className="mb-2 rounded-3xl overflow-hidden shadow border border-white/5 relative transition-all duration-300"
            style={{ height: mapExpanded ? '70vh' : '35vh', minHeight: mapExpanded ? 400 : 200, maxHeight: mapExpanded ? 600 : 300 }}
          >
            <MapView>
              <MapGeofence />
              {[...new Set(items.map((it) => it.deviceId))].map((deviceId) => {
                const positions = items.filter((p) => p.deviceId === deviceId);
                return (
                  <Fragment key={deviceId}>
                    <MapRoutePath positions={positions} />
                    <MapRoutePoints positions={positions} onClick={onMapPointClick} />
                  </Fragment>
                );
              })}
              {selectedItem && <MapPositions positions={[selectedItem]} titleField="fixTime" />}
            </MapView>
            <div className="absolute right-3 bottom-3"><MapScale /></div>
            {items.length > 0 && <MapCamera positions={items} />}
            <button
              onClick={() => setMapExpanded((v) => !v)}
              className="absolute left-3 top-3 w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-md shadow transition-all active:scale-95"
              style={{ background: `${theme.bg}CC`, color: theme.textMuted, border: `1px solid ${theme.border}` }}
              title={mapExpanded ? 'Diminuir mapa' : 'Expandir mapa'}
            >
              {mapExpanded ? <CloseFullscreenIcon sx={{ fontSize: 14 }} /> : <OpenInFullIcon sx={{ fontSize: 14 }} />}
            </button>
          </div>
        </Collapse>

        <div className="pb-20">
          <ReportTable
            columns={COLUMNS}
            rows={displayRows}
            loading={loading}
            emptyText="Nenhum percurso encontrado. Selecione um dispositivo, período e clique em Mostrar."
            onExportPdf={handleExportPdf}
            onExportHtml={handleExportHtml}
            onExportXml={handleExportXml}
            exporting={exporting}
          />
        </div>
      </div>
    </PwaPageLayout>
  );
};

export default PositionsReportPage;
