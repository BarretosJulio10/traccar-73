import { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useMediaQuery, useTheme } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { List } from 'react-window';
import { devicesActions } from '../store';
import { useEffectAsync } from '../reactHelper';
import { COMPACT_HEIGHT, EXPANDED_HEIGHT, ANCHOR_EXPANDED_HEIGHT } from '../common/util/constants';
import DeviceRow from './DeviceRow';
import { traccarDevicesAdapter } from '../adapters/traccar/devicesAdapter';
import { demoService } from '../core/services';

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

const DeviceList = ({ devices, onOpenPanel, onClosePanel, panelDeviceId }) => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const selectedId = useSelector((state) => state.devices.selectedId);
  const listRef = useRef();
  const containerRef = useRef();
  const [containerHeight, setContainerHeight] = useState(window.innerHeight - 200);
  const [anchorOpenId, setAnchorOpenId] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerHeight(entry.contentRect.height);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    // VariableSizeList in 1.x needed resetAfterIndex, 
    // but List in 2.x handles dynamic heights via the rowHeight prop reactivity.
  }, [selectedId, devices]);

  const [, setTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setTime(Date.now()), 60000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffectAsync(async () => {
    if (demoService.isActive()) {
      return;
    }
    const data = await traccarDevicesAdapter.fetchDevices();
    if (Array.isArray(data)) {
      dispatch(devicesActions.refresh(data));
    }
  }, []);

  const getRowHeight = useCallback((index, rowProps) => {
    const { devices: listDevices, selectedId: listSelectedId, anchorOpenId: aId } = rowProps;
    const device = listDevices && listDevices[index];
    if (device && device.id === listSelectedId) {
      return device.id === aId ? ANCHOR_EXPANDED_HEIGHT : EXPANDED_HEIGHT;
    }
    return COMPACT_HEIGHT || 80;
  }, []);

  if (devices.length === 0) {
    return null; // or a loading/empty state if preferred
  }

  return (
    <div ref={containerRef} className={classes.list}>
      <List
        listRef={listRef}
        rowCount={devices.length}
        rowHeight={getRowHeight}
        width="100%"
        height={containerHeight}
        overscanCount={5}
        rowProps={{ devices, selectedId, desktop, onOpenPanel, onClosePanel, panelDeviceId, anchorOpenId, setAnchorOpenId }}
        rowComponent={DeviceRow}
      />
    </div>
  );
};

export default DeviceList;
