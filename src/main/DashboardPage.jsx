import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useMediaQuery, useTheme } from '@mui/material';

import { devicesActions } from '../store';
import { mapIconKey, mapIcons } from '../map/core/preloadImages';
import { useHudTheme } from '../common/util/ThemeContext';
import LogoImage from '../login/LogoImage';

const DashboardPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const themeMui = useTheme();
  const { theme } = useHudTheme();
  const desktop = useMediaQuery(themeMui.breakpoints.up('md'));

  const user = useSelector((state) => state.session.user);
  const devices = useSelector((state) => state.devices.items);
  const positions = useSelector((state) => state.session.positions);

  useEffect(() => {
    if (desktop) {
      navigate('/app/map');
    }
  }, [desktop, navigate]);

  const handleDeviceClick = (deviceId) => {
    dispatch(devicesActions.selectId(deviceId));
    navigate('/app/map');
  };

  return (
    <div 
      className="min-h-[100dvh] pb-[100px] pt-8 px-4 font-['Quicksand'] transition-colors duration-500"
      style={{ background: theme.bg }}
    >

      {/* Header */}
      <header className="mb-8 flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner overflow-hidden"
            style={{ background: theme.bgSecondary, borderColor: theme.border }}
          >
            <LogoImage size={24} className="m-0" />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight leading-none" style={{ color: theme.textPrimary }}>
              Meus <span style={{ color: theme.accent }}>Veículos</span>
            </h1>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] mt-1" style={{ color: theme.textMuted }}>
              Bem-vindo, {user?.name || 'Comandante'}
            </p>
          </div>
        </div>
        <div 
          className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg"
          style={{ background: theme.bgSecondary, borderColor: theme.border }}
        >
          <span className="text-[14px] font-black" style={{ color: theme.accent }}>{Object.keys(devices).length}</span>
        </div>
      </header>

      <div className="flex flex-col gap-5">
        {Object.values(devices).map(device => {
          const pos = positions[device.id] || {};
          const isOnline = device.status === 'online';
          const speed = Math.round((pos.speed || 0) * 1.852);

          return (
            <div
              key={device.id}
              onClick={() => handleDeviceClick(device.id)}
              className="w-full rounded-[28px] p-5 flex items-center gap-5 cursor-pointer transition-all duration-300 active:scale-[0.96] border shadow-lg relative overflow-hidden mb-1"
              style={{
                background: theme.isDark ? 'rgba(22, 23, 25, 0.7)' : 'rgba(255, 255, 255, 0.8)',
                borderColor: theme.border,
                color: theme.textPrimary,
                backdropFilter: 'blur(10px)',
              }}
            >
              {/* Status Glow Indicator */}
              {isOnline && (
                <div 
                  className="absolute left-0 top-0 bottom-0 w-1.5" 
                  style={{ background: theme.accent, boxShadow: `0 0 15px ${theme.accent}` }}
                />
              )}

              {/* Icon Container */}
              <div 
                className="w-14 h-14 rounded-2xl flex flex-shrink-0 items-center justify-center border shadow-inner"
                style={{ background: theme.bg, borderColor: theme.border }}
              >
                <img
                  src={mapIcons[mapIconKey(device.category)]}
                  alt=""
                  className={`w-7 h-7 transition-all duration-300 ${isOnline ? '' : 'opacity-30 grayscale'}`}
                  style={isOnline ? { filter: 'saturate(2) hue-rotate(90deg) brightness(1.2)' } : {}}
                />
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-[15px] font-black tracking-tight truncate mb-1 leading-tight uppercase" style={{ color: theme.textPrimary }}>
                  {device.name}
                </h2>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full animate-pulse" 
                    style={{ 
                      background: isOnline ? theme.accent : theme.textMuted,
                      boxShadow: isOnline ? `0 0 8px ${theme.accent}` : 'none'
                    }} 
                  />
                  <span 
                    className="text-[10px] font-black tracking-[0.1em] uppercase" 
                    style={{ color: isOnline ? theme.accent : theme.textMuted }}
                  >
                    {isOnline ? 'Operacional' : 'Desconectado'}
                  </span>
                </div>
              </div>

              {/* Telemetry Block */}
              <div 
                className="rounded-2xl flex flex-col items-center justify-center p-3 min-w-[75px] border shadow-inner"
                style={{ 
                    background: theme.isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)', 
                    borderColor: theme.borderCard 
                }}
              >
                <p className="text-[17px] font-black leading-none italic" style={{ color: theme.textPrimary }}>
                  {speed}
                </p>
                <span className="text-[8px] font-black uppercase tracking-[0.1em] mt-1 opacity-50" style={{ color: theme.textMuted }}>km/h</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardPage;
