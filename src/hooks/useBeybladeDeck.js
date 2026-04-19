import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BEYBLADE_DB, RATCHET_INTEGRATED_BITS, BIT_TO_RATCHET } from '../constants';
import { randomizeBeyblades, randomizeSingleBeyblade } from '../randomize';
import { parseSharedBeys } from '../lib/comboUtils';
import { buildShareUrl, buildShareToken, parseShareToken } from '../lib/shareUrl';

function getPartsUsed(beys) {
  const parts = new Set();
  beys.forEach((bey) => {
    parts.add(bey.blade);
    parts.add(bey.ratchet);
    parts.add(bey.bit);
    if (bey.assistBlade) parts.add(bey.assistBlade);
    if (bey.lockChip) parts.add(bey.lockChip);
    if (bey.overBlade) parts.add(bey.overBlade);
  });
  return parts;
}

export function useBeybladeDeck() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [beybladeCount, setBeybladeCount] = useState(Number(searchParams.get('beynum')) || 3);
  const [currentFormat, setCurrentFormat] = useState(searchParams.get('format') || 'standard');
  const [beyblades, setBeyblades] = useState([]);
  const [bladerName, setBladerName] = useState('');

  useEffect(() => {
    const token = searchParams.get('d');
    const legacyBeys = searchParams.getAll('beys');

    if (token) {
      const payload = parseShareToken(token);
      if (payload) {
        if (payload.beys?.length > 0) setBeyblades(parseSharedBeys(payload.beys));
        if (payload.beynum) setBeybladeCount(Number(payload.beynum));
        if (payload.format) setCurrentFormat(payload.format);
        if (payload.name) setBladerName(payload.name);
      }
    } else if (legacyBeys.length > 0) {
      setBeyblades(parseSharedBeys(legacyBeys));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const hasDeck = beyblades.some((b) => b.blade || b.ratchet || b.bit);
    if (!hasDeck) {
      setSearchParams(new URLSearchParams(), { replace: true });
      return;
    }
    const token = buildShareToken(beyblades, beybladeCount, currentFormat, bladerName);
    setSearchParams({ d: token }, { replace: true });
  }, [beyblades, beybladeCount, currentFormat, bladerName]); // eslint-disable-line react-hooks/exhaustive-deps

  const partsUsed = useMemo(() => [...getPartsUsed(beyblades)], [beyblades]);

  const totalPoints = useMemo(() => {
    let points = 0;
    getPartsUsed(beyblades).forEach((part) => {
      points += BEYBLADE_DB[part]?.points || 0;
    });
    return points;
  }, [beyblades]);

  const handlePartChange = (index, partType, value) => {
    const newBeyblades = [...beyblades];

    for (let i = 0; i < beybladeCount; i++) {
      if (!newBeyblades[i]) {
        newBeyblades[i] = { blade: '', bladeMode: 0, assistBlade: '', assistBladeMode: 0, lockChip: '', overBlade: '', ratchet: '', bit: '', bitMode: 0 };
      }
    }

    newBeyblades[index][partType] = value;

    // Clear overBlade when switching to a blade that is not 4-part CX
    if (partType === 'blade' && !BEYBLADE_DB[value]?.fourPartCX) {
      newBeyblades[index].overBlade = '';
    }

    const modeResets = { blade: 'bladeMode', assistBlade: 'assistBladeMode', bit: 'bitMode' };
    if (modeResets[partType] !== undefined) {
      newBeyblades[index][modeResets[partType]] = 0;
    }

    if (partType === 'ratchet') {
      const pairedBit = RATCHET_INTEGRATED_BITS[value];
      if (pairedBit) {
        newBeyblades[index].bit = pairedBit;
      } else if (BIT_TO_RATCHET[newBeyblades[index].bit]) {
        newBeyblades[index].bit = '';
      }
    }

    if (partType === 'bit') {
      const pairedRatchet = BIT_TO_RATCHET[value];
      if (pairedRatchet) {
        newBeyblades[index].ratchet = pairedRatchet;
      } else if (RATCHET_INTEGRATED_BITS[newBeyblades[index].ratchet]) {
        newBeyblades[index].ratchet = '';
      }
    }

    setBeyblades(newBeyblades);
  };

  const handleShareButton = () => {
    const url = buildShareUrl(beyblades, beybladeCount, currentFormat, bladerName);
    navigator.clipboard
      .writeText(url)
      .then(() => window.alert('Successfully copied to clipboard!'))
      .catch((err) => console.error('Failed to copy URL:', err));
  };

  const handleRandomizeAll = (maxPoints) => {
    setBeyblades(randomizeBeyblades(beybladeCount, currentFormat, maxPoints));
  };

  const handleRandomizeSingle = (index, maxPoints) => {
    const newBeyblades = [...beyblades];
    for (let i = 0; i < beybladeCount; i++) {
      if (!newBeyblades[i]) newBeyblades[i] = { blade: '', bladeMode: 0, assistBlade: '', assistBladeMode: 0, lockChip: '', overBlade: '', ratchet: '', bit: '', bitMode: 0 };
    }
    newBeyblades[index] = randomizeSingleBeyblade(index, newBeyblades, currentFormat, maxPoints);
    setBeyblades(newBeyblades);
  };

  return {
    beybladeCount,
    setBeybladeCount,
    currentFormat,
    setCurrentFormat,
    beyblades,
    partsUsed,
    totalPoints,
    handlePartChange,
    handleShareButton,
    handleRandomizeAll,
    handleRandomizeSingle,
    bladerName,
    setBladerName,
  };
}
