import { useState, useEffect, useRef } from 'react';

const DISMISSED_KEY = 'pwa-install-dismissed';

export function useInstallPrompt() {
  const [isInstallable, setIsInstallable] = useState(false);
  const promptRef = useRef(null);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;

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
    localStorage.setItem(DISMISSED_KEY, '1');
    promptRef.current = null;
    setIsInstallable(false);
  }

  return { isInstallable, install, dismiss };
}
