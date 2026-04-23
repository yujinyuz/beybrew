import PropTypes from 'prop-types';

function FormatViolations({ violations, format, beyblades }) {
  const hasRules = format?.rules?.length > 0;
  if (!hasRules) return null;

  const deckLevel = violations.filter(v => v.comboIndex == null);
  const hasAnyPart = beyblades?.some(b => b.blade || b.ratchet || b.bit);
  const allClean = violations.length === 0 && hasAnyPart;

  if (allClean) {
    return (
      <div
        className="rounded-lg px-4 py-3 mb-4 flex items-center gap-2 text-xs font-semibold"
        style={{
          background: 'rgba(0, 200, 120, 0.07)',
          border: '1px solid rgba(0, 200, 120, 0.25)',
          color: 'rgba(0, 200, 120, 0.9)',
        }}
      >
        <span>✓</span>
        Deck is valid for {format.name}
      </div>
    );
  }

  if (!deckLevel.length) return null;

  return (
    <div
      className="rounded-lg px-4 py-3 mb-4"
      style={{
        background: 'rgba(255, 68, 85, 0.08)',
        border: '1px solid rgba(255, 68, 85, 0.3)',
      }}
    >
      <div
        className="text-xs font-bold uppercase tracking-widest mb-2"
        style={{ color: '#ff4455', letterSpacing: '0.15em' }}
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
            <span style={{ color: '#ff4455', flexShrink: 0 }}>✕</span>
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
  beyblades: PropTypes.array,
};

export default FormatViolations;
