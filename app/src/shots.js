// Scene configuration shared by the editor and its capture runner.
const Scenes = (() => {
  const title = 'AFTERGLOW';
  const subtitle = 'When the water burns';
  const tagline = 'LAST LIGHT ON THE COAST';
  const layouts = { wide: 'mosaic', tall: 'three', square: 'grid' };
  const face = [
    { x: .515, y: .195 }, { x: .49, y: .265 },
    { x: .5, y: .5 }, { x: .5, y: .5 }, { x: .5, y: .5 },
    { x: .51, y: .385 }
  ];
  // Zoom values and normalized targets keep essential details in their crops.
  const cropSets = {
    wide: [1, 1, 1, 1, 1, 1].map(zoom => ({ x: 0, y: 0, zoom, angle: 0 })),
    tall: [1, 1, 1].map(zoom => ({ x: 0, y: 0, zoom, angle: 0 })),
    square: [1, 1, 1, 1].map(zoom => ({ x: 0, y: 0, zoom, angle: 0 }))
  };
  // Each panel's three strings are role, location, and time.
  const captions = [
    ['THE DRIVER', 'SUNDIAL BLVD', '6:42 PM'],
    ['THE ANGLER', 'COPPER PIER', '5:24 AM'],
    ['THE LOOKOUT', 'EMBER POINT', '7:51 PM'],
    ['THE RUNNER', 'LANTERN ROAD', '8:16 PM'],
    ['THE CAPTAIN', 'GLASSWATER BAY', '7:40 PM'],
    ['THE MOTEL', 'CRESCENT PALMS', '11:58 PM']
  ];
  const common = {
    title, subtitle, tagline, badge: 'ORIGINAL COVER ART', volume: 'VOL. 09',
    quote: 'THE WHOLE SHORE CATCHES FIRE', source: 'THE BREAKWATER REGISTER',
    slogan: 'SALT IN THE AIR  /  SPARKS IN THE MIRROR',
    credit: 'BREAKWATER FRAME CO. / A CAST OF YOUR OWN / PRINTED IN THE AFTERGLOW',
    ink: '#ffd17e', size: 100, grade: 'vice', strength: 82, halftone: true,
    grain: true, speed: false, tags: true, seal: true, volumeChip: true, ribbon: true, press: true
  };
  // Return an independent scene object so a format switch can update editor state.
  function compose(format) {
    return { ...common, format, layout: layouts[format], titlePos: format === 'wide' ? 'over' : 'bottom' };
  }
  // Provide a fresh crop list appropriate to the panels in the chosen layout.
  function crops(format) { return cropSets[format].map(part => ({ ...part })); }
  // Supply neutral framing defaults for newly assigned images.
  function crop() { return { x: 0, y: 0, zoom: 1, angle: 0 }; }
  // Keep stable source-image focal points, including portrait faces and motel signage.
  const photoFocus = face.map(point => [point.x, point.y]);
  // Captions are copied by callers before editing individual panels.
  const captionData = captions.map(lines => [...lines]);
  // Capture completion waits for fonts, decoded images, and one painted frame.
  async function waitForPaint() {
    if (document.fonts?.ready) await document.fonts.ready;
    await Promise.all([...document.images].map(image => image.decode?.().catch(() => undefined)));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    window.__shotReady = true;
  }
  const initial = {
    ...compose('wide'), photos: [], quote: common.quote, source: common.source
  };
  const coverOnly = new URLSearchParams(location.search).has('cover');
  return { compose, crops, crop, photoFocus, captions: captionData, initial, coverOnly, waitForPaint };
})();
