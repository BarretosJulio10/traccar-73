import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { CircularProgress } from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';

import fetchOrThrow from '../common/util/fetchOrThrow';
import { errorsActions, geofencesActions } from '../store';
import { STORAGE, scopedKey } from '../core/config/storageKeys';
import { useHudTheme } from '../common/util/ThemeContext';

const WEEK_DAYS = [
  { code: 'SU', label: 'Do' },
  { code: 'MO', label: 'Sg' },
  { code: 'TU', label: 'Tç' },
  { code: 'WE', label: 'Qa' },
  { code: 'TH', label: 'Qi' },
  { code: 'FR', label: 'Sx' },
  { code: 'SA', label: 'Sb' },
];

const UTC_OFFSET = 3; // BRT (UTC-3): store in UTC, display in local

function buildICS(days, startTime, endTime) {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const pad = (n) => String(n).padStart(2, '0');
  const su = (sh + UTC_OFFSET) % 24;
  const eu = (eh + UTC_OFFSET) % 24;
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HyperTraccar//Schedule//EN',
    'BEGIN:VEVENT',
    `DTSTART:20000103T${pad(su)}${pad(sm)}00Z`,
    `DTEND:20000103T${pad(eu)}${pad(em)}00Z`,
    `RRULE:FREQ=WEEKLY;BYDAY=${days.join(',')}`,
    'SUMMARY:Agenda de Cerca',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  return btoa(ics);
}

function parseICS(base64Data) {
  try {
    const ics = atob(base64Data);
    const dtStart = ics.match(/DTSTART[^:]*:(\d{8}T\d{6}Z?)/)?.[1];
    const dtEnd = ics.match(/DTEND[^:]*:(\d{8}T\d{6}Z?)/)?.[1];
    const rrule = ics.match(/RRULE:(.*)/)?.[1];
    let days = [];
    let startTime = '08:00';
    let endTime = '18:00';
    if (dtStart) {
      const h = parseInt(dtStart.substring(9, 11), 10);
      const m = parseInt(dtStart.substring(11, 13), 10);
      startTime = `${String((h - UTC_OFFSET + 24) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
    if (dtEnd) {
      const h = parseInt(dtEnd.substring(9, 11), 10);
      const m = parseInt(dtEnd.substring(11, 13), 10);
      endTime = `${String((h - UTC_OFFSET + 24) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
    if (rrule) {
      const byDay = rrule.match(/BYDAY=([^;\r\n]+)/)?.[1];
      if (byDay) days = byDay.split(',');
    }
    return { days, startTime, endTime };
  } catch {
    return { days: [], startTime: '08:00', endTime: '18:00' };
  }
}

function getGeoRules(geofenceId) {
  try {
    return JSON.parse(localStorage.getItem(scopedKey(STORAGE.ANCHOR_AUTOBLOCK_GEOFENCE)) || '{}')[geofenceId] || {};
  } catch {
    return {};
  }
}

function saveGeoRules(geofenceId, rules) {
  try {
    const all = JSON.parse(localStorage.getItem(scopedKey(STORAGE.ANCHOR_AUTOBLOCK_GEOFENCE)) || '{}');
    localStorage.setItem(scopedKey(STORAGE.ANCHOR_AUTOBLOCK_GEOFENCE), JSON.stringify({ ...all, [geofenceId]: rules }));
  } catch { /* */ }
}

const ToggleRow = ({ active, loading, onClick, label, theme }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={Boolean(loading)}
    className="flex items-center justify-between w-full px-3 py-3 rounded-xl border transition-all active:scale-95"
    style={{
      background: active ? `${theme.accent}12` : theme.bgCard,
      borderColor: active ? `${theme.accent}40` : theme.borderCard,
    }}
  >
    <span className="text-xs font-medium" style={{ color: active ? theme.accent : theme.textSecondary }}>{label}</span>
    {loading ? (
      <CircularProgress size={14} sx={{ color: theme.accent }} />
    ) : (
      <div className="w-9 h-5 rounded-full flex items-center px-0.5 transition-all flex-shrink-0" style={{ background: active ? theme.accent : theme.borderCard }}>
        <div className={`w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${active ? 'translate-x-4' : 'translate-x-0'}`} />
      </div>
    )}
  </button>
);

const SectionTitle = ({ label, theme }) => (
  <div className="flex items-center gap-2 mb-2">
    <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: theme.accent }} />
    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.accent }}>{label}</span>
  </div>
);

const GeofenceConfigPanel = ({ geofence, onUpdate }) => {
  const dispatch = useDispatch();
  const { theme } = useHudTheme();
  const allDevices = useSelector((state) => state.devices.items);
  const allDevicesList = Object.values(allDevices);

  // — Vehicles —
  const [linkedDevices, setLinkedDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [addingDevice, setAddingDevice] = useState(false);
  const [removingDeviceId, setRemovingDeviceId] = useState(null);

  // — Schedule —
  const [days, setDays] = useState([]);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('18:00');
  const [calendarId, setCalendarId] = useState(geofence.calendarId || null);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [clearingSchedule, setClearingSchedule] = useState(false);

  // — Alerts (stored in geofence.attributes) —
  const [alertEnter, setAlertEnter] = useState(Boolean(geofence.attributes?.alertEnter));
  const [alertExit, setAlertExit] = useState(Boolean(geofence.attributes?.alertExit));
  const [savingAlert, setSavingAlert] = useState(null);

  // — Automation (localStorage) —
  const initRules = getGeoRules(geofence.id);
  const [blockOnExit, setBlockOnExit] = useState(Boolean(initRules.blockOnExit));
  const [unblockOnEnter, setUnblockOnEnter] = useState(Boolean(initRules.unblockOnEnter));

  const fetchLinkedDevices = useCallback(async () => {
    setLoadingDevices(true);
    try {
      const res = await fetchOrThrow(`/api/devices?geofenceId=${geofence.id}`);
      setLinkedDevices(await res.json());
    } catch (err) {
      dispatch(errorsActions.push(err.message));
    }
    setLoadingDevices(false);
  }, [geofence.id, dispatch]);

  useEffect(() => {
    fetchLinkedDevices();
    if (geofence.calendarId) {
      fetchOrThrow(`/api/calendars/${geofence.calendarId}`)
        .then((r) => r.json())
        .then((cal) => {
          const p = parseICS(cal.data);
          setDays(p.days);
          setStartTime(p.startTime);
          setEndTime(p.endTime);
        })
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geofence.id, geofence.calendarId]);

  // ---- Vehicles ----
  const handleAddDevice = async () => {
    if (!selectedDeviceId) return;
    setAddingDevice(true);
    try {
      await fetchOrThrow('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: Number(selectedDeviceId), geofenceId: geofence.id }),
      });
      setSelectedDeviceId('');
      await fetchLinkedDevices();
    } catch (err) {
      dispatch(errorsActions.push(err.message));
    }
    setAddingDevice(false);
  };

  const handleRemoveDevice = async (deviceId) => {
    setRemovingDeviceId(deviceId);
    try {
      await fetchOrThrow('/api/permissions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, geofenceId: geofence.id }),
      });
      await fetchLinkedDevices();
    } catch (err) {
      dispatch(errorsActions.push(err.message));
    }
    setRemovingDeviceId(null);
  };

  // ---- Schedule ----
  const toggleDay = (code) => setDays((prev) => (prev.includes(code) ? prev.filter((d) => d !== code) : [...prev, code]));

  const handleSaveSchedule = async () => {
    if (days.length === 0) return;
    setSavingSchedule(true);
    try {
      const icsData = buildICS(days, startTime, endTime);
      let currentCalendarId = calendarId;
      if (currentCalendarId) {
        const existing = await (await fetchOrThrow(`/api/calendars/${currentCalendarId}`)).json();
        await fetchOrThrow(`/api/calendars/${currentCalendarId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...existing, data: icsData }),
        });
      } else {
        const newCal = await (await fetchOrThrow('/api/calendars', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: `Agenda – ${geofence.name}`, data: icsData }),
        })).json();
        currentCalendarId = newCal.id;
        setCalendarId(currentCalendarId);
      }
      const updatedGeofence = { ...geofence, calendarId: currentCalendarId };
      await fetchOrThrow(`/api/geofences/${geofence.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedGeofence),
      });
      dispatch(geofencesActions.update([updatedGeofence]));
    } catch (err) {
      dispatch(errorsActions.push(err.message));
    }
    setSavingSchedule(false);
  };

  const handleClearSchedule = async () => {
    setClearingSchedule(true);
    try {
      const updatedGeofence = { ...geofence, calendarId: null };
      await fetchOrThrow(`/api/geofences/${geofence.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedGeofence),
      });
      if (calendarId) {
        await fetchOrThrow(`/api/calendars/${calendarId}`, { method: 'DELETE' }).catch(() => {});
      }
      setCalendarId(null);
      setDays([]);
      dispatch(geofencesActions.update([updatedGeofence]));
    } catch (err) {
      dispatch(errorsActions.push(err.message));
    }
    setClearingSchedule(false);
  };

  // ---- Alerts ----
  const handleAlertToggle = async (type) => {
    const isEnter = type === 'enter';
    const newVal = isEnter ? !alertEnter : !alertExit;
    setSavingAlert(type);
    try {
      const updatedGeofence = {
        ...geofence,
        attributes: {
          ...geofence.attributes,
          ...(isEnter ? { alertEnter: newVal } : { alertExit: newVal }),
        },
      };
      await fetchOrThrow(`/api/geofences/${geofence.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedGeofence),
      });
      dispatch(geofencesActions.update([updatedGeofence]));
      if (isEnter) setAlertEnter(newVal); else setAlertExit(newVal);
    } catch (err) {
      dispatch(errorsActions.push(err.message));
    }
    setSavingAlert(null);
  };

  // ---- Automation ----
  const handleAutoToggle = (type) => {
    const isExit = type === 'blockOnExit';
    const newBlock = isExit ? !blockOnExit : blockOnExit;
    const newUnblock = isExit ? unblockOnEnter : !unblockOnEnter;
    setBlockOnExit(newBlock);
    setUnblockOnEnter(newUnblock);
    saveGeoRules(geofence.id, { blockOnExit: newBlock, unblockOnEnter: newUnblock });
  };

  const linkedIds = new Set(linkedDevices.map((d) => d.id));
  const availableDevices = allDevicesList.filter((d) => !linkedIds.has(d.id));

  return (
    <div className="flex flex-col gap-5">

      {/* ─── Veículos ─── */}
      <div>
        <SectionTitle label="Veículos Vinculados" theme={theme} />
        {loadingDevices ? (
          <div className="flex justify-center py-3">
            <CircularProgress size={18} sx={{ color: theme.accent }} />
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {linkedDevices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl border"
                style={{ background: theme.bgCard, borderColor: theme.borderCard }}
              >
                <div className="flex items-center gap-2">
                  <DirectionsCarIcon sx={{ fontSize: 16, color: theme.accent }} />
                  <span className="text-xs font-medium" style={{ color: theme.textPrimary }}>{device.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveDevice(device.id)}
                  disabled={removingDeviceId === device.id}
                  className="w-7 h-7 rounded-lg flex items-center justify-center active:scale-95 transition-all disabled:opacity-50"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                >
                  {removingDeviceId === device.id
                    ? <CircularProgress size={12} sx={{ color: '#ef4444' }} />
                    : <DeleteIcon sx={{ fontSize: 14 }} />}
                </button>
              </div>
            ))}
            <div className="flex gap-2 mt-1">
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="flex-1 text-xs rounded-xl px-3 h-10 border"
                style={{
                  background: theme.bgCard,
                  borderColor: theme.borderCard,
                  color: selectedDeviceId ? theme.textPrimary : theme.textMuted,
                }}
              >
                <option value="">Adicionar veículo...</option>
                {availableDevices.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddDevice}
                disabled={!selectedDeviceId || addingDevice}
                className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 transition-all disabled:opacity-40"
                style={{ background: theme.accent, color: theme.isDark ? '#000' : '#fff' }}
              >
                {addingDevice
                  ? <CircularProgress size={14} />
                  : <AddIcon sx={{ fontSize: 18 }} />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Agenda ─── */}
      <div>
        <SectionTitle label="Agenda de Ativação" theme={theme} />
        <div className="flex flex-col gap-2.5">
          <div className="flex gap-1">
            {WEEK_DAYS.map(({ code, label }) => (
              <button
                key={code}
                type="button"
                onClick={() => toggleDay(code)}
                className="flex-1 h-9 rounded-xl text-xs font-bold transition-all active:scale-95"
                style={{
                  background: days.includes(code) ? theme.accent : theme.bgCard,
                  color: days.includes(code) ? (theme.isDark ? '#000' : '#fff') : theme.textMuted,
                  border: `1px solid ${days.includes(code) ? theme.accent : theme.borderCard}`,
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: theme.textMuted }}>Início</p>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full h-10 px-3 rounded-xl text-sm border"
                style={{ background: theme.bgCard, borderColor: theme.borderCard, color: theme.textPrimary }}
              />
            </div>
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: theme.textMuted }}>Fim</p>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full h-10 px-3 rounded-xl text-sm border"
                style={{ background: theme.bgCard, borderColor: theme.borderCard, color: theme.textPrimary }}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSaveSchedule}
              disabled={days.length === 0 || savingSchedule}
              className="flex-1 h-10 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold active:scale-95 transition-all disabled:opacity-40"
              style={{ background: theme.accent, color: theme.isDark ? '#000' : '#fff' }}
            >
              {savingSchedule
                ? <CircularProgress size={14} />
                : <SaveIcon sx={{ fontSize: 16 }} />}
              Salvar Agenda
            </button>
            {calendarId && (
              <button
                type="button"
                onClick={handleClearSchedule}
                disabled={clearingSchedule}
                className="h-10 px-3 rounded-xl flex items-center justify-center active:scale-95 transition-all disabled:opacity-40"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                {clearingSchedule ? <CircularProgress size={14} sx={{ color: '#ef4444' }} /> : <DeleteIcon sx={{ fontSize: 16 }} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Alertas ─── */}
      <div>
        <SectionTitle label="Alertas" theme={theme} />
        <div className="flex flex-col gap-2">
          <ToggleRow
            active={alertEnter}
            loading={savingAlert === 'enter'}
            onClick={() => handleAlertToggle('enter')}
            label="Alertar ao entrar na cerca"
            theme={theme}
          />
          <ToggleRow
            active={alertExit}
            loading={savingAlert === 'exit'}
            onClick={() => handleAlertToggle('exit')}
            label="Alertar ao sair da cerca"
            theme={theme}
          />
        </div>
      </div>

      {/* ─── Bloqueio Automático ─── */}
      <div>
        <SectionTitle label="Bloqueio Automático" theme={theme} />
        <div className="flex flex-col gap-2">
          <ToggleRow
            active={blockOnExit}
            loading={false}
            onClick={() => handleAutoToggle('blockOnExit')}
            label="Bloquear motor ao sair da cerca"
            theme={theme}
          />
          <ToggleRow
            active={unblockOnEnter}
            loading={false}
            onClick={() => handleAutoToggle('unblockOnEnter')}
            label="Desbloquear motor ao entrar"
            theme={theme}
          />
        </div>
        {(blockOnExit || unblockOnEnter) && linkedDevices.length === 0 && (
          <p className="text-xs mt-2 font-medium" style={{ color: '#f59e0b' }}>
            Vincule veículos acima para ativar o bloqueio automático
          </p>
        )}
      </div>

    </div>
  );
};

export default GeofenceConfigPanel;
