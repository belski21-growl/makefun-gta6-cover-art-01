// Framing targets are tuples for Cover.framing, with named coordinates for callers.
const focusMark = (x, y) => Object.assign([x, y], { x, y });

// Keep one normalized point for each image, placing faces and the motel sign safely.
const photoFocus = [
  focusMark(.515, .195),
  focusMark(.49, .265),
  focusMark(.5, .5),
  focusMark(.5, .5),
  focusMark(.5, .5),
  focusMark(.51, .385),
];

// The renderer displays these three caption fields in role / place / time order.
const captions = [
  ['THE DRIVER', 'SUNDIAL BLVD', '6:42 PM'],
  ['THE ANGLER', 'COPPER PIER', '5:24 AM'],
  ['THE LOOKOUT', 'EMBER POINT', '7:51 PM'],
  ['THE RUNNER', 'LANTERN ROAD', '8:16 PM'],
  ['THE CAPTAIN', 'GLASSWATER BAY', '7:40 PM'],
  ['THE MOTEL', 'CRESCENT PALMS', '11:58 PM'],
];

// This clean panel template is shared by fresh banks, resets, and automatic fits.
function crop() {
  return { zoom: 1, angle: 0, x: 0, y: 0 };
}

// Return independent panel settings matching the number of cells in each canvas.
function crops(format) {
  const panelCount = { wide: 6, tall: 3, square: 4 }[format];
  if (!panelCount) throw new RangeError('Unknown cover format: ' + format);
  return Array.from({ length: panelCount }, () => crop());
}

// Shared cover wording and print controls seed the editor's first active scene.
const initial = {
  format: 'wide', layout: 'mosaic', titlePos: 'over',
  title: 'AFTERGLOW', subtitle: 'When the water burns', tagline: 'LAST LIGHT ON THE COAST',
  grade: 'vice', strength: 78, size: 110, ink: '#ffb47a',
  badge: 'ORIGINAL COVER ART', volume: 'VOL. 09',
  quote: 'THE WHOLE SHORE CATCHES FIRE', source: 'THE BREAKWATER REGISTER',
  slogan: 'SALT IN THE AIR / SPARKS IN THE MIRROR',
  credit: 'BREAKWATER FRAME CO. / A CAST OF YOUR OWN / PRINTED IN THE AFTERGLOW',
  halftone: true, grain: true, speed: false, tags: true,
  seal: true, volumeChip: true, ribbon: true, press: true,
};

// Compose a fresh state with a panel arrangement suited to the requested dimensions.
function compose(format) {
  if (!Object.hasOwn(cropsByFormat, format)) throw new RangeError('Unknown cover format: ' + format);
  return {
    ...initial,
    format,
    layout: layoutsByFormat[format],
    titlePos: format === 'wide' ? 'over' : 'bottom',
  };
}

// These maps keep format choices explicit and make invalid keys easy to reject.
const cropsByFormat = { wide: 6, tall: 3, square: 4 };
const layoutsByFormat = { wide: 'mosaic', tall: 'three', square: 'grid' };

// Wait for loaded fonts and two browser frames before announcing capture readiness.
async function waitForPaint() {
  if (document.fonts?.ready) await document.fonts.ready;
  await new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)));
  window.__shotReady = true;
}

// A query switch lets the capture page show only the finished poster artwork.
const coverOnly = new URLSearchParams(location.search).get('shot') === 'cover';

// Expose the scene data and helpers consumed by the editor and capture verifier.
const Scenes = { captions, photoFocus, compose, crop, crops, initial, coverOnly, waitForPaint };
