import { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export default function OfflineReadyToast() {
  const [show, setShow] = useState(false);

  useRegisterSW({
    onOfflineReady() {
      setShow(true);
      setTimeout(() => setShow(false), 4000);
    },
  });

  if (!show) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm z-50"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        color: 'var(--color-accent)',
        fontFamily: 'var(--font-body)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      }}
    >
      ✓ App ready for offline use
    </div>
  );
}
