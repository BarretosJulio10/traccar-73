import { demoService } from '../core/services';
import { useMemo, useState } from 'react';
import { useCatch } from '../reactHelper';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { formatNumericHours } from '../common/util/formatter';
import ReportFilter, { updateReportParams } from './components/ReportFilter';
import { useTranslation } from '../common/components/LocalizationProvider';
import PwaPageLayout from '../common/components/PwaPageLayout';
import fetchOrThrow from '../common/util/fetchOrThrow';
import SelectField from '../common/components/SelectField';
import { deviceEquality } from '../common/util/deviceEquality';
import { getMockReportData } from '../main/DemoController';
import { getGeofenceTheme } from '../common/util/geofenceTypes';
import { useHudTheme } from '../common/util/ThemeContext';
import dayjs from 'dayjs';
import ReportTable from './components/ReportTable';
import { exportToPdf, exportToHtml, exportToXml } from './common/exportUtils';

const COLUMNS = ['Veículo', 'Cerca Virtual', 'Tipo', 'Entrada', 'Saída', 'Duração'];

const GeofenceReportPage = () => {
  const t = useTranslation();
  const { theme } = useHudTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const geofenceIds = useMemo(() => searchParams.getAll('geofenceId').map(Number), [searchParams]);

  const devices = useSelector((state) => state.devices.items, deviceEquality(['id', 'name']));
  const geofences = useSelector((state) => state.geofences.items);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filterInfo, setFilterInfo] = useState('');

  const onShow = useCatch(async ({ deviceIds, groupIds, from, to }) => {
    const isDemo = demoService.isActive();
    setLoading(true);
    const deviceNames = deviceIds.map((id) => devices[id]?.name).filter(Boolean).join(', ');
    setFilterInfo(`${deviceNames || 'Todos'} | ${dayjs(from).format('DD/MM/YYYY HH:mm')} – ${dayjs(to).format('DD/MM/YYYY HH:mm')}`);
    try {
      if (isDemo) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setItems(getMockReportData('geofences', deviceIds, from, to));
      } else {
        const query = new URLSearchParams({ from, to });
        deviceIds.forEach((deviceId) => query.append('deviceId', deviceId));
        groupIds.forEach((groupId) => query.append('groupId', groupId));
        geofenceIds.forEach((geofenceId) => query.append('geofenceId', geofenceId));
        const response = await fetchOrThrow(`/api/reports/geofences?${query.toString()}`, {
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
      items.map((item) => {
        const geofence = geofences[item.geofenceId];
        const gTheme = getGeofenceTheme(geofence?.attributes?.type);
        const duration = Date.parse(item.endTime) - Date.parse(item.startTime);
        return [
          devices[item.deviceId]?.name || String(item.deviceId),
          geofence?.name || String(item.geofenceId),
          gTheme.label,
          dayjs(item.startTime).format('DD/MM/YYYY HH:mm:ss'),
          dayjs(item.endTime).format('DD/MM/YYYY HH:mm:ss'),
          formatNumericHours(duration, t),
        ];
      }),
    [items, devices, geofences, t],
  );

  const displayRows = useMemo(
    () =>
      items.map((item) => {
        const geofence = geofences[item.geofenceId];
        const gTheme = getGeofenceTheme(geofence?.attributes?.type);
        const duration = Date.parse(item.endTime) - Date.parse(item.startTime);
        return [
          <span style={{ color: theme.textPrimary, fontWeight: 700 }}>{devices[item.deviceId]?.name || item.deviceId}</span>,
          <span style={{ color: '#8b5cf6' }}>{geofence?.name || '—'}</span>,
          <span style={{ color: gTheme.color, fontWeight: 700, fontSize: 10 }}>{gTheme.label}</span>,
          dayjs(item.startTime).format('DD/MM/YYYY HH:mm:ss'),
          dayjs(item.endTime).format('DD/MM/YYYY HH:mm:ss'),
          <span style={{ color: theme.accent, fontWeight: 700 }}>{formatNumericHours(duration, t)}</span>,
        ];
      }),
    [items, devices, geofences, theme, t],
  );

  const getTenantLogo = () => {
    try { return JSON.parse(localStorage.getItem('tenantConfig') || '{}').logoUrl || null; } catch { return null; }
  };

  const handleExportPdf = useCatch(async () => {
    setExporting(true);
    try {
      await exportToPdf({ title: 'Relatório de Cercas Virtuais', subtitle: filterInfo, columns: COLUMNS, rows: exportRows, logoUrl: getTenantLogo() });
    } finally {
      setExporting(false);
    }
  });

  const handleExportHtml = useCatch(async () => {
    setExporting(true);
    try {
      await exportToHtml({ title: 'Relatório de Cercas Virtuais', subtitle: filterInfo, columns: COLUMNS, rows: exportRows, logoUrl: getTenantLogo() });
    } finally {
      setExporting(false);
    }
  });

  const handleExportXml = () => exportToXml({ title: 'Relatório de Cercas Virtuais', subtitle: filterInfo, columns: COLUMNS, rows: exportRows });

  return (
    <PwaPageLayout title="Relatório de Cercas Virtuais">
      <div className="flex flex-col gap-4">
        <ReportFilter onShow={onShow} deviceType="multiple" loading={loading}>
          <div className="flex flex-col gap-1.5 px-1">
            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: theme.textMuted }}>Cercas</span>
            <SelectField
              value={geofenceIds}
              onChange={(e) => updateReportParams(searchParams, setSearchParams, 'geofenceId', e.target.value)}
              endpoint="/api/geofences"
              multiple
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': { borderRadius: '14px', background: theme.bg, color: theme.textPrimary },
                '& .MuiSelect-select': { py: 1.5, fontSize: '12px' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.border },
              }}
            />
          </div>
        </ReportFilter>

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

export default GeofenceReportPage;
