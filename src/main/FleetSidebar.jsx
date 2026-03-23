import React from 'react';
import { useSelector } from 'react-redux';
import { Typography, Tooltip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import DeviceList from './DeviceList';
import MapSideMenu from './MapSideMenu';
import { useHudTheme } from '../common/util/ThemeContext';
import { useTenant } from '../common/components/TenantProvider';
import LogoImage from '../login/LogoImage';

const FleetSidebar = ({ search, setSearch, onOpenPanel, onClosePanel, panelDeviceId }) => {
    const { theme, toggleTheme } = useHudTheme();
    const { tenant } = useTenant() || {};
    const devices = useSelector((state) => state.devices.items);
    const onlineCount = Object.values(devices).filter(d => d.status === 'online').length;
    const totalCount = Object.keys(devices).length;

    const fleetDevices = React.useMemo(() => Object.values(devices).filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase())
    ), [devices, search]);

    return (
        <div
            className="w-[360px] h-full flex flex-col z-20 overflow-hidden font-['Quicksand'] transition-colors duration-500"
            style={{
                background: theme.bg,
                borderRight: `1px solid ${theme.border}`,
                boxShadow: theme.sidebarShadow,
            }}
        >
            {/* Cabeçalho HUD */}
            <header className="relative px-5 pt-0 pb-4 shrink-0">
                {/* Controles: Badge + Tema empilhados verticalmente no canto superior direito */}
                <div
                    className="absolute flex flex-col items-center gap-1"
                    style={{ top: 2, right: 2 }}
                >
                    {/* Badge online/total */}
                    <div
                        className="rounded-lg px-2 py-1 border"
                        style={{ background: theme.bg, borderColor: theme.border }}
                    >
                        <span className="text-[11px] font-black" style={{ color: theme.accent }}>
                            {onlineCount}/{totalCount}
                        </span>
                    </div>

                    {/* Botão Modo Claro/Escuro */}
                    <Tooltip title={theme.isDark ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'} arrow placement="left">
                        <button
                            onClick={toggleTheme}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 border"
                            style={{
                                background: theme.bgSecondary,
                                borderColor: theme.borderCard,
                                color: theme.accent,
                            }}
                        >
                            {theme.isDark
                                ? <LightModeIcon sx={{ fontSize: 16 }} />
                                : <DarkModeIcon sx={{ fontSize: 16 }} />
                            }
                        </button>
                    </Tooltip>
                </div>

                {/* Logo + Título centralizados */}
                <div className="flex flex-col items-center mb-4">
                    <LogoImage size={168} className="m-0" style={{ margin: 0 }} />
                    <h1 className="text-xl font-black tracking-tight text-center mt-2" style={{ color: theme.textPrimary }}>
                        {tenant?.company_name ? (
                            <span style={{ textTransform: 'uppercase' }}>{tenant.company_name}</span>
                        ) : (
                            <>FROTA <span style={{ color: theme.accent }}>TÁTICA</span></>
                        )}
                    </h1>
                    <p className="text-[10px] font-bold tracking-[0.2em] uppercase mt-0.5 text-center" style={{ color: theme.textMuted }}>
                        Sistema de Monitoramento
                    </p>
                </div>

                {/* Campo de Busca */}
                <div className="relative group">
                    <div
                        className="rounded-xl flex items-center px-4 py-2.5 transition-all duration-300 border"
                        style={{
                            background: theme.bgSecondary,
                            borderColor: theme.borderCard,
                        }}
                    >
                        <SearchIcon sx={{ color: theme.accent, fontSize: 18, opacity: 0.7 }} />
                        <input
                            type="text"
                            placeholder="Buscar veículos..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="flex-1 bg-transparent border-none outline-none ml-3 text-[13px] font-bold placeholder-slate-500"
                            style={{ color: theme.textPrimary }}
                        />
                    </div>
                </div>
            </header>

            {/* Lista de Frota */}
            <div className="flex-1 min-h-0 overflow-hidden scrollbar-hide">
                <DeviceList devices={fleetDevices} onOpenPanel={onOpenPanel} onClosePanel={onClosePanel} panelDeviceId={panelDeviceId} />
            </div>

            {/* Nav Menu — centralizado acima do rodapé */}
            <div className="flex justify-center mb-[2px]">
                <MapSideMenu inline />
            </div>

            {/* Rodapé */}
            <footer
                className="p-4 border-t"
                style={{ background: theme.bg, borderColor: theme.borderCard }}
            >
                <div className="flex items-center justify-between px-2">
                    <Tooltip title="Versão atual do HUD Tático" arrow placement="top">
                        <Typography sx={{ fontSize: '9px', fontWeight: 800, color: theme.accent, opacity: 0.9, cursor: 'help', letterSpacing: '0.08em' }}>
                            SISTEMA v1.1.0
                        </Typography>
                    </Tooltip>
                    <Tooltip
                        title={
                            <div style={{ padding: '4px 8px' }}>
                                <p style={{ fontWeight: 900, color: theme.accent, fontSize: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '4px', paddingBottom: '4px' }}>
                                    STATUS DO LINK DE DADOS
                                </p>
                                <p style={{ fontSize: '9px', color: '#e2e8f0', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                                    Saúde: <span style={{ color: theme.accent }}>100%</span>
                                </p>
                                <p style={{ fontSize: '9px', color: '#e2e8f0', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                                    Taxa de Sync: <span style={{ color: theme.accent }}>1.2s</span>
                                </p>
                                <p style={{ fontSize: '9px', color: '#e2e8f0', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                                    Pacotes: <span style={{ color: theme.accent }}>Ao Vivo</span>
                                </p>
                            </div>
                        }
                        arrow
                        placement="top"
                    >
                        <div className="flex gap-2.5 items-center cursor-help">
                            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: theme.accent, boxShadow: `0 0 10px ${theme.accent}` }} />
                            <div className="w-2 h-2 rounded-full opacity-40" style={{ background: theme.accent, boxShadow: `0 0 5px ${theme.accent}` }} />
                            <div className="w-2 h-2 rounded-full opacity-25" style={{ background: theme.accent, boxShadow: `0 0 4px ${theme.accent}` }} />
                        </div>
                    </Tooltip>
                </div>
            </footer>
        </div>
    );
};

export default FleetSidebar;
