import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

export const THEMES = {
    dark: {
        name: 'Escuro Vision',
        bg: '#08090a',
        bgSecondary: '#111214',
        bgCard: '#161719',
        border: 'rgba(57,255,20,0.12)',
        borderCard: 'rgba(255,255,255,0.06)',
        textPrimary: '#ffffff',
        textSecondary: '#a1a1aa',
        textMuted: '#52525b',
        accent: '#39ff14', // Neon Green
        accentSecondary: '#00e5ff', // Cyber Blue
        accentRgb: '57, 255, 20',
        sidebarShadow: '10px 0 50px rgba(0,0,0,0.8)',
        scrollbarTrack: '#050505',
        scrollbarThumb: '#27272a',
        isDark: true,
    },
    light: {
        name: 'EV Lifestyle',
        bg: '#f8fafc',
        bgSecondary: '#ffffff',
        bgCard: '#ffffff', // Pure white cards for the new look
        border: 'rgba(6,182,212,0.08)',
        borderCard: 'rgba(0,0,0,0.04)',
        textPrimary: '#0f172a',
        textSecondary: '#475569',
        textMuted: '#94a3b8',
        accent: '#06b6d4', // Cyan 500
        accentSecondary: '#22d3ee', // Cyan 400
        accentRgb: '6, 182, 212',
        sidebarShadow: '0 10px 40px rgba(0,0,0,0.04)',
        scrollbarTrack: '#f1f5f9',
        scrollbarThumb: '#cbd5e1',
        isDark: false,
    },
};

export const ThemeProvider = ({ children }) => {
    const [themeKey, setThemeKey] = useState(
        () => localStorage.getItem('hudTheme') || 'dark',
    );

    const theme = THEMES[themeKey] || THEMES.dark;

    const toggleTheme = useCallback(() => {
        setThemeKey((prev) => {
            const next = prev === 'dark' ? 'light' : 'dark';
            localStorage.setItem('hudTheme', next);
            return next;
        });
    }, []);

    // Apply CSS variables to :root so all components can use them
    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--hud-bg', theme.bg);
        root.style.setProperty('--hud-bg2', theme.bgSecondary);
        root.style.setProperty('--hud-bgcard', theme.bgCard);
        root.style.setProperty('--hud-border', theme.border);
        root.style.setProperty('--hud-bordercard', theme.borderCard);
        root.style.setProperty('--hud-text', theme.textPrimary);
        root.style.setProperty('--hud-text2', theme.textSecondary);
        root.style.setProperty('--hud-muted', theme.textMuted);
        root.style.setProperty('--hud-accent', theme.accent);
        root.style.setProperty('--hud-accent2', theme.accentSecondary);
        root.style.setProperty('--hud-accent-rgb', theme.accentRgb);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, themeKey, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useHudTheme = () => {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useHudTheme must be used inside ThemeProvider');
    return ctx;
};
