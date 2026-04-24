import PropTypes from 'prop-types';
import { BEYBLADE_DB, getLineColor, getPartImage } from '../../constants';
import { getComboStats, getComboName, STAT_DEFS } from '../../lib/comboUtils';
import ComboTypeBadges from '../ComboTypeBadges';

const DOT_BG = {
  backgroundImage: 'radial-gradient(var(--color-grid) 1px, transparent 1px)',
  backgroundSize: '20px 20px',
};

function SingleComboWidget({ combo, hideFooter }) {
  const { blade, overBlade, lockChip, ratchet, assistBlade } = combo || {};
  const ACCENT = getLineColor(blade);
  const isCXLine = BEYBLADE_DB[blade]?.line === 'CX';
  const overBladeImage = overBlade ? BEYBLADE_DB[overBlade]?.image : null;
  const bladeImage = getPartImage(blade, combo?.bladeMode ?? 0);
  const stats = getComboStats(combo);
  const name = getComboName(combo);
  return (
    <div style={{ ...DOT_BG, background: 'var(--color-bg)', borderRadius: '14px', border: `1px solid ${ACCENT}33`, borderLeft: `3px solid ${ACCENT}`, padding: '18px', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
      <div style={{ fontSize: '6.5px', color: 'var(--color-accent)', letterSpacing: '0.25em', fontWeight: 700, marginBottom: '12px' }}>BEYBREW · COMBO</div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div style={{ position: 'relative', width: '60px', height: '60px', flexShrink: 0 }}>
          {blade && bladeImage && (
            <img src={`/images/${bladeImage}`} alt={blade}
              style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'contain', background: 'var(--color-surface)', border: `2px solid ${ACCENT}80` }}
            />
          )}
          {isCXLine && overBladeImage && (
            <img src={`/images/${overBladeImage}`} alt={overBlade}
              style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '65%', height: '65%', objectFit: 'contain' }}
            />
          )}
          {isCXLine && lockChip && BEYBLADE_DB[lockChip]?.image && (
            <img src={`/images/${BEYBLADE_DB[lockChip].image}`} alt={lockChip}
              style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '38%', height: '38%', objectFit: 'contain' }}
            />
          )}
        </div>
        <div style={{ minWidth: 0, paddingTop: '4px' }}>
          <div style={{ fontSize: '13px', fontWeight: 900, color: 'var(--color-text)', lineHeight: 1.25, letterSpacing: '0.02em', wordBreak: 'break-word' }}>{name || '—'}</div>
          <div style={{ marginTop: '4px' }}>
            <ComboTypeBadges blade={blade} bit={combo?.bit} size={16} />
          </div>
        </div>
      </div>
      {(ratchet || assistBlade || combo?.bit) && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap', marginBottom: '12px' }}>
          {[
            ...(isCXLine && assistBlade ? [{ part: assistBlade, modeIndex: combo?.assistBladeMode ?? 0 }] : []),
            { part: ratchet, modeIndex: 0 },
            { part: combo?.bit, modeIndex: combo?.bitMode ?? 0 },
          ].filter(({ part }) => part && BEYBLADE_DB[part]?.image).map(({ part, modeIndex }) => {
            const image = getPartImage(part, modeIndex);
            return (
            <div key={part} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-surface)', border: `1px solid ${ACCENT}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={`/images/${image}`} alt={part} style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
              </div>
              <span style={{ fontSize: '6px', color: 'var(--color-text-muted)', textAlign: 'center', letterSpacing: '0.05em', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '100%' }}>{part}</span>
            </div>
            );
          })}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {STAT_DEFS.map(({ key, label, gradient, color, limit }) => {
          const value = stats[key] || 0;
          const pct = Math.min(100, value / limit);
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '6.5px', color: 'var(--color-text-muted)', letterSpacing: '0.12em', width: '48px', flexShrink: 0 }}>{label}</span>
              <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: 'var(--color-stat-track)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: gradient, borderRadius: '2px' }} />
              </div>
              <span style={{ fontSize: '6.5px', color, fontWeight: 700, width: '20px', textAlign: 'right' }}>{value}</span>
            </div>
          );
        })}
      </div>
      {!hideFooter && (
        <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,transparent,var(--color-border))' }} />
          <span style={{ fontSize: '7px', color: 'var(--color-text-muted)', letterSpacing: '0.18em', fontWeight: 600 }}>BEYBLADEBREW.COM</span>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,var(--color-border),transparent)' }} />
        </div>
      )}
    </div>
  );
}

SingleComboWidget.propTypes = { combo: PropTypes.object, hideFooter: PropTypes.bool };

export default SingleComboWidget;
