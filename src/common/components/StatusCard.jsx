import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Rnd } from 'react-rnd';
import {
  Card,
  CardContent,
  Typography,
  CardActions,
  IconButton,
  Menu,
  MenuItem,
  CardMedia,
  Link,
  Tooltip,
  Box,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useTheme, useMediaQuery } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RouteIcon from '@mui/icons-material/Route';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PendingIcon from '@mui/icons-material/Pending';
import SpeedIcon from '@mui/icons-material/Speed';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import NavigationIcon from '@mui/icons-material/Navigation';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import Battery60Icon from '@mui/icons-material/Battery60';
import Battery20Icon from '@mui/icons-material/Battery20';
import PowerIcon from '@mui/icons-material/Power';
import PowerOffIcon from '@mui/icons-material/PowerOff';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import NightlightIcon from '@mui/icons-material/Nightlight';
import AnchorIcon from '@mui/icons-material/Anchor';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import HeightIcon from '@mui/icons-material/Height';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import NetworkCellIcon from '@mui/icons-material/NetworkCell';
import InfoIcon from '@mui/icons-material/Info';
import ShareIcon from '@mui/icons-material/Share';
import GridViewIcon from '@mui/icons-material/GridView';
import dayjs from 'dayjs';

import InnovatorHUD from './InnovatorHUD';

import { useTranslation } from './LocalizationProvider';
import RemoveDialog from './RemoveDialog';
import { useDeviceReadonly, useRestriction } from '../util/permissions';
import { devicesActions, errorsActions } from '../../store';
import { useCatch, useCatchCallback } from '../../reactHelper';
import { useAttributePreference } from '../util/preferences';
import { formatAlarm, formatBoolean } from '../util/formatter';
import { mapIconKey, mapIcons } from '../../map/core/preloadImages';
import fetchOrThrow from '../util/fetchOrThrow';
import usePositionAttributes from '../attributes/usePositionAttributes';
import PositionValue from './PositionValue';

const useStyles = makeStyles()((theme, { desktopPadding }) => ({
  card: {
    pointerEvents: 'auto',
    overflow: 'hidden',
    [theme.breakpoints.down('md')]: {
      width: '92vw',
      maxWidth: 380,
      borderRadius: 28,
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    },
    [theme.breakpoints.up('md')]: {
      width: '100%',
      borderRadius: 28,
      boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'stretch',
      background: '#FFFFFF',
    },
  },
  media: {
    height: theme.dimensions.popupImageHeight,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
  mediaButton: {
    color: theme.palette.common.white,
    mixBlendMode: 'difference',
  },
  vehicleSide: {
    display: 'none',
    [theme.breakpoints.up('md')]: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing(1, 1.5),
      borderRight: `1px solid ${theme.palette.divider}`,
      flexShrink: 0,
    },
  },
  vehicleAvatar: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#06b6d4', // Cyan 500
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 16px rgba(6,182,212,0.2)',
  },
  vehicleAvatarImg: {
    width: 26,
    height: 26,
    filter: 'brightness(0) invert(1)',
  },
  body: {
    [theme.breakpoints.up('md')]: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
    },
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.8),
    padding: theme.spacing(0.5, 1.2, 0, 1.2),
  },
  headerIcon: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: theme.palette.primary.main,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    [theme.breakpoints.up('md')]: { display: 'none' },
  },
  headerIconImg: {
    width: 20,
    height: 20,
    filter: 'brightness(0) invert(1)',
  },
  headerInfo: {
    flex: 1,
    minWidth: 0,
  },
  content: {
    padding: theme.spacing(0.3, 1.2),
    overflow: 'auto',
    [theme.breakpoints.down('md')]: {
      maxHeight: '45vh',
      padding: theme.spacing(0.3, 1),
    },
    [theme.breakpoints.up('md')]: {
      maxHeight: 'none',
      flex: 1,
    },
  },
  chipsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 3,
    marginBottom: 3,
  },
  chip: {
    height: 18,
    fontSize: '0.56rem',
    fontWeight: 600,
    borderRadius: 5,
    '& .MuiChip-icon': { fontSize: '0.65rem', marginLeft: 3 },
    '& .MuiChip-label': { padding: '0 4px' },
  },
  dataGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2px 8px',
    [theme.breakpoints.up('md')]: {
      gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
      gap: '2px 12px',
    },
  },
  dataItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    padding: '1px 0',
  },
  dataIcon: {
    fontSize: '0.85rem !important',
    opacity: 0.6,
    color: '#64748b',
  },
  dataLabel: {
    fontSize: '0.52rem',
    color: theme.palette.text.secondary,
    lineHeight: 1,
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  dataValue: {
    fontSize: '0.66rem',
    fontWeight: 600,
    lineHeight: 1.1,
  },
  fullWidthItem: {
    gridColumn: '1 / -1',
  },
  timestampsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '2px 16px',
    alignItems: 'center',
  },
  timestampItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    whiteSpace: 'nowrap',
  },
  actions: {
    justifyContent: 'space-between',
    padding: theme.spacing(0, 0.5),
    minHeight: 30,
    borderTop: `1px solid ${theme.palette.divider}`,
    '& .MuiIconButton-root': { padding: 4 },
    '& .MuiSvgIcon-root': { fontSize: '1.1rem' },
  },
  root: {
    pointerEvents: 'none',
    position: 'fixed',
    zIndex: 200,
    [theme.breakpoints.up('md')]: {
      left: `calc(${desktopPadding || '0px'} + 16px)`,
      right: 16,
      bottom: 12,
    },
    [theme.breakpoints.down('md')]: {
      left: '50%',
      bottom: `calc(${theme.spacing(3)} + ${theme.dimensions.bottomBarHeight}px)`,
      transform: 'translateX(-50%)',
    },
  },
}));

const DataItem = ({ icon, label, value, fullWidth, color }) => {
  const { classes } = useStyles({ desktopPadding: 0 });
  return (
    <div className={`${classes.dataItem} ${fullWidth ? classes.fullWidthItem : ''}`}>
      {icon}
      <div>
        <Typography className={classes.dataLabel}>{label}</Typography>
        <Typography className={classes.dataValue} sx={color ? { color } : {}}>
          {value}
        </Typography>
      </div>
    </div>
  );
};

const StatusCard = ({ deviceId, position, onClose, disableActions, desktopPadding = 0 }) => {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const { classes } = useStyles({ desktopPadding });
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const t = useTranslation();
  const context = useOutletContext() || {};
  const demoMode = context.demoMode || false;

  const readonly = useRestriction('readonly');
  const deviceReadonly = useDeviceReadonly();

  const shareDisabled = useSelector((state) => state.session.server.attributes.disableShare);
  const user = useSelector((state) => state.session.user);
  const device = useSelector((state) => state.devices.items[deviceId]);

  const deviceImage = device?.attributes?.deviceImage;

  const navigationAppLink = useAttributePreference('navigationAppLink');
  const navigationAppTitle = useAttributePreference('navigationAppTitle');

  const positionAttributes = usePositionAttributes(t);

  const [anchorEl, setAnchorEl] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [positionDialogOpen, setPositionDialogOpen] = useState(false);
  const [engineConfirm, setEngineConfirm] = useState(null); // 'block' | 'unblock' | null

  const attrs = position?.attributes || {};
  const speedKmh = position ? Math.round((position.speed || 0) * 1.852) : 0;

  const handleRemove = useCatch(async (removed) => {
    if (demoMode) {
      dispatch(errorsActions.push(t('demoModeUnavailable')));
      setRemoving(false);
      return;
    }
    if (removed) {
      const response = await fetchOrThrow('/api/devices');
      dispatch(devicesActions.refresh(await response.json()));
    }
    setRemoving(false);
  });

  const handleGeofence = useCatchCallback(async () => {
    if (demoMode) {
      dispatch(errorsActions.push(t('demoModeUnavailable')));
      return;
    }
    const newItem = {
      name: t('sharedGeofence'),
      area: `CIRCLE (${position.latitude} ${position.longitude}, 50)`,
    };
    const response = await fetchOrThrow('/api/geofences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem),
    });
    const item = await response.json();
    await fetchOrThrow('/api/permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId: position.deviceId, geofenceId: item.id }),
    });
    navigate(`/app/settings/geofence/${item.id}`);
  }, [navigate, position, demoMode]);

  const handleEngineCommand = useCatch(async (type) => {
    if (demoMode) {
      dispatch(errorsActions.push(t('demoModeUnavailable')));
      return;
    }
    setEngineConfirm(null);
    await fetchOrThrow('/api/commands/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, type, attributes: {} }),
    });
    if (device) {
      dispatch(devicesActions.update([{ ...device, attributes: { ...device.attributes, blocked: type === 'engineStop' } }]));
    }
  });

  // Build chips
  const chips = [];
  if (attrs.ignition !== undefined) {
    chips.push({
      key: 'ign',
      label: attrs.ignition ? t('statusIgnitionOn') : t('statusIgnitionOff'),
      icon: attrs.ignition ? <PowerIcon /> : <PowerOffIcon />,
      color: attrs.ignition ? '#10b981' : '#94a3b8',
    });
  }
  if (attrs.motion !== undefined) {
    chips.push({
      key: 'motion',
      label: attrs.motion ? t('statusMoving') : t('statusStopped'),
      icon: attrs.motion ? <DirectionsRunIcon /> : <NightlightIcon />,
      color: attrs.motion ? '#3b82f6' : '#94a3b8',
    });
  }
  if (attrs.blocked !== undefined) {
    chips.push({
      key: 'blocked',
      label: attrs.blocked ? t('statusBlocked') : t('statusUnblocked'),
      icon: attrs.blocked ? <LockIcon /> : <LockOpenIcon />,
      color: attrs.blocked ? '#ef4444' : '#10b981',
    });
  }
  if (position?.geofenceIds?.length > 0) {
    chips.push({
      key: 'anchor',
      label: t('statusAnchorActive'),
      icon: <AnchorIcon />,
      color: '#8b5cf6',
    });
  }
  if (attrs.alarm) {
    chips.push({
      key: 'alarm',
      label: formatAlarm(attrs.alarm, t),
      icon: <NotificationsActiveIcon />,
      color: '#ef4444',
    });
  }

  const getSpeedColor = (s) => {
    if (s === 0) return '#94a3b8';
    if (s < 40) return '#10b981';
    if (s < 80) return '#f59e0b';
    return '#ef4444';
  };

  const getBatteryColor = (level) => {
    if (level > 70) return '#10b981';
    if (level > 30) return '#f59e0b';
    return '#ef4444';
  };

  const getBatteryIcon = (level) => {
    const sx = { fontSize: '0.9rem', color: getBatteryColor(level) };
    if (level > 70) return <BatteryFullIcon sx={sx} />;
    if (level > 30) return <Battery60Icon sx={sx} />;
    return <Battery20Icon sx={sx} />;
  };

  if (!desktop) {
    return (
      <InnovatorHUD
        device={device}
        position={position}
        onClose={onClose}
        onCommand={(type) => handleEngineCommand(type === 'block' ? 'engineStop' : 'engineResume')}
      />
    );
  }

  return (
    <>
      <div className={classes.root}>
        {device && (
          <Rnd
            default={{ x: 0, y: 0, width: 'auto', height: 'auto' }}
            enableResizing={false}
            disableDragging={desktop}
            dragHandleClassName="draggable-header"
            style={{ position: 'relative', width: desktop ? '100%' : 'auto' }}
          >
            <Card elevation={3} className={classes.card}>
              {/* Vehicle icon on desktop side */}
              <div className={classes.vehicleSide}>
                <div className={classes.vehicleAvatar}>
                  <img
                    className={classes.vehicleAvatarImg}
                    src={mapIcons[mapIconKey(device.category)]}
                    alt=""
                  />
                </div>
              </div>

              <div className={classes.body}>
                {deviceImage ? (
                  <CardMedia
                    className={`${classes.media} draggable-header`}
                    image={`/api/media/${device.uniqueId}/${deviceImage}`}
                  >
                    <IconButton size="small" onClick={onClose} onTouchStart={onClose}>
                      <CloseIcon fontSize="small" className={classes.mediaButton} />
                    </IconButton>
                  </CardMedia>
                ) : (
                    <div className={`${classes.header} draggable-header`}>
                    <div className={classes.headerIcon}>
                      <img
                        className={classes.headerIconImg}
                        src={mapIcons[mapIconKey(device.category)]}
                        alt=""
                      />
                    </div>
                    <div className={classes.headerInfo}>
                      <Typography sx={{ fontWeight: 900, fontSize: '1rem', color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                        {device.name}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '0.65rem',
                          color: '#64748b',
                          fontWeight: 600,
                          fontFamily: 'monospace',
                        }}
                      >
                        ID: {device.uniqueId}
                        {device.phone && ` • ${device.phone}`}
                      </Typography>
                    </div>
                    <Chip
                      size="small"
                      label={device.status === 'online' ? 'Acoplado' : 'Offline'}
                      sx={{
                        height: 24,
                        fontSize: '0.65rem',
                        px: 1,
                        fontWeight: 800,
                        backgroundColor: `${device.status === 'online' ? '#06b6d4' : '#ef4444'}12`,
                        color: device.status === 'online' ? '#06b6d4' : '#ef4444',
                        border: `1px solid ${device.status === 'online' ? '#06b6d4' : '#ef4444'}20`,
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={onClose}
                      onTouchStart={onClose}
                      sx={{ background: '#F1F5F9', ml: 1 }}
                    >
                      <CloseIcon sx={{ fontSize: '1rem', color: '#64748b' }} />
                    </IconButton>
                  </div>
                )}

                {position && (
                  <CardContent className={classes.content}>
                    {/* Feature chips */}
                    {chips.length > 0 && (
                      <div className={classes.chipsRow}>
                        {chips.map((c) => (
                          <Chip
                            key={c.key}
                            label={c.label}
                            icon={c.icon}
                            size="small"
                            className={classes.chip}
                            sx={{
                              backgroundColor: `${c.color}14`,
                              color: c.color,
                              border: `1px solid ${c.color}30`,
                              '& .MuiChip-icon': { color: c.color },
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Address */}
                    {position.address && (
                      <Box sx={{ display: 'flex', gap: 0.4, mb: 0.3, alignItems: 'center' }}>
                        <LocationOnIcon
                          sx={{ fontSize: '0.72rem', color: 'primary.main', opacity: 0.7 }}
                        />
                        <Typography
                          sx={{ fontSize: '0.65rem', color: 'text.secondary', lineHeight: 1.3 }}
                          noWrap
                        >
                          {position.address}
                        </Typography>
                      </Box>
                    )}

                    <Divider sx={{ my: 0.3 }} />

                    {/* Data grid - all available attributes */}
                    <div className={classes.dataGrid}>
                      <DataItem
                        icon={<SpeedIcon className={classes.dataIcon} />}
                        label={t('positionSpeed')}
                        value={`${speedKmh} km/h`}
                        color={getSpeedColor(speedKmh)}
                      />
                      {position.course != null && (
                        <DataItem
                          icon={
                            <NavigationIcon
                              className={classes.dataIcon}
                              sx={{ transform: `rotate(${position.course}deg)` }}
                            />
                          }
                          label={t('positionCourse')}
                          value={`${Math.round(position.course)}°`}
                        />
                      )}
                      {attrs.batteryLevel != null && (
                        <DataItem
                          icon={getBatteryIcon(attrs.batteryLevel)}
                          label={t('positionBatteryLevel')}
                          value={`${Math.round(attrs.batteryLevel)}%`}
                          color={getBatteryColor(attrs.batteryLevel)}
                        />
                      )}
                      {attrs.sat != null && (
                        <DataItem
                          icon={<SignalCellularAltIcon className={classes.dataIcon} />}
                          label={t('positionSat')}
                          value={attrs.sat}
                        />
                      )}
                      {position.altitude != null && (
                        <DataItem
                          icon={<HeightIcon className={classes.dataIcon} />}
                          label={t('positionAltitude')}
                          value={`${Math.round(position.altitude)} m`}
                        />
                      )}
                      {position.accuracy != null && (
                        <DataItem
                          icon={<GpsFixedIcon className={classes.dataIcon} />}
                          label={t('positionAccuracy')}
                          value={`${Math.round(position.accuracy)} m`}
                        />
                      )}
                      {attrs.totalDistance != null && (
                        <DataItem
                          icon={
                            <Box component="span" sx={{ fontSize: '0.75rem', opacity: 0.5 }}>
                              🛣️
                            </Box>
                          }
                          label={t('positionOdometerLabel')}
                          value={`${(attrs.totalDistance / 1000).toFixed(1)} km`}
                        />
                      )}
                      {attrs.hours != null && (
                        <DataItem
                          icon={<AccessTimeIcon className={classes.dataIcon} />}
                          label={t('positionHourmeter')}
                          value={`${Math.round(attrs.hours / 3600000)} h`}
                        />
                      )}
                      {attrs.fuel != null && (
                        <DataItem
                          icon={<LocalGasStationIcon className={classes.dataIcon} />}
                          label={t('positionFuel')}
                          value={`${Math.round(attrs.fuel)}%`}
                        />
                      )}
                      {attrs.deviceTemp != null && (
                        <DataItem
                          icon={<ThermostatIcon className={classes.dataIcon} />}
                          label={t('positionTemperature')}
                          value={`${attrs.deviceTemp.toFixed(1)}°C`}
                        />
                      )}
                      {attrs.rpm != null && (
                        <DataItem
                          icon={
                            <Box component="span" sx={{ fontSize: '0.75rem', opacity: 0.5 }}>
                              ⚙️
                            </Box>
                          }
                          label="RPM"
                          value={attrs.rpm}
                        />
                      )}
                      {attrs.power != null && (
                        <DataItem
                          icon={<PowerIcon className={classes.dataIcon} />}
                          label={t('positionVoltage')}
                          value={`${attrs.power.toFixed(1)} V`}
                        />
                      )}
                      {attrs.batteryLevel != null && attrs.charge !== undefined && (
                        <DataItem
                          icon={
                            <Box component="span" sx={{ fontSize: '0.75rem', opacity: 0.5 }}>
                              🔌
                            </Box>
                          }
                          label={t('positionCharging')}
                          value={attrs.charge ? t('sharedYes') : t('sharedNo')}
                          color={attrs.charge ? '#10b981' : '#94a3b8'}
                        />
                      )}
                      {attrs.rssi != null && (
                        <DataItem
                          icon={<NetworkCellIcon className={classes.dataIcon} />}
                          label={t('positionSignalGsm')}
                          value={attrs.rssi}
                        />
                      )}
                      {attrs.io1 !== undefined && (
                        <DataItem
                          icon={
                            <Box component="span" sx={{ fontSize: '0.75rem', opacity: 0.5 }}>
                              📥
                            </Box>
                          }
                          label={t('positionInput1')}
                          value={formatBoolean(attrs.io1, t)}
                        />
                      )}
                      {attrs.io2 !== undefined && (
                        <DataItem
                          icon={
                            <Box component="span" sx={{ fontSize: '0.75rem', opacity: 0.5 }}>
                              📥
                            </Box>
                          }
                          label={t('positionInput2')}
                          value={formatBoolean(attrs.io2, t)}
                        />
                      )}
                      <DataItem
                        icon={
                          <Box component="span" sx={{ fontSize: '0.75rem', opacity: 0.5 }}>
                            📍
                          </Box>
                        }
                        label={t('sharedCoordinates')}
                        value={`${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}`}
                      />
                      {position.protocol && (
                        <DataItem
                          icon={
                            <Box component="span" sx={{ fontSize: '0.75rem', opacity: 0.5 }}>
                              📡
                            </Box>
                          }
                          label={t('positionProtocol')}
                          value={position.protocol}
                        />
                      )}
                      {position.network?.radioType && (
                        <DataItem
                          icon={<NetworkCellIcon className={classes.dataIcon} />}
                          label={t('positionNetwork')}
                          value={position.network.radioType.toUpperCase()}
                        />
                      )}
                    </div>

                    <Divider sx={{ my: 0.3 }} />

                    {/* Timestamps - proper inline layout */}
                    <div className={classes.timestampsRow}>
                      {position.fixTime && (
                        <span className={classes.timestampItem}>
                          <Typography
                            sx={{ fontSize: '0.52rem', color: 'text.secondary', fontWeight: 600 }}
                          >
                            GPS
                          </Typography>
                          <Typography sx={{ fontSize: '0.6rem', fontWeight: 600 }}>
                            {dayjs(position.fixTime).format('DD/MM HH:mm:ss')}
                          </Typography>
                        </span>
                      )}
                      {position.deviceTime && (
                        <span className={classes.timestampItem}>
                          <Typography
                            sx={{ fontSize: '0.52rem', color: 'text.secondary', fontWeight: 600 }}
                          >
                            GSM
                          </Typography>
                          <Typography sx={{ fontSize: '0.6rem', fontWeight: 600 }}>
                            {dayjs(position.deviceTime).format('DD/MM HH:mm:ss')}
                          </Typography>
                        </span>
                      )}
                      {position.serverTime && (
                        <span className={classes.timestampItem}>
                          <Typography
                            sx={{ fontSize: '0.52rem', color: 'text.secondary', fontWeight: 600 }}
                          >
                            GPRS
                          </Typography>
                          <Typography sx={{ fontSize: '0.6rem', fontWeight: 600 }}>
                            {dayjs(position.serverTime).format('DD/MM HH:mm:ss')}
                          </Typography>
                        </span>
                      )}
                      <span className={classes.timestampItem}>
                        <Typography
                          sx={{ fontSize: '0.52rem', color: 'text.secondary', fontWeight: 600 }}
                        >
                          ⏱
                        </Typography>
                        <Typography
                          sx={{ fontSize: '0.6rem', fontWeight: 500, color: 'text.secondary' }}
                        >
                          {dayjs(position.fixTime).fromNow()}
                        </Typography>
                      </span>
                    </div>

                    {/* More details */}
                    <Typography sx={{ fontSize: '0.62rem', mt: 0.2 }}>
                      <Link
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPositionDialogOpen(true);
                        }}
                      >
                        {t('sharedShowDetails')}
                      </Link>
                    </Typography>
                  </CardContent>
                )}

                <CardActions classes={{ root: classes.actions }} disableSpacing>
                  <Tooltip title={t('sharedShowDetails')}>
                    <IconButton onClick={() => setPositionDialogOpen(true)} disabled={!position}>
                      <InfoIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('reportReplay')}>
                    <IconButton
                      onClick={() => { onClose(); navigate(`/app/replay?deviceId=${deviceId}`); }}
                      disabled={disableActions || !position}
                    >
                      <GridViewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('sharedEdit')}>
                    <IconButton
                      onClick={() => { onClose(); navigate(`/app/settings/device/${deviceId}`); }}
                      disabled={disableActions || deviceReadonly}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('commandEngineUnblock')}>
                    <IconButton
                      onClick={() => setEngineConfirm('unblock')}
                      disabled={disableActions || deviceReadonly}
                      sx={{
                        color: '#10b981',
                        '&:hover': { backgroundColor: 'rgba(16,185,129,0.1)' },
                      }}
                    >
                      <LockOpenIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('commandEngineBlock')}>
                    <IconButton
                      onClick={() => setEngineConfirm('block')}
                      disabled={disableActions || deviceReadonly}
                      sx={{
                        color: '#ef4444',
                        '&:hover': { backgroundColor: 'rgba(239,68,68,0.1)' },
                      }}
                    >
                      <LockIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('sharedExtra')}>
                    <IconButton
                      color="secondary"
                      onClick={(e) => setAnchorEl(e.currentTarget)}
                      disabled={!position}
                    >
                      <PendingIcon />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </div>
              {/* end body */}
            </Card>
          </Rnd>
        )}
      </div>
      {position && (
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
          {!readonly && <MenuItem onClick={handleGeofence}>{t('sharedCreateGeofence')}</MenuItem>}
          <MenuItem
            component="a"
            target="_blank"
            href={`https://www.google.com/maps/search/?api=1&query=${position.latitude}%2C${position.longitude}`}
          >
            {t('linkGoogleMaps')}
          </MenuItem>
          <MenuItem
            component="a"
            target="_blank"
            href={`http://maps.apple.com/?ll=${position.latitude},${position.longitude}`}
          >
            {t('linkAppleMaps')}
          </MenuItem>
          <MenuItem
            component="a"
            target="_blank"
            href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${position.latitude}%2C${position.longitude}&heading=${position.course}`}
          >
            {t('linkStreetView')}
          </MenuItem>
          {navigationAppTitle && (
            <MenuItem
              component="a"
              target="_blank"
              href={navigationAppLink
                .replace('{latitude}', position.latitude)
                .replace('{longitude}', position.longitude)}
            >
              {navigationAppTitle}
            </MenuItem>
          )}
        </Menu>
      )}
      <RemoveDialog
        open={removing}
        endpoint="devices"
        itemId={deviceId}
        onResult={(removed) => handleRemove(removed)}
      />
      {position && (
        <Dialog
          open={positionDialogOpen}
          onClose={() => setPositionDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}
          >
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700 }}>
              {device?.name} — {t('sharedShowDetails')}
            </Typography>
            <IconButton size="small" onClick={() => setPositionDialogOpen(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                    {t('stateName')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                    {t('sharedName')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                    {t('stateValue')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.getOwnPropertyNames(position)
                  .filter((it) => it !== 'attributes')
                  .map((property) => (
                    <TableRow key={property}>
                      <TableCell sx={{ fontSize: '0.72rem' }}>{property}</TableCell>
                      <TableCell sx={{ fontSize: '0.72rem', fontWeight: 600 }}>
                        {positionAttributes[property]?.name}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.72rem' }}>
                        <PositionValue position={position} property={property} />
                      </TableCell>
                    </TableRow>
                  ))}
                {Object.getOwnPropertyNames(position.attributes).map((attribute) => (
                  <TableRow key={attribute}>
                    <TableCell sx={{ fontSize: '0.72rem' }}>{attribute}</TableCell>
                    <TableCell sx={{ fontSize: '0.72rem', fontWeight: 600 }}>
                      {positionAttributes[attribute]?.name}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.72rem' }}>
                      <PositionValue position={position} attribute={attribute} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DialogContent>
        </Dialog>
      )}
      {/* Engine block/unblock confirmation */}
      <Dialog open={Boolean(engineConfirm)} onClose={() => setEngineConfirm(null)} maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>
          {engineConfirm === 'block' ? t('commandConfirmBlock') : t('commandConfirmUnblock')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">{device?.name}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEngineConfirm(null)}>{t('sharedCancel')}</Button>
          <Button
            variant="contained"
            color={engineConfirm === 'block' ? 'error' : 'success'}
            onClick={() =>
              handleEngineCommand(engineConfirm === 'block' ? 'engineStop' : 'engineResume')
            }
          >
            {engineConfirm === 'block' ? t('commandEngineBlock') : t('commandEngineUnblock')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default StatusCard;
