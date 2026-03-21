import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Autocomplete,
  TextField,
  Button,
  CircularProgress,
  Box,
  Chip,
  Tooltip,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

import fetchOrThrow from '../common/util/fetchOrThrow';
import { errorsActions } from '../store';

const useStyles = makeStyles()((theme) => ({
  dialogTitle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: theme.spacing(1),
  },
  content: {
    minWidth: 360,
    minHeight: 200,
    padding: theme.spacing(0, 2, 2, 2),
  },
  addRow: {
    display: 'flex',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
  listItem: {
    borderRadius: 8,
    marginBottom: theme.spacing(0.5),
    '&:hover': {
      backgroundColor: `${theme.palette.action.hover}`,
    },
  },
  deviceIcon: {
    minWidth: 36,
    color: theme.palette.primary.main,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(4),
    gap: theme.spacing(1),
  },
  countChip: {
    fontWeight: 600,
  },
}));

const GeofenceDevicesDialog = ({ open, onClose, geofenceId, geofenceName }) => {
  const { classes } = useStyles();
  const dispatch = useDispatch();

  const allDevices = useSelector((state) => state.devices.items);
  const allDevicesList = Object.values(allDevices);

  const [linkedDevices, setLinkedDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);

  const fetchLinkedDevices = useCallback(async () => {
    if (!geofenceId) return;
    setLoading(true);
    try {
      const response = await fetchOrThrow(`/api/devices?geofenceId=${geofenceId}`);
      setLinkedDevices(await response.json());
    } catch (error) {
      dispatch(errorsActions.push(error.message));
    }
    setLoading(false);
  }, [geofenceId, dispatch]);

  useEffect(() => {
    if (open && geofenceId) {
      fetchLinkedDevices();
    }
  }, [open, geofenceId, fetchLinkedDevices]);

  const handleAdd = async () => {
    if (!selectedDevice) return;
    setAdding(true);
    try {
      await fetchOrThrow('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: selectedDevice.id, geofenceId }),
      });
      setSelectedDevice(null);
      await fetchLinkedDevices();
    } catch (error) {
      dispatch(errorsActions.push(error.message));
    }
    setAdding(false);
  };

  const handleRemove = async (deviceId) => {
    setRemovingId(deviceId);
    try {
      await fetchOrThrow('/api/permissions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, geofenceId }),
      });
      await fetchLinkedDevices();
    } catch (error) {
      dispatch(errorsActions.push(error.message));
    }
    setRemovingId(null);
  };

  const linkedIds = new Set(linkedDevices.map((d) => d.id));
  const availableDevices = allDevicesList.filter((d) => !linkedIds.has(d.id));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle className={classes.dialogTitle}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DirectionsCarIcon color="primary" />
          <Typography variant="h6" component="span" sx={{ fontSize: '1rem' }}>
            Dispositivos — {geofenceName}
          </Typography>
          <Chip
            label={linkedDevices.length}
            size="small"
            color="primary"
            className={classes.countChip}
          />
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent className={classes.content}>
        {/* Add device row */}
        <Box className={classes.addRow}>
          <Autocomplete
            size="small"
            fullWidth
            options={availableDevices}
            getOptionLabel={(option) => option.name || `ID: ${option.id}`}
            value={selectedDevice}
            onChange={(_, value) => setSelectedDevice(value)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Adicionar dispositivo"
                placeholder="Buscar..."
                variant="outlined"
              />
            )}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            noOptionsText="Todos os dispositivos já estão vinculados"
          />
          <Button
            variant="contained"
            size="small"
            onClick={handleAdd}
            disabled={!selectedDevice || adding}
            startIcon={adding ? <CircularProgress size={16} /> : <AddIcon />}
            sx={{ minWidth: 100 }}
          >
            Vincular
          </Button>
        </Box>

        {/* Device list */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : linkedDevices.length === 0 ? (
          <Box className={classes.emptyState}>
            <DirectionsCarIcon sx={{ fontSize: 40, opacity: 0.3, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              Nenhum dispositivo vinculado
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.7 }}>
              Use o campo acima para vincular
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {linkedDevices.map((device) => (
              <ListItem key={device.id} className={classes.listItem} disablePadding>
                <ListItemIcon className={classes.deviceIcon}>
                  <DirectionsCarIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={device.name}
                  secondary={device.category || device.uniqueId}
                  primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500 }}
                  secondaryTypographyProps={{ fontSize: '0.7rem' }}
                />
                <ListItemSecondaryAction>
                  <Tooltip title="Desvincular dispositivo">
                    <IconButton
                      edge="end"
                      size="small"
                      color="error"
                      onClick={() => handleRemove(device.id)}
                      disabled={removingId === device.id}
                    >
                      {removingId === device.id ? (
                        <CircularProgress size={16} />
                      ) : (
                        <DeleteIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={onClose} size="small">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GeofenceDevicesDialog;
