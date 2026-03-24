import React, { createContext, useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { ThemeProvider } from '@mui/material';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import rtlPlugin from 'stylis-plugin-rtl';
import theme from './common/theme';
import { useLocalization } from './common/components/LocalizationProvider';
import { useHudTheme } from './common/util/ThemeContext';
import { useTenant } from './common/components/TenantProvider';

const cache = {
  ltr: createCache({
    key: 'muiltr',
  }),
  rtl: createCache({
    key: 'muirtl',
    stylisPlugins: [rtlPlugin],
  }),
};

const ThemeModeContext = createContext({ darkMode: true });

export const useThemeMode = () => useContext(ThemeModeContext);

const AppThemeProvider = ({ children }) => {
  const server = useSelector((state) => state.session.server);
  const { direction } = useLocalization();
  const tenantCtx = useTenant();
  const tenant = tenantCtx?.tenant;

  // Sync MUI palette with HUD theme toggle so Dialogs/inputs respect light/dark
  const { theme: hudTheme } = useHudTheme();
  const darkMode = hudTheme.isDark;

  const themeInstance = theme(server, darkMode, direction, tenant);

  const contextValue = useMemo(() => ({ darkMode }), [darkMode]);

  return (
    <CacheProvider value={cache[direction]}>
      <ThemeModeContext.Provider value={contextValue}>
        <ThemeProvider theme={themeInstance}>{children}</ThemeProvider>
      </ThemeModeContext.Provider>
    </CacheProvider>
  );
};

export default AppThemeProvider;
