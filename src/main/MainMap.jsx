import { useCallback, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useDispatch, useSelector } from 'react-redux';
import MapView from '../map/core/MapView';
import MapSelectedDevice from '../map/main/MapSelectedDevice';
import MapAccuracy from '../map/main/MapAccuracy';
import MapGeofence from '../map/MapGeofence';
import MapCurrentLocation from '../map/MapCurrentLocation';
import PoiMap from '../map/main/PoiMap';
import MapPadding from '../map/MapPadding';
import { devicesActions } from '../store';
import MapDefaultCamera from '../map/main/MapDefaultCamera';
import MapCenterControl from '../map/main/MapCenterControl';
import MapLiveRoutes from '../map/main/MapLiveRoutes';
import MapPositions from '../map/MapPositions';
import MapOverlay from '../map/overlay/MapOverlay';
import MapScale from '../map/MapScale';
import MapNotification from '../map/notification/MapNotification';
import MapWhatsApp from '../map/MapWhatsApp';
import MapHoverPopup from '../map/MapHoverPopup';
import useFeatures from '../common/util/useFeatures';
import { useTenant } from '../common/components/TenantProvider';
import WhatsAppDeviceAlerts from './components/WhatsAppDeviceAlerts';
import MapLiveTrailToggle from '../map/main/MapLiveTrailToggle';
import MapAnchorZones from '../map/main/MapAnchorZones';

const MainMap = ({ filteredPositions, selectedPosition, onEventsClick }) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  const eventsAvailable = useSelector((state) => !!state.events.items.length);
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);

  const features = useFeatures();

  const tenantCtx = useTenant();
  const whatsappNumber = tenantCtx?.tenant?.whatsapp_number;
  const tenantId = tenantCtx?.tenant?.id;

  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const [positionSourceIds, setPositionSourceIds] = useState(null);

  const onMarkerClick = useCallback(
    (_, deviceId) => {
      dispatch(devicesActions.selectId(deviceId));
    },
    [dispatch],
  );

  const handleWhatsAppClick = useCallback(() => {
    setWhatsappOpen((prev) => !prev);
  }, []);

  const handleSourceReady = useCallback((sourceIds) => {
    setPositionSourceIds(sourceIds);
  }, []);

  return (
    <>
      <MapView>
        <MapOverlay />
        <MapGeofence />
        <MapAccuracy positions={filteredPositions} />
        <MapLiveRoutes deviceIds={filteredPositions.map((p) => p.deviceId)} />
        <MapPositions
          positions={filteredPositions}
          onMarkerClick={onMarkerClick}
          selectedPosition={selectedPosition}
          showStatus
          onSourceReady={handleSourceReady}
        />
        <MapAnchorZones />
        <MapLiveTrailToggle />
        <MapDefaultCamera />
        <MapSelectedDevice />
        <MapCenterControl />
        <PoiMap />
      </MapView>
      <MapScale />
      <MapCurrentLocation />
      {desktop && positionSourceIds && <MapHoverPopup sourceIds={positionSourceIds} />}
      {!features.disableEvents && (
        <MapNotification enabled={eventsAvailable} onClick={onEventsClick} />
      )}
      {whatsappNumber && <MapWhatsApp onClick={handleWhatsAppClick} />}
      {whatsappOpen && (
        <WhatsAppDeviceAlerts
          deviceId={selectedDeviceId}
          tenantId={tenantId}
          onClose={() => setWhatsappOpen(false)}
        />
      )}
      {desktop && (
        <MapPadding
          top={8}
          start={8}
        />
      )}
    </>
  );
};

export default MainMap;
