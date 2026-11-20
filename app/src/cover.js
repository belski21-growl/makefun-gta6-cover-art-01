const Cover = (() => {
  const formats = { wide: [1920, 1080], tall: [1024, 1280], square: [1024, 1024] };
  const layouts = {
    mosaic: { name: 'Mosaic · 6 panels', cells: [[0,0,.4,1],[.4,0,.3,.5],[.7,0,.3,.5],[.4,.5,.2,.5],[.6,.5,.2,.5],[.8,.5,.2,.5]] },
    strip: { name: 'Hero + strip', cells: [[0,0,.64,1],[.64,0,.36,.49],[.64,.49,.36,.51]] },
    three: { name: 'Three panels', cells: [[0,0,1,.54],[0,.54,.5,.46],[.5,.54,.5,.46]] },
    grid: { name: '2 × 2 grid', cells: [[0,0,.5,.5],[.5,0,.5,.5],[0,.5,.5,.5],[.5,.5,.5,.5]] },
    'hero-right': { name: 'Hero right', cells: [[0,0,.36,.5],[0,.5,.36,.5],[.36,0,.64,1]] },
    'centre-title': { name: 'Centre title', cells: [[0,0,.5,.3],[.5,0,.5,.3],[0,.3,.25,.4],[.25,.3,.5,.4],[.75,.3,.25,.4],[0,.7,1,.3]] },
    comic: { name: 'Comic · 6 panels', cells: [[0,0,.55,.5],[.55,0,.45,.3],[.55,.3,.45,.2],[0,.5,.3,.5],[.3,.5,.35,.5],[.65,.5,.35,.5]] },
    single: { name: 'Single hero', cells: [[0,0,1,1]] }
  };
  const clamp = (value, limit) => Math.max(-limit, Math.min(limit, value));
  const presets = {
    'Vice Sunset': { warm: .23, pink: .20, blue: .10, contrast: 1.20, saturate: 1.38, hue: -8 },
    'Neon Night': { warm: .08, pink: .28, blue: .24, contrast: 1.32, saturate: 1.48, hue: 16 },
    'Golden Hour': { warm: .30, pink: .08, blue: .04, contrast: 1.16, saturate: 1.28, hue: -12 },
    'Comic Ink': { warm: .10, pink: .13, blue: .08, contrast: 1.50, saturate: 1.12, hue: 0 },
    'Noir Heat': { warm: .14, pink: .10, blue: .14, contrast: 1.46, saturate: .82, hue: -4 }
  };

  function geometry(state) {
    const [width,height] = formats[state.format];
    const unit = Math.min(width,height);
    // Dedicated press header and bottom title band keep type clear of faces.
    const panelTop = unit * .082;
    const panelHeight = height - panelTop - unit * (state.layout === 'centre-title' ? .07 : state.format === 'wide' ? .49 : .43);
    const lean = unit * (state.layout === 'comic' ? .09 : .045);
    const inset = unit * .018;
    const gap = unit * .006;
    const slant = (x,y) => x === 0 || x === 1 ? x * width : x * width + lean * (.5 - y);
    return layouts[state.layout].cells.map(([x,y,w,h]) => {
      const t = panelTop + y*panelHeight + (y === 0 ? 0 : gap);
      const b = panelTop + (y+h)*panelHeight - (y+h === 1 ? 0 : gap);
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

  function photo(ctx, box, panel, state) {
    if (!panel?.image) return;
    const {width:w, height:h, left, top} = box;
    const {width:iw,height:ih} = panel.image;
    const a = panel.angle * Math.PI / 180;
    const c = Math.cos(a), s = Math.sin(a);
    const rw = w * Math.abs(c) + h * Math.abs(s);
    const rh = h * Math.abs(c) + w * Math.abs(s);
    let scale = Math.max(rw / iw, rh / ih) * panel.zoom;
    // Sample fit follows the output format, including Export all without reloading photos.
    const fillMosaic = state.format !== 'wide' && state.layout === 'mosaic';
    if (panel.fit === 'contain' && panel.angle === 0 && !fillMosaic) {
      // Use the narrowest part of the slanted frame, not its bounding box.
      const innerWidth = Math.min(box.points[1][0],box.points[2][0]) - Math.max(box.points[0][0],box.points[3][0]);
      scale = Math.min(innerWidth / iw, h / ih) * .96;
    } else if (panel.faceSafe && panel.angle === 0 && !fillMosaic) {
      // Preserve the source's upper 40%, with headroom and horizontal safety.
      scale = Math.min(scale, h * .94 / (ih * .4), w * .90 / iw);
    }
    const limitX = Math.max(0,(iw*scale-rw)/2);
    const limitY = Math.max(0,(ih*scale-rh)/2);
    const x = panel.x*w, y = panel.y*h;
    const u = clamp(x*c+y*s, limitX);
    let v = clamp(y*c-x*s, limitY);
    if (panel.faceSafe && panel.angle === 0 && ih*scale > h) {
      v = (ih*scale-h)/2 + h*.025;
    }
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
    const grade = presets[state.preset] || presets['Vice Sunset'];
    const strength = (state.gradeStrength ?? 88) / 100;
    ctx.filter = 'saturate(' + (1 + (grade.saturate - 1) * strength) + ') contrast(' + (1 + (grade.contrast - 1) * strength) + ') hue-rotate(' + grade.hue * strength + 'deg)';
    photo(ctx,box,panel,state);
    ctx.filter = 'none';

    const gel = ctx.createLinearGradient(left,top,left+width,top+height);
    const amber = 'rgba(255,137,55,' + Math.min(.65,grade.warm*strength + state.warm*.0015) + ')';
    const pink = 'rgba(241,34,146,' + Math.min(.62,grade.pink*strength + state.neon*.0015) + ')';
    const blue = 'rgba(51,74,149,' + Math.min(.5,grade.blue*strength + state.neon*.001) + ')';
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
    ctx.lineWidth = state.layout === 'comic' ? Math.min(...formats[state.format])*.009 : 1.5;
    ctx.strokeStyle = state.layout === 'comic' ? '#100b19' : '#ffd4c05e';
    ctx.stroke();
    const label = [panel.role, panel.place && panel.time ? panel.place + ' • ' + panel.time : panel.place || panel.time].filter(Boolean);
    if (state.locationTags !== false && label.length) {
      const pad = Math.min(width,height)*.012;
      const y = top + Math.min(height*.11,Math.min(width,height)*.052);
      const font = Math.max(11,Math.min(width,height)*.022);
      ctx.font = 'bold ' + font + 'px Studio';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#111019dd';
      const text = label.join('  •  ').toUpperCase();
      const tw = Math.min(width*.76,ctx.measureText(text).width+pad*2);
      ctx.fillRect(left+pad,y-font*.68,tw,font*1.38);
      ctx.fillStyle = '#fff3df';
      ctx.fillText(text,left+pad*1.7,y,tw-pad*2);
    }
  }

  function caption(ctx, width, height, state) {
    ctx.save();
    ctx.textBaseline = 'alphabetic';
    const title = state.title.trim().toUpperCase();
    const sub = state.subtitle.trim().toUpperCase();
    if (!title && !sub && !state.script && !state.tagline) { ctx.restore(); return; }
    const wide = state.format === 'wide';
    const u = Math.min(width,height);
    const centred = state.layout === 'centre-title' && state.titlePos === 'centre';
    const x = centred ? width*.265 : u*.057;
    const titleY = centred ? u*.082+(height-u*.152)*.46 : state.titlePos === 'centre' ? height*.57 : state.titlePos === 'over' ? height*.70 : height-u*.275;
    const y = titleY;
    const max = centred ? width*.47 : wide ? width * .67 : width-2*x;
    if ((state.titlePos || 'bottom') === 'bottom') {
      const fade = ctx.createLinearGradient(0,height*.48,0,height);
      fade.addColorStop(0,'#1a102200'); fade.addColorStop(.58,'#21112877'); fade.addColorStop(1,'#170d20f2');
      ctx.fillStyle = fade; ctx.fillRect(0,height*.48,width,height*.52);
    }

    const size = u * (centred ? .09 : wide ? .175 : .115) * Math.min(state.size,wide ? 140 : 130)/100;
    ctx.font = size + 'px Display';
    ctx.lineJoin = 'round';
    if (title) {
      ctx.save();
      ctx.translate(x,y);
      ctx.transform(1,0,-.10,1,0,0);
      ctx.strokeStyle = '#2e1230';
      ctx.lineWidth = u*.012;
      ctx.fillStyle = '#ffb85e';
      ctx.strokeText(title,0,u*.013,max);
      ctx.fillText(title,0,u*.013,max);
      const ink = ctx.createLinearGradient(0,-size*.69,0,0);
      ink.addColorStop(0,'#fff4d5'); ink.addColorStop(.38,'#ff9a47'); ink.addColorStop(1,'#f044a1');
      ctx.strokeText(title,0,0,max);
      ctx.fillStyle = ink;
      ctx.fillText(title,0,0,max);
      ctx.restore();
    }
    if (state.script) {
      ctx.save(); ctx.font = 'italic bold ' + u*.058 + 'px Georgia, serif';
      ctx.shadowColor = '#ff28b7'; ctx.shadowBlur = u*.018; ctx.fillStyle = '#fff0fa';
      ctx.fillText(state.script,x+u*.018,y+u*.078,max); ctx.restore();
    }
    if (sub) {
      ctx.font = u*.024 + 'px Studio';
      ctx.letterSpacing = u*.004 + 'px';
      ctx.fillStyle = '#fff0db';
      ctx.fillText(sub,x,y+u*.128,max);
      ctx.letterSpacing = '0px';
    }
    const rule = ctx.createLinearGradient(x,0,x+max*.72,0);
    rule.addColorStop(0,state.ink);
    rule.addColorStop(1,'#ff709500');
    ctx.fillStyle = rule;
    ctx.fillRect(x,y+u*(sub ? .142 : .105),max*.72,Math.max(2,u*.002));
    if (state.ribbon !== false && state.tagline) {
      const ribbonWidth = Math.min(max,width-u*.4);
      const ribbonY = y+u*.165;
      ctx.fillStyle = '#120b1eee';
      ctx.fillRect(x,ribbonY,ribbonWidth,u*.034);
      ctx.strokeStyle = state.ink; ctx.lineWidth = u*.0015;
      ctx.strokeRect(x,ribbonY,ribbonWidth,u*.034);
      ctx.font = 'bold '+u*.016+'px Studio'; ctx.fillStyle = '#fff0db';
      ctx.fillText(state.tagline,x+u*.012,ribbonY+u*.023,ribbonWidth-u*.024);
    }
    ctx.restore();
  }

  function dressing(ctx,w,h,state) {
    const u=Math.min(w,h), pad=u*.025;
    ctx.save(); ctx.textBaseline='middle';
    if (state.quoteStrip !== false) {
    ctx.font='bold '+u*.019+'px Studio'; ctx.fillStyle='#ffd65a';
    ctx.fillText('★★★★★',pad,pad+u*.015);
    ctx.font='bold '+u*.018+'px Studio'; ctx.fillStyle='#fff4e3';
    ctx.fillText('“'+(state.quote||'')+'”',pad+u*.12,pad+u*.015,w*.57);
    ctx.font='bold '+u*.011+'px Studio'; ctx.fillStyle='#ffc65a';
    ctx.fillText('— '+(state.quoteSource||''),pad+u*.12,pad+u*.037,w*.57);
    }
    if (state.volumeChip !== false) {
    ctx.fillStyle='#ffe36a'; ctx.fillRect(w-u*.15,pad,u*.125,u*.045);
    ctx.fillStyle='#26152a'; ctx.font='bold '+u*.018+'px Studio'; ctx.textAlign='center'; ctx.fillText(state.volume||'',w-u*.0875,pad+u*.023);
    }
    const footerY=h-u*.07;
    ctx.fillStyle='#180e20ed'; ctx.fillRect(0,footerY,w,u*.07);
    ctx.textAlign='left'; ctx.font='bold '+u*.0105+'px Studio'; ctx.fillStyle='#fff0df';
    ctx.fillText(state.credits||'',pad,footerY+u*.024,w-u*.32);
    ctx.font='bold '+u*.018+'px Studio'; ctx.fillStyle='#ff8acb'; ctx.fillText('COMING SOON',pad,footerY+u*.052,w*.22);
    const bx=w-u*.19, by=footerY+u*.012, bh=u*.045;
    ctx.fillStyle='#fff'; ctx.fillRect(bx,by,u*.17,bh);
    for(let i=0;i<32;i++){const xx=bx+u*.006+i*u*.0048;ctx.fillStyle=i%3?'#16121a':'#555';ctx.fillRect(xx,by+u*.003,u*(i%5===0?.0022:.0011),bh-u*.013);}
    ctx.fillStyle='#201527'; ctx.font='bold '+u*.007+'px Studio'; ctx.fillText('0 2113 122920',bx+u*.018,by+bh-u*.006);
    if (state.badgeSeal !== false) {
    const cx=w-u*.27,cy=h-u*.115,r=u*.047;
    ctx.beginPath(); for(let i=0;i<40;i++){const a=i*Math.PI/20,rr=i%2?r*.82:r;const xx=cx+Math.cos(a)*rr, yy=cy+Math.sin(a)*rr;i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);}ctx.closePath();ctx.fillStyle='#ffd83f';ctx.fill();ctx.strokeStyle='#fff1a8';ctx.lineWidth=u*.003;ctx.stroke();
    ctx.fillStyle='#29102b';ctx.textAlign='center';ctx.font='bold '+u*.009+'px Studio';ctx.fillText(state.badge||'',cx,cy,u*.075);
    }
    ctx.restore();
  }

  function texture(ctx,w,h,state) {
    if(state.halftone){const tile=document.createElement('canvas');tile.width=12;tile.height=12;const p=tile.getContext('2d');p.fillStyle='rgba(18,8,25,.16)';p.beginPath();p.arc(2,2,1.2,0,Math.PI*2);p.fill();ctx.save();ctx.globalCompositeOperation='multiply';ctx.fillStyle=ctx.createPattern(tile,'repeat');ctx.fillRect(0,0,w,h);ctx.restore();}
    if(state.grain){const c=document.createElement('canvas');c.width=128;c.height=128;const p=c.getContext('2d');const im=p.createImageData(128,128);for(let i=0;i<im.data.length;i+=4){const n=Math.random()*255;im.data[i]=im.data[i+1]=im.data[i+2]=n;im.data[i+3]=state.grainStrength||14;}p.putImageData(im,0,0);ctx.save();ctx.globalAlpha=.18;ctx.globalCompositeOperation='soft-light';ctx.fillStyle=ctx.createPattern(c,'repeat');ctx.fillRect(0,0,w,h);ctx.restore();}
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
    if (state.speedLines) {
      ctx.save(); ctx.strokeStyle='#fff0cf66'; ctx.lineWidth=Math.min(width,height)*.002;
      for(let i=0;i<24;i++){const a=i*Math.PI/12;ctx.beginPath();ctx.moveTo(width/2+Math.cos(a)*width*.38,height/2+Math.sin(a)*height*.38);ctx.lineTo(width/2+Math.cos(a)*width,height/2+Math.sin(a)*height);ctx.stroke();}ctx.restore();
    }
    if (state.layout === 'centre-title' && state.titlePos === 'centre') {trace(ctx,boxes[3].points);ctx.fillStyle='#211128';ctx.fill();}
    caption(ctx,width,height,state);
    texture(ctx,width,height,state);
    dressing(ctx,width,height,state);
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
