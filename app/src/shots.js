const Scenes = (() => {
  const params = new URLSearchParams(location.search);
  const mode = params.get('shot');
  const compositions = {
    wide: { layout: 'mosaic', title: 'Afterglow', subtitle: 'Last light on the coast', ink: '#ffd6ab',
      crops: [[0, .36, 1], [0, .32, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]] },
    tall: { layout: 'mosaic', title: 'Night Tide', subtitle: 'The shoreline after dark', ink: '#f9bddb',
      crops: [[0, .42, 1], [0, .32, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [-.28, -.5, 1]] },
    square: { layout: 'mosaic', title: 'Heatwave', subtitle: 'High sun / low tide', ink: '#ffe2a1',
      crops: [[0, .32, 1], [0, .32, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, -.5, 1]] }
  };
  const requested = params.get('format');
  const format = Object.hasOwn(compositions, requested) ? requested : 'wide';
  const { crops, ...composition } = compositions[format];

  async function waitForPaint() {
    if (mode !== 'editor' && mode !== 'cover') return;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    window.__shotReady = true;
  }

  return {
    coverOnly: mode === 'cover',
    initial: { ...composition, format, size: 130, neon: 82, warm: 68, shade: 58,
      script: 'one last summer', titlePos: 'bottom', preset: 'Vice Sunset', gradeStrength: 88,
      halftone: true, grain: true, speedLines: false, locationTags: true, badgeSeal: true, volumeChip: true, ribbon: true, quoteStrip: true, grainStrength: 14,
      quote: 'PURE GOLDEN-HOUR MAYHEM', quoteSource: 'THE HARBOR GAZETTE', volume: 'VOL. I',
      tagline: 'FIVE FRIENDS • ONE COAST • NO WAY BACK',
      credits: 'A SUNSET PICTURES PRODUCTION — STARRING YOU — SHOT ON YOUR OWN CAMERA — GRADED BY HAND',
      badge: 'ORIGINAL COVER ART',
      panelCaptions: [
        { role: 'THE DRIVER', place: 'OCEAN DRIVE', time: '6:42 PM' },
        { role: 'THE ANGLER', place: 'PIER 26', time: '7:15 PM' },
        { role: 'THE LOOKOUT', place: 'SKYLINE', time: '8:03 PM' },
        { role: 'THE GETAWAY', place: 'COAST ROAD', time: '8:32 PM' },
        { role: 'THE CAPTAIN', place: 'MARINA BAY', time: '9:40 PM' },
        { role: 'THE FIXER', place: 'DINER ROW', time: '11:58 PM' }
      ] },
    crops,
    compositions,
    waitForPaint
  };
})();
