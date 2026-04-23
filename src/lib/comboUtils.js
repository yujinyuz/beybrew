import { BEYBLADE_DB, getStats } from '../constants';

export const STAT_DEFS = [
  { key: 'attack',          label: 'ATTACK',  abbr: 'ATK', gradient: 'linear-gradient(90deg,#1565c0,#00d4ff)', color: 'var(--color-stat-atk)', limit: 2 },
  { key: 'defense',         label: 'DEFENSE', abbr: 'DEF', gradient: 'linear-gradient(90deg,#2e7d32,#00e676)', color: 'var(--color-stat-def)', limit: 2 },
  { key: 'stamina',         label: 'STAMINA', abbr: 'STA', gradient: 'linear-gradient(90deg,#e65100,#ffcc02)', color: 'var(--color-stat-sta)', limit: 2 },
  { key: 'xDash',           label: 'X-DASH',  abbr: 'XD',  gradient: 'linear-gradient(90deg,#b71c1c,#ff6d00)', color: 'var(--color-stat-xd)',  limit: 1 },
  { key: 'burstResistance', label: 'BURST',   abbr: 'BR',  gradient: 'linear-gradient(90deg,#4a148c,#aa00ff)', color: 'var(--color-stat-br)',  limit: 1 },
];

export function parseSharedBeys(rawBeys) {
  return rawBeys.map((bey) => {
    const [
      blade, ratchet, bit,
      assistBlade = '', lockChip = '',
      bladeMode = '0', assistBladeMode = '0', bitMode = '0',
      overBlade = '',
    ] = bey.split(',');
    return {
      blade, ratchet, bit, assistBlade, lockChip, overBlade,
      bladeMode: Number(bladeMode),
      assistBladeMode: Number(assistBladeMode),
      bitMode: Number(bitMode),
    };
  });
}

export function getComboStats(combo) {
  const { blade, assistBlade, overBlade, ratchet, bit, bladeMode = 0, assistBladeMode = 0, bitMode = 0 } = combo || {};
  const bladeStats     = getStats(blade, bladeMode);
  const assistStats    = getStats(assistBlade, assistBladeMode);
  const overBladeStats = getStats(overBlade);
  const ratchetStats   = getStats(ratchet);
  const bitStats       = getStats(bit, bitMode);
  return {
    attack:          (bladeStats.attack || 0) + (assistStats.attack || 0) + (overBladeStats.attack || 0) + (ratchetStats.attack || 0) + (bitStats.attack || 0),
    defense:         (bladeStats.defense || 0) + (assistStats.defense || 0) + (overBladeStats.defense || 0) + (ratchetStats.defense || 0) + (bitStats.defense || 0),
    stamina:         (bladeStats.stamina || 0) + (assistStats.stamina || 0) + (overBladeStats.stamina || 0) + (ratchetStats.stamina || 0) + (bitStats.stamina || 0),
    xDash:           bitStats.xDash || 0,
    burstResistance: bitStats.burstResistance || 0,
  };
}

export function getComboName(combo) {
  const { blade, assistBlade, overBlade, ratchet, bit, lockChip } = combo || {};
  const isCXLine   = BEYBLADE_DB[blade]?.line === 'CX';
  const isFourPart = BEYBLADE_DB[blade]?.fourPartCX;
  return [
    isCXLine && lockChip ? lockChip : null,
    blade,
    isCXLine && isFourPart ? (BEYBLADE_DB[overBlade]?.alias || null) : null,
    isCXLine ? BEYBLADE_DB[assistBlade]?.alias : null,
    BEYBLADE_DB[ratchet]?.altname,
    BEYBLADE_DB[bit]?.alias,
  ].filter(Boolean).join(' ');
}

const ARCHETYPES = [
  {
    key: 'Rusher',
    emoji: '⚡',
    flavor: 'Built for the stadium-out',
    color: '#ff4444',
    score: ({ atk, xd }) => atk * 0.5 + xd * 0.5,
  },
  {
    key: 'Berserker',
    emoji: '🔥',
    flavor: 'All-in, no safety net',
    color: '#e91e63',
    score: ({ atk, def, sta }) => atk * 0.6 + (1 - def) * 0.2 + (1 - sta) * 0.2,
  },
  {
    key: 'Fortress',
    emoji: '🛡️',
    flavor: 'Absorbs everything',
    color: '#1565c0',
    score: ({ def, burst }) => def * 0.5 + burst * 0.5,
  },
  {
    key: 'Ironwall',
    emoji: '💎',
    flavor: 'Nearly impossible to KO',
    color: '#7b1fa2',
    score: ({ def, burst }) => def * 0.35 + burst * 0.65,
  },
  {
    key: 'Endurance',
    emoji: '⏳',
    flavor: 'Spins forever',
    color: 'var(--color-stat-sta)',
    score: ({ sta, def }) => sta * 0.7 + def * 0.3,
  },
  {
    key: 'Counter',
    emoji: '🔄',
    flavor: 'Absorb and punish',
    color: '#00bcd4',
    score: ({ def, atk, burst }) => def * 0.5 + atk * 0.3 + burst * 0.2,
  },
  {
    key: 'Specialist',
    emoji: '💨',
    flavor: 'Speed is the only strategy',
    color: '#ff7043',
    score: ({ xd, atk }) => xd * 0.8 + atk * 0.2,
  },
  {
    key: 'Tactician',
    emoji: '🧠',
    flavor: 'No weakness, no blind spot',
    color: '#78909c',
    score: ({ atk, def, sta, xd, burst }) => {
      const vals = [atk, def, sta, xd, burst];
      const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
      const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
      return 1 - Math.sqrt(variance) / 0.5;
    },
  },
];

const STAT_LIMITS = Object.fromEntries(STAT_DEFS.map(d => [d.key, d.limit]));

export function getDeckProfile(beyblades) {
  const filled = beyblades.filter(b => b?.blade);
  if (filled.length === 0) return null;

  const totals = { attack: 0, defense: 0, stamina: 0, xDash: 0, burstResistance: 0 };
  filled.forEach(combo => {
    const s = getComboStats(combo);
    totals.attack += s.attack;
    totals.defense += s.defense;
    totals.stamina += s.stamina;
    totals.xDash += s.xDash;
    totals.burstResistance += s.burstResistance;
  });

  const n = filled.length;
  const avg = {
    attack: totals.attack / n,
    defense: totals.defense / n,
    stamina: totals.stamina / n,
    xDash: totals.xDash / n,
    burstResistance: totals.burstResistance / n,
  };

  const norm = {
    atk: avg.attack / STAT_LIMITS.attack,
    def: avg.defense / STAT_LIMITS.defense,
    sta: avg.stamina / STAT_LIMITS.stamina,
    xd: avg.xDash / STAT_LIMITS.xDash,
    burst: avg.burstResistance / STAT_LIMITS.burstResistance,
  };

  let best = ARCHETYPES[0];
  let bestScore = -Infinity;
  for (const archetype of ARCHETYPES) {
    const s = archetype.score(norm);
    if (s > bestScore) { bestScore = s; best = archetype; }
  }

  return { archetype: best.key, emoji: best.emoji, flavor: best.flavor, color: best.color, averageStats: avg };
}
