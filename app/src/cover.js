const Cover = (() => {
  const formats = { wide: [1920, 1080], tall: [1080, 1350], square: [1080, 1080] };
  const layouts = {
    mosaic: { name: 'Mosaic · 6 panels', cells: [
      [0, 0, .39, 1], [.39, 0, .30, .56], [.69, 0, .31, .56],
      [.39, .56, .20, .44], [.59, .56, .21, .44], [.80, .56, .20, .44]
    ] },
    strip: { name: 'Hero + strip', cells: [[0, 0, .62, 1], [.62, 0, .38, .5], [.62, .5, .38, .5]] },
    three: { name: 'Three panels', cells: [[0, 0, 1, .68], [0, .68, .5, .32], [.5, .68, .5, .32]] },
    grid: { name: '2×2 grid', cells: [[0, 0, .5, .5], [.5, 0, .5, .5], [0, .5, .5, .5], [.5, .5, .5, .5]] },
    right: { name: 'Hero right', cells: [[.39, 0, .61, 1], [0, 0, .39, .5], [0, .5, .39, .5]] },
    centre: { name: 'Centre title', cells: [[0, 0, .54, 1], [.54, 0, .46, 1]] },
    comic: { name: 'Comic · 6 panels', cells: [
      [0, 0, .48, .49], [.48, 0, .26, .49], [.74, 0, .26, .49],
      [0, .49, .25, .51], [.25, .49, .33, .51], [.58, .49, .42, .51]
    ] },
    single: { name: 'Single hero', cells: [[0, 0, 1, 1]] }
  };
  // Each palette maps shadows, midtones and highlights into a common ink set.
  const grades = {
    vice: { name: 'Vice Sunset', tones: [[29, 9, 43], [187, 55, 103], [255, 215, 129]], levels: 10, contrast: 1.36, chroma: .66 },
    neon: { name: 'Neon Night', tones: [[13, 12, 40], [92, 59, 181], [255, 152, 223]], levels: 9, contrast: 1.48, chroma: .70 },
    golden: { name: 'Golden Hour', tones: [[48, 19, 41], [214, 105, 49], [255, 234, 162]], levels: 13, contrast: 1.31, chroma: .72 },
    comic: { name: 'Comic Ink', tones: [[18, 10, 27], [198, 44, 104], [255, 229, 161]], levels: 5, contrast: 1.53, chroma: .49 },
    noir: { name: 'Noir Heat', tones: [[13, 12, 21], [127, 57, 54], [255, 225, 187]], levels: 8, contrast: 1.62, chroma: .25 }
  };
  const clamp = (v, low, high) => Math.max(low, Math.min(high, v));

  function geometry(state) {
    const [w, h] = formats[state.format];
    const u = Math.min(w, h);
    const left = u * .022, top = h * .067, gap = u * .0045;
    const bottom = state.titlePos === 'centre' ? .88 : state.titlePos === 'over' ? .823
      : state.format === 'wide' ? .70 : .72;
    return layouts[state.layout].cells.map(([x, y, cw, ch]) => ({
      left: left + x * (w - 2 * left) + gap,
      top: top + y * (h * bottom - top) + gap,
      width: cw * (w - 2 * left) - 2 * gap,
      height: ch * (h * bottom - top) - 2 * gap
    }));
  }

  function framing(box, panel, iw, ih) {
    const { width: w, height: h } = box;
    const angle = panel.angle * Math.PI / 180;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const rw = Math.abs(cos) * w + Math.abs(sin) * h;
    const rh = Math.abs(sin) * w + Math.abs(cos) * h;
    const scale = Math.max(rw / iw, rh / ih) * panel.zoom;
    const excessX = Math.max(0, (iw * scale - rw) / 2);
    const excessY = Math.max(0, (ih * scale - rh) / 2);
    const targetX = panel.focus && angle === 0 ? (.5 - panel.focus[0]) * iw * scale : 0;
    const targetY = panel.focus && angle === 0 ? (.5 - panel.focus[1]) * ih * scale
      : panel.portrait && angle === 0
      ? Math.min(excessY, Math.max(0, scale * ih / 2 - h * .46)) : 0;
    const x = clamp(targetX + panel.x * w * cos + panel.y * h * sin, -excessX, excessX);
    const y = clamp(targetY + panel.y * h * cos - panel.x * w * sin, -excessY, excessY);
    return { scale, angle, x: x * cos - y * sin, y: x * sin + y * cos };
  }

  const graded = new WeakMap();
  function plate(image, key, strength) {
    if (!strength) return image;
    const prior = graded.get(image);
    if (prior?.key === key && prior.strength === strength) return prior.canvas;
    const grade = grades[key];
    const canvas = prior?.canvas || document.createElement('canvas');
    const factor = Math.min(1, 1600 / Math.max(image.width, image.height));
    canvas.width = Math.max(1, Math.round(image.width * factor));
    canvas.height = Math.max(1, Math.round(image.height * factor));
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const p = pixels.data, mix = strength / 100;
    for (let i = 0; i < p.length; i += 4) {
      const lum = .24 * p[i] + .65 * p[i + 1] + .11 * p[i + 2];
      const t = clamp((lum / 255 - .45) * grade.contrast + .48, 0, 1);
      const ink = Math.round(t * grade.levels) / grade.levels * 2;
      const band = Math.min(1, Math.floor(ink)), step = ink - band;
      for (let c = 0; c < 3; c++) {
        const a = grade.tones[band][c], b = grade.tones[band + 1][c];
        const value = a + (b - a) * step + (p[i + c] - lum) * grade.chroma;
        p[i + c] += (value - p[i + c]) * mix;
      }
    }
    ctx.putImageData(pixels, 0, 0);
    graded.set(image, { key, strength, canvas });
    return canvas;
  }

  function gradient(ctx, y, h, stops) {
    const fill = ctx.createLinearGradient(0, y, 0, y + h);
    stops.forEach(([at, color]) => fill.addColorStop(at, color));
    return fill;
  }
  function rect(ctx, color, x, y, w, h) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }
  function type(ctx, text, x, y, size, color, width, align = 'left') {
    if (!text || width <= 0) return;
    ctx.font = size + 'px Display, sans-serif';
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(text, x, y, width);
  }

  let grainTile;
  function grain(ctx, box) {
    if (!grainTile) {
      grainTile = document.createElement('canvas');
      grainTile.width = grainTile.height = 128;
      const texture = grainTile.getContext('2d');
      const noise = texture.createImageData(128, 128);
      let seed = 507;
      for (let i = 0; i < noise.data.length; i += 4) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        noise.data[i] = noise.data[i + 1] = noise.data[i + 2] = seed & 256 ? 255 : 0;
        noise.data[i + 3] = (seed >>> 26) + 8;
      }
      texture.putImageData(noise, 0, 0);
    }
    rect(ctx, ctx.createPattern(grainTile, 'repeat'), box.left, box.top, box.width, box.height);
  }

  function photo(ctx, box, panel, state, u) {
    const { left, top, width, height } = box;
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, top, width, height);
    ctx.clip();
    rect(ctx, '#492638', left, top, width, height);
    if (panel?.image) {
      const { image } = panel;
      const { scale, angle, x, y } = framing(box, panel, image.width, image.height);
      const w = image.width * scale, h = image.height * scale;
      ctx.save();
      ctx.translate(left + width / 2 + x, top + height / 2 + y);
      ctx.rotate(angle);
      ctx.drawImage(plate(image, state.grade, state.strength), -w / 2, -h / 2, w, h);
      ctx.restore();
    }
    if (state.halftone) {
      const step = u * .007;
      ctx.fillStyle = '#190c27';
      ctx.globalAlpha = .27;
      ctx.beginPath();
      for (let y = top + step; y < top + height; y += step) {
        for (let x = left + step; x < left + width; x += step) {
          const r = step * (.20 + .10 * (y - top) / height);
          ctx.moveTo(x + r, y);
          ctx.arc(x, y, r, 0, Math.PI * 2);
        }
      }
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (state.grain) grain(ctx, box);
    if (state.speed) {
      ctx.strokeStyle = '#ffe6b354';
      ctx.lineWidth = u * .002;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const y = top + height * i / 9;
        ctx.moveTo(left + width, y);
        ctx.lineTo(left + width * (.83 + (i % 3) * .045), y * .92 + (top + height / 2) * .08);
      }
      ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = '#ffd093';
    ctx.lineWidth = u * .0014;
    ctx.strokeRect(left, top, width, height);
  }

  function chip(ctx, box, caption, u) {
    const [role, place, time] = caption;
    if (!(role || place || time)) return;
    const x = box.left + u * .012, y = box.top + u * .012;
    const size = u * .015;
    const padding = u * .016;
    const line = [place, time].filter(Boolean).join(' / ');
    ctx.font = size + 'px Display, sans-serif';
    const width = Math.min(box.width - u * .024,
      Math.max(ctx.measureText(role).width, ctx.measureText(line).width * .77) + 2 * padding);
    const height = u * (line ? .043 : .026);
    rect(ctx, '#140f1b', x, y, width, height);
    rect(ctx, '#fd609a', x, y, u * .004, height);
    type(ctx, role, x + padding, y + u * .013, size, '#fff1d4', width - 2 * padding);
    type(ctx, line, x + padding, y + u * .031, size * .77, '#ffc085', width - 2 * padding);
  }

  function title(ctx, state, w, h, u) {
    const wide = state.format === 'wide';
    const isOver = state.titlePos === 'over';
    const baseline = h * (state.titlePos === 'centre' ? .58 : isOver ? .82 : .825);
    const size = u * (wide ? .25 : .164) * state.size / 100;
    const scriptSize = u * (wide ? .091 : .079);
    const scriptOffset = u * (wide ? .055 : .046);
    const x = w / 2;
    const fadeTop = baseline - size * .81;
    const fade = gradient(ctx, fadeTop, h * .946 - fadeTop, [[0, '#160d1a00'], [.56, '#160d1abe'], [1, '#160d1a']]);
    rect(ctx, fade, u * .022, fadeTop, w - u * .044, h * .946 - fadeTop);
    ctx.save();
    ctx.translate(x, baseline);
    ctx.transform(1, 0, -.12, 1, 0, 0);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    ctx.font = size + 'px Display, sans-serif';
    const word = state.title.trim().toUpperCase(), max = w * (isOver ? .73 : .85);
    if (word) {
      ctx.lineWidth = u * .023;
      ctx.strokeStyle = '#100d19';
      ctx.strokeText(word, 0, u * .014, max);
      ctx.fillStyle = '#7e164b';
      ctx.fillText(word, 0, u * .014, max);
      ctx.lineWidth = u * .016;
      ctx.strokeText(word, 0, 0, max);
      ctx.lineWidth = u * .003;
      ctx.strokeStyle = '#ffe5b4';
      ctx.strokeText(word, 0, 0, max);
      ctx.fillStyle = gradient(ctx, -size * .74, size * .74, [
        [0, '#fff9e5'], [.32, '#ffe197'], [.52, state.ink], [.56, '#aa304b'],
        [.60, '#ff8d77'], [.72, '#ff497c'], [.76, '#a52568'], [.80, '#f551aa'], [1, '#a440a1']
      ]);
      ctx.fillText(word, 0, 0, max);
    }
    ctx.restore();
    if (state.subtitle.trim()) {
      ctx.save();
      ctx.font = scriptSize + 'px "Great Vibes", Studio, sans-serif';
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'center';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#591638';
      ctx.lineWidth = u * .012;
      ctx.shadowColor = '#ff498d';
      ctx.shadowBlur = u * .014;
      ctx.strokeText(state.subtitle, x, baseline + scriptOffset, w * .76);
      ctx.fillStyle = '#fff0eb';
      ctx.fillText(state.subtitle, x, baseline + scriptOffset, w * .76);
      ctx.restore();
    }
    if (state.tagline.trim()) {
      const y = baseline + u * .092;
      const width = w * .57;
      if (state.ribbon) {
        ctx.fillStyle = '#1a111d';
        ctx.strokeStyle = '#ffcf87';
        ctx.lineWidth = u * .0015;
        ctx.beginPath();
        ctx.moveTo(x - width / 2 + u * .013, y - u * .014);
        ctx.lineTo(x + width / 2, y - u * .014);
        ctx.lineTo(x + width / 2 - u * .013, y + u * .014);
        ctx.lineTo(x - width / 2, y + u * .014);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      type(ctx, state.tagline, x, y, u * .014, '#ffe7c3', width - u * .055, 'center');
    }
  }

  function seal(ctx, text, x, y, u) {
    const r = u * .057;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-.13);
    ctx.beginPath();
    for (let i = 0; i < 48; i++) {
      const a = i * Math.PI / 24, edge = r * (i % 2 ? .89 : 1);
      ctx.lineTo(Math.cos(a) * edge, Math.sin(a) * edge);
    }
    ctx.closePath();
    ctx.fillStyle = gradient(ctx, -r, 2 * r, [[0, '#fff0a9'], [.52, '#d68931'], [1, '#ffe5a0']]);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, r * .73, 0, 2 * Math.PI);
    ctx.fillStyle = '#201525';
    ctx.fill();
    ctx.lineWidth = u * .0015;
    ctx.strokeStyle = '#ffecaa';
    ctx.stroke();
    const words = text.trim().split(/\s+/);
    const cut = Math.ceil(words.length / 2);
    type(ctx, words.slice(0, cut).join(' '), 0, -r * .21, u * .010, '#ffe7aa', r * 1.22, 'center');
    type(ctx, words.slice(cut).join(' '), 0, r * .07, u * .013, '#fff5cf', r * 1.22, 'center');
    type(ctx, '★ ★ ★', 0, r * .40, u * .009, '#ff90ab', r, 'center');
    ctx.restore();
  }

  function dressing(ctx, state, w, h, u) {
    const margin = u * .027, pressY = h * .037;
    rect(ctx, '#261323', margin, h * .017, w - margin * 2, h * .040);
    if (state.press) {
      type(ctx, '★★★★★', margin + u * .007, pressY, u * .020, '#ffd278', u * .12);
      const label = [state.quote && '“' + state.quote + '”', state.source].filter(Boolean).join('  /  ');
      type(ctx, label, margin + u * .141, pressY, u * .014, '#ffefda',
        w - margin * 2 - u * (state.volumeChip ? .31 : .16));
    }
    if (state.volumeChip && state.volume) {
      rect(ctx, '#ffd17e', w - margin - u * .128, pressY - u * .014, u * .128, u * .028);
      type(ctx, state.volume, w - margin - u * .064, pressY, u * .015, '#231521', u * .107, 'center');
    }
    if (state.seal && state.badge.trim()) seal(ctx, state.badge, w - margin - u * .064, h * .859, u);

    const band = h * .943, trim = h * .972;
    rect(ctx, gradient(ctx, band, trim - band, [[0, '#8d285e'], [1, '#e57651']]), margin, band, w - margin * 2, trim - band);
    rect(ctx, '#ffd59a', margin, band, w - margin * 2, u * .0015);
    type(ctx, state.slogan, w / 2, (band + trim) / 2, u * .014, '#fff0ce', w - margin * 4, 'center');
    type(ctx, state.credit, margin, h * .981, u * .009, '#eec8b8', w - margin * 2 - u * .16);
    const bx = w - margin - u * .135, by = h * .975, bar = u * .135 / 48;
    rect(ctx, '#fff0d7', bx, by, u * .135, h * .014);
    for (let i = 2; i < 46; i++) {
      if ((i * i + i * 7 + 9) % 19 < 10) rect(ctx, '#170e1b', bx + i * bar, by + h * .002, bar, h * .010);
    }
    ctx.strokeStyle = '#e5a672';
    ctx.lineWidth = u * .0013;
    ctx.strokeRect(u * .010, u * .010, w - u * .020, h - u * .020);
  }

  function render(canvas, state) {
    const [w, h] = formats[state.format];
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    const ctx = canvas.getContext('2d'), u = Math.min(w, h);
    rect(ctx, gradient(ctx, 0, h, [[0, '#271426'], [.63, '#4b1b38'], [1, '#160d1a']]), 0, 0, w, h);
    const boxes = geometry(state);
    boxes.forEach((box, i) => photo(ctx, box, state.bank[i], state, u));
    if (state.tags) boxes.forEach((box, i) => chip(ctx, box, state.bank[i].caption, u));
    title(ctx, state, w, h, u);
    dressing(ctx, state, w, h, u);
    return boxes;
  }

  return { render, framing, geometry, layouts, formats, grades };
})();
