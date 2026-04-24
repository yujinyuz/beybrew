import ConfigurableDeckWidget from './components/widgets/ConfigurableDeckWidget';
import ConfigurableComboWidget from './components/widgets/ConfigurableComboWidget';
import { getDeckProfile, parseSharedBeys } from './lib/comboUtils';
import { parseShareToken } from './lib/shareUrl';
import { getFormat } from './constants';

function EmbedApp() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('d');

  let scope;
  let config;
  let comboIndex;
  let format;
  let beynum;
  let combos;

  if (token) {
    const data = parseShareToken(token) ?? {};
    scope = data.scope || 'deck';
    format = getFormat(data.format || 'standard');
    beynum = Math.max(1, Number(data.beynum) || 1);
    combos = parseSharedBeys(data.beys || []);
    comboIndex = Math.max(0, Number(data.combo) || 0);
    config = {
      aspectRatio: data.ar || 'card',
      showProfile: data.profile !== '0',
      showStatBars: data.stats !== '0',
      showPartThumbnails: data.thumbs !== '0',
    };
  } else {
    scope = params.get('scope') || 'deck';
    format = getFormat(params.get('format') || 'standard');
    beynum = Math.max(1, Number(params.get('beynum')) || 1);
    combos = parseSharedBeys(params.getAll('beys'));
    comboIndex = Math.max(0, Number(params.get('combo')) || 0);
    config = {
      aspectRatio: params.get('ar') || 'card',
      showProfile: params.get('profile') !== '0',
      showStatBars: params.get('stats') !== '0',
      showPartThumbnails: params.get('thumbs') !== '0',
    };
  }

  const style = { margin: 0, padding: 0, background: 'transparent' };
  const profile = getDeckProfile(combos);

  if (scope === 'combo') {
    return <div style={style}><ConfigurableComboWidget combo={combos[comboIndex]} config={config} /></div>;
  }

  return (
    <div style={style}>
      <ConfigurableDeckWidget
        combos={combos}
        beybladeCount={beynum}
        format={format}
        profile={config.showProfile ? profile : undefined}
        config={config}
      />
    </div>
  );
}

export default EmbedApp;
