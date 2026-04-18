import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BEYBLADE_DB } from '../constants';
import { randomizeBeyblades, randomizeSingleBeyblade } from '../randomize';

function parseSharedBeys(rawBeys) {
  return rawBeys.map((bey) => {
    const [blade, ratchet, bit, assistBlade = '', lockChip = ''] = bey.split(',');
    return { blade, ratchet, bit, assistBlade, lockChip };
  });
}

function getPartsUsed(beys) {
  const parts = new Set();
  beys.forEach((bey) => {
    parts.add(bey.blade);
    parts.add(bey.ratchet);
    parts.add(bey.bit);
    if (bey.assistBlade) parts.add(bey.assistBlade);
    if (bey.lockChip) parts.add(bey.lockChip);
  });
  return parts;
}

export function useBeybladeDeck() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [beybladeCount, setBeybladeCount] = useState(Number(searchParams.get('beynum')) || 3);
  const [currentFormat, setCurrentFormat] = useState(searchParams.get('format') || 'standard');
  const [beyblades, setBeyblades] = useState([]);

  useEffect(() => {
    const shared = searchParams.getAll('beys');
    setSearchParams(new URLSearchParams());
    if (shared.length > 0) {
      setBeyblades(parseSharedBeys(shared));
    }
  // Intentionally runs once on mount to load shared URL state then clean the URL
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
        newBeyblades[i] = { blade: '', assistBlade: '', lockChip: '', ratchet: '', bit: '' };
      }
    }

    newBeyblades[index][partType] = value;

    if (partType === 'ratchet') {
      if (value.includes('Turbo (Ratchet Integrated Bit)')) {
        newBeyblades[index].bit = 'Turbo';
      } else if (newBeyblades[index].bit === 'Turbo') {
        newBeyblades[index].bit = '';
      }
    }

    if (partType === 'bit') {
      if (value === 'Turbo') {
        newBeyblades[index].ratchet = 'Turbo (Ratchet Integrated Bit)';
      } else if (newBeyblades[index].ratchet === 'Turbo (Ratchet Integrated Bit)') {
        newBeyblades[index].ratchet = '';
      }
    }

    setBeyblades(newBeyblades);
  };

  const handleShareButton = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('beynum', beybladeCount);
    url.searchParams.set('format', currentFormat);
    beyblades.forEach((bey) => {
      url.searchParams.append('beys', `${bey.blade},${bey.ratchet},${bey.bit},${bey.assistBlade || ''},${bey.lockChip || ''}`);
    });

    navigator.clipboard
      .writeText(url.toString())
      .then(() => window.alert('Successfully copied to clipboard!'))
      .catch((err) => console.error('Failed to copy URL:', err));
  };

  const handleRandomizeAll = (maxPoints) => {
    setBeyblades(randomizeBeyblades(beybladeCount, currentFormat, maxPoints));
  };

  const handleRandomizeSingle = (index, maxPoints) => {
    const newBeyblades = [...beyblades];
    for (let i = 0; i < beybladeCount; i++) {
      if (!newBeyblades[i]) newBeyblades[i] = { blade: '', assistBlade: '', lockChip: '', ratchet: '', bit: '' };
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
  };
}
