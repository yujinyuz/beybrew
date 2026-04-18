import LZString from 'lz-string';

function serializeBey(bey) {
  return `${bey.blade},${bey.ratchet},${bey.bit},${bey.assistBlade || ''},${bey.lockChip || ''},${bey.bladeMode || 0},${bey.assistBladeMode || 0},${bey.bitMode || 0},${bey.overBlade || ''}`;
}

export function buildShareUrl(beyblades, beybladeCount, format, bladerName = '') {
  const payload = {
    beys: beyblades.map(serializeBey),
    beynum: beybladeCount,
    format,
    name: bladerName,
  };
  const token = LZString.compressToEncodedURIComponent(JSON.stringify(payload));
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set('d', token);
  return url.toString();
}

export function parseShareToken(token) {
  try {
    const raw = LZString.decompressFromEncodedURIComponent(token);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function buildEmbedUrl(beyblades, beybladeCount, format, widgetType, comboIndex = 0) {
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set('widget', widgetType);
  url.searchParams.set('format', format);
  if (widgetType === 'single') {
    const bey = beyblades[comboIndex];
    if (bey) url.searchParams.append('beys', serializeBey(bey));
  } else {
    url.searchParams.set('beynum', beybladeCount);
    beyblades.forEach((bey) => url.searchParams.append('beys', serializeBey(bey)));
  }
  return url.toString();
}
