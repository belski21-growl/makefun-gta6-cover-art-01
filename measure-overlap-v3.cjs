const fs = require('node:fs');
const vm = require('node:vm');

const read = file => fs.readFileSync(__dirname + '/' + file, 'utf8');
const sandbox = vm.createContext({ URLSearchParams, location: { search: '' } });
const { Cover, Scenes } = vm.runInContext(
  read('app/src/cover.js') + '\n' + read('app/src/shots.js') + '\n({ Cover, Scenes })', sandbox
);

// Measure with the new parameters (isOver = true for wide)
function measureOverlap() {
  const state = Scenes.compose('wide');
  state.size = 100;
  state.grade = 'vice';
  
  const [w, h] = Cover.formats.wide;
  const u = Math.min(w, h);
  
  const boxes = Cover.geometry(state);
  const motelBox = boxes[5];
  
  // Title geometry with NEW parameters
  const isOver = state.titlePos === 'over'; // true for wide
  const baseline = h * (isOver ? .82 : .825); // 0.82 for over
  const size = u * 0.25 * state.size / 100; // wide uses 0.25
  const max = w * (isOver ? 0.73 : 0.85); // NEW: 0.73 for over
  const skew = -0.12;
  const x = w / 2;
  const ascender = size * 0.8;
  const descender = size * 0.25;
  
  // Photo framing
  const focus = Scenes.photoFocus[5];
  const iw = 1280, ih = 1707;
  const crop = Scenes.crop();
  crop.focus = focus;
  crop.portrait = true;
  const frame = Cover.framing(motelBox, crop, iw, ih);
  
  // Sign rect in cover coordinates
  const signLeft = motelBox.left + (motelBox.width - iw * frame.scale) / 2 + frame.x + 0.35 * iw * frame.scale;
  const signRight = motelBox.left + (motelBox.width - iw * frame.scale) / 2 + frame.x + 0.67 * iw * frame.scale;
  const signTop = motelBox.top + (motelBox.height - ih * frame.scale) / 2 + frame.y + 0.16 * ih * frame.scale;
  const signBottom = motelBox.top + (motelBox.height - ih * frame.scale) / 2 + frame.y + 0.61 * ih * frame.scale;
  
  // Title glyph mask with skew
  const tanSkew = Math.tan(skew);
  const baselineRight = x + max/2;
  
  // Calculate overlap area by sampling vertical slices
  let overlapArea = 0;
  const signHeight = signBottom - signTop;
  const slices = 100;
  for (let i = 0; i < slices; i++) {
    const y = signTop + (i + 0.5) * signHeight / slices;
    const textRightAtY = baselineRight + (baseline - y) * tanSkew;
    const textLeftAtY = x - max/2 + (baseline - y) * tanSkew;
    const sliceTop = y - signHeight / slices / 2;
    const sliceBottom = y + signHeight / slices / 2;
    const titleTop = baseline - ascender;
    const titleBottom = baseline + descender;
    if (sliceBottom > titleTop && sliceTop < titleBottom) {
      const overlapLeft = Math.max(signLeft, textLeftAtY);
      const overlapRight = Math.min(signRight, textRightAtY);
      const overlapWidth = Math.max(0, overlapRight - overlapLeft);
      overlapArea += overlapWidth * (signHeight / slices);
    }
  }
  
  const signArea = (signRight - signLeft) * signHeight;
  const overlapPercent = signArea > 0 ? (overlapArea / signArea) * 100 : 0;
  
  return {
    signLeft: signLeft.toFixed(1),
    signRight: signRight.toFixed(1),
    signTop: signTop.toFixed(1),
    signBottom: signBottom.toFixed(1),
    titleTop: (baseline - ascender).toFixed(1),
    titleBaseline: baseline.toFixed(1),
    titleBottom: (baseline + descender).toFixed(1),
    baselineRight: baselineRight.toFixed(1),
    maxUsed: max.toFixed(1),
    overlapPercent: overlapPercent.toFixed(1),
    signArea: signArea.toFixed(1),
    overlapArea: overlapArea.toFixed(1)
  };
}

console.log('=== AFTER FIX (baseline=0.82, max=0.73 for over) ===');
console.log(measureOverlap());

// Also verify tall/square unchanged
function measureTall() {
  const state = Scenes.compose('tall');
  state.size = 100;
  state.grade = 'vice';
  
  const [w, h] = Cover.formats.tall;
  const u = Math.min(w, h);
  
  const isOver = state.titlePos === 'over'; // false for tall
  const baseline = h * (state.titlePos === 'centre' ? .58 : isOver ? .82 : .825);
  const max = w * (isOver ? 0.73 : 0.85);
  
  return { baseline: baseline.toFixed(1), max: max.toFixed(1), titlePos: state.titlePos };
}

function measureSquare() {
  const state = Scenes.compose('square');
  state.size = 100;
  state.grade = 'vice';
  
  const [w, h] = Cover.formats.square;
  const u = Math.min(w, h);
  
  const isOver = state.titlePos === 'over'; // false for square
  const baseline = h * (state.titlePos === 'centre' ? .58 : isOver ? .82 : .825);
  const max = w * (isOver ? 0.73 : 0.85);
  
  return { baseline: baseline.toFixed(1), max: max.toFixed(1), titlePos: state.titlePos };
}

console.log('\n=== Tall (should be unchanged) ===');
console.log(measureTall());

console.log('\n=== Square (should be unchanged) ===');
console.log(measureSquare());
