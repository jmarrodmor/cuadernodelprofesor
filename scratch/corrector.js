/* Corrector de juegos de Scratch: interfaz.
   motor.js ejecuta la partida del profesor; analizador.js relaciona lo que pasa con sus bloques y compara con los alumnos. */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmtN = n => (Math.round(n * 10) / 10).toString().replace('.', ',');
const IMP = { bajo: 1, medio: 2, alto: 3 };
const NOM_IMP = { bajo: 'baja', medio: 'media', alto: 'alta' };
const app = { nombreModelo: '', buf: null, modelo: null, apartados: [], resultados: [], grabando: false, entradas: [], manuales: [], capturaModelo: null };
// Nombre que se ve de un ítem: el que le haya puesto el profesor o el automático (lo que se evalúa no cambia)
const tituloAp = a => (a.nombre && a.nombre.trim()) || a.titulo;
let motor;

function preparar() {
  motor = new Motor($('#escenario'));
  motor.alEvento = e => { if (app.grabando) anotar(e); };
  conectarZona($('#zonaModelo'), $('#fModelo'), f => cargarModelo(f[0]));
  conectarZona($('#zonaGrab'), $('#fGrab'), f => cargarPartida(f[0]));
  $('#bGrabar').onclick = empezarGrabacion;
  $('#bBandera').onclick = () => { if (app.grabando) { entrada({ flag: true }); anotarTexto('<b>⚑ Bandera verde: empieza otra partida</b>'); $('#escenario').focus(); } };
  $('#bParar').onclick = terminarGrabacion;
  $('#bGuardar').onclick = guardarPartida;
  $('#respuesta').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); enviarRespuesta(); } });
  $('#bResponder').onclick = enviarRespuesta;
  const cv = $('#escenario');
  const pos = e => { const r = cv.getBoundingClientRect(); return [Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))]; };
  cv.addEventListener('mousemove', e => { if (app.grabando) entrada({ m: pos(e) }); });
  cv.addEventListener('mousedown', e => { if (!app.grabando) return; cv.focus(); entrada({ m: pos(e), d: true }); e.preventDefault(); });
  window.addEventListener('mouseup', e => { if (app.grabando && motor._down) entrada({ m: pos(e), d: false }); });
  window.addEventListener('keydown', e => {
    if (!app.grabando || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.key.startsWith('Arrow') || e.key === ' ') e.preventDefault();
    entrada({ k: e.key, d: true });
  });
  window.addEventListener('keyup', e => { if (!app.grabando || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return; entrada({ k: e.key, d: false }); });
  $('#bAnadir').onclick = () => nuevaFila();
  $('#bVarios').onclick = () => $('#fVarios').click();
  $('#fVarios').onchange = e => { anadirArchivos([...e.target.files]); e.target.value = ''; };
  $('#paso3').addEventListener('dragover', e => e.preventDefault());
  $('#paso3').addEventListener('drop', e => { e.preventDefault(); anadirArchivos([...e.dataTransfer.files].filter(f => /\.sb3$/i.test(f.name))); });
  $('#bCorregir').onclick = corregirTodo;
  $('#bCSV').onclick = exportarCSV;
  $('#bTodos').onclick = () => { app.apartados.forEach(a => a.on = true); pintarApartados(); recalcular(); };
  $('#bNinguno').onclick = () => { app.apartados.forEach(a => a.on = false); pintarApartados(); recalcular(); };
  $('#bManual').onclick = () => { app.manuales.push({ id: 'm' + Date.now().toString(36), nombre: app.manuales.length ? 'Ítem manual' : 'Apariencia', imp: 'medio' }); pintarManuales(); recalcular(); };
  nuevaFila();
}
function conectarZona(zona, input, alSoltar) {
  zona.onclick = () => input.click();
  zona.tabIndex = 0;
  zona.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } };
  input.onchange = e => { if (e.target.files.length) alSoltar([...e.target.files]); e.target.value = ''; };
  zona.addEventListener('dragover', e => { e.preventDefault(); e.stopPropagation(); zona.classList.add('encima'); });
  zona.addEventListener('dragleave', () => zona.classList.remove('encima'));
  zona.addEventListener('drop', e => { e.preventDefault(); e.stopPropagation(); zona.classList.remove('encima'); if (e.dataTransfer.files.length) alSoltar([...e.dataTransfer.files]); });
}

function estadoEsc(html) { $('#estadoEsc').innerHTML = html; }
async function cargarModelo(file) {
  if (!file) return;
  try {
    const buf = await file.arrayBuffer();
    estadoEsc('Cargando…');
    app.modelo = Analizador.extraer(await Analizador.leerProyecto(buf));
    await motor.cargar(buf);
    app.buf = buf; app.nombreModelo = file.name; app.apartados = []; app.resultados = []; app.ejecutados = null; app.duracion = 0; app.capturaModelo = null;
    $('#nombreModelo').textContent = file.name;
    estadoEsc('Juego cargado. Ya puedes corregir. Si quieres afinar, pulsa <b>Empezar a grabar</b> y juega: lo que no pase en tu partida quedará desmarcado.');
    $('#bGrabar').disabled = false; $('#bGuardar').disabled = true;
    $('#paso4').classList.add('oculto');
    prepararActores();
  } catch (err) { console.error(err); estadoEsc('<span style="color:var(--mal)">No se pudo abrir el archivo: ' + esc(err.message || err) + '</span>'); }
}
function entrada(e) { e.f = motor.frame; motor.entrada(e); }
async function empezarGrabacion() {
  if (!app.buf) return;
  await motor.cargar(app.buf);
  motor.ejecutados.clear();
  $('#registro').innerHTML = '';
  app.grabando = true;
  $('#bGrabar').disabled = true; $('#bParar').disabled = false; $('#bBandera').disabled = false; $('#bGuardar').disabled = true;
  $('#escenario').classList.add('grabando'); $('#escenario').focus();
  entrada({ flag: true });
  anotarTexto('<b>⚑ Bandera verde: empieza la partida</b>');
  const t0 = performance.now(); const f0 = motor.frame;
  const bucle = async () => {
    if (!app.grabando) return;
    const toca = f0 + Math.floor((performance.now() - t0) / DT);
    let n = 0;
    while (motor.frame < toca && n < 4 && app.grabando) { await motor.paso(); n++; }
    const parado = motor.prev && motor.prev.hilos === 0;
    estadoEsc('<span class="rec"></span>Grabando… ' + fmtSeg(motor.frame) + (parado ? ' · el juego se ha detenido: pulsa <b>⚑ Bandera verde</b> para jugar otra vez o <b>Terminar</b>' : ' · haz clic en el escenario si las teclas no responden'));
    const caja = $('#cajaPregunta');
    if (motor.pregunta) { if (caja.classList.contains('oculto')) { caja.classList.remove('oculto'); $('#textoPregunta').textContent = motor.pregunta.texto || 'Responde:'; $('#respuesta').value = ''; $('#respuesta').focus(); } }
    else if (!caja.classList.contains('oculto')) caja.classList.add('oculto');
    requestAnimationFrame(bucle);
  };
  requestAnimationFrame(bucle);
}
function enviarRespuesta() {
  if (!app.grabando || !motor.pregunta) return;
  entrada({ r: $('#respuesta').value });
  $('#cajaPregunta').classList.add('oculto');
  $('#escenario').focus();
}
let ultimoAnotado = null;
function anotarTexto(html, ev) { const d = document.createElement('div'); ultimoAnotado = { d, ev }; d.innerHTML = '<span class="t">' + fmtSeg(motor.frame) + '</span>' + html; const r = $('#registro'); r.appendChild(d); r.scrollTop = r.scrollHeight; }
function anotar(e) {
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
  else if (e.tipo === 'suelta') t = 'Arrastras ' + (e.clon ? 'un clon de ' : '') + '«' + esc(e.obj) + '»';
  else if (e.tipo === 'sonido') t = '«' + esc(e.obj) + '» toca un sonido';
  else if (e.tipo === 'salta') t = '«' + esc(e.obj) + '» salta a (' + Math.round(e.a[0]) + ', ' + Math.round(e.a[1]) + ')';
  else if (e.tipo === 'stop') t = '<b>El juego se ha detenido</b>';
  if (!t) return;
  if (e.tipo === 'pregunta' && ultimoAnotado && ultimoAnotado.ev && ultimoAnotado.ev.tipo === 'dice' && ultimoAnotado.ev.texto === e.texto) ultimoAnotado.d.remove();
  if (['var', 'oculta', 'salta'].includes(e.tipo)) {
    const tq = motor.toques.filter(q => q.f >= e.f - 1 && q.f <= e.f);
    if (tq.length) t += ' <span style="color:var(--suave)">(' + esc([...new Set(tq.map(q => (q.clon ? 'clon de ' : '') + q.por + (q.tipo === 'objeto' ? ' toca ' + q.que : q.tipo === 'borde' ? ' toca el borde' : ' toca el color ' + q.que)))].slice(0, 3).join('; ')) + ')</span>';
  }
  anotarTexto(t, e);
}
async function terminarGrabacion() {
  if (!app.grabando) return;
  app.grabando = false;
  app.ejecutados = Object.fromEntries(motor.ejecutados);
  app.duracion = motor.frame;
  $('#cajaPregunta').classList.add('oculto');
  $('#escenario').classList.remove('grabando');
  $('#bParar').disabled = true; $('#bBandera').disabled = true; $('#bGrabar').disabled = false; $('#bGuardar').disabled = false;
  motor.parar();
  estadoEsc('Partida terminada (' + fmtSeg(app.duracion) + '). Puedes volver a grabar o guardarla para otro día.');
  prepararActores();
}
function prepararActores() {
  app.apartados = Analizador.crearActores(app.modelo, app.ejecutados);
  app.resultados = []; $('#paso4').classList.add('oculto');
  const nObj = app.apartados.filter(a => a.tipo === 'objeto').reduce((n, a) => n + a.miembros.length, 0);
  const nVar = app.apartados.filter(a => a.tipo === 'variable').length;
  const grupos = app.apartados.flatMap(a => a.grupos);
  let h = '<span><b>' + (app.apartados.length - 1) + '</b> actores (' + nObj + ' objetos con programas, ' + nVar + ' variables…)</span><span><b>' + grupos.length + '</b> comportamientos</span>';
  if (app.ejecutados) { const v = grupos.filter(g => g.visto).length; h += '<span>tu partida (' + fmtSeg(app.duracion || 0) + '): han pasado <b>' + v + '</b> de ' + grupos.length + '</span>'; }
  else h += '<span>sin partida: se evalúa todo</span>';
  const rv = app.apartados.revision;
  if (rv) h += '<span>✔ revisados <b>' + rv.objetos + '</b> objetos (con el escenario), <b>' + rv.programas + '</b> programas y <b>' + rv.bloques + '</b> bloques' + (rv.sinActor.length ? '' : ': todos asignados a algún actor') + '</span>';
  $('#resumenModelo').innerHTML = h;
  if (rv && rv.sinActor.length) $('#resumenModelo').insertAdjacentHTML('beforeend', '<div class="aviso" style="width:100%">Bloques sin actor: ' + esc(rv.sinActor.slice(0, 8).join('; ')) + '</div>');
  if (rv && rv.sueltos) $('#resumenModelo').insertAdjacentHTML('beforeend', '<div class="aviso" style="width:100%">Tu modelo tiene ' + rv.sueltos + ' grupo(s) de bloques sueltos, sin bloque de evento arriba: no se ejecutan y no se evalúan.</div>');
  pintarApartados();
  $('#paso2').classList.remove('oculto'); $('#paso3').classList.remove('oculto');
}
function guardarPartida() {
  const datos = { app: 'corrector-scratch', version: 3, modelo: app.nombreModelo, sb3: ab2b64(app.buf), ejecutados: app.ejecutados, duracion: app.duracion };
  descargar(app.nombreModelo.replace(/\.sb3$/i, '') + '-partida.json', JSON.stringify(datos), 'application/json');
}
async function cargarPartida(file) {
  try {
    const d = JSON.parse(await file.text());
    if (d.app !== 'corrector-scratch' || !d.ejecutados) throw new Error('no es una partida guardada con esta versión del corrector');
    app.buf = b642ab(d.sb3); app.nombreModelo = d.modelo; app.ejecutados = d.ejecutados; app.duracion = d.duracion; app.capturaModelo = null;
    app.modelo = Analizador.extraer(await Analizador.leerProyecto(app.buf));
    await motor.cargar(app.buf);
    $('#nombreModelo').textContent = d.modelo + ' (partida cargada)';
    $('#registro').innerHTML = '<div class="vacio">Partida cargada (' + fmtSeg(d.duracion || 0) + ').</div>';
    $('#bGrabar').disabled = false; $('#bGuardar').disabled = false;
    estadoEsc('Partida cargada. Puedes corregir directamente o volver a grabar.');
    prepararActores();
  } catch (err) { console.error(err); estadoEsc('<span style="color:var(--mal)">No se pudo cargar la partida: ' + esc(err.message || err) + '</span>'); }
}
function ab2b64(buf) { const u = new Uint8Array(buf); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); }
function b642ab(b) { const s = atob(b); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u.buffer; }

function codigoMarcado(a) {
  const marc = new Set(a.marcadas || []);
  return a.codigo.map((l, i) => marc.has(a.lineaIds[i]) && !/^\s*si no$/.test(l) ? '<b>' + esc(l) + '</b>' : esc(l)).join('\n');
}
const ICONO = { elementos: '📦', objeto: '🧍', fondo: '🖼️', juego: '⏹', variable: '🔢', lista: '📋', pregunta: '❓', otros: '•' };
function pintarApartados() {
  const tb = $('#tablaCriterios'); tb.innerHTML = '';
  app.apartados.forEach((a, i) => {
    const tr = document.createElement('tr');
    let sub = '';
    if (a.tipo === 'elementos') sub = '<div class="donde">Se compara cuántos objetos, fondos, variables y listas tiene el alumno.</div>';
    else sub = '<div class="donde">Todos los bloques que le afectan, estén en el objeto que estén:</div><ul class="comport">' + a.grupos.map(g =>
        '<li><label><input type="checkbox" data-g="' + g.id + '"' + (g.on ? ' checked' : '') + '> ' + esc(g.titulo) + '</label>' +
        (app.ejecutados ? (g.visto ? '<span class="veces">' + g.veces + (g.veces === 1 ? ' vez' : ' veces') + '</span>' : '<span class="veces no">no ha pasado en tu partida</span>') : '') +
        ' <span class="donde-mini">(bloques en ' + esc(g.objeto) + ')</span>' +
        '<details class="codigo"><summary>ver bloques</summary><div class="bloques">' + codigoMarcado(g) + '</div></details></li>').join('') + '</ul>';
    tr.innerHTML = '<td class="c1"><input type="checkbox" aria-label="Evaluar ' + esc(a.titulo) + '"' + (a.on ? ' checked' : '') + '></td>' +
      '<td><div class="nombre-ap"><b>' + (i + 1) + '. ' + (ICONO[a.tipo] || '') + '</b> <input type="text" class="in-nombre" value="' + esc(tituloAp(a)) + '" aria-label="Nombre del ítem ' + (i + 1) + '" title="Puedes cambiar el nombre; lo que se evalúa no cambia"></div>' +
      (a.nombre && a.nombre.trim() && a.nombre.trim() !== a.titulo ? '<div class="donde">Nombre automático: ' + esc(a.titulo) + '</div>' : '') + sub + '</td>' +
      '<td style="width:190px;white-space:nowrap">Importancia <select aria-label="Importancia"><option value="bajo">baja</option><option value="medio">media</option><option value="alto">alta</option></select></td>';
    tr.querySelector('input').onchange = e => { a.on = e.target.checked; recalcular(); };
    const inN = tr.querySelector('input.in-nombre');
    inN.onchange = () => { const v = inN.value.trim(); a.nombre = v && v !== a.titulo ? v : ''; pintarApartados(); recalcular(); };
    inN.onkeydown = e => { if (e.key === 'Enter') inN.blur(); };
    tr.querySelectorAll('input[data-g]').forEach(c => c.onchange = () => { const g = a.grupos.find(x => x.id === c.dataset.g); g.on = c.checked; recalcular(); });
    const s = tr.querySelector('select'); s.value = a.imp; s.onchange = e => { a.imp = e.target.value; recalcular(); };
    tb.appendChild(tr);
  });
  pintarManuales();
}
/* --- Ítems de nota manual (apariencia, trabajo observado…): la nota la pone el profesor --- */
function pintarManuales() {
  const box = $('#manuales'); if (!box) return;
  box.innerHTML = '';
  app.manuales.forEach(m => {
    const f = document.createElement('div'); f.className = 'mrow';
    f.innerHTML = '<span>✎</span><input type="text" class="in-nombre" aria-label="Nombre del ítem manual" placeholder="Nombre del ítem"><label>Importancia <select aria-label="Importancia"><option value="bajo">baja</option><option value="medio">media</option><option value="alto">alta</option></select></label><button class="sec" title="Quitar este ítem" aria-label="Quitar">✕</button>';
    const [, inp, lab, quitar] = f.children, sel = lab.querySelector('select');
    inp.value = m.nombre; sel.value = m.imp;
    inp.onchange = () => { m.nombre = inp.value.trim() || 'Ítem manual'; recalcular(); };
    sel.onchange = () => { m.imp = sel.value; recalcular(); };
    quitar.onclick = () => { app.manuales = app.manuales.filter(x => x !== m); app.resultados.forEach(r => { if (r.manual) delete r.manual[m.id]; }); pintarManuales(); recalcular(); };
    box.appendChild(f);
  });
}
// Captura del escenario de un juego al poco de pulsar la bandera verde (para ver su aspecto)
async function capturar(buf) {
  try {
    await motor.cargar(buf);
    motor.bandera();
    for (let i = 0; i < 50; i++) { await motor.paso(); if (i % 10 === 9) await new Promise(r => setTimeout(r, 0)); }
    motor.renderer.draw();
    const c = document.createElement('canvas'); c.width = 480; c.height = 360;
    c.getContext('2d').drawImage($('#escenario'), 0, 0, 480, 360);
    motor.parar();
    return c.toDataURL('image/jpeg', 0.75);
  } catch (e) { console.warn('captura', e); return null; }
}
function lightbox(fotos) {
  const o = document.createElement('div'); o.className = 'lb'; o.onclick = () => o.remove();
  o.innerHTML = '<div class="lb-fotos">' + fotos.filter(f => f.src).map(f => '<figure><img src="' + f.src + '" alt="' + esc(f.pie) + '"><figcaption>' + esc(f.pie) + '</figcaption></figure>').join('') + '</div>';
  document.body.appendChild(o);
}

function nuevaFila(nombre = '', file = null) {
  const div = document.createElement('div'); div.className = 'alumno';
  div.innerHTML = '<input type="text" placeholder="Nombre del alumno" aria-label="Nombre del alumno"><div class="archivo" tabindex="0">Elegir o arrastrar su .sb3</div><input type="file" accept=".sb3"><button class="sec" title="Quitar" aria-label="Quitar">✕</button>';
  const [txt, zona, inp, quitar] = div.children;
  txt.value = nombre;
  const poner = f => { div._file = f; zona.textContent = f.name; zona.classList.add('ok'); if (!txt.value) txt.value = nombreDesdeArchivo(f.name); };
  if (file) poner(file);
  zona.onclick = () => inp.click();
  zona.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inp.click(); } };
  inp.onchange = e => { if (e.target.files[0]) poner(e.target.files[0]); };
  zona.addEventListener('dragover', e => { e.preventDefault(); e.stopPropagation(); });
  zona.addEventListener('drop', e => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.files[0]) poner(e.dataTransfer.files[0]); });
  quitar.onclick = () => { div.remove(); if (!$('#alumnos').children.length) nuevaFila(); };
  $('#alumnos').appendChild(div);
  return div;
}
function nombreDesdeArchivo(n) { return n.replace(/\.sb3$/i, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim(); }
function anadirArchivos(files) {
  for (const f of files) {
    const vacia = [...$('#alumnos').children].find(d => !d._file && !d.querySelector('input[type=text]').value);
    if (vacia) vacia.remove();
    nuevaFila('', f);
  }
}

async function corregirTodo() {
  const filas = [...$('#alumnos').children].filter(d => d._file);
  const prog = $('#progCorr'); prog.classList.remove('oculto');
  if (!app.apartados.length) { $('#txtCorr').textContent = 'Primero sube tu juego modelo y graba tu partida.'; return; }
  if (!activos().length) { $('#txtCorr').textContent = 'Marca al menos un ítem para evaluar.'; return; }
  if (!filas.length) { $('#txtCorr').textContent = 'Añade al menos un juego de alumno: elige su archivo .sb3.'; return; }
  if (app.grabando) { $('#txtCorr').textContent = 'Termina primero la grabación de tu partida.'; return; }
  $('#bCorregir').disabled = true; $('#bGrabar').disabled = true;
  const previos = new Map(app.resultados.map(r => [r.nombre, r]));
  app.resultados = [];
  if (!app.capturaModelo && app.buf) { $('#txtCorr').textContent = 'Haciendo la captura de tu juego…'; app.capturaModelo = await capturar(app.buf); }
  for (let i = 0; i < filas.length; i++) {
    const d = filas[i];
    const nombre = d.querySelector('input[type=text]').value.trim() || nombreDesdeArchivo(d._file.name);
    $('#txtCorr').textContent = 'Corrigiendo a ' + nombre + ' (' + (i + 1) + ' de ' + filas.length + ')…';
    $('#barraCorr').style.width = (100 * i / filas.length) + '%';
    await new Promise(r => setTimeout(r, 0));
    try {
      const buf = await d._file.arrayBuffer();
      const alumno = Analizador.extraer(await Analizador.leerProyecto(buf));
      const r = Analizador.corregirActores(app.apartados, alumno);
      const prev = previos.get(nombre);
      const res = { nombre, notas: {}, detalle: r, editadas: {}, sueltos: alumno.sueltos, manual: (prev && prev.manual) || {} };
      $('#txtCorr').textContent = 'Haciendo la captura del juego de ' + nombre + '…';
      res.captura = await capturar(buf);
      app.resultados.push(res);
    } catch (err) {
      console.error(err);
      app.resultados.push({ nombre, notas: {}, detalle: {}, error: String(err.message || err), editadas: {} });
    }
  }
  $('#barraCorr').style.width = '100%';
  $('#txtCorr').textContent = 'Corrección terminada: ' + filas.length + (filas.length === 1 ? ' juego.' : ' juegos.');
  $('#bCorregir').disabled = false; $('#bGrabar').disabled = false;
  if (app.buf) await motor.cargar(app.buf);
  pintarResultados();
  $('#paso4').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const activos = () => app.apartados.filter(a => a.on);
// Nota de un actor: media de sus comportamientos marcados (salvo que el profesor la haya cambiado)
function notaAp(r, a) {
  if (r.editadas[a.id]) return r.notas[a.id];
  const x = r.detalle[a.id]; if (!x) return undefined;
  if (a.tipo === 'elementos') return x.nota;
  const gs = a.grupos.filter(g => g.on && typeof x.grupos[g.id] === 'number');
  if (!gs.length) return 0;
  return Math.round(gs.reduce((s, g) => s + x.grupos[g.id], 0) / gs.length * 2) / 2;
}
function notaFinal(r) {
  let s = 0, p = 0;
  for (const a of activos()) { const n = notaAp(r, a); const w = IMP[a.imp]; p += w; s += w * (typeof n === 'number' ? n : 0); }
  // ítems manuales: cuentan como uno más, solo si tienen nota
  for (const m of app.manuales) { const v = r.manual && r.manual[m.id]; if (typeof v !== 'number') continue; p += IMP[m.imp]; s += IMP[m.imp] * v; }
  return p ? s / p : 0;
}
const corto = a => { if (a.nombre && a.nombre.trim()) { const n = a.nombre.trim(); return n.length > 26 ? n.slice(0, 24) + '…' : n; } const t = a.tipo === 'elementos' ? 'Elementos' : a.titulo.replace(/^Objeto «(.*)»$/, '$1').replace(/^Variable «(.*)»$/, '$1').replace(/ \(\d+ objetos:.*\)$/, m => ' ×' + m.match(/\d+/)[0]); return t.length > 26 ? t.slice(0, 24) + '…' : t; };
const claseNota = n => n >= 7 ? 'n-alta' : n >= 5 ? 'n-media' : 'n-baja';
const numAp = a => app.apartados.indexOf(a) + 1;

function pintarResultados() {
  $('#paso4').classList.remove('oculto');
  const as = activos();
  const t = $('#tablaNotas');
  let h = '<tr><th>Alumno</th>' + as.map(a => '<th title="' + esc(tituloAp(a)) + '"><span class="ap">' + numAp(a) + '</span> ' + (ICONO[a.tipo] || '') + '<br>' + esc(corto(a)) + '<br><span style="font-weight:400;opacity:.8">' + NOM_IMP[a.imp] + '</span></th>').join('') +
    app.manuales.map(m => '<th class="th-man" title="Ítem de nota manual: escribe tú la nota">✎<br>' + esc(m.nombre) + '<br><span style="font-weight:400;opacity:.8">' + NOM_IMP[m.imp] + '</span></th>').join('') + '<th>Nota final</th></tr>';
  app.resultados.forEach((r, i) => {
    h += '<tr><td>' + esc(r.nombre) + (r.error ? ' <span class="etq no">error</span>' : '') + '</td>';
    for (const a of as) {
      const n = notaAp(r, a);
      h += '<td><input aria-label="Nota de ' + esc(r.nombre) + ' en ' + esc(corto(a)) + '" data-i="' + i + '" data-c="' + a.id + '" value="' + (typeof n === 'number' ? fmtN(n) : '') + '" class="' + (r.editadas[a.id] ? 'editada ' : '') + (typeof n === 'number' ? claseNota(n) : '') + '"></td>';
    }
    for (const m of app.manuales) {
      const v = r.manual && r.manual[m.id];
      h += '<td><input class="manual ' + (typeof v === 'number' ? claseNota(v) : '') + '" aria-label="' + esc(m.nombre) + ' de ' + esc(r.nombre) + '" placeholder="—" title="Nota manual (0–10). Vacía = no cuenta." data-i="' + i + '" data-m="' + m.id + '" value="' + (typeof v === 'number' ? fmtN(v) : '') + '"></td>';
    }
    const f = notaFinal(r);
    h += '<td class="final ' + claseNota(f) + '">' + fmtN(f) + '</td></tr>';
  });
  t.innerHTML = h;
  t.querySelectorAll('input').forEach(inp => inp.onchange = () => {
    const r = app.resultados[+inp.dataset.i]; const v = parseFloat(inp.value.replace(',', '.'));
    if (inp.dataset.m) { r.manual = r.manual || {}; if (isNaN(v)) delete r.manual[inp.dataset.m]; else r.manual[inp.dataset.m] = Math.max(0, Math.min(10, v)); pintarResultados(); return; }
    if (!isNaN(v)) { r.notas[inp.dataset.c] = Math.max(0, Math.min(10, v)); r.editadas[inp.dataset.c] = true; }
    else if (inp.value.trim() === '') { delete r.editadas[inp.dataset.c]; }
    pintarResultados();
  });
  const det = $('#detalles'); det.innerHTML = '';
  const abiertos = new Set([...document.querySelectorAll('details.detalle[open]')].map(d => d.dataset.n));
  app.resultados.forEach(r => {
    const d = document.createElement('details'); d.className = 'detalle'; d.dataset.n = r.nombre; if (abiertos.has(r.nombre)) d.open = true;
    let b = '<summary>' + esc(r.nombre) + ' — ' + fmtN(notaFinal(r)) + '</summary><div class="cuerpo">';
    if (r.error) b += '<div class="aviso">No se pudo leer el juego: ' + esc(r.error) + '</div>';
    if (r.captura) b += '<figure class="captura"><img src="' + r.captura + '" alt="Captura del juego de ' + esc(r.nombre) + '" title="Pulsa para verla junto a la de tu modelo"><figcaption>📷 Su juego al empezar (pulsa para compararlo con el tuyo)</figcaption></figure>';
    const mx = app.manuales.filter(m => r.manual && typeof r.manual[m.id] === 'number');
    if (mx.length) b += '<div class="corresp">✎ ' + mx.map(m => esc(m.nombre) + ': ' + fmtN(r.manual[m.id])).join(' · ') + '</div>';
    if (r.sueltos) b += '<div class="aviso">Tiene ' + r.sueltos + (r.sueltos === 1 ? ' grupo de bloques suelto' : ' grupos de bloques sueltos') + ' (sin bloque de evento arriba). Esos bloques no se ejecutan nunca y no cuentan.</div>';
    for (const a of as) {
      const x = r.detalle[a.id]; if (!x) continue;
      b += '<h4>' + numAp(a) + '. ' + (ICONO[a.tipo] || '') + ' ' + esc(tituloAp(a)) + ' — ' + fmtN(notaAp(r, a) ?? 0) + (r.editadas[a.id] ? ' (editada)' : '') + '</h4>';
      if (x.corresp) b += '<div class="corresp">' + esc(x.corresp) + '</div>';
      b += '<ul>';
      for (const z of x.det) {
        if (z.grupo && !z.grupo.on) continue;
        if (z.grupo) b += '<li class="' + (z.nota >= 9 ? 'ok' : z.nota === 0 ? 'mal' : 'medio') + '"><b>' + fmtN(z.nota) + '</b> · ' + esc(z.grupo.titulo) + '<ul class="sub">' + z.det.map(l => '<li class="' + (l.medio ? 'medio' : l.ok ? 'ok' : 'mal') + '">' + esc(l.t) + '</li>').join('') + '</ul></li>';
        else b += z.det.map(l => '<li class="' + (l.medio ? 'medio' : l.ok ? 'ok' : 'mal') + '">' + esc(l.t) + '</li>').join('');
      }
      b += '</ul>';
    }
    d.innerHTML = b + '</div>';
    const im = d.querySelector('figure.captura img');
    if (im) im.onclick = () => lightbox([{ src: r.captura, pie: r.nombre + ' · al empezar' }, { src: app.capturaModelo, pie: 'Tu modelo · al empezar' }]);
    det.appendChild(d);
  });
}
function recalcular() { if (app.resultados.length) pintarResultados(); }

function exportarCSV() {
  const as = activos();
  const q = s => '"' + String(s).replace(/"/g, '""') + '"';
  let s = [q('Alumno'), ...as.map(a => q(numAp(a) + '. ' + tituloAp(a) + ' (importancia ' + NOM_IMP[a.imp] + ')')), ...app.manuales.map(m => q(m.nombre + ' (manual, importancia ' + NOM_IMP[m.imp] + ')')), q('Nota final')].join(';') + '\n';
  for (const r of app.resultados) s += [q(r.nombre), ...as.map(a => fmtN(notaAp(r, a) ?? 0)), ...app.manuales.map(m => r.manual && typeof r.manual[m.id] === 'number' ? fmtN(r.manual[m.id]) : ''), fmtN(notaFinal(r))].join(';') + '\n';
  descargar('notas-' + app.nombreModelo.replace(/\.sb3$/i, '') + '.csv', '﻿' + s, 'text/csv');
}
async function descargar(nombre, contenido, tipo) {
  if (window.claude && window.claude.use) {
    try { const dl = await window.claude.use('downloads'); if (dl) { await dl.save({ filename: nombre, data: new Blob([contenido], { type: tipo }) }); return; } }
    catch (e) { if (e && e.code === 'declined') return; console.warn(e); }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([contenido], { type: tipo })); a.download = nombre; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

window.addEventListener('DOMContentLoaded', preparar);
