import { BEYBLADE_DB } from '../constants';
import DEFAULT_PART_POINTS from '../data/formats/part-points.json';

function getPartsFromDeck(deck) {
  const parts = new Set();
  deck.forEach(bey => {
    if (bey.blade) parts.add(bey.blade);
    if (bey.ratchet) parts.add(bey.ratchet);
    if (bey.bit) parts.add(bey.bit);
    if (bey.assistBlade) parts.add(bey.assistBlade);
    if (bey.lockChip) parts.add(bey.lockChip);
    if (bey.overBlade) parts.add(bey.overBlade);
  });
  return [...parts];
}

export function getPartPoints(partName, format) {
  const points = format?.partPoints ?? DEFAULT_PART_POINTS;
  return points[partName] ?? 0;
}

export function getPointBudget(format, userValues = {}) {
  const rule = format?.rules?.find(r => r.type === 'pointBudget');
  if (!rule) return 0;
  return userValues.pointBudget ?? rule.default ?? 0;
}

export function evaluateFormat(deck, format, userValues = {}) {
  if (!format?.rules) return { violations: [] };
  const violations = [];
  const activeDeck = deck.filter(bey => bey.blade || bey.ratchet || bey.bit);

  for (const rule of format.rules) {
    switch (rule.type) {
      case 'pointBudget': {
        const budget = getPointBudget(format, userValues);
        const parts = getPartsFromDeck(activeDeck);
        const total = parts.reduce((sum, part) => sum + getPartPoints(part, format), 0);
        if (total > budget) {
          violations.push({ rule: 'pointBudget', message: `Points over limit: ${total}/${budget}` });
        }
        break;
      }
      case 'requirePartType': {
        const { slot, typeValue, min, max } = rule;
        const count = activeDeck.filter(bey => {
          const partName = bey[slot];
          return partName && BEYBLADE_DB[partName]?.type === typeValue;
        }).length;
        if (min !== undefined && count < min) {
          violations.push({ rule: 'requirePartType', message: `Need at least ${min} ${typeValue} ${slot}(s) — have ${count}` });
        }
        if (max !== undefined && count > max) {
          violations.push({ rule: 'requirePartType', message: `At most ${max} ${typeValue} ${slot}(s) allowed — have ${count}` });
        }
        break;
      }
      case 'requireTypeDistribution': {
        const { slot, types } = rule;
        for (const typeValue of types) {
          const count = activeDeck.filter(bey => {
            const partName = bey[slot];
            return partName && BEYBLADE_DB[partName]?.type === typeValue;
          }).length;
          if (count < 1) {
            violations.push({ rule: 'requireTypeDistribution', message: `Need at least 1 ${typeValue} ${slot}` });
          }
        }
        break;
      }
      case 'requireComboTypePairing': {
        const { slot1, slot2 } = rule;
        activeDeck.forEach((bey, i) => {
          const part1 = bey[slot1];
          const part2 = bey[slot2];
          if (!part1 || !part2) return;
          const type1 = BEYBLADE_DB[part1]?.type;
          const type2 = BEYBLADE_DB[part2]?.type;
          if (type1 && type2 && type1 !== type2) {
            violations.push({
              rule: 'requireComboTypePairing',
              comboIndex: i,
              message: `${slot1} type (${type1}) doesn't match ${slot2} type (${type2})`,
            });
          }
        });
        break;
      }
      case 'requireComboWith': {
        const { conditions } = rule;
        const satisfied = activeDeck.some(bey =>
          conditions.every(({ slot, typeValue }) => {
            const partName = bey[slot];
            return partName && BEYBLADE_DB[partName]?.type === typeValue;
          })
        );
        if (!satisfied) {
          const desc = conditions.map(c => `${c.typeValue} ${c.slot}`).join(' + ');
          violations.push({ rule: 'requireComboWith', message: `Deck needs at least one combo with ${desc}` });
        }
        break;
      }
      case 'banComboPairing': {
        const { parts } = rule;
        activeDeck.forEach((bey, i) => {
          const allPresent = parts.every(({ slot, name }) => bey[slot] === name);
          if (allPresent) {
            const desc = parts.map(p => p.name).join(' + ');
            violations.push({ rule: 'banComboPairing', comboIndex: i, message: `${desc} is a banned pairing` });
          }
        });
        break;
      }
    }
  }

  return { violations };
}

export function isPartDisabled(partName, slot, partsUsed, format) {
  if (!format?.rules || !partName) return false;
  for (const rule of format.rules) {
    switch (rule.type) {
      case 'noRepeatParts':
        if (partsUsed.includes(partName)) return true;
        break;
      case 'banPart':
        if (rule.names?.includes(partName)) return true;
        break;
      case 'allowedParts':
        if (rule.slot === slot && !rule.names?.includes(partName)) return true;
        break;
      case 'allowedPartTypes':
        if (rule.slot === slot) {
          const partType = BEYBLADE_DB[partName]?.type;
          if (partType && !rule.types?.includes(partType)) return true;
        }
        break;
    }
  }
  return false;
}
