import React from 'react';
import Select from 'react-select'

import { BEYBLADE_DB, LIMITED_FORMAT } from './constants';

function PartSelector({ label, options, value, onChange, partsUsed, currentFormat }) {

  options.sort()

  if (currentFormat === LIMITED_FORMAT) {
    options.sort(function(a, b) {
      return (BEYBLADE_DB[a]?.points || 100) - (BEYBLADE_DB[b]?.points || 100)
    })
  }

  const formattedOptions = options.map((option) => {
    return {
      value: option,
      label: `${option} ${BEYBLADE_DB[option].alias ? `(${BEYBLADE_DB[option].alias})` : ''} ${currentFormat === LIMITED_FORMAT ? (BEYBLADE_DB[option].points || '???') : ''}`
    }
  })

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>

      <Select
        className='block w-full border-gray-300 rounded-md shadow-sm'
        onChange={(e) => onChange(e.value)}
        options={formattedOptions} />
    </div>
  );
}

export default PartSelector;

