import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { ThemeProvider, useMediaQuery } from '@mui/material';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import rtlPlugin from 'stylis-plugin-rtl';
import theme from './common/theme';
import { useLocalization } from './common/components/LocalizationProvider';
import usePersistedState from './common/util/usePersistedState';
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

const ThemeModeContext = createContext({
  darkMode: true,
  toggleDarkMode: () => {},
});

export const useThemeMode = () => useContext(ThemeModeContext);

const AppThemeProvider = ({ children }) => {
  const server = useSelector((state) => state.session.server);
  const { direction } = useLocalization();
  const tenantCtx = useTenant();
  const tenant = tenantCtx?.tenant;

  const preferDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [userDarkMode, setUserDarkMode] = usePersistedState('darkMode', null);

  const darkMode =
    userDarkMode !== null
      ? userDarkMode
      : server?.attributes?.darkMode !== undefined
        ? server.attributes.darkMode
        : preferDarkMode;

  const toggleDarkMode = useCallback(() => {
    setUserDarkMode(!darkMode);
  }, [darkMode, setUserDarkMode]);

  const themeInstance = theme(server, darkMode, direction, tenant);

  const contextValue = useMemo(() => ({ darkMode, toggleDarkMode }), [darkMode, toggleDarkMode]);

  return (
    <CacheProvider value={cache[direction]}>
      <ThemeModeContext.Provider value={contextValue}>
        <ThemeProvider theme={themeInstance}>{children}</ThemeProvider>
      </ThemeModeContext.Provider>
    </CacheProvider>
  );
};

export default AppThemeProvider;
