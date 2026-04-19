import PropTypes from 'prop-types';
import { BEYBLADE_DB, getLineColor, getLineLogo } from '../../constants';
import { getComboStats, getComboName, STAT_DEFS } from '../../lib/comboUtils';

const DOT_BG = {
  backgroundImage: 'radial-gradient(rgba(0,212,255,0.06) 1px, transparent 1px)',
  backgroundSize: '20px 20px',
};

function SingleComboWidget({ combo }) {
  const { blade, overBlade, lockChip } = combo || {};
  const ACCENT = getLineColor(blade);
  const isCXLine = BEYBLADE_DB[blade]?.line === 'CX';
  const overBladeImage = overBlade ? BEYBLADE_DB[overBlade]?.image : null;
  const stats = getComboStats(combo);
  const name = getComboName(combo);
  const spinType = BEYBLADE_DB[blade]?.spinType;
  const bitType = BEYBLADE_DB[combo?.bit]?.type;

  return (
    <div style={{ ...DOT_BG, background: '#080c18', borderRadius: '14px', border: `1px solid ${ACCENT}33`, borderLeft: `3px solid ${ACCENT}`, padding: '18px', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
      <div style={{ fontSize: '6.5px', color: 'rgba(0,212,255,0.6)', letterSpacing: '0.25em', fontWeight: 700, marginBottom: '12px' }}>BEYBREW · COMBO</div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ position: 'relative', width: '60px', height: '60px', flexShrink: 0 }}>
          {blade && BEYBLADE_DB[blade]?.image && (
            <img src={`/images/${BEYBLADE_DB[blade].image}`} alt={blade}
              style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'contain', background: '#0f1e2e', border: `2px solid ${ACCENT}80` }}
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
        <div>
          <div style={{ fontSize: '15px', fontWeight: 900, color: '#fff', lineHeight: 1.2, letterSpacing: '0.02em' }}>{name || '—'}</div>
          {(spinType || bitType) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
              {spinType && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <img
                    src={`/images/${getLineLogo(blade)}`}
                    alt={BEYBLADE_DB[blade]?.line || 'BX'}
                    style={{ height: '16px', width: 'auto', objectFit: 'contain' }}
                  />
                  <span style={{ fontSize: '6.5px', color: ACCENT, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {spinType.toUpperCase()} SPIN
                  </span>
                </div>
              )}
              {bitType && (
                <span style={{ fontSize: '6.5px', color: 'rgba(0,212,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {bitType.toUpperCase()}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {STAT_DEFS.map(({ key, label, gradient, color, limit }) => {
          const value = stats[key] || 0;
          const pct = Math.min(100, value / limit);
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '6.5px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', width: '48px', flexShrink: 0 }}>{label}</span>
              <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: gradient, borderRadius: '2px' }} />
              </div>
              <span style={{ fontSize: '6.5px', color, fontWeight: 700, width: '20px', textAlign: 'right' }}>{value}</span>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.08))' }} />
        <span style={{ fontSize: '7px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.18em', fontWeight: 600 }}>BEYBLADEBREW.COM</span>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,rgba(255,255,255,0.08),transparent)' }} />
      </div>
    </div>
  );
}

SingleComboWidget.propTypes = { combo: PropTypes.object };

export default SingleComboWidget;
