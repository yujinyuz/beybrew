import { BEYBLADE_DB, getStats } from '../constants';

export const STAT_DEFS = [
  { key: 'attack',          label: 'ATTACK',  gradient: 'linear-gradient(90deg,#1565c0,#00d4ff)', color: '#00d4ff', limit: 2 },
  { key: 'defense',         label: 'DEFENSE', gradient: 'linear-gradient(90deg,#2e7d32,#00e676)', color: '#00e676', limit: 2 },
  { key: 'stamina',         label: 'STAMINA', gradient: 'linear-gradient(90deg,#e65100,#ffcc02)', color: '#ffcc02', limit: 2 },
  { key: 'xDash',           label: 'X-DASH',  gradient: 'linear-gradient(90deg,#b71c1c,#ff6d00)', color: '#ff6d00', limit: 1 },
  { key: 'burstResistance', label: 'BURST',   gradient: 'linear-gradient(90deg,#4a148c,#aa00ff)', color: '#aa00ff', limit: 1 },
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
