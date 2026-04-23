import PropTypes from 'prop-types';
import SingleComboWidget from './SingleComboWidget';

function AllCombosWidget({ combos, beybladeCount, format }) {
  const activeCombos = combos.slice(0, beybladeCount);
  return (
    <div style={{
      background: 'var(--color-bg)',
      borderRadius: '14px',
      padding: '16px',
      fontFamily: 'system-ui,-apple-system,sans-serif',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '7px', color: 'var(--color-accent)', letterSpacing: '0.25em', fontWeight: 700 }}>BEYBREW · DECK</span>
        {format?.name && (
          <span style={{ fontSize: '7px', color: 'var(--color-text-muted)', letterSpacing: '0.15em', fontWeight: 600, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '2px 6px' }}>
            {format.name.toUpperCase()}
          </span>
        )}
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '10px',
      }}>
        {activeCombos.map((combo, i) => (
          <div key={i} style={activeCombos.length % 2 !== 0 && i === activeCombos.length - 1 ? { gridColumn: '1 / -1' } : undefined}>
            <SingleComboWidget combo={combo} hideFooter />
          </div>
        ))}
      </div>
      <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,transparent,var(--color-border))' }} />
        <span style={{ fontSize: '7px', color: 'var(--color-text-muted)', letterSpacing: '0.18em', fontWeight: 600 }}>BEYBLADEBREW.COM</span>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,var(--color-border),transparent)' }} />
      </div>
    </div>
  );
}

AllCombosWidget.propTypes = {
  combos: PropTypes.array.isRequired,
  beybladeCount: PropTypes.number.isRequired,
  format: PropTypes.object,
};

export default AllCombosWidget;
