/* Motor: ejecuta el juego modelo del profesor con el motor oficial de Scratch (scratch-vm),
   fotograma a fotograma y con tiempo virtual, y anota qué bloques se ejecutan y qué pasa. */
'use strict';
const FPS = 30, DT = 1000 / FPS;
const esperar = () => new Promise(r => setTimeout(r, 0));
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const rgbHex = c => Array.isArray(c) ? '#' + c.slice(0,3).map(v => Math.round(v).toString(16).padStart(2,'0')).join('') : String(c);
const nombreVar = k => k.includes(': ') ? k.split(': ').slice(1).join(': ') : k;
const fmtSeg = f => (f / FPS).toFixed(1).replace('.', ',') + ' s';

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
    // Anota cada bloque que se ejecuta (objeto|id → veces)
    this.ejecutados = new Map();
    this._vigilar();
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
  _vigilar(){
    const P = this.rt._primitives;
    for (const op of Object.keys(P)){
      const f = P[op]; if (typeof f !== 'function' || f.__vigilada) continue;
      const motor = this;
      const g = function(args, util){
        try {
          const t = util && util.target, id = util && util.thread && util.thread.peekStack();
          if (t && id){ const k = (t.isStage ? 'Escenario' : t.sprite.name) + '|' + id; motor.ejecutados.set(k, (motor.ejecutados.get(k) || 0) + 1); }
        } catch(e){}
        return f.apply(this, arguments);
      };
      g.__vigilada = true; P[op] = g;
    }
  }
  reset(){ this.timers = []; this.frame = 0; this.t0 = 1.7e12; this.eventos = []; this.toques = []; this.rng = mulberry32(this.semilla || 20261009); this.prev = null; this.pregunta = null; this._down = false; this.arrastre = null; }
  async cargar(buf){
    this._propio = true; try { this.vm.stopAll(); } catch(e){} this._propio = false;
    await this.vm.loadProject(buf.slice(0));
    this._vigilar(); // extensiones (lápiz…) que se cargan con el proyecto
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
