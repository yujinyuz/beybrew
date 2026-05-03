import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BEYBLADE_DB, RATCHET_INTEGRATED_BITS, BIT_TO_RATCHET, BLADE_INTEGRATED_RATCHETS, RATCHET_TO_BLADE, getFormat, DEFAULT_FORMAT_ID } from '../constants';
import { randomizeBeyblades, randomizeSingleBeyblade } from '../randomize';
import { parseSharedBeys } from '../lib/comboUtils';
import { buildShareUrl, buildShareToken, parseShareToken } from '../lib/shareUrl';
import { evaluateFormat, getPartPoints } from '../lib/formatEngine';

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
  const [currentFormat, setCurrentFormat] = useState(() => getFormat(searchParams.get('format') || DEFAULT_FORMAT_ID));
  const [beyblades, setBeyblades] = useState([]);
  const [bladerName, setBladerName] = useState('');
  const [formatUserValues, setFormatUserValues] = useState({});

  useEffect(() => {
    setFormatUserValues({});
  }, [currentFormat]);

  useEffect(() => {
    const token = searchParams.get('d');
    const legacyBeys = searchParams.getAll('beys');

    if (token) {
      const payload = parseShareToken(token);
      if (payload) {
        if (payload.beys?.length > 0) setBeyblades(parseSharedBeys(payload.beys));
        if (payload.beynum) setBeybladeCount(Number(payload.beynum));
        if (payload.format) setCurrentFormat(getFormat(payload.format));
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
    const token = buildShareToken(beyblades, beybladeCount, currentFormat.id, bladerName);
    setSearchParams({ d: token }, { replace: true });
  }, [beyblades, beybladeCount, currentFormat, bladerName]); // eslint-disable-line react-hooks/exhaustive-deps

  const partsUsed = useMemo(() => [...getPartsUsed(beyblades)], [beyblades]);

  const totalPoints = useMemo(() => {
    let points = 0;
    getPartsUsed(beyblades).forEach((part) => {
      points += getPartPoints(part, currentFormat);
    });
    return points;
  }, [beyblades, currentFormat]);

  const violations = useMemo(() => {
    return evaluateFormat(beyblades, currentFormat, formatUserValues).violations;
  }, [beyblades, currentFormat, formatUserValues]);

  const handlePartChange = (index, partType, value) => {
    const newBeyblades = [...beyblades];

    for (let i = 0; i < beybladeCount; i++) {
      if (!newBeyblades[i]) {
        newBeyblades[i] = { blade: '', bladeMode: 0, assistBlade: '', assistBladeMode: 0, lockChip: '', overBlade: '', ratchet: '', bit: '', bitMode: 0 };
      }
    }

    newBeyblades[index][partType] = value;

    if (partType === 'blade') {
      if (!BEYBLADE_DB[value]?.fourPartCX) {
        newBeyblades[index].overBlade = '';
      }
      const integratedRatchet = BLADE_INTEGRATED_RATCHETS[value];
      if (integratedRatchet) {
        newBeyblades[index].ratchet = integratedRatchet;
        if (BIT_TO_RATCHET[newBeyblades[index].bit]) {
          newBeyblades[index].bit = '';
        }
      } else if (RATCHET_TO_BLADE[newBeyblades[index].ratchet]) {
        newBeyblades[index].ratchet = '';
      }
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
    const url = buildShareUrl(beyblades, beybladeCount, currentFormat.id, bladerName);
    navigator.clipboard
      .writeText(url)
      .then(() => window.alert('Successfully copied to clipboard!'))
      .catch((err) => console.error('Failed to copy URL:', err));
  };

  const handleClearAll = () => setBeyblades([]);

  const handleRandomizeAll = (userValues) => {
    setBeyblades(randomizeBeyblades(beybladeCount, currentFormat, userValues));
  };

  const handleRandomizeSingle = (index, userValues) => {
    const newBeyblades = [...beyblades];
    for (let i = 0; i < beybladeCount; i++) {
      if (!newBeyblades[i]) newBeyblades[i] = { blade: '', bladeMode: 0, assistBlade: '', assistBladeMode: 0, lockChip: '', overBlade: '', ratchet: '', bit: '', bitMode: 0 };
    }
    newBeyblades[index] = randomizeSingleBeyblade(index, newBeyblades, currentFormat, userValues);
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
    violations,
    formatUserValues,
    setFormatUserValues,
    handlePartChange,
    handleShareButton,
    handleClearAll,
    handleRandomizeAll,
    handleRandomizeSingle,
    bladerName,
    setBladerName,
  };
}
