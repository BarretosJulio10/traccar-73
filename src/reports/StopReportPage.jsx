import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Collapse, CircularProgress, IconButton } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import TimerIcon from '@mui/icons-material/Timer';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';

import {
  formatDistance,
  formatTime,
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

const StopReportPage = () => {
  const navigate = useNavigate();
  const t = useTranslation();
  const { theme } = useHudTheme();

  const devices = useSelector((state) => state.devices.items);
  const distanceUnit = useAttributePreference('distanceUnit');

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [showMap, setShowMap] = useState(false);

  const onShow = useCatch(async ({ deviceIds, groupIds, from, to }) => {
    const isDemo = window.sessionStorage.getItem('demoMode') === 'true';
    setLoading(true);
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

  const headerActions = (
    <button
      onClick={() => setShowMap(!showMap)}
      className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-[4px_4px_10px_rgba(0,0,0,0.1)] transition-all duration-300 active:shadow-inner"
      style={{
        background: theme.bgSecondary,
        color: showMap ? theme.accent : theme.textMuted,
        border: `1px solid ${theme.border}`
      }}
    >
      <MapIcon sx={{ fontSize: 20 }} />
    </button>
  );

  return (
    <PwaPageLayout title="Relatório de Paradas" actions={headerActions}>
      <div className="flex flex-col gap-4">

        {/* Map View */}
        <Collapse in={showMap}>
          <div className="h-[35vh] min-h-[200px] max-h-[300px] mb-6 rounded-3xl overflow-hidden shadow-[inset_4px_4px_10px_rgba(0,0,0,0.5)] border border-white/5 relative">
            <MapView>
              <MapGeofence />
              {selectedItem && (
                <MapPositions
                  positions={[
                    {
                      deviceId: selectedItem.deviceId,
                      fixTime: selectedItem.startTime,
                      latitude: selectedItem.latitude,
                      longitude: selectedItem.longitude,
                    },
                  ]}
                  titleField="fixTime"
                />
              )}
            </MapView>
            <div className="absolute right-3 bottom-3"><MapScale /></div>
            {selectedItem && <MapCamera latitude={selectedItem.latitude} longitude={selectedItem.longitude} />}
          </div>
        </Collapse>

        <ReportFilter onShow={onShow} deviceType="multiple" loading={loading} />

        {/* Stops List */}
        <div className="flex flex-col gap-4 pb-20">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <CircularProgress size={32} sx={{ color: '#39ff14' }} />
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Identificando Paradas...</span>
            </div>
          ) : items.length === 0 ? (
            <div 
              className="p-10 rounded-3xl border flex flex-col items-center justify-center gap-3 shadow-sm transition-colors"
              style={{ background: theme.bgSecondary, borderColor: theme.border }}
            >
              <TimerIcon sx={{ fontSize: 40, color: theme.textMuted, opacity: 0.5 }} />
              <p className="text-xs font-bold uppercase tracking-widest text-center" style={{ color: theme.textMuted }}>Nenhuma parada registrada.</p>
            </div>
          ) : (
            items.map((item) => {
              const isExpanded = expandedId === item.positionId;
              const isSelected = selectedItem?.positionId === item.positionId;
              const deviceName = devices[item.deviceId]?.name || 'Veículo';

              return (
                <div
                  key={item.positionId}
                  className="rounded-2xl overflow-hidden shadow-md border transition-colors duration-300"
                  style={{
                    background: theme.bgSecondary,
                    borderColor: isSelected ? theme.accent : theme.border,
                    boxShadow: isSelected ? `0 0 0 1px ${theme.accent}` : theme.sidebarShadow
                  }}
                >
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer"
                    onClick={() => {
                      setExpandedId(isExpanded ? null : item.positionId);
                      setSelectedItem(item);
                    }}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner"
                        style={{ background: theme.bg, color: '#ff3939' }}
                      >
                        <TimerIcon sx={{ fontSize: 20 }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black uppercase tracking-tighter" style={{ color: theme.textPrimary }}>
                            Parado: {formatNumericHours(item.duration, t)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <DirectionsCarIcon sx={{ fontSize: 10, color: theme.accent, opacity: 0.7 }} />
                          <span className="text-[9px] font-bold uppercase tracking-widest truncate" style={{ color: theme.textMuted }}>{deviceName}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-slate-200">{dayjs(item.startTime).format('HH:mm')}</span>
                        <span className="text-[7px] font-bold text-slate-600 uppercase">Chegada</span>
                      </div>
                      <IconButton size="small" className="text-slate-600">
                        {isExpanded ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
                      </IconButton>
                    </div>
                  </div>

                  <Collapse in={isExpanded}>
                    <div className="px-5 pb-5 pt-1 flex flex-col gap-4 border-t" style={{ borderColor: theme.border, background: theme.bg }}>
                      <div className="flex flex-col gap-4 mt-3">
                        <div className="flex items-start gap-3">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center shadow-inner mt-1"
                            style={{ background: theme.bgSecondary, color: theme.textMuted }}
                          >
                            <LocationOnIcon sx={{ fontSize: 16 }} />
                          </div>
                          <div>
                            <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: theme.textMuted }}>Local da Parada</p>
                            <p className="text-[10px] font-medium leading-tight mt-0.5" style={{ color: theme.textPrimary }}>
                              {item.address || 'Endereço indisponível'}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-xl shadow-inner border flex flex-col gap-1" style={{ background: theme.bgSecondary, borderColor: theme.border }}>
                            <div className="flex items-center gap-2">
                              <AccessTimeIcon sx={{ fontSize: 12, color: theme.accent }} />
                              <p className="text-[8px] font-bold uppercase" style={{ color: theme.textMuted }}>Saída</p>
                            </div>
                            <p className="text-[11px] font-black" style={{ color: theme.textPrimary }}>{dayjs(item.endTime).format('HH:mm:ss')}</p>
                          </div>
                          <div className="p-3 rounded-xl shadow-inner border flex flex-col gap-1" style={{ background: theme.bgSecondary, borderColor: theme.border }}>
                            <div className="flex items-center gap-2">
                              <AccessTimeIcon sx={{ fontSize: 12, color: theme.accent }} />
                              <p className="text-[8px] font-bold uppercase" style={{ color: theme.textMuted }}>Odômetro</p>
                            </div>
                            <p className="text-[11px] font-black" style={{ color: theme.textPrimary }}>{formatDistance(item.startOdometer, distanceUnit, t)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItem(item);
                            setShowMap(true);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="px-6 py-2.5 rounded-xl shadow-md border text-[9px] font-black uppercase tracking-widest transition-colors"
                          style={{
                            background: theme.bgSecondary,
                            borderColor: theme.borderCard,
                            color: theme.accent
                          }}
                        >
                          Ver no Mapa
                        </button>
                        <span className="text-[9px] font-medium uppercase" style={{ color: theme.textMuted }}>Posição #{item.positionId}</span>
                      </div>
                    </div>
                  </Collapse>
                </div>
              );
            })
          )}
        </div>
      </div>
    </PwaPageLayout>
  );
};

export default StopReportPage;
