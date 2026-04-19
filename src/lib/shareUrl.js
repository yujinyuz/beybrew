import LZString from 'lz-string';

function serializeBey(bey) {
  return `${bey.blade},${bey.ratchet},${bey.bit},${bey.assistBlade || ''},${bey.lockChip || ''},${bey.bladeMode || 0},${bey.assistBladeMode || 0},${bey.bitMode || 0},${bey.overBlade || ''}`;
}

export function buildShareToken(beyblades, beybladeCount, format, bladerName = '') {
  const payload = {
    beys: beyblades.map(serializeBey),
    beynum: beybladeCount,
    format,
    name: bladerName,
  };
  return LZString.compressToEncodedURIComponent(JSON.stringify(payload));
}

export function buildShareUrl(beyblades, beybladeCount, format, bladerName = '') {
  const token = buildShareToken(beyblades, beybladeCount, format, bladerName);
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set('d', token);
  return url.toString();
}

export function parseShareToken(token) {
  try {
    const raw = LZString.decompressFromEncodedURIComponent(token);
    if (raw === null) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function buildEmbedUrl(beyblades, beybladeCount, format, widgetType, comboIndex = 0) {
  const beys =
    widgetType === 'single'
      ? beyblades[comboIndex]
        ? [serializeBey(beyblades[comboIndex])]
        : []
      : beyblades.map(serializeBey);
  const payload = { widget: widgetType, format, beynum: beybladeCount, beys };
  const token = LZString.compressToEncodedURIComponent(JSON.stringify(payload));
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set('d', token);
  return url.toString();
}
