import { useInstallPrompt } from '../hooks/useInstallPrompt';

export default function InstallBanner() {
  const { isInstallable, install, dismiss } = useInstallPrompt();

  if (!isInstallable) return null;

  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-2 mb-4 rounded-lg text-sm"
      style={{
        background: 'var(--color-overlay)',
        border: '1px solid var(--color-border)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>
        Install BeyBrew for offline access
      </span>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={install}
          className="px-3 py-1 rounded text-xs font-semibold"
          style={{
            background: 'var(--color-accent)',
            color: '#080c18',
            fontFamily: 'var(--font-body)',
          }}
        >
          Install
        </button>
        <button
          onClick={dismiss}
          aria-label="Dismiss install banner"
          className="px-2 py-1 rounded text-xs"
          style={{ color: 'var(--color-text-muted)' }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
