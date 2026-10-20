'use strict';
/* =========================================================================
   MINIATURAS DE LAS DIAPOSITIVAS
   Dibuja cada diapositiva del .pptx en un canvas pequeño (fondo, imágenes,
   formas y texto) para ver su aspecto sin salir del corrector. Es una vista
   aproximada: no reproduce efectos complejos (sombras, degradados finos,
   gráficos, WordArt…), pero sí la composición y los colores.
   miniaturasPptx(zip, rutasDiapositivas) -> [dataURL jpeg, …]
   ========================================================================= */
(() => {
  const ANCHO = 480;            // píxeles de ancho de cada miniatura
  const EMU_PT = 12700;         // 1 punto = 12700 EMU
  const hijos = (n, nombre) => n ? Array.from(n.children).filter((c) => c.localName === nombre) : [];
  const hijo = (n, nombre) => hijos(n, nombre)[0] || null;
  const todos = (n, nombre) => n ? Array.from(n.getElementsByTagNameNS('*', nombre)) : [];
  const R_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const rid = (n, a) => n.getAttributeNS(R_NS, a) || n.getAttribute('r:' + a);
  const carpeta = (p) => p.replace(/[^/]+$/, '');
  function resolver(base, t) {
    if (t.startsWith('/')) return t.slice(1);
    const partes = (carpeta(base) + t).split('/'), out = [];
    for (const x of partes) { if (x === '..') out.pop(); else if (x !== '.') out.push(x); }
    return out.join('/');
  }

  /* ---------- colores ---------- */
  function hexRgb(h) { h = (h || '000000').replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function rgbHsl([r, g, b]) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2; if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; } return [h, s, l]; }
  function hslRgb([h, s, l]) { if (!s) return [l * 255, l * 255, l * 255]; const f = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; }; const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q; return [f(p, q, h + 1 / 3) * 255, f(p, q, h) * 255, f(p, q, h - 1 / 3) * 255]; }
  // Lee un nodo de color (srgbClr, schemeClr, sysClr, prstClr) con sus modificadores
  function color(nodo, ctx, porDefecto) {
    if (!nodo) return porDefecto || null;
    const c = Array.from(nodo.children).find((x) => /^(srgbClr|schemeClr|sysClr|prstClr|scrgbClr)$/.test(x.localName));
    if (!c) return porDefecto || null;
    let rgb;
    if (c.localName === 'srgbClr') rgb = hexRgb(c.getAttribute('val'));
    else if (c.localName === 'sysClr') rgb = hexRgb(c.getAttribute('lastClr') || (c.getAttribute('val') === 'window' ? 'FFFFFF' : '000000'));
    else if (c.localName === 'prstClr') rgb = hexRgb({ black: '000000', white: 'FFFFFF', red: 'FF0000', green: '00FF00', blue: '0000FF', yellow: 'FFFF00', gray: '808080' }[c.getAttribute('val')] || '000000');
    else if (c.localName === 'scrgbClr') rgb = ['r', 'g', 'b'].map((k) => 255 * (+c.getAttribute(k) || 0) / 100000);
    else {
      let v = c.getAttribute('val');
      if (v === 'phClr') return porDefecto || ctx.phClr || 'rgb(0,0,0)';
      v = { bg1: 'lt1', tx1: 'dk1', bg2: 'lt2', tx2: 'dk2' }[v] || v;
      rgb = hexRgb(ctx.tema[v] || '000000');
    }
    let alfa = 1, hsl = null;
    for (const m of c.children) {
      const val = +m.getAttribute('val') / 100000;
      if (m.localName === 'alpha') alfa = val;
      else if (m.localName === 'lumMod') { hsl = hsl || rgbHsl(rgb); hsl[2] *= val; }
      else if (m.localName === 'lumOff') { hsl = hsl || rgbHsl(rgb); hsl[2] = Math.min(1, hsl[2] + val); }
      else if (m.localName === 'tint') { if (hsl) { rgb = hslRgb(hsl); hsl = null; } rgb = rgb.map((x) => x + (255 - x) * (1 - val)); }
      else if (m.localName === 'shade') { if (hsl) { rgb = hslRgb(hsl); hsl = null; } rgb = rgb.map((x) => x * val); }
    }
    if (hsl) rgb = hslRgb(hsl);
    return `rgba(${rgb.map((x) => Math.round(Math.max(0, Math.min(255, x)))).join(',')},${alfa})`;
  }
  // Relleno de un spPr/bgPr: color, 'imagen' (devuelve el nodo blip) o null (sin relleno)
  function relleno(spPr, ctx) {
    if (!spPr) return undefined;
    if (hijo(spPr, 'noFill')) return null;
    const sf = hijo(spPr, 'solidFill'); if (sf) return color(sf, ctx);
    const gf = hijo(spPr, 'gradFill'); if (gf) { const gs = todos(gf, 'gs'); return gs.length ? color(gs[Math.floor(gs.length / 2)], ctx) : undefined; }
    const bf = hijo(spPr, 'blipFill'); if (bf) return { blip: hijo(bf, 'blip') };
    return undefined;
  }

  /* ---------- contexto por diapositiva (tema, plantilla, patrón) ---------- */
  async function leerTema(zip, xml) {
    const ruta = Object.keys(zip.files).find((p) => /^ppt\/theme\/theme\d+\.xml$/.test(p));
    const tema = {}, fuentes = { mayor: 'Arial', menor: 'Arial' };
    if (!ruta) return { tema, fuentes };
    const d = await xml(ruta);
    const cs = todos(d, 'clrScheme')[0];
    if (cs) for (const c of cs.children) { const x = c.children[0]; if (x) tema[c.localName] = x.getAttribute('val') && x.localName === 'srgbClr' ? x.getAttribute('val') : (x.getAttribute('lastClr') || 'FFFFFF'); }
    const mj = todos(d, 'majorFont')[0], mn = todos(d, 'minorFont')[0];
    if (mj && hijo(mj, 'latin')) fuentes.mayor = hijo(mj, 'latin').getAttribute('typeface');
    if (mn && hijo(mn, 'latin')) fuentes.menor = hijo(mn, 'latin').getAttribute('typeface');
    return { tema, fuentes };
  }
  async function relsDe(zip, ruta, xml) {
    const r = await xml(ruta.replace(/([^/]+)$/, '_rels/$1.rels')), m = {};
    if (r) todos(r, 'Relationship').forEach((x) => { m[x.getAttribute('Id')] = { t: x.getAttribute('Target'), ext: x.getAttribute('TargetMode') === 'External', tipo: x.getAttribute('Type') || '' }; });
    return m;
  }
  const cacheImg = new Map();
  async function imagen(zip, ruta) {
    if (cacheImg.has(ruta)) return cacheImg.get(ruta);
    const p = (async () => {
      const f = zip.file(ruta); if (!f || /\.(emf|wmf|tiff?)$/i.test(ruta)) return null;
      const tipo = /\.svg$/i.test(ruta) ? 'image/svg+xml' : /\.png$/i.test(ruta) ? 'image/png' : /\.gif$/i.test(ruta) ? 'image/gif' : 'image/jpeg';
      const url = URL.createObjectURL(new Blob([await f.async('uint8array')], { type: tipo }));
      return await new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = url; });
    })();
    cacheImg.set(ruta, p);
    return p;
  }

  /* ---------- placeholders heredados ---------- */
  const esTit = (t) => t === 'title' || t === 'ctrTitle';
  function phDe(sp) { const nv = todos(sp, 'nvPr')[0]; const ph = nv && hijo(nv, 'ph'); return ph ? { tipo: ph.getAttribute('type') || 'body', idx: ph.getAttribute('idx') } : null; }
  function buscarPh(doc, ph) {
    if (!doc) return null;
    const sps = todos(doc, 'sp');
    const norm = (t) => (t === 'ctrTitle' ? 'title' : t === 'subTitle' ? 'body' : t);
    return sps.find((s) => { const p = phDe(s); return p && ph.idx != null && p.idx === ph.idx; }) ||
      sps.find((s) => { const p = phDe(s); return p && norm(p.tipo) === norm(ph.tipo); }) || null;
  }
  function xfrmDe(sp, ctx) {
    const pr = hijo(sp, 'spPr') || hijo(sp, 'grpSpPr');
    let x = pr && hijo(pr, 'xfrm');
    if (!x || !hijo(x, 'off')) { const ph = phDe(sp); if (ph) { for (const d of [ctx.plantilla, ctx.patron]) { const s = buscarPh(d, ph); const p2 = s && hijo(s, 'spPr'); const x2 = p2 && hijo(p2, 'xfrm'); if (x2 && hijo(x2, 'off')) { x = x2; break; } } } }
    if (!x || !hijo(x, 'off')) return null;
    const o = hijo(x, 'off'), e = hijo(x, 'ext');
    return { x: +o.getAttribute('x'), y: +o.getAttribute('y'), w: +e.getAttribute('cx'), h: +e.getAttribute('cy'), rot: (+x.getAttribute('rot') || 0) / 60000, flipH: x.getAttribute('flipH') === '1', flipV: x.getAttribute('flipV') === '1', nodo: x };
  }
  // estilo heredado (tamaño, alineación, color) de la plantilla y el patrón para un placeholder
  function estiloHeredado(sp, ctx, nivel) {
    const ph = phDe(sp); const out = { sz: null, algn: null, color: null };
    if (!ph) return out;
    const lv = 'lvl' + (nivel + 1) + 'pPr';
    const mirar = (pPr) => {
      if (!pPr) return;
      if (!out.algn && pPr.getAttribute('algn')) out.algn = pPr.getAttribute('algn');
      const d = hijo(pPr, 'defRPr');
      if (d) { if (!out.sz && d.getAttribute('sz')) out.sz = +d.getAttribute('sz') / 100; if (!out.color && hijo(d, 'solidFill')) out.color = color(hijo(d, 'solidFill'), ctx); }
    };
    for (const d of [ctx.plantilla, ctx.patron]) {
      const s2 = buscarPh(d, ph); if (!s2) continue;
      const tx = hijo(s2, 'txBody'), ls = tx && hijo(tx, 'lstStyle');
      mirar(ls && (hijo(ls, lv) || hijo(ls, 'lvl1pPr')));
      if (tx) for (const p of hijos(tx, 'p')) { mirar(hijo(p, 'pPr')); const r = todos(p, 'rPr').find((x) => x.getAttribute('sz')); if (r && !out.sz) out.sz = +r.getAttribute('sz') / 100; }
    }
    if (ctx.patron) {
      const est = todos(ctx.patron, esTit(ph.tipo) ? 'titleStyle' : 'bodyStyle')[0];
      mirar(est && (todos(est, lv)[0] || todos(est, 'lvl1pPr')[0]));
    }
    if (!out.sz) out.sz = esTit(ph.tipo) ? 40 : 20;
    return out;
  }
  const tamHeredado = (sp, ctx, nivel) => estiloHeredado(sp, ctx, nivel).sz;

  /* ---------- dibujo ---------- */
  function trazado(g, prst, w, h) {
    g.beginPath();
    if (prst === 'ellipse') g.ellipse(w / 2, h / 2, Math.abs(w / 2), Math.abs(h / 2), 0, 0, Math.PI * 2);
    else if (prst === 'roundRect') { const r = Math.min(Math.abs(w), Math.abs(h)) * 0.16; g.roundRect ? g.roundRect(0, 0, w, h, r) : g.rect(0, 0, w, h); }
    else if (prst === 'triangle') { g.moveTo(w / 2, 0); g.lineTo(w, h); g.lineTo(0, h); g.closePath(); }
    else if (prst === 'rtTriangle') { g.moveTo(0, 0); g.lineTo(w, h); g.lineTo(0, h); g.closePath(); }
    else if (prst === 'diamond') { g.moveTo(w / 2, 0); g.lineTo(w, h / 2); g.lineTo(w / 2, h); g.lineTo(0, h / 2); g.closePath(); }
    else if (prst === 'rightArrow') { g.moveTo(0, h * .25); g.lineTo(w * .65, h * .25); g.lineTo(w * .65, 0); g.lineTo(w, h / 2); g.lineTo(w * .65, h); g.lineTo(w * .65, h * .75); g.lineTo(0, h * .75); g.closePath(); }
    else if (prst === 'leftArrow') { g.moveTo(w, h * .25); g.lineTo(w * .35, h * .25); g.lineTo(w * .35, 0); g.lineTo(0, h / 2); g.lineTo(w * .35, h); g.lineTo(w * .35, h * .75); g.lineTo(w, h * .75); g.closePath(); }
    else if (/^star/.test(prst)) { const n = +prst.slice(4) || 5; for (let i = 0; i < n * 2; i++) { const r = i % 2 ? 0.4 : 1, a = Math.PI * i / n - Math.PI / 2; g.lineTo(w / 2 + Math.cos(a) * w / 2 * r, h / 2 + Math.sin(a) * h / 2 * r); } g.closePath(); }
    else if (prst === 'hexagon') { g.moveTo(w * .25, 0); g.lineTo(w * .75, 0); g.lineTo(w, h / 2); g.lineTo(w * .75, h); g.lineTo(w * .25, h); g.lineTo(0, h / 2); g.closePath(); }
    else g.rect(0, 0, w, h);
  }

  function textoDe(g, sp, ctx, w, h, esc) {
    const tx = hijo(sp, 'txBody'); if (!tx) return;
    const bp = hijo(tx, 'bodyPr');
    const ins = (a, d) => (bp && bp.getAttribute(a) != null ? +bp.getAttribute(a) : d) * esc;
    const l = ins('lIns', 91440), r = ins('rIns', 91440), t = ins('tIns', 45720), b = ins('bIns', 45720);
    const af = bp && hijo(bp, 'normAutofit'), escala = af && af.getAttribute('fontScale') ? +af.getAttribute('fontScale') / 100000 : 1;
    const ancla = (bp && bp.getAttribute('anchor')) || (phDe(sp) && esTit(phDe(sp).tipo) ? 'ctr' : 't');
    const ph = phDe(sp), esTitulo = ph && esTit(ph.tipo);
    const anchoUtil = Math.max(4, w - l - r);
    // líneas: [{piezas:[{t, font, color, alto}], alto, algn}]
    const lineas = [];
    for (const p of hijos(tx, 'p')) {
      const pPr = hijo(p, 'pPr'), nivel = pPr ? +pPr.getAttribute('lvl') || 0 : 0;
      const her = estiloHeredado(sp, ctx, nivel);
      const algn = (pPr && pPr.getAttribute('algn')) || her.algn || (esTitulo && ph.tipo === 'ctrTitle' ? 'ctr' : 'l');
      const piezas = [];
      // viñeta en los cuadros de contenido (como en PowerPoint/Google), salvo que se haya quitado
      const conTexto = todos(p, 't').some((x) => x.textContent.trim());
      const vineta = conTexto && ph && (ph.tipo === 'body' || ph.tipo === 'obj') && !(pPr && hijo(pPr, 'buNone')) && !(sp.parentNode && phDe(sp) && phDe(sp).tipo === 'subTitle');
      let vinetaPuesta = !vineta;
      for (const run of Array.from(p.children).filter((c) => c.localName === 'r' || c.localName === 'fld')) {
        const rPr = hijo(run, 'rPr'), texto = (hijo(run, 't') || {}).textContent || '';
        const sz = rPr && rPr.getAttribute('sz') ? +rPr.getAttribute('sz') / 100 : (her.sz || 18);
        const lat = rPr && hijo(rPr, 'latin');
        let fam = lat ? lat.getAttribute('typeface') : (esTitulo ? ctx.fuentes.mayor : ctx.fuentes.menor);
        if (fam === '+mj-lt') fam = ctx.fuentes.mayor; if (fam === '+mn-lt') fam = ctx.fuentes.menor;
        const px = Math.max(1, sz * escala * EMU_PT * esc);
        const font = `${rPr && rPr.getAttribute('i') === '1' ? 'italic ' : ''}${rPr && rPr.getAttribute('b') === '1' ? 'bold ' : ''}${px}px "${fam}", Arial, sans-serif`;
        const col = color(rPr && hijo(rPr, 'solidFill'), ctx, her.color || ctx.colorTexto(sp));
        if (!vinetaPuesta) { piezas.push({ t: '•  ', font, color: col, alto: px }); vinetaPuesta = true; }
        texto.split(/(\s+)/).forEach((pal) => { if (pal) piezas.push({ t: pal, font, color: col, alto: px }); });
      }
      const altoVacio = (her.sz || 18) * escala * EMU_PT * esc;
      // reparto en líneas
      let linea = { piezas: [], ancho: 0, alto: 0, algn };
      const cerrar = () => { if (!linea.alto) linea.alto = altoVacio; lineas.push(linea); linea = { piezas: [], ancho: 0, alto: 0, algn }; };
      for (const pz of piezas) {
        g.font = pz.font; const a = g.measureText(pz.t).width;
        if (linea.ancho + a > anchoUtil && linea.piezas.length && pz.t.trim()) cerrar();
        if (!linea.piezas.length && !pz.t.trim() && pz.t !== '•  ') continue;
        linea.piezas.push({ ...pz, a }); linea.ancho += a; linea.alto = Math.max(linea.alto, pz.alto);
      }
      cerrar();
    }
    const total = lineas.reduce((s, x) => s + x.alto * 1.2, 0);
    let y = ancla === 'ctr' ? (h - total) / 2 : ancla === 'b' ? h - b - total : t;
    if (ancla === 'ctr') y = Math.max(t, y);
    g.textBaseline = 'alphabetic';
    for (const ln of lineas) {
      let x = ln.algn === 'ctr' ? l + (anchoUtil - ln.ancho) / 2 : ln.algn === 'r' ? w - r - ln.ancho : l;
      const base = y + ln.alto;
      for (const pz of ln.piezas) { g.font = pz.font; g.fillStyle = pz.color; g.fillText(pz.t, x, base); x += pz.a; }
      y += ln.alto * 1.2;
      if (y > h + 4) break;
    }
  }

  async function dibujarArbol(g, arbol, ctx, tr) {
    for (const n of arbol.children) {
      const tipo = n.localName;
      if (!/^(sp|pic|grpSp|cxnSp|graphicFrame)$/.test(tipo)) continue;
      const xf = xfrmDe(n, ctx); if (!xf) continue;
      if (tipo === 'grpSp') {
        const ch = hijo(xf.nodo, 'chOff'), ce = hijo(xf.nodo, 'chExt');
        const cx = ch ? +ch.getAttribute('x') : xf.x, cy = ch ? +ch.getAttribute('y') : xf.y, cw = ce ? +ce.getAttribute('cx') || xf.w : xf.w, chh = ce ? +ce.getAttribute('cy') || xf.h : xf.h;
        const sx = xf.w / (cw || 1), sy = xf.h / (chh || 1);
        await dibujarArbol(g, n, ctx, (x, y, w, h) => tr(xf.x + (x - cx) * sx, xf.y + (y - cy) * sy, w * sx, h * sy));
        continue;
      }
      const [X, Y, Wd, Ht] = tr(xf.x, xf.y, xf.w, xf.h);
      const x = X * ctx.esc, y = Y * ctx.esc, w = Wd * ctx.esc, h = Ht * ctx.esc;
      g.save();
      g.translate(x + w / 2, y + h / 2);
      if (xf.rot) g.rotate(xf.rot * Math.PI / 180);
      g.scale(xf.flipH ? -1 : 1, xf.flipV ? -1 : 1);
      g.translate(-w / 2, -h / 2);
      try {
        if (tipo === 'pic') {
          const bf = hijo(n, 'blipFill'), bl = bf && hijo(bf, 'blip'), id = bl && rid(bl, 'embed');
          const im = id && ctx.rels[id] && await imagen(ctx.zip, resolver(ctx.ruta, ctx.rels[id].t));
          if (im) {
            const sr = bf && hijo(bf, 'srcRect'), f = (a) => (sr && sr.getAttribute(a) ? +sr.getAttribute(a) / 100000 : 0);
            const sx = im.naturalWidth * f('l'), sy = im.naturalHeight * f('t'), sw = im.naturalWidth * (1 - f('l') - f('r')), sh = im.naturalHeight * (1 - f('t') - f('b'));
            g.drawImage(im, sx, sy, Math.max(1, sw), Math.max(1, sh), 0, 0, w, h);
          } else { g.fillStyle = '#dfe6ea'; g.fillRect(0, 0, w, h); }
        } else if (tipo === 'graphicFrame') {
          g.fillStyle = 'rgba(11,79,108,.08)'; g.strokeStyle = 'rgba(11,79,108,.35)'; g.lineWidth = 1; g.fillRect(0, 0, w, h); g.strokeRect(0, 0, w, h);
        } else {
          const spPr = hijo(n, 'spPr'), est = hijo(n, 'style');
          const pg = spPr && hijo(spPr, 'prstGeom'), prst = pg ? pg.getAttribute('prst') : (tipo === 'cxnSp' ? 'line' : 'rect');
          let fill = relleno(spPr, ctx);
          if (fill === undefined && est) { const fr = hijo(est, 'fillRef'); if (fr && +fr.getAttribute('idx') > 0) fill = color(fr, ctx); }
          if (fill === undefined && phDe(n)) fill = null;
          const ln = spPr && hijo(spPr, 'ln');
          let linea = null, grosor = 1;
          if (ln && !hijo(ln, 'noFill')) { linea = color(hijo(ln, 'solidFill'), ctx); grosor = Math.max(0.6, (+ln.getAttribute('w') || 12700) * ctx.esc); }
          if (!linea && !(ln && hijo(ln, 'noFill')) && est) { const lr = hijo(est, 'lnRef'); if (lr && +lr.getAttribute('idx') > 0) linea = color(lr, ctx); }
          if (prst === 'line' || /Connector/.test(prst) || tipo === 'cxnSp') {
            g.strokeStyle = linea || 'rgba(0,0,0,.8)'; g.lineWidth = grosor; g.beginPath(); g.moveTo(0, 0); g.lineTo(w, h); g.stroke();
          } else {
            if (fill && fill.blip) {
              const id = rid(fill.blip, 'embed'), im = id && ctx.rels[id] && await imagen(ctx.zip, resolver(ctx.ruta, ctx.rels[id].t));
              if (im) { trazado(g, prst, w, h); g.save(); g.clip(); g.drawImage(im, 0, 0, w, h); g.restore(); }
            } else if (fill) { trazado(g, prst, w, h); g.fillStyle = fill; g.fill(); }
            if (linea) { trazado(g, prst, w, h); g.strokeStyle = linea; g.lineWidth = grosor; g.stroke(); }
          }
          if (xf.flipH || xf.flipV) g.setTransform(g.getTransform().multiply(new DOMMatrix([xf.flipH ? -1 : 1, 0, 0, xf.flipV ? -1 : 1, xf.flipH ? w : 0, xf.flipV ? h : 0])));
          textoDe(g, n, ctx, w, h, ctx.esc);
        }
      } catch (e) { /* una forma rara no impide dibujar el resto */ }
      g.restore();
    }
  }

  async function fondo(g, ctx, W, H) {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H);
    for (const d of [ctx.diapo, ctx.plantilla, ctx.patron]) {
      const bg = d && todos(d, 'bg')[0]; if (!bg) continue;
      const bgPr = hijo(bg, 'bgPr'), bgRef = hijo(bg, 'bgRef');
      if (bgPr) {
        const f = relleno(bgPr, ctx);
        if (f && f.blip) { const id = rid(f.blip, 'embed'); const rels = d === ctx.diapo ? ctx.rels : d === ctx.plantilla ? ctx.relsPlantilla : ctx.relsPatron; const base = d === ctx.diapo ? ctx.ruta : d === ctx.plantilla ? ctx.rutaPlantilla : ctx.rutaPatron; const im = id && rels[id] && await imagen(ctx.zip, resolver(base, rels[id].t)); if (im) { g.drawImage(im, 0, 0, W, H); return; } }
        else if (f) { g.fillStyle = f; g.fillRect(0, 0, W, H); return; }
      } else if (bgRef) { const c = color(bgRef, ctx); if (c) { g.fillStyle = c; g.fillRect(0, 0, W, H); return; } }
    }
  }

  window.miniaturasPptx = async function (zip, rutas) {
    const parser = new DOMParser();
    const cacheXml = new Map();
    const xml = async (p) => { if (!p) return null; if (cacheXml.has(p)) return cacheXml.get(p); const f = zip.file(p); const d = f ? parser.parseFromString(await f.async('string'), 'application/xml') : null; cacheXml.set(p, d); return d; };
    const pres = await xml('ppt/presentation.xml');
    const sz = pres && todos(pres, 'sldSz')[0];
    const cxS = sz ? +sz.getAttribute('cx') : 9144000, cyS = sz ? +sz.getAttribute('cy') : 6858000;
    const W = ANCHO, H = Math.round(ANCHO * cyS / cxS), esc = W / cxS;
    const { tema, fuentes } = await leerTema(zip, xml);
    const out = [];
    for (const ruta of rutas) {
      try {
        const diapo = await xml(ruta), rels = await relsDe(zip, ruta, xml);
        const rl = Object.values(rels).find((r) => /slideLayout/.test(r.tipo) || /slideLayout/.test(r.t));
        const rutaPlantilla = rl ? resolver(ruta, rl.t) : null, plantilla = await xml(rutaPlantilla);
        const relsPlantilla = rutaPlantilla ? await relsDe(zip, rutaPlantilla, xml) : {};
        const rm = Object.values(relsPlantilla).find((r) => /slideMaster/.test(r.tipo) || /slideMaster/.test(r.t));
        const rutaPatron = rm ? resolver(rutaPlantilla, rm.t) : null, patron = await xml(rutaPatron);
        const relsPatron = rutaPatron ? await relsDe(zip, rutaPatron, xml) : {};
        const ctx = { zip, tema, fuentes, esc, diapo, plantilla, patron, rels, ruta, rutaPlantilla, relsPlantilla, rutaPatron, relsPatron,
          colorTexto: (sp) => { const st = hijo(sp, 'style'), fr = st && hijo(st, 'fontRef'); return (fr && color(fr, ctx)) || `#${tema.dk1 || '000000'}`; } };
        const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
        const g = cv.getContext('2d');
        await fondo(g, ctx, W, H);
        // lo que no es placeholder en la plantilla y en el patrón (logos, franjas…) va debajo
        for (const d of [patron, plantilla]) {
          if (!d || (d === patron && plantilla && todos(plantilla, 'cSld')[0] && todos(plantilla, 'cSld')[0].parentNode.getAttribute('showMasterSp') === '0')) continue;
          const arbol = todos(d, 'spTree')[0]; if (!arbol) continue;
          const copia = arbol.cloneNode(true); Array.from(copia.children).forEach((c) => { if (phDe(c)) c.remove(); });
          const relsD = d === patron ? relsPatron : relsPlantilla, rutaD = d === patron ? rutaPatron : rutaPlantilla;
          await dibujarArbol(g, copia, { ...ctx, rels: relsD, ruta: rutaD }, (x, y, w, h) => [x, y, w, h]);
        }
        const arbol = todos(diapo, 'spTree')[0];
        if (arbol) await dibujarArbol(g, arbol, ctx, (x, y, w, h) => [x, y, w, h]);
        out.push(cv.toDataURL('image/jpeg', 0.72));
      } catch (e) { console.warn('miniatura', ruta, e); out.push(null); }
    }
    return out;
  };
})();
