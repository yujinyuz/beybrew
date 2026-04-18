import { useState, useEffect, useRef } from 'react';

const DISMISSED_KEY = 'pwa-install-dismissed';

export function useInstallPrompt() {
  const [isInstallable, setIsInstallable] = useState(false);
  const promptRef = useRef(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISSED_KEY)) return;
    } catch {
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      promptRef.current = e;
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function install() {
    if (!promptRef.current) return;
    promptRef.current.prompt();
    const { outcome } = await promptRef.current.userChoice;
    if (outcome === 'accepted') {
      promptRef.current = null;
      setIsInstallable(false);
    }
  }

  function dismiss() {
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // private browsing mode — dismiss works for this session only
    }
    promptRef.current = null;
    setIsInstallable(false);
  }

  return { isInstallable, install, dismiss };
}
