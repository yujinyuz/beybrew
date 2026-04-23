import { BLADES, ASSIST_BLADES, RATCHETS, BITS, LOCK_CHIPS, OVER_BLADES, BEYBLADE_DB, RATCHET_INTEGRATED_BITS, BIT_TO_RATCHET } from './constants';
import { getPartPoints, getPointBudget, isPartDisabled } from './lib/formatEngine';

const EXCLUSIVE_LOCK_CHIPS = new Set(['Valkyrie', 'Emperor']);

function shuffle(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function calcPoints(combos, format) {
  const seen = new Set();
  let total = 0;
  combos.forEach(({ blade, assistBlade, overBlade, ratchet, bit }) => {
    for (const part of [blade, assistBlade, overBlade, ratchet, bit]) {
      if (part && !seen.has(part)) {
        seen.add(part);
        total += getPartPoints(part, format);
      }
    }
  });
  return total;
}

function pickLockChip(usedExclusiveLockChips) {
  const available = LOCK_CHIPS.filter(lc => !EXCLUSIVE_LOCK_CHIPS.has(lc) || !usedExclusiveLockChips.has(lc));
  if (!available.length) return '';
  const picked = available[Math.floor(Math.random() * available.length)];
  if (EXCLUSIVE_LOCK_CHIPS.has(picked)) usedExclusiveLockChips.add(picked);
  return picked;
}

function isBannedPairing(combo, format) {
  if (!format?.rules) return false;
  return format.rules.some(
    r => r.type === 'banComboPairing' && r.parts.every(({ slot, name }) => combo[slot] === name)
  );
}

function allowed(name, slot, usedParts, format) {
  return !isPartDisabled(name, slot, usedParts, format);
}

function buildCombos(count, usedParts = new Set(), usedExclusiveLockChips = new Set(), format = null) {
  const used = [...usedParts];

  const blades = shuffle(BLADES.filter(b => allowed(b, 'blade', used, format)));
  const ratchets = shuffle(RATCHETS.filter(r => {
    if (!allowed(r, 'ratchet', used, format)) return false;
    const paired = RATCHET_INTEGRATED_BITS[r];
    return !paired || allowed(paired, 'bit', used, format);
  }));
  const bits = shuffle(BITS.filter(b => !BIT_TO_RATCHET[b] && allowed(b, 'bit', used, format)));
  const assistBlades = shuffle(ASSIST_BLADES.filter(a => allowed(a, 'assistBlade', used, format)));
  const overBlades = shuffle(OVER_BLADES.filter(o => allowed(o, 'overBlade', used, format)));

  const combos = [];
  let bitIdx = 0;
  let assistIdx = 0;
  let overBladeIdx = 0;

  for (let i = 0; i < count; i++) {
    const blade = blades[i] || '';
    const ratchet = ratchets[i] || '';
    const integratedBit = RATCHET_INTEGRATED_BITS[ratchet];
    const bit = integratedBit || bits[bitIdx++] || '';

    const isCX = BEYBLADE_DB[blade]?.line === 'CX';
    const isFourPart = BEYBLADE_DB[blade]?.fourPartCX;
    const assistBlade = isCX ? (assistBlades[assistIdx++] || '') : '';
    const lockChip = isCX ? pickLockChip(usedExclusiveLockChips) : '';
    const overBlade = isFourPart ? (overBlades[overBladeIdx++] || '') : '';

    const combo = { blade, assistBlade, lockChip, overBlade, ratchet, bit };

    if (!integratedBit && isBannedPairing(combo, format)) {
      const alt = bits[bitIdx++];
      if (alt) combo.bit = alt;
    }

    combos.push(combo);
  }

  return combos;
}

function hasPointBudget(format) {
  return format?.rules?.some(r => r.type === 'pointBudget') ?? false;
}

export function randomizeBeyblades(count, format, userValues = {}, maxAttempts = 20) {
  if (!hasPointBudget(format)) {
    return buildCombos(count, new Set(), new Set(), format);
  }

  const maxPoints = getPointBudget(format, userValues);
  let best = null;
  let bestTotal = Infinity;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const combos = buildCombos(count, new Set(), new Set(), format);
    const total = calcPoints(combos, format);
    if (total <= maxPoints) return combos;
    if (total < bestTotal) {
      bestTotal = total;
      best = combos;
    }
  }

  return best;
}

export function randomizeSingleBeyblade(index, currentBeyblades, format, userValues = {}, maxAttempts = 20) {
  const usedParts = new Set();
  const usedExclusiveLockChips = new Set();
  currentBeyblades.forEach((bey, i) => {
    if (i === index) return;
    if (bey.blade) usedParts.add(bey.blade);
    if (bey.assistBlade) usedParts.add(bey.assistBlade);
    if (bey.overBlade) usedParts.add(bey.overBlade);
    if (bey.ratchet) usedParts.add(bey.ratchet);
    if (bey.bit) usedParts.add(bey.bit);
    if (bey.lockChip && EXCLUSIVE_LOCK_CHIPS.has(bey.lockChip)) usedExclusiveLockChips.add(bey.lockChip);
  });

  if (!hasPointBudget(format)) {
    return buildCombos(1, usedParts, usedExclusiveLockChips, format)[0];
  }

  const maxPoints = getPointBudget(format, userValues);
  const otherPoints = [...usedParts].reduce((sum, part) => sum + getPartPoints(part, format), 0);
  const budget = maxPoints - otherPoints;

  let best = null;
  let bestTotal = Infinity;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const combo = buildCombos(1, usedParts, usedExclusiveLockChips, format)[0];
    const comboPoints = calcPoints([combo], format);
    if (comboPoints <= budget) return combo;
    if (comboPoints < bestTotal) {
      bestTotal = comboPoints;
      best = combo;
    }
  }

  return best;
}
