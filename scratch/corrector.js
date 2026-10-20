'use strict';
/* =========================================================================
   CORRECTOR DE JUEGOS DE SCRATCH
   1. MOTOR: ejecuta un .sb3 fotograma a fotograma, con tiempo virtual y azar
      fijo (la misma entrada da siempre el mismo resultado) y anota todo lo que
      pasa: variables, choques, clones, fondos, preguntas, clics, arrastres…
   2. CATÁLOGO: familias de comprobaciones. Al analizar la partida del profesor
      solo se proponen las que aparecen en su juego.
   3. CORRECCIÓN: cada comprobación se ejecuta igual en el modelo y en el juego
      del alumno y se comparan los efectos, no los bloques.
   ========================================================================= */
const FPS = 30, DT = 1000 / FPS;
const INICIO = 15;                 // fotogramas tras la bandera antes de probar nada
const $ = s => document.querySelector(s);
const esperar = () => new Promise(r => setTimeout(r, 0));

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const rgbHex = c => Array.isArray(c) ? '#' + c.slice(0,3).map(v => Math.round(v).toString(16).padStart(2,'0')).join('') : String(c);
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ+\-*/=<>]/g, '');
const normNombre = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
const baseNombre = s => normNombre(s).replace(/\d+$/, '');
const plantilla = q => norm(q).replace(/\d+([.,]\d+)?/g, '#');
const esNum = v => v !== '' && v !== null && v !== undefined && !isNaN(Number(v)) && String(v).trim() !== '';
const nombreVar = k => k.includes(': ') ? k.split(': ').slice(1).join(': ') : k;
const fmtDelta = d => (d > 0 ? '+' : '−') + Math.abs(+d.toFixed(3));
const fmtSeg = f => (f / FPS).toFixed(1).replace('.', ',') + ' s';
const fmtN = n => (Math.round(n * 10) / 10).toString().replace('.', ',');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
const sinHtml = s => String(s).replace(/<[^>]+>/g, '');
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const TECLAS = { ArrowLeft:'←', ArrowRight:'→', ArrowUp:'↑', ArrowDown:'↓', ' ':'Espacio', Enter:'Intro' };
const nomTecla = k => TECLAS[k] || (k.length === 1 ? k.toUpperCase() : k);
const MODIF = ['Shift','Control','Alt','Meta','Tab','CapsLock','Escape','AltGraph','ContextMenu'];
function valorIgual(a, b){ if (esNum(a) && esNum(b)) return Math.abs(Number(a) - Number(b)) < 1e-6; return norm(a) === norm(b); }
function parecido(a, b){
  a = norm(a); b = norm(b); if (a === b) return 1; if (!a || !b) return 0;
  if ((a.includes(b) || b.includes(a)) && Math.min(a.length, b.length) / Math.max(a.length, b.length) >= 0.9) return 0.95;
  if (/^(in|no|des)/.test(a) !== /^(in|no|des)/.test(b) && (a.replace(/^(in|no|des)/, '') === b || b.replace(/^(in|no|des)/, '') === a)) return 0;
  const m = a.length, n = b.length, d = Array.from({ length: m + 1 }, (_, i) => [i]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i-1][j] + 1, d[i][j-1] + 1, d[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1));
  return 1 - d[m][n] / Math.max(m, n);
}
// Lo que dice un personaje: si lleva números, tienen que coincidir; las palabras pueden variar un poco
function parecidoDice(a, b){
  const na = (String(a).match(/-?\d+(?:[.,]\d+)?/g) || []).map(x => x.replace(',', '.')).sort().join(' ');
  const nb = (String(b).match(/-?\d+(?:[.,]\d+)?/g) || []).map(x => x.replace(',', '.')).sort().join(' ');
  if (na || nb){ if (na !== nb) return 0; const p = parecido(String(a).replace(/\d+/g, ''), String(b).replace(/\d+/g, '')); return p >= 0.4 ? Math.max(0.7, p) : p; }
  const p = parecido(a, b); return p >= 0.85 ? p : p * 0.8;
}
function ab2b64(buf){ const u = new Uint8Array(buf); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); }
function b642ab(b){ const s = atob(b); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u.buffer; }
const deltaDe = e => esNum(e.antes) && esNum(e.despues) ? Number(e.despues) - Number(e.antes) : null;

/* -------------------------------------------------------------------------
   1. MOTOR
   ------------------------------------------------------------------------- */
function parchearTarget(rt){
  const proto = Object.getPrototypeOf(rt.getTargetForStage());
  if (proto.__parcheado) return;
  proto.__parcheado = true;
  const oObj = proto.isTouchingObject, oCol = proto.isTouchingColor;
  proto.isTouchingObject = function(req){
    const r = oObj.call(this, req);
    if (r && this.runtime && this.runtime.__motor) this.runtime.__motor._toque(this, req === '_edge_' ? 'borde' : req === '_mouse_' ? 'raton' : 'objeto', req);
    return r;
  };
  proto.isTouchingColor = function(...a){
    const r = oCol.apply(this, a);
    if (r && this.runtime && this.runtime.__motor) this.runtime.__motor._toque(this, 'color', rgbHex(a[0]));
    return r;
  };
}

class Motor {
  constructor(canvas){
    const Almacen = (window.ScratchStorage && window.ScratchStorage.ScratchStorage) || window.ScratchStorage;
    const Render = (window.ScratchRender && window.ScratchRender.default) || window.ScratchRender;
    // El ratón y los clics se calculan siempre sobre un escenario de 480 × 360,
    // se vea el lienzo grande, pequeño o escondido.
    Object.defineProperty(canvas, 'clientWidth', { get: () => 480 });
    Object.defineProperty(canvas, 'clientHeight', { get: () => 360 });
    this.vm = new VirtualMachine();
    this.vm.attachStorage(new Almacen());
    this.renderer = new Render(canvas);
    this.renderer.resize(480, 360);
    this.vm.attachRenderer(this.renderer);
    const SVGR = window.ScratchSVGRenderer && (window.ScratchSVGRenderer.BitmapAdapter ? window.ScratchSVGRenderer : window.ScratchSVGRenderer.default);
    if (SVGR && SVGR.BitmapAdapter) this.vm.attachV2BitmapAdapter(new SVGR.BitmapAdapter());
    this.vm.setCompatibilityMode(true);
    const rt = this.rt = this.vm.runtime;
    rt.__motor = this;
    rt.currentStepTime = DT;
    rt.sequencer.timer = { k: 0, start(){ this.k = 0; }, timeElapsed(){ return this.k++ < 40 ? 0 : 1e9; } };
    rt.on('SAY', (t, tipo, texto) => {
      if (!t || !t.sprite) return;
      if (texto !== '' && texto !== null && texto !== undefined){ this._ultimoDice = { obj: t.sprite.name, texto: String(texto), f: this.frame }; this._ev({ tipo: 'dice', obj: t.sprite.name, texto: String(texto) }); }
    });
    rt.on('QUESTION', q => {
      if (q === null){ this.pregunta = null; return; }
      let texto = q;
      if (q === '' && this._ultimoDice && this._ultimoDice.f >= this.frame - 1){
        texto = this._ultimoDice.texto;
        for (let i = this.eventos.length - 1; i >= 0 && this.eventos[i].f >= this.frame - 1; i--) if (this.eventos[i].tipo === 'dice' && this.eventos[i].texto === texto){ this.eventos[i].preg = true; break; }
      }
      this.pregunta = { texto: String(texto), f: this.frame };
      this._ev({ tipo: 'pregunta', texto: String(texto) });
    });
    rt.on('PROJECT_STOP_ALL', () => { this.pregunta = null; if (!this._propio) this._ev({ tipo: 'stop' }); });
    rt.on('targetWasCreated', (nuevo, orig) => { if (orig && nuevo && !nuevo.isOriginal && nuevo.sprite) this._ev({ tipo: 'clon', obj: nuevo.sprite.name, menor: true }); });
    const sh = rt.startHats.bind(rt);
    rt.startHats = (op, campos, target) => {
      if (op === 'event_whenbroadcastreceived' && campos && campos.BROADCAST_OPTION) this._ev({ tipo: 'mensaje', nombre: campos.BROADCAST_OPTION });
      if (op === 'event_whenthisspriteclicked' && target && !target.isStage && target.sprite) this._ev({ tipo: 'clic', obj: target.sprite.name, clon: !target.isOriginal, x: target.x, y: target.y, disfraz: this._disfraz(target) });
      return sh(op, campos, target);
    };
    const P = rt._primitives;
    for (const op of ['sound_play', 'sound_playuntildone']){
      const f = P[op]; if (!f) continue;
      P[op] = (args, util) => { this._ev({ tipo: 'sonido', obj: util.target.sprite ? util.target.sprite.name : '(escenario)', nombre: String(args.SOUND_MENU) }); return f(args, util); };
    }
    const borra = P.control_delete_this_clone;
    if (borra) P.control_delete_this_clone = (args, util) => { if (!util.target.isOriginal) this._ev({ tipo: 'borra_clon', obj: util.target.sprite.name, menor: true }); return borra(args, util); };
    // Algunos bloques ("decir … durante 2 segundos") usan setTimeout: se pasan al reloj virtual
    this.timers = []; this._tid = 1;
    const ct = window.clearTimeout.bind(window);
    window.clearTimeout = id => { if (typeof id === 'string' && id.startsWith('vt')){ this.timers = this.timers.filter(t => t.id !== id); return; } return ct(id); };
    this.reset();
    this.alEvento = null;
  }
  reset(){ this.timers = []; this.frame = 0; this.t0 = 1.7e12; this.eventos = []; this.toques = []; this.rng = mulberry32(this.semilla || 20261009); this.prev = null; this.pregunta = null; this._down = false; this.arrastre = null; }
  async cargar(buf){
    this._propio = true; try { this.vm.stopAll(); } catch(e){} this._propio = false;
    await this.vm.loadProject(buf.slice(0));
    parchearTarget(this.rt);
    await this._esperarImagenes();
    const kb = this.rt.ioDevices.keyboard; if (kb) kb._keysPressed = [];
    const ms = this.rt.ioDevices.mouse; if (ms) ms._isDown = false;
    this.reset();
    this.prev = this.estado();
    this.renderer.draw();
  }
  async _esperarImagenes(){
    const fin = performance.now() + 4000;
    while (performance.now() < fin){
      const pend = (this.renderer._allSkins || []).some(s => s && '_svgImageLoaded' in s && !s._svgImageLoaded && s._svgImage && s._svgImage.src && !s._svgImage.complete);
      if (!pend) break;
      await new Promise(r => setTimeout(r, 20));
    }
    await new Promise(r => setTimeout(r, 30));
  }
  _disfraz(t){ const c = t.getCostumes()[t.currentCostume]; return c ? c.name : ''; }
  sprites(){ return this.rt.targets.filter(t => !t.isStage && t.isOriginal); }
  sprite(n){ return this.sprites().find(t => t.sprite.name === n); }
  instancias(n){ return this.rt.targets.filter(t => !t.isStage && t.sprite && t.sprite.name === n); }
  vivo(t){ return t && this.rt.targets.includes(t); }
  stage(){ return this.rt.getTargetForStage(); }
  estado(){
    const s = { vars: {}, listas: {}, spr: {}, inst: {}, fondo: null, fondoIdx: 0, clones: {}, hilos: 0 };
    for (const t of this.rt.targets){
      if (t.isStage){ const c = t.getCostumes()[t.currentCostume]; s.fondo = c ? c.name : null; s.fondoIdx = t.currentCostume; }
      if (!t.isStage) s.inst[t.id] = { n: t.sprite.name, x: t.x, y: t.y, vis: t.visible, disfraz: this._disfraz(t), dir: t.direction, tam: t.size, clon: !t.isOriginal };
      if (!t.isOriginal){ const n = t.sprite.name; s.clones[n] = (s.clones[n] || 0) + 1; continue; }
      for (const v of Object.values(t.variables)){
        const clave = (t.isStage ? '' : t.sprite.name + ': ') + v.name;
        if (v.type === '') s.vars[clave] = v.value;
        else if (v.type === 'list'){ s.vars[clave + ' (lista)'] = v.value.length; s.listas[clave] = v.value.slice(); }
      }
      if (!t.isStage) s.spr[t.sprite.name] = s.inst[t.id];
    }
    s.hilos = this.rt.threads.filter(h => !h.updateMonitor && h.stack.length > 0 && !h.isKilled).length;
    return s;
  }
  _ev(e){ e.f = this.frame; this.eventos.push(e); if (this.alEvento) this.alEvento(e); }
  _toque(t, tipo, que){
    if (!t.sprite || tipo === 'raton') return;
    const por = t.isStage ? '(escenario)' : t.sprite.name;
    if (this.toques.length && this.toques.some(q => q.f === this.frame && q.id === t.id && q.tipo === tipo && q.que === que)) return;
    const q = { f: this.frame, por, id: t.id, clon: !t.isOriginal, tipo, que, x: t.x, y: t.y, disfraz: this._disfraz(t) };
    if (tipo === 'color'){
      // ¿El color está en otro objeto (y entonces importa dónde está ese objeto) o en el fondo?
      try {
        const b = t.getBounds(); let mejor = null;
        for (const o of this.rt.targets){
          if (o.isStage || !o.visible || !o.sprite || o === t || (o.sprite.name === por && o.isOriginal && !t.isOriginal && !o.visible)) continue;
          const c = o.getBounds(); if (!c || !b) continue;
          if (c.left <= b.right && c.right >= b.left && c.bottom <= b.top && c.top >= b.bottom){ const d = Math.hypot(o.x - t.x, o.y - t.y); if (!mejor || d < mejor.d) mejor = { d, o }; }
        }
        if (mejor) q.sobre = { n: mejor.o.sprite.name, off: [t.x - mejor.o.x, t.y - mejor.o.y], disfraz: this._disfraz(mejor.o) };
      } catch(e){}
    }
    if (tipo === 'objeto'){ const otro = this.instancias(que).find(o => o.visible); if (otro) q.quePos = [otro.x, otro.y]; }
    this.toques.push(q);
  }
  _diff(a, b){
    if (!a) return;
    for (const k in b.vars){
      if (k in a.vars && String(a.vars[k]) !== String(b.vars[k])) this._ev({ tipo: 'var', nombre: k, antes: a.vars[k], despues: b.vars[k] });
    }
    if (a.fondo !== b.fondo) this._ev({ tipo: 'fondo', antes: a.fondo, despues: b.fondo });
    const arr = this.arrastre && this.arrastre.t;
    for (const n in b.spr){
      const p = a.spr[n], q = b.spr[n]; if (!p) continue;
      if (p.vis !== q.vis) this._ev({ tipo: q.vis ? 'muestra' : 'oculta', obj: n });
      if (p.disfraz !== q.disfraz) this._ev({ tipo: 'disfraz', obj: n, despues: q.disfraz, menor: true });
      if (Math.hypot(q.x - p.x, q.y - p.y) > 60 && !(arr && arr.isOriginal && arr.sprite.name === n)) this._ev({ tipo: 'salta', obj: n, a: [q.x, q.y], desde: [p.x, p.y] });
    }
    if (a.hilos > 0 && b.hilos === 0) this._ev({ tipo: 'fin_hilos' });
  }
  async paso(){
    const base = this.t0 + this.frame * DT; let n = 0, ult = base;
    const vencidos = this.timers.filter(t => t.when <= base);
    if (vencidos.length){ this.timers = this.timers.filter(t => t.when > base); vencidos.sort((a, b) => a.when - b.when || a.n - b.n); for (const t of vencidos){ try { t.fn(); } catch(e){ console.warn(e); } } }
    await null; await null; await null;
    const rN = Date.now, rR = Math.random, rST = window.setTimeout;
    Date.now = () => (ult = Math.max(ult, base + (n++) * 0.001));
    Math.random = this.rng;
    window.setTimeout = (fn, ms) => { const id = 'vt' + (this._tid++); this.timers.push({ id, when: base + (Number(ms) || 0), fn, n: this._tid }); return id; };
    try { this.rt._step(); } finally { Date.now = rN; Math.random = rR; window.setTimeout = rST; }
    const s = this.estado(); this._diff(this.prev, s); this.prev = s;
    this.frame++;
  }
  async correr(n, entradas){
    for (let i = 0; i < n; i++){
      if (entradas) this.aplicarEntradas(entradas, this.frame);
      await this.paso();
      if (i % 6 === 5) await esperar();
    }
  }
  aplicarEntradas(entradas, f){
    if (!entradas._idx){ entradas._idx = new Map(); for (const e of entradas){ if (!entradas._idx.has(e.f)) entradas._idx.set(e.f, []); entradas._idx.get(e.f).push(e); } }
    for (const e of (entradas._idx.get(f) || [])) this.entrada(e);
  }
  entrada(e){
    if (e.flag){ this.bandera(); return; }
    if (e.k !== undefined) this.vm.postIOData('keyboard', { key: e.k, isDown: !!e.d });
    else if (e.r !== undefined) this.responder(e.r);
    else if (e.m) this.raton(e.m[0], e.m[1], e.d);
  }
  responder(texto){
    if (!this.pregunta) return false;
    this._ev({ tipo: 'respuesta', texto: String(texto), pregunta: this.pregunta.texto });
    this.pregunta = null;
    this.rt.emit('ANSWER', String(texto));
    return true;
  }
  raton(nx, ny, d){
    const cx = Math.max(0.5, Math.min(479.5, nx * 480)), cy = Math.max(0.5, Math.min(359.5, ny * 360));
    const sx = cx - 240, sy = 180 - cy;
    const data = { x: cx, y: cy, canvasWidth: 480, canvasHeight: 360 };
    if (d === true && !this._down){
      this._down = true;
      const t = this.rt.ioDevices.mouse._pickTarget(cx, cy);
      if (t && !t.isStage && t.draggable){ this.arrastre = { t, dx: t.x - sx, dy: t.y - sy, desde: [t.x, t.y], movido: false }; t.startDrag(); }
      data.isDown = true;
    } else if (d === false && this._down){
      this._down = false;
      const a = this.arrastre;
      if (a){
        if (this.vivo(a.t)) a.t.stopDrag();
        if (a.movido){ data.wasDragged = true; this._ev({ tipo: 'suelta', obj: a.t.sprite.name, clon: !a.t.isOriginal, desde: a.desde, hasta: [a.t.x, a.t.y], disfraz: this._disfraz(a.t) }); }
        this.arrastre = null;
      }
      data.isDown = false;
    } else if (this.arrastre && this.vivo(this.arrastre.t)){
      const a = this.arrastre; a.t.setXY(sx + a.dx, sy + a.dy, true); if (Math.hypot(a.t.x - a.desde[0], a.t.y - a.desde[1]) > 3) a.movido = true;
    }
    this.vm.postIOData('mouse', data);
  }
  bandera(){ this._propio = true; this.vm.greenFlag(); this._propio = false; this.pregunta = null; }
  parar(){ this._propio = true; this.vm.stopAll(); this._propio = false; }
  crearClon(nombre){
    const o = this.sprite(nombre); if (!o) return null;
    const c = o.makeClone(); if (!c) return null;
    this.rt.addTarget(c); c.goBehindOther(o);
    return c;
  }
  objetivoVar(clave){
    const [dueno, nom] = clave.includes(': ') ? [clave.split(': ')[0], nombreVar(clave)] : [null, clave];
    const t = dueno ? this.sprite(dueno) : this.stage();
    if (!t) return null;
    return Object.values(t.variables).find(v => v.name === nom && v.type === '') || null;
  }
  ponerVar(clave, valor){ const v = this.objetivoVar(clave); if (v){ v.value = valor; this.prev = this.estado(); return true; } return false; }
  sincronizar(){ this.prev = this.estado(); }
}

/* -------------------------------------------------------------------------
   2. EFECTOS: cómo se describe y se compara "lo que pasa"
   ------------------------------------------------------------------------- */
// Convierte eventos del motor en efectos comparables. rol(nombre) traduce
// nombres de objetos a papeles (@A, @B, @J) o al nombre del modelo.
function efectosDe(evs, rol, inicio){
  const out = []; const vistos = new Set();
  for (const e of evs){
    let d = null;
    switch (e.tipo){
      case 'var': { const dl = deltaDe(e); d = { t: 'var', k: e.nombre, d: dl, v: dl === null ? e.despues : null, antes: e.antes, despues: e.despues }; break; }
      case 'fondo': d = { t: 'fondo', a: e.despues }; break;
      case 'muestra': case 'oculta': d = { t: e.tipo, obj: rol(e.obj) }; break;
      case 'dice': if (!e.preg) d = { t: 'dice', obj: rol(e.obj), texto: e.texto }; break;
      case 'pregunta': d = { t: 'pregunta', texto: e.texto }; break;
      case 'sonido': d = { t: 'sonido', obj: rol(e.obj) }; break;
      case 'borra_clon': d = { t: 'borra_clon', obj: rol(e.obj) }; break;
      case 'salta': { const ini = inicio && inicio[e.obj]; d = { t: 'salta', obj: rol(e.obj), vuelve: !!(ini && dist(e.a, ini) < 30) }; break; }
      case 'stop': case 'fin_hilos': d = { t: 'stop' }; break;
    }
    if (!d) continue;
    const k = claveEf(d);
    if (d.t === 'var'){ if (out.some(x => x.t === 'var' && x.k === d.k)) continue; } // primer cambio de cada variable
    else if (vistos.has(k)) continue;
    vistos.add(k); out.push(d);
  }
  return out;
}
function claveEf(d){
  switch (d.t){
    case 'var': return 'var|' + d.k + '|' + (d.d === null || d.d === undefined ? 'c' : Math.round(d.d * 1000) / 1000);
    case 'dice': return 'dice|' + norm(d.texto);
    case 'muestra': case 'oculta': case 'borra_clon': case 'salta': case 'sonido': case 'clon': case 'mueve': case 'gira': case 'disfraz': return d.t + '|' + d.obj;
    default: return d.t;
  }
}
function nomRol(o, ctx){ if (!o) return ''; if (o === '@A') return ctx && ctx.A || 'el objeto'; if (o === '@B') return ctx && ctx.B || 'el otro objeto'; if (o === '@J') return ctx && ctx.J || 'el jugador'; return o; }
function textoEf(d, ctx){
  const o = () => (d.obj === '@A' && ctx && ctx.Agen) ? ctx.Agen : '«' + nomRol(d.obj, ctx) + '»';
  switch (d.t){
    case 'var': return (d.alt ? d.alt.map(nombreVar).join(' o ') : nombreVar(d.k)) + (d.d === null || d.d === undefined ? (d.v !== null && d.v !== undefined && !d.cambia ? ' = ' + d.v : ' cambia') : ' ' + fmtDelta(d.d));
    case 'fondo': return 'cambia el fondo' + (d.a ? ' (a «' + d.a + '»)' : '');
    case 'muestra': return 'aparece ' + o();
    case 'oculta': return 'se esconde ' + o();
    case 'dice': return o() + ' dice «' + (d.azar ? (d.forma || conAzar(d.texto)) : d.texto) + '»';
    case 'pregunta': return d.azar ? 'hace una pregunta («' + (d.forma || conAzar(d.texto)) + '», al azar)' : 'hace una pregunta («' + d.texto + '»)';
    case 'sonido': return 'suena un sonido';
    case 'borra_clon': return 'desaparece el clon de ' + o();
    case 'salta': return d.vuelve ? o() + ' vuelve a su sitio de salida' : o() + ' salta a otro sitio';
    case 'stop': return 'el juego se detiene';
    case 'clon': return 'crea un clon de ' + o();
    case 'mueve': return o() + ' se mueve ' + Math.round(Math.hypot(d.dx, d.dy)) + ' px ' + direccion(d.dx, d.dy) + (d.alRaton ? ' (hacia el ratón)' : '');
    case 'gira': return o() + ' gira ' + (d.s > 0 ? 'a la derecha' : 'a la izquierda');
    case 'disfraz': return o() + ' cambia de disfraz';
    case 'tam': return o() + ' cambia de tamaño';
    default: return d.t;
  }
}
function direccion(dx, dy){ return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'a la derecha' : 'a la izquierda') : (dy > 0 ? 'hacia arriba' : 'hacia abajo'); }
const VISUALES = ['fondo', 'muestra', 'dice'];
// ¿Está el efecto esperado entre los obtenidos? Devuelve {ok, visto}.
function buscarEfecto(esp, obt, ctx, opciones = {}){
  if (esp.t === 'var'){
    const vars = obt.filter(x => x.t === 'var');
    const okV = x => (esp.d === null || esp.d === undefined || esp.cambia) ? (esp.cambia || esp.v === null || esp.v === undefined ? true : valorIgual(x.despues, esp.v)) : (x.d !== null && x.d !== undefined && Math.abs(x.d - esp.d) < 1e-6);
    if (esp.alt){
      for (const ka of esp.alt){ const k2 = ctx.mapaVar ? ctx.mapaVar(ka, vars.map(x => x.k)) : ka; const v = vars.find(x => x.k === k2 && okV(x)); if (v) return { ok: true, visto: v }; }
    }
    const k = ctx.mapaVar ? ctx.mapaVar(esp.k, vars.map(x => x.k)) : esp.k;
    const mismo = vars.find(x => x.k === k);
    if (mismo && okV(mismo)) return { ok: true, visto: mismo };
    const otra = vars.find(x => okV(x) && !(ctx.usadas && ctx.usadas.has(x.k)));
    if (otra){ if (ctx.aprender) ctx.aprender(esp.k, otra.k); return { ok: true, visto: otra, otraVar: true }; }
    return { ok: false, visto: mismo || null };
  }
  if (opciones.visualIgual && VISUALES.includes(esp.t)){
    const v = obt.find(x => VISUALES.includes(x.t)); return { ok: !!v, visto: v };
  }
  if (esp.t === 'dice' && esp.azar && esp.forma && esp.forma.includes('…')){ const [pre, suf] = esp.forma.split('…'); const v = obt.find(x => x.t === 'dice' && norm(x.texto).startsWith(norm(pre)) && norm(x.texto).endsWith(norm(suf))) || obt.find(x => x.t === 'dice'); return { ok: !!v && parecido(v.texto.slice(0, pre.length), pre) >= 0.7, visto: v }; }
  if (esp.t === 'dice' && esp.azar){ const v = obt.filter(x => x.t === 'dice').sort((a, b) => parecido(plantilla(b.texto), plantilla(esp.texto)) - parecido(plantilla(a.texto), plantilla(esp.texto)))[0]; return { ok: !!v && parecido(plantilla(v.texto), plantilla(esp.texto)) >= 0.7, visto: v }; }
  if (esp.t === 'dice'){ const v = obt.filter(x => x.t === 'dice').sort((a, b) => parecidoDice(b.texto, esp.texto) - parecidoDice(a.texto, esp.texto))[0]; return { ok: !!v && parecidoDice(v.texto, esp.texto) >= 0.7, visto: v }; }
  if (esp.t === 'salta'){ const v = obt.find(x => x.t === 'salta' && x.obj === esp.obj && (!esp.vuelve || x.vuelve)); return { ok: !!v, visto: v || obt.find(x => x.t === 'salta' && x.obj === esp.obj) }; }
  if (esp.t === 'fondo' || esp.t === 'pregunta' || esp.t === 'stop' || esp.t === 'sonido'){ const v = obt.find(x => x.t === esp.t); return { ok: !!v, visto: v }; }
  const v = obt.find(x => claveEf(x) === claveEf(esp)); return { ok: !!v, visto: v };
}
const pesoEf = d => d.t === 'var' ? 2 : 1;

/* -------------------------------------------------------------------------
   3. AYUDAS PARA LAS PRUEBAS
   ------------------------------------------------------------------------- */
let motor;
async function arrancar(buf){
  await motor.cargar(buf);
  motor.bandera();
  await motor.correr(INICIO);
}
function posiciones(){ const r = {}; for (const t of motor.sprites()) r[t.sprite.name] = [t.x, t.y]; return r; }
// Busca un ejemplar visible de un objeto (original o clon); espera a que aparezca o lo crea.
async function instancia(nombre, { esperarF = 120, crear = true, filtro = null, evitar = null } = {}){
  const valido = t => t.visible && (!filtro || filtro(t)) && t !== evitar;
  const tieneClones = () => { const o = motor.sprite(nombre); return !!o && o.blocks && Object.values(o.blocks._blocks || {}).some(b => b.opcode === 'control_start_as_clone'); };
  for (let i = 0; i <= esperarF; i += 3){
    const xs = motor.instancias(nombre).filter(valido);
    if (xs.length){ xs.sort((a, b) => (Math.abs(a.x) + Math.abs(a.y)) - (Math.abs(b.x) + Math.abs(b.y))); return xs[0]; }
    // Un objeto sin clones no va a cambiar solo: no merece la pena esperar
    if (!tieneClones() && motor.instancias(nombre).some(t => t.visible && t !== evitar)) break;
    if (i < esperarF) await motor.correr(3);
  }
  const visibles = motor.instancias(nombre).filter(t => t.visible && t !== evitar);
  if (visibles.length) return visibles[0];
  if (crear && tieneClones()){
    const c = motor.crearClon(nombre);
    if (c){ await motor.correr(2); if (motor.vivo(c) && c.visible) return c; }
  }
  return null;
}
const mismoDisfraz = (t, nombre) => normNombre(motor._disfraz(t)) === normNombre(nombre);
async function ponerDisfraz(t, nombre){ if (!nombre || !t) return; const i = t.getCostumes().findIndex(c => normNombre(c.name) === normNombre(nombre)); if (i >= 0 && i !== t.currentCostume) t.setCostume(i); }

/* Ejecuta una causa sobre el juego ya arrancado y devuelve los eventos que provoca.
   c: causa traducida a nombres del juego que se está probando. */
async function provocar(c, ventana = 30){
  const desde = motor.eventos.length;
  const ini = posiciones();
  const hayEfecto = () => motor.eventos.slice(desde).some(e => ['var','oculta','muestra','borra_clon','salta','stop','pregunta','dice','sonido','fondo'].includes(e.tipo));
  let nota = '';
  if (c.tipo === 'toca' || c.tipo === 'color' || c.tipo === 'borde'){
    const filtroA = c.disfraz ? (t => mismoDisfraz(t, c.disfraz)) : null;
    let A = await instancia(c.A, { filtro: filtroA, esperarF: filtroA ? 60 : 120 });
    if (!A && filtroA) A = await instancia(c.A);
    if (A && filtroA && !filtroA(A)) ponerDisfraz(A, c.disfraz);
    if (!A) return { ok: false, nota: 'no aparece «' + c.A + '»' };
    let B = null;
    if (c.tipo === 'toca'){ B = await instancia(c.B, { evitar: A }); if (!B) return { ok: false, nota: 'no aparece «' + c.B + '»' }; }
    let S = null;
    if (c.tipo === 'color' && c.sobre){
      const fS = c.sobreDisfraz ? (t => mismoDisfraz(t, c.sobreDisfraz)) : null;
      S = await instancia(c.sobre, { evitar: A, crear: c.sobre === c.A, filtro: fS, esperarF: 60 });
      if (!S && fS) S = await instancia(c.sobre, { evitar: A, crear: c.sobre === c.A });
      if (S && fS && !fS(S)) ponerDisfraz(S, c.sobreDisfraz);
      if (S && !motor.vivo(A)){ A = await instancia(c.A, { evitar: S }); if (A && filtroA && !filtroA(A)) ponerDisfraz(A, c.disfraz); }
    }
    const desdeAccion = motor.eventos.length, toques0 = motor.toques.length;
    const ini2 = posiciones();
    // Se coloca A encima de B (o del color / borde). Si A se desliza y vuelve a su camino,
    // se prueba al revés: B encima de A.
    for (let i = 0; i < 12; i++){
      if (motor.eventos.slice(desdeAccion).some(e => ['var','oculta','borra_clon','stop','pregunta','dice','fondo','muestra'].includes(e.tipo))) break;
      if (motor.toques.slice(toques0).some(t => t.id === A.id || (B && t.id === B.id))) break;
      if (!motor.vivo(A) || (B && !motor.vivo(B))) break;
      if (c.tipo === 'toca' && i >= 4){ B.setXY(A.x, A.y); }
      else if (c.tipo === 'color' && i >= 4 && S && motor.vivo(S)){ S.setXY(A.x - c.off[0], A.y - c.off[1]); }
      else {
        let destino;
        if (c.tipo === 'toca') destino = [B.x, B.y];
        else if (c.tipo === 'color') destino = S && motor.vivo(S) ? [S.x + c.off[0], S.y + c.off[1]] : c.pos;
        else destino = c.pos;
        A.setXY(destino[0], destino[1]);
      }
      motor.sincronizar();
      await motor.correr(1);
    }
    // Último intento: se "sujeta" A (como si se arrastrara) para que sus deslizamientos no lo muevan
    const tocado = () => motor.toques.slice(toques0).some(t => t.id === A.id || (B && t.id === B.id)) || motor.eventos.slice(desdeAccion).some(e => ['var','oculta','borra_clon','stop','pregunta','dice','fondo','muestra'].includes(e.tipo));
    if (!tocado() && motor.vivo(A)){
      A.dragging = true;
      for (let i = 0; i < 8 && !tocado() && motor.vivo(A) && (!B || motor.vivo(B)); i++){
        const destino = c.tipo === 'toca' ? [B.x, B.y] : c.tipo === 'color' && S && motor.vivo(S) ? [S.x + c.off[0], S.y + c.off[1]] : c.pos;
        A.setXY(destino[0], destino[1], true); motor.sincronizar();
        await motor.correr(1);
      }
      if (motor.vivo(A)) A.dragging = false;
    }
    await motor.correr(ventana);
    return { ok: true, evs: motor.eventos.slice(desdeAccion), ini: ini2, A: A.sprite.name, B: B ? B.sprite.name : null };
  }
  if (c.tipo === 'clic'){
    const intentos = c.intentos || 8; const usados = new Set();
    for (let k = 0; k < intentos; k++){
      const A = await instancia(c.A, { filtro: t => !usados.has(t) && (!c.disfraz || mismoDisfraz(t, c.disfraz) || k > 1), esperarF: 150, crear: false });
      if (!A) break;
      usados.add(A);
      const d0 = motor.eventos.length, ini2 = posiciones();
      const p = [(A.x + 240) / 480, (180 - A.y) / 360];
      motor.raton(p[0], p[1]); motor.raton(p[0], p[1], true); await motor.correr(2); motor.raton(p[0], p[1], false);
      await motor.correr(ventana);
      const evs = motor.eventos.slice(d0);
      const tipos = c.tipos || ['var','oculta','borra_clon','salta','stop','pregunta','dice','fondo','muestra','sonido'];
      if (evs.some(e => tipos.includes(e.tipo) && (e.tipo !== 'var' || !c.vars || c.vars.includes(e.nombre))) || k === intentos - 1) return { ok: true, evs, ini: ini2, A: A.sprite.name };
    }
    return { ok: false, nota: 'no aparece «' + c.A + '» para hacer clic' };
  }
  if (c.tipo === 'suelta'){
    let A = await instancia(c.A, { filtro: c.disfraz ? (t => mismoDisfraz(t, c.disfraz)) : null, esperarF: 240, crear: false });
    if (!A){ A = await instancia(c.A, { crear: false }); if (A) ponerDisfraz(A, c.disfraz); }
    if (!A) return { ok: false, nota: 'no aparece «' + c.A + '» para arrastrarlo' };
    const d0 = motor.eventos.length, ini2 = posiciones();
    const p0 = [(A.x + 240) / 480, (180 - A.y) / 360], p1 = [(c.hasta[0] + 240) / 480, (180 - c.hasta[1]) / 360];
    motor.raton(p0[0], p0[1]); motor.raton(p0[0], p0[1], true); await motor.correr(1);
    for (let i = 1; i <= 6; i++){ motor.raton(p0[0] + (p1[0] - p0[0]) * i / 6, p0[1] + (p1[1] - p0[1]) * i / 6); await motor.correr(1); }
    motor.raton(p1[0], p1[1], false);
    await motor.correr(ventana);
    return { ok: true, evs: motor.eventos.slice(d0), ini: ini2, A: A.sprite.name };
  }
  if (c.tipo === 'condicion'){
    if (!motor.ponerVar(c.var, c.valor)) return { ok: false, nota: 'no existe la variable «' + nombreVar(c.var) + '»' };
    const d0 = motor.eventos.length, ini2 = posiciones();
    await motor.correr(90);
    return { ok: true, evs: motor.eventos.slice(d0), ini: ini2 };
  }
  if (c.tipo === 'tiempo'){
    const d0 = motor.eventos.length, ini2 = posiciones();
    await motor.correr(300);
    return { ok: true, evs: motor.eventos.slice(d0), ini: ini2 };
  }
  return { ok: false, nota: 'causa desconocida' };
}

/* -------------------------------------------------------------------------
   4. ANÁLISIS DE LA PARTIDA DEL PROFESOR
   ------------------------------------------------------------------------- */
function infoSprites(){ return motor.sprites().map(t => ({ n: t.sprite.name, sig: [...new Set(t.getCostumes().map(c => c.assetId))].sort().join(','), disfraces: t.getCostumes().map(c => c.name), draggable: t.draggable })); }

/* Azar: se repite la partida del profesor con otras "semillas" de números aleatorios.
   Lo que cambia de una vez a otra (variables, preguntas, textos) es aleatorio. */
const conAzar = t => String(t).replace(/\d+([.,]\d+)?/g, '?');
async function estudiarAzar(buf, grab, progreso){
  const semillas = [motor.semilla || 20261009, 101, 202];
  const frames = Math.min(grab.frames, 1200);
  const runs = [];
  const sem0 = motor.semilla;
  try {
    for (let i = 0; i < semillas.length; i++){
      if (progreso) progreso('Repitiendo tu partida con otros números al azar (' + (i + 1) + ' de ' + semillas.length + ')…');
      motor.semilla = semillas[i];
      await motor.cargar(buf);
      const entradas = grab.entradas.map(e => ({ ...e }));
      const r = { vars: {}, ini: null, preguntas: [], textos: [] };
      for (let f = 0; f < frames; f++){
        motor.aplicarEntradas(entradas, motor.frame);
        await motor.paso();
        if (f === INICIO) r.ini = { ...motor.estado().vars };
        if (f % 6 === 5) await esperar();
      }
      for (const e of motor.eventos){
        if (e.tipo === 'var'){ const l = r.vars[e.nombre] || (r.vars[e.nombre] = []); if (l.length < 12) l.push(String(e.despues)); }
        else if (e.tipo === 'pregunta' && r.preguntas.length < 12) r.preguntas.push(e.texto);
        else if (e.tipo === 'dice' && !e.preg && r.textos.length < 30) r.textos.push(e.texto);
      }
      runs.push(r);
    }
  } finally { motor.semilla = sem0; }
  const azar = { vars: [], preguntas: [], textos: [] };
  const prefijoDistinto = (a, b) => { const n = Math.min(a.length, b.length); for (let i = 0; i < n; i++) if (a[i] !== b[i]) return true; return false; };
  const nombres = new Set(runs.flatMap(r => [...Object.keys(r.vars), ...Object.keys(r.ini || {})]));
  for (const k of nombres){
    const inicios = new Set(runs.map(r => r.ini ? String(r.ini[k]) : '').filter(x => x !== 'undefined'));
    let distinto = inicios.size > 1;
    for (let i = 1; i < runs.length && !distinto; i++) distinto = prefijoDistinto(runs[0].vars[k] || [], runs[i].vars[k] || []);
    if (distinto) azar.vars.push(k);
  }
  const variables = (campo, destino) => {
    const porPlantilla = new Map();
    for (const r of runs) for (const t of r[campo]){ const p = plantilla(t); if (!porPlantilla.has(p)) porPlantilla.set(p, new Set()); porPlantilla.get(p).add(norm(t)); }
    for (const [p, set] of porPlantilla) if (set.size > 1 && /#/.test(p)) azar[destino].push(p);
  };
  variables('preguntas', 'preguntas'); variables('textos', 'textos');
  // Textos que cambian una palabra al azar (p. ej. el país de la pregunta): se guarda su forma
  azar.formas = [];
  for (const campo of ['preguntas', 'textos']){
    const n = Math.max(...runs.map(r => r[campo].length), 0);
    for (let i = 0; i < n; i++){
      const ts = [...new Set(runs.map(r => r[campo][i]).filter(Boolean))];
      if (ts.length < 2) continue;
      let pre = ts[0], suf = ts[0];
      for (const t of ts){ while (!t.startsWith(pre)) pre = pre.slice(0, -1); while (!t.endsWith(suf)) suf = suf.slice(1); }
      if (pre.length >= 5 && !azar.formas.some(f => f.pre === pre && f.suf === suf)) azar.formas.push({ pre, suf, campo });
    }
  }
  // Con el mismo comienzo, se queda la forma más general (el final más corto)
  azar.formas = azar.formas.filter(f => !azar.formas.some(g => g !== f && g.pre === f.pre && f.suf.endsWith(g.suf) && g.suf.length < f.suf.length));
  return azar;
}
function formaAzar(t, azar){
  if (!azar) return null;
  if ((azar.preguntas || []).concat(azar.textos || []).includes(plantilla(t))) return conAzar(t);
  const f = (azar.formas || []).find(f => t.startsWith(f.pre) && t.endsWith(f.suf) && t.length > f.pre.length + f.suf.length);
  return f ? f.pre + '…' + f.suf : null;
}
// Marca en los efectos esperados lo que es aleatorio: solo se exigirá que cambie
function marcarAzar(efs, azar){
  if (!azar) return efs;
  for (const d of efs){
    if (d.t === 'var' && azar.vars.includes(d.k) && !d.alt && !(d.v !== null && d.v !== undefined && d.deRespuesta)){ d.d = null; d.v = null; d.cambia = true; }
    if ((d.t === 'dice' || d.t === 'pregunta') && formaAzar(d.texto, azar)){ d.azar = true; d.forma = formaAzar(d.texto, azar); }
  }
  return efs;
}

/* Comportamiento espontáneo: qué pasa si nadie toca nada durante 10 s. */
async function perfilEspontaneo(buf){
  await arrancar(buf);
  const p = { vars: {}, clones: {}, anim: {}, movers: [], fin: false };
  const d0 = motor.eventos.length;
  const ini = motor.estado();
  const rango = {}, cambios = {}, vida = {}, vidaMax = {};
  const ver = s => {
    for (const id in s.inst){
      const i = s.inst[id]; const g = i.n;
      if (!rango[g]) rango[g] = {};
      const r = rango[g][id] || (rango[g][id] = { x0: i.x, x1: i.x, y0: i.y, y1: i.y, vis: i.vis, clon: i.clon, ult: i });
      r.x0 = Math.min(r.x0, i.x); r.x1 = Math.max(r.x1, i.x); r.y0 = Math.min(r.y0, i.y); r.y1 = Math.max(r.y1, i.y); r.vis = r.vis || i.vis;
      const c = cambios[g] || (cambios[g] = { disfraz: 0, tam: 0, gira: 0 });
      const tocado = motor.toques.some(t => t.por === g && t.f >= motor.frame - 30);
      if (r.ult !== i){ if (r.ult.disfraz !== i.disfraz && !tocado) c.disfraz++; if (Math.abs(r.ult.tam - i.tam) > 0.5) c.tam++; if (Math.abs(r.ult.dir - i.dir) > 0.5) c.gira++; }
      r.ult = i;
    }
  };
  ver(ini);
  let fr = 0;
  for (; fr < 300; fr++){
    await motor.correr(1);
    const s = motor.estado(); ver(s);
    if (s.hilos === 0 && fr > 5){ p.fin = true; break; }
  }
  p.frames = fr + 1;
  const evs = motor.eventos.slice(d0);
  const toques = motor.toques;
  for (const e of evs){
    if (e.tipo === 'var' && toques.some(t => t.f >= e.f - 30 && t.f <= e.f)) continue;
    if (e.tipo === 'var'){ const v = p.vars[e.nombre] || (p.vars[e.nombre] = { n: 0, deltas: {} }); v.n++; const d = deltaDe(e); const k = d === null ? 'c' : String(Math.round(d * 1000) / 1000); v.deltas[k] = (v.deltas[k] || 0) + 1; }
    if (e.tipo === 'clon'){ const c = p.clones[e.obj] || (p.clones[e.obj] = { creados: 0, borrados: 0, mueven: false }); c.creados++; }
    if (e.tipo === 'borra_clon'){ const c = p.clones[e.obj] || (p.clones[e.obj] = { creados: 0, borrados: 0, mueven: false }); c.borrados++; }
  }
  for (const g in rango){
    const lista = Object.values(rango[g]);
    const mueve = r => r.vis && (r.x1 - r.x0 > 15 || r.y1 - r.y0 > 15);
    if (p.clones[g]) p.clones[g].mueven = lista.some(r => r.clon && mueve(r));
    const orig = lista.find(r => !r.clon);
    if (orig && mueve(orig)) p.movers.push(g);
    const c = cambios[g];
    if (c && (c.disfraz >= 2 || c.tam >= 2 || c.gira >= 2)) p.anim[g] = { disfraz: c.disfraz >= 2, tam: c.tam >= 2, gira: c.gira >= 2 };
  }
  return p;
}
function sinEspontaneos(evs, perfil, implicados = []){ return evs.filter(e => !esEspontaneo(perfil, e) || ((e.tipo === 'borra_clon' || e.tipo === 'oculta') && implicados.includes(e.obj))); }
function esEspontaneo(perfil, e){
  if (e.tipo === 'var'){ const v = perfil.vars[e.nombre]; if (!v) return false; if (Object.keys(v.deltas).length > 1) return true; const d = deltaDe(e); const k = d === null ? 'c' : String(Math.round(d * 1000) / 1000); return !!(v.deltas[k] || v.deltas.c); }
  if (e.tipo === 'borra_clon' || e.tipo === 'clon') return !!(perfil.clones[e.obj] && (e.tipo === 'clon' ? perfil.clones[e.obj].creados : perfil.clones[e.obj].borrados));
  return false;
}

/* Gestos del jugador: teclas y pulsaciones del ratón (con o sin teclas). */
function gestosDe(grab){
  const gestos = []; const vistos = new Set(); const sostenidas = new Set();
  const clics = grab.eventos.filter(e => e.tipo === 'clic' || e.tipo === 'suelta');
  for (const e of grab.entradas){
    if (e.flag) { sostenidas.clear(); continue; }
    if (e.k !== undefined){
      if (MODIF.includes(e.k)) continue;
      if (e.d){ sostenidas.add(e.k); if (!vistos.has('k' + e.k)){ vistos.add('k' + e.k); gestos.push({ tipo: 'tecla', k: e.k }); } }
      else sostenidas.delete(e.k);
    } else if (e.m && e.d === true){
      if (clics.some(c => c.f >= e.f && c.f <= e.f + 3)) continue;
      const clave = 'm' + [...sostenidas].sort().join('+');
      if (vistos.has(clave)) continue;
      vistos.add(clave); gestos.push({ tipo: 'raton', p: e.m, teclas: [...sostenidas].sort() });
    }
  }
  return gestos.slice(0, 12);
}
function nombreGesto(g){
  if (g.tipo === 'tecla') return 'Tecla ' + nomTecla(g.k);
  return (g.teclas.length ? 'Tecla ' + g.teclas.map(nomTecla).join('+') + ' + ' : '') + 'clic en (' + Math.round(g.p[0] * 480 - 240) + ', ' + Math.round(180 - g.p[1] * 360) + ')';
}
/* Ejecuta el gesto y compara con una partida igual sin gesto. */
async function correrGesto(buf, g, opciones = {}){
  if (opciones.variar){
    const a = await correrGesto(buf, g);
    const sem = motor.semilla; motor.semilla = 777;
    let b; try { b = await correrGesto(buf, g); } finally { motor.semilla = sem; }
    return fusionarAzar(a, b);
  }
  const fotos = [6, 30, 60];
  const toma = async (conGesto) => {
    await arrancar(buf);
    const d0 = motor.eventos.length; const snaps = {}; const estado0 = motor.estado();
    let clones0 = { ...estado0.clones };
    for (let i = 0; i <= 60; i++){
      if (conGesto){
        if (g.tipo === 'tecla'){ if (i === 0) motor.entrada({ k: g.k, d: true }); if (i === 2) motor.entrada({ k: g.k, d: false }); }
        else {
          if (i === 0){ for (const k of g.teclas) motor.entrada({ k, d: true }); motor.raton(g.p[0], g.p[1]); motor.raton(g.p[0], g.p[1], true); }
          if (i === 20){ motor.raton(g.p[0], g.p[1], false); for (const k of g.teclas) motor.entrada({ k, d: false }); }
        }
      }
      if (fotos.includes(i)) snaps[i] = motor.estado();
      if (i < 60) await motor.correr(1);
    }
    const creados = {}; for (const e of motor.eventos.slice(d0)) if (e.tipo === 'clon') creados[e.obj] = (creados[e.obj] || 0) + 1;
    return { evs: motor.eventos.slice(d0), snaps, creados, pregunta: motor.pregunta };
  };
  const base = await toma(false), con = await toma(true);
  const ef = [];
  const objetivo = g.tipo === 'raton' ? [g.p[0] * 480 - 240, 180 - g.p[1] * 360] : null;
  for (const n in con.snaps[6].spr){
    const b6 = base.snaps[6].spr[n], c6 = con.snaps[6].spr[n], b30 = base.snaps[30].spr[n], c30 = con.snaps[30].spr[n];
    if (!b6 || !c6) continue;
    const momento = g.tipo === 'raton' ? [b30, c30] : [b6, c6];
    const dx = momento[1].x - momento[0].x, dy = momento[1].y - momento[0].y;
    if (Math.hypot(dx, dy) >= 4){
      const d = { t: 'mueve', obj: n, dx, dy };
      if (objetivo) d.alRaton = dist([momento[1].x, momento[1].y], objetivo) + 10 < dist([momento[0].x, momento[0].y], objetivo);
      ef.push(d);
    }
    const dd = ((c6.dir - b6.dir + 540) % 360) - 180;
    if (Math.abs(dd) >= 3) ef.push({ t: 'gira', obj: n, s: Math.sign(dd) });
    const b60 = base.snaps[60].spr[n], c60 = con.snaps[60].spr[n];
    if (b6.disfraz !== c6.disfraz || (b60 && c60 && b60.disfraz !== c60.disfraz)) ef.push({ t: 'disfraz', obj: n });
    if (b6.vis !== c6.vis) ef.push({ t: c6.vis ? 'muestra' : 'oculta', obj: n });
  }
  for (let q = ef.length - 1; q >= 0; q--) if (ef[q].t === 'gira' && ef.some(x => x.t === 'mueve' && x.obj === ef[q].obj)) ef.splice(q, 1);
  for (const n in con.creados) if ((con.creados[n] || 0) > (base.creados[n] || 0)) ef.push({ t: 'clon', obj: n });
  // Eventos que solo aparecen con el gesto
  const huella = e => e.tipo + '|' + (e.nombre || e.obj || '') + '|' + (e.tipo === 'var' ? deltaDe(e) : '') + '|' + (e.texto || '');
  const cuenta = {}; for (const e of base.evs) cuenta[huella(e)] = (cuenta[huella(e)] || 0) + 1;
  const extra = [];
  for (const e of con.evs){ const h = huella(e); if (cuenta[h]) cuenta[h]--; else extra.push(e); }
  for (const d of efectosDe(extra.filter(e => ['var','dice','pregunta','sonido','fondo','stop'].includes(e.tipo)), x => x)) ef.push(d);
  return ef;
}

/* Compara dos ejecuciones con distinto azar: lo que cambia es aleatorio. */
function fusionarAzar(efA, efB){
  const va = efA.filter(d => d.t === 'var'), vb = efB.filter(d => d.t === 'var');
  const out = efA.filter(d => d.t !== 'var');
  const usados = new Set();
  for (const a of va){
    const b = vb.find(x => x.k === a.k);
    if (b){
      usados.add(b);
      const igual = (a.d !== null && b.d !== null) ? Math.abs(a.d - b.d) < 1e-6 : valorIgual(a.v, b.v);
      out.push(igual ? a : { ...a, d: null, v: null, cambia: true });
    } else {
      const alt = vb.find(x => !usados.has(x) && !va.some(y => y.k === x.k) && x.d !== null && a.d !== null && Math.abs(x.d - a.d) < 1e-6);
      if (alt){ usados.add(alt); out.push({ ...a, alt: [a.k, alt.k] }); }
    }
  }
  return out;
}

/* Atribuye cada efecto de la partida a su causa más probable. */
function analizarCausas(grab, perfil, jugador, firmas){
  const banderas = grab.entradas.filter(e => e.flag).map(e => e.f);
  const enInicio = f => banderas.some(b => f >= b && f < b + INICIO - 3) || !banderas.length || f < banderas[0];
  const reglas = new Map();
  const condiciones = new Map();
  const respuestas = grab.eventos.filter(e => e.tipo === 'respuesta');
  const preguntas = grab.eventos.filter(e => e.tipo === 'pregunta');
  const clicsYsueltas = grab.eventos.filter(e => e.tipo === 'clic' || e.tipo === 'suelta');
  const entradasRec = grab.entradas.filter(e => (e.k !== undefined && e.d && !MODIF.includes(e.k)) || (e.m && e.d === true && !clicsYsueltas.some(c => Math.abs(c.f - e.f) <= 3 || (c.tipo === 'suelta' && e.f <= c.f && e.f >= c.f - 90))));
  const vars = grab.eventos.filter(e => e.tipo === 'var');
  const sig = n => firmas[n] || n;
  const efectos = grab.eventos.filter(e => ['var','fondo','muestra','oculta','dice','pregunta','sonido','borra_clon','salta','stop'].includes(e.tipo) && !(e.tipo === 'dice' && e.preg));
  const anadir = (mapa, clave, base, efectoEv, episodio) => {
    if (!mapa.has(clave)) mapa.set(clave, { ...base, efectos: [], episodios: [] });
    const r = mapa.get(clave);
    r.efectos.push(efectoEv);
    if (episodio && !r.episodios.some(x => x.f === episodio.f)) r.episodios.push(episodio);
  };
  for (const e of efectos){
    if (enInicio(e.f)) continue;
    if (esEspontaneo(perfil, e) && !((e.tipo === 'borra_clon' || e.tipo === 'oculta') && grab.toques.some(t => t.f >= e.f - 1 && t.f <= e.f && t.por === e.obj && t.tipo !== 'borde'))) continue;
    const f = e.f;
    // a) Una respuesta acaba de darse
    const resp = respuestas.filter(r => r.f >= f - 3 && r.f <= f).pop();
    // b) Choques en este fotograma o el anterior (o hasta 1 s antes si no hubo otra acción)
    const cercanos = grab.toques.filter(t => t.f >= f - 1 && t.f <= f);
    const ultimaAccion = Math.max(-1, ...clicsYsueltas.filter(x => x.f <= f).map(x => x.f), ...respuestas.filter(x => x.f <= f).map(x => x.f));
    const lejanos = grab.toques.filter(t => t.f >= f - 30 && t.f < f - 1 && t.f > ultimaAccion);
    const elegir = lista => {
      if (!lista.length) return null;
      const objE = e.obj;
      const rel = lista.filter(t => objE && (t.por === objE || t.que === objE));
      const orden = l => l.find(t => t.tipo === 'objeto') || l.find(t => t.tipo === 'color') || l.find(t => t.tipo === 'borde');
      return orden(rel) || orden(lista.filter(t => t.por === jugador || t.que === jugador)) || orden(lista);
    };
    let causa = null;
    if (resp && e.tipo !== 'pregunta') causa = { tipo: 'respuesta', ep: resp };
    else {
      const t = elegir(cercanos) || elegir(lejanos);
      if (t) causa = { tipo: t.tipo === 'objeto' ? 'toca' : t.tipo, t };
      else {
        const accion = [...entradasRec.filter(x => x.f >= f - 60 && x.f <= f).map(x => ({ f: x.f, ent: x })), ...clicsYsueltas.filter(x => x.f >= f - 60 && x.f <= f).map(x => ({ f: x.f + 0.5, ev: x }))].sort((a, b) => a.f - b.f).pop();
        if (accion && accion.ev) causa = { tipo: accion.ev.tipo, ev: accion.ev };
        else if (accion) causa = null; // teclas y ratón: lo comprueban los "Controles"
        else if (e.tipo !== 'var') causa = { tipo: 'tiempo' };
      }
    }
    if (causa){
      let clave, base;
      if (causa.tipo === 'toca'){
        const t = causa.t; const A = t.por, B = t.que;
        clave = 'toca|' + [sig(A), sig(B)].sort().join('|');
        base = { tipo: 'toca', A, B, Aclon: t.clon, disfraz: null };
      } else if (causa.tipo === 'color'){
        const t = causa.t;
        clave = 'color|' + sig(t.por) + '|' + t.que + '|' + (t.sobre ? sig(t.sobre.n) : '');
        base = { tipo: 'color', A: t.por, color: t.que, pos: [t.x, t.y], sobre: t.sobre ? t.sobre.n : null, off: t.sobre ? t.sobre.off : null, sobreDisfraz: t.sobre ? t.sobre.disfraz : null, disfraz: t.disfraz, Aclon: t.clon };
      } else if (causa.tipo === 'borde'){
        const t = causa.t;
        clave = 'borde|' + sig(t.por);
        base = { tipo: 'borde', A: t.por, pos: [t.x, t.y] };
      } else if (causa.tipo === 'clic'){
        clave = 'clic|' + sig(causa.ev.obj);
        base = { tipo: 'clic', A: causa.ev.obj, Aclon: causa.ev.clon, disfraz: causa.ev.disfraz };
      } else if (causa.tipo === 'suelta'){
        clave = 'suelta|' + sig(causa.ev.obj) + '|' + Math.round(causa.ev.hasta[0] / 40) + ',' + Math.round(causa.ev.hasta[1] / 40);
        base = { tipo: 'suelta', A: causa.ev.obj, hasta: causa.ev.hasta, disfraz: causa.ev.disfraz };
      } else if (causa.tipo === 'respuesta'){
        clave = 'respuesta@' + causa.ep.f;
        base = { tipo: 'respuesta', q: causa.ep.pregunta, a: causa.ep.texto, ep: causa.ep };
      } else { clave = 'tiempo'; base = { tipo: 'tiempo' }; }
      anadir(reglas, clave, base, e, causa.t || causa.ev || causa.ep || { f });
      if (causa.tipo === 'toca' && causa.t){ const r = reglas.get(clave); r.Bs = r.Bs || new Set(); r.As = r.As || new Set(); const giro = sig(causa.t.por) !== sig(r.A); (giro ? r.Bs : r.As).add(causa.t.por); (giro ? r.As : r.Bs).add(causa.t.que); }
    }
    // c) Avisos y finales que siguen a un cambio de variable (condición)
    if (['stop','fondo','muestra','dice','oculta','sonido'].includes(e.tipo)){
      const v = vars.filter(x => x.f <= f && x.f >= f - 30 && !enInicio(x.f)).pop();
      if (v) anadir(condiciones, 'cond|' + v.nombre + '|' + norm(v.despues), { tipo: 'condicion', var: v.nombre, valor: v.despues, antes: v.antes }, e, { f: v.f });
    }
  }
  // Respuestas con el mismo tipo de efecto (acierto / fallo) forman una sola regla
  const firmaResp = r => { const ef = efectosDe(r.efectos, x => x); return (claseRespuesta({ q: r.q, a: r.a }, ef) || 'x') + '|' + plantilla(r.q).replace(/[a-z]+/g, '') + '|' + ef.filter(d => d.t === 'dice').map(d => plantilla(d.texto)).sort().join(';') + '|' + ef.filter(d => d.t === 'var' && esNum(d.despues) && valorIgual(d.despues, r.a)).map(d => d.k).join(','); };
  const grupos = new Map();
  for (const [k, r] of [...reglas.entries()]){
    if (r.tipo !== 'respuesta') continue;
    reglas.delete(k);
    const fz = firmaResp(r);
    if (!grupos.has(fz)) grupos.set(fz, { tipo: 'respuesta', q: r.q, a: r.a, eps: [], efectos: [], episodios: [] });
    const g = grupos.get(fz);
    g.eps.push({ q: r.q, a: r.a }); g.efectos.push(...r.efectos); g.episodios.push(r.ep);
  }
  for (const [fz, g] of grupos) reglas.set('respuesta|' + fz, g);
  // Preguntas: qué provoca cada pregunta (para poder repetirla)
  const causaPregunta = new Map();
  for (const p of preguntas){
    const r = [...reglas.values()].find(x => x.tipo !== 'respuesta' && x.efectos.includes(p));
    causaPregunta.set(p.f, r ? r : (enInicio(p.f) ? { tipo: 'inicio' } : { tipo: 'tiempo' }));
  }
  return { reglas: [...reglas.values()], condiciones: [...condiciones.values()], causaPregunta, preguntas, respuestas };
}

/* Traduce una regla del modelo a nombres del juego que se prueba. */
function causaPara(regla, nombre){
  const c = { ...regla.causa };
  for (const k of ['A', 'B', 'sobre']) if (c[k]) c[k] = nombre(c[k]);
  return c;
}

/* -------------------------------------------------------------------------
   5. PREGUNTAS Y RESPUESTAS
   ------------------------------------------------------------------------- */
function resolverCuenta(q){
  const m = String(q).replace(/[¿?=]/g, ' ').match(/(-?\d+(?:[.,]\d+)?)\s*([+\-−x×*\/÷:])\s*(-?\d+(?:[.,]\d+)?)/);
  if (!m) return null;
  const a = parseFloat(m[1].replace(',', '.')), b = parseFloat(m[3].replace(',', '.'));
  switch (m[2]){ case '+': return a + b; case '-': case '−': return a - b; case 'x': case '×': case '*': return a * b; case '/': case '÷': case ':': return b ? a / b : null; }
  return null;
}
function claseRespuesta(ep, efectos){
  const v = resolverCuenta(ep.q);
  if (v !== null && esNum(ep.a)) return Math.abs(Number(ep.a) - v) < 1e-6 ? 'bien' : 'mal';
  const textos = efectos.filter(d => d.t === 'dice').map(d => norm(d.texto)).join(' ');
  if (/incorrect|mal|error|fallo|equivoc|noes/.test(textos)) return 'mal';
  if (/correct|bien|acert|genial|perfect/.test(textos)) return 'bien';
  const dv = efectos.find(d => d.t === 'var' && d.d && Math.abs(d.d) <= 2 && !valorIgual(d.despues, ep.a));
  if (dv) return dv.d > 0 ? 'bien' : 'mal';
  return null;
}
/* Llega hasta la pregunta y la responde. tabla: plantilla → respuesta del profesor. */
async function pruebaRespuesta(buf, regla, nombre, tabla, respuestaForzada){
  await arrancar(buf);
  const cp = regla.causaPregunta;
  if (!motor.pregunta && cp && cp.tipo !== 'inicio' && cp.tipo !== 'tiempo' && cp.causa){
    await provocar(causaPara(cp, nombre), 5);
  }
  for (let i = 0; i < 150 && !motor.pregunta; i++) await motor.correr(1);
  for (let n = 0; n < 5 && motor.pregunta; n++){
    const q = motor.pregunta.texto;
    const eps = regla.causa.eps || [{ q: regla.causa.q, a: regla.causa.a }];
    const objetivo = eps.some(x => plantilla(x.q) === plantilla(q)) || !tabla.has(plantilla(q)) || regla.clase === 'mal' || n === 4;
    if (!objetivo){ motor.responder(tabla.get(plantilla(q))); for (let i = 0; i < 240 && !motor.pregunta; i++) await motor.correr(1); continue; }
    let r = respuestaForzada;
    if (r === undefined){
      const exacta = eps.find(x => norm(x.q) === norm(q));
      if (exacta) r = exacta.a;
      else {
        const v = resolverCuenta(q);
        if (v !== null && regla.clase) r = String(regla.clase === 'bien' ? v : v + 1);
        else if (regla.clase === 'mal') r = 'zzz';
        else r = regla.causa.a;
      }
    }
    const d0 = motor.eventos.length, ini = posiciones();
    motor.responder(r);
    await motor.correr(75);
    return { ok: true, evs: motor.eventos.slice(d0), ini, q, r, fin: posiciones() };
  }
  return { ok: false, nota: 'el juego no hace la pregunta' };
}

/* -------------------------------------------------------------------------
   6. ESTADO AL EMPEZAR (con "trampas": se cambia todo antes de la bandera
      para ver qué deja el programa en su sitio)
   ------------------------------------------------------------------------- */
async function estadoInicial(buf, trampa){
  await motor.cargar(buf);
  const guardado = JSON.parse(JSON.stringify(motor.estado().spr));
  if (trampa){
    for (const t of motor.rt.targets){
      if (!t.isOriginal) continue;
      for (const v of Object.values(t.variables)){ if (v.type === '') v.value = 99; else if (v.type === 'list') v.value = ['zz']; }
      if (t.isStage){ const n = t.getCostumes().length; if (n > 1) t.setCostume((t.currentCostume + 1) % n); continue; }
      t.setXY(Math.max(-200, Math.min(200, t.x + 47)), Math.max(-150, Math.min(150, t.y + 33)));
      t.setVisible(!t.visible);
      const n = t.getCostumes().length; if (n > 1) t.setCostume((t.currentCostume + 1) % n);
    }
    motor.sincronizar();
  }
  motor.bandera();
  await motor.correr(INICIO);
  const s = motor.estado();
  const evs = motor.eventos.filter(e => e.tipo === 'dice' || e.tipo === 'pregunta');
  return { guardado, vars: s.vars, listas: s.listas, fondoIdx: s.fondoIdx, fondo: s.fondo, spr: JSON.parse(JSON.stringify(s.spr)), dice: evs.filter(e => e.tipo === 'dice' && !e.preg).map(e => ({ obj: e.obj, texto: e.texto })), pregunta: evs.filter(e => e.tipo === 'pregunta').map(e => e.texto)[0] || null };
}

/* -------------------------------------------------------------------------
   7. CATÁLOGO: se construyen los criterios a partir de la partida
   ------------------------------------------------------------------------- */
const FAMILIAS = {
  inicio: 'Inicio', posiciones: 'Inicio', controles: 'Controles', movimiento: 'Movimiento', clones: 'Clones', anim: 'Animación',
  tiempo: 'Tiempo', regla: 'Choques', clic: 'Ratón', suelta: 'Ratón', respuesta: 'Preguntas', fin: 'Final', partida: 'Partida'
};

async function analizar(buf, grab, progreso){
  const crit = [];
  await motor.cargar(buf);
  const info = infoSprites();
  const firmas = Object.fromEntries(info.map(i => [i.n, i.sig]));

  progreso('Mirando qué hace tu juego si nadie lo toca…');
  const perfil = await perfilEspontaneo(buf);
  const azar = await estudiarAzar(buf, grab, progreso);

  // --- Controles
  const gestos = gestosDe(grab);
  const ctrl = [];
  for (const g of gestos){
    progreso('Comprobando en tu juego: ' + nombreGesto(g) + '…');
    const ef = marcarAzar(await correrGesto(buf, g, { variar: true }), azar);
    if (ef.length) ctrl.push({ g, ef });
  }
  const mov = {}; for (const c of ctrl) if (c.g.tipo === 'tecla') for (const d of c.ef) if (d.t === 'mueve') mov[d.obj] = (mov[d.obj] || 0) + Math.hypot(d.dx, d.dy);
  let jugador = Object.keys(mov).sort((a, b) => mov[b] - mov[a])[0] || null;
  if (!jugador){ const m2 = {}; for (const c of ctrl) for (const d of c.ef) if (d.obj && ['mueve','gira'].includes(d.t)) m2[d.obj] = (m2[d.obj] || 0) + 1; jugador = Object.keys(m2).sort((a, b) => m2[b] - m2[a])[0] || null; }
  if (ctrl.length){
    crit.push({ id: 'controles', tipo: 'controles', on: true, imp: 'medio', valido: true,
      titulo: 'Controles: ' + ctrl.map(c => nombreGesto(c.g).replace('Tecla ', '')).join(', '),
      detalle: ctrl.map(c => nombreGesto(c.g) + ': ' + c.ef.map(d => textoEf(d)).join(', ')),
      esperado: { gestos: ctrl, jugador } });
  }
  const sinEfecto = gestos.filter(g => !ctrl.some(c => c.g === g));

  // --- Estado inicial
  progreso('Comprobando cómo empieza tu juego…');
  const normal = await estadoInicial(buf, false);
  const trampa = await estadoInicial(buf, true);
  let normal2; { const sem = motor.semilla; motor.semilla = 777; try { normal2 = await estadoInicial(buf, false); } finally { motor.semilla = sem; } }
  const iniVars = [], iniListas = [], iniSpr = [];
  for (const k in trampa.vars){ if (k.endsWith(' (lista)')) continue; if (String(trampa.vars[k]) === String(normal.vars[k]) && String(normal2.vars[k]) === String(normal.vars[k]) && !(esNum(trampa.vars[k]) && Number(trampa.vars[k]) === 99)) iniVars.push([k, normal.vars[k]]); }
  for (const k in trampa.listas){ if (JSON.stringify(trampa.listas[k]) === JSON.stringify(normal.listas[k]) && !(trampa.listas[k].length === 1 && trampa.listas[k][0] === 'zz')) iniListas.push([k, normal.listas[k]]); }
  const fondoFijo = trampa.fondoIdx === normal.fondoIdx && motor.stage().getCostumes().length > 1;
  for (const n in trampa.spr){
    const a = normal.spr[n], b = trampa.spr[n]; if (!a || !b) continue;
    const it = { n }; const a2 = normal2.spr[n] || a;
    const mueve = perfil.movers.includes(n), animado = perfil.anim[n] && perfil.anim[n].disfraz;
    if (dist([a.x, a.y], [b.x, b.y]) < 2 && dist([a.x, a.y], [a2.x, a2.y]) < 2 && !mueve) it.pos = [a.x, a.y];
    const cambiaVis = (normal.guardado[n] && normal.guardado[n].vis !== a.vis) || grab.eventos.some(e => (e.tipo === 'muestra' || e.tipo === 'oculta') && e.obj === n && e.f > 5);
    if (a.vis === b.vis && a.vis === a2.vis && cambiaVis) it.vis = a.vis;
    if (a.disfraz === b.disfraz && a.disfraz === a2.disfraz && !animado && info.find(i => i.n === n).disfraces.length > 1) it.disfraz = a.disfraz;
    if (it.pos || it.vis !== undefined || it.disfraz) iniSpr.push(it);
  }
  const textoIni = d => (azar.textos.includes(plantilla(d.texto)) || (normal2.dice.length > 0 && !normal2.dice.some(x => x.texto === d.texto))) ? conAzar(d.texto) : d.texto;
  const partesIni = [...iniVars.map(([k, v]) => nombreVar(k) + ' = ' + v), ...iniListas.map(([k, v]) => 'lista ' + nombreVar(k) + ' (' + v.length + ' elementos)'), fondoFijo ? 'fondo «' + normal.fondo + '»' : null, ...normal.dice.map(d => '«' + d.obj + '» dice «' + textoIni(d) + '»'), normal.pregunta ? 'hace una pregunta' : null].filter(Boolean);
  if (partesIni.length) crit.push({ id: 'inicio', tipo: 'inicio', on: true, imp: 'medio', valido: true, titulo: 'Al empezar: ' + partesIni.join(', '),
    esperado: { vars: iniVars, listas: iniListas, fondo: fondoFijo ? { idx: normal.fondoIdx, nombre: normal.fondo } : null, dice: normal.dice.map(d => ({ ...d, azar: azar.textos.includes(plantilla(d.texto)) || (normal2.dice.length > 0 && !normal2.dice.some(x => x.texto === d.texto)) })), pregunta: normal.pregunta } });
  if (iniSpr.length) crit.push({ id: 'posiciones', tipo: 'posiciones', on: true, imp: 'bajo', valido: true,
    titulo: 'Al empezar, cada objeto en su sitio: ' + iniSpr.map(i => i.n).join(', '),
    detalle: iniSpr.map(i => '«' + i.n + '»: ' + [i.pos ? 'en (' + Math.round(i.pos[0]) + ', ' + Math.round(i.pos[1]) + ')' : null, i.vis !== undefined ? (i.vis ? 'visible' : 'escondido') : null, i.disfraz ? 'disfraz «' + i.disfraz + '»' : null].filter(Boolean).join(', ')),
    esperado: { items: iniSpr } });

  // --- Comportamiento espontáneo
  const movers = perfil.movers.filter(n => n !== jugador);
  if (movers.length) crit.push({ id: 'movimiento', tipo: 'movimiento', on: true, imp: 'medio', valido: true,
    titulo: 'Se mueven solos: ' + movers.join(', '), esperado: { movers, firmas: movers.map(n => firmas[n]) } });
  for (const g in perfil.clones){
    const c = perfil.clones[g]; if (!c.creados) continue;
    const ritmo = c.creados / (perfil.frames / FPS);
    crit.push({ id: 'clones-' + g, tipo: 'clones', on: true, imp: 'medio', valido: true,
      titulo: 'Crea clones de «' + g + '» (unos ' + fmtN(ritmo * 10) + ' cada 10 s)' + (c.mueven ? ' que se mueven' : '') + (c.borrados ? ' y desaparecen' : ''),
      esperado: { obj: g, sig: firmas[g], ritmo, mueven: c.mueven, borrados: c.borrados > 0 } });
  }
  const gruposAnim = new Map();
  for (const [g, a] of Object.entries(perfil.anim)){
    const sg = firmas[g] || g;
    if (!gruposAnim.has(sg)) gruposAnim.set(sg, { objs: [], sig: firmas[g], disfraz: false, tam: false, gira: false });
    const it = gruposAnim.get(sg); it.objs.push(g); it.disfraz = it.disfraz || a.disfraz; it.tam = it.tam || a.tam; it.gira = it.gira || a.gira;
  }
  const anim = [...gruposAnim.values()];
  const nomGrupo = it => '«' + it.objs[0] + '»' + (it.objs.length > 1 ? ' y ' + (it.objs.length - 1) + ' más' : '');
  if (anim.length) crit.push({ id: 'anim', tipo: 'anim', on: true, imp: 'bajo', valido: true,
    titulo: 'Animaciones: ' + anim.map(it => nomGrupo(it) + ' ' + [it.disfraz ? 'cambia de disfraz' : null, it.tam ? 'cambia de tamaño' : null, it.gira ? 'gira' : null].filter(Boolean).join(' y ')).join('; '),
    esperado: { items: anim } });
  for (const k in perfil.vars){
    const v = perfil.vars[k]; if (v.n < 2) continue;
    const deltas = Object.keys(v.deltas); const una = deltas.length === 1 && deltas[0] !== 'c' ? Number(deltas[0]) : null;
    const cada = (perfil.frames / FPS) / v.n;
    crit.push({ id: 'tiempo-' + k, tipo: 'tiempo', on: true, imp: 'medio', valido: true,
      titulo: 'Con el tiempo: ' + nombreVar(k) + (una !== null ? ' ' + fmtDelta(una) : ' cambia') + ' cada ' + fmtN(cada) + ' s más o menos',
      esperado: { var: k, delta: una, veces: v.n, frames: perfil.frames } });
  }

  // --- Reglas causa → efecto
  progreso('Buscando qué provoca cada cosa en tu partida…');
  const an = analizarCausas(grab, perfil, jugador, firmas);
  const tabla = new Map(); for (const r of an.respuestas) if (!tabla.has(plantilla(r.pregunta))) tabla.set(plantilla(r.pregunta), r.texto);
  const nombreIgual = n => n;
  let i = 0;
  for (const r of an.reglas){
    i++;
    const efRec = efectosDe(r.efectos, x => x);
    const base = { causa: { tipo: r.tipo, A: r.A, B: r.B, color: r.color, pos: r.pos, sobre: r.sobre, off: r.off, sobreDisfraz: r.sobreDisfraz, disfraz: r.disfraz, hasta: r.hasta, q: r.q, a: r.a, eps: r.eps, Aclon: r.Aclon } };
    let cand = [null];
    let lado = 'B';
    if (r.tipo === 'toca'){
      const sigB = new Set([...(r.Bs || [r.B])].map(n => firmas[n] || n));
      const sigA = new Set([...(r.As || [r.A])].map(n => firmas[n] || n));
      const candB = info.filter(x => sigB.has(x.sig) && x.n !== r.A).map(x => x.n);
      const candA = info.filter(x => sigA.has(x.sig) && x.n !== r.B && x.n !== jugador).map(x => x.n);
      if (r.A !== jugador && candA.length > 1 && candB.length <= 1){ lado = 'A'; cand = candA; }
      else cand = candB.length ? candB : [r.B];
    }
    const regla = { ...base, candidatos: cand, lado };
    if (r.tipo === 'respuesta' && formaAzar(r.q, azar)){ regla.qAzar = true; regla.qForma = formaAzar(r.q, azar); }
    if (r.tipo === 'respuesta'){
      const ep = r.episodios[0];
      const p = an.preguntas.filter(x => x.f <= ep.f).pop();
      const cp = p ? an.causaPregunta.get(p.f) : null;
      regla.causaPregunta = cp && cp.tipo !== 'inicio' && cp.tipo !== 'tiempo' ? { tipo: cp.tipo, causa: { tipo: cp.tipo, A: cp.A, B: cp.B, color: cp.color, pos: cp.pos, sobre: cp.sobre, off: cp.off, disfraz: cp.disfraz, hasta: cp.hasta } } : { tipo: cp ? cp.tipo : 'inicio' };
      const clases = r.eps.map(x => claseRespuesta(x, efRec)).filter(Boolean);
      regla.clase = clases.length ? (clases.filter(x => x === 'bien').length >= clases.length / 2 ? 'bien' : 'mal') : null;
    }
    const desc = describirCausa(regla, jugador);
    progreso('Comprobando en tu juego: ' + sinHtml(desc) + '…');
    const porCand = []; const azar1 = {};
    for (const cn of cand){
      let res;
      if (r.tipo === 'respuesta') res = await pruebaRespuesta(buf, regla, nombreIgual, tabla);
      else { await arrancar(buf); const c = causaPara(regla, nombreIgual); if (cn) c[lado] = cn; if (r.tipo === 'clic'){ c.tipos = [...new Set(efRec.map(d => d.t === 'stop' ? 'stop' : d.t))]; c.vars = efRec.filter(d => d.t === 'var').map(d => d.k); } res = await provocar(c); }
      if (!res.ok){ porCand.push({ donde: cn, ok: false }); continue; }
      const rol = rolDe(res.A || r.A, res.B || r.B, jugador);
      const ini = res.ini;
      const obt = efectosDe(sinEspontaneos(res.evs, perfil, [res.A, res.B]), rol, ini);
      if (r.tipo === 'respuesta' && res.fin) for (const n in res.fin){ const a = res.ini[n], b = res.fin[n]; if (a && b && !perfil.movers.includes(n) && dist(a, b) >= 10) obt.push({ t: 'mueve', obj: rol(n), dx: b[0] - a[0], dy: b[1] - a[1] }); }
      // Solo cuenta lo que también pasó en la partida grabada (o movimientos de una respuesta)
      const recRol = efectosDe(r.efectos, rolDe(r.A, r.B, jugador));
      const esperados = obt.filter(d => d.t === 'mueve' || recRol.some(x => mismoTipoEf(x, d)) || (d.t === 'salta' && recRol.some(x => x.t === 'salta')));
      if (r.tipo === 'respuesta') for (const d of esperados) if (d.t === 'var' && d.d !== null && (Math.abs(d.d) > 2 || valorIgual(d.despues, res.r))){ d.v = d.despues; d.d = null; d.deRespuesta = true; }
      marcarAzar(esperados, azar);
      // Variables con valores al azar: solo se exige que cambien
      for (const d of esperados) if (d.t === 'var' && !(r.tipo === 'respuesta' && d.v !== null && d.v !== undefined)){
        const ds = new Set(r.efectos.filter(e => e.tipo === 'var' && e.nombre === d.k).map(e => String(deltaDe(e))));
        if (ds.size > 1){ d.d = null; d.v = null; d.cambia = true; }
      }
      if (esperados.some(d => d.t === 'var' && !d.cambia) && r.tipo !== 'respuesta' && !porCand.length){
        const sem = motor.semilla; motor.semilla = 777;
        try {
          await arrancar(buf); const c2 = causaPara(regla, nombreIgual); if (cn) c2[lado] = cn;
          const res2 = await provocar(c2);
          if (res2.ok){
            const obt2 = efectosDe(sinEspontaneos(res2.evs, perfil, [res2.A, res2.B]), rolDe(res2.A || r.A, res2.B || r.B, jugador), res2.ini);
            const fus = fusionarAzar(esperados.filter(d => d.t === 'var'), obt2.filter(d => d.t === 'var'));
            for (let q = esperados.length - 1; q >= 0; q--) if (esperados[q].t === 'var'){ const f2 = fus.find(x => x.k === esperados[q].k); if (f2){ esperados[q] = f2; azar1[f2.k] = f2; } else { azar1[esperados[q].k] = null; esperados.splice(q, 1); } }
          }
        } finally { motor.semilla = sem; }
      }
      if (porCand.length) for (let q = esperados.length - 1; q >= 0; q--){ const d = esperados[q]; if (d.t === 'var' && d.k in azar1){ if (azar1[d.k]) esperados[q] = azar1[d.k]; else esperados.splice(q, 1); } }
      porCand.push({ donde: cn, ok: esperados.length > 0, ef: esperados });
    }
    const validos = porCand.filter(x => x.ok);
    if (r.tipo === 'toca' && validos.length && validos.some(v => v.donde)) regla.candidatos = validos.map(v => v.donde).filter(Boolean);
    const efUnion = []; for (const c of validos) for (const d of c.ef) if (!efUnion.some(x => claveEf(x) === claveEf(d))) efUnion.push(d);
    const familia = r.tipo === 'clic' ? 'clic' : r.tipo === 'suelta' ? 'suelta' : r.tipo === 'respuesta' ? 'respuesta' : r.tipo === 'tiempo' ? 'tiempo' : 'regla';
    if (!validos.length && (r.tipo === 'tiempo' || efRec.every(d => ['stop', 'fondo', 'muestra', 'sonido', 'salta'].includes(d.t)))) continue;
    const ctxT = { A: r.A, B: cand.length > 1 && lado === 'B' ? cand[0] + ' (o parecidos)' : (lado === 'B' ? (cand[0] || r.B) : r.B), J: jugador, Agen: lado === 'A' && cand.length > 1 ? 'el que toca' : null };
    crit.push({ id: 'regla' + i, tipo: 'regla', familia, on: validos.length > 0, imp: 'medio', valido: validos.length > 0,
      titulo: describirCausa(regla, jugador) + ' → ' + (efUnion.length ? efUnion.map(d => textoEf(d, ctxT)).join(', ') : efRec.map(d => textoEf(d)).join(', ')),
      esperado: { regla, jugador, porCand: validos, nCand: r.tipo === 'toca' ? regla.candidatos.length : 1 } });
  }
  for (let q = crit.length - 1; q >= 0; q--){
    const c = crit[q]; if (c.tipo !== 'regla' || c.valido) continue;
    const C = c.esperado.regla.causa;
    if (crit.some(o => o !== c && o.tipo === 'regla' && o.valido && o.esperado.regla.causa.tipo === C.tipo && o.esperado.regla.causa.A === C.A && (o.esperado.regla.causa.color || '') === (C.color || ''))) crit.splice(q, 1);
  }
  // Finales y avisos que dependen del valor de una variable
  let j = 0;
  for (const c of an.condiciones){
    j++;
    const regla = { causa: { tipo: 'condicion', var: c.var, valor: c.valor, antes: c.antes } };
    progreso('Comprobando en tu juego: cuando ' + nombreVar(c.var) + ' llega a ' + c.valor + '…');
    await arrancar(buf);
    const res = await provocar(regla.causa);
    if (!res.ok) continue;
    const rol = rolDe(null, null, jugador);
    const obt = efectosDe(res.evs.filter(e => !esEspontaneo(perfil, e) && e.tipo !== 'var'), rol, res.ini);
    const rec = efectosDe(c.efectos, rol);
    const esperados = marcarAzar(obt.filter(d => rec.some(x => mismoTipoEf(x, d)) || (d.t === 'stop')), azar);
    if (!esperados.length || !esperados.some(d => d.t !== 'sonido')) continue;
    if (crit.some(x => x.tipo === 'fin' && x.esperado.regla.causa.var === c.var && valorIgual(x.esperado.regla.causa.valor, c.valor))) continue;
    crit.push({ id: 'fin' + j, tipo: 'fin', familia: 'fin', on: true, imp: 'medio', valido: true,
      titulo: 'Cuando ' + nombreVar(c.var) + ' llega a ' + c.valor + ' → ' + esperados.map(d => textoEf(d, { J: jugador })).join(', '),
      esperado: { regla, efectos: esperados, jugador } });
  }

  progreso('Repitiendo tu partida para la comparación tecla a tecla…');
  const partida = await pruebaPartida(buf, grab);
  crit.push({ id: 'partida', tipo: 'partida', on: false, imp: 'bajo', valido: partida.length > 0,
    titulo: 'Repetir tu partida tecla a tecla (solo si los juegos deben ser idénticos)', esperado: { eventos: partida } });

  // Orden: inicio, controles, movimiento, clones, animación, tiempo, reglas, final, partida
  const orden = ['inicio', 'posiciones', 'controles', 'movimiento', 'clones', 'anim', 'tiempo', 'regla', 'fin', 'partida'];
  crit.sort((a, b) => orden.indexOf(a.tipo) - orden.indexOf(b.tipo));
  return { crit, sinEfecto: sinEfecto.map(nombreGesto), info, tabla: [...tabla.entries()], azar };
}
function rolDe(A, B, J){ return n => n === J ? '@J' : n === A ? '@A' : n === B ? '@B' : n; }
function mismoTipoEf(a, b){
  if (a.t !== b.t) return false;
  if (a.t === 'var') return a.k === b.k;
  if (['muestra', 'oculta', 'borra_clon', 'salta', 'sonido'].includes(a.t)) return a.obj === b.obj;
  if (a.t === 'dice') return parecido(a.texto, b.texto) >= 0.5;
  return true;
}
function describirCausa(regla, jugador){
  const c = regla.causa;
  const q = n => '«' + n + '»';
  const quien = (n, clon) => n === jugador ? q(n) : (clon ? 'un clon de ' + q(n) : q(n));
  switch (c.tipo){
    case 'toca': {
      const cs = regla.candidatos && regla.candidatos.filter(Boolean);
      const lista = l => l.length > 3 ? l.slice(0, 2).map(q).join(', ') + ' y ' + (l.length - 2) + ' más' : l.map(q).join(', ');
      if (regla.lado === 'A' && cs && cs.length > 1) return 'Cuando ' + lista(cs) + ' tocan a ' + q(c.B);
      const otros = cs && cs.length > 1 ? 'a ' + lista(cs) : 'a ' + q(c.B); return 'Cuando ' + quien(c.A, c.Aclon) + ' toca ' + otros; }
    case 'color': {
      const col = '<span class="muestra" style="background:' + c.color + '"></span>' + c.color;
      if (c.sobre && c.sobre === c.A) return 'Cuando ' + quien(c.A, c.Aclon) + ' toca otro «' + c.A + '» del color ' + col;
      return 'Cuando ' + quien(c.A, c.Aclon) + ' toca el color ' + col + (c.sobre ? ' de ' + q(c.sobre) : '');
    }
    case 'borde': return 'Cuando ' + q(c.A) + ' toca el borde';
    case 'clic': return 'Al hacer clic en ' + quien(c.A, c.Aclon);
    case 'suelta': return 'Al arrastrar ' + quien(c.A, true) + (c.disfraz ? ' (disfraz «' + c.disfraz + '»)' : '') + ' hasta (' + Math.round(c.hasta[0]) + ', ' + Math.round(c.hasta[1]) + ')';
    case 'respuesta': {
      const q = regla.qAzar ? '«' + (regla.qForma || conAzar(c.q)) + '» (' + ((regla.qForma || '').includes('…') ? 'cambia al azar' : 'números al azar') + ')' : '«' + c.q + '»';
      return regla.clase === 'bien' ? 'Al responder bien a ' + q : regla.clase === 'mal' ? 'Al responder mal a ' + q : 'Al responder «' + c.a + '» a ' + q;
    }
    case 'tiempo': return 'Con el tiempo, sin hacer nada';
    case 'condicion': return 'Cuando ' + nombreVar(c.var) + ' llega a ' + c.valor;
  }
  return c.tipo;
}

/* Repetir la partida del profesor tal cual. */
async function pruebaPartida(buf, grab){
  await motor.cargar(buf);
  const entradas = grab.entradas.map(e => ({ ...e }));
  await motor.correr(grab.frames, entradas);
  return motor.eventos.filter(e => e.tipo === 'var').map(e => ({ f: e.f, nombre: e.nombre, antes: e.antes, despues: e.despues }));
}

/* -------------------------------------------------------------------------
   8. CORRECCIÓN DE UN ALUMNO
   ------------------------------------------------------------------------- */
function mapearSprites(modelo, alumno){
  const m = new Map(); const usados = new Set();
  const intenta = (crit) => { for (const a of modelo){ if (m.has(a.n)) continue; const b = alumno.find(x => !usados.has(x.n) && crit(a, x)); if (b){ m.set(a.n, b.n); usados.add(b.n); } } };
  intenta((a, b) => a.n === b.n);
  intenta((a, b) => normNombre(a.n) === normNombre(b.n));
  intenta((a, b) => a.sig === b.sig);
  intenta((a, b) => baseNombre(a.n) && baseNombre(a.n) === baseNombre(b.n));
  return m;
}

async function corregirAlumno(buf, datos, grab, avisar){
  const { crit, info: infoModelo, tabla: tablaArr } = datos;
  const tabla = new Map(tablaArr || []);
  const out = {};
  await motor.cargar(buf);
  const info = infoSprites();
  const firmasA = Object.fromEntries(info.map(i => [i.n, i.sig]));
  const mapa = mapearSprites(infoModelo, info);              // modelo → alumno
  const inverso = new Map([...mapa.entries()].map(([a, b]) => [b, a]));
  const nombre = n => mapa.get(n) || n;
  const delModelo = n => inverso.get(n) || n;
  const mapaVars = {};
  const ctxVar = {
    mapaVar: (k, claves) => { if (mapaVars[k] && claves.includes(mapaVars[k])) return mapaVars[k]; const n = normNombre(nombreVar(k)); return claves.find(c => c === k) || claves.find(c => normNombre(nombreVar(c)) === n) || null; },
    aprender: (k, ka) => { if (!mapaVars[k]) mapaVars[k] = ka; }
  };
  const sigModelo = n => (infoModelo.find(i => i.n === n) || {}).sig;
  // Objetos del alumno equivalentes a uno del modelo
  const equivalentes = (n) => {
    if (mapa.has(n)) return [mapa.get(n)];
    const s = sigModelo(n); const usados = new Set(mapa.values());
    const r = info.filter(i => !usados.has(i.n) && ((s && i.sig === s) || baseNombre(i.n) === baseNombre(n))).map(i => i.n);
    return [...new Set(r)];
  };

  avisar('comportamiento');
  const perfil = await perfilEspontaneo(buf);

  // Controles
  const cCtrl = crit.find(c => c.tipo === 'controles');
  let jugador = null;
  if (cCtrl){
    avisar('controles');
    const det = []; let suma = 0, n = 0; const mov = {};
    for (const { g, ef } of cCtrl.esperado.gestos){
      const obt = await correrGesto(buf, g);
      for (const d of obt) if (d.t === 'mueve' && g.tipo === 'tecla') mov[d.obj] = (mov[d.obj] || 0) + Math.hypot(d.dx, d.dy);
      let p = 0, max = 0; const lineas = [];
      const pesoG = e => e.t === 'gira' && ef.some(x => x.t === 'mueve' && x.obj === e.obj) ? 0.5 : e.t === 'mueve' ? 2 : pesoEf(e);
      for (const e of ef){
        max += pesoG(e);
        let ok = false, visto = null;
        if (e.t === 'mueve'){
          const cand = obt.filter(x => x.t === 'mueve').sort((a, b) => (a.obj === nombre(e.obj) ? -1 : 0) - (b.obj === nombre(e.obj) ? -1 : 0));
          for (const x of cand){ const me = Math.hypot(e.dx, e.dy), mx = Math.hypot(x.dx, x.dy); const cos = (e.dx * x.dx + e.dy * x.dy) / (me * mx || 1); if (cos > 0.7 && mx >= me * 0.4 && mx <= me * 2.5 && (!e.alRaton || x.alRaton)){ ok = true; visto = x; break; } }
          if (!ok) visto = cand[0];
        } else if (e.t === 'gira'){ visto = obt.find(x => x.t === 'gira' && x.s === e.s && (x.obj === nombre(e.obj) || true)); ok = !!visto; }
        else if (['clon', 'disfraz', 'muestra', 'oculta'].includes(e.t)){ visto = obt.find(x => x.t === e.t && (x.obj === nombre(e.obj) || equivalentes(e.obj).includes(x.obj))) || obt.find(x => x.t === e.t); ok = !!visto; }
        else { const r = buscarEfecto(e, obt, ctxVar); ok = r.ok; visto = r.visto; }
        if (ok) p += pesoG(e);
        lineas.push({ ok, t: nombreGesto(g) + ': ' + (ok ? textoEf(visto || e) : textoEf(e) + ' — no pasa' + (visto ? ' (' + textoEf(visto) + ')' : '')) });
      }
      det.push(...lineas); suma += max ? p / max : 0; n++;
    }
    jugador = Object.keys(mov).sort((a, b) => mov[b] - mov[a])[0] || nombre(cCtrl.esperado.jugador) || null;
    out.controles = { nota: n ? 10 * suma / n : 0, det, extra: jugador ? 'Objeto que maneja el jugador: «' + jugador + '»' : '' };
  } else jugador = null;
  const jugModelo = (cCtrl && cCtrl.esperado.jugador) || (crit.find(c => c.esperado && c.esperado.jugador) || { esperado: {} }).esperado.jugador || null;
  if (!jugador && jugModelo) jugador = nombre(jugModelo);
  const nombreJ = n => n === jugModelo && jugador ? jugador : nombre(n);

  // Reglas (choques, ratón, preguntas, tiempo)
  for (const c of crit.filter(c => c.tipo === 'regla' && c.valido)){
    avisar(sinHtml(c.titulo).slice(0, 80));
    const R = c.esperado.regla; const det = []; let suma = 0;
    const lado = R.lado || 'B', otroLado = lado === 'A' ? 'B' : 'A';
    const cand = R.causa.tipo === 'toca' ? (() => { const l = new Set(); for (const b of R.candidatos) for (const x of equivalentes(b)) l.add(x); for (const x of [...l]) if (x === nombreJ(R.causa[otroLado]) || (lado === 'A' && x === jugador)) l.delete(x); return [...l]; })() : [null];
    if (R.causa.tipo === 'toca' && !cand.length){ out[c.id] = { nota: 0, det: [{ ok: false, t: 'No hay objetos equivalentes a ' + R.candidatos.join(', ') + '.' }] }; continue; }
    const esperadosUnion = []; for (const pc of c.esperado.porCand) for (const d of pc.ef) if (!esperadosUnion.some(x => claveEf(x) === claveEf(d))) esperadosUnion.push(d);
    let probados = 0;
    for (const cn of cand){
      let res;
      if (R.causa.tipo === 'respuesta'){
        res = await pruebaRespuesta(buf, R, nombreJ, tabla);
        // Si no se acierta con la respuesta del profesor, prueba otras que dio en la partida
        if (res.ok && R.clase === 'bien'){
          const obt0 = efectosDe(res.evs, rolDe(null, null, jugador), res.ini);
          if (!esperadosUnion.every(e => buscarEfecto(e, obt0, ctxVar).ok)){
            const otras = [...new Set([...tabla.values()])].filter(x => norm(x) !== norm(res.r)).slice(0, 6);
            for (const o of otras){ const r2 = await pruebaRespuesta(buf, R, nombreJ, tabla, o); if (r2.ok){ const ob = efectosDe(r2.evs, rolDe(null, null, jugador), r2.ini); if (esperadosUnion.every(e => buscarEfecto(e, ob, ctxVar).ok)){ res = r2; break; } } }
          }
        }
      } else {
        await arrancar(buf);
        const causa = causaPara(R, nombreJ); if (cn) causa[lado] = cn;
        if (causa.A && !motor.sprite(causa.A)){ const eq = equivalentes(R.causa.A); if (eq[0]) causa.A = eq[0]; }
        if (causa.B && !motor.sprite(causa.B)){ const eq = equivalentes(R.causa.B); if (eq[0]) causa.B = eq[0]; }
        if (causa.sobre && !motor.sprite(causa.sobre)){ const eq = equivalentes(R.causa.sobre); causa.sobre = eq[0] || null; }
        if (R.causa.tipo === 'clic'){ causa.tipos = [...new Set(esperadosUnion.map(d => d.t))]; causa.vars = null; }
        res = await provocar(causa);
      }
      probados++;
      const donde = R.causa.tipo === 'toca' ? (lado === 'A' ? '«' + cn + '» toca a «' + nombreJ(R.causa.B) + '»' : 'Tocando «' + cn + '»') : R.causa.tipo === 'respuesta' ? 'Respondiendo «' + (res.r || '') + '»' + (res.q ? ' a «' + res.q + '»' : '') : sinHtml(describirCausa(R, jugModelo));
      if (!res.ok){ det.push({ ok: false, t: donde + ': ' + (res.nota || 'no se pudo probar') }); continue; }
      const rol = rolDe(res.A || nombreJ(R.causa.A), res.B || nombreJ(R.causa.B), jugador);
      const obt = efectosDe(sinEspontaneos(res.evs, perfil, [res.A, res.B]), rol, res.ini);
      if (R.causa.tipo === 'respuesta' && res.fin) for (const nn in res.fin){ const a = res.ini[nn], b = res.fin[nn]; if (a && b && !perfil.movers.includes(nn) && dist(a, b) >= 10) obt.push({ t: 'mueve', obj: rol(nn), dx: b[0] - a[0], dy: b[1] - a[1] }); }
      const esp = (c.esperado.porCand.find(x => x.donde === cn) || c.esperado.porCand[0] || { ef: esperadosUnion }).ef;
      let p = 0, max = 0; const partes = [];
      const ctxT = { A: res.A || R.causa.A, B: res.B || cn, J: jugador };
      for (const e of esp){
        max += pesoEf(e);
        let r;
        if (e.t === 'mueve'){ const x = obt.find(o => o.t === 'mueve' && (o.dx * e.dx + o.dy * e.dy) > 0); r = { ok: !!x, visto: x }; }
        else r = buscarEfecto(mapearEf(e, nombre), obt, ctxVar);
        if (r.ok) p += pesoEf(e);
        if (r.visto && r.visto.t === 'var' && e.t === 'var' && e.v !== null && e.v !== undefined && !e.cambia) r.visto = { ...r.visto, d: null, v: r.visto.despues };
        partes.push({ ok: r.ok, t: (r.ok ? textoEf(r.visto || e, ctxT) + (r.otraVar ? ' (con la variable «' + nombreVar(r.visto.k) + '»)' : '') : 'no ' + textoEf(e, ctxT).replace(/^el juego /, 'el juego ') + (r.visto ? ' (' + textoEf(r.visto, ctxT) + ')' : '')) });
      }
      suma += max ? p / max : 0;
      det.push({ ok: p === max, t: donde + ': ' + partes.map(x => (x.ok ? '' : '✘ ') + x.t).join(', ') });
    }
    let nota = probados ? 10 * suma / probados : 0;
    const n0 = c.esperado.nCand;
    if (R.causa.tipo === 'toca' && n0 > 1 && cand.length < n0){ nota *= cand.length / n0; det.push({ ok: false, t: 'Tiene ' + cand.length + ' objeto(s) de este tipo; tu modelo tiene ' + n0 + '.' }); }
    out[c.id] = { nota, det };
  }

  // Estado inicial
  const cIni = crit.find(c => c.tipo === 'inicio'), cPos = crit.find(c => c.tipo === 'posiciones');
  if (cIni || cPos){
    avisar('inicio');
    const tr = await estadoInicial(buf, true);
    if (cIni){
      const E = cIni.esperado; const det = []; let bien = 0, tot = 0;
      for (const [k, v] of E.vars){
        tot++;
        const ka = ctxVar.mapaVar(k, Object.keys(tr.vars));
        if (!ka){ det.push({ ok: false, t: 'No existe la variable «' + nombreVar(k) + '»' }); continue; }
        const ok = valorIgual(tr.vars[ka], v); if (ok) bien++;
        det.push({ ok, t: nombreVar(ka) + ' = ' + tr.vars[ka] + (ok ? '' : (esNum(tr.vars[ka]) && Number(tr.vars[ka]) === 99 ? ' (no se pone a ' + v + ' al empezar)' : ' (en tu modelo ' + v + ')')) });
      }
      for (const [k, v] of E.listas){
        tot++;
        const ka = Object.keys(tr.listas).find(x => normNombre(nombreVar(x)) === normNombre(nombreVar(k)));
        if (!ka){ det.push({ ok: false, t: 'No existe la lista «' + nombreVar(k) + '»' }); continue; }
        const la = tr.listas[ka].map(norm), lm = v.map(norm);
        const comunes = lm.filter(x => la.includes(x)).length;
        const ok = comunes >= lm.length * 0.9 && la.length >= lm.length * 0.9; if (ok) bien++;
        det.push({ ok, t: 'Lista ' + nombreVar(ka) + ': ' + la.length + ' elementos' + (ok ? '' : (la.length === 1 && la[0] === 'zz' ? ' (no se rellena al empezar)' : ' (' + comunes + ' de ' + lm.length + ' coinciden con tu modelo)')) });
      }
      if (E.fondo){ tot++; const ok = tr.fondoIdx === E.fondo.idx; if (ok) bien++; det.push({ ok, t: 'Fondo al empezar: «' + tr.fondo + '»' + (ok ? '' : ' (en tu modelo «' + E.fondo.nombre + '»)') }); }
      for (const d of E.dice){ tot++; const cmp = (x, y) => d.azar ? parecido(plantilla(x), plantilla(y)) : parecido(x, y); const v = tr.dice.sort((a, b) => cmp(b.texto, d.texto) - cmp(a.texto, d.texto))[0]; const ok = !!v && cmp(v.texto, d.texto) >= 0.6; if (ok) bien++; det.push({ ok, t: ok ? '«' + v.obj + '» dice «' + v.texto + '»' : 'No dice «' + d.texto + '» al empezar' }); }
      if (E.pregunta){ tot++; const ok = !!tr.pregunta; if (ok) bien++; det.push({ ok, t: ok ? 'Pregunta «' + tr.pregunta + '»' : 'No hace ninguna pregunta al empezar' }); }
      out.inicio = { nota: tot ? 10 * bien / tot : 0, det };
    }
    if (cPos){
      const det = []; let bien = 0, tot = 0;
      for (const it of cPos.esperado.items){
        const n = nombre(it.n), s = tr.spr[n];
        if (!s){ det.push({ ok: true, t: 'No tiene «' + it.n + '» (no se tiene en cuenta aquí)' }); continue; }
        if (it.pos){ tot++; const ok = dist([s.x, s.y], it.pos) <= 30; if (ok) bien++; det.push({ ok, t: '«' + n + '» empieza en (' + Math.round(s.x) + ', ' + Math.round(s.y) + ')' + (ok ? '' : ' — en tu modelo (' + Math.round(it.pos[0]) + ', ' + Math.round(it.pos[1]) + ')') }); }
        if (it.vis !== undefined){ tot++; const ok = s.vis === it.vis; if (ok) bien++; det.push({ ok, t: '«' + n + '» empieza ' + (s.vis ? 'visible' : 'escondido') + (ok ? '' : ' (en tu modelo ' + (it.vis ? 'visible' : 'escondido') + ')') }); }
        if (it.disfraz){ tot++; const ok = normNombre(s.disfraz) === normNombre(it.disfraz); if (ok) bien++; det.push({ ok, t: '«' + n + '» empieza con el disfraz «' + s.disfraz + '»' + (ok ? '' : ' (en tu modelo «' + it.disfraz + '»)') }); }
      }
      out.posiciones = { nota: tot ? 10 * bien / tot : 10, det };
    }
  }

  // Comportamiento espontáneo
  const cMov = crit.find(c => c.tipo === 'movimiento');
  if (cMov){
    const mv = perfil.movers.filter(n => n !== jugador);
    const n0 = cMov.esperado.movers.length;
    out.movimiento = { nota: 10 * Math.min(1, mv.length / n0), det: [{ ok: mv.length >= n0, t: 'Se mueven solos ' + mv.length + ' objeto(s)' + (mv.length ? ': ' + mv.join(', ') : '') + ' (en tu modelo ' + n0 + ')' }] };
  }
  for (const c of crit.filter(c => c.tipo === 'clones')){
    const E = c.esperado;
    const g = [nombre(E.obj), ...equivalentes(E.obj)].find(n => perfil.clones[n] && perfil.clones[n].creados) || Object.keys(perfil.clones).find(n => perfil.clones[n].creados && !crit.some(x => x.tipo === 'clones' && nombre(x.esperado.obj) === n && x !== c)) || null;
    const det = []; let p = 0, max = 0;
    if (!g){ out[c.id] = { nota: 0, det: [{ ok: false, t: 'No crea clones de «' + E.obj + '»' }] }; continue; }
    const pc = perfil.clones[g]; const ritmo = pc.creados / (perfil.frames / FPS);
    max += 2; const okR = ritmo >= E.ritmo * 0.5 && ritmo <= E.ritmo * 2; p += okR ? 2 : (ritmo > 0 ? 1 : 0);
    det.push({ ok: okR, t: 'Crea clones de «' + g + '»: unos ' + fmtN(ritmo * 10) + ' cada 10 s' + (okR ? '' : ' (en tu modelo ' + fmtN(E.ritmo * 10) + ')') });
    if (E.mueven){ max++; if (pc.mueven) p++; det.push({ ok: pc.mueven, t: pc.mueven ? 'Los clones se mueven' : 'Los clones no se mueven' }); }
    if (E.borrados){ max++; const ok = pc.borrados > 0; if (ok) p++; det.push({ ok, t: ok ? 'Los clones desaparecen' : 'Los clones no desaparecen nunca' }); }
    out[c.id] = { nota: 10 * p / max, det };
  }
  const cAnim = crit.find(c => c.tipo === 'anim');
  if (cAnim){
    const det = []; let p = 0, max = 0;
    for (const it of cAnim.esperado.items){
      const objs = it.objs || [it.obj];
      const cands = [...new Set(objs.flatMap(o => [nombre(o), ...equivalentes(o)]))].filter(n => info.some(i => i.n === n));
      for (const k of ['disfraz', 'tam', 'gira']) if (it[k]){
        const si = cands.filter(n => perfil.anim[n] && perfil.anim[n][k]);
        const frac = cands.length ? si.length / Math.max(cands.length, objs.length) : 0;
        max++; p += frac;
        const verbo = k === 'disfraz' ? 'cambia de disfraz' : k === 'tam' ? 'cambia de tamaño' : 'gira';
        det.push({ ok: frac >= 0.99, t: objs.length > 1 ? si.length + ' de ' + objs.length + ' objetos como «' + objs[0] + '»: ' + verbo : '«' + (si[0] || cands[0] || objs[0]) + '» ' + verbo + (si.length ? '' : ' — no pasa') });
      }
    }
    out.anim = { nota: max ? 10 * p / max : 0, det };
  }
  for (const c of crit.filter(c => c.tipo === 'tiempo')){
    const E = c.esperado;
    const k = ctxVar.mapaVar(E.var, Object.keys(perfil.vars)) || Object.keys(perfil.vars).find(x => E.delta !== null && perfil.vars[x].deltas[String(E.delta)]);
    const v = k ? perfil.vars[k] : null;
    if (!v){ out[c.id] = { nota: 0, det: [{ ok: false, t: nombreVar(E.var) + ' no cambia sola con el tiempo' }] }; continue; }
    const vecesM = E.veces / E.frames, vecesA = v.n / perfil.frames;
    const okD = E.delta === null || v.deltas[String(E.delta)];
    const okR = vecesA >= vecesM * 0.5 && vecesA <= vecesM * 2;
    out[c.id] = { nota: (okD ? 6 : 0) + (okR ? 4 : 2), det: [{ ok: !!okD, t: nombreVar(k) + ' cambia sola' + (E.delta !== null ? (okD ? ' (' + fmtDelta(E.delta) + ')' : ' pero no de ' + fmtDelta(E.delta) + ' en ' + fmtDelta(E.delta)) : '') }, { ok: okR, t: 'Cada ' + fmtN(1 / (vecesA * FPS)) + ' s más o menos' + (okR ? '' : ' (en tu modelo cada ' + fmtN(1 / (vecesM * FPS)) + ' s)') }] };
  }

  // Finales
  for (const c of crit.filter(c => c.tipo === 'fin' && c.valido)){
    avisar('final: ' + sinHtml(c.titulo).slice(0, 60));
    const causa = { ...c.esperado.regla.causa };
    await arrancar(buf);
    const ka = ctxVar.mapaVar(causa.var, Object.keys(motor.estado().vars));
    if (!ka){ out[c.id] = { nota: 0, det: [{ ok: false, t: 'No existe la variable «' + nombreVar(causa.var) + '»' }] }; continue; }
    causa.var = ka;
    const res = await provocar(causa);
    const obt = efectosDe(res.evs.filter(e => !esEspontaneo(perfil, e) && e.tipo !== 'var'), rolDe(null, null, jugador), res.ini);
    if (motor.estado().hilos === 0 && !obt.some(d => d.t === 'stop')) obt.push({ t: 'stop' });
    const det = []; let p = 0, max = 0;
    const visuales = c.esperado.efectos.filter(d => VISUALES.includes(d.t)), otros = c.esperado.efectos.filter(d => !VISUALES.includes(d.t));
    if (visuales.length){ max += 1; const v = obt.filter(d => VISUALES.includes(d.t)); if (v.length) p += 1; det.push({ ok: v.length > 0, t: v.length ? 'Aparece un aviso: ' + v.map(d => textoEf(d)).join(', ') : 'No aparece ningún aviso (en tu modelo: ' + visuales.map(d => textoEf(d)).join(', ') + ')' }); }
    for (const e of otros){ max++; const r = buscarEfecto(mapearEf(e, nombre), obt, ctxVar); if (r.ok) p++; det.push({ ok: r.ok, t: r.ok ? textoEf(r.visto || e) : 'No: ' + textoEf(e) }); }
    out[c.id] = { nota: max ? 10 * p / max : 0, det };
  }

  // Partida exacta
  const cPar = crit.find(c => c.tipo === 'partida');
  if (cPar && cPar.on){
    avisar('partida completa');
    const evs = await pruebaPartida(buf, grab);
    const esp = cPar.esperado.eventos; let j = 0, bien = 0; const det = [];
    for (const e of esp){
      const idx = evs.findIndex((x, n) => n >= j && Math.abs(x.f - e.f) <= 45 && (x.nombre === e.nombre || normNombre(nombreVar(x.nombre)) === normNombre(nombreVar(e.nombre)) || mapaVars[e.nombre] === x.nombre) && valorIgual(x.despues, e.despues));
      if (idx >= 0){ bien++; j = idx + 1; }
      det.push({ ok: idx >= 0, t: fmtSeg(e.f) + ': ' + nombreVar(e.nombre) + ' ' + e.antes + ' → ' + e.despues });
    }
    out.partida = { nota: esp.length ? 10 * bien / esp.length : 0, det };
  }
  return out;
}
function mapearEf(e, nombre){ if (e.obj && e.obj[0] !== '@') return { ...e, obj: nombre(e.obj) }; return e; }

/* -------------------------------------------------------------------------
   9. INTERFAZ
   ------------------------------------------------------------------------- */
const IMP = { bajo: 1, medio: 2, alto: 3 };
const app = { modelo: null, nombreModelo: '', grab: null, datos: null, resultados: [], grabando: false };

function preparar(){
  motor = new Motor($('#escenario'));
  motor.alEvento = e => { if (app.grabando) anotar(e); };
  conectarZona($('#zonaModelo'), $('#fModelo'), f => cargarModelo(f[0]));
  conectarZona($('#zonaGrab'), $('#fGrab'), f => cargarGrabacion(f[0]));
  $('#bGrabar').onclick = empezarGrabacion;
  $('#bBandera').onclick = () => { if (app.grabando){ registrarEntrada({ flag: true }); anotarTexto('<b>⚑ Bandera verde: empieza otra partida</b>'); $('#escenario').focus(); } };
  $('#bParar').onclick = () => terminarGrabacion();
  $('#bGuardar').onclick = guardarGrabacion;
  $('#bAnadir').onclick = () => nuevaFila();
  $('#bVarios').onclick = () => $('#fVarios').click();
  $('#fVarios').onchange = e => { anadirArchivos([...e.target.files]); e.target.value = ''; };
  $('#paso3').addEventListener('dragover', e => e.preventDefault());
  $('#paso3').addEventListener('drop', e => { e.preventDefault(); anadirArchivos([...e.dataTransfer.files].filter(f => /\.sb3$/i.test(f.name))); });
  $('#bCorregir').onclick = corregirTodo;
  $('#bCSV').onclick = exportarCSV;
  $('#respuesta').addEventListener('keydown', e => { if (e.key === 'Enter'){ e.preventDefault(); enviarRespuesta(); } });
  $('#bResponder').onclick = enviarRespuesta;
  nuevaFila();
  const cv = $('#escenario');
  const pos = e => { const r = cv.getBoundingClientRect(); return [Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))]; };
  cv.addEventListener('mousemove', e => { if (!app.grabando) return; const m = pos(e); const ult = app.grab.entradas[app.grab.entradas.length - 1]; if (ult && ult.m && ult.d === undefined && ult.f === motor.frame) ult.m = m; registrarEntrada({ m }, !(ult && ult.m && ult.d === undefined && ult.f === motor.frame)); });
  cv.addEventListener('mousedown', e => { if (!app.grabando) return; cv.focus(); registrarEntrada({ m: pos(e), d: true }); e.preventDefault(); });
  window.addEventListener('mouseup', e => { if (!app.grabando || !motor._down) return; registrarEntrada({ m: pos(e), d: false }); });
  window.addEventListener('keydown', e => {
    if (!app.grabando || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.key.startsWith('Arrow') || e.key === ' ') e.preventDefault();
    registrarEntrada({ k: e.key, d: true });
  });
  window.addEventListener('keyup', e => { if (!app.grabando || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return; registrarEntrada({ k: e.key, d: false }); });
}
function conectarZona(zona, input, alSoltar){
  zona.onclick = () => input.click();
  input.onchange = e => { if (e.target.files.length) alSoltar([...e.target.files]); e.target.value = ''; };
  zona.addEventListener('dragover', e => { e.preventDefault(); e.stopPropagation(); zona.classList.add('encima'); });
  zona.addEventListener('dragleave', () => zona.classList.remove('encima'));
  zona.addEventListener('drop', e => { e.preventDefault(); e.stopPropagation(); zona.classList.remove('encima'); if (e.dataTransfer.files.length) alSoltar([...e.dataTransfer.files]); });
}
function estadoEsc(html){ $('#estadoEsc').innerHTML = html; }

async function cargarModelo(file){
  if (!file) return;
  try {
    const buf = await file.arrayBuffer();
    estadoEsc('Cargando…');
    await motor.cargar(buf);
    app.modelo = buf; app.nombreModelo = file.name; app.grab = null; app.datos = null;
    $('#nombreModelo').textContent = file.name;
    estadoEsc('Juego cargado. Pulsa <b>Empezar a grabar</b> y juega.');
    $('#bGrabar').disabled = false; $('#bGuardar').disabled = true;
    ['#paso2', '#paso3', '#paso4'].forEach(s => $(s).classList.add('oculto'));
  } catch (err){ console.error(err); estadoEsc('No se pudo abrir el archivo: ' + esc(err.message || err)); }
}

async function empezarGrabacion(){
  if (!app.modelo) return;
  await motor.cargar(app.modelo);
  app.grab = { entradas: [], eventos: [], toques: [], frames: 0 };
  $('#registro').innerHTML = '';
  app.grabando = true;
  $('#bGrabar').disabled = true; $('#bParar').disabled = false; $('#bBandera').disabled = false; $('#bGuardar').disabled = true;
  $('#escenario').classList.add('grabando'); $('#escenario').focus();
  registrarEntrada({ flag: true });
  anotarTexto('<b>⚑ Bandera verde: empieza la partida</b>');
  const t0 = performance.now();
  const bucle = async () => {
    if (!app.grabando) return;
    const toca = Math.floor((performance.now() - t0) / DT);
    let n = 0;
    while (motor.frame < toca && n < 4 && app.grabando){ await motor.paso(); n++; }
    const parado = motor.prev && motor.prev.hilos === 0;
    estadoEsc('<span class="rec"></span>Grabando… ' + fmtSeg(motor.frame) + (parado ? ' · el juego se ha detenido: pulsa <b>⚑ Bandera verde</b> para jugar otra vez o <b>Terminar</b>' : ' · haz clic en el escenario si las teclas no responden'));
    const caja = $('#cajaPregunta');
    if (motor.pregunta){ if (caja.classList.contains('oculto')){ caja.classList.remove('oculto'); $('#textoPregunta').textContent = motor.pregunta.texto || 'Responde:'; $('#respuesta').value = ''; $('#respuesta').focus(); } }
    else if (!caja.classList.contains('oculto')) caja.classList.add('oculto');
    requestAnimationFrame(bucle);
  };
  requestAnimationFrame(bucle);
}
function registrarEntrada(e, nueva = true){ e.f = motor.frame; if (nueva) app.grab.entradas.push(e); motor.entrada(e); }
function enviarRespuesta(){
  if (!app.grabando || !motor.pregunta) return;
  const v = $('#respuesta').value;
  registrarEntrada({ r: v });
  $('#cajaPregunta').classList.add('oculto');
  $('#escenario').focus();
}
let ultimoAnotado = null;
function anotarTexto(html, ev){ const d = document.createElement('div'); ultimoAnotado = { d, ev }; d.innerHTML = '<span class="t">' + fmtSeg(motor.frame) + '</span>' + html; const r = $('#registro'); r.appendChild(d); r.scrollTop = r.scrollHeight; }
function anotar(e){
  if (e.menor) return;
  let t;
  if (e.tipo === 'var') t = '<b>' + esc(nombreVar(e.nombre)) + '</b>: ' + esc(e.antes) + ' → ' + esc(e.despues);
  else if (e.tipo === 'fondo') t = 'Fondo → ' + esc(e.despues);
  else if (e.tipo === 'muestra') t = 'Aparece «' + esc(e.obj) + '»';
  else if (e.tipo === 'oculta') t = 'Se esconde «' + esc(e.obj) + '»';
  else if (e.tipo === 'dice') t = '«' + esc(e.obj) + '» dice «' + esc(e.texto) + '»';
  else if (e.tipo === 'pregunta') t = '<b>Pregunta:</b> «' + esc(e.texto) + '» (responde debajo del escenario)';
  else if (e.tipo === 'respuesta') t = '<b>Respuesta:</b> «' + esc(e.texto) + '»';
  else if (e.tipo === 'mensaje') t = 'Se envía el mensaje «' + esc(e.nombre) + '»';
  else if (e.tipo === 'clic') t = 'Clic en ' + (e.clon ? 'un clon de ' : '') + '«' + esc(e.obj) + '»';
  else if (e.tipo === 'suelta') t = 'Arrastras ' + (e.clon ? 'un clon de ' : '') + '«' + esc(e.obj) + '» hasta (' + Math.round(e.hasta[0]) + ', ' + Math.round(e.hasta[1]) + ')';
  else if (e.tipo === 'sonido') t = '«' + esc(e.obj) + '» toca un sonido';
  else if (e.tipo === 'salta') t = '«' + esc(e.obj) + '» salta a (' + Math.round(e.a[0]) + ', ' + Math.round(e.a[1]) + ')';
  else if (e.tipo === 'stop') t = '<b>El juego se ha detenido</b>';
  if (!t) return;
  // La pregunta aparece primero como un «dice»: se sustituye esa línea
  if (e.tipo === 'pregunta' && ultimoAnotado && ultimoAnotado.ev && ultimoAnotado.ev.tipo === 'dice' && ultimoAnotado.ev.texto === e.texto) ultimoAnotado.d.remove();
  if (['var', 'oculta', 'salta'].includes(e.tipo)){
    const tq = motor.toques.filter(q => q.f >= e.f - 1 && q.f <= e.f);
    if (tq.length) t += ' <span style="color:var(--suave)">(' + esc([...new Set(tq.map(q => (q.clon ? 'clon de ' : '') + q.por + (q.tipo === 'objeto' ? ' toca ' + q.que : q.tipo === 'borde' ? ' toca el borde' : ' toca el color ' + q.que)))].slice(0, 3).join('; ')) + ')</span>';
  }
  anotarTexto(t, e);
}

async function terminarGrabacion(){
  if (!app.grabando) return;
  app.grabando = false;
  app.grab.frames = motor.frame;
  app.grab.eventos = motor.eventos.map(e => ({ ...e }));
  app.grab.toques = motor.toques.map(t => ({ ...t }));
  $('#cajaPregunta').classList.add('oculto');
  $('#escenario').classList.remove('grabando');
  $('#bParar').disabled = true; $('#bBandera').disabled = true; $('#bGrabar').disabled = false;
  estadoEsc('Grabación terminada (' + fmtSeg(app.grab.frames) + '). Analizando…');
  await analizarYMostrar();
}

async function analizarYMostrar(){
  $('#paso2').classList.remove('oculto');
  const pm = $('#progModelo'); pm.classList.remove('oculto');
  $('#tablaCriterios').innerHTML = ''; $('#avisoCrit').innerHTML = '';
  $('#bGrabar').disabled = true;
  try {
    app.datos = await analizar(app.modelo, app.grab, t => { pm.textContent = t; });
  } catch (err){ console.error(err); pm.textContent = 'Error al analizar: ' + (err.message || err); $('#bGrabar').disabled = false; return; }
  pm.classList.add('oculto');
  $('#bGrabar').disabled = false; $('#bGuardar').disabled = false;
  await motor.cargar(app.modelo);
  estadoEsc('Grabación lista (' + fmtSeg(app.grab.frames) + '). Puedes volver a grabar o guardarla para otro día.');
  pintarCriterios();
  $('#paso3').classList.remove('oculto');
}

function pintarCriterios(){
  const tb = $('#tablaCriterios'); tb.innerHTML = '';
  const av = $('#avisoCrit'); av.innerHTML = '';
  const crit = app.datos.crit;
  if (!crit.some(c => c.tipo !== 'partida' && c.valido)) av.innerHTML = '<div class="aviso">No se ha detectado casi nada en la partida. Graba otra vez usando las teclas, chocando, haciendo clic y respondiendo preguntas.</div>';
  else if (app.datos.sinEfecto && app.datos.sinEfecto.length) av.innerHTML = '<div class="aviso">Estas acciones de tu partida no producen ningún efecto por sí solas y no se evalúan: ' + esc(app.datos.sinEfecto.join(', ')) + '.</div>';
  const az = app.datos.azar;
  if (az && (az.vars.length || az.preguntas.length || az.textos.length)){
    const partes = [];
    if (az.vars.length) partes.push('variables ' + az.vars.map(k => '«' + nombreVar(k) + '»').join(', '));
    if (az.preguntas.length) partes.push('los números de las preguntas');
    if (az.textos.length) partes.push('los números de algunos mensajes');
    av.insertAdjacentHTML('beforeend', '<div class="aviso">🎲 He repetido tu partida 3 veces con otros números al azar. Cambian solos: ' + esc(partes.join('; ')) + '. En esos casos no se exige un valor concreto, solo que cambien.</div>');
  }
  for (const c of crit){
    const tr = document.createElement('tr');
    const fam = FAMILIAS[c.familia || c.tipo] || '';
    tr.innerHTML = '<td class="c1"><input type="checkbox" id="crit-' + esc(c.id) + '"' + (c.on ? ' checked' : '') + (c.valido ? '' : ' disabled') + '></td>' +
      '<td><span class="fam">' + esc(fam) + '</span> ' + c.titulo + (c.valido ? (c.tipo === 'partida' ? '' : '<span class="etq">comprobado en tu juego</span>') : '<span class="etq no">no se pudo comprobar en tu juego</span>') +
      (c.detalle ? '<div class="sub">' + c.detalle.map(esc).join('<br>') + '</div>' : '') + '</td>' +
      '<td style="width:190px;white-space:nowrap">Importancia <select id="imp-' + esc(c.id) + '"><option value="bajo">baja</option><option value="medio">media</option><option value="alto">alta</option></select></td>';
    tr.querySelector('input').onchange = e => { c.on = e.target.checked; recalcular(); };
    const s = tr.querySelector('select'); s.value = c.imp; s.onchange = e => { c.imp = e.target.value; recalcular(); };
    tb.appendChild(tr);
  }
}

function guardarGrabacion(){
  const datos = { app: 'corrector-scratch', version: 2, modelo: app.nombreModelo, sb3: ab2b64(app.modelo), grab: app.grab, datos: app.datos };
  descargar(app.nombreModelo.replace(/\.sb3$/i, '') + '-grabacion.json', JSON.stringify(datos), 'application/json');
}
async function cargarGrabacion(file){
  try {
    const d = JSON.parse(await file.text());
    if (d.app !== 'corrector-scratch') throw new Error('no es una grabación de este corrector');
    app.modelo = b642ab(d.sb3); app.nombreModelo = d.modelo; app.grab = d.grab;
    $('#nombreModelo').textContent = d.modelo + ' (grabación cargada)';
    await motor.cargar(app.modelo);
    $('#bGrabar').disabled = false; $('#bGuardar').disabled = false;
    $('#registro').innerHTML = '<div class="vacio">Grabación cargada: ' + fmtSeg(d.grab.frames) + ' de partida.</div>';
    if (d.version === 2 && d.datos){
      app.datos = d.datos;
      estadoEsc('Grabación cargada. Puedes corregir directamente.');
      $('#paso2').classList.remove('oculto'); $('#progModelo').classList.add('oculto');
      pintarCriterios();
      $('#paso3').classList.remove('oculto');
    } else {
      estadoEsc('Grabación de una versión anterior: se vuelve a analizar…');
      await analizarYMostrar();
    }
  } catch (err){ console.error(err); estadoEsc('No se pudo cargar la grabación: ' + esc(err.message || err)); }
}

/* --- Alumnos --- */
function nuevaFila(nombre = '', file = null){
  const div = document.createElement('div'); div.className = 'alumno';
  div.innerHTML = '<input type="text" placeholder="Nombre del alumno"><div class="archivo">Elegir o arrastrar su .sb3</div><input type="file" accept=".sb3"><button class="sec" title="Quitar">✕</button>';
  const [txt, zona, inp, quitar] = div.children;
  txt.value = nombre;
  const poner = f => { div._file = f; zona.textContent = f.name; zona.classList.add('ok'); if (!txt.value) txt.value = nombreDesdeArchivo(f.name); };
  if (file) poner(file);
  zona.onclick = () => inp.click();
  inp.onchange = e => { if (e.target.files[0]) poner(e.target.files[0]); };
  zona.addEventListener('dragover', e => { e.preventDefault(); e.stopPropagation(); });
  zona.addEventListener('drop', e => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.files[0]) poner(e.dataTransfer.files[0]); });
  quitar.onclick = () => { div.remove(); if (!$('#alumnos').children.length) nuevaFila(); };
  $('#alumnos').appendChild(div);
  return div;
}
function nombreDesdeArchivo(n){ return n.replace(/\.sb3$/i, '').replace(/[_-]+/g, ' ').trim(); }
function anadirArchivos(files){
  for (const f of files){
    const vacia = [...$('#alumnos').children].find(d => !d._file && !d.querySelector('input[type=text]').value);
    if (vacia) vacia.remove();
    nuevaFila('', f);
  }
}
function mostrarProg(t){ $('#progCorr').classList.remove('oculto'); $('#txtCorr').textContent = t; $('#barraCorr').style.width = '0'; }

async function corregirTodo(){
  const filas = [...$('#alumnos').children].filter(d => d._file);
  if (!app.datos){ mostrarProg('Primero graba tu partida con el juego modelo.'); return; }
  if (!filas.length){ mostrarProg('Añade al menos un juego de alumno: elige su archivo .sb3.'); return; }
  const prog = $('#progCorr'); prog.classList.remove('oculto');
  $('#bCorregir').disabled = true; $('#bGrabar').disabled = true;
  app.resultados = [];
  $('#miniEsc').appendChild($('#escenario'));
  for (let i = 0; i < filas.length; i++){
    const d = filas[i];
    const nombre = d.querySelector('input[type=text]').value || nombreDesdeArchivo(d._file.name);
    $('#barraCorr').style.width = (100 * i / filas.length) + '%';
    try {
      const buf = await d._file.arrayBuffer();
      const r = await corregirAlumno(buf, app.datos, app.grab, paso => { $('#txtCorr').textContent = 'Corrigiendo a ' + nombre + ' (' + (i + 1) + ' de ' + filas.length + '): ' + paso + '…'; });
      app.resultados.push({ nombre, notas: Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v.nota])), detalle: r, editadas: {} });
    } catch (err){
      console.error(err);
      app.resultados.push({ nombre, notas: {}, detalle: {}, error: String(err.message || err), editadas: {} });
    }
  }
  $('#barraCorr').style.width = '100%';
  $('#cajaEscenario').appendChild($('#escenario'));
  $('#bCorregir').disabled = false; $('#bGrabar').disabled = false;
  await motor.cargar(app.modelo);
  estadoEsc('Corrección terminada.');
  pintarResultados();
  $('#txtCorr').textContent = 'Corrección terminada.';
}

function critActivos(){ return app.datos.crit.filter(c => c.on && c.valido); }
function notaFinal(r){
  let s = 0, p = 0;
  for (const c of critActivos()){ const n = r.notas[c.id]; const w = IMP[c.imp]; p += w; s += w * (typeof n === 'number' ? n : 0); }
  return p ? s / p : 0;
}
function claseNota(n){ return n >= 7 ? 'n-alta' : n >= 5 ? 'n-media' : 'n-baja'; }
function tituloCorto(c){
  const t = sinHtml(c.titulo);
  const fam = FAMILIAS[c.familia || c.tipo] || '';
  if (['controles', 'movimiento', 'anim', 'partida', 'inicio'].includes(c.tipo)) return fam === 'Inicio' ? 'Inicio' : fam;
  if (c.tipo === 'posiciones') return 'Posiciones al empezar';
  const corto = t.length > 46 ? t.slice(0, 44) + '…' : t;
  return corto;
}
function pintarResultados(){
  $('#paso4').classList.remove('oculto');
  const cs = critActivos();
  const t = $('#tablaNotas');
  let h = '<tr><th>Alumno</th>' + cs.map(c => '<th title="' + esc(sinHtml(c.titulo)) + '"><span class="fam-th">' + esc(FAMILIAS[c.familia || c.tipo] || '') + '</span><br>' + esc(tituloCorto(c)) + '<br><span style="font-weight:400;opacity:.8">' + { bajo: 'baja', medio: 'media', alto: 'alta' }[c.imp] + '</span></th>').join('') + '<th>Nota final</th></tr>';
  app.resultados.forEach((r, i) => {
    h += '<tr><td>' + esc(r.nombre) + (r.error ? ' <span class="etq no">error</span>' : '') + '</td>';
    for (const c of cs){
      const n = r.notas[c.id];
      h += '<td><input id="nota-' + i + '-' + esc(c.id) + '" data-i="' + i + '" data-c="' + esc(c.id) + '" value="' + (typeof n === 'number' ? fmtN(n) : '') + '" class="' + (r.editadas[c.id] ? 'editada ' : '') + (typeof n === 'number' ? claseNota(n) : '') + '"></td>';
    }
    const f = notaFinal(r);
    h += '<td class="final ' + claseNota(f) + '">' + fmtN(f) + '</td></tr>';
  });
  t.innerHTML = h;
  t.querySelectorAll('input').forEach(inp => inp.onchange = () => {
    const r = app.resultados[+inp.dataset.i]; const v = parseFloat(inp.value.replace(',', '.'));
    if (!isNaN(v)){ r.notas[inp.dataset.c] = Math.max(0, Math.min(10, v)); r.editadas[inp.dataset.c] = true; }
    pintarResultados();
  });
  const det = $('#detalles'); det.innerHTML = '';
  app.resultados.forEach(r => {
    const d = document.createElement('details'); d.className = 'detalle';
    let b = '<summary>' + esc(r.nombre) + ' — ' + fmtN(notaFinal(r)) + '</summary><div class="cuerpo">';
    if (r.error) b += '<div class="aviso">No se pudo ejecutar el juego: ' + esc(r.error) + '</div>';
    for (const c of cs){
      const x = r.detalle[c.id]; if (!x) continue;
      b += '<h4>' + c.titulo + ' — ' + fmtN(r.notas[c.id] ?? 0) + (r.editadas[c.id] ? ' (editada)' : '') + '</h4>' + (x.extra ? '<div class="sub">' + esc(x.extra) + '</div>' : '') + '<ul>' + x.det.map(l => '<li class="' + (l.ok ? 'ok' : 'mal') + '">' + esc(l.t) + '</li>').join('') + '</ul>';
    }
    d.innerHTML = b + '</div>';
    det.appendChild(d);
  });
}
function recalcular(){ if (app.resultados.length) pintarResultados(); }
function exportarCSV(){
  const cs = critActivos();
  const q = s => '"' + String(s).replace(/"/g, '""') + '"';
  let s = [q('Alumno'), ...cs.map(c => q(sinHtml(c.titulo))), q('Nota final')].join(';') + '\n';
  for (const r of app.resultados) s += [q(r.nombre), ...cs.map(c => fmtN(r.notas[c.id] ?? 0)), fmtN(notaFinal(r))].join(';') + '\n';
  descargar('notas-' + app.nombreModelo.replace(/\.sb3$/i, '') + '.csv', '﻿' + s, 'text/csv');
}
async function descargar(nombre, contenido, tipo){
  if (window.claude && window.claude.use){
    try { const dl = await window.claude.use('downloads'); if (dl){ await dl.save({ filename: nombre, data: new Blob([contenido], { type: tipo }) }); return; } }
    catch (e){ if (e && e.code === 'declined') return; console.warn(e); }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([contenido], { type: tipo })); a.download = nombre; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

window.addEventListener('DOMContentLoaded', preparar);
