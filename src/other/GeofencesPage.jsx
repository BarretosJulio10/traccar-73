import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import UploadFileIcon from '@mui/icons-material/UploadFile';

import MapView from '../map/core/MapView';
import MapGeofenceEdit from '../map/draw/MapGeofenceEdit';
import GeofencesList from './GeofencesList';
import { useTranslation } from '../common/components/LocalizationProvider';
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
  );

  return (
    <div className="h-full relative overflow-hidden" style={{ background: theme.bg }}>
      {/* Background Map */}
      <div className="absolute inset-0 z-0">
        <MapView>
          <MapGeofenceEdit selectedGeofenceId={selectedGeofenceId} />
        </MapView>
        <div className="absolute inset-0 pointer-events-none" style={{ background: theme.isDark ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.05)' }} />
      </div>

      {/* Floating panel — pointer-events-none on wrapper so map is pannable,
          pointer-events-auto re-enabled on actual UI content */}
      <div className="absolute inset-0 z-10 pointer-events-none" style={{ right: 60 }}>
        <div className="h-full flex flex-col pointer-events-auto">
          <PwaPageLayout
            title={t('sharedGeofences')}
            actions={headerActions}
            transparent={true}
          >
            <div className="flex-1 overflow-auto pb-6">
              <div
                className="backdrop-blur-md rounded-[28px] p-4 shadow-2xl border"
                style={{ background: theme.isDark ? 'rgba(20, 22, 28, 0.88)' : 'rgba(255, 255, 255, 0.88)', borderColor: theme.border }}
              >
                <GeofencesList onGeofenceSelected={setSelectedGeofenceId} />
              </div>
            </div>
          </PwaPageLayout>
        </div>
      </div>

      <div className="absolute left-4 bottom-6 z-20 pointer-events-auto">
        <MapScale />
      </div>
    </div>
  );
};

export default GeofencesPage;
