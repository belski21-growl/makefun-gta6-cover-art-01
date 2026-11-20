(() => {
  const $ = id => document.getElementById(id);
  const canvas = $('cover'), work = $('work'), picker = $('files');
  const settings = ['format', 'title', 'subtitle', 'tagline', 'badge', 'volume', 'quote', 'source',
    'titlePos', 'ink', 'size', 'grade', 'strength', 'halftone', 'grain', 'speed', 'tags',
    'seal', 'volumeChip', 'ribbon', 'press'];
  const captionInputs = [...document.querySelectorAll('[data-caption]')];
  const sampleNames = ['Boulevard', 'Copper Pier', 'Ember Point', 'Lantern Road', 'Glasswater Bay', 'Crescent Palms'];
  let state = { ...Scenes.initial, photos: [], bank: Scenes.captions.map(caption => ({
    ...Scenes.crop(), image: null, portrait: false, caption: [...caption]
  })) };
  let active = 0, boxes = [], frame, drag, request = 0, replaceSlot = null;
  const undo = [], redo = [];
  const status = message => { $('status').textContent = message; };
  const count = () => Cover.layouts[state.layout].cells.length;
  const snapshot = () => ({ ...state, bank: state.bank.map(panel => ({ ...panel, caption: [...panel.caption] })) });
  const updateHistory = () => {
    $('undo').disabled = !undo.length;
    $('redo').disabled = !redo.length;
  };
  function remember(before) {
    undo.push(before);
    if (undo.length > 32) undo.shift();
    redo.length = 0;
    updateHistory();
  }
  function travel(from, to) {
    if (!from.length || drag) return;
    to.push(snapshot());
    state = from.pop();
    sync();
    queuePaint();
  }
  function change(callback) {
    remember(snapshot());
    callback();
    sync();
    queuePaint();
  }
  function paint() {
    frame = undefined;
    boxes = Cover.render(canvas, state);
    $('board').style.setProperty('--ratio', canvas.width / canvas.height);
    $('dimensions').textContent = canvas.width + ' × ' + canvas.height;
  }
  function queuePaint() {
    if (frame === undefined) frame = requestAnimationFrame(paint);
  }
  function syncPanel() {
    active = Math.min(active, count() - 1);
    const panel = state.bank[active];
    for (const key of ['zoom', 'angle']) $(key).value = panel[key];
    captionInputs.forEach((input, i) => { input.value = panel.caption[i]; });
    $('active-panel').textContent = 'Panel ' + (active + 1) + ' / ' + count();
    [...$('panels').children].forEach((button, i) => {
      button.hidden = i >= count();
      button.setAttribute('aria-pressed', String(i === active));
    });
    $('fill').disabled = !panel.image;
    $('spread').disabled = !state.photos.length;
  }
  function sync() {
    settings.forEach(key => {
      const input = $(key);
      if (input.type === 'checkbox') input.checked = state[key];
      else input.value = state[key];
    });
    [...$('layouts').children].forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.layout === state.layout));
    });
    syncPanel();
    updateHistory();
  }

  for (const [key, layout] of Object.entries(Cover.layouts)) {
    const button = document.createElement('button'), icon = document.createElement('span');
    icon.className = 'mini';
    icon.setAttribute('aria-hidden', 'true');
    button.dataset.layout = key;
    layout.cells.forEach(([x, y, w, h]) => {
      const tile = document.createElement('i');
      Object.assign(tile.style, { left: x * 100 + '%', top: y * 100 + '%', width: w * 100 + '%', height: h * 100 + '%' });
      icon.append(tile);
    });
    button.append(icon, layout.name);
    button.onclick = () => {
      if (state.layout === key) return;
      change(() => {
        state.layout = key;
        if (key === 'centre') state.titlePos = 'centre';
        else if (state.titlePos === 'centre') state.titlePos = Scenes.compose(state.format).titlePos;
      });
    };
    $('layouts').append(button);
  }
  state.bank.forEach((_, i) => {
    const button = document.createElement('button');
    button.textContent = i + 1;
    button.setAttribute('aria-label', 'Panel ' + (i + 1));
    button.onclick = () => { active = i; syncPanel(); };
    $('panels').append(button);
  });
  for (const [key, grade] of Object.entries(Cover.grades)) $('grade').add(new Option(grade.name, key));

  function bind(input, apply) {
    let before;
    input.addEventListener('input', () => {
      if (!before) {
        before = snapshot();
        remember(before);
      }
      const value = input.type === 'checkbox' ? input.checked : input.type === 'range' ? Number(input.value) : input.value;
      apply(value);
      queuePaint();
    });
    const end = () => { before = undefined; };
    input.addEventListener('change', end);
    input.addEventListener('blur', end);
    input.addEventListener('art-history', end);
  }
  settings.forEach(key => bind($(key), value => {
    if (key === 'format') {
      Object.assign(state, Scenes.compose(value));
      sync();
    } else state[key] = value;
  }));
  ['zoom', 'angle'].forEach(key => bind($(key), value => { state.bank[active][key] = value; }));
  captionInputs.forEach((input, i) => bind(input, value => { state.bank[active].caption[i] = value; }));
  function historyAction(from, to) {
    document.activeElement?.dispatchEvent(new Event('art-history'));
    travel(from, to);
  }
  $('undo').onclick = () => historyAction(undo, redo);
  $('redo').onclick = () => historyAction(redo, undo);
  window.addEventListener('keydown', event => {
    if (!(event.ctrlKey || event.metaKey) || event.altKey || event.key.toLowerCase() !== 'z') return;
    event.preventDefault();
    if (event.shiftKey) historyAction(redo, undo);
    else historyAction(undo, redo);
  });

  function assign(slot, photo) {
    state.bank[slot] = { ...Scenes.crop(), image: photo.image, portrait: photo.portrait, focus: photo.focus, caption: [...photo.caption] };
  }
  function spread(photos) {
    state.bank.forEach((_, i) => assign(i, photos[i % photos.length]));
  }
  function loadSource(source) {
    const image = new Image();
    image.src = source;
    return image.decode().then(() => image);
  }
  async function samples(firstLoad = false) {
    const version = ++request;
    try {
      const payloads = JSON.parse($('sample-photos').textContent);
      const images = await Promise.all(payloads.map(payload => {
        const base = payload.replace(/-/g, '+').replace(/_/g, '/');
        return loadSource('data:image/webp;base64,' + base.padEnd(Math.ceil(base.length / 4) * 4, '='));
      }));
      if (request !== version) return;
      const apply = () => {
        state.photos = images.map((image, i) => ({
          image, portrait: i < 2, focus: Scenes.photoFocus[i], caption: Scenes.captions[i], name: sampleNames[i]
        }));
        spread(state.photos);
        const defaults = Scenes.crops(state.format);
        state.bank.forEach((panel, i) => {
          if (i >= state.photos.length) state.bank[i].caption = [...Scenes.captions[i]];
          if (defaults[i]) Object.assign(panel, defaults[i]);
        });
      };
      if (firstLoad) { apply(); sync(); paint(); }
      else change(apply);
      status('Sample photos ready');
    } catch {
      if (request === version) status('Could not load the sample photos.');
    }
  }
  async function upload(files, slot) {
    const inputs = [...files].slice(0, slot === null ? 6 : 1);
    if (!inputs.length) return;
    const version = ++request;
    const decoded = await Promise.allSettled(inputs.map(async (file, i) => {
      const url = URL.createObjectURL(file);
      try {
        return { image: await loadSource(url), portrait: false, caption: Scenes.captions[i], name: file.name };
      } finally { URL.revokeObjectURL(url); }
    }));
    if (version !== request) return;
    const photos = decoded.flatMap(result => result.status === 'fulfilled' ? [result.value] : []);
    if (!photos.length) { status('Could not open those photos.'); return; }
    change(() => {
      if (slot === null) {
        state.photos = photos;
        spread(photos);
      } else {
        const photo = { ...photos[0], caption: [...state.bank[slot].caption] };
        state.photos = [photo, ...state.photos];
        assign(slot, photo);
      }
    });
    status(photos.length + ' photo' + (photos.length === 1 ? '' : 's') + ' added');
  }
  function openPicker(slot) {
    replaceSlot = slot;
    picker.multiple = slot === null;
    picker.click();
  }
  $('pick').onclick = () => openPicker(null);
  $('replace').onclick = () => openPicker(active);
  picker.onchange = () => {
    upload(picker.files, replaceSlot);
    picker.value = '';
  };
  $('samples').onclick = () => samples();
  $('reset').onclick = () => change(() => Object.assign(state.bank[active], Scenes.crop()));
  $('fill').onclick = () => change(() => {
    const source = state.bank[active];
    state.bank = state.bank.map(() => ({ ...source, caption: [...source.caption] }));
  });
  $('spread').onclick = () => change(() => spread(state.photos));
  $('surprise').onclick = () => change(() => {
    function different(keys, current) {
      const choices = keys.filter(key => key !== current);
      return choices[Math.floor(Math.random() * choices.length)];
    }
    state.layout = different(Object.keys(Cover.layouts), state.layout);
    state.grade = different(Object.keys(Cover.grades), state.grade);
    state.titlePos = state.layout === 'centre' ? 'centre' : Scenes.compose(state.format).titlePos;
  });

  work.ondragover = event => { event.preventDefault(); work.classList.add('drop-ready'); };
  work.ondragleave = event => {
    if (!work.contains(event.relatedTarget)) work.classList.remove('drop-ready');
  };
  work.ondrop = event => {
    event.preventDefault();
    work.classList.remove('drop-ready');
    upload(event.dataTransfer.files, null);
  };
  window.addEventListener('dragover', event => event.preventDefault());
  window.addEventListener('drop', event => event.preventDefault());

  function point(event) {
    const bounds = canvas.getBoundingClientRect();
    return [(event.clientX - bounds.left) * canvas.width / bounds.width,
      (event.clientY - bounds.top) * canvas.height / bounds.height];
  }
  if (!Scenes.coverOnly) {
    canvas.onpointerdown = event => {
      if (event.button !== 0 || drag) return;
      const [x, y] = point(event);
      const index = boxes.findIndex(box => x >= box.left && x <= box.left + box.width &&
        y >= box.top && y <= box.top + box.height);
      if (index < 0) return;
      active = index;
      syncPanel();
      drag = { x, y, index, id: event.pointerId, before: snapshot() };
      canvas.setPointerCapture(event.pointerId);
    };
    canvas.onpointermove = event => {
      if (!drag || event.pointerId !== drag.id) return;
      const [x, y] = point(event), box = boxes[drag.index];
      if (!box || (x === drag.x && y === drag.y)) return;
      if (drag.before) {
        remember(drag.before);
        drag.before = null;
      }
      const panel = state.bank[drag.index];
      panel.x = Math.max(-3, Math.min(3, panel.x + (x - drag.x) / box.width));
      panel.y = Math.max(-3, Math.min(3, panel.y + (y - drag.y) / box.height));
      Object.assign(drag, { x, y });
      queuePaint();
    };
    canvas.onlostpointercapture = () => { drag = null; };
  }

  let exporting = false;
  async function exportSizes(formats) {
    if (exporting) return;
    exporting = true;
    $('export').disabled = $('export-all').disabled = true;
    const original = snapshot();
    const output = document.createElement('canvas');
    try {
      await fonts;
      for (const format of formats) {
        const scene = format === original.format ? original : { ...original, ...Scenes.compose(format) };
        Cover.render(output, scene);
        const blob = await new Promise(resolve => output.toBlob(resolve, 'image/png'));
        if (!blob) throw new Error('PNG unavailable');
        const url = URL.createObjectURL(blob), link = document.createElement('a');
        link.href = url;
        link.download = 'sunset-cover-' + output.width + 'x' + output.height + '.png';
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 3000);
      }
      status(formats.length === 1 ? 'PNG ready' : 'All three PNGs ready');
    } catch {
      status('Could not finish saving the PNGs.');
    } finally {
      exporting = false;
      $('export').disabled = $('export-all').disabled = false;
    }
  }
  $('export').onclick = () => exportSizes([state.format]);
  $('export-all').onclick = () => exportSizes(Object.keys(Cover.formats));

  document.body.classList.toggle('shot-cover', Scenes.coverOnly);
  sync();
  const fonts = Promise.allSettled(['32px Display', '16px Studio', '60px "Great Vibes"'].map(font => document.fonts.load(font)));
  fonts.then(async () => {
    paint();
    await samples(true);
    await Scenes.waitForPaint();
  });
})();
