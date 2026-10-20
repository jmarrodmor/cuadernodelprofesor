let estadoApp = {
  idAsignatura: "tecnologia_digitalizacion",
  nombreDocumento: "",
  unidades: [],
  alumnos: []
};

// Punteros al currículo activo
let DESCRIPCIONES_COMPETENCIAS = {};
let DESCRIPCIONES_CRITERIOS = {};
let DESCRIPCIONES_DESCRIPTORES = {};
let DESCRIPCIONES_COMPETENCIAS_CLAVE = {};
let CONFIG_COMPETENCIAS_CLAVE = {};
let MAPA_CURRICULAR = [];

let alumnoSeleccionadoIdx = null;
let udEdicionIdx = null; 
let udActivaIdx = null;

let contextoEngranaje = { idItem: null, idPadre: null, nombre: '', esPadre: true };
let padreApartadoEdicionId = null;
let apartadoEdicionId = null; 
let archivoHandle = null;
let cambiosSinGuardar = false;

window.addEventListener('DOMContentLoaded', () => {
  poblarDesplegableAsignaturas();
});

window.addEventListener('beforeunload', (event) => {
  if (cambiosSinGuardar) {
    event.preventDefault();
    event.returnValue = '';
  }
});

function poblarDesplegableAsignaturas() {
  ['selectAsignatura', 'selectAsignaturaDoc'].forEach(idSel => {
    const select = document.getElementById(idSel);
    if (!select) return;
    const actual = select.value;
    select.innerHTML = '';
    Object.keys(CATALOGO_ASIGNATURAS).forEach(key => {
      const asig = CATALOGO_ASIGNATURAS[key];
      const opt = document.createElement('option');
      opt.value = asig.id;
      opt.textContent = asig.nombreMateria;
      select.appendChild(opt);
    });
    if (actual) select.value = actual;
  });
}

// Cambia la asignatura de un cuaderno ya creado. Las UD conservan sus criterios por código (1.1, 2.3…):
// los que existen en la nueva asignatura pasan a significar los de esta; los que no existen se ignoran
// en los cálculos, pero no se borran (si vuelves a la asignatura anterior, reaparecen).
function cambiarAsignatura(nuevaId) {
  const select = document.getElementById('selectAsignaturaDoc');
  const anterior = estadoApp.idAsignatura;
  if (!CATALOGO_ASIGNATURAS[nuevaId] || nuevaId === anterior) return;

  const nueva = CATALOGO_ASIGNATURAS[nuevaId];
  const codigosNuevos = new Set(Object.keys(nueva.DESCRIPCIONES_CRITERIOS));
  const usados = new Set();
  estadoApp.unidades.forEach(ud => (ud.criterios || []).forEach(c => usados.add(typeof c === 'string' ? c : c.codigo)));
  const perdidos = [...usados].filter(c => !codigosNuevos.has(c));

  if (usados.size) {
    let aviso = `Vas a cambiar la asignatura a «${nueva.nombreMateria}».\n\n` +
      `Las unidades conservan sus criterios por su número (1.1, 2.3…), que pasarán a corresponder a los criterios de la nueva asignatura. Revisa después cada UD en «Gestionar UUDD».`;
    if (perdidos.length) aviso += `\n\nEstos criterios no existen en la nueva asignatura y no contarán (no se borran): ${perdidos.sort().join(', ')}.`;
    if (!confirm(aviso + '\n\n¿Continuar?')) { select.value = anterior; return; }
  }

  estadoApp.idAsignatura = nuevaId;
  cargarCurriculoActivo();
  construirFormularioCriterios15();
  marcarCambiosPendientes();
  renderizarTablaPrincipal();
  if (!document.getElementById('vistaDetalle').classList.contains('hidden') && alumnoSeleccionadoIdx !== null) renderizarDetalleAlumno();
}

function cargarCurriculoActivo() {
  const asigId = estadoApp.idAsignatura || "tecnologia_digitalizacion";
  const curriculo = CATALOGO_ASIGNATURAS[asigId] || CATALOGO_ASIGNATURAS["tecnologia_digitalizacion"];

  DESCRIPCIONES_COMPETENCIAS = curriculo.DESCRIPCIONES_COMPETENCIAS;
  DESCRIPCIONES_CRITERIOS = curriculo.DESCRIPCIONES_CRITERIOS;
  DESCRIPCIONES_DESCRIPTORES = curriculo.DESCRIPCIONES_DESCRIPTORES;
  DESCRIPCIONES_COMPETENCIAS_CLAVE = curriculo.DESCRIPCIONES_COMPETENCIAS_CLAVE;
  CONFIG_COMPETENCIAS_CLAVE = curriculo.CONFIG_COMPETENCIAS_CLAVE;
  MAPA_CURRICULAR = curriculo.MAPA_CURRICULAR;
}

function marcarCambiosPendientes() {
  cambiosSinGuardar = true;
  document.querySelectorAll('.estado-guardado').forEach(el => {
    el.innerText = '• Sin guardar';
    el.className = 'estado-guardado pendiente';
  });
}

function marcarComoGuardado() {
  cambiosSinGuardar = false;
  document.querySelectorAll('.estado-guardado').forEach(el => {
    el.innerText = '✓ Guardado';
    el.className = 'estado-guardado ok';
  });
}

function generarIdUnico(prefix = 'id') {
  return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
}

function migrarEstructuraUD() {
  if (!estadoApp.alumnos) estadoApp.alumnos = [];
  if (!estadoApp.unidades) estadoApp.unidades = [];
  if (!estadoApp.idAsignatura) estadoApp.idAsignatura = "tecnologia_digitalizacion";

  estadoApp.unidades.forEach((ud) => {
    if (!ud.id) ud.id = generarIdUnico('ud');
    if (!ud.apartados) ud.apartados = [];
    ud.apartados.forEach(ap => {
      if (!ap.subapartados) ap.subapartados = [];
    });

    if (ud.criterios && ud.criterios.length > 0) {
      ud.criterios = ud.criterios.map(crit => {
        if (typeof crit === 'string') {
          return { codigo: crit, peso: 2 };
        }
        return crit;
      });
    } else {
      ud.criterios = [];
    }
  });

  estadoApp.alumnos.forEach((al) => {
    if (!al.id) al.id = generarIdUnico('al');   // identificador estable (las notas del corrector vuelven a quien toca aunque se reordene la lista)
    if (!al.notasApartados) al.notasApartados = {};
    if (!al.notasUDManuales) al.notasUDManuales = {};
  });
}

function mostrarFormNuevoDoc() {
  poblarDesplegableAsignaturas();
  document.getElementById('formNuevoDoc').classList.remove('hidden');
}

function crearNuevoDocumento() {
  const nombre = document.getElementById('nombreDoc').value.trim();
  const idAsig = document.getElementById('selectAsignatura').value;

  if (!nombre) return alert("Por favor, introduce el nombre del documento.");

  archivoHandle = null;
  estadoApp.idAsignatura = idAsig;
  estadoApp.nombreDocumento = nombre;
  estadoApp.unidades = [];
  estadoApp.alumnos = [];

  marcarCambiosPendientes();
  iniciarVistaHoja();
}

function iniciarVistaHoja() {
  migrarEstructuraUD();
  cargarCurriculoActivo();
  construirFormularioCriterios15();
  document.getElementById('modalInicio').classList.add('hidden');
  document.getElementById('vistaDetalle').classList.add('hidden');
  document.getElementById('vistaUD').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('tituloDocumento').innerText = estadoApp.nombreDocumento;
  poblarDesplegableAsignaturas();
  document.getElementById('selectAsignaturaDoc').value = CATALOGO_ASIGNATURAS[estadoApp.idAsignatura] ? estadoApp.idAsignatura : 'tecnologia_digitalizacion';
  ordenarAlumnos();
  renderizarTablaPrincipal();
}

function ordenarAlumnos() {
  estadoApp.alumnos.sort((a, b) => {
    const ap1A = (a.apellidos || "").trim().toLowerCase();
    const ap1B = (b.apellidos || "").trim().toLowerCase();
    return ap1A.localeCompare(ap1B, 'es', { sensitivity: 'base' });
  });
}

function construirFormularioCriterios15() {
  const cont = document.getElementById('contenedorCriteriosUD');
  if (!cont) return;
  cont.innerHTML = '';

  const opcionesCriterios = Object.keys(DESCRIPCIONES_CRITERIOS).map(cod => {
    return `<option value="${cod}">${DESCRIPCIONES_CRITERIOS[cod]}</option>`;
  }).join('');

  for (let i = 0; i < 15; i++) {
    const row = document.createElement('div');
    row.className = 'fila-criterio-ud';
    row.innerHTML = `
      <span class="num-criterio">${i + 1}.</span>
      <select id="crit_cod_${i}" class="input-crit-cod" style="padding:5px; border-radius:4px; border:1px solid #ccc;">
        <option value="">-- Sin seleccionar --</option>
        ${opcionesCriterios}
      </select>
      <select id="crit_peso_${i}" class="select-crit-peso">
        <option value="1">Bajo (x1)</option>
        <option value="2" selected>Medio (x2)</option>
        <option value="3">Alto (x3)</option>
      </select>
    `;
    cont.appendChild(row);
  }
}

// -------------------------------------------------------------
// CÁLCULOS LOMLOE
// -------------------------------------------------------------

function calcularNotaApartadoPadre(alumno, apPadre) {
  if (!apPadre.subapartados || apPadre.subapartados.length === 0) {
    if (alumno.notasApartados && alumno.notasApartados[apPadre.id] !== undefined && alumno.notasApartados[apPadre.id] !== "") {
      const val = parseFloat(alumno.notasApartados[apPadre.id]);
      return isNaN(val) ? null : val;
    }
    return null;
  }

  const sumaSubPesos = apPadre.subapartados.reduce((acc, sub) => acc + (parseFloat(sub.peso) || 0), 0);
  if (Math.abs(sumaSubPesos - 100) > 0.01) {
    return null;
  }

  let suma = 0;
  let pesoEfectivo = 0;

  apPadre.subapartados.forEach(sub => {
    if (alumno.notasApartados && alumno.notasApartados[sub.id] !== undefined && alumno.notasApartados[sub.id] !== "") {
      const val = parseFloat(alumno.notasApartados[sub.id]);
      const peso = parseFloat(sub.peso) || 0;
      if (!isNaN(val)) {
        suma += val * (peso / 100);
        pesoEfectivo += peso;
      }
    }
  });

  if (pesoEfectivo === 0) return null;
  return pesoEfectivo === 100 ? suma : (suma * (100 / pesoEfectivo));
}

function calcularNotaUD(alumno, ud) {
  if (!ud.apartados || ud.apartados.length === 0) {
    if (alumno.notasUDManuales && alumno.notasUDManuales[ud.id] !== undefined && alumno.notasUDManuales[ud.id] !== "") {
      const val = parseFloat(alumno.notasUDManuales[ud.id]);
      return isNaN(val) ? null : val;
    }
    return null;
  }

  const sumaPesos = ud.apartados.reduce((acc, ap) => acc + (parseFloat(ap.peso) || 0), 0);
  if (Math.abs(sumaPesos - 100) > 0.01) {
    return null;
  }

  let sumaPonderada = 0;
  let pesoEfectivoTotal = 0;

  for (let ap of ud.apartados) {
    const notaAp = calcularNotaApartadoPadre(alumno, ap);
    
    if (ap.subapartados && ap.subapartados.length > 0) {
      const sumaSub = ap.subapartados.reduce((acc, s) => acc + (parseFloat(s.peso) || 0), 0);
      if (Math.abs(sumaSub - 100) > 0.01) return null;
    }

    if (notaAp !== null) {
      const peso = parseFloat(ap.peso) || 0;
      sumaPonderada += notaAp * (peso / 100);
      pesoEfectivoTotal += peso;
    }
  }

  if (pesoEfectivoTotal === 0) return null;
  return pesoEfectivoTotal === 100 ? sumaPonderada : (sumaPonderada * (100 / pesoEfectivoTotal));
}

function calcularNotaCriterio(alumno, codCriterio) {
  let sumaPonderada = 0;
  let sumaPesos = 0;

  estadoApp.unidades.forEach(ud => {
    if (ud.criterios) {
      const critObj = ud.criterios.find(c => (typeof c === 'string' ? c : c.codigo) === codCriterio);
      if (critObj) {
        const peso = typeof critObj === 'object' ? parseInt(critObj.peso || 2, 10) : 2;
        const notaUD = calcularNotaUD(alumno, ud);
        if (notaUD !== null) {
          sumaPonderada += notaUD * peso;
          sumaPesos += peso;
        }
      }
    }
  });

  return sumaPesos > 0 ? (sumaPonderada / sumaPesos) : null;
}

function calcularNotaCompetencia(alumno, compObj) {
  let suma = 0, recuento = 0;
  compObj.criterios.forEach(crit => {
    const notaCrit = calcularNotaCriterio(alumno, crit);
    if (notaCrit !== null) { suma += notaCrit; recuento++; }
  });
  return recuento > 0 ? (suma / recuento) : null;
}

function calcularNotaDescriptor(alumno, codDescriptor) {
  let suma = 0, recuento = 0;
  MAPA_CURRICULAR.forEach(compObj => {
    if (compObj.descriptores.includes(codDescriptor)) {
      const notaComp = calcularNotaCompetencia(alumno, compObj);
      if (notaComp !== null) { suma += notaComp; recuento++; }
    }
  });
  return recuento > 0 ? (suma / recuento) : null;
}

function calcularNotaCompetenciaClave(alumno, prefijoCompClave) {
  let descriptoresAsociados = [];
  MAPA_CURRICULAR.forEach(compObj => {
    compObj.descriptores.forEach(desc => {
      if (desc.replace(/[0-9]/g, '') === prefijoCompClave && !descriptoresAsociados.includes(desc)) {
        descriptoresAsociados.push(desc);
      }
    });
  });

  let suma = 0, recuento = 0;
  descriptoresAsociados.forEach(desc => {
    const notaDesc = calcularNotaDescriptor(alumno, desc);
    if (notaDesc !== null) { suma += notaDesc; recuento++; }
  });
  return recuento > 0 ? (suma / recuento) : null;
}

function obtenerGradoAdquisicion(nota) {
  if (nota === null) return { texto: "-", clase: "" };
  if (nota < 5.0) return { texto: "1. No conseguida", clase: "grado-no" };
  if (nota < 7.0) return { texto: "2. En proceso", clase: "grado-proceso" };
  if (nota < 9.0) return { texto: "3. Avanzado", clase: "grado-adquirido" };
  return { texto: "4. Consolidado", clase: "grado-avanzado" };
}

// -------------------------------------------------------------
// RENDERIZADO: VISTA PRINCIPAL
// -------------------------------------------------------------

function renderizarTablaPrincipal() {
  const filaCabecera = document.getElementById('filaCabecera');
  const cuerpoAlumnos = document.getElementById('cuerpoAlumnos');

  filaCabecera.innerHTML = `<th class="col-alumno">ALUMNOS</th>`;
  estadoApp.unidades.forEach((ud, index) => {
    const th = document.createElement('th');
    th.className = 'th-ud-link';
    th.title = "Haz clic para abrir el desglose de esta Unidad";
    th.onclick = () => abrirVistaUD(index);
    const cont = document.createElement('div');
    cont.className = 'header-content';
    const tit = document.createElement('span');
    tit.textContent = ud.nombre || '';
    if (ud.evaluacion) {
      const etq = document.createElement('span');
      etq.className = 'etq-eval';
      etq.textContent = `${ud.evaluacion}ª ev. · importancia ${NOMBRE_PESO[ud.pesoEval || 2]}`;
      tit.appendChild(etq);
    }
    const gear = document.createElement('button');
    gear.className = 'btn-gear';
    gear.textContent = '⚙️';
    gear.title = 'Opciones de la unidad (mover, modificar…)';
    gear.onclick = (e) => { e.stopPropagation(); abrirOpcionesUD(index); };
    cont.append(tit, gear);
    th.appendChild(cont);
    filaCabecera.appendChild(th);
  });

  // columnas de cada evaluación con unidades asignadas y de la evaluación final
  const evals = evaluacionesUsadas();
  evals.forEach(n => {
    const th = document.createElement('th');
    th.className = 'th-evaluacion th-ajustable';
    th.textContent = `${n}ª EVALUACIÓN`;
    th.title = 'Media ponderada de las unidades de esta evaluación (según su importancia)';
    filaCabecera.appendChild(th);
  });
  if (evals.length) {
    const th = document.createElement('th');
    th.className = 'th-final th-ajustable';
    th.textContent = 'EVALUACIÓN FINAL';
    th.title = 'Media de las evaluaciones que tienen nota';
    filaCabecera.appendChild(th);
  }

  const thInfo = document.createElement('th');
  thInfo.style.textAlign = 'center';
  thInfo.className = 'th-ajustable';
  thInfo.textContent = 'EVALUACIÓN COMPETENCIAL';
  filaCabecera.appendChild(thInfo);

  cuerpoAlumnos.innerHTML = '';
  estadoApp.alumnos.forEach((alumno, idx) => {
    const tr = document.createElement('tr');
    
    const tdNombre = document.createElement('td');
    tdNombre.className = 'nombre-alumno';
    tdNombre.textContent = `${alumno.apellidos}, ${alumno.nombre}`;
    tr.appendChild(tdNombre);

    estadoApp.unidades.forEach(ud => {
      const tdNota = document.createElement('td');

      if (!ud.apartados || ud.apartados.length === 0) {
        tdNota.className = 'nota-celda';
        const val = (alumno.notasUDManuales && alumno.notasUDManuales[ud.id] !== undefined) ? alumno.notasUDManuales[ud.id] : "";
        
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'nota-input';
        input.step = '0.1';
        input.min = '0';
        input.max = '10';
        input.value = val;
        input.placeholder = 'Manual';
        input.onchange = (e) => actualizarNotaUDManual(idx, ud.id, e.target.value);

        tdNota.appendChild(input);
      } else {
        tdNota.className = 'nota-celda-lectura';
        const sumaPesos = ud.apartados.reduce((acc, ap) => acc + (parseFloat(ap.peso) || 0), 0);
        
        let subError = false;
        ud.apartados.forEach(ap => {
          if (ap.subapartados && ap.subapartados.length > 0) {
            const sumS = ap.subapartados.reduce((a, s) => a + (parseFloat(s.peso) || 0), 0);
            if (Math.abs(sumS - 100) > 0.01) subError = true;
          }
        });

        if (Math.abs(sumaPesos - 100) > 0.01 || subError) {
          tdNota.textContent = '⚠';
          tdNota.title = 'Configuración de pesos incompleta en apartados o subapartados (Debe ser 100%)';
        } else {
          const notaUD = calcularNotaUD(alumno, ud);
          tdNota.textContent = notaUD !== null ? notaUD.toFixed(1) : '-';
        }
      }

      tr.appendChild(tdNota);
    });

    evals.forEach(n => {
      const td = document.createElement('td');
      td.className = 'nota-celda-lectura nota-evaluacion';
      const v = calcularNotaEvaluacion(alumno, n);
      td.textContent = v !== null ? v.toFixed(1) : '-';
      tr.appendChild(td);
    });
    if (evals.length) {
      const td = document.createElement('td');
      td.className = 'nota-celda-lectura nota-final';
      const v = calcularNotaFinal(alumno);
      td.textContent = v !== null ? v.toFixed(1) : '-';
      tr.appendChild(td);
    }

    const tdBtn = document.createElement('td');
    tdBtn.style.textAlign = 'center';
    const btnInfo = document.createElement('button');
    btnInfo.className = 'btn-info';
    btnInfo.textContent = '📊 Ver informe';
    btnInfo.title = 'Ver criterios, competencias específicas, descriptores y competencias clave';
    btnInfo.onclick = () => verMasInformacion(idx);
    tdBtn.appendChild(btnInfo);
    tr.appendChild(tdBtn);

    cuerpoAlumnos.appendChild(tr);
  });
}

function actualizarNotaUDManual(idxAlumno, idUD, valor) {
  const alumno = estadoApp.alumnos[idxAlumno];
  if (!alumno.notasUDManuales) alumno.notasUDManuales = {};

  const num = parseFloat(valor);
  if (!isNaN(num) && num >= 0 && num <= 10) {
    alumno.notasUDManuales[idUD] = num;
  } else {
    delete alumno.notasUDManuales[idUD];
  }

  marcarCambiosPendientes();
}

// -------------------------------------------------------------
// VISTA 3: DESGLOSE UD
// -------------------------------------------------------------

function abrirVistaUD(idxUnidad) {
  udActivaIdx = idxUnidad;
  const ud = estadoApp.unidades[idxUnidad];

  document.getElementById('app').classList.add('hidden');
  document.getElementById('vistaDetalle').classList.add('hidden');
  document.getElementById('vistaUD').classList.remove('hidden');

  document.getElementById('tituloUDDetalle').textContent = ud.nombre;
  renderizarTablaUD();
}

function renderizarTablaUD() {
  const ud = estadoApp.unidades[udActivaIdx];
  const fila1 = document.getElementById('filaCabeceraUD_1');
  const fila2 = document.getElementById('filaCabeceraUD_2');
  const cuerpoAlumnos = document.getElementById('cuerpoAlumnosUD');

  fila1.innerHTML = '';
  fila2.innerHTML = '';

  let sumaPesosPadre = 0;
  let hayErrorSubapartados = false;
  let columnasRenderizadas = []; 

  const thAlumno = document.createElement('th');
  thAlumno.className = 'col-alumno';
  thAlumno.rowSpan = 2;
  thAlumno.textContent = 'ALUMNOS';
  fila1.appendChild(thAlumno);

  (ud.apartados || []).forEach((ap) => {
    sumaPesosPadre += parseFloat(ap.peso) || 0;

    if (!ap.subapartados || ap.subapartados.length === 0) {
      columnasRenderizadas.push({ tipo: 'apartado_simple', id: ap.id, apPadre: ap });

      const th = document.createElement('th');
      th.rowSpan = 2;
      th.innerHTML = `
        <div class="header-content">
          <span class="header-title">${iconoHerramienta(ap)}${nombreConEnlace(ap, null)} (${ap.peso}%)</span>
          <button class="btn-gear" onclick="abrirOpcionesApartado('${ap.id}', null, '${ap.nombre}', true)">⚙️</button>
        </div>
      `;
      fila1.appendChild(th);
    } else {
      const sumaSub = ap.subapartados.reduce((acc, s) => acc + (parseFloat(s.peso) || 0), 0);
      if (Math.abs(sumaSub - 100) > 0.01) hayErrorSubapartados = true;

      const numSub = ap.subapartados.length;
      const thPadre = document.createElement('th');
      thPadre.colSpan = numSub + 1;
      thPadre.className = 'header-bloque-padre';
      thPadre.innerHTML = `
        <div class="header-content">
          <span class="header-title">${ap.nombre} (${ap.peso}%) ${Math.abs(sumaSub - 100) > 0.01 ? '⚠' : ''}</span>
          <button class="btn-gear" onclick="abrirOpcionesApartado('${ap.id}', null, '${ap.nombre}', true)">⚙️</button>
        </div>
      `;
      fila1.appendChild(thPadre);

      ap.subapartados.forEach((sub) => {
        columnasRenderizadas.push({ tipo: 'subapartado', id: sub.id, apPadre: ap, sub: sub });

        const thSub = document.createElement('th');
        thSub.className = 'header-subapartado';
        thSub.innerHTML = `
          <div class="header-content">
            <span>${iconoHerramienta(sub)}${nombreConEnlace(sub, ap.id)} <small>(${sub.peso}%)</small></span>
            <button class="btn-gear" onclick="abrirOpcionesApartado('${sub.id}', '${ap.id}', '${sub.nombre}', false)">⚙️</button>
          </div>
        `;
        fila2.appendChild(thSub);
      });

      columnasRenderizadas.push({ tipo: 'total_bloque', apPadre: ap });
      const thTotalSub = document.createElement('th');
      thTotalSub.className = 'header-total-sub';
      thTotalSub.textContent = 'TOTAL';
      fila2.appendChild(thTotalSub);
    }
  });

  const thNotaUD = document.createElement('th');
  thNotaUD.rowSpan = 2;
  thNotaUD.style.backgroundColor = '#083663';
  thNotaUD.textContent = 'NOTA UD';
  fila1.appendChild(thNotaUD);

  const badge = document.getElementById('infoSumaPorcentajes');
  badge.textContent = `Suma pesos principales: ${sumaPesosPadre}%`;
  
  const leyenda = document.getElementById('leyendaSumaUD');
  if (Math.abs(sumaPesosPadre - 100) < 0.01 && !hayErrorSubapartados) {
    badge.className = 'badge-porcentaje ok';
    if (leyenda) leyenda.classList.add('hidden');
  } else {
    badge.className = 'badge-porcentaje warn';
    if (leyenda) {
      leyenda.textContent = hayErrorSubapartados 
        ? "⚠️ La suma de subapartados en algún bloque no alcanza el 100%" 
        : "⚠ La suma de pesos principales debe ser 100% para calcular la nota";
      leyenda.classList.remove('hidden');
    }
  }

  cuerpoAlumnos.innerHTML = '';
  estadoApp.alumnos.forEach((alumno, idx) => {
    const tr = document.createElement('tr');

    const tdNombre = document.createElement('td');
    tdNombre.className = 'nombre-alumno';
    tdNombre.textContent = `${alumno.apellidos}, ${alumno.nombre}`;
    tr.appendChild(tdNombre);

    columnasRenderizadas.forEach(col => {
      if (col.tipo === 'total_bloque') {
        const tdTotalBloque = document.createElement('td');
        tdTotalBloque.className = 'nota-celda-lectura total-bloque';
        
        const sumaSub = col.apPadre.subapartados.reduce((acc, s) => acc + (parseFloat(s.peso) || 0), 0);
        if (Math.abs(sumaSub - 100) > 0.01) {
          tdTotalBloque.textContent = '⚠️';
          tdTotalBloque.title = `Los subapartados suman un ${sumaSub}% (Debe ser el 100%)`;
        } else {
          const notaPadre = calcularNotaApartadoPadre(alumno, col.apPadre);
          tdTotalBloque.textContent = notaPadre !== null ? notaPadre.toFixed(1) : '-';
        }
        tr.appendChild(tdTotalBloque);
      } else {
        const tdNota = document.createElement('td');
        tdNota.className = 'nota-celda';

        const val = (alumno.notasApartados && alumno.notasApartados[col.id] !== undefined) ? alumno.notasApartados[col.id] : "";

        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'nota-input';
        input.step = '0.1';
        input.min = '0';
        input.max = '10';
        input.value = val;
        input.placeholder = '-';
        input.onchange = (e) => actualizarNotaApartado(idx, col.id, e.target.value);

        tdNota.appendChild(input);
        tr.appendChild(tdNota);
      }
    });

    const tdNotaUD = document.createElement('td');
    tdNotaUD.className = 'nota-celda-lectura total-ud';
    
    if (Math.abs(sumaPesosPadre - 100) > 0.01 || hayErrorSubapartados) {
      tdNotaUD.textContent = '⚠️';
      tdNotaUD.title = 'Revisa los porcentajes de apartados o subapartados (deben sumar 100%).';
    } else {
      const notaUDCalculada = calcularNotaUD(alumno, ud);
      tdNotaUD.textContent = notaUDCalculada !== null ? notaUDCalculada.toFixed(1) : '-';
    }
    
    tr.appendChild(tdNotaUD);
    cuerpoAlumnos.appendChild(tr);
  });
}

function actualizarNotaApartado(idxAlumno, idTarget, valor) {
  const alumno = estadoApp.alumnos[idxAlumno];
  if (!alumno.notasApartados) alumno.notasApartados = {};

  const num = parseFloat(valor);
  if (!isNaN(num) && num >= 0 && num <= 10) {
    alumno.notasApartados[idTarget] = num;
  } else {
    delete alumno.notasApartados[idTarget];
  }

  marcarCambiosPendientes();
  renderizarTablaUD();
}

// -------------------------------------------------------------
// MENÚ DE OPCIONES DE APARTADO
// -------------------------------------------------------------

function abrirOpcionesApartado(idItem, idPadre, nombre, esPadre) {
  contextoEngranaje = { idItem, idPadre, nombre, esPadre };

  document.getElementById('tituloOpcionesApartado').textContent = `Opciones: ${nombre}`;
  document.getElementById('subtituloOpcionesApartado').textContent = esPadre ? 'Apartado Principal' : 'Subapartado';

  const btnSub = document.getElementById('btnOpcionSubapartado');
  if (esPadre) {
    btnSub.classList.remove('hidden');
  } else {
    btnSub.classList.add('hidden');
  }

  const campoNotas = document.getElementById('textoNotasMasivas');
  if (campoNotas) campoNotas.value = '';
  actualizarBotonesMoverApartado();

  const item = buscarItemApartado(idItem, idPadre);
  const btnGen = document.getElementById('btnOpcionGenially');
  const esHoja = item && !(item.subapartados && item.subapartados.length);
  if (btnGen) btnGen.classList.toggle('hidden', !(esGenially(item) && esHoja));
  const btnScr = document.getElementById('btnOpcionScratch');
  if (btnScr) btnScr.classList.toggle('hidden', !(esScratch(item) && esHoja));
  const btnPres = document.getElementById('btnOpcionPresentaciones');
  if (btnPres) btnPres.classList.toggle('hidden', !(esPresentaciones(item) && esHoja));

  document.getElementById('modalOpcionesApartado').classList.remove('hidden');
}

function cerrarModalOpcionesApartado() {
  document.getElementById('modalOpcionesApartado').classList.add('hidden');
}

function menuAccionAñadirSubapartado() {
  const idPadre = contextoEngranaje.idItem;
  cerrarModalOpcionesApartado();
  abrirModalAgregarApartado(idPadre);
}

function menuAccionEditarApartado() {
  const { idItem, idPadre } = contextoEngranaje;
  cerrarModalOpcionesApartado();
  editarApartado(idItem, idPadre);
}

function menuAccionEliminarApartado() {
  const { idItem, idPadre } = contextoEngranaje;
  cerrarModalOpcionesApartado();
  eliminarApartado(idItem, idPadre);
}

function menuAccionPegarNotasMasivas() {
  const texto = document.getElementById('textoNotasMasivas').value.trim();
  if (!texto) return alert("Por favor, introduce o pega la lista de notas.");

  const lineas = texto.split(/\r?\n/);
  const idTarget = contextoEngranaje.idItem;
  let asignadas = 0;

  lineas.forEach((linea, index) => {
    if (index < estadoApp.alumnos.length) {
      const valStr = linea.trim().replace(',', '.');
      const num = parseFloat(valStr);

      const alumno = estadoApp.alumnos[index];
      if (!alumno.notasApartados) alumno.notasApartados = {};

      if (!isNaN(num) && num >= 0 && num <= 10) {
        alumno.notasApartados[idTarget] = num;
        asignadas++;
      } else if (valStr === "" || valStr === "-") {
        delete alumno.notasApartados[idTarget];
      }
    }
  });

  marcarCambiosPendientes();
  cerrarModalOpcionesApartado();
  renderizarTablaUD();
  alert(`Se han asignado ${asignadas} notas correctamente a la lista de alumnos.`);
}

function abrirModalAgregarApartado(idPadre = null) {
  padreApartadoEdicionId = idPadre;
  apartadoEdicionId = null;

  const modalTitulo = document.getElementById('tituloModalApartado');
  const labelPeso = document.getElementById('labelPesoApartado');

  if (idPadre === null) {
    modalTitulo.textContent = 'Añadir Apartado Principal';
    labelPeso.textContent = 'Porcentaje sobre la UD (%):';
  } else {
    modalTitulo.textContent = 'Añadir Subapartado';
    labelPeso.textContent = 'Porcentaje dentro de este bloque (%):';
  }

  document.getElementById('inputNombreApartado').value = '';
  document.getElementById('inputPesoApartado').value = '';
  document.getElementById('selectHerramientaApartado').value = 'manual';
  document.getElementById('modalAgregarApartado').classList.remove('hidden');
}

function editarApartado(idItem, idPadre = null) {
  padreApartadoEdicionId = idPadre;
  apartadoEdicionId = idItem;

  const ud = estadoApp.unidades[udActivaIdx];
  let itemTarget = null;

  if (idPadre === null) {
    itemTarget = ud.apartados.find(a => a.id === idItem);
    document.getElementById('tituloModalApartado').textContent = 'Modificar Apartado Principal';
    document.getElementById('labelPesoApartado').textContent = 'Porcentaje sobre la UD (%):';
  } else {
    const padre = ud.apartados.find(a => a.id === idPadre);
    if (padre) itemTarget = padre.subapartados.find(s => s.id === idItem);
    document.getElementById('tituloModalApartado').textContent = 'Modificar Subapartado';
    document.getElementById('labelPesoApartado').textContent = 'Porcentaje dentro del bloque (%):';
  }

  if (itemTarget) {
    document.getElementById('inputNombreApartado').value = itemTarget.nombre;
    document.getElementById('inputPesoApartado').value = itemTarget.peso;
    document.getElementById('selectHerramientaApartado').value = itemTarget.herramienta || 'manual';
    document.getElementById('modalAgregarApartado').classList.remove('hidden');
  }
}

function cerrarModalAgregarApartado() {
  document.getElementById('modalAgregarApartado').classList.add('hidden');
}

function procesarGuardarApartado() {
  const nombre = document.getElementById('inputNombreApartado').value.trim();
  const pesoVal = document.getElementById('inputPesoApartado').value;
  const peso = parseFloat(pesoVal);

  if (!nombre) return alert("Introduce un nombre.");
  if (isNaN(peso) || peso <= 0 || peso > 100) return alert("Introduce un porcentaje válido de 1 a 100.");

  const herramienta = document.getElementById('selectHerramientaApartado').value || 'manual';
  const ud = estadoApp.unidades[udActivaIdx];

  if (padreApartadoEdicionId !== null) {
    const padre = ud.apartados.find(a => a.id === padreApartadoEdicionId);
    if (!padre) return;
    if (!padre.subapartados) padre.subapartados = [];

    let sumaActualSub = padre.subapartados.reduce((acc, sub) => {
      if (apartadoEdicionId !== null && sub.id === apartadoEdicionId) return acc;
      return acc + (parseFloat(sub.peso) || 0);
    }, 0);

    if (sumaActualSub + peso > 100) {
      const disponible = 100 - sumaActualSub;
      return alert(`No se puede guardar. La suma de subapartados superaría el 100% (Suma actual: ${sumaActualSub}%, Máximo disponible: ${disponible.toFixed(1)}%).`);
    }

    if (apartadoEdicionId === null) {
      padre.subapartados.push({ id: generarIdUnico('sub'), nombre: nombre, peso: peso, herramienta: herramienta });
    } else {
      const sub = padre.subapartados.find(s => s.id === apartadoEdicionId);
      if (sub) { sub.nombre = nombre; sub.peso = peso; sub.herramienta = herramienta; }
    }
  } else {
    let sumaActualPadre = ud.apartados.reduce((acc, ap) => {
      if (apartadoEdicionId !== null && ap.id === apartadoEdicionId) return acc;
      return acc + (parseFloat(ap.peso) || 0);
    }, 0);

    if (sumaActualPadre + peso > 100) {
      const disponible = 100 - sumaActualPadre;
      return alert(`No se puede guardar. La suma de apartados principales superaría el 100% (Suma actual: ${sumaActualPadre}%, Máximo disponible: ${disponible.toFixed(1)}%).`);
    }

    if (apartadoEdicionId === null) {
      ud.apartados.push({ id: generarIdUnico('ap'), nombre: nombre, peso: peso, herramienta: herramienta, subapartados: [] });
    } else {
      const ap = ud.apartados.find(a => a.id === apartadoEdicionId);
      if (ap) { ap.nombre = nombre; ap.peso = peso; ap.herramienta = herramienta; }
    }
  }

  marcarCambiosPendientes();
  cerrarModalAgregarApartado();
  renderizarTablaUD();
}

function eliminarApartado(idItem, idPadre = null) {
  const ud = estadoApp.unidades[udActivaIdx];

  if (idPadre === null) {
    const apIdx = ud.apartados.findIndex(a => a.id === idItem);
    const ap = ud.apartados[apIdx];

    if (confirm(`¿Eliminar el apartado "${ap.nombre}"? Se perderán sus subapartados y notas.`)) {
      let idsBorrar = [ap.id];
      (ap.subapartados || []).forEach(s => idsBorrar.push(s.id));

      ud.apartados.splice(apIdx, 1);
      estadoApp.alumnos.forEach(al => {
        if (al.notasApartados) idsBorrar.forEach(id => delete al.notasApartados[id]);
      });

      marcarCambiosPendientes();
      renderizarTablaUD();
    }
  } else {
    const padre = ud.apartados.find(a => a.id === idPadre);
    if (!padre) return;

    const subIdx = padre.subapartados.findIndex(s => s.id === idItem);
    const sub = padre.subapartados[subIdx];

    if (confirm(`¿Eliminar el subapartado "${sub.nombre}"?`)) {
      padre.subapartados.splice(subIdx, 1);
      estadoApp.alumnos.forEach(al => {
        if (al.notasApartados) delete al.notasApartados[idItem];
      });

      marcarCambiosPendientes();
      renderizarTablaUD();
    }
  }
}

// -------------------------------------------------------------
// VISTA DETALLE
// -------------------------------------------------------------

function verMasInformacion(idxAlumno) {
  alumnoSeleccionadoIdx = idxAlumno;
  const alumno = estadoApp.alumnos[idxAlumno];

  document.getElementById('app').classList.add('hidden');
  document.getElementById('vistaUD').classList.add('hidden');
  document.getElementById('vistaDetalle').classList.remove('hidden');
  document.getElementById('tituloAlumnoDetalle').textContent = `${alumno.apellidos}, ${alumno.nombre}`;

  renderizarDetalleAlumno();
}

function volverAContactoPrincipal() {
  document.getElementById('vistaDetalle').classList.add('hidden');
  document.getElementById('vistaUD').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  renderizarTablaPrincipal();
}

function renderizarDetalleAlumno() {
  const alumno = estadoApp.alumnos[alumnoSeleccionadoIdx];

  // 1. UNIDADES DIDÁCTICAS
  const tbodyUD = document.getElementById('tablaDetalleUD');
  tbodyUD.innerHTML = estadoApp.unidades.map(ud => {
    const notaUD = calcularNotaUD(alumno, ud);
    return `<tr><td>${ud.nombre}</td><td class="col-nota">${notaUD !== null ? notaUD.toFixed(1) : '-'}</td></tr>`;
  }).join('') + (() => {
    const evals = evaluacionesUsadas();
    if (!evals.length) return '';
    const f = (v) => v !== null ? v.toFixed(1) : '-';
    return evals.map(n => `<tr class="fila-evaluacion"><td>${n}ª Evaluación</td><td class="col-nota">${f(calcularNotaEvaluacion(alumno, n))}</td></tr>`).join('') +
      `<tr class="fila-evaluacion"><td>Evaluación final</td><td class="col-nota">${f(calcularNotaFinal(alumno))}</td></tr>`;
  })();

  // 2. CRITERIOS
  const tbodyCrit = document.getElementById('tablaDetalleCriterios');
  let htmlCriterios = '';
  MAPA_CURRICULAR.forEach(comp => {
    comp.criterios.forEach(crit => {
      const notaCrit = calcularNotaCriterio(alumno, crit);
      const descCrit = DESCRIPCIONES_CRITERIOS[crit] || `Criterio ${crit}`;
      htmlCriterios += `
        <tr>
          <td title="${descCrit}">
            <span class="has-tooltip"><strong>${crit}</strong></span>
          </td>
          <td class="col-nota">${notaCrit !== null ? notaCrit.toFixed(1) : '-'}</td>
        </tr>`;
    });
  });
  tbodyCrit.innerHTML = htmlCriterios;

  // 3. COMPETENCIAS ESPECÍFICAS
  const tbodyComp = document.getElementById('tablaDetalleCompetencias');
  tbodyComp.innerHTML = MAPA_CURRICULAR.map(compObj => {
    const notaComp = calcularNotaCompetencia(alumno, compObj);
    const descComp = DESCRIPCIONES_COMPETENCIAS[compObj.compNum] || compObj.compNombre;
    return `
      <tr>
        <td title="${descComp}">
          <span class="has-tooltip"><strong>${compObj.compNum}</strong></span>
        </td>
        <td class="col-nota">${notaComp !== null ? notaComp.toFixed(1) : '-'}</td>
      </tr>`;
  }).join('');

  // 4. DESCRIPTORES OPERATIVOS
  const tbodyDesc = document.getElementById('tablaDetalleDescriptores');
  let listaDescriptores = [];
  MAPA_CURRICULAR.forEach(c => {
    c.descriptores.forEach(d => { if (!listaDescriptores.includes(d)) listaDescriptores.push(d); });
  });
  listaDescriptores.sort();

  tbodyDesc.innerHTML = listaDescriptores.map(desc => {
    const notaDesc = calcularNotaDescriptor(alumno, desc);
    const descInfo = DESCRIPCIONES_DESCRIPTORES[desc] || `Descriptor ${desc}`;
    return `
      <tr>
        <td title="${descInfo}">
          <span class="has-tooltip"><strong>${desc}</strong></span>
        </td>
        <td class="col-nota">${notaDesc !== null ? notaDesc.toFixed(1) : '-'}</td>
      </tr>`;
  }).join('');

  // 5. COMPETENCIAS CLAVE
  const tbodyCompClave = document.getElementById('tablaDetalleCompClave');
  let conjuntoCompClave = new Set();
  listaDescriptores.forEach(d => { conjuntoCompClave.add(d.replace(/[0-9]/g, '')); });
  const listaCompClave = Array.from(conjuntoCompClave).sort();

  tbodyCompClave.innerHTML = listaCompClave.map(clave => {
    const notaClave = calcularNotaCompetenciaClave(alumno, clave);
    const config = CONFIG_COMPETENCIAS_CLAVE[clave] || { nombre: clave, colorClass: '' };
    const descClave = DESCRIPCIONES_COMPETENCIAS_CLAVE[clave] || config.nombre;
    const grado = obtenerGradoAdquisicion(notaClave);

    return `
      <tr class="${config.colorClass}">
        <td title="${descClave}">
          <span class="has-tooltip">${config.nombre}</span>
        </td>
        <td class="col-nota">${notaClave !== null ? notaClave.toFixed(1) : '-'}</td>
        <td style="text-align:center;">
          ${notaClave !== null ? `<span class="badge-grado ${grado.clase}">${grado.texto}</span>` : '-'}
        </td>
      </tr>`;
  }).join('');
}

// -------------------------------------------------------------
// GESTIÓN DE UNIDADES DIDÁCTICAS
// -------------------------------------------------------------

function abrirModalAgregarUD() {
  udEdicionIdx = null;
  construirFormularioCriterios15();   // lista limpia con los criterios de la asignatura actual
  document.getElementById('tituloModalUD').innerText = 'Añadir Unidad Didáctica';
  document.getElementById('inputNombreUD').value = '';
  document.getElementById('selectEvaluacionUD').value = '';
  document.getElementById('selectPesoEvalUD').value = '2';
  actualizarPesoEvalUD();
  
  for (let i = 0; i < 15; i++) {
    document.getElementById(`crit_cod_${i}`).value = '';
    document.getElementById(`crit_peso_${i}`).value = '2';
  }

  document.getElementById('btnEliminarUD').classList.add('hidden');
  document.getElementById('modalAgregarUD').classList.remove('hidden');
}

function cerrarModalAgregarUD() {
  document.getElementById('modalAgregarUD').classList.add('hidden');
}

function procesarGuardarUnidad() {
  const nombreUD = document.getElementById('inputNombreUD').value.trim();
  if (!nombreUD) return alert("Por favor, introduce el nombre de la Unidad Didáctica.");

  let listaCriterios = [];
  for (let i = 0; i < 15; i++) {
    const cod = document.getElementById(`crit_cod_${i}`).value.trim();
    const peso = parseInt(document.getElementById(`crit_peso_${i}`).value, 10);
    if (cod) {
      listaCriterios.push({ codigo: cod, peso: peso });
    }
  }

  const evaluacion = parseInt(document.getElementById('selectEvaluacionUD').value, 10) || null;
  const pesoEval = evaluacion ? (parseInt(document.getElementById('selectPesoEvalUD').value, 10) || 2) : 2;

  if (udEdicionIdx === null) {
    estadoApp.unidades.push({
      id: generarIdUnico('ud'),
      nombre: nombreUD,
      criterios: listaCriterios,
      evaluacion: evaluacion,
      pesoEval: pesoEval,
      apartados: []
    });
  } else {
    estadoApp.unidades[udEdicionIdx].nombre = nombreUD;
    estadoApp.unidades[udEdicionIdx].criterios = listaCriterios;
    estadoApp.unidades[udEdicionIdx].evaluacion = evaluacion;
    estadoApp.unidades[udEdicionIdx].pesoEval = pesoEval;
  }

  marcarCambiosPendientes();
  renderizarTablaPrincipal();
  cerrarModalAgregarUD();
}

function abrirModalModificarUUDD() {
  if (estadoApp.unidades.length === 0) return alert("No hay Unidades Didácticas.");
  const contenedor = document.getElementById('listaUUDDModificar');
  contenedor.innerHTML = '';

  estadoApp.unidades.forEach((ud, index) => {
    const item = document.createElement('div');
    item.className = 'item-uudd-gestion';
    item.innerHTML = `
      <span>${index + 1}. ${ud.nombre}</span>
      <div style="display:flex; gap:6px;">
        <button class="btn-info" onclick="event.stopPropagation(); editarUnidadSeleccionada(${index})">✏ Modificar</button>
        <button class="btn-danger" style="font-size:0.75rem; padding:6px 10px;" onclick="event.stopPropagation(); eliminarUnidadDirecto(${index})">🗑 Eliminar</button>
      </div>
    `;
    contenedor.appendChild(item);
  });

  document.getElementById('modalModificarUUDD').classList.remove('hidden');
}

function cerrarModalModificarUUDD() {
  document.getElementById('modalModificarUUDD').classList.add('hidden');
}

function editarUnidadSeleccionada(index) {
  cerrarModalModificarUUDD();
  construirFormularioCriterios15();   // lista limpia con los criterios de la asignatura actual
  udEdicionIdx = index;
  const ud = estadoApp.unidades[index];

  document.getElementById('tituloModalUD').innerText = 'Modificar Unidad Didáctica';
  document.getElementById('inputNombreUD').value = ud.nombre;
  document.getElementById('selectEvaluacionUD').value = ud.evaluacion ? String(ud.evaluacion) : '';
  document.getElementById('selectPesoEvalUD').value = String(ud.pesoEval || 2);
  actualizarPesoEvalUD();

  for (let i = 0; i < 15; i++) {
    const critObj = (ud.criterios && ud.criterios[i]) ? ud.criterios[i] : null;
    if (critObj) {
      const sel = document.getElementById(`crit_cod_${i}`);
      const cod = typeof critObj === 'string' ? critObj : critObj.codigo;
      // criterio de otra asignatura: se conserva con un aviso para no perderlo al guardar
      if (cod && ![...sel.options].some(o => o.value === cod)) sel.add(new Option(`${cod} (no existe en esta asignatura: no cuenta)`, cod));
      sel.value = cod;
      document.getElementById(`crit_peso_${i}`).value = typeof critObj === 'object' ? critObj.peso : 2;
    } else {
      document.getElementById(`crit_cod_${i}`).value = '';
      document.getElementById(`crit_peso_${i}`).value = '2';
    }
  }

  document.getElementById('btnEliminarUD').classList.remove('hidden');
  document.getElementById('modalAgregarUD').classList.remove('hidden');
}

function eliminarUnidadDirecto(index) {
  const ud = estadoApp.unidades[index];
  if (confirm(`¿Estás seguro de que deseas eliminar la unidad "${ud.nombre}"?`)) {
    let idsApartadosAEliminar = [];
    if (ud.apartados) {
      ud.apartados.forEach(ap => {
        idsApartadosAEliminar.push(ap.id);
        if (ap.subapartados) {
          ap.subapartados.forEach(sub => idsApartadosAEliminar.push(sub.id));
        }
      });
    }

    estadoApp.alumnos.forEach(alumno => {
      if (alumno.notasUDManuales && alumno.notasUDManuales[ud.id] !== undefined) {
        delete alumno.notasUDManuales[ud.id];
      }
      if (alumno.notasApartados) {
        idsApartadosAEliminar.forEach(idAp => {
          if (alumno.notasApartados[idAp] !== undefined) {
            delete alumno.notasApartados[idAp];
          }
        });
      }
    });

    estadoApp.unidades.splice(index, 1);
    marcarCambiosPendientes();
    cerrarModalModificarUUDD();
    renderizarTablaPrincipal();
  }
}

function confirmarEliminarUnidad() {
  if (udEdicionIdx === null) return;
  eliminarUnidadDirecto(udEdicionIdx);
  cerrarModalAgregarUD();
}

// -------------------------------------------------------------
// GESTIÓN UNIFICADA DE ALUMNOS Y PERSISTENCIA
// -------------------------------------------------------------

function abrirModalAgregarMasivo() {
  document.getElementById('textoListaAlumnos').value = '';
  document.getElementById('modalAgregarMasivo').classList.remove('hidden');
}

function cerrarModalAgregarMasivo() {
  document.getElementById('modalAgregarMasivo').classList.add('hidden');
}

function procesarListaAlumnosMasiva() {
  const texto = document.getElementById('textoListaAlumnos').value.trim();
  if (!texto) return alert("Por favor, pega una lista de alumnos.");

  const lineas = texto.split(/\r?\n/);
  let añadidos = 0;

  lineas.forEach(linea => {
    const lineaLimpia = linea.trim();
    if (!lineaLimpia) return;

    let nombre = "", apellidos = "";
    if (lineaLimpia.includes(',')) {
      const partes = lineaLimpia.split(',');
      apellidos = partes[0].trim();
      nombre = partes.slice(1).join(',').trim();
    } else {
      const partes = lineaLimpia.split(/\s+/);
      nombre = partes[0];
      apellidos = partes.slice(1).join(' ');
    }

    if (nombre || apellidos) {
      estadoApp.alumnos.push({ id: generarIdUnico('al'), nombre: nombre, apellidos: apellidos, notasUDManuales: {}, notasApartados: {} });
      añadidos++;
    }
  });

  if (añadidos > 0) {
    marcarCambiosPendientes();
    ordenarAlumnos();
    renderizarTablaPrincipal();
    cerrarModalAgregarMasivo();
  }
}

function abrirModalGestionAlumno() {
  if (estadoApp.alumnos.length === 0) return alert("No hay alumnos.");
  const contenedor = document.getElementById('listaGestionAlumnos');
  contenedor.innerHTML = '';

  estadoApp.alumnos.forEach((alumno, index) => {
    const item = document.createElement('div');
    item.className = 'item-alumno item-alumno-gestion';
    item.innerHTML = `
      <span>${index + 1}. ${alumno.apellidos}, ${alumno.nombre}</span>
      <div style="display:flex; gap:6px;">
        <button class="btn-info" onclick="event.stopPropagation(); renombrarAlumno(${index})">✏ Modificar</button>
        <button class="btn-danger" style="font-size:0.75rem; padding:6px 10px;" onclick="event.stopPropagation(); confirmarEliminarAlumno(${index})">🗑️ Eliminar</button>
      </div>
    `;
    contenedor.appendChild(item);
  });

  document.getElementById('modalGestionAlumno').classList.remove('hidden');
}

function cerrarModalGestionAlumno() {
  document.getElementById('modalGestionAlumno').classList.add('hidden');
}

function renombrarAlumno(index) {
  const alumno = estadoApp.alumnos[index];
  const nuevosApellidos = prompt("Apellidos del alumno:", alumno.apellidos);
  if (!nuevosApellidos || nuevosApellidos.trim() === "") return;
  const nuevoNombre = prompt("Nombre del alumno:", alumno.nombre);
  if (!nuevoNombre || nuevoNombre.trim() === "") return;

  alumno.apellidos = nuevosApellidos.trim();
  alumno.nombre = nuevoNombre.trim();

  marcarCambiosPendientes();
  cerrarModalGestionAlumno();
  ordenarAlumnos();
  renderizarTablaPrincipal();
}

function confirmarEliminarAlumno(index) {
  const alumno = estadoApp.alumnos[index];
  if (confirm(`¿Estás seguro de que deseas eliminar a "${alumno.apellidos}, ${alumno.nombre}"?`)) {
    estadoApp.alumnos.splice(index, 1);
    marcarCambiosPendientes();
    cerrarModalGestionAlumno();
    renderizarTablaPrincipal();
  }
}

async function abrirDocumento() {
  if ('showOpenFilePicker' in window) {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: 'Archivo JSON', accept: { 'application/json': ['.json'] } }],
        multiple: false
      });
      const file = await handle.getFile();
      const contenido = await file.text();
      estadoApp = JSON.parse(contenido);
      archivoHandle = handle;
      marcarComoGuardado();
      iniciarVistaHoja();
    } catch (err) {
      if (err.name !== 'AbortError') alert("Error al abrir el archivo.");
    }
  } else {
    document.getElementById('inputCargar').click();
  }
}

function cargarDocumento(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      estadoApp = JSON.parse(e.target.result);
      archivoHandle = null; 
      marcarComoGuardado();
      iniciarVistaHoja();
    } catch (err) {
      alert("Error al cargar el archivo.");
    }
  };
  reader.readAsText(file);
}

async function guardarDocumento() {
  const contenido = JSON.stringify(estadoApp, null, 2);
  const nombreSugerido = `${estadoApp.nombreDocumento || "cuaderno"}.json`;

  try {
    if ('showSaveFilePicker' in window) {
      if (!archivoHandle) {
        archivoHandle = await window.showSaveFilePicker({
          suggestedName: nombreSugerido,
          types: [{ description: 'Archivo JSON', accept: { 'application/json': ['.json'] } }]
        });
      } else {
        const options = { mode: 'readwrite' };
        if ((await archivoHandle.queryPermission(options)) !== 'granted') {
          if ((await archivoHandle.requestPermission(options)) !== 'granted') return alert("Permisos denegados.");
        }
      }
      const writable = await archivoHandle.createWritable();
      await writable.write(contenido);
      await writable.close();
      marcarComoGuardado();
    } else {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(contenido);
      const link = document.createElement('a');
      link.setAttribute("href", dataStr);
      link.setAttribute("download", nombreSugerido);
      document.body.appendChild(link);
      link.click();
      link.remove();
      marcarComoGuardado();
    }
  } catch (err) {
    if (err.name !== 'AbortError') console.error(err);
  }
}

function reiniciarApp() {
  if (cambiosSinGuardar && !confirm("Tienes cambios sin guardar. ¿Seguro que quieres volver al inicio?")) return;
  location.reload();
}
// -------------------------------------------------------------
// CORRECTOR DE GENIALLY (conexión con la extensión)
// -------------------------------------------------------------

// La extensión va dentro de la propia web (carpeta «extension»), lista para descargar desde el aviso.
// Cuando la actualices, sustituye ese zip por el nuevo.
const URL_EXTENSION_GENIALLY = 'extension/evaluador-genially.zip';

function esGenially(item) {
  return !!item && item.herramienta === 'genially';
}

function extensionGeniallyInstalada() {
  return document.documentElement.hasAttribute('data-genially-ext');
}

function buscarItemApartado(idItem, idPadre) {
  const ud = estadoApp.unidades[udActivaIdx];
  if (!ud) return null;
  if (idPadre === null || idPadre === undefined) return (ud.apartados || []).find(a => a.id === idItem) || null;
  const padre = (ud.apartados || []).find(a => a.id === idPadre);
  return padre ? (padre.subapartados || []).find(sb => sb.id === idItem) || null : null;
}

// Busca un apartado o subapartado por su id en todas las UD
function localizarApartado(id) {
  for (let i = 0; i < estadoApp.unidades.length; i++) {
    const ud = estadoApp.unidades[i];
    for (const ap of (ud.apartados || [])) {
      if (ap.id === id) return { ud, udIdx: i, item: ap };
      for (const sub of (ap.subapartados || [])) if (sub.id === id) return { ud, udIdx: i, item: sub, padre: ap };
    }
  }
  return null;
}

function mostrarToast(texto, esError) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = texto;
  t.className = 'toast' + (esError ? ' error' : '');
  clearTimeout(mostrarToast._t);
  mostrarToast._t = setTimeout(() => t.classList.add('hidden'), esError ? 7000 : 4000);
}

function abrirModalGenially(motivo) {
  document.getElementById('geniallyMotivo').textContent = motivo || 'No se ha detectado la extensión en este navegador.';
  const paso = document.getElementById('pasoDescarga');
  if (URL_EXTENSION_GENIALLY) {
    paso.innerHTML = '<a class="btn-descarga" href="' + URL_EXTENSION_GENIALLY + '" download>⬇️ Descargar la extensión (.zip)</a><br>Descomprime el zip en una carpeta que no vayas a borrar (Chrome la usa siempre desde ahí).';
  }
  document.getElementById('pasoArchivo').classList.toggle('hidden', location.protocol !== 'file:');
  document.getElementById('modalGenially').classList.remove('hidden');
}

function cerrarModalGenially() {
  document.getElementById('modalGenially').classList.add('hidden');
}

const pendientesGenially = new Map();

function menuAccionCorregirGenially() {
  const { idItem, idPadre } = contextoEngranaje;
  const ud = estadoApp.unidades[udActivaIdx];
  const item = buscarItemApartado(idItem, idPadre);
  cerrarModalOpcionesApartado();
  if (!item) return;

  if (!extensionGeniallyInstalada()) return abrirModalGenially();
  if (!estadoApp.alumnos.length) return alert('Añade primero la lista de alumnos.');

  const payload = {
    sesion: item.id,
    apartadoId: item.id,
    titulo: `${estadoApp.nombreDocumento} · ${ud.nombre} · ${item.nombre}`,
    alumnos: estadoApp.alumnos.map(a => ({ id: a.id, nombre: `${a.apellidos}, ${a.nombre}` })),
    proyecto: item.genially || null
  };
  const reqId = 'r' + Date.now() + Math.random().toString(36).slice(2);
  const espera = setTimeout(() => {
    pendientesGenially.delete(reqId);
    abrirModalGenially('La extensión no responde. Recarga esta página (después de guardar) y vuelve a intentarlo.');
  }, 6000);
  pendientesGenially.set(reqId, (r) => {
    clearTimeout(espera);
    if (r.ok) mostrarToast('🧩 Abriendo el corrector de Genially para «' + item.nombre + '»…');
    else abrirModalGenially('No se pudo abrir el corrector: ' + (r.error || 'error desconocido') + '.');
  });
  window.postMessage({ origen: 'cuaderno-lomloe', tipo: 'abrir-corrector', reqId, payload }, '*');
}

function rerenderVistaActual() {
  if (!document.getElementById('vistaCorrector').classList.contains('hidden')) return;   // la tabla se repinta al volver
  if (!document.getElementById('vistaUD').classList.contains('hidden')) renderizarTablaUD();
  else if (!document.getElementById('vistaDetalle').classList.contains('hidden')) renderizarDetalleAlumno();
  else if (!document.getElementById('app').classList.contains('hidden')) renderizarTablaPrincipal();
}

// Mensajes que llegan desde la extensión
window.addEventListener('message', (ev) => {
  const d = ev.data;
  if (ev.source !== window || !d || d.origen !== 'genially-ext') return;

  if (d.tipo === 'respuesta') {
    const f = pendientesGenially.get(d.reqId);
    if (f) { pendientesGenially.delete(d.reqId); f(d); }
    return;
  }

  if (d.tipo === 'notas') {
    const ack = (ok, error, recibidas) => window.postMessage({ origen: 'cuaderno-lomloe', tipo: 'ack', reqId: d.reqId, ok, error: error || '', recibidas: recibidas || 0 }, '*');
    const loc = localizarApartado(d.apartadoId);
    if (!loc) return ack(false, 'este apartado no está en el cuaderno abierto');

    let recibidas = 0;
    const notas = d.notas || {};
    estadoApp.alumnos.forEach(al => {
      const v = notas[al.id];
      if (typeof v === 'number' && !isNaN(v)) {
        if (!al.notasApartados) al.notasApartados = {};
        al.notasApartados[loc.item.id] = Math.round(Math.max(0, Math.min(10, v)) * 100) / 100;
        recibidas++;
      }
    });
    if (d.proyecto) loc.item.genially = d.proyecto;   // modelo, criterios, enlaces y análisis: viajan dentro del archivo del cuaderno
    marcarCambiosPendientes();
    rerenderVistaActual();
    ack(true, '', recibidas);
    if (recibidas) mostrarToast('🧩 ' + recibidas + ' nota(s) de «' + loc.item.nombre + '» recibidas del corrector de Genially. Recuerda guardar el archivo.');
  }
});

// -------------------------------------------------------------
// CORRECTORES INTEGRADOS EN ESTA WEB (Scratch y Presentaciones)
// Se abren dentro del cuaderno, en un marco, y se comunican por mensajes.
// -------------------------------------------------------------

const CORRECTORES = {
  scratch:        { src: 'scratch/index.html',        icono: '🐱', nombre: 'Scratch',        origen: 'corrector-scratch' },
  presentaciones: { src: 'presentaciones/index.html', icono: '📊', nombre: 'Presentaciones', origen: 'corrector-presentaciones' }
};

function esScratch(item) {
  return !!item && item.herramienta === 'scratch';
}

function esPresentaciones(item) {
  return !!item && item.herramienta === 'presentaciones';
}

function iconoHerramienta(item) {
  if (esGenially(item)) return '🧩 ';
  const c = item && CORRECTORES[item.herramienta];
  return c ? c.icono + ' ' : '';
}

const SCR = { item: null, herramienta: '', titulo: '', ocupado: false, esperaFlush: null };

function abrirCorrectorIntegrado(herramienta) {
  const { idItem, idPadre } = contextoEngranaje;
  const ud = estadoApp.unidades[udActivaIdx];
  const item = buscarItemApartado(idItem, idPadre);
  const conf = CORRECTORES[herramienta];
  cerrarModalOpcionesApartado();
  if (!item || !conf) return;
  if (!estadoApp.alumnos.length) return alert('Añade primero la lista de alumnos.');

  SCR.item = item;
  SCR.herramienta = herramienta;
  SCR.ocupado = false;
  SCR.titulo = `${ud.nombre} · ${item.nombre}`;
  document.getElementById('tituloCorrector').textContent = conf.icono + ' ' + item.nombre;
  document.getElementById('badgeCorrector').textContent = conf.icono + ' ' + conf.nombre;
  document.getElementById('vistaUD').classList.add('hidden');
  document.getElementById('vistaCorrector').classList.remove('hidden');
  const marco = document.getElementById('marcoCorrector');
  marco.title = 'Corrector de ' + conf.nombre;
  marco.src = conf.src + '?cuaderno=1&t=' + Date.now();
}

function menuAccionCorregirScratch() { abrirCorrectorIntegrado('scratch'); }
function menuAccionCorregirPresentaciones() { abrirCorrectorIntegrado('presentaciones'); }

function enviarAlCorrector(m) {
  const f = document.getElementById('marcoCorrector');
  if (f && f.contentWindow) f.contentWindow.postMessage({ origen: 'cuaderno-lomloe', ...m }, '*');
}

// Recibe el estado del corrector: guarda el proyecto en el apartado y pone las notas
function aplicarEstadoCorrector(d) {
  const item = SCR.item;
  if (!item) return;
  if (d.proyecto) item[SCR.herramienta] = d.proyecto;     // item.scratch / item.presentaciones
  const notas = d.notas || {};
  let n = 0;
  estadoApp.alumnos.forEach(al => {
    const v = notas[al.id];
    if (typeof v === 'number' && !isNaN(v)) {
      if (!al.notasApartados) al.notasApartados = {};
      al.notasApartados[item.id] = Math.round(Math.max(0, Math.min(10, v)) * 100) / 100;
      n++;
    }
  });
  marcarCambiosPendientes();
  return n;
}

async function volverDelCorrector() {
  if (SCR.ocupado && !confirm('El corrector está trabajando. Si sales ahora se detiene (lo ya corregido se conserva). ¿Salir?')) return;
  // pide al corrector su último estado antes de cerrarlo
  await new Promise(res => {
    const t = setTimeout(() => { SCR.esperaFlush = null; res(); }, 1500);
    SCR.esperaFlush = () => { clearTimeout(t); SCR.esperaFlush = null; res(); };
    enviarAlCorrector({ tipo: 'flush' });
  });
  document.getElementById('marcoCorrector').src = 'about:blank';
  SCR.item = null;
  document.getElementById('vistaCorrector').classList.add('hidden');
  document.getElementById('vistaUD').classList.remove('hidden');
  renderizarTablaUD();
}

window.addEventListener('message', (ev) => {
  const f = document.getElementById('marcoCorrector');
  const d = ev.data;
  const conf = CORRECTORES[SCR.herramienta];
  if (!f || ev.source !== f.contentWindow || !d || !conf || d.origen !== conf.origen) return;

  if (d.tipo === 'listo') {
    if (!SCR.item) return;
    enviarAlCorrector({
      tipo: 'init',
      titulo: `${estadoApp.nombreDocumento} · ${SCR.titulo}`,
      alumnos: estadoApp.alumnos.map(a => ({ id: a.id, nombre: `${a.apellidos}, ${a.nombre}` })),
      proyecto: SCR.item[SCR.herramienta] || null
    });
  } else if (d.tipo === 'estado') {
    aplicarEstadoCorrector(d);
    if (SCR.esperaFlush) SCR.esperaFlush();
  } else if (d.tipo === 'ocupado') {
    SCR.ocupado = !!d.valor;
  }
});

// Avisa también al recargar o cerrar la página mientras se corrige
window.addEventListener('beforeunload', (event) => {
  if (SCR.item && SCR.ocupado) { event.preventDefault(); event.returnValue = ''; }
});

// -------------------------------------------------------------
// ACCESO A LA HERRAMIENTA PINCHANDO EN EL NOMBRE DEL APARTADO
// -------------------------------------------------------------

function tieneHerramienta(item) {
  return !!item && (esGenially(item) || !!CORRECTORES[item.herramienta]);
}

// Nombre del apartado en la cabecera: subrayado y pulsable si tiene corrector automático
function nombreConEnlace(item, idPadre) {
  const esHoja = !(item.subapartados && item.subapartados.length);
  const nombre = String(item.nombre).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  if (!tieneHerramienta(item) || !esHoja) return nombre;
  const padre = idPadre ? `'${idPadre}'` : 'null';
  return `<a href="#" class="enlace-herramienta" title="Abrir el corrector de este apartado" onclick="event.preventDefault(); abrirHerramientaApartado('${item.id}', ${padre})">${nombre}</a>`;
}

function abrirHerramientaApartado(idItem, idPadre) {
  const item = buscarItemApartado(idItem, idPadre);
  if (!item) return;
  contextoEngranaje = { idItem, idPadre, nombre: item.nombre, esPadre: idPadre === null };
  if (esGenially(item)) menuAccionCorregirGenially();
  else if (CORRECTORES[item.herramienta]) abrirCorrectorIntegrado(item.herramienta);
}

// -------------------------------------------------------------
// EVALUACIONES (1ª, 2ª, 3ª Y FINAL)
// -------------------------------------------------------------

const NOMBRE_PESO = { 1: 'baja', 2: 'media', 3: 'alta' };

function actualizarPesoEvalUD() {
  const sinEval = !document.getElementById('selectEvaluacionUD').value;
  document.getElementById('selectPesoEvalUD').disabled = sinEval;
}

// Evaluaciones que tienen al menos una unidad asignada (en orden)
function evaluacionesUsadas() {
  return [1, 2, 3].filter(n => estadoApp.unidades.some(ud => ud.evaluacion === n));
}

// Media ponderada (por la importancia de cada UD) de las unidades de la evaluación que tienen nota
function calcularNotaEvaluacion(alumno, n) {
  let suma = 0, pesos = 0;
  estadoApp.unidades.forEach(ud => {
    if (ud.evaluacion !== n) return;
    const nota = calcularNotaUD(alumno, ud);
    if (nota === null) return;
    const w = parseInt(ud.pesoEval, 10) || 2;
    suma += nota * w;
    pesos += w;
  });
  return pesos ? suma / pesos : null;
}

// Evaluación final: media de las evaluaciones que tienen nota
function calcularNotaFinal(alumno) {
  const notas = evaluacionesUsadas().map(n => calcularNotaEvaluacion(alumno, n)).filter(v => v !== null);
  return notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : null;
}

// -------------------------------------------------------------
// MOVER UNIDADES Y APARTADOS A IZQUIERDA / DERECHA
// -------------------------------------------------------------

let udOpcionesIdx = null;

function abrirOpcionesUD(index) {
  udOpcionesIdx = index;
  pintarOpcionesUD();
  document.getElementById('modalOpcionesUD').classList.remove('hidden');
}

function pintarOpcionesUD() {
  const ud = estadoApp.unidades[udOpcionesIdx];
  if (!ud) return;
  document.getElementById('tituloOpcionesUD').textContent = `Opciones: ${ud.nombre}`;
  document.getElementById('subtituloOpcionesUD').textContent = `Unidad ${udOpcionesIdx + 1} de ${estadoApp.unidades.length}` + (ud.evaluacion ? ` · ${ud.evaluacion}ª evaluación` : '');
  document.getElementById('btnMoverUDIzq').disabled = udOpcionesIdx <= 0;
  document.getElementById('btnMoverUDDer').disabled = udOpcionesIdx >= estadoApp.unidades.length - 1;
}

function cerrarModalOpcionesUD() {
  document.getElementById('modalOpcionesUD').classList.add('hidden');
}

// El menú se queda abierto para poder mover varias posiciones seguidas
function moverUnidad(delta) {
  const i = udOpcionesIdx, j = i + delta, lista = estadoApp.unidades;
  if (i === null || j < 0 || j >= lista.length) return;
  [lista[i], lista[j]] = [lista[j], lista[i]];
  udOpcionesIdx = j;
  marcarCambiosPendientes();
  renderizarTablaPrincipal();
  pintarOpcionesUD();
}

function menuUDAbrir() { const i = udOpcionesIdx; cerrarModalOpcionesUD(); abrirVistaUD(i); }
function menuUDModificar() { const i = udOpcionesIdx; cerrarModalOpcionesUD(); editarUnidadSeleccionada(i); }
function menuUDEliminar() { const i = udOpcionesIdx; cerrarModalOpcionesUD(); eliminarUnidadDirecto(i); }

// Lista de hermanos del apartado del engranaje (apartados principales de la UD o subapartados del bloque)
function hermanosApartado() {
  const ud = estadoApp.unidades[udActivaIdx];
  if (!ud) return null;
  const { idPadre } = contextoEngranaje;
  if (idPadre === null || idPadre === undefined) return ud.apartados || [];
  const padre = (ud.apartados || []).find(a => a.id === idPadre);
  return padre ? (padre.subapartados || []) : null;
}

function actualizarBotonesMoverApartado() {
  const lista = hermanosApartado() || [];
  const i = lista.findIndex(x => x.id === contextoEngranaje.idItem);
  document.getElementById('btnMoverApIzq').disabled = i <= 0;
  document.getElementById('btnMoverApDer').disabled = i < 0 || i >= lista.length - 1;
}

function moverApartado(delta) {
  const lista = hermanosApartado();
  if (!lista) return;
  const i = lista.findIndex(x => x.id === contextoEngranaje.idItem), j = i + delta;
  if (i < 0 || j < 0 || j >= lista.length) return;
  [lista[i], lista[j]] = [lista[j], lista[i]];
  marcarCambiosPendientes();
  renderizarTablaUD();
  actualizarBotonesMoverApartado();
}
