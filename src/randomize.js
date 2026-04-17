import { BLADES, ASSIST_BLADES, RATCHETS, BITS, BEYBLADE_DB, LIMITED_FORMAT } from './constants'

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
  combos.forEach(({ blade, assistBlade, ratchet, bit }) => {
    for (const part of [blade, assistBlade, ratchet, bit]) {
      if (part && !seen.has(part)) {
        seen.add(part)
        total += BEYBLADE_DB[part]?.points || 0
      }
    }
  })
  return total
}

function buildCombos(count, usedParts = new Set()) {
  // Treat the Turbo ratchet+bit as a single unit: if either is used, exclude both
  const turboPairUsed = usedParts.has('Turbo') || usedParts.has('Turbo (Ratchet Integrated Bit)')

  const availableBlades = shuffle(BLADES.filter(b => !usedParts.has(b)))
  const availableRatchets = shuffle(
    RATCHETS.filter(r => {
      if (r === 'Turbo (Ratchet Integrated Bit)') return !turboPairUsed
      return !usedParts.has(r)
    })
  )
  // 'Turbo' bit is only ever assigned via the integrated ratchet, never from this pool
  const availableBits = shuffle(BITS.filter(b => b !== 'Turbo' && !usedParts.has(b)))
  const availableAssistBlades = shuffle(ASSIST_BLADES.filter(a => !usedParts.has(a)))

  const combos = []
  let bitIdx = 0
  let assistIdx = 0

  for (let i = 0; i < count; i++) {
    const blade = availableBlades[i] || ''
    const ratchet = availableRatchets[i] || ''
    let bit

    if (ratchet === 'Turbo (Ratchet Integrated Bit)') {
      bit = 'Turbo'
    } else {
      bit = availableBits[bitIdx++] || ''
    }

    const isCX = BEYBLADE_DB[blade]?.line === 'CX'
    const assistBlade = isCX ? (availableAssistBlades[assistIdx++] || '') : ''

    combos.push({ blade, assistBlade, ratchet, bit })
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
  currentBeyblades.forEach((bey, i) => {
    if (i === index) return
    if (bey.blade) usedParts.add(bey.blade)
    if (bey.assistBlade) usedParts.add(bey.assistBlade)
    if (bey.ratchet) usedParts.add(bey.ratchet)
    if (bey.bit) usedParts.add(bey.bit)
  })

  if (format !== LIMITED_FORMAT) {
    return buildCombos(1, usedParts)[0]
  }

  const otherPoints = [...usedParts].reduce((sum, part) => sum + (BEYBLADE_DB[part]?.points || 0), 0)

  const budget = maxPoints - otherPoints

  let best = null
  let bestTotal = Infinity

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const combo = buildCombos(1, usedParts)[0]
    const comboPoints = calcPoints([combo])
    if (comboPoints <= budget) return combo
    if (comboPoints < bestTotal) {
      bestTotal = comboPoints
      best = combo
    }
  }

  return best
}
