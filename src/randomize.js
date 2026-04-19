import { BLADES, ASSIST_BLADES, RATCHETS, BITS, LOCK_CHIPS, OVER_BLADES, BEYBLADE_DB, LIMITED_FORMAT, RATCHET_INTEGRATED_BITS, BIT_TO_RATCHET, getPartPoints } from './constants'

const EXCLUSIVE_LOCK_CHIPS = new Set(['Valkyrie', 'Emperor'])

function shuffle(arr) {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function calcPoints(combos) {
  const seen = new Set()
  let total = 0
  combos.forEach(({ blade, assistBlade, overBlade, ratchet, bit }) => {
    for (const part of [blade, assistBlade, overBlade, ratchet, bit]) {
      if (part && !seen.has(part)) {
        seen.add(part)
        total += getPartPoints(part)
      }
    }
  })
  return total
}

function pickLockChip(usedExclusiveLockChips) {
  const available = LOCK_CHIPS.filter(lc => !EXCLUSIVE_LOCK_CHIPS.has(lc) || !usedExclusiveLockChips.has(lc))
  if (!available.length) return ''
  const picked = available[Math.floor(Math.random() * available.length)]
  if (EXCLUSIVE_LOCK_CHIPS.has(picked)) usedExclusiveLockChips.add(picked)
  return picked
}

function buildCombos(count, usedParts = new Set(), usedExclusiveLockChips = new Set()) {
  const availableBlades = shuffle(BLADES.filter(b => !usedParts.has(b)))
  const availableRatchets = shuffle(
    RATCHETS.filter(r => {
      const pairedBit = RATCHET_INTEGRATED_BITS[r];
      if (pairedBit) return !usedParts.has(r) && !usedParts.has(pairedBit);
      return !usedParts.has(r)
    })
  )
  // integrated-ratchet bits are assigned via their ratchet, never from this pool
  const availableBits = shuffle(BITS.filter(b => !BIT_TO_RATCHET[b] && !usedParts.has(b)))
  const availableAssistBlades = shuffle(ASSIST_BLADES.filter(a => !usedParts.has(a)))
  const availableOverBlades   = shuffle(OVER_BLADES.filter(o => !usedParts.has(o)))

  const combos = []
  let bitIdx       = 0
  let assistIdx    = 0
  let overBladeIdx = 0

  for (let i = 0; i < count; i++) {
    const blade = availableBlades[i] || ''
    const ratchet = availableRatchets[i] || ''
    let bit

    const integratedBit = RATCHET_INTEGRATED_BITS[ratchet];
    if (integratedBit) {
      bit = integratedBit
    } else {
      bit = availableBits[bitIdx++] || ''
    }

    const isCX       = BEYBLADE_DB[blade]?.line === 'CX'
    const isFourPart = BEYBLADE_DB[blade]?.fourPartCX
    const assistBlade = isCX ? (availableAssistBlades[assistIdx++] || '') : ''
    const lockChip    = isCX ? pickLockChip(usedExclusiveLockChips) : ''
    const overBlade   = isFourPart ? (availableOverBlades[overBladeIdx++] || '') : ''

    combos.push({ blade, assistBlade, lockChip, overBlade, ratchet, bit })
  }

  return combos
}

export function randomizeBeyblades(count, format, maxPoints, maxAttempts = 20) {
  if (format !== LIMITED_FORMAT) {
    return buildCombos(count)
  }

  let best = null
  let bestTotal = Infinity

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const combos = buildCombos(count)
    const total = calcPoints(combos)
    if (total <= maxPoints) return combos
    if (total < bestTotal) {
      bestTotal = total
      best = combos
    }
  }

  return best
}

export function randomizeSingleBeyblade(index, currentBeyblades, format, maxPoints, maxAttempts = 20) {
  const usedParts = new Set()
  const usedExclusiveLockChips = new Set()
  currentBeyblades.forEach((bey, i) => {
    if (i === index) return
    if (bey.blade)       usedParts.add(bey.blade)
    if (bey.assistBlade) usedParts.add(bey.assistBlade)
    if (bey.overBlade)   usedParts.add(bey.overBlade)
    if (bey.ratchet)     usedParts.add(bey.ratchet)
    if (bey.bit) usedParts.add(bey.bit)
    if (bey.lockChip && EXCLUSIVE_LOCK_CHIPS.has(bey.lockChip)) usedExclusiveLockChips.add(bey.lockChip)
  })

  if (format !== LIMITED_FORMAT) {
    return buildCombos(1, usedParts, usedExclusiveLockChips)[0]
  }

  const otherPoints = [...usedParts].reduce((sum, part) => sum + getPartPoints(part), 0)

  const budget = maxPoints - otherPoints

  let best = null
  let bestTotal = Infinity

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const combo = buildCombos(1, usedParts, usedExclusiveLockChips)[0]
    const comboPoints = calcPoints([combo])
    if (comboPoints <= budget) return combo
    if (comboPoints < bestTotal) {
      bestTotal = comboPoints
      best = combo
    }
  }

  return best
}
