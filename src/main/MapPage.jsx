import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useMediaQuery, useTheme } from '@mui/material';

import MainMap from './MainMap';

const MapPage = () => {
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const positions = useSelector((state) => state.session.positions);

  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  return (
    <div className={`relative w-full h-full overflow-hidden bg-[#1e1f24] font-['Quicksand']`}>

      {/* 100% Full Screen Map */}
      <div className="absolute inset-0 z-0">
        <MainMap
          filteredPositions={Object.values(positions)}
          selectedPosition={selectedDeviceId ? positions[selectedDeviceId] : null}
          onEventsClick={() => { }}
        />
      </div>

    </div>
  );
};

export default MapPage;
