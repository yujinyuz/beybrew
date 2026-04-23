import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { BEYBLADE_DB, getLineLogo, getStats } from './constants';
import { isPartDisabled, getPartPoints } from './lib/formatEngine';

function buildOptionLabel(option, format) {
  const hasPoints = format?.rules?.some(r => r.type === 'pointBudget');
  let label = `${option}${BEYBLADE_DB[option]?.alias ? ` (${BEYBLADE_DB[option].alias})` : ''}`;
  if (hasPoints) {
    label = `${label} — ${getPartPoints(option, format)}pts`;
  }
  return { value: option, label };
}

function buildFlatOptions(options, format) {
  const hasPoints = format?.rules?.some(r => r.type === 'pointBudget');
  const sorted = hasPoints
    ? [...options].sort((a, b) => (getPartPoints(a, format) || 100) - (getPartPoints(b, format) || 100))
    : [...options].sort();
  return [{ value: '', label: '— Select —' }, ...sorted.map((o) => buildOptionLabel(o, format))];
}

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

function getEffectiveImage(partName, modeIndex = 0) {
  const db = BEYBLADE_DB[partName];
  if (!db) return null;
  if (db.modes) return db.modes[modeIndex]?.image || db.image;
  return db.image;
}

const STAT_LABELS = { attack: 'ATK', defense: 'DEF', stamina: 'STA', xDash: 'XD', burstResistance: 'BR' };

function computeDropdownDeltas(candidateName, currentName, currentModeIndex) {
  if (!currentName || !candidateName || candidateName === currentName) return [];
  const current = getStats(currentName, currentModeIndex);
  const candidate = getStats(candidateName, 0);
  return Object.entries(STAT_LABELS)
    .map(([key, label]) => ({ key, label, delta: (candidate[key] || 0) - (current[key] || 0) }))
    .filter(({ delta }) => delta !== 0);
}

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

function SourcePopover({ source }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          background: 'var(--color-accent-dim)',
          border: '1px solid var(--color-border)',
          borderRadius: '20px',
          padding: '1px 8px 1px 5px',
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--color-accent)',
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 212, 255, 0.2)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-accent-dim)')}
      >
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="12" height="10" rx="1.5" />
          <path d="M5 7h6M5 10h4" />
        </svg>
        {source.length} {source.length === 1 ? 'set' : 'sets'}
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            padding: '10px 12px',
            minWidth: '260px',
            maxWidth: '320px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            zIndex: 100,
            fontSize: '11px',
            lineHeight: '1.7',
          }}
        >
          <div style={{ fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '6px', fontWeight: 700 }}>
            Included in these sets
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '180px', overflowY: 'auto' }}>
            {source.map((s, i) => (
              <div key={s} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {i > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, var(--color-accent), transparent)' }} />
                    <svg width="8" height="8" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="3" fill="var(--color-accent)" opacity="0.8" />
                      <circle cx="8" cy="8" r="6" stroke="var(--color-accent)" strokeWidth="1" opacity="0.3" />
                      <line x1="8" y1="2" x2="8" y2="14" stroke="var(--color-accent)" strokeWidth="0.75" opacity="0.3" />
                      <line x1="2" y1="8" x2="14" y2="8" stroke="var(--color-accent)" strokeWidth="0.75" opacity="0.3" />
                    </svg>
                    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, var(--color-accent), transparent)' }} />
                  </div>
                )}
                <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{s}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </span>
  );
}

SourcePopover.propTypes = {
  source: PropTypes.arrayOf(PropTypes.string).isRequired,
};

function PartSelector({ label, options, value, onChange, slot, partsUsed, format, showLineBadge = false, modeIndex = 0 }) {
  const flatOptions = buildFlatOptions(options, format);
  const defaultValue = flatOptions.find((i) => i.value === value);
  const description = value ? BEYBLADE_DB[value]?.description : null;
  const source = value ? BEYBLADE_DB[value]?.source : null;

  const isOptionDisabled = (option) => {
    return isPartDisabled(option.value, slot, partsUsed, format);
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
        key={`${value || ''}-${modeIndex}`}
        name={label}
        styles={selectStyles}
        onChange={(e) => onChange(e.value)}
        value={defaultValue}
        options={flatOptions}
        isOptionDisabled={isOptionDisabled}
        formatOptionLabel={(option) => {
          if (!option.value) return <span style={{ color: 'var(--color-text-muted)', fontSize: '13px', opacity: 0.6 }}>{option.label}</span>;
          const db = BEYBLADE_DB[option.value];
          const deltas = computeDropdownDeltas(option.value, value, modeIndex);
          return (
            <span className="flex flex-col w-full" style={{ gap: '3px' }}>
              <span className="flex flex-row items-center gap-1.5">
                {showLineBadge && <img src={`/images/${getLineLogo(option.value)}`} alt="" style={{ height: 16, width: 'auto', objectFit: 'contain', flexShrink: 0 }} />}
                {db?.type && <img className="h-5 w-5 object-contain flex-shrink-0" src={`/images/${db.type}.png`} alt="" />}
                {(() => {
                  const effectiveImage = option.value === value
                    ? getEffectiveImage(option.value, modeIndex)
                    : db?.image;
                  return effectiveImage ? (
                    <span className="flex-shrink-0 rounded overflow-hidden" style={{ width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img className="h-6 w-6 object-contain" src={`/images/${effectiveImage}`} alt="" />
                    </span>
                  ) : null;
                })()}
                <span style={{ fontSize: '13px' }}>{option.label}</span>
                {showLineBadge && db?.fourPartCX && (
                  <span className="ml-auto flex-shrink-0">
                    <Badge label="Metal Blade" color="#7c3aed" />
                  </span>
                )}
              </span>
              {deltas.length > 0 && (
                <span className="flex flex-row flex-wrap gap-1" style={{ paddingLeft: '2px' }}>
                  {deltas.map(({ key, label: statLabel, delta }) => (
                    <span
                      key={key}
                      style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '1px 4px',
                        borderRadius: '3px',
                        color: delta > 0 ? '#00e676' : '#ff4455',
                        background: delta > 0 ? 'rgba(0,230,118,0.12)' : 'rgba(255,68,85,0.12)',
                      }}
                    >
                      {statLabel} {delta > 0 ? `+${delta}` : delta}
                    </span>
                  ))}
                </span>
              )}
            </span>
          );
        }}
      />
      {(source?.length || description) && (
        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: '1.5', marginTop: '4px', padding: '0 2px' }}>
          {description && <p style={{ marginBottom: source?.length ? '2px' : 0 }}>{description}</p>}
          {source?.length > 0 && (
            <p>
              <span style={{ opacity: 0.6 }}>Included in: </span>
              <SourcePopover source={source} />
            </p>
          )}
        </div>
      )}
    </div>
  );
}

PartSelector.propTypes = {
  label: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  slot: PropTypes.string.isRequired,
  partsUsed: PropTypes.arrayOf(PropTypes.string).isRequired,
  format: PropTypes.object.isRequired,
  showLineBadge: PropTypes.bool,
  modeIndex: PropTypes.number,
};

export default PartSelector;
