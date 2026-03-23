import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
  Box,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import DeleteIcon from '@mui/icons-material/Delete';
import { formatNotificationTitle, formatTime } from '../common/util/formatter';
import { useTranslation } from '../common/components/LocalizationProvider';
import { eventsActions } from '../store';

const useStyles = makeStyles()((theme) => ({
  drawer: {
    width: theme.dimensions.eventsDrawerWidth,
  },
  paper: {
    width: theme.dimensions.eventsDrawerWidth,
    margin: theme.spacing(2),
    marginLeft: 0,
    height: `calc(100% - ${theme.spacing(4)})`,
    borderRadius: '20px',
    background: theme.palette.background.paper,
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    overflow: 'hidden',
  },
  toolbar: {
    paddingLeft: theme.spacing(2.5),
    paddingRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
    fontWeight: 700,
  },
}));

// ... O restande debaixo do useStyles
const EventListContent = ({ onNavigate }) => {
  const t = useTranslation();
  const dispatch = useDispatch();
  const devices = useSelector((state) => state.devices.items);
  const events = useSelector((state) => state.events.items);

  const formatType = (event) =>
    formatNotificationTitle(t, {
      type: event.type,
      attributes: {
        alarms: event.attributes?.alarm,
      },
    });

  return (
    <List dense sx={{ width: '100%' }}>
      {events.map((event) => (
        <ListItemButton
          key={event.id}
          onClick={() => onNavigate(`/app/event/${event.id}`)}
          disabled={!event.id}
          sx={{ borderRadius: '12px', mx: 1, mb: 0.5 }}
        >
          <ListItemText
            primary={`${devices[event.deviceId]?.name} • ${formatType(event)}`}
            secondary={formatTime(event.eventTime, 'seconds')}
            slotProps={{
              primary: { sx: { fontWeight: 600, fontSize: '0.8125rem' } },
              secondary: { sx: { fontSize: '0.75rem' } },
            }}
          />
          <Tooltip title={t('sharedRemove')}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                dispatch(eventsActions.delete(event));
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </ListItemButton>
      ))}
    </List>
  );
};

const EventsDrawer = ({ open, onClose }) => {
  const { classes } = useStyles();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const t = useTranslation();

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ className: classes.paper }}
      slotProps={{ backdrop: { sx: { backgroundColor: 'transparent' } } }}
    >
      <Toolbar className={classes.toolbar} disableGutters>
        <Typography variant="h6" className={classes.title}>
          {t('reportEvents')}
        </Typography>
        <Tooltip title={t('notificationClearAll')}>
          <IconButton
            size="small"
            color="inherit"
            onClick={() => dispatch(eventsActions.deleteAll())}
            sx={{ borderRadius: '10px' }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Toolbar>
      <Box className={classes.drawer}>
        {/* Renderiza os Listeners Pesados de Redux APENAS quando Open (Unmount on hide para poupar CPU Mobile/PWA) */}
        {open && <EventListContent onNavigate={navigate} />}
      </Box>
    </Drawer>
  );
};

export default EventsDrawer;
