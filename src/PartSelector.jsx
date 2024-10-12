import React from 'react';

import { BEYBLADE_DB, LIMITED_FORMAT } from './constants';

function PartSelector({ label, options, value, onChange, partsUsed, currentFormat }) {

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <select
        className="block w-full border-gray-300 rounded-md shadow-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select {label}</option>
        {options.map((option) => (
          <option key={option} value={option} disabled={partsUsed.includes(option)}>
            {option} {BEYBLADE_DB[option].alias ? `(${BEYBLADE_DB[option].alias})` : null} {currentFormat === LIMITED_FORMAT ? BEYBLADE_DB[option].points : null}
          </option>
        ))}
      </select>
    </div>
  );
}

export default PartSelector;

