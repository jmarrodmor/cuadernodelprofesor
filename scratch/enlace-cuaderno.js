'use strict';
/* =========================================================================
   ENLACE CON EL CUADERNO DE EVALUACIÓN
   Solo actúa cuando el corrector se abre dentro del cuaderno
   (scratch/index.html?cuaderno=1 en un marco). Entonces:
   - la lista de alumnos la manda el cuaderno (no se escriben nombres);
   - los .sb3 se reparten solos por el nombre del archivo;
   - todo se envía al cuaderno y se guarda en su archivo con «💾 Guardar Archivo»:
     el juego modelo y tu partida, los ítems marcados, sus nombres e importancias,
     los ítems manuales, las notas (también las cambiadas a mano), las capturas
     y los bloques de cada juego de alumno. Como se guardan sus bloques, si
     cambias el modelo o vuelves a grabar tu partida se recorrige a todos solos,
     sin volver a subir sus .sb3.
   Si el corrector se abre solo, este archivo no hace nada.
   ========================================================================= */
const CUADERNO = (() => { try { return new URLSearchParams(location.search).get('cuaderno') === '1' && window.parent !== window; } catch (e) { return false; } })();

if (CUADERNO) (() => {
  const CX = { alumnos: [], titulo: '', timer: null, listo: false, b64: null, b64de: null, sinDueno: [], restaurando: false, stash: null };
  const aCuaderno = (m) => window.parent.postMessage({ origen: 'corrector-scratch', ...m }, '*');
  document.documentElement.setAttribute('data-theme', 'light');   // el cuaderno es claro

  /* ---------- Emparejar archivos con alumnos por el nombre ---------- */
  const VACIAS = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'el', 'sb3', 'juego', 'proyecto', 'scratch', 'copia', 'final', 'version', 'trabajo', 'tarea', 'ud', 'mi']);
  const palabras = (t) => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\.sb3$/, '').split(/[^a-z0-9ñ]+/).filter((x) => x.length >= 2 && !VACIAS.has(x) && !/^\d+$/.test(x));
  function duenoDe(nombreArchivo) {
    const P = new Set(palabras(nombreArchivo)); if (!P.size) return null;
    const pun = CX.alumnos.map((a) => { let n = 0; palabras(a.nombre).forEach((w) => { if (P.has(w)) n++; }); return [n, a]; }).filter((x) => x[0] > 0).sort((x, y) => y[0] - x[0]);
    if (!pun.length || (pun[1] && pun[1][0] === pun[0][0])) return null;   // nadie o empate: no se adivina
    return pun[0][1];
  }

  // De cada juego de alumno se guarda solo lo que mira el analizador (bloques, variables, nombres): ocupa poco
  function recortar(pj) {
    return { targets: (pj.targets || []).map((t) => ({ isStage: !!t.isStage, name: t.name, blocks: t.blocks || {}, variables: t.variables || {}, lists: t.lists || {},
      costumes: (t.costumes || []).map((c) => ({ name: c.name })), sounds: (t.sounds || []).map(() => ({})), visible: t.visible })) };
  }
  function analizar(r) {   // vuelve a corregir un alumno a partir de sus bloques guardados
    try { const al = Analizador.extraer(r.pj); r.detalle = Analizador.corregirActores(app.apartados, al); r.sueltos = al.sueltos; delete r.error; }
    catch (e) { console.error(e); r.detalle = {}; r.error = String(e.message || e); }
  }

  /* ---------- Filas de alumnos (vienen del cuaderno) ---------- */
  const filaDe = (id) => [...$('#alumnos').children].find((d) => d._id === id);
  const resDe = (id) => app.resultados.find((r) => r.id === id);
  function estadoFila(div) {
    const r = resDe(div._id), est = div.querySelector('.est');
    if (!est) return;
    if (div._file && (!r || r.archivo !== div._file.name)) { est.textContent = 'por corregir'; est.className = 'est'; return; }
    if (!r) { est.textContent = 'sin juego'; est.className = 'est'; return; }
    if (r.error) { est.textContent = 'error'; est.className = 'est n-baja'; return; }
    if (!app.apartados.length) { est.textContent = 'falta el modelo'; est.className = 'est'; return; }
    const f = notaFinal(r); est.textContent = fmtN(f); est.className = 'est final ' + claseNota(f);
  }
  function pintarFilas() {
    const cont = $('#alumnos'); cont.innerHTML = '';
    for (const a of CX.alumnos) {
      const div = document.createElement('div'); div.className = 'alumno'; div._id = a.id;
      div.innerHTML = '<input type="text" readonly title="Alumno del cuaderno de evaluación"><div class="archivo" tabindex="0">Elegir o arrastrar su .sb3</div><input type="file" accept=".sb3"><span class="est"></span>';
      const [txt, zona, inp] = div.children;
      txt.value = a.nombre;
      const r = resDe(a.id);
      if (r && r.archivo) zona.textContent = r.archivo + ' (ya corregido; elige otro para cambiarlo)';
      div._poner = (f) => { div._file = f; zona.textContent = f.name; zona.classList.add('ok'); estadoFila(div); };
      zona.onclick = () => inp.click();
      zona.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inp.click(); } };
      inp.onchange = (e) => { if (e.target.files[0]) div._poner(e.target.files[0]); e.target.value = ''; };
      zona.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); });
      zona.addEventListener('drop', (e) => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.files[0]) div._poner(e.dataTransfer.files[0]); });
      cont.appendChild(div); estadoFila(div);
    }
    pintarSinDueno();
  }
  function pintarSinDueno() {
    let av = $('#sinDueno');
    if (!av) { av = document.createElement('div'); av.id = 'sinDueno'; $('#alumnos').after(av); }
    av.innerHTML = CX.sinDueno.length ? '<div class="aviso">No sé de quién son estos archivos (el nombre no coincide con ningún alumno o coincide con varios): <b>' + CX.sinDueno.map(esc).join('</b>, <b>') + '</b>. Arrástralos a la fila de su alumno.</div>' : '';
  }

  // Sustituyen a las del corrector
  nuevaFila = function () {};          // no se añaden filas sueltas: la lista es la del cuaderno
  anadirArchivos = function (files) {
    CX.sinDueno = [];
    for (const f of files) { const a = duenoDe(f.name), d = a && filaDe(a.id); if (d) d._poner(f); else CX.sinDueno.push(f.name); }
    pintarSinDueno();
  };
  function ordenarResultados() {
    const pos = new Map(CX.alumnos.map((a, i) => [a.id, i]));
    app.resultados.forEach((r) => { const a = CX.alumnos.find((x) => x.id === r.id); if (a) r.nombre = a.nombre; });
    app.resultados = app.resultados.filter((r) => pos.has(r.id)).sort((x, y) => pos.get(x.id) - pos.get(y.id));
  }

  // Solo se corrigen los juegos nuevos; los demás conservan su nota
  corregirTodo = async function () {
    const filas = [...$('#alumnos').children].filter((d) => d._file && (() => { const r = resDe(d._id); return !r || r.archivo !== d._file.name; })());
    const prog = $('#progCorr'); prog.classList.remove('oculto');
    if (!app.apartados.length) { $('#txtCorr').textContent = 'Primero sube tu juego modelo.'; return; }
    if (app.grabando) { $('#txtCorr').textContent = 'Termina primero la grabación de tu partida.'; return; }
    if (!filas.length) { $('#txtCorr').textContent = 'No hay juegos nuevos por corregir: elige el .sb3 de algún alumno (o arrastra varios a la vez).'; return; }
    $('#bCorregir').disabled = true; $('#bGrabar').disabled = true; aCuaderno({ tipo: 'ocupado', valor: true });
    try {
      if (!app.capturaModelo && app.buf) { $('#txtCorr').textContent = 'Haciendo la captura de tu juego…'; app.capturaModelo = await capturar(app.buf); }
      for (let i = 0; i < filas.length; i++) {
        const d = filas[i], a = CX.alumnos.find((x) => x.id === d._id), nombre = a ? a.nombre : '';
        $('#txtCorr').textContent = 'Corrigiendo a ' + nombre + ' (' + (i + 1) + ' de ' + filas.length + ')…';
        $('#barraCorr').style.width = (100 * i / filas.length) + '%';
        await new Promise((r) => setTimeout(r, 0));
        const prev = resDe(d._id);
        const r = { id: d._id, nombre, archivo: d._file.name, notas: {}, editadas: {}, manual: (prev && prev.manual) || {}, detalle: {} };
        try {
          const buf = await d._file.arrayBuffer();
          r.pj = recortar(await Analizador.leerProyecto(buf));
          analizar(r);
          $('#txtCorr').textContent = 'Haciendo la captura del juego de ' + nombre + '…';
          r.captura = await capturar(buf);
        } catch (err) { console.error(err); r.error = String(err.message || err); }
        app.resultados = app.resultados.filter((x) => x.id !== d._id).concat(r);
        ordenarResultados(); pintarResultados();   // cada alumno se envía al cuaderno nada más corregirlo
      }
      $('#barraCorr').style.width = '100%';
      $('#txtCorr').textContent = 'Corrección terminada: ' + filas.length + (filas.length === 1 ? ' juego.' : ' juegos.');
    } finally {
      $('#bCorregir').disabled = false; $('#bGrabar').disabled = false; aCuaderno({ tipo: 'ocupado', valor: false });
      if (app.buf) await motor.cargar(app.buf);
      enviar(true);
    }
  };

  // Si cambian los ítems (modelo nuevo, partida grabada o cargada), se recorrige a todos con sus bloques guardados
  const prepararOrig = prepararActores;
  prepararActores = function () {
    const guardados = CX.stash || app.resultados; CX.stash = null;   // cargarModelo vacía la lista antes de llegar aquí
    prepararOrig();
    $('#paso3').classList.remove('oculto');
    if (CX.restaurando) return;
    app.resultados = guardados.filter((r) => r.pj || r.error);
    app.resultados.forEach((r) => { r.editadas = {}; r.notas = {}; if (r.pj) analizar(r); });
    if (app.resultados.length) pintarResultados(); else { [...$('#alumnos').children].forEach(estadoFila); programarEnvio(); }
  };
  const cargarModeloOrig = cargarModelo;
  cargarModelo = async function (file) { CX.stash = app.resultados; await cargarModeloOrig(file); [...$('#alumnos').children].forEach(estadoFila); enviar(true); };
  const cargarPartidaOrig = cargarPartida;
  cargarPartida = async function (file) { CX.stash = app.resultados; await cargarPartidaOrig(file); enviar(true); };
  const terminarOrig = terminarGrabacion;
  terminarGrabacion = async function () { await terminarOrig(); enviar(true); };

  // Cada vez que cambian las notas se envían al cuaderno
  const pintarOrig = pintarResultados;
  pintarResultados = function () {
    pintarOrig();
    if (!app.resultados.length) $('#paso4').classList.add('oculto');
    [...$('#alumnos').children].forEach(estadoFila);
    programarEnvio();
  };
  recalcular = function () { if (app.resultados.length) pintarResultados(); else programarEnvio(); };

  /* ---------- Envío al cuaderno ---------- */
  function proyecto() {
    if (app.buf && CX.b64de !== app.buf) { CX.b64 = ab2b64(app.buf); CX.b64de = app.buf; }
    return JSON.parse(JSON.stringify({
      tipo: 'proyecto-scratch', version: 2, guardado: Date.now(),
      modelo: app.buf ? { nombre: app.nombreModelo, sb3: CX.b64, ejecutados: app.ejecutados || null, duracion: app.duracion || 0, captura: app.capturaModelo || null } : null,
      // lo que el profesor ha elegido en cada ítem (los ítems se rehacen igual a partir del modelo)
      items: app.apartados.map((a) => ({ id: a.id, on: a.on, imp: a.imp, nombre: a.nombre || '', grupos: Object.fromEntries(a.grupos.map((g) => [g.id, g.on])) })),
      manuales: app.manuales,
      alumnos: app.resultados.map((r) => ({ id: r.id, archivo: r.archivo, pj: r.pj || null, captura: r.captura || null, editadas: r.editadas, notas: r.notas, manual: r.manual || {}, error: r.error || '' })),
    }));
  }
  function notas() {
    const n = {};
    if (app.apartados.length) app.resultados.forEach((r) => { if (!r.error && r.pj) n[r.id] = Math.round(notaFinal(r) * 100) / 100; });
    return n;
  }
  function enviar(forzar) {
    if (!CX.listo) return;
    clearTimeout(CX.timer);
    if (!forzar && app.grabando) return;
    const n = notas();
    aCuaderno({ tipo: 'estado', notas: n, proyecto: proyecto() });
    const k = Object.keys(n).length;
    $('#cxEstado').textContent = '✓ Enviado al cuaderno' + (k ? ' (' + k + ' nota(s))' : '') + ' a las ' + new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) + '.';
  }
  function programarEnvio() { if (!CX.listo) return; clearTimeout(CX.timer); CX.timer = setTimeout(() => enviar(false), 600); }

  /* ---------- Arranque con los datos del cuaderno ---------- */
  async function iniciar(d) {
    CX.alumnos = Array.isArray(d.alumnos) ? d.alumnos : []; CX.titulo = d.titulo || '';
    $('#barraCuaderno').innerHTML = '<b>📒 Conectado al Cuaderno de Evaluación</b>' + (CX.titulo ? ' · ' + esc(CX.titulo) : '') +
      '<div class="ayuda" style="margin:4px 0 0">Los alumnos vienen del cuaderno. Elige el .sb3 de cada uno o arrastra varios a la vez sobre el paso 3 (se reparten por el nombre del archivo). Todo se envía solo al cuaderno y se guarda al pulsar <b>💾 Guardar Archivo</b>. También se guardan los bloques de cada juego: si cambias el modelo, se recorrige a todos sin volver a subirlos.</div><div id="cxEstado" class="ayuda" style="margin:4px 0 0"></div>';
    $('#barraCuaderno').classList.remove('oculto');
    const p = d.proyecto && d.proyecto.version === 2 ? d.proyecto : null;
    if (d.proyecto && !p) $('#barraCuaderno').insertAdjacentHTML('beforeend', '<div class="aviso">Este apartado se corrigió con la versión anterior del corrector de Scratch. Sube de nuevo tu juego modelo y los de los alumnos para corregir con la nueva (las notas que ya están en el cuaderno no se tocan hasta entonces).</div>');
    app.manuales = (p && Array.isArray(p.manuales)) ? p.manuales : [];
    app.resultados = [];
    if (p && p.modelo && p.modelo.sb3) {
      try {
        CX.restaurando = true;
        app.buf = b642ab(p.modelo.sb3); app.nombreModelo = p.modelo.nombre || 'modelo.sb3'; CX.b64 = p.modelo.sb3; CX.b64de = app.buf;
        app.ejecutados = p.modelo.ejecutados || null; app.duracion = p.modelo.duracion || 0; app.capturaModelo = p.modelo.captura || null;
        app.modelo = Analizador.extraer(await Analizador.leerProyecto(app.buf));
        estadoEsc('Cargando el juego modelo guardado…');
        await motor.cargar(app.buf);
        $('#nombreModelo').textContent = app.nombreModelo + ' (guardado en el cuaderno)';
        $('#bGrabar').disabled = false; $('#bGuardar').disabled = !app.ejecutados;
        if (app.ejecutados) $('#registro').innerHTML = '<div class="vacio">Partida guardada en el cuaderno (' + fmtSeg(app.duracion || 0) + ').</div>';
        prepararActores();
        // lo que el profesor eligió en cada ítem
        const items = new Map((p.items || []).map((x) => [x.id, x]));
        app.apartados.forEach((a) => { const x = items.get(a.id); if (!x) return; a.on = x.on; a.imp = x.imp || a.imp; a.nombre = x.nombre || ''; a.grupos.forEach((g) => { if (x.grupos && g.id in x.grupos) g.on = x.grupos[g.id]; }); });
        pintarApartados();
        estadoEsc('Juego modelo cargado desde el cuaderno. Puedes corregir directamente o volver a grabar tu partida.');
        app.resultados = (p.alumnos || []).filter((x) => CX.alumnos.some((a) => a.id === x.id)).map((x) => {
          const r = { id: x.id, nombre: '', archivo: x.archivo, pj: x.pj, captura: x.captura, editadas: x.editadas || {}, notas: x.notas || {}, manual: x.manual || {}, detalle: {} };
          if (r.pj) analizar(r); else r.error = x.error || 'sin datos';
          return r;
        });
        ordenarResultados();
      } catch (err) { console.error(err); estadoEsc('No se pudo abrir el modelo guardado en el cuaderno: ' + esc(err.message || err)); }
      finally { CX.restaurando = false; }
    }
    pintarManuales();
    pintarFilas();
    CX.listo = true;
    if (app.resultados.length && app.apartados.length) pintarOrig();
  }

  window.addEventListener('message', (ev) => {
    const d = ev.data;
    if (ev.source !== window.parent || !d || d.origen !== 'cuaderno-lomloe') return;
    if (d.tipo === 'init') iniciar(d);
    else if (d.tipo === 'flush') { if (CX.listo) enviar(true); else aCuaderno({ tipo: 'estado', notas: {}, proyecto: null }); }
  });

  window.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('en-cuaderno');
    // El paso 3 se ve desde el principio para que se vea la lista de alumnos
    $('#paso3').classList.remove('oculto');
    $('#bAnadir').classList.add('oculto');
    $('#paso3 .ayuda').textContent = 'Los alumnos son los del cuaderno. Elige el .sb3 de cada uno, o arrastra varios a la vez aquí: se reparten solos por el nombre del archivo. Solo se corrigen los juegos nuevos; los ya corregidos conservan su nota.';
    $('#bVarios').textContent = 'Añadir varios .sb3 a la vez…';
    $('#bCorregir').textContent = 'Corregir los juegos añadidos';
    aCuaderno({ tipo: 'listo' });
  });
})();
