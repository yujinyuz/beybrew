import { useCallback, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import PartSelector from './PartSelector';
import ModeToggle from './ModeToggle';
import Beyblade from './Beyblade';
import ComboSummaryList from './components/ComboSummaryList';
import DeckProfilePanel from './components/DeckProfilePanel';
import SupportPopup from './components/SupportPopup';
import ShareModal from './components/ShareModal';
import InstallBanner from './components/InstallBanner';
import OfflineReadyToast from './components/OfflineReadyToast';
import DeckWidget from './components/widgets/DeckWidget';
import DeckPreview from './components/DeckPreview';
import SingleComboWidget from './components/widgets/SingleComboWidget';
import CompactListWidget from './components/widgets/CompactListWidget';
import CompactImageWidget from './components/widgets/CompactImageWidget';
import StoryComboWidget from './components/widgets/StoryComboWidget';
import StoryDeckWidget from './components/widgets/StoryDeckWidget';
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
  LIMITED_FORMAT,
  STANDARD_FORMAT,
  DEFAULT_LIMITED_MAX_POINTS,
  BEYBLADE_DB,
  CURRENT_PATCH,
} from './constants';

import { domToPng } from 'modern-screenshot';
import download from 'downloadjs';

const surface = { background: 'var(--color-surface)', border: '1px solid var(--color-border)' };
const surfaceBox = { ...surface, borderRadius: '12px', boxShadow: 'var(--shadow-card)' };

function LimitedFormatPoints({ format, totalPoints, maximumPointsLimited }) {
  if (format !== LIMITED_FORMAT) return null;
  const over = totalPoints > maximumPointsLimited;
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
          color: over ? '#ff4455' : 'var(--color-accent)',
          textShadow: over ? '0 0 12px rgba(255,68,85,0.5)' : '0 0 12px rgba(0,212,255,0.4)',
        }}
      >
        {totalPoints}/{maximumPointsLimited}
      </span>
      {over && (
        <span className="text-xs font-semibold" style={{ color: '#ff4455' }}>
          OVER LIMIT
        </span>
      )}
    </div>
  );
}

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

function IconDownload() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" />
    </svg>
  );
}

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
    handleRandomizeAll,
    handleRandomizeSingle,
    bladerName,
    setBladerName,
  } = useBeybladeDeck();

  const [maximumPointsLimited, setMaximumPointsLimited] = useState(DEFAULT_LIMITED_MAX_POINTS);
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
  const [showShareModal, setShowShareModal] = useState(false);
  const [deckExportStyle, setDeckExportStyle] = useState('deck');
  const [showDeckStyleMenu, setShowDeckStyleMenu] = useState(false);
  const [comboExportStyle, setComboExportStyle] = useState('single');
  const [showComboStyleMenu, setShowComboStyleMenu] = useState(null);

  useEffect(() => {
    if (!downloadError) return;
    const t = setTimeout(() => setDownloadError(null), 4000);
    return () => clearTimeout(t);
  }, [downloadError]);

  useEffect(() => {
    if (!showDeckStyleMenu && showComboStyleMenu === null) return;
    const close = () => { setShowDeckStyleMenu(false); setShowComboStyleMenu(null); };
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [showDeckStyleMenu, showComboStyleMenu]);

  const handleDownloadDeck = useCallback((style) => {
    const resolvedStyle = style ?? deckExportStyle;
    setDeckExportStyle(resolvedStyle);
    setIsDownloading(true);

    const isStory = resolvedStyle === 'story';
    const container = document.createElement('div');
    container.style.cssText = isStory
      ? 'position:fixed;left:-9999px;top:0;width:540px;height:960px'
      : 'position:fixed;left:-9999px;top:0;width:480px';
    document.body.appendChild(container);
    const root = createRoot(container);
    flushSync(() => root.render(
      resolvedStyle === 'story'
        ? <StoryDeckWidget combos={beyblades} beybladeCount={beybladeCount} format={currentFormat} />
        : resolvedStyle === 'compact'
          ? <CompactListWidget combos={beyblades} beybladeCount={beybladeCount} format={currentFormat} />
          : resolvedStyle === 'compact-image'
            ? <CompactImageWidget combos={beyblades} beybladeCount={beybladeCount} format={currentFormat} />
            : <DeckWidget
                combos={beyblades}
                beybladeCount={beybladeCount}
                format={currentFormat}
                profile={resolvedStyle === 'deck-profile' ? getDeckProfile(beyblades) : undefined}
                bladerName={resolvedStyle === 'deck-profile' ? bladerName : undefined}
              />
    ));
    domToPng(container, { backgroundColor: '#080c18', scale: isStory ? 4 : 3 })
      .then((dataUrl) => {
        const filename = isStory
          ? `beybrew_story_deck_${Date.now()}.png`
          : `beybrew_deck_${Date.now()}.png`;
        download(dataUrl, filename, 'image/png');
      })
      .catch(() => setDownloadError('Download failed. Try again.'))
      .finally(() => {
        root.unmount();
        container.remove();
        setIsDownloading(false);
      });
  }, [deckExportStyle, beyblades, beybladeCount, currentFormat, bladerName]);

  const handleDownloadCombo = useCallback((index, style) => {
    const resolvedStyle = style ?? comboExportStyle;
    setComboExportStyle(resolvedStyle);
    setIsDownloading(true);

    const isStory = resolvedStyle === 'story';
    const container = document.createElement('div');
    container.style.cssText = isStory
      ? 'position:fixed;left:-9999px;top:0;width:540px;height:960px'
      : 'position:fixed;left:-9999px;top:0;width:320px';
    document.body.appendChild(container);
    const root = createRoot(container);
    flushSync(() => root.render(
      resolvedStyle === 'story'
        ? <StoryComboWidget combo={beyblades[index]} />
        : resolvedStyle === 'single'
          ? <SingleComboWidget combo={beyblades[index]} />
          : <CompactImageWidget combos={[beyblades[index]]} beybladeCount={1} format={currentFormat} />
    ));
    domToPng(container, { backgroundColor: '#080c18', scale: isStory ? 4 : 3 })
      .then((dataUrl) => {
        const filename = isStory
          ? `beybrew_story_combo${index + 1}_${Date.now()}.png`
          : `beybrew_combo${index + 1}_${Date.now()}.png`;
        download(dataUrl, filename, 'image/png');
      })
      .catch(() => setDownloadError('Download failed. Try again.'))
      .finally(() => {
        root.unmount();
        container.remove();
        setIsDownloading(false);
      });
  }, [comboExportStyle, beyblades, currentFormat]);

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
        <header className="relative text-center mb-8">
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(2.8rem, 9vw, 4.5rem)',
              letterSpacing: '0.04em',
              background: 'var(--gradient-title)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1,
              margin: 0,
            }}
          >
            BEYBREW
          </h1>
          {currentFormat === LIMITED_FORMAT && (
            <div className="text-xs font-bold tracking-widest mt-2" style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-body)', letterSpacing: '0.2em' }}>
              {CURRENT_PATCH}
            </div>
          )}
          <div className="mt-3 mx-auto h-px w-40" style={{ background: 'linear-gradient(90deg,transparent,var(--color-accent),transparent)' }} />
          <p className="mt-2 text-xs tracking-widest uppercase" style={{ color: 'var(--color-text-muted)' }}>
            Beyblade X Deck Builder
          </p>
          <button
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle light/dark mode"
            className="absolute top-0 right-0 w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
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
        </header>

        {/* ── Config Card ── */}
        <div className="rounded-xl p-6 mb-6" style={surfaceBox}>
          <LimitedFormatPoints
            format={currentFormat}
            totalPoints={totalPoints}
            maximumPointsLimited={maximumPointsLimited}
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
                  onClick={() => setBeybladeCount(Math.max(1, beybladeCount - 1))}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-lg font-bold transition-colors"
                  style={{ background: 'var(--color-surface-2)', color: 'var(--color-accent)', border: '1px solid var(--color-border)' }}
                >
                  −
                </button>
                <span className="text-2xl font-bold w-6 text-center" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-accent)' }}>
                  {beybladeCount}
                </span>
                <button
                  aria-label="Increase"
                  onClick={() => setBeybladeCount(Math.min(10, beybladeCount + 1))}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-lg font-bold transition-colors"
                  style={{ background: 'var(--color-surface-2)', color: 'var(--color-accent)', border: '1px solid var(--color-border)' }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Format toggle */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>
                Format
              </label>
              <div className="flex gap-2">
                {[
                  { value: STANDARD_FORMAT, label: 'Standard', desc: 'No repeating parts' },
                  { value: LIMITED_FORMAT, label: 'Limited', desc: 'Point system', accent: 'accent-2' },
                ].map(({ value, label, desc, accent }) => {
                  const active = currentFormat === value;
                  const isAlt = accent === 'accent-2';
                  return (
                    <button
                      key={value}
                      onClick={() => setCurrentFormat(value)}
                      className="flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold text-left transition-all"
                      style={{
                        background: active ? (isAlt ? 'var(--color-accent-2-dim)' : 'var(--color-accent-dim)') : 'var(--color-surface-2)',
                        color: active ? (isAlt ? 'var(--color-accent-2)' : 'var(--color-accent)') : 'var(--color-text-muted)',
                        border: active
                          ? `1px solid ${isAlt ? 'rgba(255,140,0,0.4)' : 'rgba(0,212,255,0.4)'}`
                          : '1px solid var(--color-border)',
                        boxShadow: active ? `0 0 14px ${isAlt ? 'rgba(255,140,0,0.08)' : 'rgba(0,212,255,0.08)'}` : 'none',
                      }}
                    >
                      <div>{label}</div>
                      <div className="text-xs font-normal mt-0.5" style={{ opacity: 0.65 }}>{desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
            </div>{/* end grid */}

            {/* Max points (Limited only) */}
            {currentFormat === LIMITED_FORMAT && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>
                  Maximum Points Allowed
                </label>
                <input
                  type="number"
                  min="1"
                  value={maximumPointsLimited}
                  onChange={(e) => setMaximumPointsLimited(Number(e.target.value))}
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
                  borderLeft: '3px solid var(--color-accent)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-card)',
                  animationDelay: `${index * 60}ms`,
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2
                    className="text-xs font-bold uppercase tracking-widest flex items-center gap-2"
                    style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-accent)' }}
                  >
                    <span
                      className="w-5 h-5 rounded flex items-center justify-center text-xs"
                      style={{ background: 'var(--color-accent-dim)', border: '1px solid rgba(0,212,255,0.25)' }}
                    >
                      {index + 1}
                    </span>
                    Beyblade
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRandomizeSingle(index, maximumPointsLimited)}
                      title="Randomize this beyblade"
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider transition-all hover:brightness-110"
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
                    <div style={{ position: 'relative', display: 'inline-flex' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleDownloadCombo(index)}
                        disabled={isDownloading}
                        title="Download this combo"
                        aria-label={`Download combo ${index + 1}`}
                        className="flex items-center justify-center w-7 h-7 transition-all hover:brightness-110"
                        style={{
                          background: 'var(--color-accent-dim)',
                          border: '1px solid rgba(0,212,255,0.25)',
                          borderRight: 'none',
                          borderRadius: '6px 0 0 6px',
                          color: 'var(--color-accent)',
                          opacity: isDownloading ? 0.4 : 1,
                          cursor: isDownloading ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <IconDownload />
                      </button>
                      <button
                        onClick={() => setShowComboStyleMenu((v) => v === index ? null : index)}
                        disabled={isDownloading}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          padding: '0 4px', height: '28px',
                          background: 'var(--color-accent-dim)',
                          border: '1px solid rgba(0,212,255,0.25)',
                          borderLeft: '1px solid rgba(0,212,255,0.15)',
                          borderRadius: '0 6px 6px 0',
                          color: 'var(--color-accent)',
                          cursor: isDownloading ? 'not-allowed' : 'pointer',
                          opacity: isDownloading ? 0.4 : 1,
                        }}
                        aria-label="Choose combo export style"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d={showComboStyleMenu === index ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} />
                        </svg>
                      </button>
                      {showComboStyleMenu === index && (
                        <div style={{
                          position: 'absolute', top: 'calc(100% + 4px)', right: 0,
                          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                          borderRadius: '8px', minWidth: '180px', overflow: 'hidden',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.6)', zIndex: 20,
                        }}>
                          {[
                            { id: 'single',        label: 'Single Combo',       desc: 'Large image, full bars' },
                            { id: 'compact-image', label: 'Compact with Image', desc: 'Small image + bars' },
                            { id: 'story',         label: 'Story (9:16)',        desc: 'Instagram / Facebook Stories' },
                          ].map(({ id, label, desc }) => (
                            <button key={id}
                              onClick={() => { setShowComboStyleMenu(null); handleDownloadCombo(index, id); }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                width: '100%', padding: '9px 14px', textAlign: 'left',
                                background: comboExportStyle === id ? 'var(--color-accent-dim)' : 'transparent',
                                borderLeft: comboExportStyle === id ? '2px solid var(--color-accent)' : '2px solid transparent',
                                border: 'none', cursor: 'pointer',
                              }}
                            >
                              <div>
                                <div style={{ fontSize: '12px', color: comboExportStyle === id ? 'var(--color-accent)' : 'var(--color-text)', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>{label}</div>
                                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{desc}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <PartSelector
                  label="Blade"
                  options={BLADES}
                  value={beyblades[index]?.blade}
                  onChange={(value) => handlePartChange(index, 'blade', value)}
                  partsUsed={partsUsed}
                  currentFormat={currentFormat}
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
                      border: '1px solid rgba(0,212,255,0.25)',
                      borderRadius: '8px',
                      padding: '10px 10px 2px',
                      marginBottom: '8px',
                      background: 'rgba(0,212,255,0.05)',
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
                      currentFormat={currentFormat}
                    />
                    {BEYBLADE_DB[beyblades[index]?.blade]?.fourPartCX && (
                      <PartSelector
                        label="Over Blade"
                        options={OVER_BLADES}
                        value={beyblades[index]?.overBlade}
                        onChange={(value) => handlePartChange(index, 'overBlade', value)}
                        partsUsed={partsUsed}
                        currentFormat={currentFormat}
                      />
                    )}
                    <PartSelector
                      label="Assist Blade"
                      options={ASSIST_BLADES}
                      value={beyblades[index]?.assistBlade}
                      onChange={(value) => handlePartChange(index, 'assistBlade', value)}
                      partsUsed={partsUsed}
                      currentFormat={currentFormat}
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
                  currentFormat={currentFormat}
                />
                <PartSelector
                  label="Bit"
                  options={BITS}
                  value={beyblades[index]?.bit}
                  onChange={(value) => handlePartChange(index, 'bit', value)}
                  partsUsed={partsUsed}
                  currentFormat={currentFormat}
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
          <p className="text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.15em' }}>
            Lineup
          </p>
          <DeckPreview beyblades={beyblades} beybladeCount={beybladeCount} />
        </div>

        {/* ── Action Buttons ── */}
        <div className="mt-6 flex justify-center gap-3 flex-wrap">
          <button
            onClick={() => handleRandomizeAll(maximumPointsLimited)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all hover:brightness-110"
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
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all hover:brightness-110"
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

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{ position: 'relative', display: 'inline-flex', borderRadius: '8px', overflow: 'visible' }} onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => handleDownloadDeck()}
                disabled={isDownloading}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold uppercase tracking-wider transition-all hover:brightness-110"
                style={{
                  background: 'var(--color-accent-dim)',
                  border: '1px solid rgba(0,212,255,0.4)',
                  borderRight: 'none',
                  borderRadius: '8px 0 0 8px',
                  color: 'var(--color-accent)',
                  fontFamily: 'var(--font-heading)',
                  opacity: isDownloading ? 0.6 : 1,
                  cursor: isDownloading ? 'not-allowed' : 'pointer',
                }}
              >
                <IconDownload />
                {isDownloading ? 'Generating…' : 'Download Deck'}
              </button>
              <button
                onClick={() => setShowDeckStyleMenu((v) => !v)}
                disabled={isDownloading}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 10px',
                  background: 'var(--color-accent-dim)',
                  border: '1px solid rgba(0,212,255,0.4)',
                  borderLeft: '1px solid rgba(0,212,255,0.2)',
                  borderRadius: '0 8px 8px 0',
                  color: 'var(--color-accent)',
                  cursor: isDownloading ? 'not-allowed' : 'pointer',
                  opacity: isDownloading ? 0.6 : 1,
                }}
                aria-label="Choose download style"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d={showDeckStyleMenu ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} />
                </svg>
              </button>
              {showDeckStyleMenu && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 4px)', left: 0,
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                  borderRadius: '8px', minWidth: '200px', overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.6)', zIndex: 20,
                }}>
                  {[
                    { id: 'deck',          label: 'Deck Card',           desc: 'All combos, images, bars' },
                    { id: 'deck-profile',  label: 'Deck + Profile',      desc: 'Includes archetype & blader name' },
                    { id: 'compact',       label: 'Compact List',        desc: 'Names only' },
                    { id: 'compact-image', label: 'Compact with Image',  desc: 'Small image + bars' },
                    { id: 'story',         label: 'Story (9:16)',         desc: 'Instagram / Facebook Stories' },
                  ].map(({ id, label, desc }) => (
                    <button key={id}
                      onClick={() => { setShowDeckStyleMenu(false); handleDownloadDeck(id); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        width: '100%', padding: '9px 14px', textAlign: 'left',
                        background: deckExportStyle === id ? 'var(--color-accent-dim)' : 'transparent',
                        borderLeft: deckExportStyle === id ? '2px solid var(--color-accent)' : '2px solid transparent',
                        border: 'none', cursor: 'pointer',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '12px', color: deckExportStyle === id ? 'var(--color-accent)' : 'var(--color-text)', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>{label}</div>
                        <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{desc}</div>
                      </div>
                      {deckExportStyle === id && (
                        <svg style={{ marginLeft: 'auto', flexShrink: 0 }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {downloadError && <span className="text-xs" style={{ color: '#ff4455' }}>{downloadError}</span>}
          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="mt-12 text-center space-y-1.5" style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>
          <div className="mb-3 h-px mx-auto w-24" style={{ background: 'linear-gradient(90deg,transparent,var(--color-border),transparent)' }} />
          <div>
            Made with <span style={{ color: '#ff4455' }}>♥</span> in Davao, Philippines{' '}
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
