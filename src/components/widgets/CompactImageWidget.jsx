import PropTypes from 'prop-types';
import { BEYBLADE_DB, getLineColor, getPartImage } from '../../constants';
import { getComboStats, getComboName, STAT_DEFS } from '../../lib/comboUtils';
import ComboTypeBadges from '../ComboTypeBadges';
const MAIN_STATS = STAT_DEFS.slice(0, 3); // attack, defense, stamina

function CompactComboRow({ combo, accent }) {
  const { blade, overBlade, lockChip } = combo || {};
  const isCXLine = BEYBLADE_DB[blade]?.line === 'CX';
  const overBladeImage = overBlade ? BEYBLADE_DB[overBlade]?.image : null;
  const bladeImage = getPartImage(blade, combo?.bladeMode ?? 0);
  const stats = getComboStats(combo);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ position: 'relative', width: '26px', height: '26px', flexShrink: 0 }}>
        {blade && bladeImage && (
          <img src={`/images/${bladeImage}`} alt={blade}
            style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'contain', background: 'var(--color-surface)', border: `1px solid ${accent}66` }}
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
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '9px', color: 'var(--color-text)', fontWeight: 800, marginBottom: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {getComboName(combo) || '—'}
        </div>
        <div style={{ marginBottom: '2px' }}>
          <ComboTypeBadges blade={blade} bit={combo?.bit} size={10} />
        </div>
        <div style={{ display: 'flex', gap: '2px', height: '2px' }}>
          {MAIN_STATS.map(({ key, gradient, limit }) => {
            const val = stats[key] || 0;
            const flex = Math.max(1, Math.round(val / limit));
            return <div key={key} style={{ flex, background: gradient, borderRadius: '1px' }} />;
          })}
          <div style={{ flex: Math.max(0, 100 - MAIN_STATS.reduce((sum, { key, limit }) => sum + Math.round((stats[key] || 0) / limit), 0)), background: 'var(--color-stat-track)', borderRadius: '1px' }} />
        </div>
      </div>
    </div>
  );
}
CompactComboRow.propTypes = { combo: PropTypes.object, accent: PropTypes.string.isRequired };

function CompactImageWidget({ combos, beybladeCount, format }) {
  const formatLabel = format?.name?.toUpperCase() ?? 'STANDARD';
  return (
    <div style={{ background: 'var(--color-bg)', borderRadius: '12px', padding: '14px 16px', fontFamily: 'system-ui,-apple-system,sans-serif', border: '1px solid var(--color-border)' }}>
      <div style={{ fontSize: '6.5px', color: 'var(--color-accent)', letterSpacing: '0.22em', fontWeight: 700, marginBottom: '10px' }}>BEYBREW · {formatLabel}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {Array(beybladeCount).fill(null).map((_, i) => (
          <CompactComboRow key={i} combo={combos[i]} accent={getLineColor(combos[i]?.blade)} />
        ))}
      </div>
      <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,transparent,var(--color-border))' }} />
        <span style={{ fontSize: '6.5px', color: 'var(--color-text-muted)', letterSpacing: '0.18em', fontWeight: 600 }}>BEYBLADEBREW.COM</span>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,var(--color-border),transparent)' }} />
      </div>
    </div>
  );
}

CompactImageWidget.propTypes = {
  combos: PropTypes.array.isRequired,
  beybladeCount: PropTypes.number.isRequired,
  format: PropTypes.object,
};

export default CompactImageWidget;
