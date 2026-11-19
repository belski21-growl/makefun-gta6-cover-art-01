const Scenes = (() => {
  const params = new URLSearchParams(location.search);
  const mode = params.get('shot');
  const compositions = {
    wide: { layout: 'strip', title: 'Afterglow', subtitle: 'Last light on the coast', ink: '#ffd6ab',
      crops: [[0, .14, 1.08], [.13, .11, 1.26], [-.15, -.18, 1.35]] },
    tall: { layout: 'three', title: 'Night Tide', subtitle: 'The shoreline after dark', ink: '#f9bddb',
      crops: [[0, .14, 1.04], [.07, .13, 1.25], [-.15, -.08, 1.3]] },
    square: { layout: 'grid', title: 'Heatwave', subtitle: 'High sun / low tide', ink: '#ffe2a1',
      crops: [[0, .12, 1.1], [.11, .18, 1.18], [.09, -.2, 1.55], [-.22, -.12, 1.65]] }
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
    initial: { ...composition, format, size: 110, neon: 57, warm: 35, shade: 44 },
    crops,
    waitForPaint
  };
})();
