import { useState } from 'react';
import dayjs from 'dayjs';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { IconButton, CircularProgress } from '@mui/material';
import FenceIcon from '@mui/icons-material/Fence';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import LockIcon from '@mui/icons-material/Lock';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

import { geofencesActions, errorsActions } from '../store';
import { useCatchCallback } from '../reactHelper';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useHudTheme } from '../common/util/ThemeContext';
import { getGeofenceTheme } from '../common/util/geofenceTypes';
import GeofenceConfigPanel from './GeofenceConfigPanel';

const PREVIEW_SECTIONS = [
  { icon: DirectionsCarIcon, label: 'Veículos Vinculados' },
  { icon: CalendarMonthIcon, label: 'Agenda de Ativação' },
  { icon: NotificationsActiveIcon, label: 'Alertas de Entrada/Saída' },
  { icon: LockIcon, label: 'Bloqueio Automático' },
];

const GeofencesList = ({ onGeofenceSelected }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useTranslation();
  const { theme } = useHudTheme();

  const [selectedId, setSelectedId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [removingGeofenceId, setRemovingGeofenceId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const items = useSelector((state) => state.geofences.items);
  const geofenceList = Object.values(items);
  const selectedItem = selectedId ? items[selectedId] : null;

  const refreshGeofences = useCatchCallback(async () => {
    const response = await fetchOrThrow('/api/geofences');
    dispatch(geofencesActions.refresh(await response.json()));
  }, [dispatch]);

  const handleCardClick = (item) => {
    setSelectedId((prev) => (prev === item.id ? null : item.id));
    onGeofenceSelected(item.id);
  };

  const handleTogglePause = async (event, item) => {
    event.stopPropagation();
    setTogglingId(item.id);
    try {
      const updatedItem = {
        ...item,
        attributes: { ...item.attributes, disabled: !item.attributes?.disabled },
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
          }).catch(() => {}),
        ),
      );
      await fetchOrThrow(`/api/geofences/${geofenceId}`, { method: 'DELETE' });
      if (selectedId === geofenceId) setSelectedId(null);
      refreshGeofences();
    } catch (error) {
      dispatch(errorsActions.push(error.message));
    }
    setIsDeleting(false);
    setRemovingGeofenceId(null);
  };

  return (
    <div className="flex flex-col gap-3">

      {/* ─── List ─── */}
      {geofenceList.length === 0 ? (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-dashed"
          style={{ borderColor: theme.border, background: `${theme.accent}08` }}
        >
          <FenceIcon sx={{ fontSize: 22, color: theme.textMuted }} />
          <div>
            <p className="text-xs font-bold" style={{ color: theme.textSecondary }}>
              {t('sharedNoData') || 'Nenhuma cerca'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>
              Desenhe no mapa para começar
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {geofenceList.map((item) => {
            const isSelected = selectedId === item.id;
            const isDisabled = item.attributes?.disabled;
            const isExpired = item.attributes?.endDate && dayjs(item.attributes.endDate).isBefore(dayjs(), 'day');
            const isToggling = togglingId === item.id;
            const gt = getGeofenceTheme(item.attributes?.type);
            const IconComponent = gt.icon;

            return (
              <div
                key={item.id}
                className="w-full rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer"
                style={{
                  background: theme.bgCard,
                  borderColor: isSelected ? gt.color : theme.borderCard,
                  boxShadow: isSelected ? `0 0 0 1.5px ${gt.color}40` : undefined,
                  opacity: isExpired ? 0.7 : 1,
                }}
                onClick={() => handleCardClick(item)}
              >
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `${gt.color}15`,
                        color: isDisabled ? theme.textMuted : gt.color,
                      }}
                    >
                      <IconComponent sx={{ fontSize: 20 }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-semibold truncate"
                        style={{
                          color: isDisabled ? theme.textMuted : theme.textPrimary,
                          textDecoration: isDisabled ? 'line-through' : 'none',
                        }}
                      >
                        {item.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <div className="flex items-center gap-1">
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: (isDisabled || isExpired) ? theme.textMuted : gt.color }}
                          />
                          <span className="text-xs" style={{ color: theme.textMuted }}>
                            {isExpired ? 'Expirada' : (isDisabled ? 'Inativa' : (item.attributes?.type ? gt.label : 'Ativa'))}
                          </span>
                        </div>
                        {item.calendarId && (
                          <span className="text-xs font-medium" style={{ color: '#a78bfa' }}>• Agenda</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all active:scale-95 ${isToggling ? 'opacity-50' : ''}`}
                      style={{
                        background: (isDisabled || isExpired)
                          ? 'rgba(245,158,11,0.1)'
                          : `${gt.color}12`,
                      }}
                      onClick={(e) => handleTogglePause(e, item)}
                    >
                      {isToggling ? (
                        <CircularProgress size={14} />
                      ) : (isDisabled || isExpired) ? (
                        <PlayCircleOutlineIcon sx={{ fontSize: 16, color: '#f59e0b' }} />
                      ) : (
                        <PauseCircleOutlineIcon sx={{ fontSize: 16, color: gt.color }} />
                      )}
                    </div>
                    <IconButton
                      size="small"
                      onClick={(e) => { e.stopPropagation(); navigate(`/app/settings/geofence/${item.id}`); }}
                    >
                      <EditIcon sx={{ fontSize: 16, color: theme.textMuted }} />
                    </IconButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Config Panel (always visible) ─── */}
      <div className="mt-1 pt-4" style={{ borderTop: `1px solid ${theme.borderCard}` }}>
        {selectedItem ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1" style={{ background: theme.borderCard }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.textMuted }}>
                Configurar Cerca
              </span>
              <div className="h-px flex-1" style={{ background: theme.borderCard }} />
            </div>

            <GeofenceConfigPanel geofence={selectedItem} onUpdate={refreshGeofences} />

            {/* Delete */}
            <div className="flex justify-end mt-5 pt-4" style={{ borderTop: `1px solid ${theme.borderCard}` }}>
              {removingGeofenceId === selectedItem.id ? (
                <div className="flex items-center gap-2 w-full">
                  <span className="text-xs flex-1" style={{ color: theme.textMuted }}>Confirmar exclusão?</span>
                  <button
                    type="button"
                    onClick={() => setRemovingGeofenceId(null)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold border active:scale-95 transition-all"
                    style={{ borderColor: theme.borderCard, color: theme.textMuted, background: theme.bgCard }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveGeofence}
                    disabled={isDeleting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95 transition-all disabled:opacity-50"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}
                  >
                    {isDeleting ? <CircularProgress size={12} color="inherit" /> : <DeleteIcon sx={{ fontSize: 14 }} />}
                    {isDeleting ? 'Removendo...' : 'Confirmar'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setRemovingGeofenceId(selectedItem.id)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold active:scale-95 transition-all"
                  style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)' }}
                >
                  <DeleteIcon sx={{ fontSize: 16 }} />
                  Excluir Cerca
                </button>
              )}
            </div>
          </>
        ) : (
          /* No selection — prompt + section previews */
          <div className="flex flex-col gap-3">
            <div
              className="flex items-start gap-3 px-4 py-3 rounded-2xl border"
              style={{ background: `${theme.accent}08`, borderColor: `${theme.accent}25` }}
            >
              <FenceIcon sx={{ fontSize: 24, color: theme.accent, opacity: 0.6, flexShrink: 0, mt: '2px' }} />
              <div>
                <p className="text-sm font-bold" style={{ color: theme.textPrimary }}>
                  {geofenceList.length === 0 ? 'Configure sua primeira cerca' : 'Selecione uma cerca acima'}
                </p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: theme.textSecondary }}>
                  {geofenceList.length === 0
                    ? 'Desenhe uma área no mapa e configure veículos, horários, alertas e bloqueio automático.'
                    : 'Clique em uma cerca para ver e editar suas configurações.'}
                </p>
              </div>
            </div>

            {/* Section previews — dimmed */}
            <div className="flex flex-col gap-2 opacity-40 pointer-events-none select-none">
              {PREVIEW_SECTIONS.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border"
                  style={{ background: theme.bgCard, borderColor: theme.borderCard }}
                >
                  <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: theme.accent }} />
                  <Icon sx={{ fontSize: 16, color: theme.accent }} />
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.accent }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default GeofencesList;
