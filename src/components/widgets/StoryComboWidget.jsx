import PropTypes from 'prop-types';
import { BEYBLADE_DB, getLineColor, getLineLogo, getSpinType } from '../../constants';
import { getComboStats, getComboName, STAT_DEFS } from '../../lib/comboUtils';

const DOT_BG = {
  backgroundImage: 'radial-gradient(rgba(0,212,255,0.06) 1px, transparent 1px)',
  backgroundSize: '24px 24px',
};

function StoryComboWidget({ combo }) {
  const { blade, overBlade, lockChip } = combo || {};
  const ACCENT = getLineColor(blade);
  const isCXLine = BEYBLADE_DB[blade]?.line === 'CX';
  const overBladeImage = overBlade ? BEYBLADE_DB[overBlade]?.image : null;
  const stats = getComboStats(combo);
  const name = getComboName(combo);
  const spinType = getSpinType(blade);
  const bitType = BEYBLADE_DB[combo?.bit]?.type;

  return (
    <div style={{
      ...DOT_BG,
      background: '#080c18',
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
      <div style={{ fontSize: '11px', color: 'rgba(0,212,255,0.6)', letterSpacing: '0.25em', fontWeight: 700, marginBottom: '24px', flexShrink: 0 }}>
        BEYBREW · COMBO
      </div>

      {/* Hero image zone */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: '0 0 280px', position: 'relative' }}>
        <div style={{ position: 'absolute', width: '240px', height: '240px', borderRadius: '50%', border: '1px solid rgba(0,212,255,0.12)', boxShadow: '0 0 60px rgba(0,212,255,0.08)' }} />
        <div style={{ position: 'absolute', width: '210px', height: '210px', borderRadius: '50%', border: '1px dashed rgba(0,212,255,0.07)' }} />
        <div style={{ position: 'relative', width: '180px', height: '180px', flexShrink: 0 }}>
          {blade && BEYBLADE_DB[blade]?.image ? (
            <img
              src={`/images/${BEYBLADE_DB[blade].image}`}
              alt={blade}
              style={{ width: '180px', height: '180px', borderRadius: '50%', objectFit: 'contain', background: '#0f1e2e', border: `3px solid ${ACCENT}80`, boxShadow: `0 0 40px ${ACCENT}22` }}
            />
          ) : (
            <div style={{ width: '180px', height: '180px', borderRadius: '50%', background: '#0f1e2e', border: `3px solid ${ACCENT}80` }} />
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

      {/* Divider */}
      <div style={{ height: '1px', background: 'linear-gradient(90deg,transparent,rgba(0,212,255,0.3),transparent)', margin: '20px 0', flexShrink: 0 }} />

      {/* Combo name */}
      <div style={{ fontSize: '28px', fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: '0.02em', marginBottom: '10px', flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {name || '—'}
      </div>

      {/* Type tags */}
      {(spinType || bitType) && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', flexShrink: 0 }}>
          {spinType && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,212,255,0.1)', border: `1px solid ${ACCENT}4d`, borderRadius: '6px', padding: '3px 8px' }}>
              <img
                src={`/images/${getLineLogo(blade)}`}
                alt={BEYBLADE_DB[blade]?.line || 'BX'}
                style={{ height: '20px', width: 'auto', objectFit: 'contain' }}
              />
              <img src={`/images/${spinType}-spin.png`} alt={`${spinType} spin`} style={{ height: '20px', width: 'auto', objectFit: 'contain' }} />
            </div>
          )}
          {bitType && (
            <span style={{ fontSize: '10px', background: 'rgba(123,97,255,0.1)', border: '1px solid rgba(123,97,255,0.3)', borderRadius: '6px', padding: '3px 8px', color: '#7b61ff', letterSpacing: '0.1em', fontWeight: 700 }}>
              {bitType.toUpperCase()}
            </span>
          )}
        </div>
      )}

      {/* Stat bars */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '14px' }}>
        {STAT_DEFS.map(({ key, label, gradient, color, limit }) => {
          const value = stats[key] || 0;
          const pct = Math.min(100, value / limit);
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', width: '80px', flexShrink: 0 }}>{label}</span>
              <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: gradient, borderRadius: '3px' }} />
              </div>
              <span style={{ fontSize: '13px', color, fontWeight: 700, width: '28px', textAlign: 'right' }}>{value}</span>
            </div>
          );
        })}
      </div>

      {/* Watermark */}
      <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.08))' }} />
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.18em', fontWeight: 600 }}>BEYBLADEBREW.COM</span>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,rgba(255,255,255,0.08),transparent)' }} />
      </div>
    </div>
  );
}

StoryComboWidget.propTypes = { combo: PropTypes.object };

export default StoryComboWidget;
