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
import MapLiveTrailToggle from '../map/main/MapLiveTrailToggle';
import MapAnchorZones from '../map/main/MapAnchorZones';

const MainMap = ({ filteredPositions, selectedPosition, onEventsClick }) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  const eventsAvailable = useSelector((state) => !!state.events.items.length);

  const features = useFeatures();

  const tenantCtx = useTenant();
  const whatsappNumber = tenantCtx?.tenant?.whatsapp_number;
  const whatsappMessage = tenantCtx?.tenant?.whatsapp_message;

  const [positionSourceIds, setPositionSourceIds] = useState(null);

  const onMarkerClick = useCallback(
    (_, deviceId) => {
      dispatch(devicesActions.selectId(deviceId));
    },
    [dispatch],
  );

  const handleWhatsAppClick = useCallback(() => {
    if (!whatsappNumber) return;
    const digits = whatsappNumber.replace(/\D/g, '');
    const msg = whatsappMessage || 'Olá! Preciso de suporte.';
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
  }, [whatsappNumber, whatsappMessage]);

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
      <MapWhatsApp onClick={handleWhatsAppClick} />
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
