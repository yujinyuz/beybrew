import { describe, it, expect } from 'vitest'
import { BEYBLADE_DB, ASSIST_BLADES, LOCK_CHIPS, LIMITED_FORMAT, STANDARD_FORMAT, DEFAULT_LIMITED_MAX_POINTS, RATCHET_INTEGRATED_BITS, getPartPoints } from './constants'
import { randomizeBeyblades, randomizeSingleBeyblade } from './randomize'

describe('randomizeBeyblades', () => {
  it('returns the correct number of combos', () => {
    const result = randomizeBeyblades(3, STANDARD_FORMAT, DEFAULT_LIMITED_MAX_POINTS)
    expect(result).toHaveLength(3)
  })

  it('each combo has blade, ratchet, bit, and assistBlade fields', () => {
    const result = randomizeBeyblades(1, STANDARD_FORMAT, DEFAULT_LIMITED_MAX_POINTS)
    expect(result[0]).toHaveProperty('blade')
    expect(result[0]).toHaveProperty('ratchet')
    expect(result[0]).toHaveProperty('bit')
    expect(result[0]).toHaveProperty('assistBlade')
  })

  it('no blade is repeated across combos', () => {
    const result = randomizeBeyblades(3, STANDARD_FORMAT, DEFAULT_LIMITED_MAX_POINTS)
    const blades = result.map(c => c.blade)
    expect(new Set(blades).size).toBe(blades.length)
  })

  it('no ratchet is repeated across combos', () => {
    const result = randomizeBeyblades(3, STANDARD_FORMAT, DEFAULT_LIMITED_MAX_POINTS)
    const ratchets = result.map(c => c.ratchet)
    expect(new Set(ratchets).size).toBe(ratchets.length)
  })

  it('no bit is repeated across combos', () => {
    const result = randomizeBeyblades(3, STANDARD_FORMAT, DEFAULT_LIMITED_MAX_POINTS)
    const bits = result.map(c => c.bit)
    expect(new Set(bits).size).toBe(bits.length)
  })

  it('CX blade always gets an assistBlade and lockChip', () => {
    for (let i = 0; i < 50; i++) {
      const result = randomizeBeyblades(3, STANDARD_FORMAT, DEFAULT_LIMITED_MAX_POINTS)
      result.forEach(combo => {
        if (BEYBLADE_DB[combo.blade]?.line === 'CX') {
          expect(combo.assistBlade).toBeTruthy()
          expect(ASSIST_BLADES).toContain(combo.assistBlade)
          expect(combo.lockChip).toBeTruthy()
          expect(LOCK_CHIPS).toContain(combo.lockChip)
        }
      })
    }
  })

  it('exclusive lock chips (Valkyrie, Emperor) are not repeated across combos', () => {
    for (let i = 0; i < 30; i++) {
      const result = randomizeBeyblades(10, STANDARD_FORMAT, DEFAULT_LIMITED_MAX_POINTS)
      const exclusiveUsed = result.map(c => c.lockChip).filter(lc => lc === 'Valkyrie' || lc === 'Emperor')
      expect(exclusiveUsed.filter(lc => lc === 'Valkyrie').length).toBeLessThanOrEqual(1)
      expect(exclusiveUsed.filter(lc => lc === 'Emperor').length).toBeLessThanOrEqual(1)
    }
  })

  it('integrated ratchets always pair with their integrated bit', () => {
    for (let i = 0; i < 50; i++) {
      const result = randomizeBeyblades(3, STANDARD_FORMAT, DEFAULT_LIMITED_MAX_POINTS)
      result.forEach(combo => {
        const pairedBit = RATCHET_INTEGRATED_BITS[combo.ratchet]
        if (pairedBit) {
          expect(combo.bit).toBe(pairedBit)
        }
      })
    }
  })

  it('limited format: total points do not exceed maxPoints', () => {
    const maxPoints = DEFAULT_LIMITED_MAX_POINTS
    const result = randomizeBeyblades(3, LIMITED_FORMAT, maxPoints)
    const allParts = new Set()
    result.forEach(({ blade, assistBlade, ratchet, bit }) => {
      if (blade) allParts.add(blade)
      if (assistBlade) allParts.add(assistBlade)
      if (ratchet) allParts.add(ratchet)
      if (bit) allParts.add(bit)
    })
    const total = [...allParts].reduce((sum, part) => sum + getPartPoints(part), 0)
    expect(total).toBeLessThanOrEqual(maxPoints)
  })
})

describe('randomizeSingleBeyblade', () => {
  it('returns a single combo with all required fields', () => {
    const currentBeyblades = [
      { blade: '', assistBlade: '', ratchet: '', bit: '' },
      { blade: '', assistBlade: '', ratchet: '', bit: '' },
    ]
    const result = randomizeSingleBeyblade(0, currentBeyblades, STANDARD_FORMAT, DEFAULT_LIMITED_MAX_POINTS)
    expect(result).toHaveProperty('blade')
    expect(result).toHaveProperty('ratchet')
    expect(result).toHaveProperty('bit')
    expect(result).toHaveProperty('assistBlade')
  })

  it('does not use parts already used by other slots', () => {
    // 'Dran Sword', '3-60', 'Flat', 'Hells Hammer', '3-70', 'Ball' are real parts in the dataset
    const currentBeyblades = [
      { blade: '', assistBlade: '', ratchet: '', bit: '' },
      { blade: 'Dran Sword', assistBlade: '', ratchet: '3-60', bit: 'Flat' },
      { blade: 'Hells Hammer', assistBlade: '', ratchet: '3-70', bit: 'Ball' },
    ]
    for (let i = 0; i < 20; i++) {
      const result = randomizeSingleBeyblade(0, currentBeyblades, STANDARD_FORMAT, DEFAULT_LIMITED_MAX_POINTS)
      expect(result.blade).not.toBe('Dran Sword')
      expect(result.blade).not.toBe('Hells Hammer')
      expect(result.ratchet).not.toBe('3-60')
      expect(result.ratchet).not.toBe('3-70')
      expect(result.bit).not.toBe('Flat')
      expect(result.bit).not.toBe('Ball')
    }
  })
})
