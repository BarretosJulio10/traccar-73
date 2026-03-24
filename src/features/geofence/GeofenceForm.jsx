import { useSelector } from 'react-redux';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FenceIcon from '@mui/icons-material/Fence';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import PolylineIcon from '@mui/icons-material/Polyline';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import AdjustIcon from '@mui/icons-material/Adjust';
import CheckIcon from '@mui/icons-material/Check';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import { CircularProgress } from '@mui/material';
import { useHudTheme } from '../../common/util/ThemeContext';
import { getGeofenceTheme } from '../../common/util/geofenceTypes';
import VehicleSelector from './VehicleSelector';

const Label = ({ children, theme }) => (
  <p className="text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: theme.textMuted }}>
    {children}
  </p>
);

const CIRCLE_INSTRUCTIONS = {
  idle: 'Clique em "Iniciar" para ativar o modo de desenho',
  center: 'Clique no mapa para definir o centro da cerca',
  radius: 'Clique novamente para definir o raio',
  done: 'Ajuste o raio pelo slider abaixo se desejar',
};

const POLY_INSTRUCTIONS = {
  idle: 'Clique em "Iniciar" para ativar o modo de desenho',
  drawing: (n) => `${n} ponto${n !== 1 ? 's' : ''} — ${n >= 3 ? 'duplo clique para fechar o polígono' : 'continue clicando no mapa'}`,
  done: 'Polígono definido com sucesso',
};

const GeofenceList = ({ theme }) => {
  const items = useSelector((state) => state.geofences.items);
  const geofences = Object.values(items);

  if (geofences.length === 0) {
    return (
      <p className="text-xs py-3 text-center" style={{ color: theme.textMuted }}>
        Nenhuma cerca criada ainda
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto scrollbar-hide">
      {geofences.map((g) => {
        const isCircle = typeof g.area === 'string' && g.area.startsWith('CIRCLE');
        const geoType = g.attributes?.type || 'custom';
        const { icon: IconComponent, color } = getGeofenceTheme(geoType);
        return (
          <div
            key={g.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl border"
            style={{ background: theme.bgCard, borderColor: theme.borderCard }}
          >
            <span
              className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}18` }}
            >
              <IconComponent sx={{ fontSize: 14, color }} />
            </span>
            <span className="flex-1 min-w-0 text-xs font-semibold truncate" style={{ color: theme.textPrimary }}>
              {g.name}
            </span>
            <span
              className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-lg flex-shrink-0"
              style={{ background: `${theme.accent}15`, color: theme.accent }}
            >
              {isCircle ? 'Circular' : 'Polígono'}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const GeofenceForm = ({
  onBack,
  mode, onSetMode,
  circleStep, circleCenter, circleRadius,
  polyStep, polyPoints,
  onStartDrawing, onResetDrawing, onClosePolygon,
  onSetRadius,
  name, onSetName,
  description, onSetDescription,
  selectedDeviceIds, onToggleDevice, onSelectAllDevices,
  isDrawingDone, canSave, saving,
  onSave,
  showVehicles = true,
}) => {
  const { theme } = useHudTheme();

  const instruction =
    mode === 'circle'
      ? CIRCLE_INSTRUCTIONS[circleStep] ?? ''
      : typeof POLY_INSTRUCTIONS[polyStep] === 'function'
        ? POLY_INSTRUCTIONS[polyStep](polyPoints.length)
        : POLY_INSTRUCTIONS[polyStep] ?? '';

  const drawingActive =
    (mode === 'circle' && circleStep !== 'idle') ||
    (mode === 'polygon' && polyStep !== 'idle');

  return (
    <div
      className="flex flex-col h-full"
      style={{
        background: theme.isDark ? 'rgba(10,12,16,0.97)' : 'rgba(248,250,252,0.97)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-5 py-4 flex-shrink-0 border-b"
        style={{ borderColor: theme.border }}
      >
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-xl flex items-center justify-center border active:scale-95 transition-all flex-shrink-0"
          style={{ background: theme.bgCard, borderColor: theme.borderCard, color: theme.textPrimary }}
        >
          <ArrowBackIcon sx={{ fontSize: 16 }} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.textMuted }}>
            Geofences
          </p>
          <p className="text-base font-black leading-tight" style={{ color: theme.textPrimary }}>
            Nova Cerca
          </p>
        </div>
        <FenceIcon sx={{ fontSize: 22, color: theme.accent, opacity: 0.6 }} />
      </div>

      {/* ── Scrollable body ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5 scrollbar-hide">

        {/* Existing geofences */}
        <div>
          <Label theme={theme}>Cercas Criadas</Label>
          <GeofenceList theme={theme} />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: theme.border }} />
          <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: theme.textMuted }}>
            Nova Cerca
          </span>
          <div className="flex-1 h-px" style={{ background: theme.border }} />
        </div>

        {/* Type tabs */}
        <div>
          <Label theme={theme}>Tipo de Cerca</Label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'circle', label: 'Circular', Icon: RadioButtonUncheckedIcon },
              { key: 'polygon', label: 'Polígono', Icon: PolylineIcon },
            ].map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => onSetMode(key)}
                className="flex items-center gap-2.5 px-3 py-3 rounded-2xl border transition-all active:scale-[0.97]"
                style={{
                  background: mode === key ? `${theme.accent}15` : theme.bgCard,
                  borderColor: mode === key ? theme.accent : theme.borderCard,
                }}
              >
                <Icon sx={{ fontSize: 18, color: mode === key ? theme.accent : theme.textMuted }} />
                <span
                  className="text-xs font-bold"
                  style={{ color: mode === key ? theme.accent : theme.textSecondary }}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Drawing area */}
        <div>
          <Label theme={theme}>Área no Mapa</Label>

          {/* Instruction card */}
          <div
            className="flex items-start gap-3 px-4 py-3 rounded-2xl border mb-3"
            style={{
              background: isDrawingDone ? `${theme.accent}08` : `${theme.accent}06`,
              borderColor: isDrawingDone ? `${theme.accent}40` : `${theme.accent}20`,
            }}
          >
            <TouchAppIcon sx={{ fontSize: 16, color: theme.accent, flexShrink: 0, mt: '1px' }} />
            <p className="text-xs leading-relaxed" style={{ color: theme.textSecondary }}>
              {instruction}
            </p>
          </div>

          {/* Drawing buttons row */}
          <div className="flex gap-2 flex-wrap">
            {/* Start button — only when idle */}
            {!drawingActive && !isDrawingDone && (
              <button
                type="button"
                onClick={onStartDrawing}
                className="flex-1 h-10 rounded-xl font-bold text-xs uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-2"
                style={{ background: theme.accent, color: '#fff', boxShadow: `0 4px 14px ${theme.accent}44` }}
              >
                <AdjustIcon sx={{ fontSize: 16 }} />
                Iniciar Desenho
              </button>
            )}


            {/* Reset button — when drawing active or done */}
            {(drawingActive || isDrawingDone) && (
              <button
                type="button"
                onClick={onResetDrawing}
                className="h-10 px-3.5 rounded-xl border font-bold text-xs active:scale-95 transition-all flex items-center gap-1.5"
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  borderColor: 'rgba(239,68,68,0.25)',
                  color: '#ef4444',
                }}
              >
                <RefreshIcon sx={{ fontSize: 14 }} />
                Refazer
              </button>
            )}
          </div>

          {/* Radius controls — visible as soon as center is placed */}
          {mode === 'circle' && circleCenter && (
            <div className="mt-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label theme={theme}>Raio</Label>
                <span className="text-sm font-black tabular-nums" style={{ color: theme.accent }}>
                  {circleRadius >= 1000
                    ? `${(circleRadius / 1000).toFixed(1)} km`
                    : `${circleRadius} m`}
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={50000}
                step={50}
                value={circleRadius}
                onChange={(e) => onSetRadius(e.target.value)}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: theme.accent }}
              />
              <input
                type="number"
                min={10}
                max={100000}
                value={circleRadius}
                onChange={(e) => onSetRadius(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border text-sm font-bold outline-none text-center"
                style={{
                  background: theme.bgCard,
                  borderColor: theme.borderCard,
                  color: theme.textPrimary,
                }}
              />
            </div>
          )}
        </div>

        {/* Form fields — visible only after drawing complete */}
        {isDrawingDone && (
          <>
            {/* Name */}
            <div>
              <Label theme={theme}>Nome da Cerca *</Label>
              <input
                autoFocus
                value={name}
                onChange={(e) => onSetName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && canSave && onSave()}
                placeholder="Ex: Escritório, Depósito, Casa…"
                className="w-full px-4 py-3 rounded-2xl border text-sm font-semibold outline-none transition-all"
                style={{
                  background: theme.bgCard,
                  borderColor: name.trim() ? theme.accent : theme.borderCard,
                  color: theme.textPrimary,
                }}
              />
            </div>

            {/* Description */}
            <div>
              <Label theme={theme}>Descrição (opcional)</Label>
              <input
                value={description}
                onChange={(e) => onSetDescription(e.target.value)}
                placeholder="Observações sobre esta área…"
                className="w-full px-4 py-3 rounded-2xl border text-sm outline-none"
                style={{
                  background: theme.bgCard,
                  borderColor: theme.borderCard,
                  color: theme.textPrimary,
                }}
              />
            </div>

            {/* Vehicle selector */}
            {showVehicles && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <DirectionsCarIcon sx={{ fontSize: 14, color: theme.accent }} />
                  <Label theme={theme}>Vincular Veículos</Label>
                </div>
                <VehicleSelector
                  selectedIds={selectedDeviceIds}
                  onToggle={onToggleDevice}
                  onSelectAll={onSelectAllDevices}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Footer actions ──────────────────────────────────────────────────── */}
      <div
        className="flex gap-3 px-5 py-4 flex-shrink-0 border-t"
        style={{ borderColor: theme.border }}
      >
        <button
          type="button"
          onClick={onBack}
          className="flex-1 h-12 rounded-2xl border font-bold text-xs uppercase tracking-widest active:scale-95 transition-all"
          style={{ background: theme.bgCard, borderColor: theme.borderCard, color: theme.textMuted }}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave || saving}
          className="flex-[2] h-12 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-40"
          style={{
            background: canSave && !saving ? theme.accent : theme.bgSecondary,
            color: canSave && !saving ? '#fff' : theme.textMuted,
            boxShadow: canSave && !saving ? `0 6px 20px ${theme.accent}55` : 'none',
          }}
        >
          {saving ? <CircularProgress size={14} color="inherit" /> : <CheckIcon sx={{ fontSize: 16 }} />}
          {saving ? 'Salvando…' : 'Salvar Cerca'}
        </button>
      </div>
    </div>
  );
};

export default GeofenceForm;
