import PropTypes from 'prop-types';
import { BEYBLADE_DB, getLineLogo, getSpinType } from '../constants';

function ComboTypeBadges({ blade, bit, size = 14 }) {
  const bitType = BEYBLADE_DB[bit]?.type;
  const spinType = getSpinType(blade);
  if (!blade && !bitType) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {bitType && <img src={`/images/${bitType}.png`} alt={bitType} style={{ height: size, width: 'auto', objectFit: 'contain' }} />}
      {blade && <img src={`/images/${getLineLogo(blade)}`} alt="" style={{ height: size, width: 'auto', objectFit: 'contain' }} />}
      {blade && <img src={`/images/${spinType}-spin.png`} alt={`${spinType} spin`} className="spin-icon" style={{ height: size, width: 'auto', objectFit: 'contain' }} />}
    </div>
  );
}

ComboTypeBadges.propTypes = {
  blade: PropTypes.string,
  bit: PropTypes.string,
  size: PropTypes.number,
};

export default ComboTypeBadges;
