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

// Registra o Service Worker (precaching + push handlers)
registerSW({
  onNeedRefresh() {
    // Nova versão disponível — o autoUpdate já cuida do reload
    console.log('[PWA] Nova versão disponível.');
  },
  onOfflineReady() {
    console.log('[PWA] App pronto para uso offline.');
  },
  onRegistered(swRegistration) {
    // Disponibiliza o SW registration globalmente para o usePushSubscription
    if (swRegistration) {
      window.__swRegistration = swRegistration;
      console.log('[PWA] Service Worker registrado com sucesso.');
    }
  },
  onRegisterError(error) {
    console.error('[PWA] Falha ao registrar Service Worker:', error);
  },
});

preloadImages();

const root = createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <Provider store={store}>
      <LocalizationProvider>
        <StyledEngineProvider injectFirst>
          <HudThemeProvider>
            <AppThemeProvider>
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
            </AppThemeProvider>
          </HudThemeProvider>
        </StyledEngineProvider>
      </LocalizationProvider>
    </Provider>
  </ErrorBoundary>,
);
