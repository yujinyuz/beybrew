import PropTypes from 'prop-types';
import { BEYBLADE_DB, LIMITED_FORMAT, getLineColor, getLineLogo, getSpinType } from '../../constants';
import { getComboStats, getComboName, STAT_DEFS } from '../../lib/comboUtils';
const DOT_BG = {
  backgroundImage: 'radial-gradient(rgba(0,212,255,0.06) 1px, transparent 1px)',
  backgroundSize: '24px 24px',
};

function ComboSection({ combo, accent, imageSize, statHeight, statGap, nameFontSize }) {
  const { blade, overBlade, lockChip } = combo || {};
  const isCXLine = BEYBLADE_DB[blade]?.line === 'CX';
  const overBladeImage = overBlade ? BEYBLADE_DB[overBlade]?.image : null;
  const spinType = getSpinType(blade);
  const stats = getComboStats(combo);
  const name = getComboName(combo);

  return (
    <div style={{
      flex: 1,
      background: `${accent}08`,
      border: `1px solid ${accent}22`,
      borderLeft: `3px solid ${accent}`,
      borderRadius: '10px',
      padding: '10px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      overflow: 'hidden',
      minHeight: 0,
    }}>
      {imageSize > 0 && (
        <div style={{ position: 'relative', width: `${imageSize}px`, height: `${imageSize}px`, flexShrink: 0 }}>
          {blade && BEYBLADE_DB[blade]?.image ? (
            <img
              src={`/images/${BEYBLADE_DB[blade].image}`}
              alt={blade}
              style={{ width: `${imageSize}px`, height: `${imageSize}px`, borderRadius: '50%', objectFit: 'contain', background: '#0f1e2e', border: `2px solid ${accent}80` }}
            />
          ) : (
            <div style={{ width: `${imageSize}px`, height: `${imageSize}px`, borderRadius: '50%', background: '#0f1e2e', border: `2px solid ${accent}80` }} />
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
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: `${nameFontSize}px`, fontWeight: 800, color: '#fff', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {name || '—'}
        </div>
        {blade && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: `${Math.max(2, statGap - 2)}px` }}>
            <img
              src={`/images/${getLineLogo(blade)}`}
              alt={BEYBLADE_DB[blade]?.line || 'BX'}
              style={{ height: '12px', width: 'auto', objectFit: 'contain' }}
            />
            <img src={`/images/${spinType}-spin.png`} alt={`${spinType} spin`} className="spin-icon" style={{ height: '12px', width: 'auto', objectFit: 'contain' }} />
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${Math.max(2, statGap - 2)}px` }}>
          {STAT_DEFS.map(({ key, label, gradient, color, limit }) => {
            const value = stats[key] || 0;
            const pct = Math.min(100, value / limit);
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '7px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', width: '44px', flexShrink: 0 }}>{label}</span>
                <div style={{ flex: 1, height: `${statHeight}px`, borderRadius: '2px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: gradient, borderRadius: '2px' }} />
                </div>
                <span style={{ fontSize: '8px', color, fontWeight: 700, width: '16px', textAlign: 'right' }}>{value}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

ComboSection.propTypes = {
  combo: PropTypes.object,
  accent: PropTypes.string.isRequired,
  imageSize: PropTypes.number.isRequired,
  statHeight: PropTypes.number.isRequired,
  statGap: PropTypes.number.isRequired,
  nameFontSize: PropTypes.number.isRequired,
};

function StoryDeckWidget({ combos, beybladeCount, format }) {
  const formatLabel = format === LIMITED_FORMAT ? 'LIMITED' : 'STANDARD';

  let imageSize, statHeight, statGap, nameFontSize;
  if (beybladeCount <= 3) {
    imageSize = 100; statHeight = 5; statGap = 8; nameFontSize = 13;
  } else if (beybladeCount <= 6) {
    imageSize = 64; statHeight = 4; statGap = 5; nameFontSize = 11;
  } else {
    imageSize = 0; statHeight = 3; statGap = 4; nameFontSize = 10;
  }

  return (
    <div style={{
      ...DOT_BG,
      background: '#080c18',
      width: '540px',
      height: '960px',
      fontFamily: 'system-ui,-apple-system,sans-serif',
      display: 'flex',
      flexDirection: 'column',
      padding: '28px 32px',
      boxSizing: 'border-box',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px', flexShrink: 0 }}>
        <div style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '0.08em', background: 'linear-gradient(90deg,#00d4ff,#7b61ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          BEYBREW
        </div>
        <div style={{ width: '60px', height: '1px', background: 'linear-gradient(90deg,transparent,#00d4ff,transparent)', margin: '6px auto' }} />
        <div style={{ fontSize: '9px', color: 'rgba(0,212,255,0.7)', letterSpacing: '0.22em', fontWeight: 600 }}>
          BEYBLADE X DECK · {formatLabel}
        </div>
      </div>

      {/* Combos */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden', minHeight: 0 }}>
        {Array(beybladeCount).fill(null).map((_, i) => (
          <ComboSection
            key={i}
            combo={combos[i]}
            accent={getLineColor(combos[i]?.blade)}
            imageSize={imageSize}
            statHeight={statHeight}
            statGap={statGap}
            nameFontSize={nameFontSize}
          />
        ))}
      </div>

      {/* Watermark */}
      <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.08))' }} />
        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.18em', fontWeight: 600 }}>BEYBLADEBREW.COM</span>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,rgba(255,255,255,0.08),transparent)' }} />
      </div>
    </div>
  );
}

StoryDeckWidget.propTypes = {
  combos: PropTypes.array.isRequired,
  beybladeCount: PropTypes.number.isRequired,
  format: PropTypes.string,
};

export default StoryDeckWidget;
