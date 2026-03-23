import React from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useHudTheme } from '../util/ThemeContext';

const PwaPageLayout = ({ title, children, actions, transparent = false }) => {
    const navigate = useNavigate();
    const { theme } = useHudTheme();

    return (
        <div
            className="min-h-full md:min-h-screen pt-6 pb-6 md:pb-28 px-4 font-['Outfit'] flex flex-col overflow-x-hidden transition-colors duration-500"
            style={{ 
                background: transparent ? 'transparent' : theme.bg,
                color: theme.textPrimary 
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

            {/* Content Container */}
            <main className="flex-1 flex flex-col">
                {children}
            </main>
        </div>
    );
};

export default PwaPageLayout;
