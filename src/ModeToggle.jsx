import PropTypes from 'prop-types';

function ModeToggle({ modes, value, onChange }) {
  return (
    <div className="flex gap-2 mb-4">
      {modes.map((mode, i) => {
        const active = i === value;
        return (
          <button
            key={i}
            onClick={() => onChange(i)}
            className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: active ? 'var(--color-accent-dim)' : 'var(--color-surface-2)',
              color: active ? 'var(--color-accent)' : 'var(--color-text-muted)',
              border: active
                ? '1px solid rgba(0,212,255,0.4)'
                : '1px solid rgba(255,255,255,0.04)',
            }}
          >
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}

ModeToggle.propTypes = {
  modes: PropTypes.arrayOf(PropTypes.shape({ label: PropTypes.string.isRequired })).isRequired,
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default ModeToggle;
