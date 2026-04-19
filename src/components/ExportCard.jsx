import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { BEYBLADE_DB, LIMITED_FORMAT, getLineColor, getStats } from '../constants';
import { STAT_DEFS, getComboStats, getComboName } from '../lib/comboUtils';

const DOT_BG = {
  backgroundImage: 'radial-gradient(rgba(0,212,255,0.06) 1px, transparent 1px)',
  backgroundSize: '20px 20px',
};

const MODE_STAT_KEYS = ['attack', 'defense', 'stamina'];
const MODE_STAT_COLORS = { attack: '#00d4ff', defense: '#00e676', stamina: '#ffcc02' };

function ModesSection({ combo }) {
  const parts = [
    { name: combo?.blade, modeKey: 'bladeMode' },
    { name: combo?.assistBlade, modeKey: 'assistBladeMode' },
    { name: combo?.bit, modeKey: 'bitMode' },
  ].filter(({ name }) => BEYBLADE_DB[name]?.modes?.length >= 2);

  if (parts.length === 0) return null;

  return (
    <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ fontSize: '6px', color: 'rgba(255,255,255,0.22)', letterSpacing: '0.2em', fontWeight: 700, marginBottom: '6px' }}>MODES</div>
      {parts.map(({ name }) => {
        const modes = BEYBLADE_DB[name].modes;
        return (
          <div key={name} style={{ marginBottom: '5px' }}>
            <div style={{ fontSize: '6px', color: 'rgba(255,255,255,0.35)', marginBottom: '3px', fontWeight: 600 }}>{name}</div>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginBottom: '2px' }}>
              {modes.map((m, i) => (
                <span key={i} style={{ fontSize: '6px', color: 'rgba(0,212,255,0.6)', fontWeight: 700 }}>
                  {i > 0 && <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 3px' }}>·</span>}
                  {m.label}
                </span>
              ))}
            </div>
            {MODE_STAT_KEYS.filter(k => modes.some(m => m[k] != null)).map(stat => (
              <div key={stat} style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '1px' }}>
                <span style={{ fontSize: '5.5px', color: 'rgba(255,255,255,0.25)', width: '32px', letterSpacing: '0.1em' }}>{stat.slice(0, 3).toUpperCase()}</span>
                {modes.map((m, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span style={{ fontSize: '7px', color: 'rgba(255,255,255,0.2)' }}>→</span>}
                    <span style={{ fontSize: '7.5px', fontWeight: 800, color: MODE_STAT_COLORS[stat] }}>{m[stat] ?? '—'}</span>
                  </React.Fragment>
                ))}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

ModesSection.propTypes = {
  combo: PropTypes.object,
};

function StatBars({ stats, altStats = null, barHeight = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {STAT_DEFS.map(({ key, label, gradient, color, limit }) => {
        const value = stats[key] || 0;
        const altValue = altStats ? (altStats[key] || 0) : null;
        const barValue = altValue !== null ? Math.max(value, altValue) : value;
        const pct = Math.min(100, barValue / limit);
        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '6.5px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', width: '50px', flexShrink: 0 }}>{label}</span>
            <div style={{ flex: 1, height: `${barHeight}px`, borderRadius: '2px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: gradient, borderRadius: '2px' }} />
            </div>
            {altValue !== null ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', width: '44px', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '6.5px', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>{value}</span>
                <span style={{ fontSize: '6px', color: 'rgba(255,255,255,0.25)' }}>→</span>
                <span style={{ fontSize: '6.5px', color, fontWeight: 700 }}>{altValue}</span>
              </div>
            ) : (
              <span style={{ fontSize: '6.5px', color, fontWeight: 700, width: '24px', textAlign: 'right' }}>{value}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Footer() {
  return (
    <div style={{ marginTop: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
      <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.08))' }} />
      <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.18em', fontWeight: 600 }}>BEYBLADEBREW.COM</span>
      <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,rgba(255,255,255,0.08),transparent)' }} />
    </div>
  );
}

function getModeAltStats(combo) {
  const checks = [
    { partName: combo?.blade,       modeKey: 'bladeMode' },
    { partName: combo?.assistBlade, modeKey: 'assistBladeMode' },
    { partName: combo?.bit,         modeKey: 'bitMode' },
  ];
  for (const { partName, modeKey } of checks) {
    if (BEYBLADE_DB[partName]?.modes?.length >= 2) {
      return getComboStats({ ...combo, [modeKey]: 1 });
    }
  }
  return null;
}

function ComboRow({ combo, accent }) {
  const { blade, overBlade, lockChip } = combo || {};
  const isCXLine = BEYBLADE_DB[blade]?.line === 'CX';
  const stats = getComboStats({ ...combo, bladeMode: 0, assistBladeMode: 0, bitMode: 0 });
  const altStats = getModeAltStats(combo);
  const name = getComboName(combo);
  const overBladeImage = overBlade ? BEYBLADE_DB[overBlade]?.image : null;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${accent}33`,
      borderLeft: `3px solid ${accent}`,
      borderRadius: '10px',
      padding: '12px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
    }}>
      <div style={{ position: 'relative', width: '52px', height: '52px', flexShrink: 0 }}>
        {blade && getStats(blade, combo?.bladeMode ?? 0)?.image && (
          <img
            src={`/images/${getStats(blade, combo?.bladeMode ?? 0).image}`}
            alt={blade}
            style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'contain', background: '#0f1e2e', border: `2px solid ${accent}80` }}
          />
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
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '10px', fontWeight: 800, color: '#fff', marginBottom: '6px', letterSpacing: '0.03em' }}>{name || '—'}</div>
        <StatBars stats={stats} altStats={altStats} barHeight={3} />
      </div>
    </div>
  );
}

const ExportCard = forwardRef(function ExportCard({ beyblades, beybladeCount, format, comboIndex }, ref) {
  const formatLabel = format === LIMITED_FORMAT ? 'LIMITED' : 'STANDARD';

  if (comboIndex != null) {
    const combo = beyblades[comboIndex] || {};
    const { blade, overBlade, lockChip } = combo;
    const isCXLine = BEYBLADE_DB[blade]?.line === 'CX';
    const stats = getComboStats(combo);
    const name = getComboName(combo);
    const spinType = BEYBLADE_DB[blade]?.spinType;
    const bitType = BEYBLADE_DB[combo.bit]?.type;
    const accent = getLineColor(blade);
    const overBladeImage = overBlade ? BEYBLADE_DB[overBlade]?.image : null;

    return (
      <div ref={ref} style={{ ...DOT_BG, background: '#080c18', width: '320px', borderRadius: '16px', border: `1px solid ${accent}33`, borderLeft: `3px solid ${accent}`, padding: '20px', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
        <div style={{ fontSize: '7px', color: 'rgba(0,212,255,0.6)', letterSpacing: '0.25em', fontWeight: 700, marginBottom: '14px' }}>BEYBREW · COMBO</div>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ position: 'relative', width: '68px', height: '68px', flexShrink: 0 }}>
            {blade && getStats(blade, combo.bladeMode ?? 0)?.image && (
              <img
                src={`/images/${getStats(blade, combo.bladeMode ?? 0).image}`}
                alt={blade}
                style={{ width: '68px', height: '68px', borderRadius: '50%', objectFit: 'contain', background: '#0f1e2e', border: `2px solid ${accent}80` }}
              />
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
          <div>
            <div style={{ fontSize: '16px', fontWeight: 900, color: '#fff', lineHeight: 1.2, letterSpacing: '0.02em' }}>{name || '—'}</div>
            {(spinType || bitType) && (
              <div style={{ fontSize: '7px', color: 'rgba(0,212,255,0.5)', marginTop: '4px', letterSpacing: '0.1em' }}>
                {[spinType && `${spinType.toUpperCase()} SPIN`, bitType && bitType.toUpperCase()].filter(Boolean).join(' · ')}
              </div>
            )}
          </div>
        </div>
        <StatBars stats={stats} barHeight={4} />
        <ModesSection combo={combo} />
        <Footer />
      </div>
    );
  }

  return (
    <div ref={ref} style={{ ...DOT_BG, background: '#080c18', width: '480px', borderRadius: '16px', padding: '24px', fontFamily: 'system-ui,-apple-system,sans-serif', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)', width: '200px', height: '120px', background: 'radial-gradient(ellipse,rgba(0,212,255,0.12),transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '0.08em', background: 'linear-gradient(90deg,#00d4ff,#7b61ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>BEYBREW</div>
        <div style={{ width: '80px', height: '1px', background: 'linear-gradient(90deg,transparent,#00d4ff,transparent)', margin: '6px auto' }} />
        <div style={{ fontSize: '8px', color: 'rgba(0,212,255,0.7)', letterSpacing: '0.25em', fontWeight: 600 }}>BEYBLADE X DECK · {formatLabel}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {Array(beybladeCount).fill(null).map((_, i) => (
          <ComboRow key={i} combo={beyblades[i]} accent={getLineColor(beyblades[i]?.blade)} />
        ))}
      </div>
      <Footer />
    </div>
  );
});

export default ExportCard;
