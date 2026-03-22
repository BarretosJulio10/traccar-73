import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { devicesActions } from '../store';
import { mapIconKey, mapIcons } from '../map/core/preloadImages';
import { useHudTheme } from '../common/util/ThemeContext';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import AnchorIcon from '@mui/icons-material/Anchor';
import SlideAction from '../common/components/SlideAction';
import { useCatchCallback } from '../reactHelper';
import fetchOrThrow from '../common/util/fetchOrThrow';

dayjs.extend(relativeTime);

export const COMPACT_HEIGHT = 80;
export const EXPANDED_HEIGHT = 240;

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

  const onCommand = useCatchCallback(async (type) => {
    const response = await fetchOrThrow('/api/commands/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: item.id,
        type,
      }),
    });
    if (response.ok) {
      // Command sent successfully
    }
  }, [item.id]);

  const attrs = position?.attributes || {};
  const battery = attrs.batteryLevel || attrs.battery || 0;
  const odometer = position?.attributes?.totalDistance
    ? (position.attributes.totalDistance / 1000).toFixed(1)
    : position?.attributes?.odometer
      ? (position.attributes.odometer / 1000).toFixed(1)
      : '0.0';
  const altitude = position?.altitude ? Math.round(position.altitude) : 0;

  const handleClick = (e) => {
    e.stopPropagation();
    dispatch(devicesActions.selectId(isSelected ? null : item.id));
  };

  const adjustedStyle = {
    ...style,
    height: isSelected ? EXPANDED_HEIGHT - 6 : COMPACT_HEIGHT - 6,
    top: style.top + 3,
  };

  return (
    <div style={adjustedStyle} className="px-2">
      <div
        onClick={handleClick}
        className="h-full transition-all duration-300 cursor-pointer flex flex-col group p-3 rounded-2xl border relative overflow-hidden"
        style={{
          background: isSelected ? '#FFFFFF' : '#F8FAFC',
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
        
        {/* Header Row */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-50 border border-slate-100">
              <img
                src={mapIcons[mapIconKey(item.category)]}
                alt={item.category}
                className={`w-6 h-6 transition-all duration-300 ${!isOnline ? 'opacity-20 grayscale' : ''}`}
                style={isOnline ? { filter: 'saturate(1.5) hue-rotate(180deg)' } : {}}
              />
            </div>

            <div className="flex flex-col min-w-0">
              <h3 className="text-[15px] font-black tracking-tight truncate leading-none mb-1.5" style={{ color: isSelected ? theme.accent : '#0f172a' }}>
                {item.name}
              </h3>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'animate-pulse' : ''}`} style={{ background: isOnline ? theme.accent : '#cbd5e1' }} />
                <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: isOnline ? theme.accent : '#94a3b8' }}>
                  {isOnline ? 'Acoplado' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <div className="bg-slate-100/50 px-2.5 py-1 rounded-xl border border-slate-200/50">
                <span className="text-[14px] font-black" style={{ color: isOnline ? '#0f172a' : '#94a3b8' }}>
                  {speedKmh}<span className="text-[10px] ml-1 opacity-40">km/h</span>
                </span>
              </div>
            </div>
            {isSelected && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  // Selecting already centers, but we can re-trigger if needed
                  dispatch(devicesActions.selectId(item.id));
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-cyan-50 text-cyan-500 hover:bg-cyan-100 transition-colors ml-1"
              >
                <ArrowForwardIosIcon sx={{ fontSize: 14 }} />
              </div>
            )}
          </div>
        </div>

        {/* Expanded Section */}
        <div className={`flex flex-col gap-3 mt-4 transition-all duration-300 overflow-hidden ${isSelected ? 'opacity-100' : 'opacity-0 h-0 pointer-events-none'}`}>
          
          {/* Telemetry Strip */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-50/80 p-2 rounded-xl border border-slate-100 flex flex-col items-center">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Bateria</span>
              <span className="text-[11px] font-black text-slate-700">{battery}%</span>
            </div>
            <div className="bg-slate-50/80 p-2 rounded-xl border border-slate-100 flex flex-col items-center">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Odômetro</span>
              <span className="text-[11px] font-black text-slate-700">{odometer} <span className="text-[8px] opacity-40">km</span></span>
            </div>
            <div className="bg-slate-50/80 p-2 rounded-xl border border-slate-100 flex flex-col items-center">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Altitude</span>
              <span className="text-[11px] font-black text-slate-700">{altitude} <span className="text-[8px] opacity-40">m</span></span>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
                <div 
                  className="flex-1 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center gap-2 text-slate-400 hover:text-cyan-500 transition-colors"
                  onClick={(e) => { e.stopPropagation(); onCommand('geofence'); }}
                >
                  <AnchorIcon sx={{ fontSize: 18 }} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Âncora</span>
                </div>
            </div>
            
            <div 
              className="flex flex-col gap-2 scale-[0.85] origin-top translate-y-[-5%]"
              onClick={(e) => e.stopPropagation()}
            >
                <SlideAction
                  type="unblock"
                  onComplete={() => onCommand('engineResume')}
                  theme={theme}
                />
                <SlideAction
                  type="block"
                  onComplete={() => onCommand('engineStop')}
                  theme={theme}
                />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceRow;
