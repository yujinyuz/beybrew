import DeckWidget from './components/widgets/DeckWidget';
import SingleComboWidget from './components/widgets/SingleComboWidget';
import CompactListWidget from './components/widgets/CompactListWidget';
import CompactImageWidget from './components/widgets/CompactImageWidget';
import { parseSharedBeys } from './lib/comboUtils';
import { parseShareToken } from './lib/shareUrl';

function EmbedApp() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('d');

  let widgetType, format, beynum, combos;
  if (token) {
    const data = parseShareToken(token) ?? {};
    widgetType = data.widget;
    format = data.format || 'standard';
    beynum = Math.max(1, Number(data.beynum) || 1);
    combos = parseSharedBeys(data.beys || []);
  } else {
    widgetType = params.get('widget');
    format = params.get('format') || 'standard';
    beynum = Math.max(1, Number(params.get('beynum')) || 1);
    combos = parseSharedBeys(params.getAll('beys'));
  }

  const style = { margin: 0, padding: 0, background: 'transparent' };

  if (widgetType === 'single') {
    return <div style={style}><SingleComboWidget combo={combos[0]} /></div>;
  }
  if (widgetType === 'compact') {
    return <div style={style}><CompactListWidget combos={combos} beybladeCount={beynum} format={format} /></div>;
  }
  if (widgetType === 'compact-image') {
    return <div style={style}><CompactImageWidget combos={combos} beybladeCount={beynum} format={format} /></div>;
  }
  return <div style={style}><DeckWidget combos={combos} beybladeCount={beynum} format={format} /></div>;
}

export default EmbedApp;
