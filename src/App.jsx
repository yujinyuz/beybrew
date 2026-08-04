import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import PartSelector from './PartSelector';
import ModeToggle from './ModeToggle';
import Beyblade from './Beyblade';
import DeckProfilePanel from './components/DeckProfilePanel';
import SupportPopup from './components/SupportPopup';
import ShareModal from './components/ShareModal';
import InstallBanner from './components/InstallBanner';
import OfflineReadyToast from './components/OfflineReadyToast';
import ConfigurableDeckWidget from './components/widgets/ConfigurableDeckWidget';
import DeckPreview from './components/DeckPreview';
import ConfigurableComboWidget from './components/widgets/ConfigurableComboWidget';
import { shouldShowSupportPopup } from './lib/supportPopup';
import { getDeckProfile } from './lib/comboUtils';
import { useBeybladeDeck } from './hooks/useBeybladeDeck';

import {
  BLADES,
  ASSIST_BLADES,
  OVER_BLADES,
  RATCHETS,
  BITS,
  LOCK_CHIPS,
  BUILT_IN_FORMATS,
  BEYBLADE_DB,
  BLADE_INTEGRATED_RATCHETS,
  BIT_TO_RATCHET,
  CURRENT_PATCH,
  getLineColor,
} from './constants';
import FormatViolations from './components/FormatViolations';

import { domToPng } from 'modern-screenshot';

const isMobileDevice = /iPad|iPhone|iPod|Android/.test(navigator.userAgent);

function GenerateImageModal({ dataUrl, filename, onClose }) {
  function handleShare() {
    fetch(dataUrl)
      .then(r => r.blob())
      .then(blob => {
        const file = new File([blob], filename, { type: 'image/png' });
        if (navigator.canShare?.({ files: [file] })) {
          navigator.share({ files: [file] }).catch(() => { });
        }
      });
  }
  const btnStyle = { flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'var(--color-accent)', color: '#fff', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '13px', letterSpacing: '0.08em', cursor: 'pointer', textAlign: 'center', textDecoration: 'none' };
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', gap: '16px' }}
      onClick={onClose}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%', maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
        <img src={dataUrl} alt="Generated image" style={{ maxWidth: '100%', maxHeight: '55vh', borderRadius: '12px', boxShadow: '0 8px 40px rgba(0,0,0,0.7)' }} />
        <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', textAlign: 'center', margin: 0 }}>
          {isMobileDevice ? 'Long-press the image to save it, or tap Share below.' : 'Right-click the image to save it, or click Download below.'}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
          {isMobileDevice
            ? <button onClick={handleShare} style={btnStyle}>Share / Save</button>
            : <a href={dataUrl} download={filename} style={btnStyle}>Download</a>
          }
          <button
            onClick={onClose}
            style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '13px', letterSpacing: '0.08em', cursor: 'pointer' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

GenerateImageModal.propTypes = {
  dataUrl: PropTypes.string,
  filename: PropTypes.string,
  onClose: PropTypes.func,
};

function DownloadErrorBox({ error, onDismiss }) {
  const [copyStatus, setCopyStatus] = useState(null);
  function handleCopy() {
    navigator.clipboard.writeText(error)
      .then(() => setCopyStatus('copied'))
      .catch(() => setCopyStatus('failed'));
  }
  useEffect(() => {
    if (!copyStatus) return;
    const t = setTimeout(() => setCopyStatus(null), 1500);
    return () => clearTimeout(t);
  }, [copyStatus]);
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={onDismiss}
    >
      <div
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-danger)', borderRadius: '16px', boxShadow: '0 8px 40px rgba(0,0,0,0.7)', width: '100%', maxWidth: '480px', padding: '24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', fontWeight: 900, letterSpacing: '0.08em', color: 'var(--color-danger)' }}>DOWNLOAD ERROR</span>
          <button onClick={onDismiss} aria-label="Close" className="w-11 h-11 flex items-center justify-center rounded-lg" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '18px', lineHeight: 1 }}>×</button>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
          Something went wrong generating the image. Copy the error details below to report the issue.
        </p>
        <textarea
          readOnly
          value={error}
          rows={4}
          style={{ width: '100%', fontFamily: 'monospace', fontSize: '11px', background: 'var(--color-surface-2)', color: 'var(--color-danger)', border: '1px solid color-mix(in srgb, var(--color-danger) 30%, transparent)', borderRadius: '8px', padding: '10px', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
          <button
            onClick={handleCopy}
            style={{ fontSize: '11px', padding: '6px 14px', borderRadius: '6px', border: '1px solid color-mix(in srgb, var(--color-danger) 40%, transparent)', background: 'color-mix(in srgb, var(--color-danger) 10%, transparent)', color: 'var(--color-danger)', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontWeight: 700, letterSpacing: '0.08em' }}
          >
            {copyStatus === 'copied' ? 'Copied!' : copyStatus === 'failed' ? 'Failed!' : 'Copy Error'}
          </button>
          <button
            onClick={onDismiss}
            style={{ fontSize: '11px', padding: '6px 14px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text-muted)', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontWeight: 700, letterSpacing: '0.08em' }}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

DownloadErrorBox.propTypes = {
  error: PropTypes.string,
  onDismiss: PropTypes.func,
};

const surface = { background: 'var(--color-surface)', border: '1px solid var(--color-border)' };
const surfaceBox = { ...surface, borderRadius: '12px', boxShadow: 'var(--shadow-card)' };

function LimitedFormatPoints({ format, totalPoints, maxPoints }) {
  if (!format?.rules?.some(r => r.type === 'pointBudget')) return null;
  const over = totalPoints > maxPoints;
  return (
    <div
      className="sticky top-0 z-10 flex items-center justify-center gap-3 py-2 px-4 mb-5 rounded-lg"
      style={{ background: 'var(--color-overlay)', backdropFilter: 'blur(10px)', border: '1px solid var(--color-border)' }}
    >
      <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>
        Points
      </span>
        <span
          className="text-xl font-bold"
          style={{
            fontFamily: 'var(--font-heading)',
            color: over ? 'var(--color-danger)' : 'var(--color-accent)',
            textShadow: over ? '0 0 12px color-mix(in srgb, var(--color-danger) 50%, transparent)' : '0 0 12px var(--color-accent-dim)',
          }}
        >
          {totalPoints}/{maxPoints}
        </span>
        {over && (
          <span className="text-xs font-semibold" style={{ color: 'var(--color-danger)' }}>
            OVER LIMIT
          </span>
        )}
    </div>
  );
}

LimitedFormatPoints.propTypes = {
  format: PropTypes.object,
  totalPoints: PropTypes.number,
  maxPoints: PropTypes.number,
};

function IconShare() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
        d="M7.926 10.898 15 7.727m-7.074 5.39L15 16.29M8 12a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm12 5.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm0-11a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z"
      />
    </svg>
  );
}

function IconRandomize({ small = false }) {
  return (
    <svg className={`${small ? 'w-3 h-3' : 'w-4 h-4'} flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

IconRandomize.propTypes = {
  small: PropTypes.bool,
};

function IconDownload() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" />
    </svg>
  );
}

async function waitForScreenshotReady(container) {
  try {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
  } catch {
    // Ignore font readiness failures and fall back to image/layout settling.
  }

  const imageWaits = Array.from(container.querySelectorAll('img')).map((img) => {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    if (typeof img.decode === 'function') {
      return img.decode().catch(() => { });
    }
    return new Promise((resolve) => {
      img.addEventListener('load', resolve, { once: true });
      img.addEventListener('error', resolve, { once: true });
    });
  });

  await Promise.allSettled(imageWaits);
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

function WidgetPreview({ mode, config, combos, beybladeCount, currentFormat, profile, bladerName, comboIndex }) {
  const isStory = config.aspectRatio === 'story';
  const previewMode = mode === 'deck' ? 'deck' : 'combo';
  const baseWidth = isStory ? 540 : previewMode === 'deck' ? 480 : 320;
  const baseHeight = isStory
    ? 960
    : previewMode === 'deck'
      ? Math.max(360, 140 + beybladeCount * 84)
      : 380;
  const scale = previewMode === 'deck'
    ? (isStory ? 0.28 : 0.42)
    : (isStory ? 0.34 : 0.58);

  return (
    <div>
      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '0.12em', marginBottom: '8px', fontWeight: 700 }}>LIVE PREVIEW</div>
      <div
        style={{
          borderRadius: '10px',
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg)',
          overflow: 'hidden',
          maxHeight: '280px',
        }}
      >
        <div
          style={{
            width: `${baseWidth * scale}px`,
            height: `${baseHeight * scale}px`,
            overflow: 'hidden',
            margin: '0 auto',
          }}
        >
          <div
            style={{
              width: `${baseWidth}px`,
              height: `${baseHeight}px`,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            {previewMode === 'deck' ? (
              <ConfigurableDeckWidget
                combos={combos}
                beybladeCount={beybladeCount}
                format={currentFormat}
                profile={config.showProfile ? profile : undefined}
                bladerName={config.showProfile ? bladerName : undefined}
                config={config}
              />
            ) : (
              <ConfigurableComboWidget combo={combos[comboIndex]} config={config} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

WidgetPreview.propTypes = {
  mode: PropTypes.oneOf(['deck', 'combo']).isRequired,
  config: PropTypes.object.isRequired,
  combos: PropTypes.array.isRequired,
  beybladeCount: PropTypes.number.isRequired,
  currentFormat: PropTypes.object.isRequired,
  profile: PropTypes.object,
  bladerName: PropTypes.string,
  comboIndex: PropTypes.number,
};

function WidgetConfigPanel({ mode, config, combos, beybladeCount, currentFormat, profile, bladerName, comboIndex, onConfigChange, onGenerate, onClose }) {
  const surfaceStyle = {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '16px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={onClose}
    >
      <div style={{ ...surfaceStyle, width: '100%', maxWidth: '320px', padding: '20px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '12px', fontWeight: 900, letterSpacing: '0.08em', color: 'var(--color-accent)' }}>
            IMAGE OPTIONS
          </span>
          <button onClick={onClose} aria-label="Close" className="w-11 h-11 flex items-center justify-center rounded-lg" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '18px', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '0.12em', fontWeight: 700, marginBottom: '6px' }}>LAYOUT</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[{ id: 'card', label: 'Card' }, { id: 'story', label: 'Story 9:16' }].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => onConfigChange({ aspectRatio: id })}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                  background: config.aspectRatio === id ? 'var(--color-accent-dim)' : 'var(--color-surface-2)',
                  border: config.aspectRatio === id ? '1px solid rgba(0,212,255,0.4)' : '1px solid var(--color-border)',
                  color: config.aspectRatio === id ? 'var(--color-accent)' : 'var(--color-text-muted)',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '0.12em', fontWeight: 700, marginBottom: '8px' }}>CONTENT</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              ...(mode === 'deck' ? [{ key: 'showProfile', label: 'Deck Profile' }] : []),
              { key: 'showStatBars', label: 'Stat Bars' },
              { key: 'showPartThumbnails', label: 'Part Thumbnails' },
            ].map(({ key, label }) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={config[key] ?? true}
                  onChange={(e) => onConfigChange({ [key]: e.target.checked })}
                  style={{ width: '14px', height: '14px', cursor: 'pointer', accentColor: 'var(--color-accent)' }}
                />
                <span style={{ fontSize: '12px', color: 'var(--color-text)', fontWeight: 600 }}>{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <WidgetPreview
            mode={mode}
            config={config}
            combos={combos}
            beybladeCount={beybladeCount}
            currentFormat={currentFormat}
            profile={profile}
            bladerName={bladerName}
            comboIndex={comboIndex}
          />
        </div>

        <button
          onClick={onGenerate}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 900,
            fontFamily: 'var(--font-heading)',
            letterSpacing: '0.08em',
            cursor: 'pointer',
            background: 'var(--color-accent-dim)',
            border: '1px solid rgba(0,212,255,0.4)',
            color: 'var(--color-accent)',
          }}
        >
          GENERATE IMAGE
        </button>
      </div>
    </div>
  );
}

WidgetConfigPanel.propTypes = {
  mode: PropTypes.oneOf(['deck', 'combo']).isRequired,
  config: PropTypes.object.isRequired,
  combos: PropTypes.array.isRequired,
  beybladeCount: PropTypes.number.isRequired,
  currentFormat: PropTypes.object.isRequired,
  profile: PropTypes.object,
  bladerName: PropTypes.string,
  comboIndex: PropTypes.number,
  onConfigChange: PropTypes.func.isRequired,
  onGenerate: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

function App() {
  const {
    beybladeCount,
    setBeybladeCount,
    currentFormat,
    setCurrentFormat,
    beyblades,
    partsUsed,
    totalPoints,
    handlePartChange,
    handleClearAll,
    handleRandomizeAll,
    handleRandomizeSingle,
    bladerName,
    setBladerName,
    violations,
    formatUserValues,
    setFormatUserValues,
  } = useBeybladeDeck();

  const [customFormats, setCustomFormats] = useState([]);
  const [formatImportError, setFormatImportError] = useState(null);

  const handleImportFormat = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!parsed.id || !parsed.name || !Array.isArray(parsed.rules)) {
          setFormatImportError('Invalid format: must have id, name, and rules array.');
          return;
        }
        const unknownRule = parsed.rules.find(r => ![
          'noRepeatParts', 'banPart', 'allowedParts', 'allowedPartTypes',
          'pointBudget', 'requirePartType', 'requireTypeDistribution',
          'requireComboTypePairing', 'requireComboWith', 'banComboPairing',
        ].includes(r.type));
        if (unknownRule) {
          setFormatImportError(`Unknown rule type: "${unknownRule.type}"`);
          return;
        }
        setCustomFormats(prev => [...prev.filter(f => f.id !== parsed.id), parsed]);
        setCurrentFormat(parsed);
        setBeybladeCount(c => Math.max(parsed.minBeys ?? 1, Math.min(parsed.maxBeys ?? 10, c)));
        setFormatImportError(null);
      } catch {
        setFormatImportError('Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };
  const [theme, setTheme] = useState(() => localStorage.getItem('bbx-theme') || 'dark');
  const [showSupportPopup, setShowSupportPopup] = useState(false);

  useEffect(() => {
    if (shouldShowSupportPopup()) {
      setShowSupportPopup(true);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    localStorage.setItem('bbx-theme', theme);
  }, [theme]);

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);
  const [generateImagePreview, setGenerateImagePreview] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [widgetConfig, setWidgetConfig] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('bbx-widget-config')) || {
        aspectRatio: 'card',
        showProfile: true,
        showStatBars: true,
        showPartThumbnails: true,
      };
    } catch {
      return {
        aspectRatio: 'card',
        showProfile: true,
        showStatBars: true,
        showPartThumbnails: true,
      };
    }
  });
  const [showConfigPanel, setShowConfigPanel] = useState(null);

  const updateWidgetConfig = useCallback((patch) => {
    setWidgetConfig((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem('bbx-widget-config', JSON.stringify(next));
      return next;
    });
  }, []);

  const handleDownloadDeck = useCallback(async () => {
    const { aspectRatio = 'card', showProfile = true } = widgetConfig;
    const isStory = aspectRatio === 'story';
    setDownloadError(null);
    setIsDownloading(true);
    setShowConfigPanel(null);

    const container = document.createElement('div');
    container.style.cssText = isStory
      ? 'position:fixed;left:-9999px;top:0;width:540px;height:960px'
      : 'position:fixed;left:-9999px;top:0;width:480px';
    document.body.appendChild(container);
    const root = createRoot(container);
    flushSync(() => root.render(
      <ConfigurableDeckWidget
        combos={beyblades}
        beybladeCount={beybladeCount}
        format={currentFormat}
        profile={showProfile ? getDeckProfile(beyblades) : undefined}
        bladerName={showProfile ? bladerName : undefined}
        config={widgetConfig}
      />
    ));
    await waitForScreenshotReady(container);
    await domToPng(container, { backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim(), scale: 4 })
      .then((dataUrl) => {
        const slug = isStory ? 'story_deck' : 'deck';
        const filename = `beybrew_${slug}_${Date.now()}.png`;
        setGenerateImagePreview({ dataUrl, filename });
      })
      .catch((e) => setDownloadError(`Error: ${e?.message ?? String(e)}\n${navigator.userAgent}`))
      .finally(() => {
        root.unmount();
        container.remove();
        setIsDownloading(false);
      });
  }, [widgetConfig, beyblades, beybladeCount, currentFormat, bladerName]);

  const handleDownloadCombo = useCallback(async (index) => {
    const { aspectRatio = 'card' } = widgetConfig;
    const isStory = aspectRatio === 'story';
    setDownloadError(null);
    setIsDownloading(true);
    setShowConfigPanel(null);

    const container = document.createElement('div');
    container.style.cssText = isStory
      ? 'position:fixed;left:-9999px;top:0;width:540px;height:960px'
      : 'position:fixed;left:-9999px;top:0;width:320px';
    document.body.appendChild(container);
    const root = createRoot(container);
    flushSync(() => root.render(<ConfigurableComboWidget combo={beyblades[index]} config={widgetConfig} />));
    await waitForScreenshotReady(container);
    await domToPng(container, { backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim(), scale: isStory ? 4 : 3 })
      .then((dataUrl) => {
        const slug = isStory ? 'story_combo' : 'combo';
        const filename = `beybrew_${slug}${index + 1}_${Date.now()}.png`;
        setGenerateImagePreview({ dataUrl, filename });
      })
      .catch((e) => setDownloadError(`Error: ${e?.message ?? String(e)}\n${navigator.userAgent}`))
      .finally(() => {
        root.unmount();
        container.remove();
        setIsDownloading(false);
      });
  }, [widgetConfig, beyblades]);

  return (
    <div className="min-h-screen px-4 pb-12" style={{ background: 'var(--color-bg)', fontFamily: 'var(--font-body)' }}>
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(var(--color-grid) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative max-w-3xl mx-auto pt-10" style={{ zIndex: 1 }}>
        <InstallBanner />
        <OfflineReadyToast />
        {/* ── Header ── */}
        <header className="text-center mb-8">
          <div className="flex items-center">
            <div className="w-11 flex-shrink-0" />
            <div className="flex-1 min-w-0 flex items-center justify-center gap-3">
              <h1
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'clamp(2rem, 11vw, 4.5rem)',
                  letterSpacing: '0.04em',
                  color: 'var(--color-accent)',
                  lineHeight: 1,
                  margin: 0,
                }}
              >
                BEYBREW
              </h1>
            </div>
            <button
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle light/dark mode"
              className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-lg transition-colors"
              style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
            >
              {theme === 'dark' ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m8.66-9h-1M4.34 12h-1m15.07-6.36-.7.7M5.63 18.37l-.7.7m12.73 0-.7-.7M5.63 5.63l-.7-.7M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
                </svg>
              )}
            </button>
          </div>
          {currentFormat.rules?.some(r => r.type === 'pointBudget') && (
            <div className="text-xs font-bold tracking-widest mt-2" style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-body)', letterSpacing: '0.2em' }}>
              {CURRENT_PATCH}
            </div>
          )}
          <div className="mt-3 mx-auto h-px w-40" style={{ background: 'linear-gradient(90deg,transparent,var(--color-accent),transparent)' }} />
          <p className="mt-2 text-xs tracking-widest uppercase" style={{ color: 'var(--color-text-muted)' }}>
            Beyblade X Deck Builder
          </p>
        </header>

        {/* ── Config Card ── */}
        <div className="rounded-xl p-6 mb-6" style={surfaceBox}>
          <LimitedFormatPoints
            format={currentFormat}
            totalPoints={totalPoints}
            maxPoints={formatUserValues.pointBudget ?? currentFormat.rules?.find(r => r.type === 'pointBudget')?.default ?? 0}
          />

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Beyblade count */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>
                  Number of Beyblades
                </label>
                <div className="flex items-center gap-4">
                  <button
                    aria-label="Decrease"
                    onClick={() => setBeybladeCount(Math.max(currentFormat.minBeys ?? 1, beybladeCount - 1))}
                    className="w-11 h-11 rounded-lg flex items-center justify-center text-lg font-bold transition-colors"
                    style={{ background: 'var(--color-surface-2)', color: 'var(--color-accent)', border: '1px solid var(--color-border)' }}
                  >
                    −
                  </button>
                  <span className="text-2xl font-bold w-6 text-center" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-accent)' }}>
                    {beybladeCount}
                  </span>
                  <button
                    aria-label="Increase"
                    onClick={() => setBeybladeCount(Math.min(currentFormat.maxBeys ?? 10, beybladeCount + 1))}
                    className="w-11 h-11 rounded-lg flex items-center justify-center text-lg font-bold transition-colors"
                    style={{ background: 'var(--color-surface-2)', color: 'var(--color-accent)', border: '1px solid var(--color-border)' }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Format selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>
                  Format
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <select
                    value={currentFormat.id}
                    onChange={(e) => {
                      const fmt = [...BUILT_IN_FORMATS, ...customFormats].find(f => f.id === e.target.value);
                      if (!fmt) return;
                      setCurrentFormat(fmt);
                      setBeybladeCount(c => Math.max(fmt.minBeys ?? 1, Math.min(fmt.maxBeys ?? 10, c)));
                    }}
                    className="flex-1 min-w-0 py-2 px-3 rounded-lg text-sm font-semibold focus:outline-none"
                    style={{
                      background: 'var(--color-surface-2)',
                      color: 'var(--color-accent)',
                      border: '1px solid rgba(0,212,255,0.3)',
                      cursor: 'pointer',
                      minWidth: 0,
                    }}
                  >
                    {[...BUILT_IN_FORMATS, ...customFormats].map((fmt) => (
                      <option key={fmt.id} value={fmt.id}>
                        {fmt.name}{fmt.description ? ` — ${fmt.description}` : ''}
                      </option>
                    ))}
                  </select>
                  <label
                    className="py-2 px-3 rounded-lg text-sm font-semibold cursor-pointer whitespace-nowrap transition-all hover:brightness-110"
                    style={{
                      background: 'var(--color-surface-2)',
                      color: 'var(--color-text-muted)',
                      border: '1px solid var(--color-border)',
                    }}
                    title="Import a custom format JSON file"
                  >
                    Import +
                    <input type="file" accept=".json" className="hidden" onChange={handleImportFormat} />
                  </label>
                </div>
                {formatImportError && (
                  <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>{formatImportError}</p>
                )}
                {currentFormat.description && (
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)', opacity: 0.7 }}>{currentFormat.description}</p>
                )}
              </div>
            </div>{/* end grid */}

            {/* Max points input (userAdjustable pointBudget rule) */}
            {currentFormat.rules?.some(r => r.type === 'pointBudget' && r.userAdjustable) && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>
                  Maximum Points Allowed
                </label>
                <input
                  type="number"
                  min="1"
                  value={formatUserValues.pointBudget ?? currentFormat.rules.find(r => r.type === 'pointBudget').default}
                  onChange={(e) => setFormatUserValues(v => ({ ...v, pointBudget: Number(e.target.value) }))}
                  className="w-20 px-3 py-2 rounded-lg text-center text-lg font-bold focus:outline-none"
                  style={{
                    background: 'var(--color-surface-2)',
                    border: '1px solid rgba(255,140,0,0.3)',
                    color: 'var(--color-accent-2)',
                    fontFamily: 'var(--font-heading)',
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <DeckProfilePanel
          beyblades={beyblades}
          bladerName={bladerName}
          onBladerNameChange={setBladerName}
        />

        {/* ── Beyblade Cards ── */}
        <div className="space-y-4">
          {Array(beybladeCount)
            .fill(null)
            .map((_, index) => (
              <div
                key={index}
                className="beyblade-card rounded-xl p-5"
                style={{
                  ...surface,
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-card)',
                  animationDelay: `${index * 60}ms`,
                }}
              >
                {violations.filter(v => v.comboIndex === index).map((v, vi) => (
                  <div
                    key={vi}
                    className="flex items-center gap-1.5 text-xs rounded px-2 py-1 mb-3"
                    style={{
                      background: 'var(--color-danger-dim)',
                      border: '1px solid var(--color-danger-dim)',
                      color: 'var(--color-danger)',
                      fontWeight: 600,
                    }}
                  >
                    <span style={{ flexShrink: 0 }}>⚠</span>
                    {v.message}
                  </div>
                ))}
                <div className="flex items-center justify-between mb-4">
                  <h2
                    className="text-xs font-bold uppercase tracking-widest flex items-center gap-2"
                    style={{ fontFamily: 'var(--font-heading)', color: getLineColor(beyblades[index]?.blade) }}
                  >
                    <span
                      className="w-5 h-5 rounded flex items-center justify-center text-xs"
                      style={{ background: `${getLineColor(beyblades[index]?.blade)}22`, border: `1px solid ${getLineColor(beyblades[index]?.blade)}44` }}
                    >
                      {index + 1}
                    </span>
                    Beyblade
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRandomizeSingle(index, formatUserValues)}
                      title="Randomize this beyblade"
                      className="flex items-center gap-1 px-3 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all hover:brightness-110 min-h-[44px]"
                      style={{
                        background: 'var(--color-accent-dim)',
                        border: '1px solid rgba(0,212,255,0.25)',
                        color: 'var(--color-accent)',
                        fontFamily: 'var(--font-heading)',
                      }}
                    >
                      <IconRandomize small />
                      Randomize
                    </button>
                    <button
                      onClick={() => setShowConfigPanel(index)}
                      disabled={isDownloading}
                      title="Generate combo image"
                      aria-label={`Generate image for combo ${index + 1}`}
                      className="flex items-center justify-center w-11 h-11 transition-all hover:brightness-110"
                      style={{
                        background: 'var(--color-accent-dim)',
                        border: '1px solid rgba(0,212,255,0.25)',
                        borderRadius: '6px',
                        color: 'var(--color-accent)',
                        opacity: isDownloading ? 0.4 : 1,
                        cursor: isDownloading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <IconDownload />
                    </button>
                  </div>
                </div>

                <PartSelector
                  label="Blade"
                  options={BLADES}
                  value={beyblades[index]?.blade}
                  onChange={(value) => handlePartChange(index, 'blade', value)}
                  partsUsed={partsUsed}
                  slot="blade"
                  format={currentFormat}
                  showLineBadge
                  modeIndex={beyblades[index]?.bladeMode ?? 0}
                />
                {BEYBLADE_DB[beyblades[index]?.blade]?.modes && (
                  <ModeToggle
                    modes={BEYBLADE_DB[beyblades[index].blade].modes}
                    value={beyblades[index]?.bladeMode ?? 0}
                    onChange={(i) => handlePartChange(index, 'bladeMode', i)}
                  />
                )}
                {BEYBLADE_DB[beyblades[index]?.blade]?.line === 'CX' && (
                  <div
                    style={{
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      padding: '10px 10px 2px',
                      marginBottom: '8px',
                      background: 'var(--color-accent-dim)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '.6rem', textTransform: 'uppercase', letterSpacing: '.15em',
                        color: 'var(--color-accent)', marginBottom: '8px', fontWeight: 700,
                      }}
                    >
                      — CX Assembly —
                    </div>
                    <PartSelector
                      label="Lock Chip"
                      options={LOCK_CHIPS}
                      value={beyblades[index]?.lockChip}
                      onChange={(value) => handlePartChange(index, 'lockChip', value)}
                      partsUsed={partsUsed}
                      slot="lockChip"
                      format={currentFormat}
                    />
                    {BEYBLADE_DB[beyblades[index]?.blade]?.fourPartCX && (
                      <PartSelector
                        label="Over Blade"
                        options={OVER_BLADES}
                        value={beyblades[index]?.overBlade}
                        onChange={(value) => handlePartChange(index, 'overBlade', value)}
                        partsUsed={partsUsed}
                        slot="overBlade"
                        format={currentFormat}
                      />
                    )}
                    <PartSelector
                      label="Assist Blade"
                      options={ASSIST_BLADES}
                      value={beyblades[index]?.assistBlade}
                      onChange={(value) => handlePartChange(index, 'assistBlade', value)}
                      partsUsed={partsUsed}
                      slot="assistBlade"
                      format={currentFormat}
                      modeIndex={beyblades[index]?.assistBladeMode ?? 0}
                    />
                    {BEYBLADE_DB[beyblades[index]?.assistBlade]?.modes && (
                      <ModeToggle
                        modes={BEYBLADE_DB[beyblades[index].assistBlade].modes}
                        value={beyblades[index]?.assistBladeMode ?? 0}
                        onChange={(i) => handlePartChange(index, 'assistBladeMode', i)}
                      />
                    )}
                  </div>
                )}
                <PartSelector
                  label="Ratchet"
                  options={RATCHETS}
                  value={beyblades[index]?.ratchet}
                  onChange={(value) => handlePartChange(index, 'ratchet', value)}
                  partsUsed={partsUsed}
                  slot="ratchet"
                  format={currentFormat}
                  isDisabled={!!BLADE_INTEGRATED_RATCHETS[beyblades[index]?.blade]}
                />
                <PartSelector
                  label="Bit"
                  options={BLADE_INTEGRATED_RATCHETS[beyblades[index]?.blade] ? BITS.filter(b => !BIT_TO_RATCHET[b]) : BITS}
                  value={beyblades[index]?.bit}
                  onChange={(value) => handlePartChange(index, 'bit', value)}
                  partsUsed={partsUsed}
                  slot="bit"
                  format={currentFormat}
                  modeIndex={beyblades[index]?.bitMode ?? 0}
                />
                {BEYBLADE_DB[beyblades[index]?.bit]?.modes && (
                  <ModeToggle
                    modes={BEYBLADE_DB[beyblades[index].bit].modes}
                    value={beyblades[index]?.bitMode ?? 0}
                    onChange={(i) => handlePartChange(index, 'bitMode', i)}
                  />
                )}
                <Beyblade
                  blade={beyblades[index]?.blade}
                  assistBlade={beyblades[index]?.assistBlade}
                  lockChip={beyblades[index]?.lockChip}
                  overBlade={beyblades[index]?.overBlade}
                  ratchet={beyblades[index]?.ratchet}
                  bit={beyblades[index]?.bit}
                  format={currentFormat}
                  bladeMode={beyblades[index]?.bladeMode ?? 0}
                  assistBladeMode={beyblades[index]?.assistBladeMode ?? 0}
                  bitMode={beyblades[index]?.bitMode ?? 0}
                />
              </div>
            ))}
        </div>

        {/* ── Deck Lineup ── */}
        <div className="mt-6 p-4 rounded-xl" style={surfaceBox}>
          <div className="flex items-center gap-2 mb-4">
            <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.15em' }}>
              Lineup
            </p>
            {currentFormat?.rules?.length > 0 && violations.length === 0 && beyblades?.some(b => b.blade || b.ratchet || b.bit) && (
              <span
                className="text-xs font-bold px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(0,200,120,0.12)', color: 'rgba(0,200,120,0.9)', border: '1px solid rgba(0,200,120,0.25)' }}
              >
                ✓ {currentFormat.name}
              </span>
            )}
          </div>
          <DeckPreview beyblades={beyblades} beybladeCount={beybladeCount} />
        </div>

        <FormatViolations violations={violations} format={currentFormat} beyblades={beyblades} />

        {/* ── Action Buttons ── */}
        <div className="mt-6 flex flex-col items-stretch sm:flex-row sm:items-center sm:justify-center gap-3">
          <button
            onClick={(e) => {
              const btn = e.currentTarget;
              const topBefore = btn.getBoundingClientRect().top;
              flushSync(() => handleRandomizeAll(formatUserValues));
              window.scrollBy(0, btn.getBoundingClientRect().top - topBefore);
            }}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all hover:brightness-110"
            style={{
              background: 'var(--color-accent-dim)',
              border: '1px solid rgba(0,212,255,0.4)',
              color: 'var(--color-accent)',
              fontFamily: 'var(--font-heading)',
            }}
          >
            <IconRandomize />
            Randomize All
          </button>

          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all hover:brightness-110"
            style={{
              background: 'var(--color-accent-dim)',
              border: '1px solid rgba(0,212,255,0.4)',
              color: 'var(--color-accent)',
              fontFamily: 'var(--font-heading)',
            }}
          >
            <IconShare />
            Share
          </button>

          <div className="flex flex-col items-stretch sm:items-center gap-1 self-stretch sm:self-auto">
            <button
              onClick={() => setShowConfigPanel('deck')}
              disabled={isDownloading}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all hover:brightness-110 w-full sm:w-auto"
              style={{
                background: 'var(--color-accent-dim)',
                border: '1px solid rgba(0,212,255,0.4)',
                color: 'var(--color-accent)',
                fontFamily: 'var(--font-heading)',
                opacity: isDownloading ? 0.6 : 1,
                cursor: isDownloading ? 'not-allowed' : 'pointer',
              }}
            >
              <IconDownload />
              {isDownloading ? 'Generating…' : 'Generate Deck Image'}
            </button>
          </div>

          <button
            onClick={handleClearAll}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all hover:brightness-110"
            style={{
              background: 'var(--color-danger-dim)',
              border: '1px solid var(--color-danger-dim)',
              color: 'var(--color-danger)',
              fontFamily: 'var(--font-heading)',
            }}
          >
            Reset
          </button>
        </div>

        {/* ── Footer ── */}
        <footer className="mt-12 text-center space-y-1.5" style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>
          <div className="mb-3 h-px mx-auto w-24" style={{ background: 'linear-gradient(90deg,transparent,var(--color-border),transparent)' }} />

          <div
            className="mx-auto mb-4 rounded-lg px-4 py-3"
            style={{
              maxWidth: '420px',
              background: 'var(--color-accent-dim)',
              border: '1px solid rgba(0,212,255,0.25)',
            }}
          >
            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text)', margin: 0 }}>
              Missing a part?{' '}
              <a
                href="https://forms.gle/AoJ499F2xjhiqtN48"
                target="_blank"
                rel="noreferrer noopener"
                style={{ color: 'var(--color-accent)', fontWeight: 700, textDecoration: 'underline' }}
              >
                Submit it here
              </a>
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)', margin: 0, opacity: 0.8 }}>
              Submissions are highly appreciated!
            </p>
          </div>

          <div>
            <a href="/parts.html" style={{ color: 'var(--color-accent)' }}>
              Browse all parts →
            </a>
          </div>
          <div>
            Made with <span style={{ color: 'var(--color-danger)' }}>♥</span> in Davao, Philippines{' '}
            <span role="img" aria-label="Philippine flag">🇵🇭</span>
          </div>
          <div>
            Source:{' '}
            <a
              target="_blank"
              rel="noreferrer noopener"
              href="https://github.com/yujinyuz/beybrew"
              style={{ color: 'var(--color-accent)' }}
            >
              @yujinyuz/beybrew
            </a>
          </div>
          <div>
            <a
              target="_blank"
              rel="noreferrer noopener"
              href="https://www.facebook.com/bbxdc"
              style={{ color: 'var(--color-accent)' }}
            >
              Facebook
            </a>
          </div>
          <div>
            <button
              onClick={() => setShowSupportPopup(true)}
              style={{ color: 'var(--color-accent-2)', background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', textDecoration: 'underline' }}
            >
              Support BeyBrew 💙
            </button>
          </div>
        </footer>
      </div>

      {/* ── Support Popup (auto-shown) ── */}
      {showSupportPopup && (
        <SupportPopup onClose={() => setShowSupportPopup(false)} />
      )}

      {downloadError && (
        <DownloadErrorBox error={downloadError} onDismiss={() => setDownloadError(null)} />
      )}

      {showConfigPanel !== null && (
        <WidgetConfigPanel
          mode={showConfigPanel === 'deck' ? 'deck' : 'combo'}
          config={widgetConfig}
          combos={beyblades}
          beybladeCount={beybladeCount}
          currentFormat={currentFormat}
          profile={getDeckProfile(beyblades)}
          bladerName={bladerName}
          comboIndex={showConfigPanel === 'deck' ? 0 : showConfigPanel}
          onConfigChange={updateWidgetConfig}
          onGenerate={() => {
            if (showConfigPanel === 'deck') {
              handleDownloadDeck();
            } else {
              handleDownloadCombo(showConfigPanel);
            }
          }}
          onClose={() => setShowConfigPanel(null)}
        />
      )}

      {generateImagePreview && (
        <GenerateImageModal
          dataUrl={generateImagePreview.dataUrl}
          filename={generateImagePreview.filename}
          onClose={() => setGenerateImagePreview(null)}
        />
      )}

      {showShareModal && (
        <ShareModal
          beyblades={beyblades}
          beybladeCount={beybladeCount}
          currentFormat={currentFormat}
          bladerName={bladerName}
          onClose={() => setShowShareModal(false)}
        />
      )}

    </div>
  );
}

export default App;
