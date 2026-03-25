import { demoService } from '../core/services';
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Collapse } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';

import {
  formatDistance,
  formatSpeed,
  formatNumericHours,
} from '../common/util/formatter';
import ReportFilter from './components/ReportFilter';
import { useAttributePreference } from '../common/util/preferences';
import { useTranslation } from '../common/components/LocalizationProvider';
import PwaPageLayout from '../common/components/PwaPageLayout';
import { useHudTheme } from '../common/util/ThemeContext';
import { useCatch, useEffectAsync } from '../reactHelper';
import MapView from '../map/core/MapView';
import MapRoutePath from '../map/MapRoutePath';
import MapMarkers from '../map/MapMarkers';
import MapCamera from '../map/MapCamera';
import MapGeofence from '../map/MapGeofence';
import MapScale from '../map/MapScale';
import fetchOrThrow from '../common/util/fetchOrThrow';
import dayjs from 'dayjs';
import { getMockReportData } from '../main/DemoController';
import ReportTable from './components/ReportTable';
import { exportToPdf, exportToHtml, exportToXml } from './common/exportUtils';

const COLUMNS = ['Veículo', 'Data', 'Início', 'Fim', 'Distância', 'Duração', 'Vel. Média', 'Vel. Máx', 'End. Partida', 'End. Chegada'];

const TripReportPage = () => {
  const t = useTranslation();
  const { theme } = useHudTheme();

  const devices = useSelector((state) => state.devices.items);
  const distanceUnit = useAttributePreference('distanceUnit');
  const speedUnit = useAttributePreference('speedUnit');

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [route, setRoute] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [filterInfo, setFilterInfo] = useState('');
  const [mapExpanded, setMapExpanded] = useState(false);

  const createMarkers = () =>
    selectedItem
      ? [
          { latitude: selectedItem.startLat, longitude: selectedItem.startLon, image: 'start-success' },
          { latitude: selectedItem.endLat, longitude: selectedItem.endLon, image: 'finish-error' },
        ]
      : [];

  useEffectAsync(async () => {
    const isDemo = demoService.isActive();
    if (selectedItem) {
      if (isDemo) {
        setRoute([
          { latitude: selectedItem.startLat, longitude: selectedItem.startLon },
          { latitude: selectedItem.endLat, longitude: selectedItem.endLon },
        ]);
      } else {
        const query = new URLSearchParams({
          deviceId: selectedItem.deviceId,
          from: selectedItem.startTime,
          to: selectedItem.endTime,
        });
        const response = await fetchOrThrow(`/api/reports/route?${query.toString()}`, {
          headers: { Accept: 'application/json' },
        });
        setRoute(await response.json());
      }
    } else {
      setRoute(null);
    }
  }, [selectedItem]);

  const onShow = useCatch(async ({ deviceIds, groupIds, from, to }) => {
    const isDemo = demoService.isActive();
    setLoading(true);
    setSelectedItem(null);
    const deviceNames = deviceIds.map((id) => devices[id]?.name).filter(Boolean).join(', ');
    setFilterInfo(`${deviceNames || 'Todos'} | ${dayjs(from).format('DD/MM/YYYY HH:mm')} – ${dayjs(to).format('DD/MM/YYYY HH:mm')}`);
    try {
      if (isDemo) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setItems(getMockReportData('trips', deviceIds, from, to));
      } else {
        const query = new URLSearchParams({ from, to });
        deviceIds.forEach((deviceId) => query.append('deviceId', deviceId));
        groupIds.forEach((groupId) => query.append('groupId', groupId));
        const response = await fetchOrThrow(`/api/reports/trips?${query.toString()}`, {
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
        dayjs(item.startTime).format('DD/MM/YYYY'),
        dayjs(item.startTime).format('HH:mm:ss'),
        dayjs(item.endTime).format('HH:mm:ss'),
        formatDistance(item.distance, distanceUnit, t),
        formatNumericHours(item.duration, t),
        formatSpeed(item.averageSpeed, speedUnit, t),
        formatSpeed(item.maxSpeed, speedUnit, t),
        item.startAddress || '',
        item.endAddress || '',
      ]),
    [items, devices, distanceUnit, speedUnit, t],
  );

  const displayRows = useMemo(
    () =>
      items.map((item) => [
        <span style={{ color: theme.textPrimary, fontWeight: 700 }}>{devices[item.deviceId]?.name || item.deviceId}</span>,
        dayjs(item.startTime).format('DD/MM/YYYY'),
        dayjs(item.startTime).format('HH:mm:ss'),
        dayjs(item.endTime).format('HH:mm:ss'),
        <span style={{ color: theme.accent, fontWeight: 700 }}>{formatDistance(item.distance, distanceUnit, t)}</span>,
        formatNumericHours(item.duration, t),
        formatSpeed(item.averageSpeed, speedUnit, t),
        formatSpeed(item.maxSpeed, speedUnit, t),
        <button
          onClick={() => { setSelectedItem(item); setShowMap(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          style={{ color: theme.accent, fontSize: 10, textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none' }}
        >
          {item.startAddress || 'Ver no mapa'}
        </button>,
        item.endAddress || '—',
      ]),
    [items, devices, distanceUnit, speedUnit, theme, t],
  );

  const getTenantLogo = () => {
    try { return JSON.parse(localStorage.getItem('tenantConfig') || '{}').logoUrl || null; } catch { return null; }
  };

  const handleExportPdf = useCatch(async () => {
    setExporting(true);
    try {
      await exportToPdf({ title: 'Relatório de Viagens', subtitle: filterInfo, columns: COLUMNS, rows: exportRows, logoUrl: getTenantLogo() });
    } finally {
      setExporting(false);
    }
  });

  const handleExportHtml = useCatch(async () => {
    setExporting(true);
    try {
      await exportToHtml({ title: 'Relatório de Viagens', subtitle: filterInfo, columns: COLUMNS, rows: exportRows, logoUrl: getTenantLogo() });
    } finally {
      setExporting(false);
    }
  });

  const handleExportXml = () => exportToXml({ title: 'Relatório de Viagens', subtitle: filterInfo, columns: COLUMNS, rows: exportRows });

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
    <PwaPageLayout title="Relatório de Viagens" actions={headerActions}>
      <div className="flex flex-col gap-4">
        <ReportFilter onShow={onShow} deviceType="multiple" loading={loading} />

        <Collapse in={showMap}>
          <div
            className="mb-2 rounded-3xl overflow-hidden shadow border border-white/5 relative transition-all duration-300"
            style={{ height: mapExpanded ? '70vh' : '35vh', minHeight: mapExpanded ? 400 : 200, maxHeight: mapExpanded ? 600 : 300 }}
          >
            <MapView>
              <MapGeofence />
              {route && (
                <>
                  <MapRoutePath positions={route} />
                  <MapMarkers markers={createMarkers()} />
                  <MapCamera positions={route} />
                </>
              )}
            </MapView>
            <div className="absolute right-3 bottom-3"><MapScale /></div>
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
            emptyText="Nenhuma viagem encontrada. Selecione um período e clique em Mostrar."
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

export default TripReportPage;
