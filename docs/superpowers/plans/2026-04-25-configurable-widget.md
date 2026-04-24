# Configurable Widget Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace 7 separate widget components with 2 configurable ones (`ConfigurableDeckWidget` and `ConfigurableComboWidget`) used for both image generation and iframe embeds.

**Architecture:** A shared config object `{ aspectRatio, showProfile, showStatBars, showPartThumbnails }` drives both components. App.jsx renders them for PNG export; EmbedApp.jsx renders them for iframes with options encoded in URL params. ShareModal gets a config UI instead of preset widget buttons.

**Tech Stack:** React, inline styles (no CSS modules), `modern-screenshot` (domToPng), `lz-string` for embed token compression.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/components/widgets/ConfigurableDeckWidget.jsx` | Card + story deck, all 4 config options |
| Create | `src/components/widgets/ConfigurableComboWidget.jsx` | Card + story single combo, 3 config options |
| Modify | `src/App.jsx` | Swap imports, add widgetConfig state, simplify download handlers, replace style dropdowns with config panel |
| Modify | `src/EmbedApp.jsx` | Read new URL params, render configurable widgets |
| Modify | `src/components/ShareModal.jsx` | Replace preset widget picker with scope + config controls |
| Modify | `src/lib/shareUrl.js` | Update `buildEmbedUrl` to accept config object |
| Delete | `src/components/widgets/DeckWidget.jsx` | Replaced |
| Delete | `src/components/widgets/StoryDeckWidget.jsx` | Replaced |
| Delete | `src/components/widgets/StoryComboWidget.jsx` | Replaced |
| Delete | `src/components/widgets/SingleComboWidget.jsx` | Replaced |
| Delete | `src/components/widgets/CompactListWidget.jsx` | Replaced |
| Delete | `src/components/widgets/CompactImageWidget.jsx` | Replaced |
| Delete | `src/components/widgets/AllCombosWidget.jsx` | Replaced |

---

## Task 1: Create `ConfigurableDeckWidget`

**Files:**
- Create: `src/components/widgets/ConfigurableDeckWidget.jsx`

- [ ] **Step 1: Create the file**

```jsx
import PropTypes from 'prop-types';
import { BEYBLADE_DB, getLineColor, getPartImage } from '../../constants';
import { getComboStats, getComboName, STAT_DEFS } from '../../lib/comboUtils';
import ComboTypeBadges from '../ComboTypeBadges';

const DOT_BG = {
  backgroundImage: 'radial-gradient(var(--color-grid) 1px, transparent 1px)',
  backgroundSize: '20px 20px',
};

const STAT_LIMITS = Object.fromEntries(STAT_DEFS.map(d => [d.key, d.limit]));
const CIRCUMFERENCE = 2 * Math.PI * 12;

function ProfileSection({ profile, bladerName }) {
  return (
    <div style={{ padding: '10px 12px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', marginBottom: '12px', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '6px', color: 'var(--color-accent)', letterSpacing: '0.2em', fontWeight: 700 }}>DECK PROFILE</span>
        {bladerName && (
          <span style={{ fontSize: '7px', color: 'var(--color-text-muted)' }}>
            Blader: <span style={{ color: 'var(--color-text)', fontWeight: 700 }}>{bladerName}</span>
          </span>
        )}
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
                  <circle cx="14" cy="14" r="10" fill="none" strokeWidth="3"
                    strokeDasharray={CIRCUMFERENCE} strokeDashoffset={offset}
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
    <div style={{
      background: 'var(--color-surface)',
      border: `1px solid ${accent}33`,
      borderLeft: `3px solid ${accent}`,
      borderRadius: '10px',
      padding: '10px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      ...(isStory ? { flex: 1, overflow: 'hidden', minHeight: 0 } : {}),
    }}>
      <div style={{ position: 'relative', width: `${imageSize}px`, height: `${imageSize}px`, flexShrink: 0 }}>
        {blade && bladeImage ? (
          <img src={`/images/${bladeImage}`} alt={blade}
            style={{ width: `${imageSize}px`, height: `${imageSize}px`, borderRadius: '50%', objectFit: 'contain', background: 'var(--color-surface-2)', border: `2px solid ${accent}80` }}
          />
        ) : (
          <div style={{ width: `${imageSize}px`, height: `${imageSize}px`, borderRadius: '50%', background: 'var(--color-surface-2)', border: `2px solid ${accent}80` }} />
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
          {name || '—'}
        </div>
        <div style={{ marginBottom: '4px' }}>
          <ComboTypeBadges blade={blade} bit={combo?.bit} size={14} />
        </div>
        {showPartThumbnails && parts.length > 0 && (
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
        )}
        {showStatBars && (
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
        )}
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
        <div style={{ fontSize: isStory ? '26px' : '22px', fontWeight: 900, letterSpacing: '0.08em', background: 'linear-gradient(90deg,#00d4ff,#7b61ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>BEYBREW</div>
        <div style={{ width: '60px', height: '1px', background: 'linear-gradient(90deg,transparent,#00d4ff,transparent)', margin: `${isStory ? 6 : 4}px auto` }} />
        <div style={{ fontSize: isStory ? '9px' : '7px', color: 'var(--color-accent)', letterSpacing: '0.22em', fontWeight: 600 }}>BEYBLADE X DECK · {formatLabel}</div>
      </div>
      {showProfile && profile && !isStory && <ProfileSection profile={profile} bladerName={bladerName} />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: isStory ? '10px' : '8px', ...(isStory ? { flex: 1, overflow: 'hidden', minHeight: 0 } : {}) }}>
        {Array(beybladeCount).fill(null).map((_, i) => (
          <ComboRow
            key={i}
            combo={combos[i]}
            showStatBars={showStatBars}
            showPartThumbnails={showPartThumbnails}
            imageSize={imageSize}
            isStory={isStory}
            accent={getLineColor(combos[i]?.blade)}
          />
        ))}
      </div>
      {showProfile && profile && isStory && <ProfileSection profile={profile} bladerName={bladerName} />}
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
```

- [ ] **Step 2: Verify lint passes**

```bash
cd /Users/traf/Sources/github.com/yujinyuz/bbx-mixer && bun run lint 2>&1 | grep -A2 "ConfigurableDeckWidget"
```

Expected: no errors for the new file (it may show errors for other files — ignore those for now).

- [ ] **Step 3: Commit**

```bash
git add src/components/widgets/ConfigurableDeckWidget.jsx
git commit -m "feat(widget): add ConfigurableDeckWidget"
```

---

## Task 2: Create `ConfigurableComboWidget`

**Files:**
- Create: `src/components/widgets/ConfigurableComboWidget.jsx`

- [ ] **Step 1: Create the file**

```jsx
import PropTypes from 'prop-types';
import { BEYBLADE_DB, getLineColor, getPartImage } from '../../constants';
import { getComboStats, getComboName, STAT_DEFS } from '../../lib/comboUtils';
import ComboTypeBadges from '../ComboTypeBadges';

const DOT_BG = {
  backgroundImage: 'radial-gradient(var(--color-grid) 1px, transparent 1px)',
  backgroundSize: '20px 20px',
};

function ConfigurableComboWidget({ combo, config }) {
  const {
    aspectRatio = 'card',
    showStatBars = true,
    showPartThumbnails = true,
  } = config || {};
  const isStory = aspectRatio === 'story';

  const { blade, overBlade, lockChip, ratchet, assistBlade } = combo || {};
  const ACCENT = getLineColor(blade);
  const isCXLine = BEYBLADE_DB[blade]?.line === 'CX';
  const overBladeImage = overBlade ? BEYBLADE_DB[overBlade]?.image : null;
  const bladeImage = getPartImage(blade, combo?.bladeMode ?? 0);
  const stats = getComboStats(combo);
  const name = getComboName(combo);

  const parts = [
    ...(isCXLine && assistBlade ? [{ part: assistBlade, modeIndex: combo?.assistBladeMode ?? 0 }] : []),
    { part: ratchet, modeIndex: 0 },
    { part: combo?.bit, modeIndex: combo?.bitMode ?? 0 },
  ].filter(({ part }) => part && BEYBLADE_DB[part]?.image);

  if (isStory) {
    return (
      <div style={{ ...DOT_BG, background: 'var(--color-bg)', width: '540px', height: '960px', fontFamily: 'system-ui,-apple-system,sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '32px 36px', boxSizing: 'border-box' }}>
        <div style={{ fontSize: '11px', color: 'var(--color-accent)', letterSpacing: '0.25em', fontWeight: 700, marginBottom: '24px', flexShrink: 0 }}>
          BEYBREW · COMBO
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: '0 0 280px', position: 'relative' }}>
          <div style={{ position: 'absolute', width: '240px', height: '240px', borderRadius: '50%', border: '1px solid var(--color-border)', boxShadow: `0 0 60px ${ACCENT}14` }} />
          <div style={{ position: 'absolute', width: '210px', height: '210px', borderRadius: '50%', border: '1px dashed var(--color-border)' }} />
          <div style={{ position: 'relative', width: '180px', height: '180px', flexShrink: 0 }}>
            {blade && bladeImage ? (
              <img src={`/images/${bladeImage}`} alt={blade}
                style={{ width: '180px', height: '180px', borderRadius: '50%', objectFit: 'contain', background: 'var(--color-surface)', border: `3px solid ${ACCENT}80`, boxShadow: `0 0 40px ${ACCENT}22` }}
              />
            ) : (
              <div style={{ width: '180px', height: '180px', borderRadius: '50%', background: 'var(--color-surface)', border: `3px solid ${ACCENT}80` }} />
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
        </div>
        {showPartThumbnails && parts.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px', flexShrink: 0 }}>
            {parts.map(({ part, modeIndex }) => {
              const image = getPartImage(part, modeIndex);
              return (
                <div key={part} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--color-surface)', border: `1px solid ${ACCENT}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={`/images/${image}`} alt={part} style={{ width: '52px', height: '52px', objectFit: 'contain' }} />
                  </div>
                  <span style={{ fontSize: '7px', color: 'var(--color-text-muted)', textAlign: 'center', maxWidth: '80px', letterSpacing: '0.05em' }}>{part}</span>
                </div>
              );
            })}
          </div>
        )}
        <div style={{ height: '1px', background: `linear-gradient(90deg,transparent,${ACCENT}4d,transparent)`, margin: '20px 0', flexShrink: 0 }} />
        <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--color-text)', lineHeight: 1.1, letterSpacing: '0.02em', marginBottom: '10px', flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {name || '—'}
        </div>
        <div style={{ marginBottom: '24px', flexShrink: 0 }}>
          <ComboTypeBadges blade={blade} bit={combo?.bit} size={20} />
        </div>
        {showStatBars && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flexShrink: 0 }}>
            {STAT_DEFS.map(({ key, label, gradient, color, limit }) => {
              const value = stats[key] || 0;
              const pct = Math.min(100, value / limit);
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '0.12em', width: '80px', flexShrink: 0 }}>{label}</span>
                  <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: 'var(--color-stat-track)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: gradient, borderRadius: '3px' }} />
                  </div>
                  <span style={{ fontSize: '13px', color, fontWeight: 700, width: '28px', textAlign: 'right' }}>{value}</span>
                </div>
              );
            })}
          </div>
        )}
        <div style={{ flex: 1 }} />
        <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,transparent,var(--color-border))' }} />
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '0.18em', fontWeight: 600 }}>BEYBLADEBREW.COM</span>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,var(--color-border),transparent)' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...DOT_BG, background: 'var(--color-bg)', borderRadius: '14px', border: `1px solid ${ACCENT}33`, borderLeft: `3px solid ${ACCENT}`, padding: '18px', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
      <div style={{ fontSize: '6.5px', color: 'var(--color-accent)', letterSpacing: '0.25em', fontWeight: 700, marginBottom: '12px' }}>BEYBREW · COMBO</div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div style={{ position: 'relative', width: '60px', height: '60px', flexShrink: 0 }}>
          {blade && bladeImage && (
            <img src={`/images/${bladeImage}`} alt={blade}
              style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'contain', background: 'var(--color-surface)', border: `2px solid ${ACCENT}80` }}
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
        <div style={{ minWidth: 0, paddingTop: '4px' }}>
          <div style={{ fontSize: '13px', fontWeight: 900, color: 'var(--color-text)', lineHeight: 1.25, letterSpacing: '0.02em', wordBreak: 'break-word' }}>{name || '—'}</div>
          <div style={{ marginTop: '4px' }}>
            <ComboTypeBadges blade={blade} bit={combo?.bit} size={16} />
          </div>
        </div>
      </div>
      {showPartThumbnails && parts.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap', marginBottom: '12px' }}>
          {parts.map(({ part, modeIndex }) => {
            const image = getPartImage(part, modeIndex);
            return (
              <div key={part} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-surface)', border: `1px solid ${ACCENT}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={`/images/${image}`} alt={part} style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                </div>
                <span style={{ fontSize: '6px', color: 'var(--color-text-muted)', textAlign: 'center', letterSpacing: '0.05em', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '100%' }}>{part}</span>
              </div>
            );
          })}
        </div>
      )}
      {showStatBars && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {STAT_DEFS.map(({ key, label, gradient, color, limit }) => {
            const value = stats[key] || 0;
            const pct = Math.min(100, value / limit);
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '6.5px', color: 'var(--color-text-muted)', letterSpacing: '0.12em', width: '48px', flexShrink: 0 }}>{label}</span>
                <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: 'var(--color-stat-track)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: gradient, borderRadius: '2px' }} />
                </div>
                <span style={{ fontSize: '6.5px', color, fontWeight: 700, width: '20px', textAlign: 'right' }}>{value}</span>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,transparent,var(--color-border))' }} />
        <span style={{ fontSize: '7px', color: 'var(--color-text-muted)', letterSpacing: '0.18em', fontWeight: 600 }}>BEYBLADEBREW.COM</span>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,var(--color-border),transparent)' }} />
      </div>
    </div>
  );
}

ConfigurableComboWidget.propTypes = {
  combo: PropTypes.object,
  config: PropTypes.shape({
    aspectRatio: PropTypes.oneOf(['card', 'story']),
    showStatBars: PropTypes.bool,
    showPartThumbnails: PropTypes.bool,
  }),
};

export default ConfigurableComboWidget;
```

- [ ] **Step 2: Verify lint passes**

```bash
cd /Users/traf/Sources/github.com/yujinyuz/bbx-mixer && bun run lint 2>&1 | grep -A2 "ConfigurableComboWidget"
```

Expected: no errors for the new file.

- [ ] **Step 3: Commit**

```bash
git add src/components/widgets/ConfigurableComboWidget.jsx
git commit -m "feat(widget): add ConfigurableComboWidget"
```

---

## Task 3: Update `shareUrl.js` — new `buildEmbedUrl`

**Files:**
- Modify: `src/lib/shareUrl.js`

- [ ] **Step 1: Replace `buildEmbedUrl`**

Replace the entire `buildEmbedUrl` function (lines 34-46) with:

```js
export function buildEmbedUrl(beyblades, beybladeCount, format, scope, config, comboIndex = 0) {
  const beys =
    scope === 'combo'
      ? beyblades[comboIndex]
        ? [serializeBey(beyblades[comboIndex])]
        : []
      : beyblades.map(serializeBey);
  const payload = {
    scope,
    format,
    beynum: beybladeCount,
    beys,
    ar: config.aspectRatio || 'card',
    profile: config.showProfile ? '1' : '0',
    stats: config.showStatBars ? '1' : '0',
    thumbs: config.showPartThumbnails ? '1' : '0',
    combo: comboIndex,
  };
  const token = LZString.compressToEncodedURIComponent(JSON.stringify(payload));
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set('d', token);
  return url.toString();
}
```

- [ ] **Step 2: Verify lint**

```bash
cd /Users/traf/Sources/github.com/yujinyuz/bbx-mixer && bun run lint src/lib/shareUrl.js
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/shareUrl.js
git commit -m "feat(share): update buildEmbedUrl to accept config object"
```

---

## Task 4: Update `EmbedApp.jsx`

**Files:**
- Modify: `src/EmbedApp.jsx`

- [ ] **Step 1: Rewrite EmbedApp.jsx**

Replace the entire file contents with:

```jsx
import ConfigurableDeckWidget from './components/widgets/ConfigurableDeckWidget';
import ConfigurableComboWidget from './components/widgets/ConfigurableComboWidget';
import { parseSharedBeys, getDeckProfile } from './lib/comboUtils';
import { parseShareToken } from './lib/shareUrl';
import { getFormat } from './constants';

function EmbedApp() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('d');

  let scope, config, comboIndex, format, beynum, combos;

  if (token) {
    const data = parseShareToken(token) ?? {};
    scope = data.scope || 'deck';
    format = getFormat(data.format || 'standard');
    beynum = Math.max(1, Number(data.beynum) || 1);
    combos = parseSharedBeys(data.beys || []);
    comboIndex = Math.max(0, Number(data.combo) || 0);
    config = {
      aspectRatio: data.ar || 'card',
      showProfile: data.profile !== '0',
      showStatBars: data.stats !== '0',
      showPartThumbnails: data.thumbs !== '0',
    };
  } else {
    scope = params.get('scope') || 'deck';
    format = getFormat(params.get('format') || 'standard');
    beynum = Math.max(1, Number(params.get('beynum')) || 1);
    combos = parseSharedBeys(params.getAll('beys'));
    comboIndex = Math.max(0, Number(params.get('combo')) || 0);
    config = {
      aspectRatio: params.get('ar') || 'card',
      showProfile: params.get('profile') !== '0',
      showStatBars: params.get('stats') !== '0',
      showPartThumbnails: params.get('thumbs') !== '0',
    };
  }

  const style = { margin: 0, padding: 0, background: 'transparent' };
  const profile = getDeckProfile(combos);

  if (scope === 'combo') {
    return <div style={style}><ConfigurableComboWidget combo={combos[comboIndex]} config={config} /></div>;
  }
  return (
    <div style={style}>
      <ConfigurableDeckWidget
        combos={combos}
        beybladeCount={beynum}
        format={format}
        profile={config.showProfile ? profile : undefined}
        config={config}
      />
    </div>
  );
}

export default EmbedApp;
```

- [ ] **Step 2: Verify lint**

```bash
cd /Users/traf/Sources/github.com/yujinyuz/bbx-mixer && bun run lint src/EmbedApp.jsx
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/EmbedApp.jsx
git commit -m "feat(embed): use configurable widgets with URL param config"
```

---

## Task 5: Update `App.jsx` — config state and download handlers

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Swap widget imports (lines 13-20)**

Remove these 7 import lines:
```js
import DeckWidget from './components/widgets/DeckWidget';
import SingleComboWidget from './components/widgets/SingleComboWidget';
import CompactListWidget from './components/widgets/CompactListWidget';
import CompactImageWidget from './components/widgets/CompactImageWidget';
import StoryComboWidget from './components/widgets/StoryComboWidget';
import StoryDeckWidget from './components/widgets/StoryDeckWidget';
import AllCombosWidget from './components/widgets/AllCombosWidget';
```

Replace with:
```js
import ConfigurableDeckWidget from './components/widgets/ConfigurableDeckWidget';
import ConfigurableComboWidget from './components/widgets/ConfigurableComboWidget';
```

- [ ] **Step 2: Replace style state with config state (around lines 286-300)**

Remove these state declarations and their associated useEffect:
```js
const [deckExportStyle, setDeckExportStyle] = useState(() => localStorage.getItem('bbx-deck-style') || 'deck');
const [showDeckStyleMenu, setShowDeckStyleMenu] = useState(false);
const [comboExportStyle, setComboExportStyle] = useState(() => localStorage.getItem('bbx-combo-style') || 'single');
const [showComboStyleMenu, setShowComboStyleMenu] = useState(null);

useEffect(() => {
  if (!showDeckStyleMenu && showComboStyleMenu === null) return;
  const close = () => { setShowDeckStyleMenu(false); setShowComboStyleMenu(null); };
  window.addEventListener('click', close);
  return () => window.removeEventListener('click', close);
}, [showDeckStyleMenu, showComboStyleMenu]);
```

Add in their place:
```js
const [widgetConfig, setWidgetConfig] = useState(() => {
  try {
    return JSON.parse(localStorage.getItem('bbx-widget-config')) || {
      aspectRatio: 'card', showProfile: true, showStatBars: true, showPartThumbnails: true,
    };
  } catch {
    return { aspectRatio: 'card', showProfile: true, showStatBars: true, showPartThumbnails: true };
  }
});
const [showConfigPanel, setShowConfigPanel] = useState(null); // null | 'deck' | number (combo index)

const updateWidgetConfig = useCallback((patch) => {
  setWidgetConfig((prev) => {
    const next = { ...prev, ...patch };
    localStorage.setItem('bbx-widget-config', JSON.stringify(next));
    return next;
  });
}, []);
```

- [ ] **Step 3: Replace `handleDownloadDeck` (lines 302-351)**

Remove the existing `handleDownloadDeck` function entirely and replace with:

```js
const handleDownloadDeck = useCallback(() => {
  const { aspectRatio = 'card', showProfile = true } = widgetConfig;
  const isStory = aspectRatio === 'story';
  setDownloadError(null);
  setIsDownloading(true);
  setShowConfigPanel(null);

  const container = document.createElement('div');
  container.style.cssText = isStory
    ? 'position:fixed;left:-9999px;top:0;width:540px;height:960px'
    : 'position:fixed;left:-9999px;top:0;width:480px';
  document.body.appendChild(container);
  const root = createRoot(container);
  flushSync(() => root.render(
    <ConfigurableDeckWidget
      combos={beyblades}
      beybladeCount={beybladeCount}
      format={currentFormat}
      profile={showProfile ? getDeckProfile(beyblades) : undefined}
      bladerName={showProfile ? bladerName : undefined}
      config={widgetConfig}
    />
  ));
  domToPng(container, { backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim(), scale: isStory ? 4 : 3 })
    .then((dataUrl) => {
      const slug = isStory ? 'story_deck' : 'deck';
      const filename = `beybrew_${slug}_${Date.now()}.png`;
      setGenerateImagePreview({ dataUrl, filename });
    })
    .catch((e) => setDownloadError(`Error: ${e?.message ?? String(e)}\n${navigator.userAgent}`))
    .finally(() => { root.unmount(); container.remove(); setIsDownloading(false); });
}, [widgetConfig, beyblades, beybladeCount, currentFormat, bladerName]);
```

- [ ] **Step 4: Replace `handleDownloadCombo` (lines 353-386)**

Remove the existing `handleDownloadCombo` function entirely and replace with:

```js
const handleDownloadCombo = useCallback((index) => {
  const { aspectRatio = 'card' } = widgetConfig;
  const isStory = aspectRatio === 'story';
  setDownloadError(null);
  setIsDownloading(true);
  setShowConfigPanel(null);

  const container = document.createElement('div');
  container.style.cssText = isStory
    ? 'position:fixed;left:-9999px;top:0;width:540px;height:960px'
    : 'position:fixed;left:-9999px;top:0;width:320px';
  document.body.appendChild(container);
  const root = createRoot(container);
  flushSync(() => root.render(
    <ConfigurableComboWidget combo={beyblades[index]} config={widgetConfig} />
  ));
  domToPng(container, { backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim(), scale: isStory ? 4 : 3 })
    .then((dataUrl) => {
      const slug = isStory ? 'story_combo' : 'combo';
      const filename = `beybrew_${slug}${index + 1}_${Date.now()}.png`;
      setGenerateImagePreview({ dataUrl, filename });
    })
    .catch((e) => setDownloadError(`Error: ${e?.message ?? String(e)}\n${navigator.userAgent}`))
    .finally(() => { root.unmount(); container.remove(); setIsDownloading(false); });
}, [widgetConfig, beyblades]);
```

- [ ] **Step 5: Verify lint**

```bash
cd /Users/traf/Sources/github.com/yujinyuz/bbx-mixer && bun run lint src/App.jsx 2>&1 | head -40
```

Expected: errors only for the UI sections that still reference `showDeckStyleMenu`, `showComboStyleMenu`, `deckExportStyle`, `comboExportStyle` — these will be fixed in Task 6.

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx
git commit -m "refactor(app): replace per-style state with widgetConfig, simplify download handlers"
```

---

## Task 6: Update `App.jsx` — replace style dropdown menus with config panel

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add `WidgetConfigPanel` component before `App` function**

Add this component definition immediately before the `function App()` line:

```jsx
function WidgetConfigPanel({ mode, config, onConfigChange, onGenerate, onClose }) {
  const surfaceStyle = {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '16px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
  };
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={onClose}
    >
      <div style={{ ...surfaceStyle, width: '100%', maxWidth: '320px', padding: '20px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '12px', fontWeight: 900, letterSpacing: '0.08em', color: 'var(--color-accent)' }}>
            IMAGE OPTIONS
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '18px', lineHeight: 1 }}>×</button>
        </div>

        {/* Aspect ratio */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '0.12em', fontWeight: 700, marginBottom: '6px' }}>LAYOUT</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[{ id: 'card', label: 'Card' }, { id: 'story', label: 'Story 9:16' }].map(({ id, label }) => (
              <button key={id} onClick={() => onConfigChange({ aspectRatio: id })}
                style={{
                  flex: 1, padding: '8px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
                  fontFamily: 'var(--font-heading)', letterSpacing: '0.06em', cursor: 'pointer',
                  background: config.aspectRatio === id ? 'var(--color-accent-dim)' : 'var(--color-surface-2)',
                  border: config.aspectRatio === id ? '1px solid rgba(0,212,255,0.4)' : '1px solid var(--color-border)',
                  color: config.aspectRatio === id ? 'var(--color-accent)' : 'var(--color-text-muted)',
                }}
              >{label}</button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '0.12em', fontWeight: 700, marginBottom: '8px' }}>CONTENT</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              ...(mode === 'deck' ? [{ key: 'showProfile', label: 'Deck Profile' }] : []),
              { key: 'showStatBars', label: 'Stat Bars' },
              { key: 'showPartThumbnails', label: 'Part Thumbnails' },
            ].map(({ key, label }) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={config[key] ?? true}
                  onChange={(e) => onConfigChange({ [key]: e.target.checked })}
                  style={{ width: '14px', height: '14px', cursor: 'pointer', accentColor: 'var(--color-accent)' }}
                />
                <span style={{ fontSize: '12px', color: 'var(--color-text)', fontWeight: 600 }}>{label}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={onGenerate}
          style={{
            width: '100%', padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: 900,
            fontFamily: 'var(--font-heading)', letterSpacing: '0.08em', cursor: 'pointer',
            background: 'var(--color-accent-dim)', border: '1px solid rgba(0,212,255,0.4)', color: 'var(--color-accent)',
          }}
        >
          GENERATE IMAGE
        </button>
      </div>
    </div>
  );
}
```

Add PropTypes below the component:
```jsx
WidgetConfigPanel.propTypes = {
  mode: PropTypes.oneOf(['deck', 'combo']).isRequired,
  config: PropTypes.object.isRequired,
  onConfigChange: PropTypes.func.isRequired,
  onGenerate: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};
```

- [ ] **Step 2: Replace the deck download button group (around lines 874-951)**

Find the `<div className="flex flex-col items-center gap-1">` wrapping the deck download button + chevron + style menu. Replace the entire split-button + dropdown construct with a single button:

```jsx
<div className="flex flex-col items-center gap-1">
  <button
    onClick={() => setShowConfigPanel('deck')}
    disabled={isDownloading}
    className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all hover:brightness-110"
    style={{
      background: 'var(--color-accent-dim)',
      border: '1px solid rgba(0,212,255,0.4)',
      color: 'var(--color-accent)',
      fontFamily: 'var(--font-heading)',
      opacity: isDownloading ? 0.6 : 1,
      cursor: isDownloading ? 'not-allowed' : 'pointer',
    }}
  >
    <IconDownload />
    {isDownloading ? 'Generating…' : 'Generate Deck Image'}
  </button>
</div>
```

- [ ] **Step 3: Replace the combo download button group (around lines 629-700)**

Find the split-button for combo download (the `<div style={{ position: 'relative', display: 'inline-flex' }}>` containing the download button, the chevron button, and `showComboStyleMenu` dropdown). Replace the entire construct with:

```jsx
<button
  onClick={() => setShowConfigPanel(index)}
  disabled={isDownloading}
  title="Generate combo image"
  aria-label={`Generate image for combo ${index + 1}`}
  className="flex items-center justify-center w-7 h-7 transition-all hover:brightness-110"
  style={{
    background: 'var(--color-accent-dim)',
    border: '1px solid rgba(0,212,255,0.25)',
    borderRadius: '6px',
    color: 'var(--color-accent)',
    opacity: isDownloading ? 0.4 : 1,
    cursor: isDownloading ? 'not-allowed' : 'pointer',
  }}
>
  <IconDownload />
</button>
```

- [ ] **Step 4: Add the config panel and its callbacks to the JSX return**

In the JSX return, find where `{generateImagePreview && ...}` is rendered (around line 1020). Add the config panel render just before it:

```jsx
{showConfigPanel !== null && (
  <WidgetConfigPanel
    mode={showConfigPanel === 'deck' ? 'deck' : 'combo'}
    config={widgetConfig}
    onConfigChange={updateWidgetConfig}
    onGenerate={() => {
      if (showConfigPanel === 'deck') {
        handleDownloadDeck();
      } else {
        handleDownloadCombo(showConfigPanel);
      }
    }}
    onClose={() => setShowConfigPanel(null)}
  />
)}
```

- [ ] **Step 5: Verify lint passes cleanly**

```bash
cd /Users/traf/Sources/github.com/yujinyuz/bbx-mixer && bun run lint src/App.jsx
```

Expected: 0 errors.

- [ ] **Step 6: Start dev server and test**

```bash
cd /Users/traf/Sources/github.com/yujinyuz/bbx-mixer && bun dev
```

Open http://localhost:5173. Verify:
- "Generate Deck Image" button opens the config panel
- Toggling aspect ratio / checkboxes works
- Clicking "GENERATE IMAGE" produces a PNG in the result modal
- The combo download button on each combo card opens the config panel
- Story (9:16) produces a tall image; Card produces a normal height image

- [ ] **Step 7: Commit**

```bash
git add src/App.jsx
git commit -m "feat(app): replace style dropdown menus with configurable image options panel"
```

---

## Task 7: Update `ShareModal.jsx`

**Files:**
- Modify: `src/components/ShareModal.jsx`

- [ ] **Step 1: Replace the entire ShareModal**

Replace the file contents with:

```jsx
import { useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { buildShareUrl, buildEmbedUrl } from '../lib/shareUrl';

const DEFAULT_CONFIG = {
  aspectRatio: 'card',
  showProfile: true,
  showStatBars: true,
  showPartThumbnails: true,
};

function calcEmbedHeight(scope, aspectRatio, beybladeCount) {
  if (aspectRatio === 'story') return 960;
  if (scope === 'combo') return 280;
  return 130 + beybladeCount * 80;
}

const surfaceStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '16px',
  boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
};

function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);
  useEffect(() => () => clearTimeout(timerRef.current), []);
  return (
    <button
      onClick={handleCopy}
      style={{
        padding: '6px 14px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
        cursor: 'pointer', fontFamily: 'var(--font-heading)', letterSpacing: '0.08em',
        background: copied ? 'rgba(0,230,118,0.15)' : 'var(--color-accent-dim)',
        border: copied ? '1px solid rgba(0,230,118,0.4)' : '1px solid rgba(0,212,255,0.4)',
        color: copied ? 'var(--color-stat-def)' : 'var(--color-accent)',
        transition: 'all 0.2s',
      }}
    >
      {copied ? 'Copied!' : label}
    </button>
  );
}
CopyButton.propTypes = { text: PropTypes.string.isRequired, label: PropTypes.string };

function ShareModal({ beyblades, beybladeCount, currentFormat, bladerName, onClose }) {
  const [activeTab, setActiveTab] = useState('share');
  const [scope, setScope] = useState('deck');
  const [comboIndex, setComboIndex] = useState(0);
  const [embedConfig, setEmbedConfig] = useState(DEFAULT_CONFIG);

  useEffect(() => {
    if (comboIndex >= beybladeCount) setComboIndex(Math.max(0, beybladeCount - 1));
  }, [beybladeCount, comboIndex]);

  const updateEmbedConfig = useCallback((patch) => setEmbedConfig((prev) => ({ ...prev, ...patch })), []);

  const shareUrl = buildShareUrl(beyblades, beybladeCount, currentFormat?.id, bladerName);
  const embedUrl = buildEmbedUrl(beyblades, beybladeCount, currentFormat?.id, scope, embedConfig, comboIndex);
  const embedHeight = calcEmbedHeight(scope, embedConfig.aspectRatio, beybladeCount);
  const iframeSnippet = `<iframe\n  src="${embedUrl}"\n  width="100%" height="${embedHeight}"\n  frameborder="0" style="border:none">\n</iframe>`;

  const tabStyle = (tab) => ({
    flex: 1, padding: '10px', fontSize: '12px', fontWeight: 700,
    letterSpacing: '0.08em', fontFamily: 'var(--font-heading)',
    cursor: 'pointer', border: 'none', borderRadius: '8px',
    background: activeTab === tab ? 'var(--color-accent-dim)' : 'transparent',
    color: activeTab === tab ? 'var(--color-accent)' : 'var(--color-text-muted)',
    transition: 'all 0.15s',
  });

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '16px', overflowY: 'auto' }}
      onClick={onClose}
    >
      <div style={{ ...surfaceStyle, width: '100%', maxWidth: '520px', padding: '24px', maxHeight: 'calc(100dvh - 32px)', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', fontWeight: 900, letterSpacing: '0.08em', color: 'var(--color-accent)' }}>SHARE DECK</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '18px', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: 'flex', gap: '4px', background: 'var(--color-surface-2)', borderRadius: '10px', padding: '4px', marginBottom: '20px' }}>
          <button style={tabStyle('share')} onClick={() => setActiveTab('share')}>SHARE LINK</button>
          <button style={tabStyle('embed')} onClick={() => setActiveTab('embed')}>EMBED</button>
        </div>

        {activeTab === 'share' && (
          <div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>Share this link to let others view your deck.</p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                readOnly value={shareUrl}
                style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', fontSize: '11px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              />
              <CopyButton text={shareUrl} />
            </div>
          </div>
        )}

        {activeTab === 'embed' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Scope */}
            <div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '0.12em', marginBottom: '6px', fontWeight: 700 }}>CONTENT</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[{ id: 'deck', label: 'Full Deck' }, { id: 'combo', label: 'Single Combo' }].map(({ id, label }) => (
                  <button key={id} onClick={() => setScope(id)}
                    style={{
                      flex: 1, padding: '8px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
                      fontFamily: 'var(--font-heading)', letterSpacing: '0.06em', cursor: 'pointer',
                      background: scope === id ? 'var(--color-accent-dim)' : 'var(--color-surface-2)',
                      border: scope === id ? '1px solid rgba(0,212,255,0.4)' : '1px solid var(--color-border)',
                      color: scope === id ? 'var(--color-accent)' : 'var(--color-text-muted)',
                    }}
                  >{label}</button>
                ))}
              </div>
            </div>

            {/* Combo picker */}
            {scope === 'combo' && (
              <div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '0.12em', marginBottom: '6px', fontWeight: 700 }}>COMBO</div>
                <select
                  value={comboIndex}
                  onChange={(e) => setComboIndex(Number(e.target.value))}
                  style={{ padding: '7px 10px', borderRadius: '8px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', fontSize: '12px', cursor: 'pointer' }}
                >
                  {Array(beybladeCount).fill(null).map((_, i) => (
                    <option key={i} value={i}>Combo {i + 1}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Aspect ratio */}
            <div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '0.12em', marginBottom: '6px', fontWeight: 700 }}>LAYOUT</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[{ id: 'card', label: 'Card' }, { id: 'story', label: 'Story 9:16' }].map(({ id, label }) => (
                  <button key={id} onClick={() => updateEmbedConfig({ aspectRatio: id })}
                    style={{
                      flex: 1, padding: '8px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
                      fontFamily: 'var(--font-heading)', letterSpacing: '0.06em', cursor: 'pointer',
                      background: embedConfig.aspectRatio === id ? 'var(--color-accent-dim)' : 'var(--color-surface-2)',
                      border: embedConfig.aspectRatio === id ? '1px solid rgba(0,212,255,0.4)' : '1px solid var(--color-border)',
                      color: embedConfig.aspectRatio === id ? 'var(--color-accent)' : 'var(--color-text-muted)',
                    }}
                  >{label}</button>
                ))}
              </div>
            </div>

            {/* Content toggles */}
            <div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '0.12em', marginBottom: '8px', fontWeight: 700 }}>OPTIONS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  ...(scope === 'deck' ? [{ key: 'showProfile', label: 'Deck Profile' }] : []),
                  { key: 'showStatBars', label: 'Stat Bars' },
                  { key: 'showPartThumbnails', label: 'Part Thumbnails' },
                ].map(({ key, label }) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={embedConfig[key] ?? true}
                      onChange={(e) => updateEmbedConfig({ [key]: e.target.checked })}
                      style={{ width: '14px', height: '14px', cursor: 'pointer', accentColor: 'var(--color-accent)' }}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--color-text)', fontWeight: 600 }}>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Live preview */}
            <div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '0.12em', marginBottom: '6px', fontWeight: 700 }}>PREVIEW</div>
              <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                <iframe
                  key={embedUrl}
                  src={embedUrl}
                  style={{ width: '100%', height: `${Math.min(embedHeight, 400)}px`, border: 'none', display: 'block' }}
                  title="Widget preview"
                />
              </div>
            </div>

            {/* Code snippet */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '0.12em', fontWeight: 700 }}>EMBED CODE</div>
                <CopyButton text={iframeSnippet} label="Copy Code" />
              </div>
              <pre style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '10px 12px', fontSize: '10px', color: 'var(--color-text-muted)', fontFamily: 'monospace', overflowX: 'auto', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {iframeSnippet}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

ShareModal.propTypes = {
  beyblades: PropTypes.array.isRequired,
  beybladeCount: PropTypes.number.isRequired,
  currentFormat: PropTypes.object.isRequired,
  bladerName: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};

export default ShareModal;
```

- [ ] **Step 2: Verify lint**

```bash
cd /Users/traf/Sources/github.com/yujinyuz/bbx-mixer && bun run lint src/components/ShareModal.jsx
```

Expected: 0 errors.

- [ ] **Step 3: Test embed tab in dev server**

Open http://localhost:5173, click Share, go to EMBED tab. Verify:
- Scope toggle (Full Deck / Single Combo) switches preview
- Layout toggle (Card / Story 9:16) updates preview height
- Checkboxes update the preview
- "Copy Code" copies the correct iframe snippet

- [ ] **Step 4: Commit**

```bash
git add src/components/ShareModal.jsx
git commit -m "feat(share): replace widget preset picker with configurable embed options"
```

---

## Task 8: Delete old widget files

**Files:**
- Delete: `src/components/widgets/DeckWidget.jsx`
- Delete: `src/components/widgets/StoryDeckWidget.jsx`
- Delete: `src/components/widgets/StoryComboWidget.jsx`
- Delete: `src/components/widgets/SingleComboWidget.jsx`
- Delete: `src/components/widgets/CompactListWidget.jsx`
- Delete: `src/components/widgets/CompactImageWidget.jsx`
- Delete: `src/components/widgets/AllCombosWidget.jsx`

- [ ] **Step 1: Delete the files**

```bash
rm src/components/widgets/DeckWidget.jsx \
   src/components/widgets/StoryDeckWidget.jsx \
   src/components/widgets/StoryComboWidget.jsx \
   src/components/widgets/SingleComboWidget.jsx \
   src/components/widgets/CompactListWidget.jsx \
   src/components/widgets/CompactImageWidget.jsx \
   src/components/widgets/AllCombosWidget.jsx
```

- [ ] **Step 2: Verify full lint passes with no import errors**

```bash
cd /Users/traf/Sources/github.com/yujinyuz/bbx-mixer && bun run lint
```

Expected: 0 errors. If there are any "cannot find module" errors, check for remaining imports of the deleted files and remove them.

- [ ] **Step 3: Final smoke test in dev server**

Open http://localhost:5173. Verify:
- App loads with no console errors
- Generate Deck Image → config panel → generates PNG
- Combo download → config panel → generates PNG
- Share → Embed tab → preview and copy code work
- Story mode produces 9:16 image in both deck and combo generation

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore(widget): delete replaced widget components"
```
