import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

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

    const baseTheme = THEMES[themeKey] || THEMES.dark;

    // FAAS-5: Injeção Dinâmica White-Label (Multi-Tenant Engine)
    const tenantConfig = useMemo(() => {
        try {
            const raw = localStorage.getItem('tenantConfig');
            return raw ? JSON.parse(raw) : null;
        } catch { return null; }
    }, []);

    const theme = useMemo(() => ({
        ...baseTheme,
        accent: tenantConfig?.accent || baseTheme.accent,
        accentSecondary: tenantConfig?.accentSecondary || baseTheme.accentSecondary,
        accentRgb: tenantConfig?.accentRgb || baseTheme.accentRgb,
    }), [baseTheme, tenantConfig]);

    const toggleTheme = useCallback(() => {
        setThemeKey((prev) => {
            const next = prev === 'dark' ? 'light' : 'dark';
            localStorage.setItem('hudTheme', next);
            return next;
        });
    }, []);

    const contextValue = useMemo(() => ({ theme, themeKey, toggleTheme }), [theme, themeKey, toggleTheme]);

    // Apply CSS variables and Global Theme Class to :root so all components can use them
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
        
        // Sync body classes for pure CSS components (like MapLibre Controls)
        if (theme.isDark) {
            document.body.classList.add('theme-dark');
            document.body.classList.remove('theme-light');
        } else {
            document.body.classList.add('theme-light');
            document.body.classList.remove('theme-dark');
        }
    }, [theme]);

    return (
        <ThemeContext.Provider value={contextValue}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useHudTheme = () => {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useHudTheme must be used inside ThemeProvider');
    return ctx;
};
