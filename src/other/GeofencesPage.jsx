import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Tooltip, IconButton } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import FenceIcon from '@mui/icons-material/Fence';

import MapView from '../map/core/MapView';
import MapCurrentLocation from '../map/MapCurrentLocation';
import MapGeofenceEdit from '../map/draw/MapGeofenceEdit';
import GeofencesList from './GeofencesList';
import { useTranslation } from '../common/components/LocalizationProvider';
import MapGeocoder from '../map/geocoder/MapGeocoder';
import { errorsActions } from '../store';
import MapScale from '../map/MapScale';
import fetchOrThrow from '../common/util/fetchOrThrow';
import PwaPageLayout from '../common/components/PwaPageLayout';
import { useHudTheme } from '../common/util/ThemeContext';

const GeofencesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useTranslation();
  const { theme } = useHudTheme();

  const [selectedGeofenceId, setSelectedGeofenceId] = useState();

  const handleFile = (event) => {
    const files = Array.from(event.target.files);
    const [file] = files;
    const reader = new FileReader();
    reader.onload = async () => {
      const xml = new DOMParser().parseFromString(reader.result, 'text/xml');
      const segment = xml.getElementsByTagName('trkseg')[0];
      const coordinates = Array.from(segment.getElementsByTagName('trkpt'))
        .map((point) => `${point.getAttribute('lat')} ${point.getAttribute('lon')}`)
        .join(', ');
      const area = `LINESTRING (${coordinates})`;
      const newItem = { name: t('sharedGeofence'), area };
      try {
        const response = await fetchOrThrow('/api/geofences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newItem),
        });
        const item = await response.json();
        navigate(`/app/settings/geofence/${item.id}`);
      } catch (error) {
        dispatch(errorsActions.push(error.message));
      }
    };
    reader.onerror = (event) => {
      dispatch(errorsActions.push(event.target.error));
    };
    reader.readAsText(file);
  };

  const headerActions = (
    <>
      <label htmlFor="upload-gpx">
        <input
          accept=".gpx"
          id="upload-gpx"
          type="file"
          className="hidden"
          onChange={handleFile}
        />
        <button
          className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-md active:scale-95 transition-all duration-300"
          style={{ background: theme.bgSecondary, borderColor: theme.border, borderWidth: 1, color: theme.accent }}
        >
          <UploadFileIcon sx={{ fontSize: 20 }} />
        </button>
      </label>
    </>
  );

  return (
    <div className="h-full relative overflow-hidden" style={{ background: theme.bg }}>
      {/* Background Map - Reduced opacity/blurred for focus if needed or 100% background */}
      <div className="absolute inset-0 z-0">
        <MapView>
          <MapGeocoder />
          <MapGeofenceEdit selectedGeofenceId={selectedGeofenceId} />
        </MapView>
        <div className="absolute inset-0 pointer-events-none" style={{ background: theme.isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.1)' }} />
      </div>

      {/* Floating Pwa Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col pointer-events-none">
        <div className="h-full overflow-hidden flex flex-col">
          <PwaPageLayout
            title={t('sharedGeofences')}
            actions={headerActions}
            transparent={true}
          >
            <div className="flex-1 overflow-auto">
              <div 
                className="backdrop-blur-md rounded-[32px] p-6 shadow-2xl border mx-1"
                style={{ background: theme.isDark ? 'rgba(36, 38, 43, 0.8)' : 'rgba(255, 255, 255, 0.8)', borderColor: theme.border }}
              >
                <GeofencesList onGeofenceSelected={setSelectedGeofenceId} />
              </div>
            </div>
          </PwaPageLayout>
        </div>
      </div>

      {/* Map Controls (Optional if needed over PWA layout) */}
      <div className="absolute right-4 bottom-24 z-20 flex flex-col gap-3">
        <MapScale />
        <MapCurrentLocation />
      </div>
    </div>
  );
};

export default GeofencesPage;
