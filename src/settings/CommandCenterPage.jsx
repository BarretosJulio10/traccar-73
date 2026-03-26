import { useState, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Container,
  Button,
  Autocomplete,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Snackbar,
  Alert,
  Paper,
  Box,
  IconButton,
  Tooltip,
  CircularProgress,
  Card,
  CardActionArea,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ErrorIcon from '@mui/icons-material/Error';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import UpdateIcon from '@mui/icons-material/Update';
import TerminalIcon from '@mui/icons-material/Terminal';
import SettingsIcon from '@mui/icons-material/Settings';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SmsIcon from '@mui/icons-material/Sms';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import SpeedIcon from '@mui/icons-material/Speed';
import TimezoneIcon from '@mui/icons-material/AccessTime';
import PhoneIcon from '@mui/icons-material/Phone';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import RouterIcon from '@mui/icons-material/Router';
import BatteryAlertIcon from '@mui/icons-material/BatteryAlert';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import VibrateIcon from '@mui/icons-material/Vibration';
import SystemUpdateIcon from '@mui/icons-material/SystemUpdate';
import DeviceHubIcon from '@mui/icons-material/DeviceHub';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import { useCatch, useEffectAsync } from '../reactHelper';
import useSettingsStyles from './common/useSettingsStyles';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { prefixString } from '../common/util/stringUtils';
import { getProtocolPort, getProtocolName } from '../common/util/protocolPorts';
import useCommandAttributes from '../common/attributes/useCommandAttributes';
import dayjs from 'dayjs';

// Map command types to MUI icons
const COMMAND_ICONS = {
  custom: TerminalIcon,
  engineStop: LockIcon,
  engineResume: LockOpenIcon,
  positionSingle: GpsFixedIcon,
  positionPeriodic: UpdateIcon,
  positionStop: GpsFixedIcon,
  setTimezone: TimezoneIcon,
  requestPhoto: CameraAltIcon,
  powerOff: PowerSettingsNewIcon,
  rebootDevice: RestartAltIcon,
  sendSms: SmsIcon,
  sendUssd: PhoneIcon,
  sosNumber: PhoneIcon,
  silenceTime: VolumeUpIcon,
  setPhonebook: PhoneIcon,
  voiceMessage: VolumeUpIcon,
  outputControl: ToggleOnIcon,
  voiceMonitoring: VolumeUpIcon,
  setAgps: MyLocationIcon,
  setIndicator: ToggleOnIcon,
  configuration: SettingsIcon,
  getVersion: DeviceHubIcon,
  firmwareUpdate: SystemUpdateIcon,
  setConnection: RouterIcon,
  setOdometer: SpeedIcon,
  getModemStatus: RouterIcon,
  getDeviceStatus: DeviceHubIcon,
  setSpeedLimit: SpeedIcon,
  modePowerSaving: PowerSettingsNewIcon,
  modeDeepSleep: PowerSettingsNewIcon,
  alarmArm: NotificationsActiveIcon,
  alarmDisarm: NotificationsOffIcon,
  alarmDismiss: NotificationsOffIcon,
  alarmGeofence: MyLocationIcon,
  alarmBattery: BatteryAlertIcon,
  alarmSos: NotificationsActiveIcon,
  alarmRemove: NotificationsOffIcon,
  alarmClock: TimezoneIcon,
  alarmSpeed: SpeedIcon,
  alarmFall: NotificationsActiveIcon,
  alarmVibration: VibrateIcon,
  factoryReset: RestartAltIcon,
  message: SmsIcon,
  deviceIdentification: DeviceHubIcon,
};

const CommandCenterPage = () => {
  const { classes } = useSettingsStyles();
  const t = useTranslation();
  const commandAttributes = useCommandAttributes(t);

  const devices = useSelector((state) => state.devices.items);
  const positions = useSelector((state) => state.session.positions);
  const deviceList = Object.values(devices);

  const [selectedDevice, setSelectedDevice] = useState(null);
  const [selectedCommandType, setSelectedCommandType] = useState(null);
  const [commandTypes, setCommandTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [item, setItem] = useState({});
  const [commandLog, setCommandLog] = useState([]);
  const [loadingLog, setLoadingLog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [engineConfirmOpen, setEngineConfirmOpen] = useState(false);

  // Get protocol info from position
  const devicePosition = selectedDevice ? positions[selectedDevice.id] : null;
  const protocol = devicePosition?.protocol || null;
  const port = getProtocolPort(protocol);

  // Get parameter fields for the selected command type
  const commandParams = useMemo(() => {
    if (!selectedCommandType) return [];
    return commandAttributes[selectedCommandType] || [];
  }, [selectedCommandType, commandAttributes]);

  const fetchCommandTypes = useCallback(async (deviceId) => {
    setLoadingTypes(true);
    try {
      const response = await fetchOrThrow(`/api/commands/types?deviceId=${deviceId}`, {
        headers: { Accept: 'application/json' },
      });
      const types = await response.json();
      setCommandTypes(types.map((cmd) => cmd.type));
    } catch {
      setCommandTypes([]);
    } finally {
      setLoadingTypes(false);
    }
  }, []);

  const fetchCommandLog = useCallback(
    async (deviceId) => {
      if (!deviceId) {
        setCommandLog([]);
        return;
      }
      setLoadingLog(true);
      try {
        const from = dayjs().subtract(7, 'day').toISOString();
        const to = dayjs().toISOString();
        const response = await fetchOrThrow(
          `/api/reports/events?deviceId=${deviceId}&type=commandResult&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
          { headers: { Accept: 'application/json' } },
        );
        const events = await response.json();
        const logEntries = events.map((ev) => ({
          id: ev.id,
          time: ev.eventTime || ev.serverTime,
          type: ev.type,
          description: ev.attributes?.result || ev.attributes?.command || t('commandResponse'),
          status: 'received',
        }));
        logEntries.sort((a, b) => new Date(b.time) - new Date(a.time));
        setCommandLog(logEntries);
      } catch {
        setCommandLog([]);
      } finally {
        setLoadingLog(false);
      }
    },
    [t],
  );

  useEffectAsync(async () => {
    if (selectedDevice) {
      await Promise.all([fetchCommandTypes(selectedDevice.id), fetchCommandLog(selectedDevice.id)]);
    }
  }, [selectedDevice]);

  const handleSend = useCatch(async () => {
    const command = {
      deviceId: selectedDevice.id,
      type: selectedCommandType,
      attributes: {},
    };

    // Fill attributes from item
    if (commandParams.length > 0) {
      commandParams.forEach((param) => {
        if (item[param.key] !== undefined) {
          command.attributes[param.key] = item[param.key];
        }
      });
    }

    await fetchOrThrow('/api/commands/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
    });

    setSnackbar({ open: true, message: t('commandSent'), severity: 'success' });
    setSelectedCommandType(null);
    setItem({});
    setTimeout(() => fetchCommandLog(selectedDevice.id), 2000);
  });

  const handleDeviceChange = (_, value) => {
    setSelectedDevice(value);
    setSelectedCommandType(null);
    setItem({});
    setCommandTypes([]);
    setCommandLog([]);
  };

  const handleCommandSelect = (type) => {
    setSelectedCommandType(type);
    setItem({});
  };

  const validate = () => selectedDevice && selectedCommandType;

  const getStatusChip = (status) => {
    switch (status) {
      case 'received':
        return (
          <Chip
            icon={<CheckCircleIcon />}
            label={t('commandDelivered')}
            color="success"
            size="small"
            variant="outlined"
          />
        );
      case 'pending':
        return (
          <Chip
            icon={<HourglassEmptyIcon />}
            label={t('commandPending')}
            color="warning"
            size="small"
            variant="outlined"
          />
        );
      case 'failed':
        return (
          <Chip
            icon={<ErrorIcon />}
            label={t('commandFailed')}
            color="error"
            size="small"
            variant="outlined"
          />
        );
      default:
        return <Chip label={status} size="small" variant="outlined" />;
    }
  };

  const getCommandIcon = (type) => {
    const Icon = COMMAND_ICONS[type] || SettingsIcon;
    return <Icon />;
  };

  const getCommandLabel = (type) => t(prefixString('command', type)) || type;

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'commandCenter']}>
      <Container maxWidth="md" className={classes.container}>
        {/* Device Selector */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">{t('commandCenter')}</Typography>
          </AccordionSummary>
          <AccordionDetails className={classes.details}>
            <Autocomplete
              size="small"
              options={deviceList}
              getOptionLabel={(option) => option.name || ''}
              isOptionEqualToValue={(option, value) => option.id === value?.id}
              value={selectedDevice}
              onChange={handleDeviceChange}
              renderInput={(params) => <TextField {...params} label={t('reportDevice')} />}
            />
          </AccordionDetails>
        </Accordion>

        {/* Protocol & Port Info */}
        {selectedDevice && (
          <Paper
            sx={{
              mt: 2,
              px: 2.5,
              py: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              flexWrap: 'wrap',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <RouterIcon color="primary" fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                {t('commandProtocol')}:
              </Typography>
              <Chip
                label={getProtocolName(protocol)}
                size="small"
                color={protocol ? 'primary' : 'default'}
                variant="outlined"
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DeviceHubIcon color="primary" fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                {t('commandPort')}:
              </Typography>
              <Chip
                label={port || '—'}
                size="small"
                color={port ? 'info' : 'default'}
                variant="outlined"
              />
            </Box>
          </Paper>
        )}

        {/* Command Grid */}
        {selectedDevice && (
          <Paper sx={{ mt: 2, p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
              {t('commandQuickActions')}
            </Typography>
            {loadingTypes ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={28} />
              </Box>
            ) : commandTypes.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ py: 2, textAlign: 'center' }}
              >
                {t('sharedNoData')}
              </Typography>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: 1.5,
                }}
              >
                {commandTypes.map((type) => (
                  <Card
                    key={type}
                    variant="outlined"
                    sx={{
                      borderColor: selectedCommandType === type ? 'primary.main' : 'divider',
                      borderWidth: selectedCommandType === type ? 2 : 1,
                      bgcolor:
                        selectedCommandType === type ? 'action.selected' : 'background.paper',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <CardActionArea onClick={() => handleCommandSelect(type)} sx={{ p: 1.5 }}>
                      <CardContent
                        sx={{
                          p: 0,
                          '&:last-child': { pb: 0 },
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 0.5,
                        }}
                      >
                        <Box
                          sx={{
                            color: selectedCommandType === type ? 'primary.main' : 'text.secondary',
                          }}
                        >
                          {getCommandIcon(type)}
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            textAlign: 'center',
                            fontWeight: selectedCommandType === type ? 600 : 400,
                            color: selectedCommandType === type ? 'primary.main' : 'text.primary',
                            lineHeight: 1.2,
                          }}
                        >
                          {getCommandLabel(type)}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                ))}
              </Box>
            )}
          </Paper>
        )}

        {/* Command Parameters */}
        {selectedCommandType && commandParams.length > 0 && (
          <Paper sx={{ mt: 2, p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
              {t('commandSelectCommand')}: {getCommandLabel(selectedCommandType)}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {commandParams.map((param) => {
                if (param.type === 'boolean') {
                  return (
                    <TextField
                      key={param.key}
                      select
                      label={param.name}
                      size="small"
                      value={item[param.key] !== undefined ? String(item[param.key]) : ''}
                      onChange={(e) => setItem({ ...item, [param.key]: e.target.value === 'true' })}
                      SelectProps={{ native: true }}
                    >
                      <option value="" />
                      <option value="true">{t('sharedYes')}</option>
                      <option value="false">{t('sharedNo')}</option>
                    </TextField>
                  );
                }
                return (
                  <TextField
                    key={param.key}
                    label={param.name}
                    size="small"
                    type={param.type === 'number' ? 'number' : 'text'}
                    value={item[param.key] || ''}
                    onChange={(e) =>
                      setItem({
                        ...item,
                        [param.key]:
                          param.type === 'number' ? Number(e.target.value) : e.target.value,
                      })
                    }
                  />
                );
              })}
            </Box>
          </Paper>
        )}

        {/* Send Button */}
        <div className={classes.buttons}>
          <Button
            type="button"
            color="primary"
            variant="outlined"
            onClick={() => {
              setSelectedDevice(null);
              setSelectedCommandType(null);
              setItem({});
              setCommandLog([]);
              setCommandTypes([]);
            }}
          >
            {t('sharedCancel')}
          </Button>
          <Button
            type="button"
            color="primary"
            variant="contained"
            onClick={() => {
              if (selectedCommandType === 'engineStop' || selectedCommandType === 'engineResume') {
                setEngineConfirmOpen(true);
              } else {
                handleSend();
              }
            }}
            disabled={!validate()}
            startIcon={<SendIcon />}
          >
            {t('commandSend')}
          </Button>
        </div>

        {/* Command History */}
        {selectedDevice && (
          <Paper sx={{ mt: 2, mb: 4 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 2,
                py: 1.5,
              }}
            >
              <Typography variant="subtitle1">{t('commandHistory')}</Typography>
              <Tooltip title={t('sharedRefresh') || 'Refresh'}>
                <IconButton
                  size="small"
                  onClick={() => fetchCommandLog(selectedDevice.id)}
                  disabled={loadingLog}
                >
                  {loadingLog ? <CircularProgress size={20} /> : <RefreshIcon />}
                </IconButton>
              </Tooltip>
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('sharedDate') || 'Data'}</TableCell>
                  <TableCell>{t('sharedDescription') || 'Descrição'}</TableCell>
                  <TableCell>{t('commandStatus')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {commandLog.length === 0 && !loadingLog ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                        {t('sharedNoData')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  commandLog.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{dayjs(entry.time).format('DD/MM/YYYY HH:mm:ss')}</TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell>{getStatusChip(entry.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>
        )}
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Engine block/unblock confirmation dialog */}
      <Dialog open={engineConfirmOpen} onClose={() => setEngineConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>
          {selectedCommandType === 'engineStop' ? t('commandConfirmBlock') : t('commandConfirmUnblock')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {selectedCommandType === 'engineStop'
              ? `Confirmar envio do comando de BLOQUEIO para "${selectedDevice?.name}"?`
              : `Confirmar envio do comando de DESBLOQUEIO para "${selectedDevice?.name}"?`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEngineConfirmOpen(false)}>{t('sharedCancel')}</Button>
          <Button
            variant="contained"
            color={selectedCommandType === 'engineStop' ? 'error' : 'success'}
            onClick={() => { setEngineConfirmOpen(false); handleSend(); }}
          >
            {t('sharedConfirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </PageLayout>
  );
};

export default CommandCenterPage;
