import PropTypes from 'prop-types';
import { BEYBLADE_DB, getStats, getLineColor, getLineLogo } from '../constants';
import { getComboStats, getComboName, STAT_DEFS } from '../lib/comboUtils';

function ComboRow({ combo, accent }) {
  const { blade, overBlade, lockChip } = combo || {};
  const spinType = BEYBLADE_DB[blade]?.spinType;
  const isCXLine = BEYBLADE_DB[blade]?.line === 'CX';
  const stats = getComboStats(combo);
  const name = getComboName(combo);
  const bladeImage = blade ? getStats(blade, combo?.bladeMode ?? 0)?.image : null;
  const overBladeImage = overBlade ? BEYBLADE_DB[overBlade]?.image : null;

  return (
    <div
      className="flex items-center rounded-xl"
      style={{
        background: 'var(--color-surface-2)',
        border: `1px solid ${accent}22`,
        borderLeft: `3px solid ${accent}`,
        padding: '10px 14px',
        gap: 12,
      }}
    >
      <div className="relative flex-shrink-0" style={{ width: 48, height: 48 }}>
        {bladeImage ? (
          <img
            src={`/images/${bladeImage}`}
            alt={blade}
            className="rounded-full object-contain"
            style={{ width: 48, height: 48, background: 'var(--color-surface)', border: `2px solid ${accent}66` }}
          />
        ) : (
          <div className="rounded-full" style={{ width: 48, height: 48, background: 'var(--color-surface)' }} />
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

      <div className="flex-1 min-w-0 flex flex-col" style={{ gap: 4 }}>
        <p className="truncate font-semibold" style={{ fontSize: 13, color: 'var(--color-text)', letterSpacing: '0.01em' }}>
          {name || '—'}
        </p>
        {blade && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <img
              src={`/images/${getLineLogo(blade)}`}
              alt={BEYBLADE_DB[blade]?.line || 'BX'}
              style={{ height: '14px', width: 'auto', objectFit: 'contain' }}
            />
            <span style={{ fontSize: '7px', color: accent, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {spinType?.toUpperCase()} SPIN
            </span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          {STAT_DEFS.map(({ key, color }) => (
            <span
              key={key}
              className="font-bold tabular-nums"
              style={{
                fontSize: 12,
                color,
                background: 'var(--color-stat-track)',
                borderRadius: 6,
                padding: '2px 6px',
                minWidth: 28,
                textAlign: 'center',
              }}
            >
              {stats[key] || 0}
            </span>
          ))}
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
    <div className="flex flex-col gap-2">
      {Array(beybladeCount).fill(null).map((_, i) => (
        <ComboRow key={i} combo={beyblades[i]} accent={getLineColor(beyblades[i]?.blade)} />
      ))}
      <div className="flex items-center gap-1.5" style={{ paddingLeft: 60 }}>
        {STAT_DEFS.map(({ key, label, color }) => (
          <span
            key={key}
            style={{
              fontSize: 9,
              color,
              letterSpacing: '0.1em',
              minWidth: 28,
              textAlign: 'center',
              fontFamily: 'var(--font-body)',
              textTransform: 'uppercase',
              opacity: 0.7,
            }}
          >
            {label === 'X-DASH' ? 'XD' : label === 'BURST' ? 'BR' : label.slice(0, 3)}
          </span>
        ))}
      </div>
    </div>
  );
}

DeckPreview.propTypes = {
  beyblades: PropTypes.array.isRequired,
  beybladeCount: PropTypes.number.isRequired,
};

export default DeckPreview;
