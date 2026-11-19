(() => {
  const byId = id => document.getElementById(id);
  const canvas = byId('cover');
  const work = byId('work');
  const picker = byId('files');
  const neutralCrop = () => ({ x:0, y:0, zoom:1, angle:0 });
  const state = { ...Scenes.initial, panels: Array.from({length:4}, () => ({image:null,...neutralCrop()})) };
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
      for (const option of byId('layouts').children) option.setAttribute('aria-pressed',String(option === button));
      choosePanel(0);
      queuePaint();
    };
    byId('layouts').append(button);
  }

  for (const key of ['format','title','subtitle','ink','size','neon','warm','shade','zoom','angle']) {
    const control = byId(key);
    const isCrop = key === 'zoom' || key === 'angle';
    if (!isCrop) control.value = state[key];
    control.addEventListener('input', () => {
      const target = isCrop ? state.panels[active] : state;
      target[key] = control.type === 'range' ? Number(control.value) : control.value;
      queuePaint();
    });
  }

  function distribute(images, sample = false) {
    const previous = new Set(state.panels.map(panel => panel.image));
    for (const [index,panel] of state.panels.entries()) {
      Object.assign(panel,neutralCrop(),{ image:images[index%images.length] });
      if (sample && Scenes.crops[index]) {
        [panel.x,panel.y,panel.zoom] = Scenes.crops[index];
      }
    }
    for (const image of previous) if (!images.includes(image)) image?.close?.();
    choosePanel(active);
    repaint();
  }

  async function showSamples() {
    const version = ++request;
    try {
      const images = await Promise.all(JSON.parse(byId('sample-photos').textContent).map(async source => {
        const image = new Image();
        const encoded = source.split('_').join('/').split('-').join('+');
        image.src = 'data:image/webp;base64,' + encoded + '='.repeat((4 - encoded.length % 4) % 4);
        await image.decode();
        return image;
      }));
      if (version !== request) return;
      distribute(images,true);
      status('Drop photos here · Drag a panel to reposition');
    } catch {
      status('Sample photos could not load. You can add your own photos.');
    }
  }

  async function importPhotos(files, destination = null) {
    const inputs = Array.from(files).slice(0,destination === null ? 4 : 1);
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
      const old = panel.image;
      Object.assign(panel,neutralCrop(),{image:images[0]});
      if (!state.panels.some(item => item.image === old)) old?.close?.();
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
    canvas.onlostpointercapture = () => { drag = undefined; };
  }

  byId('export').onclick = () => {
    repaint();
    const name = 'sunset-cover-' + canvas.width + 'x' + canvas.height + '.png';
    canvas.toBlob(blob => {
      if (!blob) {
        status('The PNG could not be saved. Try exporting again.');
        return;
      }
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href),3000);
      status('Downloaded ' + name);
    },'image/png');
  };

  async function start() {
    document.body.classList.toggle('shot-cover',Scenes.coverOnly);
    choosePanel(0);
    await Promise.all([document.fonts.load('32px Display'),document.fonts.load('16px Studio')]);
    repaint();
    await showSamples();
    await Scenes.waitForPaint();
  }
  start();
})();
