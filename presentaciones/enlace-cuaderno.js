'use strict';
/* =========================================================================
   ENLACE CON EL CUADERNO DE EVALUACIÓN
   Solo actúa cuando el corrector se abre dentro del cuaderno
   (presentaciones/index.html?cuaderno=1 en un marco). Entonces:
   - la lista de alumnos la manda el cuaderno (no hay que pegar la lista de clase);
   - al subir varias presentaciones, cada una va a su alumno buscando su nombre
     en el nombre del archivo, en el autor y en las diapositivas (como siempre);
   - todo (modelo, ítems marcados, importancias, lo leído de cada presentación,
     notas y cambios a mano) se envía al cuaderno y se guarda en su archivo
     con «💾 Guardar Archivo». Como se guarda lo leído de cada .pptx, al cambiar
     los ítems o el modelo se puede volver a corregir sin subirlas otra vez.
   Si el corrector se abre solo, este archivo no hace nada.
   ========================================================================= */
const EN_CUADERNO = (() => { try { return new URLSearchParams(location.search).get('cuaderno') === '1' && window.parent !== window; } catch (e) { return false; } })();

if (EN_CUADERNO) (() => {
  const CX = { alumnos: [], titulo: '', timer: null, listo: false, sinDueno: [] };
  const aCuaderno = (m) => window.parent.postMessage({ origen: 'corrector-presentaciones', ...m }, '*');
  document.documentElement.setAttribute('data-theme', 'light');   // el cuaderno es claro
  document.body.classList.add('en-cuaderno');

  // Paso 3: sin lista de clase ni filas sueltas; los alumnos son los del cuaderno
  document.querySelector('.classbox').hidden = true;
  $('#addStudent').hidden = true;
  $('#multiFile').parentElement.firstChild.textContent = 'Subir varias a la vez (se reparten solas)';
  $('section.step:nth-of-type(3) .sub').textContent = 'Los alumnos son los del cuaderno. Sube la presentación de cada uno, o varias de golpe: el programa busca cada nombre en el nombre del archivo, en el autor del archivo y en el texto de las diapositivas, y la pone en su fila.';

  // La «lista de clase» es la del cuaderno
  classList = () => CX.alumnos.map((a) => a.nombre);

  /* ---------- Filas de alumnos ---------- */
  renderStudents = function () {
    const box = $('#students'); box.textContent = '';
    for (const st of students) {
      const r = results.find((x) => x.id === st.id), f = r && model ? finalOf(r) : null;
      const status = st.error ? el('span', { class: 'status err' }, st.error) : el('span', { class: 'status' },
        st.fileName ? st.fileName + (st.deck ? ` · ${st.deck.slides.length} diap.` : ' · leyendo…') : 'sin presentación',
        st.found ? el('span', { class: 'found' }, ' · ' + st.found) : null,
        st.warn ? el('span', { class: 'warn' }, ' · ' + st.warn) : null);
      const fi = el('input', { type: 'file', accept: '.pptx', id: 'f-' + st.id, onchange: async (e) => { const fl = e.target.files[0]; e.target.value = ''; if (fl) await loadStudentFile(st, fl); } });
      box.append(el('div', { class: 'srow' },
        el('input', { type: 'text', id: 'n-' + st.id, value: st.name, readonly: true, title: 'Alumno del cuaderno de evaluación' }),
        el('div', { class: 'fcol row', style: 'flex-wrap:nowrap;min-width:0' }, el('label', { class: 'filebtn' }, 'Archivo', fi), status),
        el('span', { class: 'nota ' + (f == null ? '' : gclass(f)) }, f == null ? '' : fmt(f))));
    }
    let av = $('#sinDueno');
    if (!av) { av = el('div', { id: 'sinDueno' }); box.after(av); }
    av.textContent = '';
    if (CX.sinDueno.length) av.append(el('div', { class: 'aviso' }, 'No sé de quién son estas presentaciones: ',
      CX.sinDueno.flatMap((x, i) => [i ? '; ' : '', el('b', {}, x.archivo), ' (' + x.motivo + ')']),
      '. Súbelas con el botón «Archivo» de la fila de su alumno.'));
  };

  // Al subir una en una fila concreta: se avisa si parece de otro alumno
  const loadOrig = loadStudentFile;
  loadStudentFile = async function (st, f) {
    st.autoName = false;
    await loadOrig(st, f);
    if (st.deck) {
      const r = identify(st.deck, st.fileName);
      st.found = ''; st.warn = '';
      if (r && r.name && r.name !== st.name) st.warn = `ojo: parece de ${r.name} (${r.where})`;
      else if (r && r.name) st.found = `nombre comprobado en ${r.where}`;
      CX.sinDueno = CX.sinDueno.filter((x) => x.archivo !== f.name);
      renderStudents(); programarEnvio();
    }
  };

  // Varias de golpe: cada presentación va a la fila del alumno que se encuentra en ella
  subirVarias = async function (files) {
    CX.sinDueno = [];
    $('#runMsg').textContent = 'Leyendo ' + files.length + ' presentación(es)…';
    for (const f of files) {
      let deck;
      try { deck = await parsePptx(f); } catch (err) { CX.sinDueno.push({ archivo: f.name, motivo: 'no se pudo leer; ¿es un .pptx descargado de Google?' }); continue; }
      const r = identify(deck, f.name);
      const st = r && r.name && students.find((s) => s.name === r.name);
      if (st) { st.fileName = f.name; st.deck = deck; st.error = ''; st.warn = ''; st.found = `nombre hallado en ${r.where}`; }
      else CX.sinDueno.push({ archivo: f.name, motivo: r && r.ambiguous ? `en ${r.where} encaja con varios: ${r.ambiguous.join(', ')}` : 'no aparece ningún nombre de la lista' });
      renderStudents();
    }
    const n = files.length - CX.sinDueno.length;
    $('#runMsg').textContent = n + ' presentación(es) repartida(s)' + (CX.sinDueno.length ? ', ' + CX.sinDueno.length + ' sin dueño (mira el aviso).' : '.') + ' Pulsa Corregir.';
    renderResults();
  };

  // Cada vez que cambian las notas se envían al cuaderno
  const renderResOrig = renderResults;
  renderResults = function () { renderResOrig(); if (CX.listo) { renderStudents(); programarEnvio(); } };
  const setModelOrig = setModel;
  setModel = function (deck, name) { setModelOrig(deck, name); programarEnvio(); };

  /* ---------- Envío al cuaderno ---------- */
  function proyecto() {
    return JSON.parse(JSON.stringify({
      tipo: 'proyecto-presentaciones', version: 1, guardado: Date.now(),
      model, sel, weights,
      alumnos: students.filter((s) => s.deck || s.fileName).map((s) => ({ id: s.id, fileName: s.fileName, deck: s.deck, found: s.found || '', warn: s.warn || '', error: s.error || '' })),
      results,
    }));
  }
  function notas() {
    const n = {};
    if (model) results.forEach((r) => { if (students.some((s) => s.id === r.id)) n[r.id] = Math.round(finalOf(r) * 100) / 100; });
    return n;
  }
  function enviar() {
    if (!CX.listo) return;
    clearTimeout(CX.timer);
    const n = notas();
    aCuaderno({ tipo: 'estado', notas: n, proyecto: proyecto() });
    const k = Object.keys(n).length;
    $('#cxEstado').textContent = '✓ Enviado al cuaderno' + (k ? ' (' + k + ' nota(s))' : '') + ' a las ' + new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) + '.';
  }
  function programarEnvio() { if (!CX.listo) return; clearTimeout(CX.timer); CX.timer = setTimeout(enviar, 500); }

  /* ---------- Arranque con los datos del cuaderno ---------- */
  function iniciar(d) {
    CX.alumnos = Array.isArray(d.alumnos) ? d.alumnos : []; CX.titulo = d.titulo || '';
    const bar = $('#barraCuaderno'); bar.textContent = '';
    bar.append(el('b', {}, '📒 Conectado al Cuaderno de Evaluación'), CX.titulo ? ' · ' + CX.titulo : '',
      el('span', { class: 'hint' }, 'Los alumnos vienen del cuaderno. Todo se envía solo al cuaderno y se guarda en su archivo al pulsar «💾 Guardar Archivo». Lo leído de cada presentación también se guarda: si cambias los ítems, no hace falta volver a subirlas.'),
      el('span', { class: 'hint', id: 'cxEstado' }));
    bar.hidden = false;

    const p = d.proyecto || {};
    const guardados = new Map((p.alumnos || []).map((a) => [a.id, a]));
    students = CX.alumnos.map((a) => { const g = guardados.get(a.id) || {}; return { id: a.id, name: a.nombre, fileName: g.fileName || '', deck: g.deck || null, error: g.error || '', found: g.found || '', warn: g.warn || '', autoName: false }; });
    if (p.model && p.model.slides) {
      model = p.model;
      sel = Array.isArray(p.sel) && p.sel.length === model.slides.length ? p.sel : model.slides.map(() => Object.fromEntries(ITEMS.map((i) => [i.k, true])));
      ITEMS.forEach((i) => { if (p.weights && p.weights[i.k]) weights[i.k] = p.weights[i.k]; });
      results = (p.results || []).filter((r) => students.some((s) => s.id === r.id && s.deck));
    } else { model = null; sel = []; results = []; }
    openRows.clear();
    renderModel(); renderMatrix(); renderResOrig(); renderStudents();
    CX.listo = true;
  }

  window.addEventListener('message', (ev) => {
    const d = ev.data;
    if (ev.source !== window.parent || !d || d.origen !== 'cuaderno-lomloe') return;
    if (d.tipo === 'init') iniciar(d);
    else if (d.tipo === 'flush') { if (CX.listo) enviar(); else aCuaderno({ tipo: 'estado', notas: {}, proyecto: null }); }
  });
  aCuaderno({ tipo: 'listo' });
})();
