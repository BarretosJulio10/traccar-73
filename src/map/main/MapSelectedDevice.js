import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTheme, useMediaQuery } from '@mui/material';
import dimensions from '../../common/theme/dimensions';
import { map } from '../core/MapView';
import { usePrevious } from '../../reactHelper';
import { useAttributePreference } from '../../common/util/preferences';

const MapSelectedDevice = ({ mapReady }) => {
  const currentTime = useSelector((state) => state.devices.selectTime);
  const currentId = useSelector((state) => state.devices.selectedId);
  const previousTime = usePrevious(currentTime);
  const previousId = usePrevious(currentId);

  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('md'));

  const selectZoom = useAttributePreference('web.selectZoom', 10);
  const mapFollow = useAttributePreference('mapFollow', false);

  const position = useSelector((state) => state.session.positions[currentId]);

  const previousPosition = usePrevious(position);

  useEffect(() => {
    if (!mapReady) return;

    const positionChanged =
      position &&
      (!previousPosition ||
        position.latitude !== previousPosition.latitude ||
        position.longitude !== previousPosition.longitude);

    // Force follow if a device is selected, or use user preference
    const shouldFollow = currentId || mapFollow;

    if (
      (currentId !== previousId ||
        currentTime !== previousTime ||
        (shouldFollow && positionChanged)) &&
      position
    ) {
      // Calculate offsets based on responsive sidebars
      let offset = [0, 0];

      if (isPhone) {
        // Mobile: StatusCard is at the bottom (~33% height)
        offset[1] = -Math.round(window.innerHeight * 0.33);
      } else {
        // Desktop Dual Sidebar: 
        // Left (FleetSidebar) = 360px
        // Right (VehicleDetails) = 400px
        // Map center needs to shift to the visible horizontal middle
        const horizontalShift = (360 - 400) / 2; // Center point relative to total viewport
        offset[0] = horizontalShift;
        offset[1] = 0; // Vertically centered on PC
      }

      map.easeTo({
        center: [position.longitude, position.latitude],
        zoom: Math.max(map.getZoom(), selectZoom),
        offset,
      });
    }
  }, [
    currentId,
    previousId,
    currentTime,
    previousTime,
    mapFollow,
    position,
    selectZoom,
    mapReady,
    isPhone,
  ]);

  return null;
};

MapSelectedDevice.handlesMapReady = true;

export default MapSelectedDevice;
