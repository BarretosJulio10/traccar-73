import { demoService } from '../core/services';
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';

import {
  formatDistance,
  formatSpeed,
  formatNumericHours,
} from '../common/util/formatter';
import ReportFilter, { updateReportParams } from './components/ReportFilter';
import { useAttributePreference } from '../common/util/preferences';
import { useTranslation } from '../common/components/LocalizationProvider';
import PwaPageLayout from '../common/components/PwaPageLayout';
import { useHudTheme } from '../common/util/ThemeContext';
import { useCatch } from '../reactHelper';
import fetchOrThrow from '../common/util/fetchOrThrow';
import dayjs from 'dayjs';
import { getMockReportData } from '../main/DemoController';
import ReportTable from './components/ReportTable';
import { exportToPdf, exportToHtml, exportToXml } from './common/exportUtils';

const COLUMNS = ['Veículo', 'Data', 'Distância', 'Horas Motor', 'Vel. Média', 'Vel. Máx'];

const SummaryReportPage = () => {
  const t = useTranslation();
  const { theme } = useHudTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  const devices = useSelector((state) => state.devices.items);
  const distanceUnit = useAttributePreference('distanceUnit');
  const speedUnit = useAttributePreference('speedUnit');

  const daily = searchParams.get('daily') === 'true';
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
        setItems(getMockReportData('summary', deviceIds, from, to));
      } else {
        const query = new URLSearchParams({ from, to, daily });
        deviceIds.forEach((deviceId) => query.append('deviceId', deviceId));
        groupIds.forEach((groupId) => query.append('groupId', groupId));
        const response = await fetchOrThrow(`/api/reports/summary?${query.toString()}`, {
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
        daily && item.startTime ? dayjs(item.startTime).format('DD/MM/YYYY') : 'Período',
        formatDistance(item.distance, distanceUnit, t),
        formatNumericHours(item.engineHours || 0, t),
        formatSpeed(item.averageSpeed, speedUnit, t),
        formatSpeed(item.maxSpeed, speedUnit, t),
      ]),
    [items, devices, distanceUnit, speedUnit, daily, t],
  );

  const displayRows = useMemo(
    () =>
      items.map((item) => [
        <span style={{ color: theme.textPrimary, fontWeight: 700 }}>{devices[item.deviceId]?.name || item.deviceId}</span>,
        daily && item.startTime ? dayjs(item.startTime).format('DD/MM/YYYY') : 'Período',
        <span style={{ color: theme.accent, fontWeight: 700 }}>{formatDistance(item.distance, distanceUnit, t)}</span>,
        formatNumericHours(item.engineHours || 0, t),
        formatSpeed(item.averageSpeed, speedUnit, t),
        formatSpeed(item.maxSpeed, speedUnit, t),
      ]),
    [items, devices, distanceUnit, speedUnit, daily, theme, t],
  );

  const getTenantLogo = () => {
    try { return JSON.parse(localStorage.getItem('tenantConfig') || '{}').logoUrl || null; } catch { return null; }
  };

  const handleExportPdf = useCatch(async () => {
    setExporting(true);
    try {
      await exportToPdf({ title: 'Resumo Geral', subtitle: filterInfo, columns: COLUMNS, rows: exportRows, logoUrl: getTenantLogo() });
    } finally {
      setExporting(false);
    }
  });

  const handleExportHtml = useCatch(async () => {
    setExporting(true);
    try {
      await exportToHtml({ title: 'Resumo Geral', subtitle: filterInfo, columns: COLUMNS, rows: exportRows, logoUrl: getTenantLogo() });
    } finally {
      setExporting(false);
    }
  });

  const handleExportXml = () => exportToXml({ title: 'Resumo Geral', subtitle: filterInfo, columns: COLUMNS, rows: exportRows });

  return (
    <PwaPageLayout title="Resumo Geral">
      <div className="flex flex-col gap-4">
        <ReportFilter onShow={onShow} deviceType="multiple" loading={loading}>
          <FormControl fullWidth size="small">
            <InputLabel style={{ color: theme.textMuted }}>{t('sharedType')}</InputLabel>
            <Select
              label={t('sharedType')}
              value={daily}
              onChange={(e) => updateReportParams(searchParams, setSearchParams, 'daily', [String(e.target.value)])}
              sx={{
                borderRadius: '14px',
                background: theme.bg,
                '& .MuiSelect-select': { py: 1.5, fontSize: '12px', color: theme.textPrimary },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.border },
              }}
            >
              <MenuItem value={false}>{t('reportSummary')}</MenuItem>
              <MenuItem value>{t('reportDaily')}</MenuItem>
            </Select>
          </FormControl>
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

export default SummaryReportPage;
