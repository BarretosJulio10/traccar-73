import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    Typography,
} from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import EventIcon from '@mui/icons-material/Event';
import RouteIcon from '@mui/icons-material/Route';
import TimerIcon from '@mui/icons-material/Timer';
import AssessmentIcon from '@mui/icons-material/Assessment';
import FenceIcon from '@mui/icons-material/Fence';
import BarChartIcon from '@mui/icons-material/BarChart';
import PersonIcon from '@mui/icons-material/Person';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import SportsScoreIcon from '@mui/icons-material/SportsScore';
import SpeedIcon from '@mui/icons-material/Speed';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

import { useTranslation } from '../common/components/LocalizationProvider';
import PwaPageLayout from '../common/components/PwaPageLayout';
import { useHudTheme } from '../common/util/ThemeContext';

const reports = [
    {
        id: 'combined',
        title: 'Geral',
        subtitle: 'Unificado',
        icon: <AssessmentIcon sx={{ color: '#39ff14' }} />,
        path: '/app/reports/combined',
    },
    {
        id: 'route',
        title: 'Trajeto',
        subtitle: 'GPS Detalhado',
        icon: <RouteIcon sx={{ color: '#3b82f6' }} />,
        path: '/app/reports/route',
    },
    {
        id: 'trips',
        title: 'Viagens',
        subtitle: 'Percursos',
        icon: <MapIcon sx={{ color: '#f59e0b' }} />,
        path: '/app/reports/trips',
    },
    {
        id: 'stops',
        title: 'Paradas',
        subtitle: 'Permanência',
        icon: <TimerIcon sx={{ color: '#8b5cf6' }} />,
        path: '/app/reports/stops',
    },
    {
        id: 'events',
        title: 'Alertas',
        subtitle: 'Histórico',
        icon: <EventIcon sx={{ color: '#ff3939' }} />,
        path: '/app/reports/events',
    },
    {
        id: 'heatmap',
        title: 'Calor',
        subtitle: 'Densidade',
        icon: <WhatshotIcon sx={{ color: '#f97316' }} />,
        path: '/app/reports/heatmap',
    },
    {
        id: 'driverscore',
        title: 'Scoring',
        subtitle: 'Ranking Eco',
        icon: <SportsScoreIcon sx={{ color: '#8b5cf6' }} />,
        path: '/app/reports/score',
    },
    {
        id: 'summary',
        title: 'Resumo',
        subtitle: 'Totais',
        icon: <BarChartIcon sx={{ color: '#10b981' }} />,
        path: '/app/reports/summary',
    }
];

const ReportsHubPage = () => {
    const navigate = useNavigate();
    const t = useTranslation();
    const { theme } = useHudTheme();
    
    const devices = useSelector((state) => state.devices.items);
    const positions = useSelector((state) => state.session.positions);
    
    const deviceList = Object.values(devices);
    const activeVehicles = deviceList.filter(d => d.status === 'online').length;
    const movingVehicles = Object.values(positions).filter(p => p.speed > 0).length;
    const avgSpeed = Object.values(positions).length > 0 
        ? Math.round(Object.values(positions).reduce((acc, p) => acc + (p.speed || 0), 0) / Object.values(positions).length * 1.852)
        : 0;

    return (
        <PwaPageLayout title={t('reportMain')}>
            <div className="flex flex-col gap-8 pb-32">
                
                {/* Advanced Stats Summary Header */}
                <div 
                    className="p-6 rounded-[32px] border shadow-xl relative overflow-hidden"
                    style={{ background: theme.bgSecondary, borderColor: theme.border }}
                >
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <TrendingUpIcon sx={{ fontSize: 120, color: theme.accent }} />
                    </div>
                    
                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em] mb-4" style={{ color: theme.textMuted }}>
                        Estatísticas em <span style={{ color: theme.accent }}>Tempo Real</span>
                    </h2>
                    
                    <div className="grid grid-cols-3 gap-3">
                        <div className="flex flex-col">
                            <span className="text-2xl font-black" style={{ color: theme.textPrimary }}>{activeVehicles}</span>
                            <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: theme.textMuted }}>Ativos</span>
                        </div>
                        <div className="flex flex-col border-l pl-3" style={{ borderColor: theme.border }}>
                            <span className="text-2xl font-black" style={{ color: theme.textPrimary }}>{movingVehicles}</span>
                            <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: theme.textMuted }}>Em Movimento</span>
                        </div>
                        <div className="flex flex-col border-l pl-3" style={{ borderColor: theme.border }}>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black" style={{ color: theme.textPrimary }}>{avgSpeed}</span>
                                <span className="text-[10px] font-bold opacity-50" style={{ color: theme.textMuted }}>km/h</span>
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: theme.textMuted }}>Velo. Média</span>
                        </div>
                    </div>
                </div>

                <div className="px-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Módulos de Análise</p>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {reports.map((report) => (
                            <div key={report.id} className="h-full">
                                <div
                                    onClick={() => navigate(report.path)}
                                    className="group rounded-[28px] p-5 h-full shadow-md border flex flex-col items-center justify-center gap-3 active:scale-[0.96] transition-all cursor-pointer text-center relative overflow-hidden"
                                    style={{
                                        background: theme.bgSecondary,
                                        borderColor: theme.borderCard
                                    }}
                                >
                                    <div 
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-all border group-hover:scale-110"
                                        style={{ background: theme.bg, borderColor: theme.border, color: report.icon?.props?.sx?.color || theme.accent }}
                                    >
                                        {report.icon}
                                    </div>
                                    
                                    <div className="flex flex-col">
                                        <span className="text-[13px] font-black uppercase tracking-tight" style={{ color: theme.textPrimary }}>
                                            {report.title}
                                        </span>
                                        <span className="text-[8px] font-bold uppercase tracking-widest opacity-60 mt-0.5" style={{ color: theme.textMuted }}>
                                            {report.subtitle}
                                        </span>
                                    </div>

                                    {/* Subtle Glow on Hover */}
                                    <div className="absolute inset-0 bg-transparent group-hover:bg-white/5 transition-colors pointer-events-none" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Tip */}
                <div className="mx-2 p-4 rounded-2xl border border-dashed text-center" style={{ borderColor: theme.border }}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: theme.textMuted }}>
                        Dica: Use o Mapa de Calor para identificar áreas de maior ociosidade ou tráfego.
                    </p>
                </div>
            </div>
        </PwaPageLayout>
    );
};

export default ReportsHubPage;
