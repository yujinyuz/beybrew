import { describe, it, expect } from 'vitest';
import LZString from 'lz-string';
import { parseShareToken } from './shareUrl';

describe('parseShareToken', () => {
  it('returns null for invalid input', () => {
    expect(parseShareToken('not-valid-base64!!!!')).toBeNull();
    expect(parseShareToken('')).toBeNull();
  });

  it('roundtrips a full payload', () => {
    const payload = {
      beys: ['DranSword,3-60,Flat,,,,0,0,0'],
      beynum: 1,
      format: 'standard',
      name: 'Valt',
    };
    const token = LZString.compressToEncodedURIComponent(JSON.stringify(payload));
    expect(parseShareToken(token)).toEqual(payload);
  });

  it('handles empty name', () => {
    const payload = { beys: [], beynum: 3, format: 'limited', name: '' };
    const token = LZString.compressToEncodedURIComponent(JSON.stringify(payload));
    const result = parseShareToken(token);
    expect(result.name).toBe('');
  });
});
