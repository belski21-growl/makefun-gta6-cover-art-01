const fs = require('node:fs');
const vm = require('node:vm');

const read = file => fs.readFileSync(__dirname + '/' + file, 'utf8');
const sandbox = vm.createContext({ URLSearchParams, location: { search: '' } });
const { Cover, Scenes } = vm.runInContext(
  read('app/src/cover.js') + '\n' + read('app/src/shots.js') + '\n({ Cover, Scenes })', sandbox
);

// Wide format: 1920x1080, mosaic layout, titlePos: 'over'
const state = Scenes.compose('wide');
state.size = 100;
state.grade = 'vice';

const [w, h] = Cover.formats.wide;
const u = Math.min(w, h);
console.log(`Cover: ${w}x${h}, u=${u}`);

// Get geometry for wide mosaic
const boxes = Cover.geometry(state);
console.log('\n=== Cell Geometry (pixels) ===');
boxes.forEach((box, i) => {
  console.log(`Cell ${i}: left=${box.left.toFixed(1)}, top=${box.top.toFixed(1)}, width=${box.width.toFixed(1)}, height=${box.height.toFixed(1)}, right=${(box.left+box.width).toFixed(1)}, bottom=${(box.top+box.height).toFixed(1)}`);
});

// Motel is cell 5
const motelBox = boxes[5];
console.log('\n=== Motel Cell (index 5) ===');
console.log(`left=${motelBox.left.toFixed(1)}, top=${motelBox.top.toFixed(1)}, width=${motelBox.width.toFixed(1)}, height=${motelBox.height.toFixed(1)}`);
console.log(`right=${(motelBox.left+motelBox.width).toFixed(1)}, bottom=${(motelBox.top+motelBox.height).toFixed(1)}`);

// Title geometry
const baseline = h * 0.82;  // for wide with titlePos='over'
const size = u * 0.25 * state.size / 100;  // u * 0.25
const max = w * 0.85;
const skew = -0.12;
const x = w / 2;  // centered

console.log('\n=== Title Geometry ===');
console.log(`baseline=${baseline.toFixed(1)} (h * 0.82)`);
console.log(`size=${size.toFixed(1)} (u * 0.25)`);
console.log(`max=${max.toFixed(1)} (w * 0.85)`);
console.log(`skew=${skew}`);
console.log(`x=${x} (centered)`);

// The subtitle offset
const scriptSize = u * 0.055;
const scriptOffset = u * 0.055;
console.log(`scriptSize=${scriptSize.toFixed(1)}`);
console.log(`scriptOffset=${scriptOffset.toFixed(1)}`);

// The title "AFTERGLOW" - let's estimate the glyph bounds
// Using canvas measureText would be ideal, but we can approximate
// The font is 900 weight, Display family. At size ~270px (u=1080, 1080*0.25=270)
// The text is skewed by -0.12 radians (~-6.9 degrees)

// Let's compute the approximate width of "AFTERGLOW" at this size
// Average char width for bold display font at 270px ~ 160-180px per char
// 9 chars * ~170px = ~1530px, but max is capped at w*0.85 = 1632px
// So it fits within max

// The "W" is the last character. Let's estimate its position.
// With center alignment, the text spans from x - width/2 to x + width/2
// The "W" would be in the rightmost portion

// Let's compute where the right edge of the title text falls
// At size=270, max=1632, the text is constrained to max width
// So right edge = x + max/2 = 960 + 816 = 1776
// Left edge = x - max/2 = 960 - 816 = 144

console.log(`\nTitle text span (approx): left=${(x - max/2).toFixed(1)}, right=${(x + max/2).toFixed(1)}`);

// The motel cell spans from x=1536 to x=1728 (approx, let's check exact)
console.log(`\nMotel cell x span: ${motelBox.left.toFixed(1)} to ${(motelBox.left + motelBox.width).toFixed(1)}`);

// Title baseline is at y=885.6 (1080*0.82)
// The motel cell top is at y=606.5, bottom at y=889.3
// So the title baseline (885.6) is very close to the motel cell bottom (889.3)
// The title glyphs extend ABOVE the baseline (since baseline is bottom of text)
// For a 270px font, ascender ~200px, descender ~70px
// So text extends from y=885.6-200=685.6 to y=885.6+70=955.6

const ascender = size * 0.8;  // approximate
const descender = size * 0.25;
console.log(`\nTitle glyph vertical span: top=${(baseline - ascender).toFixed(1)}, baseline=${baseline.toFixed(1)}, bottom=${(baseline + descender).toFixed(1)}`);
console.log(`Motel cell vertical span: top=${motelBox.top.toFixed(1)}, bottom=${(motelBox.top + motelBox.height).toFixed(1)}`);

// Now let's look at the photo framing for the motel
const photoFocus = Scenes.photoFocus[5];
console.log(`\nPhotoFocus for motel: [${photoFocus[0]}, ${photoFocus[1]}]`);

// The source photo is 1280x1707 (portrait)
const iw = 1280, ih = 1707;
const crop = Scenes.crop();
crop.focus = photoFocus;
crop.portrait = true;

const frame = Cover.framing(motelBox, crop, iw, ih);
console.log(`\nPhoto framing:`);
console.log(`scale=${frame.scale.toFixed(4)}, angle=${frame.angle}, x=${frame.x.toFixed(1)}, y=${frame.y.toFixed(1)}`);

// The sign zone in source: left=.35, right=.67, top=.16, bottom=.61
// In source pixels: x=448..858, y=273..1041
// In destination (cell) coordinates:
const signLeft = (motelBox.width - iw * frame.scale) / 2 + frame.x + 0.35 * iw * frame.scale;
const signRight = (motelBox.width - iw * frame.scale) / 2 + frame.x + 0.67 * iw * frame.scale;
const signTop = (motelBox.height - ih * frame.scale) / 2 + frame.y + 0.16 * ih * frame.scale;
const signBottom = (motelBox.height - ih * frame.scale) / 2 + frame.y + 0.61 * ih * frame.scale;

// Convert to cover coordinates
const signLeftCover = motelBox.left + signLeft;
const signRightCover = motelBox.left + signRight;
const signTopCover = motelBox.top + signTop;
const signBottomCover = motelBox.top + signBottom;

console.log(`\n=== Neon Sign Rect (cover coordinates) ===`);
console.log(`left=${signLeftCover.toFixed(1)}, right=${signRightCover.toFixed(1)}, width=${(signRightCover-signLeftCover).toFixed(1)}`);
console.log(`top=${signTopCover.toFixed(1)}, bottom=${signBottomCover.toFixed(1)}, height=${(signBottomCover-signTopCover).toFixed(1)}`);

// Title glyph mask (approximate)
// The title "AFTERGLOW" at baseline=885.6, centered at x=960, max width=1632
// Skew = -0.12 means the text leans left at the top
// The glyphs extend from baseline - ascender to baseline + descender
// Horizontally from x - max/2 to x + max/2

const titleLeft = x - max/2;
const titleRight = x + max/2;
const titleTop = baseline - ascender;
const titleBottom = baseline + descender;

console.log(`\n=== Title Glyph Mask (approx) ===`);
console.log(`left=${titleLeft.toFixed(1)}, right=${titleRight.toFixed(1)}`);
console.log(`top=${titleTop.toFixed(1)}, bottom=${titleBottom.toFixed(1)}`);

// Overlap calculation
const overlapLeft = Math.max(signLeftCover, titleLeft);
const overlapRight = Math.min(signRightCover, titleRight);
const overlapTop = Math.max(signTopCover, titleTop);
const overlapBottom = Math.min(signBottomCover, titleBottom);

const overlapWidth = Math.max(0, overlapRight - overlapLeft);
const overlapHeight = Math.max(0, overlapBottom - overlapTop);
const overlapArea = overlapWidth * overlapHeight;
const signArea = (signRightCover - signLeftCover) * (signBottomCover - signTopCover);
const overlapPercent = (overlapArea / signArea) * 100;

console.log(`\n=== Overlap Analysis ===`);
console.log(`Overlap rect: left=${overlapLeft.toFixed(1)}, right=${overlapRight.toFixed(1)}, top=${overlapTop.toFixed(1)}, bottom=${overlapBottom.toFixed(1)}`);
console.log(`Overlap area: ${overlapArea.toFixed(1)}px²`);
console.log(`Sign area: ${signArea.toFixed(1)}px²`);
console.log(`Overlap: ${overlapPercent.toFixed(1)}%`);

// Which letters overlap?
// The title is centered at x=960, spans 144 to 1776
// "AFTERGLOW" = 9 letters. Each ~181px wide (1632/9)
// Letter positions (center of each):
// A: 144+90=234, F: 415, T: 596, E: 777, R: 958, G: 1139, L: 1320, O: 1501, W: 1682
// The motel sign spans ~1536 to 1728
// So the W (center ~1682, span ~1591-1773) overlaps significantly
// The O (center ~1501, span ~1410-1592) might overlap slightly

console.log(`\n=== Letter Overlap Estimate ===`);
const letterWidth = max / 9;
for (let i = 0; i < 9; i++) {
  const letterCenter = titleLeft + (i + 0.5) * letterWidth;
  const letterLeft = titleLeft + i * letterWidth;
  const letterRight = titleLeft + (i + 1) * letterWidth;
  const letterName = "AFTERGLOW"[i];
  const letterOverlapLeft = Math.max(letterLeft, signLeftCover);
  const letterOverlapRight = Math.min(letterRight, signRightCover);
  const letterOverlapWidth = Math.max(0, letterOverlapRight - letterOverlapLeft);
  const letterOverlapPercent = letterOverlapWidth / letterWidth * 100;
  if (letterOverlapWidth > 0) {
    console.log(`${letterName}: center=${letterCenter.toFixed(1)}, span=${letterLeft.toFixed(1)}-${letterRight.toFixed(1)}, overlap=${letterOverlapWidth.toFixed(1)}px (${letterOverlapPercent.toFixed(1)}%)`);
  }
}
