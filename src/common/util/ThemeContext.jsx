import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

export const THEMES = {
    dark: {
        name: 'Escuro',
        bg: '#1e1f24',
        bgSecondary: '#24262b',
        bgCard: '#121418',
        border: 'rgba(57,255,20,0.10)',
        borderCard: 'rgba(100,116,139,0.15)',
        textPrimary: '#f1f5f9',
        textSecondary: '#94a3b8',
        textMuted: '#475569',
        accent: '#39ff14',
        accentSecondary: '#00d9f5',
        sidebarShadow: '4px 0 30px rgba(0,0,0,0.5)',
        scrollbarTrack: '#0f1013',
        scrollbarThumb: '#313236',
        isDark: true,
    },
    light: {
        name: 'Claro',
        bg: '#f0f4f8',
        bgSecondary: '#ffffff',
        bgCard: '#e8edf3',
        border: 'rgba(0,130,50,0.20)',
        borderCard: 'rgba(0,0,0,0.07)',
        textPrimary: '#0f172a',
        textSecondary: '#334155',
        textMuted: '#64748b',
        accent: '#008c32',
        accentSecondary: '#0071a8',
        sidebarShadow: '4px 0 20px rgba(0,0,0,0.10)',
        scrollbarTrack: '#dde3ea',
        scrollbarThumb: '#b0bcc8',
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
