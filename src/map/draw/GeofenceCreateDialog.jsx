import { useState } from 'react';
import dayjs from 'dayjs';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  RadioGroup,
  Radio,
  Autocomplete,
  Chip,
  Divider,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { useEffectAsync } from '../../reactHelper';
import fetchOrThrow from '../../common/util/fetchOrThrow';
import { GEOFENCE_TYPES } from '../../common/util/geofenceTypes';

const DAYS_CONFIG = [
  { value: 'MO', label: 'Seg' },
  { value: 'TU', label: 'Ter' },
  { value: 'WE', label: 'Qua' },
  { value: 'TH', label: 'Qui' },
  { value: 'FR', label: 'Sex' },
  { value: 'SA', label: 'Sáb' },
  { value: 'SU', label: 'Dom' },
];

const ALL_DAYS = DAYS_CONFIG.map((d) => d.value);
const WEEKDAYS = ['MO', 'TU', 'WE', 'TH', 'FR'];

const formatCalendarTime = (time) => {
  const tzid = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return `TZID=${tzid}:${time.locale('en').format('YYYYMMDDTHHmmss')}`;
};

/**
 * Generates a Base64-encoded iCalendar (ICS) string compatible with Traccar.
 */
const generateICS = ({ startDate, endDate, startTime, endTime, selectedDays, dayMode }) => {
  const start = startTime || '00:00';
  const end = endTime || '23:59';

  const dtStart = startDate
    ? dayjs(`${startDate}T${start}`)
    : dayjs()
        .startOf('day')
        .hour(parseInt(start.split(':')[0], 10))
        .minute(parseInt(start.split(':')[1], 10));

  const dtEnd = startDate
    ? dayjs(`${startDate}T${end}`)
    : dayjs()
        .startOf('day')
        .hour(parseInt(end.split(':')[0], 10))
        .minute(parseInt(end.split(':')[1], 10));

  // Build RRULE
  let rrule;
  if (endDate && endDate !== startDate) {
    // Date range with recurrence
    const until = dayjs(`${endDate}T23:59:59`).locale('en').format('YYYYMMDDTHHmmss') + 'Z';
    if (dayMode === 'all' || selectedDays.length === 7) {
      rrule = `RRULE:FREQ=DAILY;UNTIL=${until}`;
    } else {
      rrule = `RRULE:FREQ=WEEKLY;BYDAY=${selectedDays.join(',')};UNTIL=${until}`;
    }
  } else if (dayMode === 'all' || selectedDays.length === 7) {
    rrule = 'RRULE:FREQ=DAILY';
  } else {
    rrule = `RRULE:FREQ=WEEKLY;BYDAY=${selectedDays.join(',')}`;
  }

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Traccar//NONSGML Traccar//EN',
    'BEGIN:VEVENT',
    'UID:' + crypto.randomUUID(),
    `DTSTART;${formatCalendarTime(dtStart)}`,
    `DTEND;${formatCalendarTime(dtEnd)}`,
    rrule,
    'SUMMARY:Geocerca',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return window.btoa(lines.join('\n'));
};

const GeofenceCreateDialog = ({ open, onSave, onCancel }) => {
  const t = useTranslation();

  const [name, setName] = useState(t('sharedGeofence'));
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [dayMode, setDayMode] = useState('all');
  const [selectedDays, setSelectedDays] = useState([...ALL_DAYS]);
  const [hide, setHide] = useState(false);
  const [type, setType] = useState('custom'); // new type state
  const [linkMode, setLinkMode] = useState('all'); // 'all' | 'devices' | 'groups'
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [devices, setDevices] = useState([]);
  const [groups, setGroups] = useState([]);

  const hasSchedule = startTime || endTime || startDate || endDate || dayMode !== 'all';

  useEffectAsync(async () => {
    if (open) {
      try {
        const [devRes, grpRes] = await Promise.all([
          fetchOrThrow('/api/devices'),
          fetchOrThrow('/api/groups'),
        ]);
        setDevices(await devRes.json());
        setGroups(await grpRes.json());
      } catch {
        // silently fail
      }
    }
  }, [open]);

  const handleDayModeChange = (e) => {
    const mode = e.target.value;
    setDayMode(mode);
    if (mode === 'all') setSelectedDays([...ALL_DAYS]);
    else if (mode === 'weekdays') setSelectedDays([...WEEKDAYS]);
  };

  const handleDayToggle = (_, newDays) => {
    if (newDays.length > 0) {
      setSelectedDays(newDays);
      if (newDays.length === 7) setDayMode('all');
      else if (newDays.length === 5 && WEEKDAYS.every((d) => newDays.includes(d)))
        setDayMode('weekdays');
      else setDayMode('custom');
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;

    let calendarData = null;
    if (hasSchedule) {
      calendarData = generateICS({
        startDate,
        endDate,
        startTime,
        endTime,
        selectedDays,
        dayMode,
      });
    }

    const scheduleAttrs = {};
    if (startTime) scheduleAttrs.startTime = startTime;
    if (endTime) scheduleAttrs.endTime = endTime;
    if (startDate) scheduleAttrs.startDate = startDate;
    if (endDate) scheduleAttrs.endDate = endDate;
    if (dayMode !== 'all') scheduleAttrs.activeDays = selectedDays.join(',');

    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
      attributes: { hide, type, ...scheduleAttrs },
      calendarData,
      linkMode,
      selectedDeviceIds: selectedDevices.map((d) => d.id),
      selectedGroupIds: selectedGroups.map((g) => g.id),
    };
    onSave(data);
    resetForm();
  };

  const handleCancel = () => {
    onCancel();
    resetForm();
  };

  const resetForm = () => {
    setName(t('sharedGeofence'));
    setDescription('');
    setStartDate('');
    setEndDate('');
    setStartTime('');
    setEndTime('');
    setDayMode('all');
    setSelectedDays([...ALL_DAYS]);
    setHide(false);
    setType('custom');
    setLinkMode('all');
    setSelectedDevices([]);
    setSelectedGroups([]);
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>{t('sharedGeofence')}</DialogTitle>
      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}
      >
        <TextField
          label={t('sharedName')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
          fullWidth
        />

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          Categoria / Tipo
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {GEOFENCE_TYPES.map((gType) => (
            <Chip
              key={gType.value}
              icon={gType.icon}
              label={gType.label}
              onClick={() => setType(gType.value)}
              variant={type === gType.value ? 'filled' : 'outlined'}
              sx={{
                fontWeight: 600,
                borderColor: gType.color + '50',
                color: type === gType.value ? '#fff' : gType.color,
                backgroundColor: type === gType.value ? gType.color : 'transparent',
                '&:hover': {
                  backgroundColor: type === gType.value ? gType.color : gType.color + '15',
                },
                '& .MuiChip-icon': {
                  color: type === gType.value ? '#fff' : gType.color,
                }
              }}
            />
          ))}
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          Período de ativação (opcional)
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <TextField
            label="Data início"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Data fim"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <TextField
            label="Hora início"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Hora fim"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
          Dias da semana
        </Typography>
        <RadioGroup row value={dayMode} onChange={handleDayModeChange} sx={{ gap: 1 }}>
          <FormControlLabel
            value="all"
            control={<Radio size="small" />}
            label={<Typography variant="body2">Todos os dias</Typography>}
          />
          <FormControlLabel
            value="weekdays"
            control={<Radio size="small" />}
            label={<Typography variant="body2">Seg a Sex</Typography>}
          />
          <FormControlLabel
            value="custom"
            control={<Radio size="small" />}
            label={<Typography variant="body2">Personalizado</Typography>}
          />
        </RadioGroup>

        <ToggleButtonGroup
          value={selectedDays}
          onChange={handleDayToggle}
          size="small"
          sx={{
            display: 'flex',
            gap: 0.5,
            '& .MuiToggleButton-root': {
              flex: 1,
              borderRadius: '8px !important',
              border: '1px solid',
              borderColor: 'divider',
              fontSize: '0.75rem',
              fontWeight: 600,
              py: 0.75,
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                borderColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              },
            },
          }}
        >
          {DAYS_CONFIG.map((day) => (
            <ToggleButton key={day.value} value={day.value}>
              {day.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <Divider sx={{ my: 1 }} />
        <Typography variant="caption" color="text.secondary">
          Vincular a dispositivos
        </Typography>
        <RadioGroup
          row
          value={linkMode}
          onChange={(e) => setLinkMode(e.target.value)}
          sx={{ gap: 1 }}
        >
          <FormControlLabel
            value="all"
            control={<Radio size="small" />}
            label={<Typography variant="body2">Todos os dispositivos</Typography>}
          />
          <FormControlLabel
            value="devices"
            control={<Radio size="small" />}
            label={<Typography variant="body2">Dispositivos específicos</Typography>}
          />
          <FormControlLabel
            value="groups"
            control={<Radio size="small" />}
            label={<Typography variant="body2">Por grupo</Typography>}
          />
        </RadioGroup>

        {linkMode === 'devices' && (
          <Autocomplete
            multiple
            options={devices}
            getOptionLabel={(opt) => opt.name || `ID ${opt.id}`}
            value={selectedDevices}
            onChange={(_, val) => setSelectedDevices(val)}
            renderInput={(params) => (
              <TextField {...params} label="Selecionar dispositivos" placeholder="Buscar..." />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option.id}
                  label={option.name}
                  size="small"
                />
              ))
            }
            size="small"
          />
        )}

        {linkMode === 'groups' && (
          <Autocomplete
            multiple
            options={groups}
            getOptionLabel={(opt) => opt.name || `ID ${opt.id}`}
            value={selectedGroups}
            onChange={(_, val) => setSelectedGroups(val)}
            renderInput={(params) => (
              <TextField {...params} label="Selecionar grupos" placeholder="Buscar..." />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option.id}
                  label={option.name}
                  size="small"
                />
              ))
            }
            size="small"
          />
        )}

        <TextField
          label={t('sharedDescription')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          multiline
          rows={2}
        />
        <FormControlLabel
          control={<Checkbox checked={hide} onChange={(e) => setHide(e.target.checked)} />}
          label={t('sharedFilterMap')}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>{t('sharedCancel')}</Button>
        <Button onClick={handleSave} variant="contained" disabled={!name.trim()}>
          {t('sharedSave')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GeofenceCreateDialog;
