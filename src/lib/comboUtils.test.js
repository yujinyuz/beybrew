import { describe, it, expect } from 'vitest';
import { getDeckProfile } from './comboUtils';

describe('getDeckProfile', () => {
  it('returns null when no combos have a blade', () => {
    expect(getDeckProfile([])).toBeNull();
    expect(getDeckProfile([{ blade: '', ratchet: '', bit: '' }])).toBeNull();
  });

  it('returns null when beyblades array is empty', () => {
    expect(getDeckProfile([])).toBeNull();
  });

  it('returns an object with archetype, emoji, flavor, color, averageStats', () => {
    const combos = [{ blade: 'Dran Sword', ratchet: '3-60', bit: 'Flat' }];
    const result = getDeckProfile(combos);
    expect(result).not.toBeNull();
    expect(result).toHaveProperty('archetype');
    expect(result).toHaveProperty('emoji');
    expect(result).toHaveProperty('flavor');
    expect(result).toHaveProperty('color');
    expect(result).toHaveProperty('averageStats');
    expect(result.averageStats).toHaveProperty('attack');
    expect(result.averageStats).toHaveProperty('defense');
    expect(result.averageStats).toHaveProperty('stamina');
    expect(result.averageStats).toHaveProperty('xDash');
    expect(result.averageStats).toHaveProperty('burstResistance');
  });

  it('archetype is one of the 8 X- types', () => {
    const VALID = ['X-Rusher','X-Berserker','X-Fortress','X-Ironwall','X-Endurance','X-Counter','X-Specialist','X-Tactician'];
    const combos = [{ blade: 'Dran Sword', ratchet: '3-60', bit: 'Flat' }];
    const result = getDeckProfile(combos);
    expect(VALID).toContain(result.archetype);
  });

  it('ignores combos without a blade when averaging', () => {
    const filled = { blade: 'Dran Sword', ratchet: '3-60', bit: 'Flat' };
    const empty = { blade: '', ratchet: '', bit: '' };
    const resultOne = getDeckProfile([filled]);
    const resultMixed = getDeckProfile([filled, empty, empty]);
    expect(resultMixed.averageStats).toEqual(resultOne.averageStats);
  });

  it('averageStats.attack is the mean attack across filled combos', () => {
    const combo = { blade: 'Dran Sword', ratchet: '3-60', bit: 'Flat' };
    const single = getDeckProfile([combo]);
    const double = getDeckProfile([combo, combo]);
    expect(double.averageStats.attack).toBeCloseTo(single.averageStats.attack, 5);
  });
});
