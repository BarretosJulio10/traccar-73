import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Collapse } from '@mui/material';
import FenceIcon from '@mui/icons-material/Fence';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import HistoryIcon from '@mui/icons-material/History';
import TableRowsIcon from '@mui/icons-material/TableRows';

import { formatNumericHours, formatTime } from '../common/util/formatter';
import ReportFilter, { updateReportParams } from './components/ReportFilter';
import { useTranslation } from '../common/components/LocalizationProvider';
import PwaPageLayout from '../common/components/PwaPageLayout';
import ColumnSelect from './components/ColumnSelect';
import usePersistedState from '../common/util/usePersistedState';
import fetchOrThrow from '../common/util/fetchOrThrow';
import SelectField from '../common/components/SelectField';
import { deviceEquality } from '../common/util/deviceEquality';
import { getMockReportData } from '../main/DemoController';
import { getGeofenceTheme } from '../common/util/geofenceTypes';
import { useHudTheme } from '../common/util/ThemeContext';

const columnsArray = [
  ['geofenceId', 'sharedGeofence'],
  ['startTime', 'reportStartTime'],
  ['endTime', 'reportEndTime'],
  ['duration', 'reportDuration'],
];
const columnsMap = new Map(columnsArray);

const GeofenceReportPage = () => {
  const t = useTranslation();
  const { theme: appTheme } = useHudTheme();

  const [searchParams, setSearchParams] = useSearchParams();
  const geofenceIds = useMemo(() => searchParams.getAll('geofenceId').map(Number), [searchParams]);

  const devices = useSelector((state) => state.devices.items, deviceEquality(['id', 'name']));
  const geofences = useSelector((state) => state.geofences.items);

  const [columns, setColumns] = usePersistedState('geofenceColumns', [
    'geofenceId',
    'startTime',
    'endTime',
  ]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const onShow = useCatch(async ({ deviceIds, groupIds, from, to }) => {
    const isDemo = window.sessionStorage.getItem('demoMode') === 'true';
    setLoading(true);
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

  const formatValue = (item, key) => {
    switch (key) {
      case 'geofenceId':
        return geofences[item.geofenceId]?.name || item.geofenceId;
      case 'startTime':
      case 'endTime':
        return formatTime(item[key], 'minutes');
      case 'duration':
        return formatNumericHours(Date.parse(item.endTime) - Date.parse(item.startTime), t);
      default:
        return item[key];
    }
  };

  return (
    <PwaPageLayout title={t('sharedGeofences')}>
      <div className="flex flex-col gap-6">

        <ReportFilter onShow={onShow} deviceType="multiple" loading={loading}>
          <div className="flex flex-col gap-1.5 px-1">
            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: appTheme.textMuted }}>Cercas</span>
            <SelectField
              value={geofenceIds}
              onChange={(e) => updateReportParams(searchParams, setSearchParams, 'geofenceId', e.target.value)}
              endpoint="/api/geofences"
              multiple
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': { borderRadius: '14px', background: appTheme.bg, color: appTheme.textPrimary },
                '& .MuiSelect-select': { py: 1.5, fontSize: '12px' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: appTheme.border }
              }}
            />
          </div>
          <ColumnSelect columns={columns} setColumns={setColumns} columnsArray={columnsArray} />
        </ReportFilter>

        {/* Results List */}
        <div className="flex flex-col gap-4 pb-10">
          {items.map((item) => {
            const itemId = `${item.deviceId}_${item.geofenceId}_${item.startTime}_${item.endTime}`;
            const isExpanded = expandedId === itemId;
            const geofence = geofences[item.geofenceId];
            const theme = getGeofenceTheme(geofence?.attributes?.type);
            const IconComponent = theme.icon;

            return (
              <div
                key={itemId}
                className={`rounded-3xl overflow-hidden shadow-md border transition-all duration-300 ${isExpanded ? 'ring-1' : ''}`}
                style={{
                  ...isExpanded ? { '--tw-ring-color': theme.color + '4D' } : {},
                  background: appTheme.bgSecondary,
                  borderColor: isExpanded ? theme.color : appTheme.borderCard
                }}
              >
                <div
                  className="p-5 flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : itemId)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner" style={{ background: appTheme.bg, color: theme.color, boxShadow: `inset 2px 2px 5px rgba(0,0,0,0.1), 0 0 8px ${theme.color}33` }}>
                      <IconComponent sx={{ fontSize: 18 }} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-tighter" style={{ color: appTheme.textPrimary }}>
                        {devices[item.deviceId]?.name || 'Desconhecido'}
                      </span>
                      <span className="text-[8px] font-bold uppercase tracking-widest mt-0.5" style={{ color: appTheme.textMuted }}>
                        {geofence?.name || 'Cerca Desconhecida'}
                      </span>
                      {geofence?.attributes?.type && (
                        <span className="text-[7px] font-bold uppercase mt-1" style={{ color: theme.color }}>
                          {theme.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.color }}>
                        {formatNumericHours(Date.parse(item.endTime) - Date.parse(item.startTime), t)}
                      </span>
                      <span className="text-[7px] font-bold uppercase mt-0.5" style={{ color: theme.color + '99' }}>Permanência</span>
                    </div>
                    {isExpanded ? <ExpandLessIcon sx={{ fontSize: 16, color: theme.color }} /> : <ExpandMoreIcon sx={{ fontSize: 16, color: appTheme.textMuted }} />}
                  </div>
                </div>

                <Collapse in={isExpanded}>
                  <div className="px-5 pb-5 pt-2 flex flex-col gap-4 border-t" style={{ borderColor: appTheme.border, background: appTheme.bg }}>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div className="p-3 rounded-2xl shadow-inner border" style={{ background: appTheme.bgSecondary, borderColor: appTheme.border }}>
                        <div className="flex items-center gap-2 mb-1">
                          <HistoryIcon sx={{ fontSize: 12, color: appTheme.accent }} />
                          <p className="text-[7px] font-bold uppercase" style={{ color: appTheme.textMuted }}>Entrada</p>
                        </div>
                        <p className="text-[10px] font-black uppercase" style={{ color: appTheme.textPrimary }}>{formatTime(item.startTime, 'seconds')}</p>
                      </div>
                      <div className="p-3 rounded-2xl shadow-inner border" style={{ background: appTheme.bgSecondary, borderColor: appTheme.border }}>
                        <div className="flex items-center gap-2 mb-1">
                          <HistoryIcon sx={{ fontSize: 12, color: '#ef4444' }} />
                          <p className="text-[7px] font-bold uppercase" style={{ color: appTheme.textMuted }}>Saída</p>
                        </div>
                        <p className="text-[10px] font-black uppercase" style={{ color: appTheme.textPrimary }}>{formatTime(item.endTime, 'seconds')}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-2xl border" style={{ background: appTheme.bgSecondary, borderColor: appTheme.border }}>
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center shadow-inner"
                        style={{ background: appTheme.bg, color: appTheme.textMuted }}
                      >
                        <AccessTimeIcon sx={{ fontSize: 16 }} />
                      </div>
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-widest leading-none" style={{ color: appTheme.textMuted }}>Duração Total</p>
                        <p className="text-[10px] font-bold mt-1" style={{ color: appTheme.accent }}>
                          {formatNumericHours(Date.parse(item.endTime) - Date.parse(item.startTime), t)} de utilização da cerca.
                        </p>
                      </div>
                    </div>
                  </div>
                </Collapse>
              </div>
            );
          })}

          {!loading && items.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center opacity-40 grayscale" style={{ color: appTheme.textMuted }}>
              <TableRowsIcon sx={{ fontSize: 40, mb: 1 }} />
              <span className="text-xs font-black uppercase tracking-widest">Nenhum dado</span>
            </div>
          )}
        </div>
      </div>
    </PwaPageLayout>
  );
};

export default GeofenceReportPage;
