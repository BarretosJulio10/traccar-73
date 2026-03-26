import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import DeleteIcon from '@mui/icons-material/Delete';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { CircularProgress } from '@mui/material';
import { geofencesActions, errorsActions } from '../../store';
import fetchOrThrow from '../../common/util/fetchOrThrow';
import { useHudTheme } from '../../common/util/ThemeContext';
import { getGeofenceTheme } from '../../common/util/geofenceTypes';

const GeofenceListCrud = ({ maxHeight = 220 }) => {
  const dispatch = useDispatch();
  const { theme } = useHudTheme();
  const items = useSelector((state) => state.geofences.items);
  const geofences = Object.values(items);

  const [togglingId, setTogglingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const handleTogglePause = async (e, g) => {
    e.stopPropagation();
    setTogglingId(g.id);
    try {
      const updated = { ...g, attributes: { ...g.attributes, disabled: !g.attributes?.disabled } };
      await fetchOrThrow(`/api/geofences/${g.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      dispatch(geofencesActions.update([updated]));
    } catch (err) {
      dispatch(errorsActions.push(err.message));
    }
    setTogglingId(null);
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await fetchOrThrow(`/api/geofences/${id}`, { method: 'DELETE' });
      dispatch(geofencesActions.refresh(Object.values(items).filter((g) => g.id !== id)));
    } catch (err) {
      dispatch(errorsActions.push(err.message));
    }
    setDeletingId(null);
    setConfirmDeleteId(null);
  };

  if (geofences.length === 0) {
    return (
      <p className="text-xs py-2 text-center" style={{ color: theme.textMuted }}>
        Nenhuma cerca criada ainda
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 overflow-y-auto scrollbar-hide" style={{ maxHeight }}>
      {geofences.map((g) => {
        const isCircle = typeof g.area === 'string' && g.area.startsWith('CIRCLE');
        const { icon: IconComponent, color } = getGeofenceTheme(g.attributes?.type || 'custom');
        const isDisabled = g.attributes?.disabled;
        const isToggling = togglingId === g.id;
        const isConfirming = confirmDeleteId === g.id;
        const isDeleting = deletingId === g.id;

        return (
          <div
            key={g.id}
            className="rounded-2xl border overflow-hidden"
            style={{
              background: theme.bgCard,
              borderColor: isConfirming ? 'rgba(239,68,68,0.3)' : theme.borderCard,
            }}
          >
            <div className="flex items-center gap-2.5 px-3 py-2.5">
              <span
                className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}18` }}
              >
                <IconComponent sx={{ fontSize: 14, color: isDisabled ? theme.textMuted : color }} />
              </span>

              <div className="flex-1 min-w-0">
                <span
                  className="text-xs font-semibold truncate block"
                  style={{
                    color: isDisabled ? theme.textMuted : theme.textPrimary,
                    textDecoration: isDisabled ? 'line-through' : 'none',
                  }}
                >
                  {g.name}
                </span>
                <span className="text-[9px]" style={{ color: theme.textMuted }}>
                  {isDisabled ? 'Inativa' : 'Ativa'} · {isCircle ? 'Circular' : 'Polígono'}
                </span>
              </div>

              {/* Pause / Activate */}
              <button
                type="button"
                onClick={(e) => handleTogglePause(e, g)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-95"
                style={{ background: isDisabled ? 'rgba(245,158,11,0.12)' : `${color}12` }}
              >
                {isToggling
                  ? <CircularProgress size={12} />
                  : isDisabled
                    ? <PlayCircleOutlineIcon sx={{ fontSize: 15, color: '#f59e0b' }} />
                    : <PauseCircleOutlineIcon sx={{ fontSize: 15, color }} />
                }
              </button>

              {/* Delete */}
              <button
                type="button"
                onClick={() => setConfirmDeleteId(isConfirming ? null : g.id)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-95"
                style={{ background: 'rgba(239,68,68,0.08)' }}
              >
                <DeleteIcon sx={{ fontSize: 14, color: '#ef4444' }} />
              </button>
            </div>

            {isConfirming && (
              <div className="flex items-center gap-2 px-3 pb-2.5">
                <span className="text-[10px] flex-1" style={{ color: theme.textMuted }}>Confirmar exclusão?</span>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border"
                  style={{ borderColor: theme.borderCard, color: theme.textMuted, background: theme.bgCard }}
                >
                  Não
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(g.id)}
                  disabled={isDeleting}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 disabled:opacity-50"
                  style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}
                >
                  {isDeleting && <CircularProgress size={10} color="inherit" />}
                  Excluir
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GeofenceListCrud;
