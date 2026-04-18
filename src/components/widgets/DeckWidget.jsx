import PropTypes from 'prop-types';
import { BEYBLADE_DB, LIMITED_FORMAT } from '../../constants';
import { getComboStats, getComboName, STAT_DEFS } from '../../lib/comboUtils';

const ACCENT_COLORS = ['#00d4ff', '#7b61ff', '#ffa040'];
const DOT_BG = {
  backgroundImage: 'radial-gradient(rgba(0,212,255,0.06) 1px, transparent 1px)',
  backgroundSize: '20px 20px',
};

function StatBars({ stats }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      {STAT_DEFS.map(({ key, label, gradient, color, limit }) => {
        const value = stats[key] || 0;
        const pct = Math.min(100, (value / limit) * 100);
        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '6.5px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', width: '48px', flexShrink: 0 }}>{label}</span>
            <div style={{ flex: 1, height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: gradient, borderRadius: '2px' }} />
            </div>
            <span style={{ fontSize: '6.5px', color, fontWeight: 700, width: '20px', textAlign: 'right' }}>{value}</span>
          </div>
        );
      })}
    </div>
  );
}

function ComboRow({ combo, accent }) {
  const { blade, lockChip } = combo || {};
  const isCXLine = BEYBLADE_DB[blade]?.line === 'CX';
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${accent}33`, borderLeft: `3px solid ${accent}`, borderRadius: '10px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ position: 'relative', width: '44px', height: '44px', flexShrink: 0 }}>
        {blade && BEYBLADE_DB[blade]?.image && (
          <img src={`/images/${BEYBLADE_DB[blade].image}`} alt={blade}
            style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'contain', background: '#0f1e2e', border: `2px solid ${accent}80` }}
          />
        )}
        {isCXLine && lockChip && BEYBLADE_DB[lockChip]?.image && (
          <img src={`/images/${BEYBLADE_DB[lockChip].image}`} alt={lockChip}
            style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '38%', height: '38%', objectFit: 'contain' }}
          />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '10px', fontWeight: 800, color: '#fff', marginBottom: '5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {getComboName(combo) || '—'}
        </div>
        <StatBars stats={getComboStats(combo)} />
      </div>
    </div>
  );
}

function DeckWidget({ combos, beybladeCount, format }) {
  const formatLabel = format === LIMITED_FORMAT ? 'LIMITED' : 'STANDARD';
  return (
    <div style={{ ...DOT_BG, background: '#080c18', borderRadius: '12px', padding: '20px', fontFamily: 'system-ui,-apple-system,sans-serif', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '0.08em', background: 'linear-gradient(90deg,#00d4ff,#7b61ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>BEYBREW</div>
        <div style={{ width: '60px', height: '1px', background: 'linear-gradient(90deg,transparent,#00d4ff,transparent)', margin: '4px auto' }} />
        <div style={{ fontSize: '7px', color: 'rgba(0,212,255,0.7)', letterSpacing: '0.22em', fontWeight: 600 }}>BEYBLADE X DECK · {formatLabel}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {Array(beybladeCount).fill(null).map((_, i) => (
          <ComboRow key={i} combo={combos[i]} accent={ACCENT_COLORS[i % ACCENT_COLORS.length]} />
        ))}
      </div>
      <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.08))' }} />
        <span style={{ fontSize: '7px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.18em', fontWeight: 600 }}>BEYBLADEBREW.COM</span>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,rgba(255,255,255,0.08),transparent)' }} />
      </div>
    </div>
  );
}

DeckWidget.propTypes = {
  combos: PropTypes.array.isRequired,
  beybladeCount: PropTypes.number.isRequired,
  format: PropTypes.string,
};

export default DeckWidget;
