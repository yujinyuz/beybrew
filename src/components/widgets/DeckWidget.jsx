import PropTypes from 'prop-types';
import { BEYBLADE_DB, getLineColor } from '../../constants';
import { getComboStats, getComboName, STAT_DEFS } from '../../lib/comboUtils';
import ComboTypeBadges from '../ComboTypeBadges';

const STAT_LIMITS = Object.fromEntries(STAT_DEFS.map(d => [d.key, d.limit]));
const DOT_BG = {
  backgroundImage: 'radial-gradient(var(--color-grid) 1px, transparent 1px)',
  backgroundSize: '20px 20px',
};

function StatBars({ stats }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      {STAT_DEFS.map(({ key, label, gradient, color, limit }) => {
        const value = stats[key] || 0;
        const pct = Math.min(100, value / limit);
        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '6.5px', color: 'var(--color-text-muted)', letterSpacing: '0.12em', width: '48px', flexShrink: 0 }}>{label}</span>
            <div style={{ flex: 1, height: '3px', borderRadius: '2px', background: 'var(--color-stat-track)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: gradient, borderRadius: '2px' }} />
            </div>
            <span style={{ fontSize: '6.5px', color, fontWeight: 700, width: '20px', textAlign: 'right' }}>{value}</span>
          </div>
        );
      })}
    </div>
  );
}
StatBars.propTypes = { stats: PropTypes.object.isRequired };

function ComboRow({ combo, accent }) {
  const { blade, overBlade, lockChip } = combo || {};
  const isCXLine = BEYBLADE_DB[blade]?.line === 'CX';
  const overBladeImage = overBlade ? BEYBLADE_DB[overBlade]?.image : null;
  return (
    <div style={{ background: 'var(--color-surface)', border: `1px solid ${accent}33`, borderLeft: `3px solid ${accent}`, borderRadius: '10px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ position: 'relative', width: '44px', height: '44px', flexShrink: 0 }}>
        {blade && BEYBLADE_DB[blade]?.image && (
          <img src={`/images/${BEYBLADE_DB[blade].image}`} alt={blade}
            style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'contain', background: 'var(--color-surface-2)', border: `2px solid ${accent}80` }}
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
        <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-text)', marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {getComboName(combo) || '—'}
        </div>
        <div style={{ marginBottom: '4px' }}>
          <ComboTypeBadges blade={blade} bit={combo?.bit} size={14} />
        </div>
        <StatBars stats={getComboStats(combo)} />
      </div>
    </div>
  );
}
ComboRow.propTypes = { combo: PropTypes.object, accent: PropTypes.string.isRequired };

const WIDGET_CIRCUMFERENCE = 2 * Math.PI * 10;

function ProfileSection({ profile, bladerName }) {
  return (
    <div style={{ marginBottom: '14px', padding: '10px 12px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '6px', color: 'var(--color-accent)', letterSpacing: '0.2em', fontWeight: 700 }}>DECK PROFILE</span>
        {bladerName ? (
          <span style={{ fontSize: '7px', color: 'var(--color-text-muted)' }}>
            Blader: <span style={{ color: 'var(--color-text)', fontWeight: 700 }}>{bladerName}</span>
          </span>
        ) : null}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', minWidth: '60px' }}>
          <span style={{ fontSize: '20px', lineHeight: 1 }}>{profile.emoji}</span>
          <span style={{ fontSize: '9px', fontWeight: 800, color: profile.color, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{profile.archetype}</span>
          <span style={{ fontSize: '6.5px', color: 'var(--color-text-muted)', textAlign: 'center', maxWidth: '60px', lineHeight: 1.3 }}>{profile.flavor}</span>
        </div>
        <div style={{ width: '1px', alignSelf: 'stretch', background: 'var(--color-border)', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          {STAT_DEFS.map(({ key, abbr, color }) => {
            const pct = Math.min(100, (profile.averageStats[key] || 0) / STAT_LIMITS[key]);
            const offset = WIDGET_CIRCUMFERENCE * (1 - pct / 100);
            return (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <svg width="28" height="28" viewBox="0 0 28 28">
                  <circle cx="14" cy="14" r="10" fill="none" strokeWidth="3" style={{ stroke: 'var(--color-stat-track)' }} />
                  <circle cx="14" cy="14" r="10" fill="none" strokeWidth="3"
                    strokeDasharray={WIDGET_CIRCUMFERENCE} strokeDashoffset={offset}
                    strokeLinecap="round" transform="rotate(-90 14 14)" style={{ stroke: color }} />
                  <text x="14" y="18" textAnchor="middle" fontSize="7" fontWeight="bold" fontFamily="system-ui,sans-serif" style={{ fill: color }}>
                    {Math.round(pct)}
                  </text>
                </svg>
                <span style={{ fontSize: '5px', color: 'var(--color-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{abbr}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
ProfileSection.propTypes = {
  profile: PropTypes.shape({
    emoji: PropTypes.string,
    archetype: PropTypes.string,
    flavor: PropTypes.string,
    color: PropTypes.string,
    averageStats: PropTypes.object,
  }).isRequired,
  bladerName: PropTypes.string,
};

function DeckWidget({ combos, beybladeCount, format, profile, bladerName }) {
  const formatLabel = format?.name?.toUpperCase() ?? 'STANDARD';
  return (
    <div style={{ ...DOT_BG, background: 'var(--color-bg)', borderRadius: '12px', padding: '20px', fontFamily: 'system-ui,-apple-system,sans-serif', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '0.08em', background: 'linear-gradient(90deg,#00d4ff,#7b61ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>BEYBREW</div>
        <div style={{ width: '60px', height: '1px', background: 'linear-gradient(90deg,transparent,#00d4ff,transparent)', margin: '4px auto' }} />
        <div style={{ fontSize: '7px', color: 'var(--color-accent)', letterSpacing: '0.22em', fontWeight: 600 }}>BEYBLADE X DECK · {formatLabel}</div>
      </div>
      {profile && <ProfileSection profile={profile} bladerName={bladerName} />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {Array(beybladeCount).fill(null).map((_, i) => (
          <ComboRow key={i} combo={combos[i]} accent={getLineColor(combos[i]?.blade)} />
        ))}
      </div>
      <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,transparent,var(--color-border))' }} />
        <span style={{ fontSize: '7px', color: 'var(--color-text-muted)', letterSpacing: '0.18em', fontWeight: 600 }}>BEYBLADEBREW.COM</span>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,var(--color-border),transparent)' }} />
      </div>
    </div>
  );
}

DeckWidget.propTypes = {
  combos: PropTypes.array.isRequired,
  beybladeCount: PropTypes.number.isRequired,
  format: PropTypes.string,
  profile: PropTypes.object,
  bladerName: PropTypes.string,
};

export default DeckWidget;
