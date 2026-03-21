import { Fragment, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Collapse,
  CircularProgress,
} from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SpeedIcon from '@mui/icons-material/Speed';
import FenceIcon from '@mui/icons-material/Fence';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';

import { useSelector } from 'react-redux';
import { formatTime } from '../common/util/formatter';
import ReportFilter, { updateReportParams } from './components/ReportFilter';
import { prefixString } from '../common/util/stringUtils';
import { useTranslation } from '../common/components/LocalizationProvider';
import PwaPageLayout from '../common/components/PwaPageLayout';
import { useCatch, useEffectAsync } from '../reactHelper';
import { useHudTheme } from '../common/util/ThemeContext';
import MapView from '../map/core/MapView';
import MapGeofence from '../map/MapGeofence';
import MapPositions from '../map/MapPositions';
import MapCamera from '../map/MapCamera';
import MapScale from '../map/MapScale';
import fetchOrThrow from '../common/util/fetchOrThrow';
import dayjs from 'dayjs';
import { getMockReportData } from '../main/DemoController';

const EventReportPage = () => {
  const navigate = useNavigate();
  const t = useTranslation();
  const { theme } = useHudTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  const devices = useSelector((state) => state.devices.items);
  const geofences = useSelector((state) => state.geofences.items);

  const [allEventTypes, setAllEventTypes] = useState([['allEvents', 'eventAll']]);
  const eventTypes = useMemo(() => searchParams.getAll('eventType'), [searchParams]);

  const [items, setItems] = useState([]);
  const [positions, setPositions] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [position, setPosition] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (!eventTypes.length) {
      updateReportParams(searchParams, setSearchParams, 'eventType', ['allEvents']);
    }
  }, [searchParams, setSearchParams, eventTypes]);

  useEffect(() => {
    if (selectedItem?.positionId) {
      setPosition(positions[selectedItem.positionId] || null);
    } else {
      setPosition(null);
    }
  }, [selectedItem, positions]);

  useEffectAsync(async () => {
    const isDemo = window.sessionStorage.getItem('demoMode') === 'true';
    if (isDemo) {
      setAllEventTypes([
        ['allEvents', 'eventAll'],
        ['deviceOverspeed', t('demoOverspeed')],
        ['geofenceEnter', t('demoGeofenceEnter')],
        ['geofenceExit', t('demoGeofenceExit')],
        ['alarm', t('demoAlarmSos')]
      ]);
      return;
    }
    try {
      const response = await fetchOrThrow('/api/notifications/types');
      const types = await response.json();
      setAllEventTypes([
        ['allEvents', 'eventAll'],
        ...types.map((it) => [it.type, prefixString('event', it.type)]),
      ]);
    } catch (e) { }
  }, []);

  const onShow = useCatch(async ({ deviceIds, from, to }) => {
    const isDemo = window.sessionStorage.getItem('demoMode') === 'true';
    setSelectedItem(null);
    setPosition(null);
    setLoading(true);
    try {
      if (isDemo) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        const events = getMockReportData('events', deviceIds, from, to);
        setItems(events);

        // Populate mock positions for demo events
        const pMap = {};
        events.forEach((e) => {
          if (e.positionId) {
            pMap[e.positionId] = {
              id: e.positionId,
              deviceId: e.deviceId,
              latitude: e.latitude,
              longitude: e.longitude,
              address: e.address,
              fixTime: e.eventTime,
            };
          }
        });
        setPositions(pMap);
      } else {
        const query = new URLSearchParams({ from, to });
        deviceIds.forEach((deviceId) => query.append('deviceId', deviceId));
        eventTypes.forEach((it) => query.append('type', it));

        const response = await fetchOrThrow(`/api/reports/events?${query.toString()}`, {
          headers: { Accept: 'application/json' },
        });
        const events = await response.json();
        setItems(events);

        const positionIds = Array.from(new Set(events.map((e) => e.positionId).filter((id) => id)));
        if (positionIds.length > 0) {
          const pQuery = new URLSearchParams();
          positionIds.slice(0, 100).forEach((id) => pQuery.append('id', id));
          const pRes = await fetchOrThrow(`/api/positions?${pQuery.toString()}`);
          const pArray = await pRes.json();
          const pMap = {};
          pArray.forEach((p) => (pMap[p.id] = p));
          setPositions(pMap);
        }
      }
    } finally {
      setLoading(false);
    }
  });

  const getEventIcon = (type) => {
    switch (type) {
      case 'ignitionOn': return <PlayArrowIcon sx={{ color: '#39ff14' }} />;
      case 'ignitionOff': return <PauseIcon sx={{ color: '#ff3939' }} />;
      case 'deviceOverspeed': return <SpeedIcon sx={{ color: '#f59e0b' }} />;
      case 'geofenceEnter':
      case 'geofenceExit': return <FenceIcon sx={{ color: '#8b5cf6' }} />;
      case 'alarm': return <NotificationsActiveIcon sx={{ color: '#ef4444' }} />;
      default: return <NotificationsActiveIcon sx={{ color: '#3b82f6' }} />;
    }
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
    <PwaPageLayout title="Eventos e Alertas" actions={headerActions}>
      <div className="flex flex-col gap-4">

        {/* Floating Map */}
        <Collapse in={showMap}>
          <div className="h-[260px] mb-6 rounded-3xl overflow-hidden shadow-[inset_4px_4px_10px_rgba(0,0,0,0.5)] border border-white/5 relative">
            <MapView>
              <MapGeofence />
              {position && <MapPositions positions={[position]} titleField="fixTime" />}
            </MapView>
            <div className="absolute right-3 bottom-3"><MapScale /></div>
            {position && <MapCamera latitude={position.latitude} longitude={position.longitude} />}
          </div>
        </Collapse>

        <ReportFilter onShow={onShow} deviceType="multiple" loading={loading} />

        {/* Events List */}
        <div className="flex flex-col gap-4 pb-20">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <CircularProgress size={32} sx={{ color: '#39ff14' }} />
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Buscando Alertas...</span>
            </div>
          ) : items.length === 0 ? (
            <div 
              className="p-10 rounded-3xl border flex flex-col items-center justify-center gap-3 shadow-sm transition-colors"
              style={{ background: theme.bgSecondary, borderColor: theme.border }}
            >
              <NotificationsActiveIcon sx={{ fontSize: 40, color: theme.textMuted, opacity: 0.5 }} />
              <p className="text-xs font-bold uppercase tracking-widest text-center" style={{ color: theme.textMuted }}>Nenhum alerta registrado.</p>
            </div>
          ) : (
            items.map((item) => {
              const isExpanded = expandedId === item.id;
              const isSelected = selectedItem?.id === item.id;
              const deviceName = devices[item.deviceId]?.name || 'Veículo';
              const pos = positions[item.positionId];

              return (
                <div
                  key={item.id}
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
                      setExpandedId(isExpanded ? null : item.id);
                      setSelectedItem(item);
                    }}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner"
                        style={{ background: theme.bg, color: theme.textPrimary }}
                      >
                        {getEventIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black uppercase tracking-tighter" style={{ color: theme.textPrimary }}>
                            {t(prefixString('event', item.type))}
                          </span>
                          {item.type === 'alarm' && (
                            <span className="text-[7px] font-black bg-red-500/10 text-red-500 border border-red-500/20 px-1.5 py-0.5 rounded uppercase">
                              {t(prefixString('alarm', item.attributes.alarm))}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <DirectionsCarIcon sx={{ fontSize: 10, color: theme.accent }} />
                          <span className="text-[9px] font-bold uppercase tracking-widest truncate" style={{ color: theme.textMuted }}>{deviceName}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] font-black" style={{ color: theme.textPrimary }}>
                        {dayjs(item.eventTime).format('HH:mm')}
                      </span>
                      <span className="text-[8px] font-bold uppercase" style={{ color: theme.textMuted }}>
                        {dayjs(item.eventTime).format('DD/MM')}
                      </span>
                    </div>
                  </div>

                  <Collapse in={isExpanded}>
                    <div className="px-5 pb-5 pt-1 flex flex-col gap-4 border-t" style={{ borderColor: theme.border, background: theme.bgSecondary }}>
                      <div className="flex items-start gap-3 mt-3">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center shadow-inner"
                          style={{ background: theme.bg, color: theme.textMuted }}
                        >
                          <LocationOnIcon sx={{ fontSize: 16 }} />
                        </div>
                        <div>
                          <p className="text-[8px] font-bold uppercase tracking-widest" style={{ color: theme.textMuted }}>Localização aproximada</p>
                          <p className="text-[10px] font-medium leading-tight mt-0.5" style={{ color: theme.textPrimary }}>
                            {pos?.address || 'Endereço indisponível'}
                          </p>
                        </div>
                      </div>

                      {item.geofenceId > 0 && (
                        <div className="p-3 rounded-xl shadow-inner border" style={{ background: theme.bgSecondary, borderColor: theme.border }}>
                          <p className="text-[8px] font-bold uppercase mb-1" style={{ color: theme.textMuted }}>Cerca Virtual</p>
                          <p className="text-[10px] font-black uppercase" style={{ color: '#8b5cf6' }}>{geofences[item.geofenceId]?.name || 'Geofence'}</p>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2">
                        {pos && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem(item);
                              setShowMap(true);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="px-4 py-2 rounded-xl shadow-md border text-[9px] font-black uppercase tracking-widest transition-colors"
                            style={{ background: theme.bgSecondary, borderColor: theme.borderCard, color: theme.accent }}
                          >
                            Ver no Mapa
                          </button>
                        )}
                        <span className="text-[9px] font-medium uppercase" style={{ color: theme.textMuted }}>Log #{item.id}</span>
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

export default EventReportPage;
