import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

/**
 * Hook para gerenciar o prompt de instalação PWA.
 * Detecta plataforma (iOS, Android, Samsung), estado de instalação,
 * e expõe método para acionar o prompt nativo do browser.
 */
const usePwaInstallPrompt = () => {
  const deferredPromptRef = useRef(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // Detecção de plataforma com memoização — evita recálculo a cada render
  const platform = useMemo(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    const isIos =
      /iphone|ipad|ipod/.test(ua) ||
      // iPadOS 13+ reporta como macOS — detectar via touch points
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /android/.test(ua);
    const isSamsungBrowser = /samsungbrowser/.test(ua);
    const isFirefox = /firefox/.test(ua);
    const isSafari = /safari/.test(ua) && !/chrome/.test(ua) && !/android/.test(ua);
    const isChrome = /chrome/.test(ua) && !/edge/.test(ua);
    const isEdge = /edg\//.test(ua);

    return { isIos, isAndroid, isSamsungBrowser, isFirefox, isSafari, isChrome, isEdge };
  }, []);

  useEffect(() => {
    // Detecta se já está instalado (modo standalone)
    const checkInstalled = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;
      setIsInstalled(standalone);
    };

    checkInstalled();

    // Escuta mudanças no display-mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e) => setIsInstalled(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    // Captura o evento beforeinstallprompt (Android/Chrome/Edge)
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Escuta instalação concluída
    const handleInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      deferredPromptRef.current = null;
    };

    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    const prompt = deferredPromptRef.current;
    if (!prompt) return false;

    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    deferredPromptRef.current = null;
    setCanInstall(false);

    return outcome === 'accepted';
  }, []);

  return {
    canInstall,
    isInstalled,
    promptInstall,
    ...platform,
  };
};

export default usePwaInstallPrompt;
