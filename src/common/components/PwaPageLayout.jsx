import { useNavigate } from 'react-router-dom';
import { useMediaQuery, useTheme as useMuiTheme } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useHudTheme } from '../util/ThemeContext';

const PwaPageLayout = ({ title, children, actions, transparent = false }) => {
    const navigate = useNavigate();
    const { theme } = useHudTheme();
    const muiTheme = useMuiTheme();
    const desktop = useMediaQuery(muiTheme.breakpoints.up('md'));

    return (
        <div
            className="min-h-full md:min-h-screen pt-6 px-4 font-['Outfit'] flex flex-col transition-colors duration-500"
            style={{
                background: transparent ? 'transparent' : theme.bg,
                color: theme.textPrimary,
                overflowX: 'clip',
                // Mobile: generous clearance from the always-visible BottomMenu
                // Desktop: large bottom padding for the floating BottomMenu pill
                paddingBottom: desktop
                    ? '7rem'
                    : 'calc(100px + env(safe-area-inset-bottom, 0px))',
            }}
        >

            {/* Neumorphic Header */}
            <header className="flex items-center justify-between mb-6 px-1">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md active:scale-95 transition-all duration-300 border"
                        style={{ 
                            background: theme.bgSecondary, 
                            borderColor: theme.border,
                            color: theme.textPrimary
                        }}
                    >
                        <ArrowBackIcon sx={{ fontSize: 18 }} />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold uppercase tracking-widest leading-tight" style={{ color: theme.textPrimary }}>{title}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {actions}
                </div>
            </header>

            {/* Content Container — overlay pages fill height & scroll internally; regular pages grow naturally */}
            <main className={transparent ? 'flex-1 flex flex-col min-h-0' : 'flex flex-col'}>
                {children}
            </main>
        </div>
    );
};

export default PwaPageLayout;
