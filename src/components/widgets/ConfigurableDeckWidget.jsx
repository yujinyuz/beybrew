import PropTypes from 'prop-types';
import { BEYBLADE_DB, getLineColor, getPartImage } from '../../constants';
import { getComboStats, getComboName, STAT_DEFS } from '../../lib/comboUtils';
import ComboTypeBadges from '../ComboTypeBadges';

const DOT_BG = {
  backgroundImage: 'radial-gradient(var(--color-grid) 1px, transparent 1px)',
  backgroundSize: '20px 20px',
};

const STAT_LIMITS = Object.fromEntries(STAT_DEFS.map((def) => [def.key, def.limit]));
const CIRCUMFERENCE = 2 * Math.PI * 12;

function ProfileSection({ profile, bladerName }) {
  return (
    <div
      style={{
        padding: '10px 12px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '10px',
        marginBottom: '12px',
        flexShrink: 0,
      }}
    >
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
            const offset = CIRCUMFERENCE * (1 - pct / 100);
            return (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <svg width="28" height="28" viewBox="0 0 28 28">
                  <circle cx="14" cy="14" r="10" fill="none" strokeWidth="3" style={{ stroke: 'var(--color-stat-track)' }} />
                  <circle
                    cx="14"
                    cy="14"
                    r="10"
                    fill="none"
                    strokeWidth="3"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform="rotate(-90 14 14)"
                    style={{ stroke: color }}
                  />
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
  profile: PropTypes.object.isRequired,
  bladerName: PropTypes.string,
};

function ComboRow({ combo, showStatBars, showPartThumbnails, imageSize, isStory, accent }) {
  const { blade, overBlade, lockChip, ratchet, assistBlade } = combo || {};
  const isCXLine = BEYBLADE_DB[blade]?.line === 'CX';
  const overBladeImage = overBlade ? BEYBLADE_DB[overBlade]?.image : null;
  const bladeImage = getPartImage(blade, combo?.bladeMode ?? 0);
  const stats = getComboStats(combo);
  const name = getComboName(combo);
  const statHeight = isStory ? (imageSize >= 100 ? 5 : imageSize >= 64 ? 4 : 3) : 4;
  const statGap = isStory ? (imageSize >= 100 ? 6 : imageSize >= 64 ? 4 : 3) : 4;

  const parts = [
    ...(isCXLine && assistBlade ? [{ part: assistBlade, modeIndex: combo?.assistBladeMode ?? 0 }] : []),
    { part: ratchet, modeIndex: 0 },
    { part: combo?.bit, modeIndex: combo?.bitMode ?? 0 },
  ].filter(({ part }) => part && BEYBLADE_DB[part]?.image);

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: `1px solid ${accent}33`,
        borderRadius: '10px',
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        ...(isStory ? { flex: 1, overflow: 'hidden', minHeight: 0 } : {}),
      }}
    >
      <div style={{ position: 'relative', width: `${imageSize}px`, height: `${imageSize}px`, flexShrink: 0 }}>
        {blade && bladeImage ? (
          <img
            src={`/images/${bladeImage}`}
            alt={blade}
            style={{ width: `${imageSize}px`, height: `${imageSize}px`, borderRadius: '50%', objectFit: 'contain', background: 'var(--color-surface-2)', border: `2px solid ${accent}80` }}
          />
        ) : (
          <div style={{ width: `${imageSize}px`, height: `${imageSize}px`, borderRadius: '50%', background: 'var(--color-surface-2)', border: `2px solid ${accent}80` }} />
        )}
        {isCXLine && overBladeImage ? (
          <img
            src={`/images/${overBladeImage}`}
            alt={overBlade}
            style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '65%', height: '65%', objectFit: 'contain' }}
          />
        ) : null}
        {isCXLine && lockChip && BEYBLADE_DB[lockChip]?.image ? (
          <img
            src={`/images/${BEYBLADE_DB[lockChip].image}`}
            alt={lockChip}
            style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '38%', height: '38%', objectFit: 'contain' }}
          />
        ) : null}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-text)', marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {name || '—'}
        </div>
        <div style={{ marginBottom: '4px' }}>
          <ComboTypeBadges blade={blade} bit={combo?.bit} size={14} />
        </div>
        {showPartThumbnails && parts.length > 0 ? (
          <div style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
            {parts.map(({ part, modeIndex }) => {
              const image = getPartImage(part, modeIndex);
              return (
                <div key={part} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-surface-2)', border: `1px solid ${accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={`/images/${image}`} alt={part} style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                  </div>
                  <span style={{ fontSize: '5px', color: 'var(--color-text-muted)', textAlign: 'center', letterSpacing: '0.05em' }}>{part}</span>
                </div>
              );
            })}
          </div>
        ) : null}
        {showStatBars ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${statGap}px` }}>
            {STAT_DEFS.map(({ key, label, gradient, color, limit }) => {
              const value = stats[key] || 0;
              const pct = Math.min(100, value / limit);
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '6.5px', color: 'var(--color-text-muted)', letterSpacing: '0.12em', width: '48px', flexShrink: 0 }}>{label}</span>
                  <div style={{ flex: 1, height: `${statHeight}px`, borderRadius: '2px', background: 'var(--color-stat-track)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: gradient, borderRadius: '2px' }} />
                  </div>
                  <span style={{ fontSize: '6.5px', color, fontWeight: 700, width: '20px', textAlign: 'right' }}>{value}</span>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

ComboRow.propTypes = {
  combo: PropTypes.object,
  showStatBars: PropTypes.bool.isRequired,
  showPartThumbnails: PropTypes.bool.isRequired,
  imageSize: PropTypes.number.isRequired,
  isStory: PropTypes.bool.isRequired,
  accent: PropTypes.string.isRequired,
};

function ConfigurableDeckWidget({ combos, beybladeCount, format, profile, bladerName, config }) {
  const {
    aspectRatio = 'card',
    showProfile = true,
    showStatBars = true,
    showPartThumbnails = true,
  } = config || {};
  const isStory = aspectRatio === 'story';
  const formatLabel = format?.name?.toUpperCase() ?? 'STANDARD';

  let imageSize;
  if (isStory) {
    if (beybladeCount <= 3) imageSize = 100;
    else if (beybladeCount <= 6) imageSize = 64;
    else imageSize = 44;
  } else {
    imageSize = 44;
  }

  const containerStyle = isStory
    ? { width: '540px', height: '960px', display: 'flex', flexDirection: 'column', padding: '28px 32px', boxSizing: 'border-box', overflow: 'hidden' }
    : { padding: '20px' };

  return (
    <div style={{ ...DOT_BG, background: 'var(--color-bg)', borderRadius: '12px', fontFamily: 'system-ui,-apple-system,sans-serif', ...containerStyle }}>
      <div style={{ textAlign: 'center', marginBottom: isStory ? '20px' : '16px', flexShrink: 0 }}>
        <div style={{ fontSize: isStory ? '26px' : '22px', fontWeight: 900, letterSpacing: '0.08em', color: 'var(--color-accent)' }}>BEYBREW</div>
        <div style={{ width: '60px', height: '1px', background: 'linear-gradient(90deg,transparent,#00d4ff,transparent)', margin: `${isStory ? 6 : 4}px auto` }} />
        <div style={{ fontSize: isStory ? '9px' : '7px', color: 'var(--color-accent)', letterSpacing: '0.22em', fontWeight: 600 }}>BEYBLADE X DECK · {formatLabel}</div>
      </div>
      {showProfile && profile && !isStory ? <ProfileSection profile={profile} bladerName={bladerName} /> : null}
      <div style={{ display: 'flex', flexDirection: 'column', gap: isStory ? '10px' : '8px', ...(isStory ? { flex: 1, overflow: 'hidden', minHeight: 0 } : {}) }}>
        {Array(beybladeCount).fill(null).map((_, index) => (
          <ComboRow
            key={index}
            combo={combos[index]}
            showStatBars={showStatBars}
            showPartThumbnails={showPartThumbnails}
            imageSize={imageSize}
            isStory={isStory}
            accent={getLineColor(combos[index]?.blade)}
          />
        ))}
      </div>
      {showProfile && profile && isStory ? <ProfileSection profile={profile} bladerName={bladerName} /> : null}
      <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,transparent,var(--color-border))' }} />
        <span style={{ fontSize: isStory ? '9px' : '7px', color: 'var(--color-text-muted)', letterSpacing: '0.18em', fontWeight: 600 }}>BEYBLADEBREW.COM</span>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,var(--color-border),transparent)' }} />
      </div>
    </div>
  );
}

ConfigurableDeckWidget.propTypes = {
  combos: PropTypes.array.isRequired,
  beybladeCount: PropTypes.number.isRequired,
  format: PropTypes.object,
  profile: PropTypes.object,
  bladerName: PropTypes.string,
  config: PropTypes.shape({
    aspectRatio: PropTypes.oneOf(['card', 'story']),
    showProfile: PropTypes.bool,
    showStatBars: PropTypes.bool,
    showPartThumbnails: PropTypes.bool,
  }),
};

export default ConfigurableDeckWidget;
