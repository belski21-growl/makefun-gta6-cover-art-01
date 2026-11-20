(() => {
  const byId = id => document.getElementById(id);
  const canvas = byId('cover');
  const work = byId('work');
  const picker = byId('files');
  const neutralCrop = () => ({ x:0, y:0, zoom:1, angle:0 });
  const panelBank = Array.from({length:Math.max(...Object.values(Cover.layouts).map(layout => layout.cells.length))}, (_, i) => ({image:null,...neutralCrop(), ...(Scenes.initial.panelCaptions?.[i] || {})}));
  const state = { ...Scenes.initial, panels: panelBank.slice(0,Cover.layouts[Scenes.initial.layout].cells.length) };
  let sampleMode = false;
  const controls = ['format','title','subtitle','ink','size','neon','warm','shade','zoom','angle','tagline','badge','volume','quote','quoteSource','titlePos','preset','halftone','grain','speedLines','locationTags','badgeSeal','volumeChip','ribbon','quoteStrip'];
  let history = [], historyIndex = -1, restoring = false;
  const imageIds = new WeakMap();
  let imageId = 0;
  function snapshot() {
    const {panels, ...values} = state;
    return {values:{...values}, panels:panelBank.map(panel => ({...panel})), sampleMode};
  }
  function signature(value) {
    return JSON.stringify(value, (key,item) => {
      if (key !== 'image' || !item) return item;
      if (!imageIds.has(item)) imageIds.set(item,++imageId);
      return imageIds.get(item);
    });
  }
  function remember() {
    if (restoring || drag) return;
    const value = snapshot();
    if (historyIndex >= 0 && signature(value) === signature(history[historyIndex])) return;
    history.splice(historyIndex+1);
    history.push(value);
    if (history.length > 100) history.shift();
    historyIndex = history.length-1;
    syncHistory();
  }
  function syncHistory() {
    byId('undo').disabled = historyIndex <= 0;
    byId('redo').disabled = historyIndex >= history.length-1;
  }
  function syncUI() {
    for (const key of controls) {
      if (key === 'zoom' || key === 'angle') continue;
      const control = byId(key);
      if (control.type === 'checkbox') control.checked = !!state[key];
      else control.value = state[key];
    }
    Array.from(byId('layouts').children).forEach((button,index) => button.setAttribute('aria-pressed',String(Object.keys(Cover.layouts)[index] === state.layout)));
    choosePanel(Math.min(active,state.panels.length-1));
  }
  function restore(offset) {
    const index = historyIndex+offset;
    if (index < 0 || index >= history.length) return;
    ++request;
    drag = undefined;
    restoring = true;
    historyIndex = index;
    const saved = history[index];
    Object.assign(state,saved.values);
    saved.panels.forEach((panel,i) => { panelBank[i] = {...panel}; });
    sampleMode = saved.sampleMode;
    syncPanels(); syncUI(); repaint(); syncHistory();
    restoring = false;
  }
  byId('undo').onclick = () => restore(-1);
  byId('redo').onclick = () => restore(1);
  document.addEventListener('keydown',event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault(); restore(event.shiftKey ? 1 : -1);
    }
  });
  document.addEventListener('focusin',event => {
    const id = event.target.id;
    const step = event.target.closest('.export-bar') ? '3' :
      ['pick','replace','samples','auto-fill','spread','zoom','angle','reset'].includes(id) || event.target.closest('#panels') || event.target === canvas ? '1' : '2';
    document.querySelectorAll('[data-step]').forEach(item => {
      if (item.dataset.step === step) item.setAttribute('aria-current','step');
      else item.removeAttribute('aria-current');
    });
  });

  function syncPanels() {
    state.panels = panelBank.slice(0,Cover.layouts[state.layout].cells.length);
  }

  function applySampleCrops() {
    const crops = Scenes.compositions[state.format].crops;
    panelBank.forEach((panel,index) => {
      [panel.x,panel.y,panel.zoom] = crops[index] || [0,0,1];
    });
  }
  let active = 0;
  let boxes = [];
  let drag;
  let frame;
  let request = 0;
  let singleUpload = false;

  function status(message) {
    byId('status').textContent = message;
  }

  function repaint() {
    if (frame !== undefined) cancelAnimationFrame(frame);
    frame = undefined;
    boxes = Cover.render(canvas,state);
    byId('board').style.setProperty('--ratio',canvas.width/canvas.height);
    byId('dimensions').textContent = canvas.width + ' × ' + canvas.height;
  }

  function queuePaint() {
    remember();
    if (frame === undefined) frame = requestAnimationFrame(repaint);
  }

  function choosePanel(index) {
    active = index;
    const count = Cover.layouts[state.layout].cells.length;
    const buttons = Array.from({length:count}, (_,i) => {
      const button = document.createElement('button');
      button.textContent = String(i+1);
      button.setAttribute('aria-label','Panel ' + (i+1));
      button.setAttribute('aria-pressed',String(i === index));
      button.onclick = () => {
        choosePanel(i);
        byId('panels').children[i].focus();
      };
      return button;
    });
    byId('panels').replaceChildren(...buttons);
    byId('active-panel').textContent = 'Panel ' + (index+1) + ' / ' + count;
    for (const key of ['zoom','angle']) byId(key).value = state.panels[index][key];
  }

  for (const [key, layout] of Object.entries(Cover.layouts)) {
    const button = document.createElement('button');
    const icon = document.createElement('span');
    icon.className = 'mini';
    icon.setAttribute('aria-hidden','true');
    for (const [x,y,w,h] of layout.cells) {
      const pane = document.createElement('i');
      Object.assign(pane.style,{left:x*100+'%',top:y*100+'%',width:w*100+'%',height:h*100+'%'});
      icon.append(pane);
    }
    button.append(icon,layout.name);
    button.setAttribute('aria-pressed',String(state.layout === key));
    button.onclick = () => {
      state.layout = key;
      if (key === 'centre-title') {state.titlePos='centre';byId('titlePos').value=state.titlePos;}
      syncPanels();
      for (const option of byId('layouts').children) option.setAttribute('aria-pressed',String(option === button));
      choosePanel(0);
      queuePaint();
    };
    byId('layouts').append(button);
  }

  for (const key of controls) {
    const control = byId(key);
    const isCrop = key === 'zoom' || key === 'angle';
    if (!isCrop) { if (control.type === 'checkbox') control.checked = !!state[key]; else control.value = state[key]; }
    control.addEventListener('input', () => {
      const target = isCrop ? state.panels[active] : state;
      target[key] = control.type === 'checkbox' ? control.checked : control.type === 'range' ? Number(control.value) : control.value;
      if (key === 'format') {
        state.layout = Scenes.compositions[state.format].layout;
        syncPanels();
        if (sampleMode) applySampleCrops();
        Array.from(byId('layouts').children).forEach((button,index) => button.setAttribute('aria-pressed',String(Object.keys(Cover.layouts)[index] === state.layout)));
        choosePanel(0);
      }
      queuePaint();
    });
  }

  function distribute(images, sample = false) {
    sampleMode = sample;
    for (const [index,panel] of panelBank.entries()) {
      Object.assign(panel,neutralCrop(),{ image:images[index%images.length], faceSafe:sample && index%images.length < 2, fit:sample && index%images.length >= 2 ? 'contain' : 'cover' });
    }
    if (sample) applySampleCrops();
    remember();
    choosePanel(active);
    repaint();
  }

  let sampleCache;
  async function loadSamples() {
    if (sampleCache) return sampleCache;
    sampleCache = Promise.all(JSON.parse(byId('sample-photos').textContent).map(async source => {
      const image = new Image();
      const encoded = source.split('_').join('/').split('-').join('+');
      image.src = 'data:image/webp;base64,' + encoded + '='.repeat((4 - encoded.length % 4) % 4);
      await image.decode();
      return image;
    })).catch(error => { sampleCache = undefined; throw error; });
    return sampleCache;
  }

  async function showSamples() {
    const version = ++request;
    try {
      const images = await loadSamples();
      if (version !== request) return;
      distribute(images,true);
      status('Drop photos here · Drag a panel to reposition');
    } catch {
      status('Sample photos could not load. You can add your own photos.');
    }
  }

  async function importPhotos(files, destination = null) {
    const inputs = Array.from(files).slice(0,destination === null ? state.panels.length : 1);
    if (!inputs.length) return;
    const version = ++request;
    const results = await Promise.allSettled(inputs.map(file => createImageBitmap(file)));
    const images = results.flatMap(result => result.status === 'fulfilled' ? [result.value] : []);
    if (version !== request) {
      images.forEach(image => image.close());
      return;
    }
    if (!images.length) {
      status('Could not open those photos. Try JPEG, PNG or WebP.');
      return;
    }
    if (destination === null) distribute(images);
    else {
      const panel = state.panels[destination];
      sampleMode = false;
      Object.assign(panel,neutralCrop(),{image:images[0],faceSafe:false,fit:'cover'});
      remember();
      choosePanel(active);
      repaint();
    }
    status(images.length === inputs.length ? 'Drag a panel to reposition its photo' : 'Some photos could not be opened');
  }

  function openPicker(onePanel) {
    singleUpload = onePanel;
    picker.multiple = !onePanel;
    picker.click();
  }

  byId('pick').onclick = () => openPicker(false);
  byId('replace').onclick = () => openPicker(true);
  byId('samples').onclick = showSamples;
  const shuffled = items => {
    const result = [...items];
    for (let i=result.length-1;i>0;i--) {const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
    return result;
  };
  byId('auto-fill').onclick = async () => {
    const version = ++request;
    try {
      const samples = await loadSamples();
      if (version !== request) return;
      const used = new Set(state.panels.map(panel => panel.image).filter(Boolean));
      const available = shuffled(samples.filter(image => !used.has(image)));
      for (const panel of state.panels) {
        if (!panel.image && available.length) {
          const image = available.pop();
          Object.assign(panel,neutralCrop(),{image,faceSafe:samples.indexOf(image)<2,fit:samples.indexOf(image)>=2?'contain':'cover'});
        }
      }
      choosePanel(active); queuePaint(); status('Empty panels filled with unique sample photos');
    } catch { status('Sample photos could not load.'); }
  };
  byId('spread').onclick = () => {
    ++request;
    const photos = [...new Set(panelBank.map(panel => panel.image).filter(Boolean))];
    if (!photos.length) {status('Add photos first');return;}
    const sources = photos.map(image => ({...panelBank.find(panel => panel.image === image)}));
    panelBank.forEach((panel,i) => {
      const source=sources[i%sources.length];
      Object.assign(panel,neutralCrop(),{image:source.image,faceSafe:source.faceSafe,fit:source.fit});
    });
    sampleMode=false;choosePanel(active);queuePaint();status('Photos spread across all panels');
  };
  byId('surprise').onclick = () => {
    const pick = values => values[Math.floor(Math.random()*values.length)];
    state.layout=pick(Object.keys(Cover.layouts));
    if (state.layout === 'centre-title') state.titlePos='centre';
    state.preset=pick(Array.from(byId('preset').options,option => option.value));
    const composition=pick(Object.values(Scenes.compositions));
    state.title=composition.title;
    state.tagline=pick([Scenes.initial.tagline,...Object.values(Scenes.compositions).map(item => item.subtitle.toUpperCase())]);
    syncPanels();syncUI();queuePaint();
  };
  byId('reset').onclick = () => {
    Object.assign(state.panels[active],neutralCrop());
    choosePanel(active);
    queuePaint();
  };
  picker.onchange = () => {
    importPhotos(picker.files,singleUpload ? active : null);
    picker.value = '';
  };

  work.ondragover = event => {
    event.preventDefault();
    work.classList.add('drop-ready');
  };
  work.ondragleave = event => {
    if (!work.contains(event.relatedTarget)) work.classList.remove('drop-ready');
  };
  work.ondrop = event => {
    event.preventDefault();
    work.classList.remove('drop-ready');
    importPhotos(event.dataTransfer.files);
  };
  window.addEventListener('dragover',event => event.preventDefault());
  window.addEventListener('drop',event => event.preventDefault());

  function pointerOnPoster(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x:(event.clientX-rect.left)*canvas.width/rect.width,
      y:(event.clientY-rect.top)*canvas.height/rect.height
    };
  }

  if (!Scenes.coverOnly) {
    canvas.onpointerdown = event => {
      if (event.button !== 0 || drag) return;
      const point = pointerOnPoster(event);
      const index = Cover.hit(canvas,boxes,point.x,point.y);
      if (index < 0) return;
      choosePanel(index);
      canvas.setPointerCapture(event.pointerId);
      drag = { point, index, id:event.pointerId };
    };
    canvas.onpointermove = event => {
      if (!drag || event.pointerId !== drag.id) return;
      const point = pointerOnPoster(event);
      const panel = state.panels[drag.index];
      const box = boxes[drag.index];
      if (!box) return;
      panel.x = Math.max(-2,Math.min(2,panel.x+(point.x-drag.point.x)/box.width));
      panel.y = Math.max(-2,Math.min(2,panel.y+(point.y-drag.point.y)/box.height));
      drag.point = point;
      queuePaint();
    };
    canvas.onlostpointercapture = () => { drag = undefined; remember(); };
  }

  async function download(output) {
    const name = 'sunset-cover-' + output.width + 'x' + output.height + '.png';
    const blob = await new Promise(resolve => output.toBlob(resolve,'image/png'));
    if (!blob) throw new Error('PNG could not be saved');
    const link = document.createElement('a');
    link.href=URL.createObjectURL(blob);link.download=name;link.click();
    setTimeout(() => URL.revokeObjectURL(link.href),3000);
  }
  byId('export').onclick = async () => {
    try {repaint();await download(canvas);status('PNG downloaded');}
    catch {status('The PNG could not be saved. Try exporting again.');}
  };
  byId('export-all').onclick = async () => {
    try {
      const saved=snapshot();
      for (const format of ['wide','tall','square']) {
        const output=document.createElement('canvas');
        Cover.render(output,{...saved.values,format,panels:saved.panels.slice(0,Cover.layouts[saved.values.layout].cells.length)});
        await download(output);
      }
      status('Three PNGs exported. Allow multiple downloads if your browser asks.');
    } catch {status('Export failed. Try exporting again.');}
  };

  async function start() {
    document.body.classList.toggle('shot-cover',Scenes.coverOnly);
    choosePanel(0);
    remember();
    await Promise.all([document.fonts.load('32px Display'),document.fonts.load('16px Studio')]);
    repaint();
    await showSamples();
    remember();
    await Scenes.waitForPaint();
  }
  start();
})();
