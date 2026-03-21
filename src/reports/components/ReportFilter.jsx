import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import { useTranslation } from '../../common/components/LocalizationProvider';
import SelectField from '../../common/components/SelectField';
import { useRestriction } from '../../common/util/permissions';
import { deviceEquality } from '../../common/util/deviceEquality';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import { useHudTheme } from '../../common/util/ThemeContext';

export const updateReportParams = (searchParams, setSearchParams, key, values) => {
  const newParams = new URLSearchParams(searchParams);
  newParams.delete(key);
  newParams.delete('from');
  newParams.delete('to');
  values.forEach((value) => newParams.append(key, value));
  setSearchParams(newParams, { replace: true });
};

const ReportFilter = ({ children, onShow, onExport, loading, deviceType }) => {
  const t = useTranslation();
  const { theme } = useHudTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const readonly = useRestriction('readonly');

  const devices = useSelector((state) => state.devices.items, deviceEquality(['id', 'name']));
  const deviceList = useMemo(
    () => Object.values(devices).sort((a, b) => a.name.localeCompare(b.name)),
    [devices],
  );

  const deviceIds = useMemo(() => searchParams.getAll('deviceId').map(Number), [searchParams]);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const [period, setPeriod] = useState('today');
  const [customFrom, setCustomFrom] = useState(
    dayjs().subtract(1, 'hour').locale('en').format('YYYY-MM-DDTHH:mm'),
  );
  const [customTo, setCustomTo] = useState(dayjs().locale('en').format('YYYY-MM-DDTHH:mm'));

  const disabled = (deviceType === 'single' && !deviceIds.length) || loading;

  useEffect(() => {
    if (from && to) {
      onShow({ deviceIds, from, to });
    }
  }, [deviceIds, from, to]);

  const showReport = () => {
    let selectedFrom;
    let selectedTo;
    switch (period) {
      case 'today':
        selectedFrom = dayjs().startOf('day');
        selectedTo = dayjs().endOf('day');
        break;
      case 'yesterday':
        selectedFrom = dayjs().subtract(1, 'day').startOf('day');
        selectedTo = dayjs().subtract(1, 'day').endOf('day');
        break;
      case 'thisWeek':
        selectedFrom = dayjs().startOf('week');
        selectedTo = dayjs().endOf('week');
        break;
      case 'thisMonth':
        selectedFrom = dayjs().startOf('month');
        selectedTo = dayjs().endOf('month');
        break;
      default:
        selectedFrom = dayjs(customFrom, 'YYYY-MM-DDTHH:mm');
        selectedTo = dayjs(customTo, 'YYYY-MM-DDTHH:mm');
        break;
    }

    const newParams = new URLSearchParams(searchParams);
    newParams.set('from', selectedFrom.toISOString());
    newParams.set('to', selectedTo.toISOString());
    setSearchParams(newParams, { replace: true });
  };

  return (
    <div 
      className="p-5 rounded-3xl shadow-[6px_6px_12px_rgba(0,0,0,0.1)] border mb-8 flex flex-col gap-5 overflow-hidden transition-colors duration-500"
      style={{ background: theme.bgSecondary, borderColor: theme.borderCard }}
    >
      <div className="flex items-center gap-3">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center shadow-inner"
          style={{ background: theme.bg, color: theme.accent }}
        >
          <FilterAltIcon sx={{ fontSize: 16 }} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[2px]" style={{ color: theme.textPrimary }}>
          Configurar Relatório
        </span>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] font-black uppercase tracking-widest px-1" style={{ color: theme.textMuted }}>Dispositivos</span>
          <SelectField
            data={deviceList}
            value={deviceType === 'multiple' ? deviceIds : deviceIds.find(() => true)}
            onChange={(e) => {
              const values = deviceType === 'multiple' ? e.target.value : [e.target.value].filter((id) => id);
              updateReportParams(searchParams, setSearchParams, 'deviceId', values);
            }}
            multiple={deviceType === 'multiple'}
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': { borderRadius: '14px', background: theme.bg },
              '& .MuiSelect-select': { py: 1.5, fontSize: '12px', color: theme.textPrimary }
            }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] font-black uppercase tracking-widest px-1" style={{ color: theme.textMuted }}>Período</span>
          <FormControl fullWidth size="small">
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              sx={{
                borderRadius: '14px',
                background: theme.bg,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.border },
                '& .MuiSelect-select': { py: 1.5, fontSize: '12px', color: theme.textPrimary },
                boxShadow: theme.isDark ? 'inset 2px 2px 5px rgba(0,0,0,0.3)' : 'inset 1px 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <MenuItem value="today">{t('reportToday')}</MenuItem>
              <MenuItem value="yesterday">{t('reportYesterday')}</MenuItem>
              <MenuItem value="thisWeek">{t('reportThisWeek')}</MenuItem>
              <MenuItem value="thisMonth">{t('reportThisMonth')}</MenuItem>
              <MenuItem value="custom">{t('reportCustom')}</MenuItem>
            </Select>
          </FormControl>
        </div>

        {period === 'custom' && (
          <div 
            className="grid grid-cols-1 gap-4 mt-2 p-4 rounded-2xl border"
            style={{ background: theme.bg, borderColor: theme.border }}
          >
            <TextField
              label={t('reportFrom')}
              type="datetime-local"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true, style: { color: theme.textMuted } }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', background: theme.bgSecondary, color: theme.textPrimary } }}
            />
            <TextField
              label={t('reportTo')}
              type="datetime-local"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true, style: { color: theme.textMuted } }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', background: theme.bgSecondary, color: theme.textPrimary } }}
            />
          </div>
        )}
      </div>

      {children && (
        <div className="flex flex-col gap-4 pt-2 border-t mt-2" style={{ borderColor: theme.border }}>
          {children}
        </div>
      )}

      <button
        disabled={disabled}
        onClick={showReport}
        className={`w-full h-11 rounded-2xl flex items-center justify-center font-black uppercase tracking-[1.5px] text-[10px] transition-all duration-300 mt-1 shadow-md`}
        style={disabled ? {
          background: theme.bg,
          color: theme.textMuted,
          boxShadow: 'none'
        } : {
          background: theme.accent,
          color: '#fff',
        }}
      >
        {t(loading ? 'sharedLoading' : 'reportShow')}
      </button>

      {onExport && (
        <button
          disabled={disabled}
          onClick={() => onExport('excel')}
          className="w-full h-10 rounded-xl flex items-center justify-center font-bold uppercase tracking-widest text-[9px] border transition-colors duration-300"
          style={{
            borderColor: theme.border,
            color: theme.textMuted,
            opacity: disabled ? 0.5 : 1
          }}
        >
          Exportar Excel
        </button>
      )}
    </div>
  );
};

export default ReportFilter;
