import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { CircularProgress } from '@mui/material';
import SpeedIcon from '@mui/icons-material/Speed';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import LocalPoliceIcon from '@mui/icons-material/LocalPolice';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

import { useTranslation } from '../common/components/LocalizationProvider';
import PwaPageLayout from '../common/components/PwaPageLayout';
import ReportFilter from './components/ReportFilter';
import { useCatch } from '../reactHelper';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { useHudTheme } from '../common/util/ThemeContext';
import { deviceEquality } from '../common/util/deviceEquality';
import { getMockReportData } from '../main/DemoController';

const DriverScoreReportPage = () => {
  const t = useTranslation();
  const { theme } = useHudTheme();
  
  const devices = useSelector((state) => state.devices.items, deviceEquality(['id', 'name']));

  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(false);

  const onShow = useCatch(async ({ deviceIds, groupIds, from, to }) => {
    setLoading(true);
    try {
      const isDemo = window.sessionStorage.getItem('demoMode') === 'true';
      let data = [];
      if (isDemo) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        data = getMockReportData('combined', deviceIds, from, to);
      } else {
        const query = new URLSearchParams({ from, to });
        deviceIds.forEach((deviceId) => query.append('deviceId', deviceId));
        groupIds.forEach((groupId) => query.append('groupId', groupId));
        const response = await fetchOrThrow(`/api/reports/combined?${query.toString()}`);
        data = await response.json();
      }

      // Calculate the scores
      const calculatedScores = data.map((item) => {
        let score = 100;
        let overspeedCount = 0;
        let alarmCount = 0;

        item.events.forEach((event) => {
          if (event.type === 'deviceOverspeed') {
            overspeedCount++;
            score -= 5;
          } else if (event.type === 'alarm') {
            alarmCount++;
            score -= 10;
          }
        });

        if (score < 0) score = 0;

        return {
          deviceId: item.deviceId,
          score,
          overspeedCount,
          alarmCount,
        };
      });

      // Sort by score descending
      calculatedScores.sort((a, b) => b.score - a.score);
      setScores(calculatedScores);
    } finally {
      setLoading(false);
    }
  });

  const getScoreColor = (score) => {
    if (score >= 90) return '#39ff14'; // Neon Green
    if (score >= 70) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return 'Excelente';
    if (score >= 70) return 'Atenção';
    return 'Requer Treinamento';
  };

  return (
    <PwaPageLayout title="Rank Eco-Driving">
      <div className="flex flex-col gap-6 pb-20">
        <ReportFilter onShow={onShow} deviceType="multiple" loading={loading} />

        <div className="flex flex-col gap-4">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-4">
               <CircularProgress size={32} sx={{ color: theme.accent }} />
               <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.textMuted }}>Analisando condutas...</span>
             </div>
          ) : scores.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center opacity-40 grayscale" style={{ color: theme.textMuted }}>
              <LocalPoliceIcon sx={{ fontSize: 40, mb: 1 }} />
              <span className="text-xs font-black uppercase tracking-widest">Nenhum dado avaliado</span>
            </div>
          ) : (
            scores.map((item, index) => {
              const color = getScoreColor(item.score);
              const deviceName = devices[item.deviceId]?.name || 'Veículo Desconhecido';
              const rank = index + 1;

              return (
                <div 
                  key={item.deviceId}
                  className="rounded-3xl p-5 shadow-lg border relative overflow-hidden transition-all"
                  style={{ background: theme.bgSecondary, borderColor: theme.borderCard }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-10 translate-x-10 -translate-y-10 rounded-full blur-2xl" style={{ background: color }} />
                  
                  <div className="flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center justify-center w-12 h-12 rounded-2xl shadow-inner border" style={{ background: theme.bg, borderColor: theme.border }}>
                        {rank === 1 ? (
                          <EmojiEventsIcon sx={{ color: '#fbbf24', fontSize: 24 }} />
                        ) : (
                          <span className="text-lg font-black" style={{ color: theme.textPrimary }}>#{rank}</span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black uppercase tracking-tighter" style={{ color: theme.textPrimary }}>{deviceName}</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest mt-1" style={{ color }}>{getScoreLabel(item.score)}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <div className="flex items-end gap-1">
                        <span className="text-3xl font-black leading-none" style={{ color }}>{item.score}</span>
                        <span className="text-[10px] font-bold uppercase pb-1" style={{ color: theme.textMuted }}>pts</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-6 relative z-10">
                    <div className="p-3 rounded-2xl shadow-inner border flex items-center gap-3" style={{ background: theme.bg, borderColor: theme.border }}>
                       <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: theme.bgSecondary, color: theme.textMuted }}>
                         <SpeedIcon sx={{ fontSize: 16 }} />
                       </div>
                       <div className="flex flex-col">
                         <span className="text-[10px] font-black" style={{ color: theme.textPrimary }}>{item.overspeedCount}</span>
                         <span className="text-[7px] font-bold uppercase tracking-widest" style={{ color: theme.textMuted }}>Excesso Vel.</span>
                       </div>
                    </div>
                    <div className="p-3 rounded-2xl shadow-inner border flex items-center gap-3" style={{ background: theme.bg, borderColor: theme.border }}>
                       <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: theme.bgSecondary, color: theme.textMuted }}>
                         <NotificationsActiveIcon sx={{ fontSize: 16 }} />
                       </div>
                       <div className="flex flex-col">
                         <span className="text-[10px] font-black" style={{ color: theme.textPrimary }}>{item.alarmCount}</span>
                         <span className="text-[7px] font-bold uppercase tracking-widest" style={{ color: theme.textMuted }}>Infrações/Alarmes</span>
                       </div>
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

export default DriverScoreReportPage;
