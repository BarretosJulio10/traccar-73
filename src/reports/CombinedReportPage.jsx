import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Collapse } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import TableRowsIcon from '@mui/icons-material/TableRows';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ReportFilter from './components/ReportFilter';
import { useTranslation } from '../common/components/LocalizationProvider';
import PwaPageLayout from '../common/components/PwaPageLayout';
import { useHudTheme } from '../common/util/ThemeContext';
import { useCatch } from '../reactHelper';
import MapView from '../map/core/MapView';
import MapCamera from '../map/MapCamera';
import MapGeofence from '../map/MapGeofence';
import { formatTime } from '../common/util/formatter';
import { prefixString } from '../common/util/stringUtils';
import MapMarkers from '../map/MapMarkers';
import MapRouteCoordinates from '../map/MapRouteCoordinates';
import MapScale from '../map/MapScale';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { deviceEquality } from '../common/util/deviceEquality';
import { getMockReportData } from '../main/DemoController';

const CombinedReportPage = () => {
  const t = useTranslation();
  const { theme } = useHudTheme();
  const devices = useSelector((state) => state.devices.items, deviceEquality(['id', 'name']));

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);

  const itemsCoordinates = useMemo(() => items.flatMap((item) => item.route), [items]);

  const createMarkers = () =>
    items.flatMap((item) =>
      item.events
        .map((event) => item.positions.find((p) => event.positionId === p.id))
        .filter((position) => position != null)
        .map((position) => ({
          latitude: position.latitude,
          longitude: position.longitude,
        })),
    );

  const onShow = useCatch(async ({ deviceIds, groupIds, from, to }) => {
    const isDemo = window.sessionStorage.getItem('demoMode') === 'true';
    setLoading(true);
    try {
      if (isDemo) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setItems(getMockReportData('combined', deviceIds, from, to));
        setShowMap(true);
      } else {
        const query = new URLSearchParams({ from, to });
        deviceIds.forEach((deviceId) => query.append('deviceId', deviceId));
        groupIds.forEach((groupId) => query.append('groupId', groupId));
        const response = await fetchOrThrow(`/api/reports/combined?${query.toString()}`);
        const result = await response.json();
        setItems(result);
        if (result.length > 0) setShowMap(true);
      }
    } finally {
      setLoading(false);
    }
  });

  const actionButtons = (
    <div className="flex gap-2">
      <button
        onClick={() => setShowMap(!showMap)}
        className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-md"
        style={{
          background: theme.bgSecondary,
          border: `1px solid ${theme.borderCard}`,
          color: showMap ? theme.accent : theme.textMuted
        }}
      >
        <MapIcon sx={{ fontSize: 20 }} />
      </button>
    </div>
  );

  return (
    <PwaPageLayout title={t('reportCombined')} actions={actionButtons}>
      <div className="flex flex-col gap-6">

        {/* Map Section */}
        {showMap && items.length > 0 && (
          <div 
             className="w-full h-[250px] rounded-3xl overflow-hidden shadow-lg border mb-2 relative"
             style={{ borderColor: theme.border }}
          >
            <MapView>
              <MapGeofence />
              {items.map((item) => (
                <MapRouteCoordinates
                  key={item.deviceId}
                  name={devices[item.deviceId]?.name}
                  coordinates={item.route}
                  deviceId={item.deviceId}
                />
              ))}
              <MapMarkers markers={createMarkers()} />
            </MapView>
            <MapScale />
            <MapCamera coordinates={itemsCoordinates} latitude={selectedPosition?.latitude} longitude={selectedPosition?.longitude} />
            <button
              onClick={() => setShowMap(false)}
              className="absolute top-4 right-4 z-[1000] w-8 h-8 rounded-lg backdrop-blur-md flex items-center justify-center"
              style={{ background: `${theme.bg}CC`, color: theme.textMuted }}
            >
              <TableRowsIcon sx={{ fontSize: 14 }} />
            </button>
          </div>
        )}

        <ReportFilter onShow={onShow} deviceType="multiple" loading={loading} />

        {/* Results List */}
        <div className="flex flex-col gap-4 pb-10">
          {items.flatMap((item) =>
            item.events.map((event) => {
              const isExpanded = expandedId === event.id;
              const position = item.positions.find((p) => event.positionId === p.id);

              return (
                <div
                  key={event.id}
                  className="rounded-3xl overflow-hidden shadow-md border transition-all duration-300"
                  style={{
                     background: theme.bgSecondary,
                     borderColor: isExpanded ? theme.accent : theme.borderCard,
                     boxShadow: isExpanded ? `0 0 0 1px ${theme.accent}` : theme.sidebarShadow
                  }}
                >
                  <div
                    className="p-5 flex flex-col gap-3 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : event.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner"
                          style={{ background: theme.bg, color: theme.accent }}
                        >
                          <EventIcon sx={{ fontSize: 18 }} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase transition-colors" style={{ color: theme.textPrimary }}>
                            {devices[item.deviceId]?.name || 'Desconhecido'}
                          </span>
                          <span className="text-[8px] font-bold uppercase tracking-widest leading-none mt-0.5 transition-colors" style={{ color: theme.textMuted }}>
                            {formatTime(event.eventTime, 'seconds')}
                          </span>
                        </div>
                      </div>
                      <div className="px-3 py-1 rounded-full border" style={{ backgroundColor: `${theme.accent}15`, borderColor: `${theme.accent}30` }}>
                        <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: theme.accent }}>
                          {t(prefixString('event', event.type))}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Collapse in={isExpanded}>
                    <div className="px-5 pb-5 pt-2 flex flex-col gap-4 border-t" style={{ borderColor: theme.border, background: theme.bg }}>
                      <div className="flex items-start gap-3 mt-2">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center shadow-inner mt-1"
                          style={{ background: theme.bgSecondary, color: theme.textMuted }}
                        >
                          <LocationOnIcon sx={{ fontSize: 16 }} />
                        </div>
                        <div className="flex-1">
                          <p className="text-[8px] font-bold uppercase tracking-widest" style={{ color: theme.textMuted }}>Localização</p>
                          <p className="text-[10px] font-medium leading-snug mt-0.5" style={{ color: theme.textPrimary }}>
                            {position?.address || 'Endereço indisponível'}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        {position && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPosition(position);
                              setShowMap(true);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="px-4 py-2 rounded-xl shadow-md border font-black uppercase tracking-widest transition-all"
                            style={{ 
                              background: theme.bgSecondary, 
                              borderColor: theme.borderCard,
                              color: theme.accent
                            }}
                          >
                            Ver no Mapa
                          </button>
                        )}
                        <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: theme.textMuted }}>Alerta #{event.id}</span>
                      </div>
                    </div>
                  </Collapse>
                </div>
              );
            })
          )}

          {!loading && items.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center opacity-40 grayscale" style={{ color: theme.textMuted }}>
              <TableRowsIcon sx={{ fontSize: 40, mb: 1 }} />
              <span className="text-xs font-black uppercase tracking-widest">Nenhum dado</span>
            </div>
          )}
        </div>
      </div>
    </PwaPageLayout>
  );
};

export default CombinedReportPage;
