import React from 'react';
import Select from 'react-select'

import { BEYBLADE_DB, LIMITED_FORMAT } from './constants';

function buildOptionLabel(option, currentFormat) {
  let label = `${option} ${BEYBLADE_DB[option].alias ? `(${BEYBLADE_DB[option].alias})` : ''}`;
  if (currentFormat === LIMITED_FORMAT) {
    label = `${label} ${BEYBLADE_DB[option].points ?? '???'}`;
  }
  return { value: option, label };
}

function buildGroupedOptions(options, currentFormat) {
  const sorted = currentFormat === LIMITED_FORMAT
    ? [...options].sort((a, b) => (BEYBLADE_DB[a]?.points || 100) - (BEYBLADE_DB[b]?.points || 100))
    : [...options].sort();

  const hasbro = [];
  const tt = [];

  sorted.forEach((option) => {
    const item = buildOptionLabel(option, currentFormat);
    if (BEYBLADE_DB[option]?.hasbro) {
      hasbro.push(item);
    } else {
      tt.push(item);
    }
  });

  const groups = [];
  if (hasbro.length > 0) groups.push({ label: 'Hasbro', options: hasbro });
  if (tt.length > 0) groups.push({ label: 'Takara Tomy', options: tt });

  return [{ value: '', label: '---' }, ...groups];
}

function PartSelector({ label, options, value, onChange, partsUsed, currentFormat }) {

  const groupedOptions = buildGroupedOptions(options, currentFormat);

  const allOptions = groupedOptions.flatMap((item) =>
    item.options ? item.options : [item]
  );
  const defaultValue = allOptions.find((i) => i.value == value);

  const optionDisabled = ((option) => {
    const partName = option.value?.split("(")[0].trim()


    return partsUsed.includes(partName);
  });

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <Select
        name={label}
        className='block w-full border-gray-300 rounded-md shadow-sm'
        onChange={(e) => onChange(e.value)}
        value={defaultValue}
        options={groupedOptions}
        isOptionDisabled={optionDisabled}
        formatOptionLabel={option => (
          <span className='flex flex-row'>
            <img className="h-6" src={`${BEYBLADE_DB[option.value]?.type ? `/images/${BEYBLADE_DB[option.value].type}.png` : ''}`} />
            &nbsp;
            <img className="h-6" src={`${BEYBLADE_DB[option.value]?.image ? `/images/${BEYBLADE_DB[option.value].image}` : ''}`} />
            &nbsp;{option.label}
          </span>
        )}
      />
    </div>
  );
}

export default PartSelector;

