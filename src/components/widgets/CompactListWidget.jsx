import PropTypes from 'prop-types';
import { getLineColor } from '../../constants';
import { getComboName } from '../../lib/comboUtils';
import ComboTypeBadges from '../ComboTypeBadges';

function CompactListWidget({ combos, beybladeCount, format }) {
  const formatLabel = format?.name?.toUpperCase() ?? 'STANDARD';
  return (
    <div style={{ background: 'var(--color-bg)', borderRadius: '12px', padding: '14px 16px', fontFamily: 'system-ui,-apple-system,sans-serif', border: '1px solid var(--color-border)' }}>
      <div style={{ fontSize: '6.5px', color: 'var(--color-accent)', letterSpacing: '0.22em', fontWeight: 700, marginBottom: '10px' }}>BEYBREW · {formatLabel}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {Array(beybladeCount).fill(null).map((_, i) => {
          const name = getComboName(combos[i]);
          const accent = getLineColor(combos[i]?.blade);
          const blade = combos[i]?.blade;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '9px', color: accent, width: '14px', fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text)', fontWeight: 700 }}>{name || '—'}</span>
                <ComboTypeBadges blade={blade} bit={combos[i]?.bit} size={12} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,transparent,var(--color-border))' }} />
        <span style={{ fontSize: '6.5px', color: 'var(--color-text-muted)', letterSpacing: '0.18em', fontWeight: 600 }}>BEYBLADEBREW.COM</span>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,var(--color-border),transparent)' }} />
      </div>
    </div>
  );
}

CompactListWidget.propTypes = {
  combos: PropTypes.array.isRequired,
  beybladeCount: PropTypes.number.isRequired,
  format: PropTypes.object,
};

export default CompactListWidget;
