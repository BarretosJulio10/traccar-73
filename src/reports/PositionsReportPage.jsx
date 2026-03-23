import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Typography, Collapse, IconButton, CircularProgress } from '@mui/material';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import LocationSearchingIcon from '@mui/icons-material/LocationSearching';
import MapIcon from '@mui/icons-material/Map';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SpeedIcon from '@mui/icons-material/Speed';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

import ReportFilter, { updateReportParams } from './components/ReportFilter';
import { useTranslation } from '../common/components/LocalizationProvider';
import PwaPageLayout from '../common/components/PwaPageLayout';
import PositionValue from '../common/components/PositionValue';
import { useHudTheme } from '../common/util/ThemeContext';
import usePositionAttributes from '../common/attributes/usePositionAttributes';
import { useCatch } from '../reactHelper';
import MapView from '../map/core/MapView';
import MapRoutePath from '../map/MapRoutePath';
import MapRoutePoints from '../map/MapRoutePoints';
import MapPositions from '../map/MapPositions';
import MapCamera from '../map/MapCamera';
import MapGeofence from '../map/MapGeofence';
import MapScale from '../map/MapScale';
import SelectField from '../common/components/SelectField';
import fetchOrThrow from '../common/util/fetchOrThrow';
import dayjs from 'dayjs';
import { getMockReportData } from '../main/DemoController';

const PositionsReportPage = () => {
  const navigate = useNavigate();
  const t = useTranslation();
  const { theme } = useHudTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const positionAttributes = usePositionAttributes(t);

  const [available, setAvailable] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [showMap, setShowMap] = useState(false);

  const geofenceId = searchParams.has('geofenceId') ? parseInt(searchParams.get('geofenceId')) : null;

  const onMapPointClick = useCallback((positionId) => {
    const item = items.find((it) => it.id === positionId);
    setSelectedItem(item);
    setShowMap(true);
  }, [items]);

  const onShow = useCatch(async ({ deviceIds, from, to }) => {
    const isDemo = window.sessionStorage.getItem('demoMode') === 'true';
    setLoading(true);
    try {
      if (isDemo) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setItems(getMockReportData('positions', deviceIds, from, to));
      } else {
        const query = new URLSearchParams({ from, to });
        if (geofenceId) {
          query.append('geofenceId', geofenceId);
        }
        deviceIds.forEach((deviceId) => query.append('deviceId', deviceId));
        const response = await fetchOrThrow(`/api/positions?${query.toString()}`, {
          headers: { Accept: 'application/json' },
        });
        const data = await response.json();
        setItems(data);
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
    <PwaPageLayout title={t('reportPositions')} actions={headerActions}>
      <div className="flex flex-col h-full relative">

        {/* Map View Toggle */}
        <Collapse in={showMap} timeout={300}>
          <div className="h-[40vh] min-h-[220px] max-h-[350px] mb-6 rounded-3xl overflow-hidden shadow-[inset_4px_4px_10px_rgba(0,0,0,0.5)] border border-white/5 relative z-0">
            <MapView>
              <MapGeofence />
              {[...new Set(items.map((it) => it.deviceId))].map((deviceId) => {
                const positions = items.filter((p) => p.deviceId === deviceId);
                return (
                  <Fragment key={deviceId}>
                    <MapRoutePath positions={positions} />
                    <MapRoutePoints positions={positions} onClick={onMapPointClick} />
                  </Fragment>
                );
              })}
              {selectedItem && <MapPositions positions={[selectedItem]} titleField="fixTime" />}
            </MapView>
            <div className="absolute right-3 bottom-3 flex flex-col gap-2">
              <MapScale />
            </div>
            {items.length > 0 && <MapCamera positions={items} />}
          </div>
        </Collapse>

        {/* Filter Section */}
        <ReportFilter onShow={onShow} deviceType="single" loading={loading}>
          <SelectField
            value={geofenceId}
            onChange={(e) => {
              const values = e.target.value ? [e.target.value] : [];
              updateReportParams(searchParams, setSearchParams, 'geofenceId', values);
            }}
            endpoint="/api/geofences"
            label={t('sharedGeofence')}
            fullWidth
          />
        </ReportFilter>

        {/* Results Section */}
        <div className="flex flex-col gap-4 pb-20">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <CircularProgress size={32} sx={{ color: '#39ff14' }} />
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Carregando Percurso...</span>
            </div>
          ) : items.length === 0 ? (
            <div 
              className="p-10 rounded-3xl border flex flex-col items-center justify-center gap-3 shadow-sm transition-colors"
              style={{ background: theme.bgSecondary, borderColor: theme.border }}
            >
              <LocationSearchingIcon sx={{ fontSize: 40, color: theme.textMuted, opacity: 0.5 }} />
              <p className="text-xs font-bold uppercase tracking-widest text-center" style={{ color: theme.textMuted }}>Nenhum percurso encontrado para o período.</p>
            </div>
          ) : (
            items.slice(0, 500).map((item, index) => {
              const isExpanded = expandedId === item.id;
              const isSelected = selectedItem?.id === item.id;

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
                        className="w-9 h-9 rounded-xl flex items-center justify-center shadow-inner"
                        style={{ 
                          background: theme.bg, 
                          color: isSelected ? theme.accent : theme.textMuted,
                          boxShadow: isSelected ? `inset 2px 2px 4px rgba(0,0,0,0.2), 0 0 8px ${theme.accent}40` : undefined
                        }}
                      >
                        <LocationOnIcon sx={{ fontSize: 18 }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <AccessTimeIcon sx={{ fontSize: 12, color: theme.accent }} />
                          <span className="text-[11px] font-bold uppercase" style={{ color: theme.textPrimary }}>
                            {dayjs(item.fixTime).format('HH:mm:ss')}
                          </span>
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase" style={{ color: theme.textMuted, background: 'rgba(0,0,0,0.1)', borderColor: theme.border }}>
                            {dayjs(item.fixTime).format('DD/MM')}
                          </span>
                        </div>
                        <p className="text-[10px] font-medium truncate mt-0.5" style={{ color: theme.textMuted }}>
                          {item.address || 'Carregando endereço...'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-end">
                        <span className="text-[11px] font-bold" style={{ color: theme.accent }}>
                          {(item.speed * 1.852).toFixed(0)}
                        </span>
                        <span className="text-[7px] font-bold uppercase" style={{ color: theme.textMuted }}>km/h</span>
                      </div>
                      <IconButton size="small" style={{ color: theme.textMuted }}>
                        {isExpanded ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
                      </IconButton>
                    </div>
                  </div>

                  <Collapse in={isExpanded}>
                    <div className="px-4 pb-4 pt-1 flex flex-col gap-3 border-t" style={{ borderColor: theme.border, background: theme.bgSecondary }}>
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div className="p-3 rounded-xl shadow-inner border" style={{ background: theme.bg, borderColor: theme.border }}>
                          <p className="text-[8px] font-bold uppercase mb-1" style={{ color: theme.textMuted }}>Coordenadas</p>
                          <p className="text-[10px] font-bold font-mono" style={{ color: theme.textPrimary }}>
                            {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
                          </p>
                        </div>
                        <div className="p-3 rounded-xl shadow-inner border" style={{ background: theme.bg, borderColor: theme.border }}>
                          <p className="text-[8px] font-bold uppercase mb-1" style={{ color: theme.textMuted }}>Altitude</p>
                          <p className="text-[10px] font-black" style={{ color: theme.textPrimary }}>
                            {item.altitude.toFixed(0)}m
                          </p>
                        </div>
                      </div>
                      {/* More attributes could be mapped here */}
                      <div className="flex justify-between items-center pt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItem(item);
                            setShowMap(true);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="px-4 py-2 rounded-xl shadow-md border text-[9px] font-black uppercase tracking-widest active:shadow-none transition-colors"
                          style={{
                            background: theme.bg,
                            borderColor: theme.borderCard,
                            color: theme.accent
                          }}
                        >
                          Ver Localização
                        </button>
                        <span className="text-[9px] font-medium uppercase" style={{ color: theme.textMuted }}>Percurso #{items.length - index}</span>
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

export default PositionsReportPage;
