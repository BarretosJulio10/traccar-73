import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import StraightenIcon from '@mui/icons-material/Straighten';
import SpeedIcon from '@mui/icons-material/Speed';
import TimerIcon from '@mui/icons-material/Timer';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

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

const SummaryReportPage = () => {
  const navigate = useNavigate();
  const t = useTranslation();
  const { theme } = useHudTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  const devices = useSelector((state) => state.devices.items);
  const distanceUnit = useAttributePreference('distanceUnit');
  const speedUnit = useAttributePreference('speedUnit');

  const daily = searchParams.get('daily') === 'true';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const onShow = useCatch(async ({ deviceIds, groupIds, from, to }) => {
    const isDemo = window.sessionStorage.getItem('demoMode') === 'true';
    setLoading(true);
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
              className="rounded-xl shadow-inner transition-colors"
              style={{ background: theme.bgSecondary, color: theme.textPrimary }}
              sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.border } }}
            >
              <MenuItem value={false}>{t('reportSummary')}</MenuItem>
              <MenuItem value>{t('reportDaily')}</MenuItem>
            </Select>
          </FormControl>
        </ReportFilter>

        {/* Summary List */}
        <div className="flex flex-col gap-4 pb-20">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <CircularProgress size={32} sx={{ color: '#39ff14' }} />
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Calculando Resumo...</span>
            </div>
          ) : items.length === 0 ? (
            <div 
              className="p-10 rounded-3xl border flex flex-col items-center justify-center gap-3 shadow-sm transition-colors"
              style={{ background: theme.bgSecondary, borderColor: theme.border }}
            >
              <AssessmentIcon sx={{ fontSize: 40, color: theme.textMuted, opacity: 0.5 }} />
              <p className="text-xs font-bold uppercase tracking-widest text-center" style={{ color: theme.textMuted }}>Nenhum dado disponível.</p>
            </div>
          ) : (
            items.map((item, index) => {
              const deviceName = devices[item.deviceId]?.name || 'Veículo';
              return (
                <div
                  key={`${item.deviceId}_${index}`}
                  className="rounded-3xl p-5 shadow-md border transition-colors duration-300"
                  style={{ background: theme.bgSecondary, borderColor: theme.borderCard }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner"
                        style={{ background: theme.bg, color: theme.accent }}
                      >
                        <DirectionsCarIcon sx={{ fontSize: 20 }} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-tighter" style={{ color: theme.textPrimary }}>{deviceName}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <AccessTimeIcon sx={{ fontSize: 10, color: theme.accent, opacity: 0.8 }} />
                          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: theme.textMuted }}>
                            {daily ? dayjs(item.startTime).format('DD [de] MMMM') : 'Período Selecionado'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-2xl shadow-inner border transition-colors" style={{ background: theme.bg, borderColor: theme.border }}>
                      <div className="flex items-center gap-2 mb-1">
                        <StraightenIcon sx={{ fontSize: 12, color: theme.accent }} />
                        <p className="text-[8px] font-bold uppercase" style={{ color: theme.textMuted }}>Distância</p>
                      </div>
                      <p className="text-[14px] font-black" style={{ color: theme.textPrimary }}>{formatDistance(item.distance, distanceUnit, t)}</p>
                    </div>
                    <div className="p-3 rounded-2xl shadow-inner border transition-colors" style={{ background: theme.bg, borderColor: theme.border }}>
                      <div className="flex items-center gap-2 mb-1">
                        <TimerIcon sx={{ fontSize: 12, color: theme.accent }} />
                        <p className="text-[8px] font-bold uppercase" style={{ color: theme.textMuted }}>Horas Motor</p>
                      </div>
                      <p className="text-[14px] font-black" style={{ color: theme.textPrimary }}>{formatNumericHours(item.engineHours || 0, t)}</p>
                    </div>
                    <div className="p-3 rounded-2xl shadow-inner border transition-colors" style={{ background: theme.bg, borderColor: theme.border }}>
                      <div className="flex items-center gap-2 mb-1">
                        <SpeedIcon sx={{ fontSize: 12, color: theme.accent }} />
                        <p className="text-[8px] font-bold uppercase" style={{ color: theme.textMuted }}>Velo. Média</p>
                      </div>
                      <p className="text-[14px] font-black" style={{ color: theme.textPrimary }}>{formatSpeed(item.averageSpeed, speedUnit, t)}</p>
                    </div>
                    <div className="p-3 rounded-2xl shadow-inner border transition-colors" style={{ background: theme.bg, borderColor: theme.border }}>
                      <div className="flex items-center gap-2 mb-1">
                        <SpeedIcon sx={{ fontSize: 12, color: theme.accent }} />
                        <p className="text-[8px] font-bold uppercase" style={{ color: theme.textMuted }}>Velo. Máxima</p>
                      </div>
                      <p className="text-[14px] font-black" style={{ color: theme.textPrimary }}>{formatSpeed(item.maxSpeed, speedUnit, t)}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </PwaPageLayout>
  );
};

export default SummaryReportPage;
