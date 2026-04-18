import PropTypes from 'prop-types';
import Select from 'react-select';
import { BEYBLADE_DB, LIMITED_FORMAT } from './constants';

function buildOptionLabel(option, currentFormat) {
  let label = `${option}${BEYBLADE_DB[option]?.alias ? ` (${BEYBLADE_DB[option].alias})` : ''}`;
  if (currentFormat === LIMITED_FORMAT) {
    label = `${label} — ${BEYBLADE_DB[option]?.points ?? '???'}pts`;
  }
  return { value: option, label };
}

function buildFlatOptions(options, currentFormat) {
  const sorted =
    currentFormat === LIMITED_FORMAT
      ? [...options].sort((a, b) => (BEYBLADE_DB[a]?.points || 100) - (BEYBLADE_DB[b]?.points || 100))
      : [...options].sort();
  return [{ value: '', label: '— Select —' }, ...sorted.map((o) => buildOptionLabel(o, currentFormat))];
}

const LINE_BADGE = {
  BX: { label: 'BX', color: '#42a5f5' },
  UX: { label: 'UX', color: '#e65c00' },
  CX: { label: 'CX', color: '#c62828' },
};

function Badge({ label, color }) {
  return (
    <span
      style={{
        background: color,
        color: '#fff',
        fontSize: '8px',
        fontWeight: 700,
        padding: '1px 5px',
        borderRadius: '3px',
        flexShrink: 0,
        lineHeight: '1.5',
        letterSpacing: '0.05em',
      }}
    >
      {label}
    </span>
  );
}

Badge.propTypes = {
  label: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
};

const selectStyles = {
  control: (base, state) => ({
    ...base,
    background: 'var(--color-surface-2)',
    borderColor: state.isFocused ? 'var(--color-accent)' : 'var(--color-border)',
    boxShadow: state.isFocused ? '0 0 0 1px var(--color-accent-dim)' : 'none',
    borderRadius: '8px',
    minHeight: '42px',
    cursor: 'pointer',
    '&:hover': { borderColor: 'var(--color-accent)' },
  }),
  menu: (base) => ({
    ...base,
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
    overflow: 'hidden',
  }),
  menuList: (base) => ({
    ...base,
    padding: '4px',
  }),
  option: (base, state) => ({
    ...base,
    background: state.isSelected
      ? 'var(--color-accent-dim)'
      : state.isFocused
      ? 'var(--color-accent-dim)'
      : 'transparent',
    color: state.isDisabled ? 'var(--color-text-muted)' : 'var(--color-text)',
    opacity: state.isDisabled ? 0.4 : 1,
    borderRadius: '6px',
    cursor: state.isDisabled ? 'not-allowed' : 'pointer',
    padding: '6px 8px',
    fontSize: '14px',
    '&:active': { background: 'var(--color-accent-dim)' },
  }),
  singleValue: (base) => ({ ...base, color: 'var(--color-text)' }),
  input: (base) => ({ ...base, color: 'var(--color-text)' }),
  placeholder: (base) => ({ ...base, color: 'var(--color-text-muted)', opacity: 0.5 }),
  indicatorSeparator: (base) => ({ ...base, background: 'var(--color-border)' }),
  dropdownIndicator: (base) => ({ ...base, color: 'var(--color-text-muted)', '&:hover': { color: 'var(--color-accent)' } }),
  clearIndicator: (base) => ({ ...base, color: 'var(--color-text-muted)', '&:hover': { color: 'var(--color-accent)' } }),
};

function PartSelector({ label, options, value, onChange, partsUsed, currentFormat, showLineBadge = false }) {
  const flatOptions = buildFlatOptions(options, currentFormat);
  const defaultValue = flatOptions.find((i) => i.value === value);
  const description = value ? BEYBLADE_DB[value]?.description : null;

  const isOptionDisabled = (option) => {
    return partsUsed.includes(option.value);
  };

  return (
    <div className="mb-4">
      <label
        className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
        style={{ color: 'var(--color-text-muted)', letterSpacing: '0.12em' }}
      >
        {label}
      </label>
      <Select
        name={label}
        styles={selectStyles}
        onChange={(e) => onChange(e.value)}
        value={defaultValue}
        options={flatOptions}
        isOptionDisabled={isOptionDisabled}
        formatOptionLabel={(option) => {
          if (!option.value) return <span style={{ color: 'var(--color-text-muted)', fontSize: '13px', opacity: 0.6 }}>{option.label}</span>;
          const db = BEYBLADE_DB[option.value];
          const lineBadge = showLineBadge ? LINE_BADGE[db?.line || 'BX'] : null;
          return (
            <span className="flex flex-row items-center gap-1.5">
              {lineBadge && <Badge label={lineBadge.label} color={lineBadge.color} />}
              {db?.type && <img className="h-5 w-5 object-contain flex-shrink-0" src={`/images/${db.type}.png`} alt="" />}
              {db?.image && (
                <span className="flex-shrink-0 rounded overflow-hidden" style={{ background: '#fff', width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img className="h-6 w-6 object-contain" src={`/images/${db.image}`} alt="" />
                </span>
              )}
              <span style={{ fontSize: '13px' }}>{option.label}</span>
            </span>
          );
        }}
      />
      {description && (
        <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: '1.5', marginTop: '4px', padding: '0 2px' }}>
          {description}
        </p>
      )}
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
  showLineBadge: PropTypes.bool,
};

export default PartSelector;
