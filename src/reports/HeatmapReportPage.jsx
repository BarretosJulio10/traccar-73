import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CircularProgress } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';

import { useTranslation } from '../common/components/LocalizationProvider';
import PwaPageLayout from '../common/components/PwaPageLayout';
import ReportFilter from './components/ReportFilter';
import { useCatch } from '../reactHelper';
import MapView from '../map/core/MapView';
import MapGeofence from '../map/MapGeofence';
import MapScale from '../map/MapScale';
import MapCamera from '../map/MapCamera';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { useHudTheme } from '../common/util/ThemeContext';
import MapHeatmap from '../map/MapHeatmap';

const HeatmapReportPage = () => {
  const t = useTranslation();
  const { theme } = useHudTheme();
  const [searchParams] = useSearchParams();

  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);

  const onShow = useCatch(async ({ deviceIds, groupIds, from, to }) => {
    setLoading(true);
    setPositions([]);
    try {
      const isDemo = window.sessionStorage.getItem('demoMode') === 'true';
      if (isDemo) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        // Mock points around a center
        const mockPositions = Array.from({ length: 500 }).map((_, i) => ({
          latitude: -23.5505 + (Math.random() - 0.5) * 0.1,
          longitude: -46.6333 + (Math.random() - 0.5) * 0.1,
        }));
        setPositions(mockPositions);
        return;
      }

      const query = new URLSearchParams({ from, to });
      deviceIds.forEach((deviceId) => query.append('deviceId', deviceId));
      groupIds.forEach((groupId) => query.append('groupId', groupId));
      
      const response = await fetchOrThrow(`/api/reports/route?${query.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      const data = await response.json();
      setPositions(data);
    } finally {
      setLoading(false);
    }
  });

  return (
    <PwaPageLayout title="Mapa de Calor (Heatmap)">
      <div className="flex flex-col gap-4 pb-10">
        <ReportFilter onShow={onShow} deviceType="multiple" loading={loading} />

        <div 
          className="h-[45vh] min-h-[260px] max-h-[500px] rounded-3xl overflow-hidden shadow-md border relative transition-colors"
          style={{ borderColor: theme.border, background: theme.bgSecondary }}
        >
          {loading ? (
             <div className="flex flex-col items-center justify-center w-full h-full gap-4">
               <CircularProgress size={32} sx={{ color: theme.accent }} />
               <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.textMuted }}>Carregando dados...</span>
             </div>
          ) : (
            <>
              <MapView>
                <MapGeofence />
                {positions.length > 0 && <MapHeatmap positions={positions} />}
              </MapView>
              <div className="absolute right-3 bottom-0"><MapScale /></div>
              {positions.length > 0 && <MapCamera latitude={positions[0].latitude} longitude={positions[0].longitude} />}
            </>
          )}

          {!loading && positions.length === 0 && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center backdrop-blur-sm z-10 transition-colors" style={{ background: theme.isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)', color: theme.textMuted }}>
              <MapIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
              <span className="text-xs font-black uppercase tracking-widest opacity-80">Sem dados para heat map</span>
            </div>
          )}
        </div>
      </div>
    </PwaPageLayout>
  );
};

export default HeatmapReportPage;
