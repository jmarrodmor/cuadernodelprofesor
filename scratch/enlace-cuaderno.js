'use strict';
/* =========================================================================
   ENLACE CON EL CUADERNO DE EVALUACIÓN
   Solo actúa cuando el corrector se abre dentro del cuaderno
   (scratch/index.html?cuaderno=1 en un marco). Entonces:
   - la lista de alumnos la manda el cuaderno (no se escriben nombres);
   - los .sb3 se reparten solos por el nombre del archivo;
   - todo (juego modelo, grabación, criterios, notas y detalle) se envía al
     cuaderno y se guarda en su archivo con «💾 Guardar Archivo».
   Los .sb3 de los alumnos no se guardan (ocuparían demasiado): si cambias
   el modelo, hay que volver a añadirlos para corregir otra vez.
   Si el corrector se abre solo, este archivo no hace nada.
   ========================================================================= */
const CUADERNO = (() => { try { return new URLSearchParams(location.search).get('cuaderno') === '1' && window.parent !== window; } catch (e) { return false; } })();

if (CUADERNO) (() => {
  const CX = { alumnos: [], titulo: '', timer: null, listo: false, b64: null, b64de: null, sinDueno: [] };
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

  /* ---------- Filas de alumnos (vienen del cuaderno) ---------- */
  const filaDe = (id) => [...$('#alumnos').children].find((d) => d._id === id);
  const resDe = (id) => app.resultados.find((r) => r.id === id);
  const vigente = (r) => !!(r && !r.error && app.datos && r.datosId && r.datosId === app.datosId);

  function estadoFila(div) {
    const r = resDe(div._id), est = div.querySelector('.est');
    if (!est) return;
    if (div._file && (!r || r.archivo !== div._file.name || !vigente(r))) { est.textContent = 'por corregir'; est.className = 'est'; return; }
    if (!r) { est.textContent = 'sin juego'; est.className = 'est'; return; }
    if (r.error) { est.textContent = 'error'; est.className = 'est n-baja'; return; }
    if (!vigente(r)) { est.textContent = 'corregido con otro modelo'; est.className = 'est n-media'; return; }
    const f = notaFinal(r); est.textContent = fmtN(f); est.className = 'est final ' + claseNota(f);
  }
  function pintarFilas() {
    const cont = $('#alumnos'); cont.innerHTML = '';
    for (const a of CX.alumnos) {
      const div = document.createElement('div'); div.className = 'alumno'; div._id = a.id;
      div.innerHTML = '<input type="text" readonly title="Alumno del cuaderno de evaluación"><div class="archivo">Elegir o arrastrar su .sb3</div><input type="file" accept=".sb3"><span class="est"></span>';
      const [txt, zona, inp] = div.children;
      txt.value = a.nombre;
      const r = resDe(a.id);
      if (r && r.archivo) zona.textContent = r.archivo + ' (ya corregido; elige otro para volver a corregir)';
      div._poner = (f) => { div._file = f; zona.textContent = f.name; zona.classList.add('ok'); estadoFila(div); };
      zona.onclick = () => inp.click();
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

  corregirTodo = async function () {
    const filas = [...$('#alumnos').children].filter((d) => d._file && (() => { const r = resDe(d._id); return !r || r.archivo !== d._file.name || !vigente(r); })());
    if (!app.datos) { mostrarProg('Primero graba tu partida con el juego modelo.'); return; }
    if (!filas.length) { mostrarProg('No hay juegos nuevos por corregir: elige el .sb3 de algún alumno (o arrastra varios a la vez).'); return; }
    $('#progCorr').classList.remove('oculto');
    $('#bCorregir').disabled = true; $('#bGrabar').disabled = true; aCuaderno({ tipo: 'ocupado', valor: true });
    $('#miniEsc').appendChild($('#escenario'));
    try {
      for (let i = 0; i < filas.length; i++) {
        const d = filas[i], a = CX.alumnos.find((x) => x.id === d._id), nombre = a ? a.nombre : '';
        $('#barraCorr').style.width = (100 * i / filas.length) + '%';
        let nuevo;
        try {
          const buf = await d._file.arrayBuffer();
          const r = await corregirAlumno(buf, app.datos, app.grab, (paso) => { $('#txtCorr').textContent = 'Corrigiendo a ' + nombre + ' (' + (i + 1) + ' de ' + filas.length + '): ' + paso + '…'; });
          nuevo = { id: d._id, nombre, archivo: d._file.name, datosId: app.datosId, notas: Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v.nota])), detalle: r, editadas: {} };
        } catch (err) {
          console.error(err);
          nuevo = { id: d._id, nombre, archivo: d._file.name, datosId: app.datosId, notas: {}, detalle: {}, error: String(err.message || err), editadas: {} };
        }
        app.resultados = app.resultados.filter((x) => x.id !== d._id).concat(nuevo);
        ordenarResultados(); estadoFila(d); pintarResultados();   // cada alumno se envía al cuaderno nada más corregirlo
      }
      $('#barraCorr').style.width = '100%';
      $('#txtCorr').textContent = 'Corrección terminada (' + filas.length + ' juego(s)).';
    } finally {
      $('#cajaEscenario').appendChild($('#escenario'));
      $('#bCorregir').disabled = false; $('#bGrabar').disabled = false; aCuaderno({ tipo: 'ocupado', valor: false });
      await motor.cargar(app.modelo);
      estadoEsc('Corrección terminada.');
      enviar(true);
    }
  };
  function ordenarResultados() {
    const pos = new Map(CX.alumnos.map((a, i) => [a.id, i]));
    app.resultados.forEach((r) => { const a = CX.alumnos.find((x) => x.id === r.id); if (a) r.nombre = a.nombre; });
    app.resultados = app.resultados.filter((r) => pos.has(r.id)).sort((x, y) => pos.get(x.id) - pos.get(y.id));
  }

  // Resultados: los del modelo anterior y los que fallaron no tienen nota final
  const pintarOrig = pintarResultados;
  pintarResultados = function () {
    pintarOrig();
    $('#tablaNotas').querySelectorAll('tr').forEach((tr, i) => {
      const r = app.resultados[i - 1]; if (!r) return;
      const ult = tr.lastElementChild;
      if (!vigente(r)) { ult.textContent = '—'; ult.className = 'final'; tr.firstElementChild.insertAdjacentHTML('beforeend', r.error ? '' : ' <span class="etq no">modelo anterior: vuelve a corregir</span>'); }
    });
    [...$('#detalles').children].forEach((d, i) => { const r = app.resultados[i]; if (r && !vigente(r)) d.querySelector('summary').textContent = r.nombre + ' — ' + (r.error ? 'error' : 'corregido con otro modelo'); });
    if (!app.resultados.length) $('#paso4').classList.add('oculto');
    [...$('#alumnos').children].forEach(estadoFila);
    programarEnvio();
  };
  // Al subir otro juego modelo, la lista de alumnos sigue a la vista
  const cargarModeloOrig = cargarModelo;
  cargarModelo = async function (file) { await cargarModeloOrig(file); $('#paso3').classList.remove('oculto'); [...$('#alumnos').children].forEach(estadoFila); };
  recalcular = function () { if (app.resultados.length) pintarResultados(); else programarEnvio(); };

  // Cada grabación nueva (o cargada de un .json) tiene su identificador: las notas de otra grabación no valen
  const analizarOrig = analizarYMostrar;
  analizarYMostrar = async function () { app.datosId = 'g' + Date.now(); await analizarOrig(); recalcular(); enviar(true); };
  const cargarGrabOrig = cargarGrabacion;
  cargarGrabacion = async function (file) {
    const antes = app.datos; app.datosId = 'g' + Date.now();
    await cargarGrabOrig(file);
    if (app.datos && app.datos !== antes) { recalcular(); enviar(true); }
  };

  /* ---------- Envío al cuaderno ---------- */
  function proyecto() {
    if (app.modelo && CX.b64de !== app.modelo) { CX.b64 = ab2b64(app.modelo); CX.b64de = app.modelo; }
    return JSON.parse(JSON.stringify({
      tipo: 'proyecto-scratch', version: 1, guardado: Date.now(),
      modelo: app.modelo ? { nombre: app.nombreModelo, sb3: CX.b64 } : null,
      grab: app.datos ? app.grab : null, datos: app.datos || null, datosId: app.datos ? app.datosId : null,
      resultados: app.resultados.map(({ nombre, ...r }) => r),
    }));
  }
  function notas() {
    const n = {};
    if (app.datos) app.resultados.forEach((r) => { if (vigente(r)) n[r.id] = Math.round(notaFinal(r) * 100) / 100; });
    return n;
  }
  function enviar(forzar) {
    if (!CX.listo) return;
    clearTimeout(CX.timer);
    if (!forzar && app.grabando) return;
    aCuaderno({ tipo: 'estado', notas: notas(), proyecto: proyecto() });
    const n = Object.keys(notas()).length;
    $('#cxEstado').textContent = '✓ Enviado al cuaderno' + (n ? ' (' + n + ' nota(s))' : '') + ' a las ' + new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) + '.';
  }
  function programarEnvio() { if (!CX.listo) return; clearTimeout(CX.timer); CX.timer = setTimeout(() => enviar(false), 600); }

  /* ---------- Arranque con los datos del cuaderno ---------- */
  async function iniciar(d) {
    CX.alumnos = Array.isArray(d.alumnos) ? d.alumnos : []; CX.titulo = d.titulo || '';
    $('#barraCuaderno').innerHTML = '<b>📒 Conectado al Cuaderno de Evaluación</b>' + (CX.titulo ? ' · ' + esc(CX.titulo) : '') +
      '<div class="ayuda" style="margin:4px 0 0">Los alumnos vienen del cuaderno. Elige el .sb3 de cada uno o arrastra varios a la vez sobre el paso 3 (se reparten por el nombre del archivo). Todo se envía solo al cuaderno y se guarda al pulsar <b>💾 Guardar Archivo</b>.</div><div id="cxEstado" class="ayuda" style="margin:4px 0 0"></div>';
    $('#barraCuaderno').classList.remove('oculto');
    const p = d.proyecto;
    app.resultados = (p && Array.isArray(p.resultados)) ? p.resultados.map((r) => ({ editadas: {}, notas: {}, detalle: {}, ...r })) : [];
    ordenarResultados();
    if (p && p.modelo && p.modelo.sb3) {
      try {
        app.modelo = b642ab(p.modelo.sb3); app.nombreModelo = p.modelo.nombre || 'modelo.sb3'; CX.b64 = p.modelo.sb3; CX.b64de = app.modelo;
        app.grab = p.grab || null; app.datos = p.datos || null; app.datosId = p.datosId || null;
        $('#nombreModelo').textContent = app.nombreModelo + ' (guardado en el cuaderno)';
        estadoEsc('Cargando el juego modelo guardado…');
        await motor.cargar(app.modelo);
        $('#bGrabar').disabled = false;
        if (app.datos) {
          $('#bGuardar').disabled = false;
          $('#registro').innerHTML = '<div class="vacio">Grabación guardada en el cuaderno: ' + (app.grab ? fmtSeg(app.grab.frames) : '') + ' de partida.</div>';
          estadoEsc('Grabación cargada desde el cuaderno. Puedes corregir directamente o volver a grabar.');
          $('#paso2').classList.remove('oculto'); $('#progModelo').classList.add('oculto'); pintarCriterios();
          $('#paso3').classList.remove('oculto');
        } else estadoEsc('Juego cargado. Pulsa <b>Empezar a grabar</b> y juega.');
      } catch (err) { console.error(err); estadoEsc('No se pudo abrir el modelo guardado en el cuaderno: ' + esc(err.message || err)); }
    }
    pintarFilas();
    CX.listo = true;
    if (app.resultados.length && app.datos) pintarResultados();
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
