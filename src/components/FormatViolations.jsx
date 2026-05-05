import PropTypes from 'prop-types';

function FormatViolations({ violations, format }) {
  const hasRules = format?.rules?.length > 0;
  if (!hasRules) return null;

  const deckLevel = violations.filter(v => v.comboIndex == null);
  if (!deckLevel.length) return null;

  return (
    <div
      className="rounded-lg px-4 py-3 mt-4"
      style={{
        background: 'rgba(255, 68, 85, 0.08)',
        border: '1px solid rgba(255, 68, 85, 0.3)',
      }}
    >
      <div
        className="text-xs font-bold uppercase tracking-widest mb-2"
        style={{ color: 'var(--color-danger)', letterSpacing: '0.15em' }}
      >
        Format Violations
      </div>
      <ul className="space-y-1">
        {deckLevel.map((v, i) => (
          <li
            key={i}
            className="text-xs flex items-start gap-2"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <span style={{ color: 'var(--color-danger)', flexShrink: 0 }}>✕</span>
            {v.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

FormatViolations.propTypes = {
  violations: PropTypes.arrayOf(
    PropTypes.shape({
      rule: PropTypes.string.isRequired,
      message: PropTypes.string.isRequired,
    })
  ).isRequired,
  format: PropTypes.object,
};

export default FormatViolations;
