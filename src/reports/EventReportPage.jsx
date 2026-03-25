import { demoService } from '../core/services';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Collapse } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import { useSelector } from 'react-redux';
import { prefixString } from '../common/util/stringUtils';
import { useTranslation } from '../common/components/LocalizationProvider';
import PwaPageLayout from '../common/components/PwaPageLayout';
import { useCatch } from '../reactHelper';
import { useHudTheme } from '../common/util/ThemeContext';
import MapView from '../map/core/MapView';
import MapGeofence from '../map/MapGeofence';
import MapPositions from '../map/MapPositions';
import MapCamera from '../map/MapCamera';
import MapScale from '../map/MapScale';
import fetchOrThrow from '../common/util/fetchOrThrow';
import dayjs from 'dayjs';
import { getMockReportData } from '../main/DemoController';
import ReportFilter, { updateReportParams } from './components/ReportFilter';
import ReportTable from './components/ReportTable';
import { exportToPdf, exportToHtml, exportToXml } from './common/exportUtils';
import { FormControl, Select, MenuItem } from '@mui/material';

const COLUMNS = ['Veículo', 'Data', 'Hora', 'Tipo de Evento', 'Cerca Virtual', 'Endereço'];

const formatEventType = (type, t) => {
  const key = prefixString('event', type);
  const translated = t(key);
  return translated !== key ? translated : type;
};

const EventReportPage = () => {
  const t = useTranslation();
  const { theme } = useHudTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  const devices = useSelector((state) => state.devices.items);
  const geofences = useSelector((state) => state.geofences.items);

  const [allEventTypes, setAllEventTypes] = useState([['allEvents', 'eventAll']]);
  const eventTypes = useMemo(() => searchParams.getAll('eventType'), [searchParams]);

  const [items, setItems] = useState([]);
  const [positions, setPositions] = useState({});
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapPosition, setMapPosition] = useState(null);
  const [filterInfo, setFilterInfo] = useState('');
  const [mapExpanded, setMapExpanded] = useState(false);

  useEffect(() => {
    if (!eventTypes.length) {
      updateReportParams(searchParams, setSearchParams, 'eventType', ['allEvents']);
    }
  }, [searchParams, setSearchParams, eventTypes]);

  useEffect(() => {
    const isDemo = demoService.isActive();
    if (isDemo) {
      setAllEventTypes([
        ['allEvents', 'eventAll'],
        ['deviceOverspeed', t('demoOverspeed')],
        ['geofenceEnter', t('demoGeofenceEnter')],
        ['geofenceExit', t('demoGeofenceExit')],
        ['alarm', t('demoAlarmSos')],
      ]);
      return;
    }
    fetchOrThrow('/api/notifications/types')
      .then((r) => r.json())
      .then((types) =>
        setAllEventTypes([
          ['allEvents', 'eventAll'],
          ...types.map((it) => [it.type, prefixString('event', it.type)]),
        ]),
      )
      .catch(() => {});
  }, []);

  const onShow = useCatch(async ({ deviceIds, from, to }) => {
    const isDemo = demoService.isActive();
    setMapPosition(null);
    setLoading(true);
    const deviceNames = deviceIds
      .map((id) => devices[id]?.name)
      .filter(Boolean)
      .join(', ');
    setFilterInfo(
      `${deviceNames || 'Todos'} | ${dayjs(from).format('DD/MM/YYYY HH:mm')} – ${dayjs(to).format('DD/MM/YYYY HH:mm')}`,
    );
    try {
      if (isDemo) {
        await new Promise((r) => setTimeout(r, 800));
        const events = getMockReportData('events', deviceIds, from, to);
        setItems(events);
        const pMap = {};
        events.forEach((e) => {
          if (e.positionId) {
            pMap[e.positionId] = { id: e.positionId, deviceId: e.deviceId, latitude: e.latitude, longitude: e.longitude, address: e.address, fixTime: e.eventTime };
          }
        });
        setPositions(pMap);
      } else {
        const query = new URLSearchParams({ from, to });
        deviceIds.forEach((id) => query.append('deviceId', id));
        eventTypes.forEach((it) => query.append('type', it));
        const response = await fetchOrThrow(`/api/reports/events?${query}`, { headers: { Accept: 'application/json' } });
        const events = await response.json();
        setItems(events);
        const posIds = [...new Set(events.map((e) => e.positionId).filter(Boolean))];
        if (posIds.length) {
          const pQuery = new URLSearchParams();
          posIds.slice(0, 100).forEach((id) => pQuery.append('id', id));
          const pRes = await fetchOrThrow(`/api/positions?${pQuery}`);
          const pArr = await pRes.json();
          const pMap = {};
          pArr.forEach((p) => (pMap[p.id] = p));
          setPositions(pMap);
        }
      }
    } finally {
      setLoading(false);
    }
  });

  // Build plain-text rows for export
  const exportRows = useMemo(
    () =>
      items.map((item) => [
        devices[item.deviceId]?.name || String(item.deviceId),
        dayjs(item.eventTime).format('DD/MM/YYYY'),
        dayjs(item.eventTime).format('HH:mm:ss'),
        formatEventType(item.type, t),
        item.geofenceId > 0 ? (geofences[item.geofenceId]?.name || String(item.geofenceId)) : '',
        positions[item.positionId]?.address || '',
      ]),
    [items, devices, geofences, positions, t],
  );

  // Build display rows (can include styled JSX in the cell)
  const displayRows = useMemo(
    () =>
      items.map((item) => {
        const pos = positions[item.positionId];
        return [
          <span style={{ color: theme.textPrimary, fontWeight: 700 }}>{devices[item.deviceId]?.name || item.deviceId}</span>,
          dayjs(item.eventTime).format('DD/MM/YYYY'),
          dayjs(item.eventTime).format('HH:mm:ss'),
          <span style={{ color: theme.accent, fontWeight: 700, fontSize: 10 }}>{formatEventType(item.type, t)}</span>,
          item.geofenceId > 0 ? <span style={{ color: '#8b5cf6' }}>{geofences[item.geofenceId]?.name || '—'}</span> : '—',
          pos ? (
            <button
              onClick={() => { setMapPosition(pos); setShowMap(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              style={{ color: theme.accent, fontSize: 10, textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none' }}
            >
              {pos.address || 'Ver no mapa'}
            </button>
          ) : (positions[item.positionId] ? 'Endereço indisponível' : '—'),
        ];
      }),
    [items, devices, geofences, positions, theme, t],
  );

  const getTenantLogo = () => {
    try { return JSON.parse(localStorage.getItem('tenantConfig') || '{}').logoUrl || null; } catch { return null; }
  };

  const handleExportPdf = useCatch(async () => {
    setExporting(true);
    try {
      await exportToPdf({
        title: 'Relatório de Eventos',
        subtitle: filterInfo,
        columns: COLUMNS,
        rows: exportRows,
        logoUrl: getTenantLogo(),
      });
    } finally {
      setExporting(false);
    }
  });

  const handleExportHtml = useCatch(async () => {
    setExporting(true);
    try {
      await exportToHtml({ title: 'Relatório de Eventos', subtitle: filterInfo, columns: COLUMNS, rows: exportRows, logoUrl: getTenantLogo() });
    } finally {
      setExporting(false);
    }
  });

  const handleExportXml = () => {
    exportToXml({ title: 'Relatório de Eventos', subtitle: filterInfo, columns: COLUMNS, rows: exportRows });
  };

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
    <PwaPageLayout title="Eventos e Alertas" actions={headerActions}>
      <div className="flex flex-col gap-4">
        {/* Filter */}
        <ReportFilter onShow={onShow} deviceType="multiple" loading={loading}>
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] font-black uppercase tracking-widest px-1" style={{ color: theme.textMuted }}>
              Tipo de Evento
            </span>
            <FormControl fullWidth size="small">
              <Select
                multiple
                value={eventTypes}
                onChange={(e) =>
                  updateReportParams(searchParams, setSearchParams, 'eventType', typeof e.target.value === 'string' ? [e.target.value] : e.target.value)
                }
                sx={{
                  borderRadius: '14px',
                  background: theme.bg,
                  '& .MuiSelect-select': { py: 1.5, fontSize: '12px', color: theme.textPrimary },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.border },
                }}
                renderValue={(selected) => selected.map((s) => t(s)).join(', ')}
              >
                {allEventTypes.map(([value, label]) => (
                  <MenuItem key={value} value={value}>{t(label)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        </ReportFilter>

        {/* Map */}
        <Collapse in={showMap}>
          <div
            className="mb-2 rounded-3xl overflow-hidden shadow border border-white/5 relative transition-all duration-300"
            style={{ height: mapExpanded ? '70vh' : '35vh', minHeight: mapExpanded ? 400 : 200, maxHeight: mapExpanded ? 600 : 300 }}
          >
            <MapView>
              <MapGeofence />
              {mapPosition && <MapPositions positions={[mapPosition]} titleField="fixTime" />}
            </MapView>
            <div className="absolute right-3 bottom-3"><MapScale /></div>
            {mapPosition && <MapCamera latitude={mapPosition.latitude} longitude={mapPosition.longitude} />}
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

        {/* Table */}
        <div className="pb-20">
          <ReportTable
            columns={COLUMNS}
            rows={displayRows}
            loading={loading}
            emptyText="Nenhum evento encontrado. Selecione um período e clique em Mostrar."
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

export default EventReportPage;
