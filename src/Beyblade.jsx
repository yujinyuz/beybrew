import React, { useEffect, useState } from 'react';
import { BEYBLADE_DB, LIMITED_FORMAT } from './constants';

function StatsBar({ label, amount, gradient, glowColor, limit = 1 }) {
  const pct = Math.min(100, (amount || 0) / limit);
  const [width, setWidth] = useState('0%');

  useEffect(() => {
    setWidth('0%');
    const t = setTimeout(() => setWidth(`${pct}%`), 40);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1.5">
        <span
          className="text-xs uppercase tracking-wider"
          style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.12em' }}
        >
          {label}
        </span>
        <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--color-text)' }}>
          {amount || 0}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-stat-track)' }}>
        <div
          className="h-full rounded-full"
          style={{
            width,
            background: gradient,
            boxShadow: `0 0 6px ${glowColor}`,
            transition: 'width 0.75s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </div>
    </div>
  );
}

function Beyblade({ blade, assistBlade, ratchet, bit, format }) {
  const comboPoints =
    (BEYBLADE_DB[blade]?.points || 0) +
    (BEYBLADE_DB[ratchet]?.points || 0) +
    (BEYBLADE_DB[bit]?.points || 0);

  const attackTotal =
    (BEYBLADE_DB[blade]?.attack || 0) +
    (BEYBLADE_DB[assistBlade]?.attack || 0) +
    (BEYBLADE_DB[ratchet]?.attack || 0) +
    (BEYBLADE_DB[bit]?.attack || 0);

  const defenseTotal =
    (BEYBLADE_DB[blade]?.defense || 0) +
    (BEYBLADE_DB[assistBlade]?.defense || 0) +
    (BEYBLADE_DB[ratchet]?.defense || 0) +
    (BEYBLADE_DB[bit]?.defense || 0);

  const staminaTotal =
    (BEYBLADE_DB[blade]?.stamina || 0) +
    (BEYBLADE_DB[assistBlade]?.stamina || 0) +
    (BEYBLADE_DB[ratchet]?.stamina || 0) +
    (BEYBLADE_DB[bit]?.stamina || 0);

  const xDashTotal = BEYBLADE_DB[bit]?.xDash || 0;
  const burstResistanceTotal = BEYBLADE_DB[bit]?.burstResistance || 0;

  const isCXLine = BEYBLADE_DB[blade]?.line === 'CX';
  const comboName = [
    blade || '—',
    isCXLine ? (BEYBLADE_DB[assistBlade]?.alias || '') : '',
    BEYBLADE_DB[ratchet]?.altname || '',
    BEYBLADE_DB[bit]?.alias || '—',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <p className="text-xs mb-4 font-mono" style={{ color: 'var(--color-text-muted)' }}>
        <span style={{ color: 'var(--color-accent)', fontWeight: 700, fontFamily: 'var(--font-heading)', fontSize: '0.65rem', letterSpacing: '0.1em' }}>
          COMBO{' '}
        </span>
        {comboName}
      </p>

      <StatsBar label="Attack"          amount={attackTotal}          gradient="linear-gradient(90deg,#1565c0,#00d4ff)" glowColor="rgba(0,212,255,0.35)"   limit={2} />
      <StatsBar label="Defense"         amount={defenseTotal}         gradient="linear-gradient(90deg,#2e7d32,#00e676)" glowColor="rgba(0,230,118,0.3)"    limit={2} />
      <StatsBar label="Stamina"         amount={staminaTotal}         gradient="linear-gradient(90deg,#e65100,#ffcc02)" glowColor="rgba(255,180,0,0.3)"    limit={2} />
      <StatsBar label="Xtreme Dash"     amount={xDashTotal}           gradient="linear-gradient(90deg,#b71c1c,#ff6d00)" glowColor="rgba(255,109,0,0.35)"   />
      <StatsBar label="Burst Resistance" amount={burstResistanceTotal} gradient="linear-gradient(90deg,#4a148c,#aa00ff)" glowColor="rgba(170,0,255,0.3)"   />

      {format === LIMITED_FORMAT && (
        <div className="mt-3 flex items-center gap-2">
          <span
            className="text-xs uppercase tracking-wider"
            style={{ color: 'var(--color-text-muted)', letterSpacing: '0.12em' }}
          >
            Combo Points
          </span>
          <span
            className="text-sm font-bold"
            style={{ color: 'var(--color-accent-2)', fontFamily: 'var(--font-heading)' }}
          >
            {comboPoints}
          </span>
        </div>
      )}
    </div>
  );
}

export default Beyblade;
