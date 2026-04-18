import { useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { buildShareUrl, buildEmbedUrl } from '../lib/shareUrl';

const WIDGET_OPTIONS = [
  { id: 'deck',          label: 'Deck Card',          desc: 'All combos, images, stat bars' },
  { id: 'single',        label: 'Single Combo',        desc: 'One combo, large image' },
  { id: 'compact',       label: 'Compact List',         desc: 'Names only, minimal' },
  { id: 'compact-image', label: 'Compact with Image',   desc: 'Small image + condensed bars' },
];

function calcEmbedHeight(widgetType, beybladeCount) {
  switch (widgetType) {
    case 'single': return 220;
    case 'compact': return 75 + beybladeCount * 32;
    case 'compact-image': return 75 + beybladeCount * 36;
    default: return 130 + beybladeCount * 72; // deck
  }
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
        padding: '6px 14px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
        cursor: 'pointer', fontFamily: 'var(--font-heading)', letterSpacing: '0.08em',
        background: copied ? 'rgba(0,230,118,0.15)' : 'var(--color-accent-dim)',
        border: copied ? '1px solid rgba(0,230,118,0.4)' : '1px solid rgba(0,212,255,0.4)',
        color: copied ? '#00e676' : 'var(--color-accent)',
        transition: 'all 0.2s',
      }}
    >
      {copied ? 'Copied!' : label}
    </button>
  );
}
CopyButton.propTypes = { text: PropTypes.string.isRequired, label: PropTypes.string };

function ShareModal({ beyblades, beybladeCount, currentFormat, bladerName, onClose }) {
  const [activeTab, setActiveTab] = useState('share');
  const [widgetType, setWidgetType] = useState('deck');
  const [comboIndex, setComboIndex] = useState(0);

  useEffect(() => {
    if (comboIndex >= beybladeCount) setComboIndex(Math.max(0, beybladeCount - 1));
  }, [beybladeCount, comboIndex]);

  const shareUrl = buildShareUrl(beyblades, beybladeCount, currentFormat, bladerName);
  const embedUrl = buildEmbedUrl(beyblades, beybladeCount, currentFormat, widgetType, comboIndex);
  const embedHeight = calcEmbedHeight(widgetType, widgetType === 'single' ? 1 : beybladeCount);
  const iframeSnippet = `<iframe\n  src="${embedUrl}"\n  width="100%" height="${embedHeight}"\n  frameborder="0" style="border:none">\n</iframe>`;

  const tabStyle = (tab) => ({
    flex: 1, padding: '10px', fontSize: '12px', fontWeight: 700,
    letterSpacing: '0.08em', fontFamily: 'var(--font-heading)',
    cursor: 'pointer', border: 'none', borderRadius: '8px',
    background: activeTab === tab ? 'var(--color-accent-dim)' : 'transparent',
    color: activeTab === tab ? 'var(--color-accent)' : 'var(--color-text-muted)',
    transition: 'all 0.15s',
  });

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={onClose}
    >
      <div style={{ ...surfaceStyle, width: '100%', maxWidth: '520px', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', fontWeight: 900, letterSpacing: '0.08em', color: 'var(--color-accent)' }}>SHARE DECK</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '18px', lineHeight: 1 }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--color-surface-2)', borderRadius: '10px', padding: '4px', marginBottom: '20px' }}>
          <button style={tabStyle('share')} onClick={() => setActiveTab('share')}>SHARE LINK</button>
          <button style={tabStyle('embed')} onClick={() => setActiveTab('embed')}>EMBED</button>
        </div>

        {activeTab === 'share' && (
          <div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>Share this link to let others view your deck.</p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                readOnly value={shareUrl}
                style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', fontSize: '11px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              />
              <CopyButton text={shareUrl} />
            </div>
          </div>
        )}

        {activeTab === 'embed' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Widget type picker */}
            <div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '0.12em', marginBottom: '8px', fontWeight: 700 }}>WIDGET STYLE</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {WIDGET_OPTIONS.map(({ id, label, desc }) => {
                  const active = widgetType === id;
                  return (
                    <button key={id} onClick={() => setWidgetType(id)}
                      style={{
                        padding: '10px 12px', borderRadius: '8px', textAlign: 'left', cursor: 'pointer',
                        background: active ? 'var(--color-accent-dim)' : 'var(--color-surface-2)',
                        border: active ? '1px solid rgba(0,212,255,0.4)' : '1px solid var(--color-border)',
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: 700, color: active ? 'var(--color-accent)' : 'var(--color-text)' }}>{label}</div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Combo picker (single only) */}
            {widgetType === 'single' && (
              <div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '0.12em', marginBottom: '6px', fontWeight: 700 }}>COMBO</div>
                <select
                  value={comboIndex}
                  onChange={(e) => setComboIndex(Number(e.target.value))}
                  style={{ padding: '7px 10px', borderRadius: '8px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', fontSize: '12px', cursor: 'pointer' }}
                >
                  {Array(beybladeCount).fill(null).map((_, i) => (
                    <option key={i} value={i}>Combo {i + 1}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Live preview */}
            <div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '0.12em', marginBottom: '6px', fontWeight: 700 }}>PREVIEW</div>
              <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-border)', background: '#080c18' }}>
                <iframe
                  key={embedUrl}
                  src={embedUrl}
                  style={{ width: '100%', height: `${embedHeight}px`, border: 'none', display: 'block' }}
                  title="Widget preview"
                />
              </div>
            </div>

            {/* Code snippet */}
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
        )}
      </div>
    </div>
  );
}

ShareModal.propTypes = {
  beyblades: PropTypes.array.isRequired,
  beybladeCount: PropTypes.number.isRequired,
  currentFormat: PropTypes.string.isRequired,
  bladerName: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};

export default ShareModal;
