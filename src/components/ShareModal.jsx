import { useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { buildShareUrl, buildEmbedUrl } from '../lib/shareUrl';

const DEFAULT_CONFIG = {
  aspectRatio: 'card',
  showProfile: true,
  showStatBars: true,
  showPartThumbnails: true,
};

function calcEmbedHeight(scope, aspectRatio, beybladeCount) {
  if (aspectRatio === 'story') return 960;
  if (scope === 'combo') return 280;
  return 130 + beybladeCount * 80;
}

const surfaceStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '16px',
  boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
};

function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <button
      onClick={handleCopy}
      style={{
        padding: '6px 14px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 700,
        cursor: 'pointer',
        fontFamily: 'var(--font-heading)',
        letterSpacing: '0.08em',
        background: copied ? 'rgba(0,230,118,0.15)' : 'var(--color-accent-dim)',
        border: copied ? '1px solid rgba(0,230,118,0.4)' : '1px solid rgba(0,212,255,0.4)',
        color: copied ? 'var(--color-stat-def)' : 'var(--color-accent)',
        transition: 'all 0.2s',
      }}
    >
      {copied ? 'Copied!' : label}
    </button>
  );
}

CopyButton.propTypes = {
  text: PropTypes.string.isRequired,
  label: PropTypes.string,
};

function ShareModal({ beyblades, beybladeCount, currentFormat, bladerName, onClose }) {
  const [activeTab, setActiveTab] = useState('share');
  const [scope, setScope] = useState('deck');
  const [comboIndex, setComboIndex] = useState(0);
  const [embedConfig, setEmbedConfig] = useState(DEFAULT_CONFIG);

  useEffect(() => {
    if (comboIndex >= beybladeCount) {
      setComboIndex(Math.max(0, beybladeCount - 1));
    }
  }, [beybladeCount, comboIndex]);

  const updateEmbedConfig = useCallback((patch) => setEmbedConfig((prev) => ({ ...prev, ...patch })), []);

  const shareUrl = buildShareUrl(beyblades, beybladeCount, currentFormat?.id, bladerName);
  const embedUrl = buildEmbedUrl(beyblades, beybladeCount, currentFormat?.id, scope, embedConfig, comboIndex);
  const embedHeight = calcEmbedHeight(scope, embedConfig.aspectRatio, beybladeCount);
  const iframeSnippet = `<iframe\n  src="${embedUrl}"\n  width="100%" height="${embedHeight}"\n  frameborder="0" style="border:none">\n</iframe>`;

  const tabStyle = (tab) => ({
    flex: 1,
    padding: '10px',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    fontFamily: 'var(--font-heading)',
    cursor: 'pointer',
    border: 'none',
    borderRadius: '8px',
    background: activeTab === tab ? 'var(--color-accent-dim)' : 'transparent',
    color: activeTab === tab ? 'var(--color-accent)' : 'var(--color-text-muted)',
    transition: 'all 0.15s',
  });

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '16px', overflowY: 'auto' }}
      onClick={onClose}
    >
      <div style={{ ...surfaceStyle, width: '100%', maxWidth: '520px', padding: '24px', maxHeight: 'calc(100dvh - 32px)', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', fontWeight: 900, letterSpacing: '0.08em', color: 'var(--color-accent)' }}>SHARE DECK</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '18px', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: 'flex', gap: '4px', background: 'var(--color-surface-2)', borderRadius: '10px', padding: '4px', marginBottom: '20px' }}>
          <button style={tabStyle('share')} onClick={() => setActiveTab('share')}>SHARE LINK</button>
          <button style={tabStyle('embed')} onClick={() => setActiveTab('embed')}>EMBED</button>
        </div>

        {activeTab === 'share' ? (
          <div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>Share this link to let others view your deck.</p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                readOnly
                value={shareUrl}
                style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', fontSize: '11px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              />
              <CopyButton text={shareUrl} />
            </div>
          </div>
        ) : null}

        {activeTab === 'embed' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '0.12em', marginBottom: '6px', fontWeight: 700 }}>CONTENT</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[{ id: 'deck', label: 'Full Deck' }, { id: 'combo', label: 'Single Combo' }].map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setScope(id)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-heading)',
                      letterSpacing: '0.06em',
                      cursor: 'pointer',
                      background: scope === id ? 'var(--color-accent-dim)' : 'var(--color-surface-2)',
                      border: scope === id ? '1px solid rgba(0,212,255,0.4)' : '1px solid var(--color-border)',
                      color: scope === id ? 'var(--color-accent)' : 'var(--color-text-muted)',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {scope === 'combo' ? (
              <div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '0.12em', marginBottom: '6px', fontWeight: 700 }}>COMBO</div>
                <select
                  value={comboIndex}
                  onChange={(e) => setComboIndex(Number(e.target.value))}
                  style={{ padding: '7px 10px', borderRadius: '8px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', fontSize: '12px', cursor: 'pointer' }}
                >
                  {Array(beybladeCount).fill(null).map((_, index) => (
                    <option key={index} value={index}>Combo {index + 1}</option>
                  ))}
                </select>
              </div>
            ) : null}

            <div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '0.12em', marginBottom: '6px', fontWeight: 700 }}>LAYOUT</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[{ id: 'card', label: 'Card' }, { id: 'story', label: 'Story 9:16' }].map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => updateEmbedConfig({ aspectRatio: id })}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-heading)',
                      letterSpacing: '0.06em',
                      cursor: 'pointer',
                      background: embedConfig.aspectRatio === id ? 'var(--color-accent-dim)' : 'var(--color-surface-2)',
                      border: embedConfig.aspectRatio === id ? '1px solid rgba(0,212,255,0.4)' : '1px solid var(--color-border)',
                      color: embedConfig.aspectRatio === id ? 'var(--color-accent)' : 'var(--color-text-muted)',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '0.12em', marginBottom: '8px', fontWeight: 700 }}>OPTIONS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  ...(scope === 'deck' ? [{ key: 'showProfile', label: 'Deck Profile' }] : []),
                  { key: 'showStatBars', label: 'Stat Bars' },
                  { key: 'showPartThumbnails', label: 'Part Thumbnails' },
                ].map(({ key, label }) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={embedConfig[key] ?? true}
                      onChange={(e) => updateEmbedConfig({ [key]: e.target.checked })}
                      style={{ width: '14px', height: '14px', cursor: 'pointer', accentColor: 'var(--color-accent)' }}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--color-text)', fontWeight: 600 }}>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '0.12em', marginBottom: '6px', fontWeight: 700 }}>PREVIEW</div>
              <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                <iframe
                  key={embedUrl}
                  src={embedUrl}
                  style={{ width: '100%', height: `${Math.min(embedHeight, 400)}px`, border: 'none', display: 'block' }}
                  title="Widget preview"
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '0.12em', fontWeight: 700 }}>EMBED CODE</div>
                <CopyButton text={iframeSnippet} label="Copy Code" />
              </div>
              <pre style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '10px 12px', fontSize: '10px', color: 'var(--color-text-muted)', fontFamily: 'monospace', overflowX: 'auto', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {iframeSnippet}
              </pre>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

ShareModal.propTypes = {
  beyblades: PropTypes.array.isRequired,
  beybladeCount: PropTypes.number.isRequired,
  currentFormat: PropTypes.object.isRequired,
  bladerName: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};

export default ShareModal;
