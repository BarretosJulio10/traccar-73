import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { devicesActions } from '../store';
import { mapIconKey, mapIcons } from '../map/core/preloadImages';
import { useHudTheme } from '../common/util/ThemeContext';

dayjs.extend(relativeTime);

const DeviceRow = ({ devices, index, style, desktop }) => {
  const dispatch = useDispatch();
  const { theme } = useHudTheme();
  const selectedId = useSelector((state) => state.devices.selectedId);
  const item = devices[index];
  const isSelected = item.id === selectedId;
  const position = useSelector((state) => state.session.positions[item.id]);

  const speedKmh = position ? Math.round((position.speed || 0) * 1.852) : 0;
  const lastUpdate = position?.fixTime || item.lastUpdate;
  const isOnline = item.status === 'online';

  const handleClick = () => {
    dispatch(devicesActions.selectId(item.id));
  };

  const adjustedStyle = {
    ...style,
    height: style.height - (desktop ? 4 : 8),
    top: style.top + (desktop ? 2 : 4),
  };

  const content = (
    <div
      onClick={handleClick}
      className="h-full transition-all cursor-pointer flex items-center justify-between group p-3 rounded-2xl border relative overflow-hidden"
    style={{
      background: isSelected
        ? '#FFFFFF'
        : '#F8FAFC',
      borderColor: isSelected ? theme.accent : 'rgba(0,0,0,0.03)',
      boxShadow: isSelected ? `0 10px 25px rgba(6,182,212,0.12)` : 'none',
    }}
  >
    {isSelected && (
      <div 
        className="absolute left-0 top-0 bottom-0 w-1.5" 
        style={{ background: theme.accent }}
      />
    )}
    
    <div className="flex items-center gap-3 min-w-0">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-50 border border-slate-100"
      >
        <img
          src={mapIcons[mapIconKey(item.category)]}
          alt={item.category}
          className={`w-6 h-6 transition-all duration-300 ${!isOnline ? 'opacity-20 grayscale' : ''}`}
          style={isOnline ? { filter: 'saturate(1.5) hue-rotate(180deg)' } : {}}
        />
      </div>

      <div className="flex flex-col min-w-0">
        <h3
          className="text-[15px] font-black tracking-tight truncate leading-none mb-1.5"
          style={{ color: isSelected ? theme.accent : '#0f172a' }}
        >
          {item.name}
        </h3>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${isOnline ? 'animate-pulse' : ''}`}
            style={{
              background: isOnline ? theme.accent : '#cbd5e1',
            }}
          />
          <span
            className="text-[10px] font-black tracking-widest uppercase"
            style={{ color: isOnline ? theme.accent : '#94a3b8' }}
          >
            {isOnline ? 'Acoplado' : 'Offline'}
          </span>
        </div>
      </div>
    </div>

    <div className="flex flex-col items-end gap-1 flex-shrink-0">
      <div className="bg-slate-100/50 px-2.5 py-1 rounded-xl border border-slate-200/50">
        <span
          className="text-[14px] font-black"
          style={{ color: isOnline ? '#0f172a' : '#94a3b8' }}
        >
          {speedKmh}<span className="text-[10px] ml-1 opacity-40">km/h</span>
        </span>
      </div>
      {lastUpdate && (
        <span className="text-[9px] font-bold uppercase tracking-widest opacity-40" style={{ color: '#475569' }}>
          {dayjs(lastUpdate).fromNow()}
        </span>
      )}
    </div>
    </div>
  );

  return (
    <div style={adjustedStyle} className="px-2">
        {content}
    </div>
  );
};

export default DeviceRow;
