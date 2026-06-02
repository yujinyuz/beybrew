import PropTypes from 'prop-types';
import { BEYBLADE_DB, getLineLogo, getSpinType, getTypeIcon, getSpinIcon } from '../constants';
import PartImage from './PartImage';

function ComboTypeBadges({ blade, bit, size = 14 }) {
  const bitType = BEYBLADE_DB[bit]?.type;
  const spinType = getSpinType(blade);
  if (!blade && !bitType) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {bitType && <img src={getTypeIcon(bitType)} alt={bitType} style={{ height: size, width: 'auto', objectFit: 'contain' }} loading="lazy" />}
      {blade && <PartImage name={getLineLogo(blade)} alt="" style={{ height: size, width: 'auto', objectFit: 'contain' }} />}
      {blade && <img src={getSpinIcon(spinType)} alt={`${spinType} spin`} className="spin-icon" style={{ height: size, width: 'auto', objectFit: 'contain' }} loading="lazy" />}
    </div>
  );
}

ComboTypeBadges.propTypes = {
  blade: PropTypes.string,
  bit: PropTypes.string,
  size: PropTypes.number,
};

export default ComboTypeBadges;
