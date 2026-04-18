import React, { forwardRef } from 'react';
import { BEYBLADE_DB, LIMITED_FORMAT, getStats } from '../constants';

const ACCENT_COLORS = ['#00d4ff', '#7b61ff', '#ffa040'];

const STAT_DEFS = [
  { key: 'attack',          label: 'ATTACK',  gradient: 'linear-gradient(90deg,#1565c0,#00d4ff)', color: '#00d4ff', limit: 2 },
  { key: 'defense',         label: 'DEFENSE', gradient: 'linear-gradient(90deg,#2e7d32,#00e676)', color: '#00e676', limit: 2 },
  { key: 'stamina',         label: 'STAMINA', gradient: 'linear-gradient(90deg,#e65100,#ffcc02)', color: '#ffcc02', limit: 2 },
  { key: 'xDash',           label: 'X-DASH',  gradient: 'linear-gradient(90deg,#b71c1c,#ff6d00)', color: '#ff6d00', limit: 1 },
  { key: 'burstResistance', label: 'BURST',   gradient: 'linear-gradient(90deg,#4a148c,#aa00ff)', color: '#aa00ff', limit: 1 },
];

const DOT_BG = {
  backgroundImage: 'radial-gradient(rgba(0,212,255,0.06) 1px, transparent 1px)',
  backgroundSize: '20px 20px',
};

function getComboStats(combo) {
  const { blade, assistBlade, ratchet, bit, bladeMode = 0, assistBladeMode = 0, bitMode = 0 } = combo || {};
  const bladeStats   = getStats(blade, bladeMode);
  const assistStats  = getStats(assistBlade, assistBladeMode);
  const ratchetStats = getStats(ratchet);
  const bitStats     = getStats(bit, bitMode);
  return {
    attack:          (bladeStats.attack          || 0) + (assistStats.attack          || 0) + (ratchetStats.attack          || 0) + (bitStats.attack          || 0),
    defense:         (bladeStats.defense         || 0) + (assistStats.defense         || 0) + (ratchetStats.defense         || 0) + (bitStats.defense         || 0),
    stamina:         (bladeStats.stamina         || 0) + (assistStats.stamina         || 0) + (ratchetStats.stamina         || 0) + (bitStats.stamina         || 0),
    xDash:           bitStats.xDash           || 0,
    burstResistance: bitStats.burstResistance || 0,
  };
}

function getComboName(combo) {
  const { blade, assistBlade, ratchet, bit, lockChip } = combo || {};
  const isCXLine = BEYBLADE_DB[blade]?.line === 'CX';
  return [
    isCXLine && lockChip ? lockChip : null,
    blade,
    isCXLine ? BEYBLADE_DB[assistBlade]?.alias : null,
    BEYBLADE_DB[ratchet]?.altname,
    BEYBLADE_DB[bit]?.alias,
  ].filter(Boolean).join(' ');
}

function StatBars({ stats, barHeight = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {STAT_DEFS.map(({ key, label, gradient, color, limit }) => {
        const value = stats[key] || 0;
        const pct = Math.min(100, value / limit);
        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '6.5px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', width: '50px', flexShrink: 0 }}>{label}</span>
            <div style={{ flex: 1, height: `${barHeight}px`, borderRadius: '2px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: gradient, borderRadius: '2px' }} />
            </div>
            <span style={{ fontSize: '6.5px', color, fontWeight: 700, width: '24px', textAlign: 'right' }}>{value}</span>
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

function ComboRow({ combo, accent }) {
  const { blade, lockChip } = combo || {};
  const isCXLine = BEYBLADE_DB[blade]?.line === 'CX';
  const stats = getComboStats(combo);
  const name = getComboName(combo);

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
        {blade && BEYBLADE_DB[blade]?.image && (
          <img
            src={`/images/${BEYBLADE_DB[blade].image}`}
            alt={blade}
            style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'contain', background: '#0f1e2e', border: `2px solid ${accent}80` }}
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
        <StatBars stats={stats} barHeight={3} />
      </div>
    </div>
  );
}

const ExportCard = forwardRef(function ExportCard({ beyblades, beybladeCount, format, comboIndex }, ref) {
  const formatLabel = format === LIMITED_FORMAT ? 'LIMITED' : 'STANDARD';

  if (comboIndex != null) {
    const combo = beyblades[comboIndex] || {};
    const { blade, lockChip } = combo;
    const isCXLine = BEYBLADE_DB[blade]?.line === 'CX';
    const stats = getComboStats(combo);
    const name = getComboName(combo);
    const spinType = BEYBLADE_DB[blade]?.spinType;
    const bitType = BEYBLADE_DB[combo.bit]?.type;
    const accent = '#00d4ff';

    return (
      <div ref={ref} style={{ ...DOT_BG, background: '#080c18', width: '320px', borderRadius: '16px', border: `1px solid ${accent}33`, borderLeft: `3px solid ${accent}`, padding: '20px', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
        <div style={{ fontSize: '7px', color: 'rgba(0,212,255,0.6)', letterSpacing: '0.25em', fontWeight: 700, marginBottom: '14px' }}>BEYBREW · COMBO</div>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ position: 'relative', width: '68px', height: '68px', flexShrink: 0 }}>
            {blade && BEYBLADE_DB[blade]?.image && (
              <img
                src={`/images/${BEYBLADE_DB[blade].image}`}
                alt={blade}
                style={{ width: '68px', height: '68px', borderRadius: '50%', objectFit: 'contain', background: '#0f1e2e', border: `2px solid ${accent}80` }}
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
          <ComboRow key={i} combo={beyblades[i]} accent={ACCENT_COLORS[i % ACCENT_COLORS.length]} />
        ))}
      </div>
      <Footer />
    </div>
  );
});

export default ExportCard;
