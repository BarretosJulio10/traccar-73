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
      className="h-full transition-all cursor-pointer flex items-center justify-between group p-2.5 rounded-xl border relative overflow-hidden"
      style={{
        background: isSelected
          ? theme.isDark ? 'rgba(30,31,36,0.9)' : 'rgba(255,255,255,0.9)'
          : theme.isDark ? 'rgba(18,20,24,0.40)' : 'rgba(255,255,255,0.55)',
        borderColor: isSelected ? theme.accent + '66' : theme.borderCard,
        boxShadow: isSelected ? `0 0 15px ${theme.accent}1a` : 'none',
        color: theme.textPrimary
      }}
    >
      {isSelected && (
        <div 
          className="absolute left-0 top-0 bottom-0 w-1" 
          style={{ background: theme.accent, boxShadow: `0 0 10px ${theme.accent}` }}
        />
      )}
      
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-inner border"
          style={{ background: theme.bg, borderColor: theme.border }}
        >
          <img
            src={mapIcons[mapIconKey(item.category)]}
            alt={item.category}
            className={`w-6 h-6 transition-all duration-300 ${!isOnline ? 'opacity-30 grayscale' : ''}`}
            style={isOnline ? { filter: 'saturate(2) hue-rotate(90deg) brightness(1.2)' } : {}}
          />
        </div>

        <div className="flex flex-col min-w-0">
          <h3
            className="text-[14px] font-black tracking-tight truncate leading-none mb-1.5"
            style={{ color: isSelected ? theme.accent : theme.textPrimary }}
          >
            {item.name}
          </h3>
          <div className="flex items-center gap-2">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: isOnline ? theme.accent : theme.textMuted,
                boxShadow: isOnline ? `0 0 6px ${theme.accent}` : 'none',
              }}
            />
            <span
              className="text-[10px] font-black tracking-widest uppercase"
              style={{ color: isOnline ? theme.accent : theme.textMuted }}
            >
              {isOnline ? 'Ativo' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <div className="bg-slate-500/5 px-2.5 py-1 rounded-lg border border-white/5">
          <span
            className="text-[13px] font-black"
            style={{ color: isOnline ? theme.textPrimary : theme.textMuted }}
          >
            {speedKmh}<span className="text-[10px] ml-1 opacity-50">km/h</span>
          </span>
        </div>
        {lastUpdate && (
          <span className="text-[9px] font-bold uppercase tracking-tighter" style={{ color: theme.textMuted }}>
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
