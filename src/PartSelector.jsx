import PropTypes from 'prop-types';
import Select from 'react-select';
import { BEYBLADE_DB, LIMITED_FORMAT } from './constants';

function buildOptionLabel(option, currentFormat) {
  let label = `${option} ${BEYBLADE_DB[option]?.alias ? `(${BEYBLADE_DB[option]?.alias})` : ''}`;
  if (currentFormat === LIMITED_FORMAT) {
    label = `${label} ${BEYBLADE_DB[option]?.points ?? '???'}`;
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

const TYPE_BADGE = {
  attack:  { label: 'ATK', color: '#2196F3' },
  defense: { label: 'DEF', color: '#4CAF50' },
  stamina: { label: 'STA', color: '#FF9800' },
  balance: { label: 'BAL', color: '#9C27B0' },
};

function Badge({ label, color }) {
  return (
    <span style={{
      background: color,
      color: 'white',
      fontSize: '9px',
      fontWeight: 700,
      padding: '1px 5px',
      borderRadius: '3px',
      flexShrink: 0,
      lineHeight: '1.4',
    }}>
      {label}
    </span>
  );
}

Badge.propTypes = {
  label: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
};

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
        formatGroupLabel={group => (
          <div style={{
            background: group.label === 'Hasbro' ? '#fff5f5' : '#f0f4ff',
            color: group.label === 'Hasbro' ? '#e63946' : '#3b5bdb',
            fontWeight: 700,
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '4px 0',
          }}>
            {group.label}
          </div>
        )}
        formatOptionLabel={option => {
          if (!option.value) return <span>{option.label}</span>;
          const db = BEYBLADE_DB[option.value];
          const brandLabel = db?.hasbro ? 'HAS' : 'TT';
          const brandColor = db?.hasbro ? '#e63946' : '#3b5bdb';
          const typeBadge = db?.type ? TYPE_BADGE[db.type] : null;
          return (
            <span className='flex flex-row items-center gap-1'>
              <Badge label={brandLabel} color={brandColor} />
              {typeBadge && <Badge label={typeBadge.label} color={typeBadge.color} />}
              <img className="h-6" src={db?.type ? `/images/${db.type}.png` : ''} alt="" />
              <img className="h-6" src={db?.image ? `/images/${db.image}` : ''} alt="" />
              <span>{option.label}</span>
            </span>
          );
        }}
      />
    </div>
  );
}

PartSelector.propTypes = {
  label: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  partsUsed: PropTypes.arrayOf(PropTypes.string).isRequired,
  currentFormat: PropTypes.string.isRequired,
};

export default PartSelector;

