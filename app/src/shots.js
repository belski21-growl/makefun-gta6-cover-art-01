const Scenes = (() => {
  const params = new URLSearchParams(location.search);
  const compositions = {
    wide: { layout: 'mosaic', titlePos: 'over' },
    tall: { layout: 'three', titlePos: 'bottom' },
    square: { layout: 'grid', titlePos: 'bottom' }
  };
  const captions = [
    ['THE DRIVER', 'SUNDIAL BLVD', '6:42 PM'],
    ['THE ANGLER', 'COPPER PIER', '5:24 AM'],
    ['THE LOOKOUT', 'EMBER POINT', '7:51 PM'],
    ['THE RUNNER', 'LANTERN ROAD', '8:16 PM'],
    ['THE CAPTAIN', 'GLASSWATER BAY', '9:40 PM'],
    ['THE MOTEL', 'CRESCENT PALMS', '11:58 PM']
  ];
  const copy = {
    title: 'AFTERGLOW', subtitle: 'When the water burns',
    tagline: 'LAST LIGHT ON THE COAST', badge: 'ORIGINAL COVER ART',
    volume: 'VOL. 09', quote: 'THE WHOLE SHORE CATCHES FIRE', source: 'THE BREAKWATER REGISTER',
    slogan: 'SALT IN THE AIR  /  SPARKS IN THE MIRROR',
    credit: 'BREAKWATER FRAME CO.  /  A CAST OF YOUR OWN  /  PRINTED IN THE AFTERGLOW'
  };
  // Normalized source focal points travel with photos through Spread and Auto-fill.
  const photoFocus = [null, null, null, null, null, [.51, .38]];
  const crop = () => ({ x: 0, y: 0, zoom: 1, angle: 0 });
  const compose = format => ({ format, ...compositions[format] });
  const crops = format => Cover.layouts[compositions[format].layout].cells.map(crop);
  const requested = params.get('format');
  const format = Object.hasOwn(compositions, requested) ? requested : 'wide';
  const shot = params.get('shot');
  return {
    captions, photoFocus, compose, crop, crops, coverOnly: shot === 'cover',
    initial: {
      ...copy, ...compose(format), size: 100, ink: '#ffa54f', grade: 'vice', strength: 90,
      halftone: true, grain: true, speed: false, tags: true, seal: true,
      volumeChip: true, ribbon: true, press: true
    },
    async waitForPaint() {
      if (shot !== 'cover' && shot !== 'editor') return;
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      window.__shotReady = true;
    }
  };
})();
