import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useMediaQuery, useTheme } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { List } from 'react-window';
import { devicesActions } from '../store';
import { useEffectAsync } from '../reactHelper';
import DeviceRow, { COMPACT_HEIGHT, EXPANDED_HEIGHT } from './DeviceRow';
import fetchOrThrow from '../common/util/fetchOrThrow';

const useStyles = makeStyles()((theme) => ({
  list: {
    height: '100%',
    direction: theme.direction,
  },
  listInner: {
    position: 'relative',
    margin: theme.spacing(1.5, 0),
  },
}));

const DeviceList = ({ devices }) => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const selectedId = useSelector((state) => state.devices.selectedId);
  const listRef = useRef();

  useEffect(() => {
    // List component in this version might re-calculate on render if itemSize changes
  }, [selectedId]);

  const [, setTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setTime(Date.now()), 60000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffectAsync(async () => {
    if (window.sessionStorage.getItem('demoMode') === 'true') {
      return;
    }
    const response = await fetchOrThrow('/api/devices');
    const data = await response.json();
    if (Array.isArray(data)) {
      dispatch(devicesActions.refresh(data));
    }
  }, []);

  const getRowHeight = (index) => {
    const device = devices[index];
    return (device && device.id === selectedId) ? EXPANDED_HEIGHT : COMPACT_HEIGHT;
  };

  return (
    <div className={classes.list}>
      {/* Assuming parent provides height, using a large default if needed */}
      <List
        ref={listRef}
        itemCount={devices.length}
        itemSize={getRowHeight}
        width="100%"
        height={window.innerHeight - 200} // Dynamic estimate for sidebar height
        overscanCount={5}
        rowProps={{}}
      >
        {(props) => (
          <DeviceRow
            {...props}
            devices={devices}
            desktop={desktop}
          />
        )}
      </List>
    </div>
  );
};

export default DeviceList;
