const Cover = (() => {
  const formats = { wide: [1920, 1080], tall: [1080, 1350], square: [1080, 1080] };
  const layouts = {
    strip: { name: 'Hero + strip', cells: [[0,0,.64,1],[.64,0,.36,.49],[.64,.49,.36,.51]] },
    three: { name: 'Three panels', cells: [[0,0,1,.54],[0,.54,.5,.46],[.5,.54,.5,.46]] },
    grid: { name: '2 × 2 grid', cells: [[0,0,.5,.5],[.5,0,.5,.5],[0,.5,.5,.5],[.5,.5,.5,.5]] },
    single: { name: 'Single hero', cells: [[0,0,1,1]] }
  };
  const clamp = (value, limit) => Math.max(-limit, Math.min(limit, value));

  function geometry(state) {
    const [width,height] = formats[state.format];
    const unit = Math.min(width,height);
    const lean = unit * .092;
    const inset = unit * .018;
    const gap = unit * .006;
    const slant = (x,y) => x === 0 || x === 1 ? x * width : x * width + lean * (.5 - y);
    return layouts[state.layout].cells.map(([x,y,w,h]) => {
      const t = y*height + (y === 0 ? inset : gap);
      const b = (y+h)*height - (y+h === 1 ? inset : gap);
      const l = x === 0 ? inset : gap;
      const r = x+w === 1 ? inset : gap;
      const points = [[slant(x,y)+l,t],[slant(x+w,y)-r,t],[slant(x+w,y+h)-r,b],[slant(x,y+h)+l,b]];
      const xs = points.map(point => point[0]);
      return { points, left: Math.min(...xs), top:t, width:Math.max(...xs)-Math.min(...xs), height:b-t };
    });
  }

  function trace(ctx, points) {
    ctx.beginPath();
    points.forEach(([x,y], index) => index ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
    ctx.closePath();
  }

  function photo(ctx, box, panel) {
    if (!panel.image) return;
    const {width:w, height:h, left, top} = box;
    const {width:iw,height:ih} = panel.image;
    const a = panel.angle * Math.PI / 180;
    const c = Math.cos(a), s = Math.sin(a);
    const rw = w * Math.abs(c) + h * Math.abs(s);
    const rh = h * Math.abs(c) + w * Math.abs(s);
    const scale = Math.max(rw / iw, rh / ih) * panel.zoom;
    const limitX = Math.max(0,(iw*scale-rw)/2);
    const limitY = Math.max(0,(ih*scale-rh)/2);
    const x = panel.x*w, y = panel.y*h;
    const u = clamp(x*c+y*s, limitX);
    const v = clamp(y*c-x*s, limitY);
    ctx.save();
    ctx.translate(left+w/2+u*c-v*s,top+h/2+u*s+v*c);
    ctx.rotate(a);
    ctx.drawImage(panel.image,-iw*scale/2,-ih*scale/2,iw*scale,ih*scale);
    ctx.restore();
  }

  function paintPanel(ctx, box, panel, state, index) {
    const {left,top,width,height,points} = box;
    ctx.save();
    trace(ctx,points);
    ctx.clip();
    ctx.fillStyle = '#482942';
    ctx.fillRect(left,top,width,height);
    photo(ctx,box,panel);

    const gel = ctx.createLinearGradient(left,top,left+width,top+height);
    const amber = 'rgba(255,137,55,' + state.warm*.006 + ')';
    const pink = 'rgba(241,34,146,' + state.neon*.006 + ')';
    const blue = 'rgba(51,74,149,' + state.neon*.005 + ')';
    gel.addColorStop(0,index%2 ? blue : amber);
    gel.addColorStop(.5,'transparent');
    gel.addColorStop(1,index%2 ? pink : blue);
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = gel;
    ctx.fillRect(left,top,width,height);
    ctx.globalCompositeOperation = 'source-over';
    const flare = ctx.createLinearGradient(left,top,left+width*.65,top+height);
    flare.addColorStop(0,index%2 ? blue : amber);
    flare.addColorStop(.58,'transparent');
    flare.addColorStop(1,index%2 ? pink : blue);
    ctx.fillStyle = flare;
    ctx.fillRect(left,top,width,height);
    ctx.restore();
    trace(ctx,points);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#ffd4c05e';
    ctx.stroke();
  }

  function caption(ctx, width, height, state) {
    const title = state.title.trim().toUpperCase();
    const sub = state.subtitle.trim().toUpperCase();
    if (!title && !sub) return;
    const wide = state.format === 'wide';
    const u = Math.min(width,height);
    const x = u*.057, y = height-u*.132;
    const max = wide ? width * .67 : width-2*x;
    const fade = ctx.createLinearGradient(0,height*.4,0,height);
    fade.addColorStop(0,'#1a102200');
    fade.addColorStop(.58,'#21112833');
    fade.addColorStop(1,'#170d20ed');
    ctx.fillStyle = fade;
    ctx.fillRect(x*.34,height*.4,width-x*.68,height*.6-x*.34);

    const size = u*.175*state.size/100;
    ctx.font = size + 'px Display';
    ctx.lineJoin = 'round';
    if (title) {
      ctx.save();
      ctx.translate(x,y);
      ctx.transform(1,0,-.10,1,0,0);
      ctx.strokeStyle = '#2e1230';
      ctx.lineWidth = u*.012;
      ctx.fillStyle = '#da4d83';
      ctx.strokeText(title,0,u*.013,max);
      ctx.fillText(title,0,u*.013,max);
      const ink = ctx.createLinearGradient(0,-size*.69,0,0);
      ink.addColorStop(0,'#fff0d5');
      ink.addColorStop(.24,state.ink);
      ink.addColorStop(1,state.ink);
      ctx.strokeText(title,0,0,max);
      ctx.fillStyle = ink;
      ctx.fillText(title,0,0,max);
      ctx.restore();
    }
    if (sub) {
      ctx.font = u*.024 + 'px Studio';
      ctx.letterSpacing = u*.004 + 'px';
      ctx.fillStyle = '#fff0db';
      ctx.fillText(sub,x,y+u*.066,max);
      ctx.letterSpacing = '0px';
    }
    const rule = ctx.createLinearGradient(x,0,x+max*.72,0);
    rule.addColorStop(0,state.ink);
    rule.addColorStop(1,'#ff709500');
    ctx.fillStyle = rule;
    ctx.fillRect(x,y+u*(sub ? .082 : .037),max*.72,Math.max(2,u*.002));
  }

  function render(canvas, state) {
    const [width,height] = formats[state.format];
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#170f20';
    ctx.fillRect(0,0,width,height);
    const boxes = geometry(state);
    boxes.forEach((box,index) => paintPanel(ctx,box,state.panels[index],state,index));

    const vignette = ctx.createRadialGradient(width*.50,height*.42,height*.17,width*.50,height*.42,Math.hypot(width,height)*.51);
    vignette.addColorStop(0,'transparent');
    vignette.addColorStop(1,'rgba(23,8,30,' + state.shade*.009 + ')');
    ctx.fillStyle = vignette;
    ctx.fillRect(0,0,width,height);
    caption(ctx,width,height,state);
    const inset = Math.min(width,height)*.0095;
    ctx.strokeStyle = '#e6b4a880';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(inset,inset,width-2*inset,height-2*inset);
    return boxes;
  }

  function hit(canvas, boxes, x, y) {
    const ctx = canvas.getContext('2d');
    return boxes.findIndex(box => {
      trace(ctx,box.points);
      return ctx.isPointInPath(x,y);
    });
  }

  return { render, hit, layouts, formats };
})();
