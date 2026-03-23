import { Fragment, useState, useCallback, useEffect } from 'react';
import dayjs from 'dayjs';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Collapse,
  IconButton,
  CircularProgress,
} from '@mui/material';
import FenceIcon from '@mui/icons-material/Fence';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ScheduleIcon from '@mui/icons-material/Schedule';
import DescriptionIcon from '@mui/icons-material/Description';
import SpeedIcon from '@mui/icons-material/Speed';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PaletteIcon from '@mui/icons-material/Palette';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import { geofencesActions, errorsActions } from '../store';
import { useCatchCallback } from '../reactHelper';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { useTranslation } from '../common/components/LocalizationProvider';
import GeofenceDevicesDialog from './GeofenceDevicesDialog';
import { getGeofenceTheme } from '../common/util/geofenceTypes';

const GeofencesList = ({ onGeofenceSelected }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useTranslation();

  const [expandedId, setExpandedId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [deviceCounts, setDeviceCounts] = useState({});
  const [dialogGeofence, setDialogGeofence] = useState(null);
  const [removingGeofenceId, setRemovingGeofenceId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const items = useSelector((state) => state.geofences.items);
  const geofenceList = Object.values(items);

  useEffect(() => {
    geofenceList.forEach(async (item) => {
      if (deviceCounts[item.id] === undefined) {
        try {
          const response = await fetchOrThrow(`/api/devices?geofenceId=${item.id}`);
          const devices = await response.json();
          setDeviceCounts((prev) => ({ ...prev, [item.id]: devices.length }));
        } catch {
          setDeviceCounts((prev) => ({ ...prev, [item.id]: 0 }));
        }
      }
    });
  }, [geofenceList.length]);

  const refreshGeofences = useCatchCallback(async () => {
    const response = await fetchOrThrow('/api/geofences');
    dispatch(geofencesActions.refresh(await response.json()));
  }, [dispatch]);

  const handleTogglePause = async (event, item) => {
    event.stopPropagation();
    setTogglingId(item.id);
    try {
      const isDisabled = item.attributes?.disabled;
      const updatedItem = {
        ...item,
        attributes: {
          ...item.attributes,
          disabled: !isDisabled,
        },
      };
      await fetchOrThrow(`/api/geofences/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItem),
      });
      dispatch(geofencesActions.update([updatedItem]));
    } catch (error) {
      dispatch(errorsActions.push(error.message));
    }
    setTogglingId(null);
  };

  const fetchDeviceCount = useCallback(
    async (geofenceId) => {
      if (deviceCounts[geofenceId] !== undefined) return;
      try {
        const response = await fetchOrThrow(`/api/devices?geofenceId=${geofenceId}`);
        const devices = await response.json();
        setDeviceCounts((prev) => ({ ...prev, [geofenceId]: devices.length }));
      } catch {
        setDeviceCounts((prev) => ({ ...prev, [geofenceId]: 0 }));
      }
    },
    [deviceCounts],
  );

  const handleToggleExpand = (event, itemId) => {
    event.stopPropagation();
    setExpandedId((prev) => {
      const next = prev === itemId ? null : itemId;
      if (next) fetchDeviceCount(next);
      return next;
    });
  };

  const handleCardClick = (item) => {
    onGeofenceSelected(item.id);
  };

  const handleOpenDevicesDialog = (event, item) => {
    event.stopPropagation();
    setDialogGeofence(item);
  };

  const handleCloseDevicesDialog = () => {
    if (dialogGeofence) {
      setDeviceCounts((prev) => {
        const copy = { ...prev };
        delete copy[dialogGeofence.id];
        return copy;
      });
      fetchDeviceCount(dialogGeofence.id);
    }
    setDialogGeofence(null);
  };

  const handleRemoveGeofence = async () => {
    const geofenceId = removingGeofenceId;
    if (!geofenceId) return;
    setIsDeleting(true);
    try {
      const devResponse = await fetchOrThrow(`/api/devices?geofenceId=${geofenceId}`);
      const linkedDevices = await devResponse.json();
      await Promise.all(
        linkedDevices.map((device) =>
          fetchOrThrow('/api/permissions', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceId: device.id, geofenceId }),
          }).catch(() => { }),
        ),
      );
      await fetchOrThrow(`/api/geofences/${geofenceId}`, { method: 'DELETE' });
      refreshGeofences();
    } catch (error) {
      dispatch(errorsActions.push(error.message));
    }
    setIsDeleting(false);
    setRemovingGeofenceId(null);
  };

  if (geofenceList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[#1e1f24] shadow-[inset_3px_3px_6px_rgba(0,0,0,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.02)] text-slate-600">
          <FenceIcon sx={{ fontSize: 32 }} />
        </div>
        <Typography variant="body2" className="text-slate-400 font-bold uppercase tracking-widest text-center">
          {t('sharedNoData') || 'Nenhuma cerca'}
        </Typography>
        <Typography variant="caption" className="text-slate-500 font-medium text-center uppercase tracking-tighter opacity-70">
          Desenhe no mapa para começar
        </Typography>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {geofenceList.map((item) => {
        const isDisabled = item.attributes?.disabled;
        const isExpired = item.attributes?.endDate && dayjs(item.attributes.endDate).isBefore(dayjs(), 'day');
        const isExpanded = expandedId === item.id;
        const isToggling = togglingId === item.id;
        const theme = getGeofenceTheme(item.attributes?.type);
        const IconComponent = theme.icon;

        return (
          <div
            key={item.id}
            className={`w-full bg-[#1e1f24] rounded-2xl overflow-hidden shadow-[6px_6px_12px_rgba(0,0,0,0.4),-6px_-6px_12px_rgba(255,255,255,0.01)] border border-white/5 transition-all duration-300 ${isExpired ? 'opacity-70 grayscale-[50%]' : ''}`}
            style={{ boxShadow: isExpanded ? `0 0 0 1px ${theme.color}40` : undefined }}
          >
            <div
              className="p-4 flex items-center justify-between cursor-pointer"
              onClick={() => handleCardClick(item)}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-[#24262b] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4)] ${isDisabled ? 'text-slate-600' : ''}`} style={!isDisabled ? { color: theme.color, boxShadow: `0 0 8px ${theme.color}33` } : {}}>
                  <IconComponent sx={{ fontSize: 20 }} />
                </div>
                <div className="flex-1 min-w-0">
                  <Typography className={`text-sm font-bold tracking-wide truncate ${isDisabled ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
                    {item.name}
                  </Typography>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${isDisabled || isExpired ? 'bg-slate-600' : ''}`} style={(!isDisabled && !isExpired) ? { backgroundColor: theme.color, boxShadow: `0 0 4px ${theme.color}` } : {}} />
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
                      {isExpired ? 'Expirada' : (isDisabled ? 'Inativa' : (item.attributes?.type ? theme.label : 'Monitorada'))}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <IconButton
                  size="small"
                  onClick={(e) => handleToggleExpand(e, item.id)}
                  className="text-slate-500"
                >
                  {isExpanded ? <ExpandLessIcon sx={{ fontSize: 18 }} /> : <ExpandMoreIcon sx={{ fontSize: 18 }} />}
                </IconButton>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/app/settings/geofence/${item.id}`);
                  }}
                  className="text-slate-400"
                >
                  <EditIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </div>
            </div>

            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <div className="px-5 pb-5 pt-1 flex flex-col gap-3 border-t border-white/5 bg-black/10">
                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="bg-[#24262b] rounded-xl p-3 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)]">
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">Dispositivos</p>
                    <div
                      className="flex items-center justify-between cursor-pointer group"
                      onClick={(e) => handleOpenDevicesDialog(e, item)}
                    >
                      <span className="text-xs font-black text-slate-200">{deviceCounts[item.id] ?? '—'}</span>
                      <DirectionsCarIcon sx={{ fontSize: 14, color: '#39ff14' }} />
                    </div>
                  </div>
                  <div className="bg-[#24262b] rounded-xl p-3 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)]">
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status</p>
                    <div
                      className={`flex items-center justify-between cursor-pointer ${isToggling ? 'opacity-50' : ''}`}
                      onClick={(e) => handleTogglePause(e, item)}
                    >
                      <span className={`text-[9px] font-black uppercase tracking-tighter ${isDisabled || isExpired ? 'text-amber-500' : 'text-[#39ff14]'}`}>
                        {isExpired ? 'Pausada (Vencida)' : (isDisabled ? 'Pausada' : 'Ativa')}
                      </span>
                      {isDisabled || isExpired ? <PlayCircleOutlineIcon sx={{ fontSize: 14, color: '#39ff14' }} /> : <PauseCircleOutlineIcon sx={{ fontSize: 14, color: '#ff3939' }} />}
                    </div>
                  </div>
                </div>

                {/* Additional Info Row */}
                <div className="flex flex-wrap gap-2 mt-1">
                  {item.attributes?.speedLimit && (
                    <div className="bg-[#24262b] px-3 py-1.5 rounded-lg flex items-center gap-2 border border-white/5 shadow-[2px_2px_4px_rgba(0,0,0,0.3)]">
                      <SpeedIcon sx={{ fontSize: 12, color: '#f59e0b' }} />
                      <span className="text-[9px] font-bold text-slate-300">{(item.attributes.speedLimit * 1.852).toFixed(0)} km/h</span>
                    </div>
                  )}
                  {item.calendarId && (
                    <div className="bg-[#24262b] px-3 py-1.5 rounded-lg flex items-center gap-2 border border-white/5 shadow-[2px_2px_4px_rgba(0,0,0,0.3)]">
                      <ScheduleIcon sx={{ fontSize: 12, color: '#8b5cf6' }} />
                      <span className="text-[9px] font-bold text-slate-300">Agenda Ativa</span>
                    </div>
                  )}
                  {item.attributes?.color && (
                    <div
                      className="bg-[#24262b] px-3 py-1.5 rounded-lg flex items-center gap-2 border shadow-[2px_2px_4px_rgba(0,0,0,0.3)]"
                      style={{ borderColor: item.attributes.color + '40' }}
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.attributes.color }} />
                      <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{item.attributes.color}</span>
                    </div>
                  )}
                </div>

                {item.description && (
                  <div className="bg-black/20 p-3 rounded-xl border border-white/5 mt-1">
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">Descrição</p>
                    <p className="text-[10px] font-medium text-slate-400 italic">"{item.description}"</p>
                  </div>
                )}

                {/* Footer Action — inline confirmation avoids Portal/pointer-events issues */}
                <div className="flex justify-end pt-2">
                  {removingGeofenceId === item.id ? (
                    <div className="flex items-center gap-2 w-full">
                      <span className="text-[9px] font-bold text-slate-400 flex-1">Confirmar exclusão?</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setRemovingGeofenceId(null); }}
                        className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/10 text-slate-400 active:scale-95 transition-all"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveGeofence(); }}
                        disabled={isDeleting}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 text-[#ff3939] text-[9px] font-black uppercase tracking-widest border border-red-500/30 active:scale-95 transition-all disabled:opacity-50"
                      >
                        {isDeleting
                          ? <CircularProgress size={10} color="inherit" />
                          : <DeleteIcon sx={{ fontSize: 12 }} />}
                        {isDeleting ? 'Removendo...' : 'Confirmar'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setRemovingGeofenceId(item.id); }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 text-[#ff3939] text-[9px] font-black uppercase tracking-widest border border-red-500/20 active:scale-95 transition-all"
                    >
                      <DeleteIcon sx={{ fontSize: 14 }} />
                      Excluir
                    </button>
                  )}
                </div>
              </div>
            </Collapse>
          </div>
        );
      })}

      <GeofenceDevicesDialog
        open={Boolean(dialogGeofence)}
        onClose={handleCloseDevicesDialog}
        geofenceId={dialogGeofence?.id}
        geofenceName={dialogGeofence?.name}
      />

    </div>
  );
};

export default GeofencesList;
