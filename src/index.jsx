import './index.css';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { CssBaseline, StyledEngineProvider } from '@mui/material';
import store from './store';
import { LocalizationProvider } from './common/components/LocalizationProvider';
import ErrorHandler from './common/components/ErrorHandler';
import Navigation from './Navigation';
import preloadImages from './map/core/preloadImages';
import NativeInterface from './common/components/NativeInterface';
import ServerProvider from './ServerProvider';
import ErrorBoundary from './ErrorBoundary';
import AppThemeProvider from './AppThemeProvider';
import { TenantProvider } from './common/components/TenantProvider';
import { ThemeProvider as HudThemeProvider } from './common/util/ThemeContext';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker for PWA
registerSW({
  onNeedRefresh() {
    console.log('PWA: New content available, please refresh.');
  },
  onOfflineReady() {
    console.log('PWA: App ready to work offline.');
  },
});

preloadImages();

const root = createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <Provider store={store}>
      <LocalizationProvider>
        <StyledEngineProvider injectFirst>
          <AppThemeProvider>
            <HudThemeProvider>
              <CssBaseline />
              <TenantProvider>
                <BrowserRouter>
                  <ServerProvider>
                    <Navigation />
                  </ServerProvider>
                  <ErrorHandler />
                  <NativeInterface />
                </BrowserRouter>
              </TenantProvider>
            </HudThemeProvider>
          </AppThemeProvider>
        </StyledEngineProvider>
      </LocalizationProvider>
    </Provider>
  </ErrorBoundary>,
);
