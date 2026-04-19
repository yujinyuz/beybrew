import PropTypes from 'prop-types';
import { BEYBLADE_DB, getLineColor } from '../../constants';
import { getComboStats, getComboName, STAT_DEFS } from '../../lib/comboUtils';
import ComboTypeBadges from '../ComboTypeBadges';
const DOT_BG = {
  backgroundImage: 'radial-gradient(var(--color-grid) 1px, transparent 1px)',
  backgroundSize: '24px 24px',
};

const PROFILE_CIRCUMFERENCE = 2 * Math.PI * 15;
const PROFILE_STAT_LIMITS = Object.fromEntries(STAT_DEFS.map(d => [d.key, d.limit]));

function DeckProfileStrip({ profile, bladerName }) {
  if (!profile) return null;
  return (
    <div style={{
      flexShrink: 0,
      margin: '16px 0 0',
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: '10px',
      padding: '12px 14px',
    }}>
      <div style={{ fontSize: '7px', color: 'var(--color-text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '10px' }}>
        Deck Profile
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ flexShrink: 0, textAlign: 'center', width: '72px' }}>
          <span style={{ fontSize: '26px', lineHeight: 1 }}>{profile.emoji}</span>
          <div style={{ fontSize: '11px', fontWeight: 800, color: profile.color, letterSpacing: '1px', marginTop: '3px' }}>
            {profile.archetype}
          </div>
          <div style={{ fontSize: '8px', color: 'var(--color-text-muted)', lineHeight: 1.3, marginTop: '2px' }}>
            {profile.flavor}
          </div>
        </div>
        <div style={{ width: '1px', alignSelf: 'stretch', background: 'var(--color-border)', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          {STAT_DEFS.map((def) => {
            const value = profile.averageStats[def.key] || 0;
            const pct = Math.min(100, value / PROFILE_STAT_LIMITS[def.key]);
            const offset = PROFILE_CIRCUMFERENCE * (1 - pct / 100);
            return (
              <div key={def.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                <svg width="32" height="32" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="15" fill="none" strokeWidth="4" style={{ stroke: 'var(--color-stat-track)' }} />
                  <circle
                    cx="20" cy="20" r="15"
                    fill="none"
                    strokeWidth="4"
                    strokeDasharray={PROFILE_CIRCUMFERENCE}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform="rotate(-90 20 20)"
                    style={{ stroke: def.color }}
                  />
                  <text x="20" y="24" textAnchor="middle" fontSize="9" fontWeight="bold" fontFamily="system-ui,sans-serif" style={{ fill: def.color }}>
                    {Math.round(pct)}
                  </text>
                </svg>
                <span style={{ fontSize: '7px', color: 'var(--color-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {def.abbr}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {bladerName && (
        <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '8px', color: 'var(--color-text-muted)', letterSpacing: '0.15em' }}>BLADER</span>
          <span style={{ fontSize: '10px', color: 'var(--color-accent)', fontWeight: 600 }}>{bladerName}</span>
        </div>
      )}
    </div>
  );
}

DeckProfileStrip.propTypes = {
  profile: PropTypes.object,
  bladerName: PropTypes.string,
};

function ComboSection({ combo, accent, imageSize, statHeight, statGap, nameFontSize }) {
  const { blade, overBlade, lockChip } = combo || {};
  const isCXLine = BEYBLADE_DB[blade]?.line === 'CX';
  const overBladeImage = overBlade ? BEYBLADE_DB[overBlade]?.image : null;
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
              style={{ width: `${imageSize}px`, height: `${imageSize}px`, borderRadius: '50%', objectFit: 'contain', background: 'var(--color-surface)', border: `2px solid ${accent}80` }}
            />
          ) : (
            <div style={{ width: `${imageSize}px`, height: `${imageSize}px`, borderRadius: '50%', background: 'var(--color-surface)', border: `2px solid ${accent}80` }} />
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
        <div style={{ fontSize: `${nameFontSize}px`, fontWeight: 800, color: 'var(--color-text)', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {name || '—'}
        </div>
        <div style={{ marginBottom: `${Math.max(2, statGap - 2)}px` }}>
          <ComboTypeBadges blade={blade} bit={combo?.bit} size={12} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${Math.max(2, statGap - 2)}px` }}>
          {STAT_DEFS.map(({ key, label, gradient, color, limit }) => {
            const value = stats[key] || 0;
            const pct = Math.min(100, value / limit);
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '7px', color: 'var(--color-text-muted)', letterSpacing: '0.1em', width: '44px', flexShrink: 0 }}>{label}</span>
                <div style={{ flex: 1, height: `${statHeight}px`, borderRadius: '2px', background: 'var(--color-stat-track)', overflow: 'hidden' }}>
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

function StoryDeckWidget({ combos, beybladeCount, format, profile, bladerName }) {
  const formatLabel = format?.name?.toUpperCase() ?? 'STANDARD';

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
      background: 'var(--color-bg)',
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
        <div style={{ fontSize: '9px', color: 'var(--color-accent)', letterSpacing: '0.22em', fontWeight: 600 }}>
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

      {/* Deck Profile strip */}
      <DeckProfileStrip profile={profile} bladerName={bladerName} />

      {/* Watermark */}
      <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,transparent,var(--color-border))' }} />
        <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', letterSpacing: '0.18em', fontWeight: 600 }}>BEYBLADEBREW.COM</span>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,var(--color-border),transparent)' }} />
      </div>
    </div>
  );
}

StoryDeckWidget.propTypes = {
  combos: PropTypes.array.isRequired,
  beybladeCount: PropTypes.number.isRequired,
  format: PropTypes.string,
  profile: PropTypes.object,
  bladerName: PropTypes.string,
};

export default StoryDeckWidget;
