import { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useMediaQuery, useTheme as useMuiTheme } from '@mui/material';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import AdjustIcon from '@mui/icons-material/Adjust';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckIcon from '@mui/icons-material/Check';
import PolylineIcon from '@mui/icons-material/Polyline';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { CircularProgress } from '@mui/material';
import { useHudTheme } from '../../common/util/ThemeContext';
import { errorsActions, geofencesActions } from '../../store';
import MapView from '../../map/core/MapView';
import MapScale from '../../map/MapScale';
import GeofenceMap from './GeofenceMap';
import MapGeofence from '../../map/MapGeofence';
import GeofenceListCrud from './GeofenceListCrud';
import GeofenceForm from './GeofenceForm';
import VehicleSelector from './VehicleSelector';
import useGeofence from './useGeofence';
import { createGeofence, linkGeofenceToDevice } from './geofenceService';

/* ──────────────────────────────────────────────────────────────────────────────
   GeofenceScreen
   Layout:
   • Desktop (≥md): fixed full-screen overlay — left panel 380px + map fills rest
   • Mobile (<md):  fixed full-screen overlay — map fills all + bottom sheet
────────────────────────────────────────────────────────────────────────────── */
const GeofenceScreen = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { theme } = useHudTheme();
  const muiTheme = useMuiTheme();
  const desktop = useMediaQuery(muiTheme.breakpoints.up('md'));
  const [searchParams] = useSearchParams();
  const initialDeviceId = searchParams.get('deviceId');

  const geo = useGeofence(initialDeviceId);
  const [saving, setSaving] = useState(false);

  const handleBack = useCallback(() => navigate(-1), [navigate]);

  const handleSave = useCallback(async () => {
    if (!geo.canSave || !geo.area) return;
    setSaving(true);
    try {
      const geofence = await createGeofence({
        name: geo.name.trim(),
        area: geo.area,
        description: geo.description.trim() || undefined,
      });
      const safeGeofence = { attributes: {}, ...geofence };
      // Link all selected vehicles (parallel, ignore individual failures)
      await Promise.all(
        geo.selectedDeviceIds.map((id) => linkGeofenceToDevice(geofence.id, id).catch(() => {})),
      );
      dispatch(geofencesActions.update([safeGeofence]));
      navigate(-1);
    } catch (err) {
      dispatch(errorsActions.push(err.message));
    } finally {
      setSaving(false);
    }
  }, [geo.canSave, geo.area, geo.name, geo.description, geo.selectedDeviceIds, dispatch, navigate]);

  // Props forwarded to both GeofenceForm and mobile bottom sheet
  const formProps = {
    onBack: handleBack,
    mode: geo.mode, onSetMode: geo.setMode,
    circleStep: geo.circleStep, circleCenter: geo.circleCenter, circleRadius: geo.circleRadius,
    polyStep: geo.polyStep, polyPoints: geo.polyPoints,
    onStartDrawing: geo.startDrawing,
    onResetDrawing: geo.resetDrawing,
    onClosePolygon: geo.closePolygon,
    onSetRadius: geo.handleSetRadius,
    name: geo.name, onSetName: geo.setName,
    description: geo.description, onSetDescription: geo.setDescription,
    selectedDeviceIds: geo.selectedDeviceIds,
    onToggleDevice: geo.toggleDevice,
    onSelectAllDevices: geo.setAllDevices,
    isDrawingDone: geo.isDrawingDone,
    canSave: geo.canSave,
    saving,
    onSave: handleSave,
  };

  /* ── Map layer props ─────────────────────────────────────────────────────── */
  const mapProps = {
    mode: geo.mode,
    circleStep: geo.circleStep,
    circleCenter: geo.circleCenter,
    circleRadius: geo.circleRadius,
    circleRadiusPreview: geo.circleRadiusPreview,
    polyStep: geo.polyStep,
    polyPoints: geo.polyPoints,
    previewPoint: geo.previewPoint,
    onMapClick: geo.handleMapClick,
    onMouseMove: geo.handleMouseMove,
  };

  /* ── Mobile instruction label ──────────────────────────────────────────── */
  const mobileLabel = (() => {
    if (geo.mode === 'circle') {
      if (geo.circleStep === 'idle') return 'Selecione o tipo e inicie o desenho';
      if (geo.circleStep === 'center') return 'Toque no mapa para definir o centro';
      if (geo.circleStep === 'radius') return 'Toque novamente para definir o raio';
      return 'Preencha os dados abaixo';
    }
    if (geo.polyStep === 'idle') return 'Selecione o tipo e inicie o desenho';
    if (geo.polyStep === 'drawing') return geo.polyPoints.length >= 3 ? `${geo.polyPoints.length} pts — duplo toque para fechar` : `${geo.polyPoints.length} ponto${geo.polyPoints.length !== 1 ? 's' : ''} — toque para adicionar`;
    return 'Preencha os dados abaixo';
  })();

  /* ────────────────────────────────────────────────────────────────────────── */
  return (
    /* position:fixed + z-[300] ensures this overlays the bottom nav bar too */
    <div className="fixed inset-0 flex overflow-hidden" style={{ zIndex: 300, background: theme.bg }}>

      {/* ── Map (always full-screen behind panels) ──────────────────────── */}
      <div className="absolute inset-0 z-0">
        <MapView>
          <MapGeofence />
          <GeofenceMap {...mapProps} onClosePolygon={geo.closePolygon} />
        </MapView>
      </div>

      {/* ═══════════════ DESKTOP LAYOUT ═══════════════ */}
      {desktop && (
        <div
          className="relative z-10 w-[380px] flex-shrink-0 h-full border-l shadow-2xl overflow-hidden ml-auto"
          style={{ borderColor: theme.border }}
        >
          <GeofenceForm {...formProps} showVehicles />
        </div>
      )}

      {/* ═══════════════ MOBILE LAYOUT ════════════════ */}
      {!desktop && (
        <>
          {/* Floating top bar (back + instruction) — right-[54px] leaves room for maplibre ctrl pill */}
          <div
            className="absolute top-0 left-0 right-[54px] z-10 flex items-center gap-2.5 pointer-events-none"
            style={{ padding: '12px 12px 12px 12px', paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))' }}
          >
            <button
              type="button"
              onClick={handleBack}
              className="pointer-events-auto w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-md border active:scale-95 transition-all flex-shrink-0"
              style={{ background: `${theme.bg}E0`, borderColor: theme.border, color: theme.textPrimary }}
            >
              <ArrowBackIcon sx={{ fontSize: 18 }} />
            </button>
            <div
              className="flex-1 min-w-0 px-3.5 py-2 rounded-2xl backdrop-blur-md border shadow-lg pointer-events-none"
              style={{ background: `${theme.bg}E0`, borderColor: theme.border }}
            >
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: theme.textMuted }}>
                Nova Cerca
              </p>
              <p className="text-xs font-semibold leading-tight truncate" style={{ color: theme.textPrimary }}>
                {mobileLabel}
              </p>
            </div>
            {/* Reset button — shown when drawing is active */}
            {(geo.circleStep !== 'idle' || geo.polyStep !== 'idle') && (
              <button
                type="button"
                onClick={geo.resetDrawing}
                className="pointer-events-auto w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-md border active:scale-95 transition-all flex-shrink-0"
                style={{ background: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' }}
              >
                <RefreshIcon sx={{ fontSize: 18 }} />
              </button>
            )}
          </div>


          {/* ── Mobile bottom sheet ──────────────────────────────────────── */}
          <div className="absolute bottom-0 left-0 right-0 z-10">
            <div
              className="border-t shadow-2xl"
              style={{
                background: theme.isDark ? 'rgba(10,12,16,0.97)' : 'rgba(248,250,252,0.97)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderColor: theme.border,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
              }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full" style={{ background: theme.borderCard }} />
              </div>

              {/* ── Compact panel (not yet done drawing) ──────────────── */}
              {!geo.isDrawingDone && (
                <div className="px-5 pb-6 flex flex-col gap-3">
                  {/* Existing geofences list with CRUD */}
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest mb-1.5" style={{ color: theme.textMuted }}>
                      Cercas Criadas
                    </p>
                    <GeofenceListCrud maxHeight={180} />
                  </div>
                  <div className="h-px" style={{ background: theme.border }} />
                  {/* Type tabs */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'circle', label: 'Circular', Icon: RadioButtonUncheckedIcon },
                      { key: 'polygon', label: 'Polígono', Icon: PolylineIcon },
                    ].map(({ key, label, Icon }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => geo.setMode(key)}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-2xl border transition-all active:scale-[0.97]"
                        style={{
                          background: geo.mode === key ? `${theme.accent}15` : theme.bgCard,
                          borderColor: geo.mode === key ? theme.accent : theme.borderCard,
                        }}
                      >
                        <Icon sx={{ fontSize: 16, color: geo.mode === key ? theme.accent : theme.textMuted }} />
                        <span className="text-xs font-bold" style={{ color: geo.mode === key ? theme.accent : theme.textSecondary }}>
                          {label}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Radius slider (circle, center placed) */}
                  {geo.mode === 'circle' && geo.circleCenter && (
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={50}
                        max={50000}
                        step={50}
                        value={geo.circleRadius}
                        onChange={(e) => geo.handleSetRadius(e.target.value)}
                        className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                        style={{ accentColor: theme.accent }}
                      />
                      <span className="text-sm font-black tabular-nums w-20 text-right" style={{ color: theme.accent }}>
                        {geo.circleRadius >= 1000
                          ? `${(geo.circleRadius / 1000).toFixed(1)} km`
                          : `${geo.circleRadius} m`}
                      </span>
                    </div>
                  )}

                  {/* Draw / start button */}
                  {geo.circleStep === 'idle' && geo.polyStep === 'idle' && (
                    <button
                      type="button"
                      onClick={geo.startDrawing}
                      className="w-full h-12 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
                      style={{ background: theme.accent, color: '#fff', boxShadow: `0 6px 20px ${theme.accent}55` }}
                    >
                      <AdjustIcon sx={{ fontSize: 18 }} />
                      Iniciar Desenho
                    </button>
                  )}

                  {/* Cancel button only */}
                  {geo.circleStep !== 'idle' || geo.polyStep !== 'idle' ? (
                    <button
                      type="button"
                      onClick={handleBack}
                      className="w-full h-10 rounded-2xl border font-bold text-xs uppercase tracking-widest active:scale-95 transition-all"
                      style={{ background: theme.bgCard, borderColor: theme.borderCard, color: theme.textMuted }}
                    >
                      Cancelar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleBack}
                      className="w-full h-10 rounded-2xl border font-bold text-xs uppercase tracking-widest active:scale-95 transition-all"
                      style={{ background: theme.bgCard, borderColor: theme.borderCard, color: theme.textMuted }}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              )}

              {/* ── Full form (drawing done) ───────────────────────────── */}
              {geo.isDrawingDone && (
                <div className="px-5 pb-6 flex flex-col gap-4 max-h-[65vh] overflow-y-auto scrollbar-hide">
                  {/* Radius fine-tune (circle only) */}
                  {geo.mode === 'circle' && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: theme.textMuted }}>Raio</p>
                        <span className="text-sm font-black tabular-nums" style={{ color: theme.accent }}>
                          {geo.circleRadius >= 1000
                            ? `${(geo.circleRadius / 1000).toFixed(1)} km`
                            : `${geo.circleRadius} m`}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={50}
                        max={50000}
                        step={50}
                        value={geo.circleRadius}
                        onChange={(e) => geo.handleSetRadius(e.target.value)}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer"
                        style={{ accentColor: theme.accent }}
                      />
                    </div>
                  )}

                  {/* Name */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: theme.textMuted }}>
                      Nome da Cerca *
                    </p>
                    <input
                      autoFocus
                      value={geo.name}
                      onChange={(e) => geo.setName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && geo.canSave && handleSave()}
                      placeholder="Ex: Escritório, Depósito, Casa…"
                      className="w-full px-4 py-3 rounded-2xl border text-sm font-semibold outline-none transition-all"
                      style={{
                        background: theme.bgCard,
                        borderColor: geo.name.trim() ? theme.accent : theme.borderCard,
                        color: theme.textPrimary,
                      }}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: theme.textMuted }}>
                      Descrição (opcional)
                    </p>
                    <input
                      value={geo.description}
                      onChange={(e) => geo.setDescription(e.target.value)}
                      placeholder="Observações…"
                      className="w-full px-4 py-3 rounded-2xl border text-sm outline-none"
                      style={{ background: theme.bgCard, borderColor: theme.borderCard, color: theme.textPrimary }}
                    />
                  </div>

                  {/* Vehicles */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>
                      Vincular Veículos
                    </p>
                    <VehicleSelector
                      selectedIds={geo.selectedDeviceIds}
                      onToggle={geo.toggleDevice}
                      onSelectAll={geo.setAllDevices}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="flex-1 h-12 rounded-2xl border font-bold text-xs uppercase tracking-widest active:scale-95 transition-all"
                      style={{ background: theme.bgCard, borderColor: theme.borderCard, color: theme.textMuted }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={!geo.canSave || saving}
                      className="flex-[2] h-12 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                      style={{
                        background: geo.canSave && !saving ? theme.accent : theme.bgSecondary,
                        color: geo.canSave && !saving ? '#fff' : theme.textMuted,
                        boxShadow: geo.canSave && !saving ? `0 6px 20px ${theme.accent}55` : 'none',
                      }}
                    >
                      {saving ? <CircularProgress size={14} color="inherit" /> : <CheckIcon sx={{ fontSize: 16 }} />}
                      {saving ? 'Salvando…' : 'Salvar Cerca'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Map scale — positioned to not overlap panels */}
      <div
        className="absolute z-10 pointer-events-auto"
        style={{ left: desktop ? 396 : 16, bottom: 24 }}
      >
        <MapScale />
      </div>
    </div>
  );
};

export default GeofenceScreen;
