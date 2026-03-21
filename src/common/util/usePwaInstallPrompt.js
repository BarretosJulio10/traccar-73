import { useState, useEffect, useCallback, useRef } from 'react';

const usePwaInstallPrompt = () => {
  const deferredPromptRef = useRef(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detect if already installed (standalone mode)
    const checkInstalled = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;
      setIsInstalled(standalone);
    };

    checkInstalled();

    // Listen for display-mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e) => setIsInstalled(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    // Capture beforeinstallprompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Listen for successful install
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

  const isIos = () => {
    const ua = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(ua);
  };

  const isSafari = () => {
    const ua = window.navigator.userAgent.toLowerCase();
    return /safari/.test(ua) && !/chrome/.test(ua);
  };

  return {
    canInstall,
    isInstalled,
    promptInstall,
    isIos: isIos(),
    isIosSafari: isIos() && isSafari(),
  };
};

export default usePwaInstallPrompt;
