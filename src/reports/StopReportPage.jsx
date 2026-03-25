import { demoService } from '../core/services';
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Collapse } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';

import {
  formatDistance,
  formatNumericHours,
} from '../common/util/formatter';
import ReportFilter from './components/ReportFilter';
import { useAttributePreference } from '../common/util/preferences';
import { useTranslation } from '../common/components/LocalizationProvider';
import PwaPageLayout from '../common/components/PwaPageLayout';
import { useHudTheme } from '../common/util/ThemeContext';
import { useCatch } from '../reactHelper';
import MapPositions from '../map/MapPositions';
import MapView from '../map/core/MapView';
import MapCamera from '../map/MapCamera';
import MapGeofence from '../map/MapGeofence';
import MapScale from '../map/MapScale';
import fetchOrThrow from '../common/util/fetchOrThrow';
import dayjs from 'dayjs';
import { getMockReportData } from '../main/DemoController';
import ReportTable from './components/ReportTable';
import { exportToPdf, exportToHtml, exportToXml } from './common/exportUtils';

const COLUMNS = ['Veículo', 'Chegada', 'Saída', 'Duração', 'Endereço', 'Odômetro'];

const StopReportPage = () => {
  const t = useTranslation();
  const { theme } = useHudTheme();

  const devices = useSelector((state) => state.devices.items);
  const distanceUnit = useAttributePreference('distanceUnit');

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [filterInfo, setFilterInfo] = useState('');
  const [mapExpanded, setMapExpanded] = useState(false);

  const onShow = useCatch(async ({ deviceIds, groupIds, from, to }) => {
    const isDemo = demoService.isActive();
    setLoading(true);
    setSelectedItem(null);
    const deviceNames = deviceIds.map((id) => devices[id]?.name).filter(Boolean).join(', ');
    setFilterInfo(`${deviceNames || 'Todos'} | ${dayjs(from).format('DD/MM/YYYY HH:mm')} – ${dayjs(to).format('DD/MM/YYYY HH:mm')}`);
    try {
      if (isDemo) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setItems(getMockReportData('stops', deviceIds, from, to));
      } else {
        const query = new URLSearchParams({ from, to });
        deviceIds.forEach((deviceId) => query.append('deviceId', deviceId));
        groupIds.forEach((groupId) => query.append('groupId', groupId));
        const response = await fetchOrThrow(`/api/reports/stops?${query.toString()}`, {
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
        dayjs(item.startTime).format('DD/MM/YYYY HH:mm:ss'),
        dayjs(item.endTime).format('DD/MM/YYYY HH:mm:ss'),
        formatNumericHours(item.duration, t),
        item.address || '',
        formatDistance(item.startOdometer, distanceUnit, t),
      ]),
    [items, devices, distanceUnit, t],
  );

  const displayRows = useMemo(
    () =>
      items.map((item) => [
        <span style={{ color: theme.textPrimary, fontWeight: 700 }}>{devices[item.deviceId]?.name || item.deviceId}</span>,
        dayjs(item.startTime).format('DD/MM/YYYY HH:mm:ss'),
        dayjs(item.endTime).format('DD/MM/YYYY HH:mm:ss'),
        <span style={{ color: '#f97316', fontWeight: 700 }}>{formatNumericHours(item.duration, t)}</span>,
        item.address ? (
          <button
            onClick={() => { setSelectedItem(item); setShowMap(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            style={{ color: theme.accent, fontSize: 10, textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none' }}
          >
            {item.address}
          </button>
        ) : '—',
        formatDistance(item.startOdometer, distanceUnit, t),
      ]),
    [items, devices, distanceUnit, theme, t],
  );

  const getTenantLogo = () => {
    try { return JSON.parse(localStorage.getItem('tenantConfig') || '{}').logoUrl || null; } catch { return null; }
  };

  const handleExportPdf = useCatch(async () => {
    setExporting(true);
    try {
      await exportToPdf({ title: 'Relatório de Paradas', subtitle: filterInfo, columns: COLUMNS, rows: exportRows, logoUrl: getTenantLogo() });
    } finally {
      setExporting(false);
    }
  });

  const handleExportHtml = useCatch(async () => {
    setExporting(true);
    try {
      await exportToHtml({ title: 'Relatório de Paradas', subtitle: filterInfo, columns: COLUMNS, rows: exportRows, logoUrl: getTenantLogo() });
    } finally {
      setExporting(false);
    }
  });

  const handleExportXml = () => exportToXml({ title: 'Relatório de Paradas', subtitle: filterInfo, columns: COLUMNS, rows: exportRows });

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
    <PwaPageLayout title="Relatório de Paradas" actions={headerActions}>
      <div className="flex flex-col gap-4">
        <ReportFilter onShow={onShow} deviceType="multiple" loading={loading} />

        <Collapse in={showMap}>
          <div
            className="mb-2 rounded-3xl overflow-hidden shadow border border-white/5 relative transition-all duration-300"
            style={{ height: mapExpanded ? '70vh' : '35vh', minHeight: mapExpanded ? 400 : 200, maxHeight: mapExpanded ? 600 : 300 }}
          >
            <MapView>
              <MapGeofence />
              {selectedItem && (
                <MapPositions
                  positions={[{
                    deviceId: selectedItem.deviceId,
                    fixTime: selectedItem.startTime,
                    latitude: selectedItem.latitude,
                    longitude: selectedItem.longitude,
                  }]}
                  titleField="fixTime"
                />
              )}
            </MapView>
            <div className="absolute right-3 bottom-3"><MapScale /></div>
            {selectedItem && <MapCamera latitude={selectedItem.latitude} longitude={selectedItem.longitude} />}
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
            emptyText="Nenhuma parada encontrada. Selecione um período e clique em Mostrar."
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

export default StopReportPage;
