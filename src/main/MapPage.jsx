import { useSelector } from 'react-redux';

import MainMap from './MainMap';

const MapPage = () => {
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const positions = useSelector((state) => state.session.positions);

  return (
    <div className={`relative w-full overflow-hidden bg-[#1e1f24] font-['Quicksand']`} style={{ height: '100%', minHeight: 0 }}>

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
