import PropTypes from 'prop-types';
import { BEYBLADE_DB, getLineColor, getPartImage } from '../../constants';
import { getComboStats, getComboName, STAT_DEFS } from '../../lib/comboUtils';
import ComboTypeBadges from '../ComboTypeBadges';

const DOT_BG = {
  backgroundImage: 'radial-gradient(var(--color-grid) 1px, transparent 1px)',
  backgroundSize: '24px 24px',
};

function StoryComboWidget({ combo }) {
  const { blade, overBlade, lockChip, ratchet, assistBlade } = combo || {};
  const ACCENT = getLineColor(blade);
  const isCXLine = BEYBLADE_DB[blade]?.line === 'CX';
  const overBladeImage = overBlade ? BEYBLADE_DB[overBlade]?.image : null;
  const bladeImage = getPartImage(blade, combo?.bladeMode ?? 0);
  const stats = getComboStats(combo);
  const name = getComboName(combo);
  return (
    <div style={{
      ...DOT_BG,
      background: 'var(--color-bg)',
      width: '540px',
      height: '960px',
      fontFamily: 'system-ui,-apple-system,sans-serif',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      padding: '32px 36px',
      boxSizing: 'border-box',
    }}>
      {/* Top label */}
      <div style={{ fontSize: '11px', color: 'var(--color-accent)', letterSpacing: '0.25em', fontWeight: 700, marginBottom: '24px', flexShrink: 0 }}>
        BEYBREW · COMBO
      </div>

      {/* Hero image zone */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: '0 0 280px', position: 'relative' }}>
        <div style={{ position: 'absolute', width: '240px', height: '240px', borderRadius: '50%', border: '1px solid var(--color-border)', boxShadow: `0 0 60px ${ACCENT}14` }} />
        <div style={{ position: 'absolute', width: '210px', height: '210px', borderRadius: '50%', border: '1px dashed var(--color-border)' }} />
        <div style={{ position: 'relative', width: '180px', height: '180px', flexShrink: 0 }}>
          {blade && bladeImage ? (
            <img
              src={`/images/${bladeImage}`}
              alt={blade}
              style={{ width: '180px', height: '180px', borderRadius: '50%', objectFit: 'contain', background: 'var(--color-surface)', border: `3px solid ${ACCENT}80`, boxShadow: `0 0 40px ${ACCENT}22` }}
            />
          ) : (
            <div style={{ width: '180px', height: '180px', borderRadius: '50%', background: 'var(--color-surface)', border: `3px solid ${ACCENT}80` }} />
          )}
          {isCXLine && overBladeImage && (
            <img
              src={`/images/${overBladeImage}`}
              alt={overBlade}
              style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '65%', height: '65%', objectFit: 'contain' }}
            />
          )}
          {isCXLine && lockChip && BEYBLADE_DB[lockChip]?.image && (
            <img
              src={`/images/${BEYBLADE_DB[lockChip].image}`}
              alt={lockChip}
              style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '38%', height: '38%', objectFit: 'contain' }}
            />
          )}
        </div>
      </div>

      {/* Parts strip */}
      {(ratchet || assistBlade || combo?.bit) && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px', flexShrink: 0 }}>
          {[
            ...(isCXLine && assistBlade ? [{ part: assistBlade, modeIndex: combo?.assistBladeMode ?? 0 }] : []),
            { part: ratchet, modeIndex: 0 },
            { part: combo?.bit, modeIndex: combo?.bitMode ?? 0 },
          ].filter(({ part }) => part && BEYBLADE_DB[part]?.image).map(({ part, modeIndex }) => {
            const image = getPartImage(part, modeIndex);
            return (
            <div key={part} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--color-surface)', border: `1px solid ${ACCENT}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={`/images/${image}`} alt={part} style={{ width: '52px', height: '52px', objectFit: 'contain' }} />
              </div>
              <span style={{ fontSize: '7px', color: 'var(--color-text-muted)', textAlign: 'center', maxWidth: '80px', letterSpacing: '0.05em' }}>{part}</span>
            </div>
            );
          })}
        </div>
      )}

      {/* Divider */}
      <div style={{ height: '1px', background: `linear-gradient(90deg,transparent,${ACCENT}4d,transparent)`, margin: '20px 0', flexShrink: 0 }} />

      {/* Combo name */}
      <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--color-text)', lineHeight: 1.1, letterSpacing: '0.02em', marginBottom: '10px', flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {name || '—'}
      </div>

      {/* Type tags */}
      <div style={{ marginBottom: '24px', flexShrink: 0 }}>
        <ComboTypeBadges blade={blade} bit={combo?.bit} size={20} />
      </div>

      {/* Stat bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flexShrink: 0 }}>
        {STAT_DEFS.map(({ key, label, gradient, color, limit }) => {
          const value = stats[key] || 0;
          const pct = Math.min(100, value / limit);
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '0.12em', width: '80px', flexShrink: 0 }}>{label}</span>
              <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: 'var(--color-stat-track)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: gradient, borderRadius: '3px' }} />
              </div>
              <span style={{ fontSize: '13px', color, fontWeight: 700, width: '28px', textAlign: 'right' }}>{value}</span>
            </div>
          );
        })}
      </div>
      <div style={{ flex: 1 }} />

      {/* Watermark */}
      <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,transparent,var(--color-border))' }} />
        <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '0.18em', fontWeight: 600 }}>BEYBLADEBREW.COM</span>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,var(--color-border),transparent)' }} />
      </div>
    </div>
  );
}

StoryComboWidget.propTypes = { combo: PropTypes.object };

export default StoryComboWidget;
