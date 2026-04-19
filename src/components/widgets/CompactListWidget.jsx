import PropTypes from 'prop-types';
import { LIMITED_FORMAT, getLineColor, BEYBLADE_DB, getLineLogo } from '../../constants';
import { getComboName } from '../../lib/comboUtils';

function CompactListWidget({ combos, beybladeCount, format }) {
  const formatLabel = format === LIMITED_FORMAT ? 'LIMITED' : 'STANDARD';
  return (
    <div style={{ background: '#080c18', borderRadius: '12px', padding: '14px 16px', fontFamily: 'system-ui,-apple-system,sans-serif', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ fontSize: '6.5px', color: 'rgba(0,212,255,0.6)', letterSpacing: '0.22em', fontWeight: 700, marginBottom: '10px' }}>BEYBREW · {formatLabel}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {Array(beybladeCount).fill(null).map((_, i) => {
          const name = getComboName(combos[i]);
          const accent = getLineColor(combos[i]?.blade);
          const blade = combos[i]?.blade;
          const spinType = BEYBLADE_DB[blade]?.spinType;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '9px', color: accent, width: '14px', fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '11px', color: '#fff', fontWeight: 700 }}>{name || '—'}</span>
                {blade && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <img
                      src={`/images/${getLineLogo(blade)}`}
                      alt={BEYBLADE_DB[blade]?.line || 'BX'}
                      style={{ height: '12px', width: 'auto', objectFit: 'contain' }}
                    />
                    <span style={{ fontSize: '7px', color: accent, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      {spinType?.toUpperCase()} SPIN
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.08))' }} />
        <span style={{ fontSize: '6.5px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.18em', fontWeight: 600 }}>BEYBLADEBREW.COM</span>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,rgba(255,255,255,0.08),transparent)' }} />
      </div>
    </div>
  );
}

CompactListWidget.propTypes = {
  combos: PropTypes.array.isRequired,
  beybladeCount: PropTypes.number.isRequired,
  format: PropTypes.string,
};

export default CompactListWidget;
