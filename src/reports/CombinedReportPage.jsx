import { demoService } from '../core/services';
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Collapse } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';

import ReportFilter from './components/ReportFilter';
import { useTranslation } from '../common/components/LocalizationProvider';
import PwaPageLayout from '../common/components/PwaPageLayout';
import { useHudTheme } from '../common/util/ThemeContext';
import { useCatch } from '../reactHelper';
import MapView from '../map/core/MapView';
import MapCamera from '../map/MapCamera';
import MapGeofence from '../map/MapGeofence';
import MapMarkers from '../map/MapMarkers';
import MapRouteCoordinates from '../map/MapRouteCoordinates';
import MapScale from '../map/MapScale';
import { prefixString } from '../common/util/stringUtils';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { deviceEquality } from '../common/util/deviceEquality';
import { getMockReportData } from '../main/DemoController';
import dayjs from 'dayjs';
import ReportTable from './components/ReportTable';
import { exportToPdf, exportToHtml, exportToXml } from './common/exportUtils';

const COLUMNS = ['Veículo', 'Data', 'Hora', 'Evento', 'Endereço'];

const CombinedReportPage = () => {
  const t = useTranslation();
  const { theme } = useHudTheme();
  const devices = useSelector((state) => state.devices.items, deviceEquality(['id', 'name']));

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [filterInfo, setFilterInfo] = useState('');
  const [mapExpanded, setMapExpanded] = useState(false);

  const itemsCoordinates = useMemo(() => items.flatMap((item) => item.route), [items]);

  const createMarkers = () =>
    items.flatMap((item) =>
      item.events
        .map((event) => item.positions.find((p) => event.positionId === p.id))
        .filter((position) => position != null)
        .map((position) => ({ latitude: position.latitude, longitude: position.longitude })),
    );

  // Flatten combined data: one row per event
  const flatEvents = useMemo(
    () =>
      items.flatMap((item) =>
        item.events.map((event) => ({
          deviceId: item.deviceId,
          event,
          position: item.positions.find((p) => p.id === event.positionId) || null,
        })),
      ),
    [items],
  );

  const onShow = useCatch(async ({ deviceIds, groupIds, from, to }) => {
    const isDemo = demoService.isActive();
    setLoading(true);
    const deviceNames = deviceIds.map((id) => devices[id]?.name).filter(Boolean).join(', ');
    setFilterInfo(`${deviceNames || 'Todos'} | ${dayjs(from).format('DD/MM/YYYY HH:mm')} – ${dayjs(to).format('DD/MM/YYYY HH:mm')}`);
    try {
      if (isDemo) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setItems(getMockReportData('combined', deviceIds, from, to));
        setShowMap(true);
      } else {
        const query = new URLSearchParams({ from, to });
        deviceIds.forEach((deviceId) => query.append('deviceId', deviceId));
        groupIds.forEach((groupId) => query.append('groupId', groupId));
        const response = await fetchOrThrow(`/api/reports/combined?${query.toString()}`);
        const result = await response.json();
        setItems(result);
        if (result.length > 0) setShowMap(true);
      }
    } finally {
      setLoading(false);
    }
  });

  const exportRows = useMemo(
    () =>
      flatEvents.map(({ deviceId, event, position }) => [
        devices[deviceId]?.name || String(deviceId),
        dayjs(event.eventTime).format('DD/MM/YYYY'),
        dayjs(event.eventTime).format('HH:mm:ss'),
        t(prefixString('event', event.type)),
        position?.address || '',
      ]),
    [flatEvents, devices, t],
  );

  const displayRows = useMemo(
    () =>
      flatEvents.map(({ deviceId, event, position }) => [
        <span style={{ color: theme.textPrimary, fontWeight: 700 }}>{devices[deviceId]?.name || deviceId}</span>,
        dayjs(event.eventTime).format('DD/MM/YYYY'),
        dayjs(event.eventTime).format('HH:mm:ss'),
        <span style={{ color: theme.accent, fontWeight: 700, fontSize: 10 }}>{t(prefixString('event', event.type))}</span>,
        position ? (
          <button
            onClick={() => { setSelectedPosition(position); setShowMap(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            style={{ color: theme.accent, fontSize: 10, textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none' }}
          >
            {position.address || 'Ver no mapa'}
          </button>
        ) : '—',
      ]),
    [flatEvents, devices, theme, t],
  );

  const getTenantLogo = () => {
    try { return JSON.parse(localStorage.getItem('tenantConfig') || '{}').logoUrl || null; } catch { return null; }
  };

  const handleExportPdf = useCatch(async () => {
    setExporting(true);
    try {
      await exportToPdf({ title: 'Relatório Combinado', subtitle: filterInfo, columns: COLUMNS, rows: exportRows, logoUrl: getTenantLogo() });
    } finally {
      setExporting(false);
    }
  });

  const handleExportHtml = useCatch(async () => {
    setExporting(true);
    try {
      await exportToHtml({ title: 'Relatório Combinado', subtitle: filterInfo, columns: COLUMNS, rows: exportRows, logoUrl: getTenantLogo() });
    } finally {
      setExporting(false);
    }
  });

  const handleExportXml = () => exportToXml({ title: 'Relatório Combinado', subtitle: filterInfo, columns: COLUMNS, rows: exportRows });

  const actionButtons = (
    <button
      onClick={() => setShowMap((v) => !v)}
      className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-md transition-all duration-300 active:scale-95"
      style={{ background: theme.bgSecondary, color: showMap ? theme.accent : theme.textMuted, border: `1px solid ${theme.border}` }}
    >
      <MapIcon sx={{ fontSize: 20 }} />
    </button>
  );

  return (
    <PwaPageLayout title={t('reportCombined')} actions={actionButtons}>
      <div className="flex flex-col gap-4">
        <ReportFilter onShow={onShow} deviceType="multiple" loading={loading} />

        <Collapse in={showMap && items.length > 0}>
          <div
            className="mb-2 rounded-3xl overflow-hidden shadow border border-white/5 relative transition-all duration-300"
            style={{ height: mapExpanded ? '70vh' : '35vh', minHeight: mapExpanded ? 400 : 200, maxHeight: mapExpanded ? 600 : 300 }}
          >
            <MapView>
              <MapGeofence />
              {items.map((item) => (
                <MapRouteCoordinates
                  key={item.deviceId}
                  name={devices[item.deviceId]?.name}
                  coordinates={item.route}
                  deviceId={item.deviceId}
                />
              ))}
              <MapMarkers markers={createMarkers()} />
            </MapView>
            <div className="absolute right-3 bottom-3"><MapScale /></div>
            <MapCamera
              coordinates={itemsCoordinates}
              latitude={selectedPosition?.latitude}
              longitude={selectedPosition?.longitude}
            />
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
            emptyText="Nenhum dado encontrado. Selecione um período e clique em Mostrar."
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

export default CombinedReportPage;
