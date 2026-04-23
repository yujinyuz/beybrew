import { BLADES, ASSIST_BLADES, RATCHETS, BITS, LOCK_CHIPS, OVER_BLADES, BEYBLADE_DB, RATCHET_INTEGRATED_BITS, BIT_TO_RATCHET } from './constants';
import { getPartPoints, getPointBudget } from './lib/formatEngine';

function isAllowedByFormat(partName, slot, format) {
  if (!format?.rules) return true;
  for (const rule of format.rules) {
    switch (rule.type) {
      case 'banPart':
        if (rule.names?.includes(partName)) return false;
        break;
      case 'allowedParts':
        if (rule.slot === slot && !rule.names?.includes(partName)) return false;
        break;
      case 'allowedPartTypes':
        if (rule.slot === slot) {
          const partType = BEYBLADE_DB[partName]?.type;
          if (partType && !rule.types?.includes(partType)) return false;
        }
        break;
    }
  }
  return true;
}

function isBannedComboPairing(combo, format) {
  if (!format?.rules) return false;
  return format.rules.some(rule => {
    if (rule.type !== 'banComboPairing') return false;
    return rule.parts.every(({ slot, name }) => combo[slot] === name);
  });
}

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

function buildCombos(count, usedParts = new Set(), usedExclusiveLockChips = new Set(), format = null) {
  const availableBlades = shuffle(BLADES.filter(b => !usedParts.has(b) && isAllowedByFormat(b, 'blade', format)));
  const availableRatchets = shuffle(
    RATCHETS.filter(r => {
      if (!isAllowedByFormat(r, 'ratchet', format)) return false;
      const pairedBit = RATCHET_INTEGRATED_BITS[r];
      if (pairedBit) return !usedParts.has(r) && !usedParts.has(pairedBit);
      return !usedParts.has(r);
    })
  );
  const availableBits = shuffle(BITS.filter(b => !BIT_TO_RATCHET[b] && !usedParts.has(b) && isAllowedByFormat(b, 'bit', format)));
  const availableAssistBlades = shuffle(ASSIST_BLADES.filter(a => !usedParts.has(a) && isAllowedByFormat(a, 'assistBlade', format)));
  const availableOverBlades = shuffle(OVER_BLADES.filter(o => !usedParts.has(o) && isAllowedByFormat(o, 'overBlade', format)));

  const combos = [];
  let bitIdx = 0;
  let assistIdx = 0;
  let overBladeIdx = 0;

  for (let i = 0; i < count; i++) {
    let blade = availableBlades[i] || '';
    const ratchet = availableRatchets[i] || '';
    let bit;

    const integratedBit = RATCHET_INTEGRATED_BITS[ratchet];
    if (integratedBit) {
      bit = isAllowedByFormat(integratedBit, 'bit', format) ? integratedBit : (availableBits[bitIdx++] || '');
    } else {
      bit = availableBits[bitIdx++] || '';
    }

    const isCX = BEYBLADE_DB[blade]?.line === 'CX';
    const isFourPart = BEYBLADE_DB[blade]?.fourPartCX;
    const assistBlade = isCX ? (availableAssistBlades[assistIdx++] || '') : '';
    const lockChip = isCX ? pickLockChip(usedExclusiveLockChips) : '';
    const overBlade = isFourPart ? (availableOverBlades[overBladeIdx++] || '') : '';

    const combo = { blade, assistBlade, lockChip, overBlade, ratchet, bit };

    if (isBannedComboPairing(combo, format)) {
      combo.bit = availableBits[bitIdx++] || bit;
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
