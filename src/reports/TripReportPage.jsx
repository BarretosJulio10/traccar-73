import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Collapse, CircularProgress, IconButton } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import RouteIcon from '@mui/icons-material/Route';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import StraightenIcon from '@mui/icons-material/Straighten';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import SpeedIcon from '@mui/icons-material/Speed';

import {
  formatDistance,
  formatSpeed,
  formatNumericHours,
} from '../common/util/formatter';
import ReportFilter from './components/ReportFilter';
import { useAttributePreference } from '../common/util/preferences';
import { useTranslation } from '../common/components/LocalizationProvider';
import PwaPageLayout from '../common/components/PwaPageLayout';
import { useHudTheme } from '../common/util/ThemeContext';
import { useCatch, useEffectAsync } from '../reactHelper';
import MapView from '../map/core/MapView';
import MapRoutePath from '../map/MapRoutePath';
import MapMarkers from '../map/MapMarkers';
import MapCamera from '../map/MapCamera';
import MapGeofence from '../map/MapGeofence';
import MapScale from '../map/MapScale';
import fetchOrThrow from '../common/util/fetchOrThrow';
import dayjs from 'dayjs';
import { getMockReportData } from '../main/DemoController';

const TripReportPage = () => {
  const navigate = useNavigate();
  const t = useTranslation();
  const { theme } = useHudTheme();

  const devices = useSelector((state) => state.devices.items);
  const distanceUnit = useAttributePreference('distanceUnit');
  const speedUnit = useAttributePreference('speedUnit');

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [route, setRoute] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [showMap, setShowMap] = useState(false);

  const createMarkers = () => [
    {
      latitude: selectedItem.startLat,
      longitude: selectedItem.startLon,
      image: 'start-success',
    },
    {
      latitude: selectedItem.endLat,
      longitude: selectedItem.endLon,
      image: 'finish-error',
    },
  ];

  useEffectAsync(async () => {
    const isDemo = window.sessionStorage.getItem('demoMode') === 'true';
    if (selectedItem) {
      if (isDemo) {
        setRoute([
          { latitude: selectedItem.startLat, longitude: selectedItem.startLon },
          { latitude: selectedItem.endLat, longitude: selectedItem.endLon },
        ]);
      } else {
        const query = new URLSearchParams({
          deviceId: selectedItem.deviceId,
          from: selectedItem.startTime,
          to: selectedItem.endTime,
        });
        const response = await fetchOrThrow(`/api/reports/route?${query.toString()}`, {
          headers: { Accept: 'application/json' },
        });
        setRoute(await response.json());
      }
    } else {
      setRoute(null);
    }
  }, [selectedItem]);

  const onShow = useCatch(async ({ deviceIds, groupIds, from, to }) => {
    const isDemo = window.sessionStorage.getItem('demoMode') === 'true';
    setLoading(true);
    try {
      if (isDemo) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setItems(getMockReportData('trips', deviceIds, from, to));
      } else {
        const query = new URLSearchParams({ from, to });
        deviceIds.forEach((deviceId) => query.append('deviceId', deviceId));
        groupIds.forEach((groupId) => query.append('groupId', groupId));
        const response = await fetchOrThrow(`/api/reports/trips?${query.toString()}`, {
          headers: { Accept: 'application/json' },
        });
        setItems(await response.json());
      }
    } finally {
      setLoading(false);
    }
  });

  const navigateToReplay = (item) => {
    navigate({
      pathname: '/replay',
      search: new URLSearchParams({
        from: item.startTime,
        to: item.endTime,
        deviceId: item.deviceId,
      }).toString(),
    });
  };

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
    <PwaPageLayout title="Relatório de Viagens" actions={headerActions}>
      <div className="flex flex-col gap-4">

        {/* Map View */}
        <Collapse in={showMap}>
          <div className="h-[280px] mb-6 rounded-3xl overflow-hidden shadow-[inset_4px_4px_10px_rgba(0,0,0,0.5)] border border-white/5 relative">
            <MapView>
              <MapGeofence />
              {route && (
                <>
                  <MapRoutePath positions={route} />
                  <MapMarkers markers={createMarkers()} />
                  <MapCamera positions={route} />
                </>
              )}
            </MapView>
            <div className="absolute right-3 bottom-3"><MapScale /></div>
          </div>
        </Collapse>

        <ReportFilter onShow={onShow} deviceType="multiple" loading={loading} />

        {/* Trips List */}
        <div className="flex flex-col gap-4 pb-20">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <CircularProgress size={32} sx={{ color: '#39ff14' }} />
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Calculando Viagens...</span>
            </div>
          ) : items.length === 0 ? (
            <div 
              className="p-10 rounded-3xl border flex flex-col items-center justify-center gap-3 shadow-sm"
              style={{ background: theme.bgSecondary, borderColor: theme.border }}
            >
              <RouteIcon sx={{ fontSize: 40, color: theme.textMuted, opacity: 0.5 }} />
              <p className="text-xs font-bold uppercase tracking-widest text-center" style={{ color: theme.textMuted }}>Nenhuma viagem encontrada.</p>
            </div>
          ) : (
            items.map((item) => {
              const isExpanded = expandedId === item.startPositionId;
              const isSelected = selectedItem?.startPositionId === item.startPositionId;
              const deviceName = devices[item.deviceId]?.name || 'Veículo';

              return (
                <div
                  key={item.startPositionId}
                  className="rounded-2xl overflow-hidden shadow-md border transition-all duration-300"
                  style={{
                    background: theme.bgSecondary,
                    borderColor: isSelected ? theme.accent : theme.border,
                    boxShadow: isSelected ? `0 0 0 1px ${theme.accent}` : theme.sidebarShadow
                  }}
                >
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer"
                    onClick={() => {
                      setExpandedId(isExpanded ? null : item.startPositionId);
                      setSelectedItem(item);
                    }}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner"
                        style={{ background: theme.bg, color: theme.accent }}
                      >
                        <RouteIcon sx={{ fontSize: 20 }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black uppercase tracking-tighter" style={{ color: theme.textPrimary }}>
                            {formatDistance(item.distance, distanceUnit, t)}
                          </span>
                          <span 
                            className="text-[8px] font-black px-1.5 py-0.5 rounded border uppercase"
                            style={{ background: theme.bg, color: theme.textMuted, borderColor: theme.border }}
                          >
                            {formatNumericHours(item.duration, t)}
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
                        <span className="text-[7px] font-bold text-slate-600 uppercase">Inicio</span>
                      </div>
                      <IconButton size="small" className="text-slate-600">
                        {isExpanded ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
                      </IconButton>
                    </div>
                  </div>

                  <Collapse in={isExpanded}>
                    <div className="px-5 pb-5 pt-1 flex flex-col gap-4 border-t" style={{ borderColor: theme.border, background: theme.bg }}>
                      <div className="flex flex-col gap-3 mt-3">
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full mt-1 shadow-sm" style={{ backgroundColor: theme.accent }} />
                          <div>
                            <p className="text-[7px] font-black uppercase" style={{ color: theme.textMuted }}>Origem • {dayjs(item.startTime).format('HH:mm:ss')}</p>
                            <p className="text-[10px] font-medium leading-tight" style={{ color: theme.textPrimary }}>{item.startAddress || 'Endereço não disponível'}</p>
                          </div>
                        </div>
                        <div className="w-px h-4 ml-0.5" style={{ background: theme.border }} />
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full mt-1 shadow-sm bg-red-500" />
                          <div>
                            <p className="text-[7px] font-black uppercase" style={{ color: theme.textMuted }}>Destino • {dayjs(item.endTime).format('HH:mm:ss')}</p>
                            <p className="text-[10px] font-medium leading-tight" style={{ color: theme.textPrimary }}>{item.endAddress || 'Endereço não disponível'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-1">
                        <div className="p-3 rounded-xl shadow-inner flex items-center gap-3 border" style={{ background: theme.bgSecondary, borderColor: theme.border }}>
                          <SpeedIcon sx={{ fontSize: 14, color: theme.accent }} />
                          <div>
                            <p className="text-[7px] font-bold uppercase" style={{ color: theme.textMuted }}>Vel. Média</p>
                            <p className="text-[10px] font-black" style={{ color: theme.textPrimary }}>{formatSpeed(item.averageSpeed, speedUnit, t)}</p>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl shadow-inner flex items-center gap-3 border" style={{ background: theme.bgSecondary, borderColor: theme.border }}>
                          <StraightenIcon sx={{ fontSize: 14, color: theme.accent }} />
                          <div>
                            <p className="text-[7px] font-bold uppercase" style={{ color: theme.textMuted }}>Vel. Máxima</p>
                            <p className="text-[10px] font-black" style={{ color: theme.textPrimary }}>{formatSpeed(item.maxSpeed, speedUnit, t)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItem(item);
                            setShowMap(true);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="flex-1 py-2.5 rounded-xl shadow-md border text-[9px] font-black uppercase tracking-widest active:shadow-none"
                          style={{
                            background: theme.bgSecondary,
                            borderColor: theme.borderCard,
                            color: theme.accent
                          }}
                        >
                          Ver Trajeto
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateToReplay(item);
                          }}
                          className="flex-1 py-2.5 rounded-xl shadow-md border text-[9px] font-black uppercase tracking-widest"
                          style={{
                            background: theme.bgSecondary,
                            borderColor: theme.borderCard,
                            color: theme.textMuted
                          }}
                        >
                          Simular Rota
                        </button>
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

export default TripReportPage;
