import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { BEYBLADE_DB, getStats } from './constants';

function StatsBar({ label, shortLabel, amount, gradient, glowColor, limit = 1, delta, deltaVisible }) {
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
          {shortLabel ? (
            <>
              <span className="sm:hidden">{shortLabel}</span>
              <span className="hidden sm:inline">{label}</span>
            </>
          ) : label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: delta > 0 ? '#00e676' : '#ff4455',
              opacity: delta !== undefined && delta !== 0 && deltaVisible ? 1 : 0,
              transition: 'opacity 0.4s ease',
              minWidth: '28px',
              textAlign: 'right',
            }}
          >
            {delta !== undefined && delta !== 0 ? (delta > 0 ? `+${delta}` : delta) : ''}
          </span>
          <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--color-text)' }}>
            {amount || 0}
          </span>
        </div>
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

StatsBar.propTypes = {
  label: PropTypes.string.isRequired,
  shortLabel: PropTypes.string,
  amount: PropTypes.number,
  gradient: PropTypes.string.isRequired,
  glowColor: PropTypes.string.isRequired,
  limit: PropTypes.number,
  delta: PropTypes.number,
  deltaVisible: PropTypes.bool,
};

function Beyblade({ blade, assistBlade, lockChip, overBlade, ratchet, bit, format, bladeMode = 0, assistBladeMode = 0, bitMode = 0 }) {
  const bladeStats     = getStats(blade, bladeMode);
  const assistStats    = getStats(assistBlade, assistBladeMode);
  const overBladeStats = getStats(overBlade);
  const ratchetStats   = getStats(ratchet);
  const bitStats       = getStats(bit, bitMode);

  const comboPoints =
    (BEYBLADE_DB[blade]?.points || 0) +
    (BEYBLADE_DB[ratchet]?.points || 0) +
    (BEYBLADE_DB[bit]?.points || 0);

  const attackTotal =
    (bladeStats.attack || 0) +
    (assistStats.attack || 0) +
    (overBladeStats.attack || 0) +
    (ratchetStats.attack || 0) +
    (bitStats.attack || 0);

  const defenseTotal =
    (bladeStats.defense || 0) +
    (assistStats.defense || 0) +
    (overBladeStats.defense || 0) +
    (ratchetStats.defense || 0) +
    (bitStats.defense || 0);

  const staminaTotal =
    (bladeStats.stamina || 0) +
    (assistStats.stamina || 0) +
    (overBladeStats.stamina || 0) +
    (ratchetStats.stamina || 0) +
    (bitStats.stamina || 0);

  const xDashTotal = bitStats.xDash || 0;
  const burstResistanceTotal = bitStats.burstResistance || 0;

  const prevTotalsRef = useRef(null);
  const isMounted = useRef(false);
  const [flashState, setFlashState] = useState({ deltas: {}, visible: false });

  useEffect(() => {
    const current = {
      attack: attackTotal,
      defense: defenseTotal,
      stamina: staminaTotal,
      xDash: xDashTotal,
      burstResistance: burstResistanceTotal,
    };

    if (!isMounted.current) {
      isMounted.current = true;
      prevTotalsRef.current = current;
      return;
    }

    const prev = prevTotalsRef.current || {};
    const deltas = {};
    for (const [stat, val] of Object.entries(current)) {
      const d = val - (prev[stat] || 0);
      if (d !== 0) deltas[stat] = d;
    }
    prevTotalsRef.current = current;

    if (Object.keys(deltas).length === 0) return;

    setFlashState({ deltas, visible: true });
    const t = setTimeout(() => setFlashState(s => ({ ...s, visible: false })), 1600);
    return () => clearTimeout(t);
  }, [attackTotal, defenseTotal, staminaTotal, xDashTotal, burstResistanceTotal]);

  const isCXLine   = BEYBLADE_DB[blade]?.line === 'CX';
  const isFourPart = BEYBLADE_DB[blade]?.fourPartCX;
  const comboName = [
    isCXLine && lockChip ? lockChip : null,
    blade || '—',
    isCXLine && isFourPart ? (BEYBLADE_DB[overBlade]?.alias || null) : null,
    isCXLine ? (BEYBLADE_DB[assistBlade]?.alias || '') : '',
    BEYBLADE_DB[ratchet]?.altname || '',
    BEYBLADE_DB[bit]?.alias || '—',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
      <p className="text-xs mb-4 font-mono" style={{ color: 'var(--color-text-muted)' }}>
        <span style={{ color: 'var(--color-accent)', fontWeight: 700, fontFamily: 'var(--font-heading)', fontSize: '0.65rem', letterSpacing: '0.1em' }}>
          COMBO{' '}
        </span>
        {comboName}
      </p>

      <StatsBar label="Attack"           amount={attackTotal}          gradient="linear-gradient(90deg,#1565c0,#00d4ff)" glowColor="rgba(0,212,255,0.35)"   limit={2} delta={flashState.deltas.attack}          deltaVisible={flashState.visible} />
      <StatsBar label="Defense"          amount={defenseTotal}         gradient="linear-gradient(90deg,#2e7d32,#00e676)" glowColor="rgba(0,230,118,0.3)"    limit={2} delta={flashState.deltas.defense}         deltaVisible={flashState.visible} />
      <StatsBar label="Stamina"          amount={staminaTotal}         gradient="linear-gradient(90deg,#e65100,#ffcc02)" glowColor="rgba(255,180,0,0.3)"    limit={2} delta={flashState.deltas.stamina}         deltaVisible={flashState.visible} />
      <StatsBar label="Xtreme Dash"      shortLabel="X-Dash"    amount={xDashTotal}           gradient="linear-gradient(90deg,#b71c1c,#ff6d00)" glowColor="rgba(255,109,0,0.35)"            delta={flashState.deltas.xDash}            deltaVisible={flashState.visible} />
      <StatsBar label="Burst Resistance" shortLabel="Burst Res." amount={burstResistanceTotal} gradient="linear-gradient(90deg,#4a148c,#aa00ff)" glowColor="rgba(170,0,255,0.3)"            delta={flashState.deltas.burstResistance}  deltaVisible={flashState.visible} />

      {format?.rules?.some(r => r.type === 'pointBudget') && (
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

Beyblade.propTypes = {
  blade: PropTypes.string,
  assistBlade: PropTypes.string,
  lockChip: PropTypes.string,
  overBlade: PropTypes.string,
  ratchet: PropTypes.string,
  bit: PropTypes.string,
  format: PropTypes.string,
  bladeMode: PropTypes.number,
  assistBladeMode: PropTypes.number,
  bitMode: PropTypes.number,
};

export default Beyblade;
