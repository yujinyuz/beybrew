import DeckWidget from './components/widgets/DeckWidget';
import SingleComboWidget from './components/widgets/SingleComboWidget';
import CompactListWidget from './components/widgets/CompactListWidget';
import CompactImageWidget from './components/widgets/CompactImageWidget';
import { parseSharedBeys } from './lib/comboUtils';

function EmbedApp() {
  const params = new URLSearchParams(window.location.search);
  const widgetType = params.get('widget');
  const format = params.get('format') || 'standard';
  const beynum = Math.max(1, Number(params.get('beynum')) || 1);
  const rawBeys = params.getAll('beys');
  const combos = parseSharedBeys(rawBeys);

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
