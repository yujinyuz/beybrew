import PropTypes from 'prop-types';
import { BEYBLADE_DB, getStats } from '../constants';
import { getComboStats, getComboName, STAT_DEFS } from '../lib/comboUtils';

const ACCENT_COLORS = ['#00d4ff', '#7b61ff', '#ffa040'];

function ComboRow({ combo, accent }) {
  const { blade, overBlade, lockChip } = combo || {};
  const isCXLine = BEYBLADE_DB[blade]?.line === 'CX';
  const stats = getComboStats(combo);
  const name = getComboName(combo);
  const bladeImage = blade ? getStats(blade, combo?.bladeMode ?? 0)?.image : null;
  const overBladeImage = overBlade ? BEYBLADE_DB[overBlade]?.image : null;

  return (
    <div
      className="flex items-center gap-4 p-4 rounded-xl"
      style={{
        background: 'var(--color-surface-2)',
        border: `1px solid ${accent}33`,
        borderLeft: `3px solid ${accent}`,
      }}
    >
      <div className="relative flex-shrink-0" style={{ width: 56, height: 56 }}>
        {bladeImage ? (
          <img
            src={`/images/${bladeImage}`}
            alt={blade}
            className="rounded-full object-contain"
            style={{ width: 56, height: 56, background: '#0f1e2e', border: `2px solid ${accent}80` }}
          />
        ) : (
          <div className="rounded-full" style={{ width: 56, height: 56, background: 'var(--color-surface)' }} />
        )}
        {isCXLine && overBladeImage && (
          <img
            src={`/images/${overBladeImage}`}
            alt={overBlade}
            className="absolute"
            style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '65%', height: '65%', objectFit: 'contain' }}
          />
        )}
        {isCXLine && lockChip && BEYBLADE_DB[lockChip]?.image && (
          <img
            src={`/images/${BEYBLADE_DB[lockChip].image}`}
            alt={lockChip}
            className="absolute"
            style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '38%', height: '38%', objectFit: 'contain' }}
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold mb-2 truncate" style={{ fontSize: 11, color: 'var(--color-text)', letterSpacing: '0.02em' }}>
          {name || '—'}
        </p>
        <div className="flex flex-col gap-1.5">
          {STAT_DEFS.map(({ key, label, gradient, color, limit }) => {
            const value = stats[key] || 0;
            const pct = Math.min(100, value / limit);
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="flex-shrink-0 text-right" style={{ fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '0.1em', width: 52 }}>
                  {label}
                </span>
                <div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, background: 'var(--color-stat-track)' }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: gradient }} />
                </div>
                <span className="flex-shrink-0 font-bold tabular-nums" style={{ fontSize: 10, color, width: 20, textAlign: 'right' }}>
                  {value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

ComboRow.propTypes = {
  combo: PropTypes.object,
  accent: PropTypes.string.isRequired,
};

function DeckPreview({ beyblades, beybladeCount }) {
  return (
    <div className="flex flex-col gap-3">
      {Array(beybladeCount).fill(null).map((_, i) => (
        <ComboRow key={i} combo={beyblades[i]} accent={ACCENT_COLORS[i % ACCENT_COLORS.length]} />
      ))}
    </div>
  );
}

DeckPreview.propTypes = {
  beyblades: PropTypes.array.isRequired,
  beybladeCount: PropTypes.number.isRequired,
};

export default DeckPreview;
