// MAPA CURRICULAR OFICIAL LOMLOE
const MAPA_CURRICULAR = [
  {
    compNum: "1",
    compNombre: "1. Buscar y seleccionar información...",
    descriptores: ["CCL3", "STEM2", "CD1", "CD4", "CPSAA4", "CE1"],
    criterios: ["1.1", "1.2", "1.3"]
  },
  {
    compNum: "2",
    compNombre: "2. Abordar problemas tecnológicos...",
    descriptores: ["CCL1", "STEM1", "STEM3", "CD3", "CPSAA3", "CPSAA5", "CE1", "CE3"],
    criterios: ["2.1", "2.2"]
  },
  {
    compNum: "3",
    compNombre: "3. Utilizar operadores y sistemas...",
    descriptores: ["STEM2", "STEM3", "STEM5", "CD5", "CPSAA1", "CE3", "CCEC3"],
    criterios: ["3.1"]
  },
  {
    compNum: "4",
    compNombre: "4. Representar e intercambiar ideas...",
    descriptores: ["CCL1", "STEM4", "CD3", "CCEC3", "CCEC4"],
    criterios: ["4.1"]
  },
  {
    compNum: "5",
    compNombre: "5. Desarrollar algoritmos y aplicaciones...",
    descriptores: ["CP2", "STEM1", "STEM3", "CD5", "CPSAA5", "CE3"],
    criterios: ["5.1", "5.2", "5.3"]
  },
  {
    compNum: "6",
    compNombre: "6. Comprender funcionamiento de dispositivos...",
    descriptores: ["CP2", "CD2", "CD4", "CD5", "CPSAA4", "CPSAA5"],
    criterios: ["6.1", "6.2", "6.3"]
  },
  {
    compNum: "7",
    compNombre: "7. Hacer uso responsable y ético...",
    descriptores: ["STEM2", "STEM5", "CD4", "CC4"],
    criterios: ["7.1", "7.2"]
  }
];

let estadoApp = {
  nombreDocumento: "",
  unidades: [
    { nombre: "1. PRESENTACIONES GOOGLE", criterios: ["1.1", "1.2", "1.3"] },
    { nombre: "2. PROCESADOR DE TEXTO", criterios: ["1.1", "2.1", "2.2"] }
  ],
  alumnos: [
    { 
      nombre: "Ana", 
      apellidos: "García López", 
      notasUUDD: { "1. PRESENTACIONES GOOGLE": 6.3, "2. PROCESADOR DE TEXTO": 5.7 }
    },
    { 
      nombre: "Carlos", 
      apellidos: "Álvarez Martínez", 
      notasUUDD: { "1. PRESENTACIONES GOOGLE": 8.0 }
    }
  ]
};

let alumnoSeleccionadoIdx = null;
let udEdicionIdx = null; // null -> Crear nueva | número -> Editar existente
let archivoHandle = null;
let cambiosSinGuardar = false;

// PROTEGER CIERRE DE PESTAÑA
window.addEventListener('beforeunload', (event) => {
  if (cambiosSinGuardar) {
    event.preventDefault();
    event.returnValue = '';
  }
});

function marcarCambiosPendientes() {
  cambiosSinGuardar = true;
  document.querySelectorAll('.estado-guardado').forEach(el => {
    el.innerText = '• Cambios sin guardar';
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

function obtenerNombreUD(ud) {
  if (!ud) return "";
  return typeof ud === 'string' ? ud : (ud.nombre || "");
}

function mostrarFormNuevoDoc() {
  document.getElementById('formNuevoDoc').classList.remove('hidden');
}

function crearNuevoDocumento() {
  const nombre = document.getElementById('nombreDoc').value.trim();
  if (!nombre) return alert("Por favor, introduce el nombre del documento.");

  archivoHandle = null;
  estadoApp.nombreDocumento = nombre;
  estadoApp.unidades = [];
  estadoApp.alumnos = [];

  marcarCambiosPendientes();
  iniciarVistaHoja();
}

function iniciarVistaHoja() {
  document.getElementById('modalInicio').classList.add('hidden');
  document.getElementById('vistaDetalle').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('tituloDocumento').innerText = estadoApp.nombreDocumento;
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

// -------------------------------------------------------------
// MOTOR DE CÁLCULO EN CASCADA (LOMLOE)
// -------------------------------------------------------------

function calcularNotaCriterio(alumno, codCriterio) {
  let suma = 0;
  let recuento = 0;

  estadoApp.unidades.forEach(ud => {
    const nombreUD = obtenerNombreUD(ud);
    if (ud.criterios && ud.criterios.includes(codCriterio)) {
      if (alumno.notasUUDD && alumno.notasUUDD[nombreUD] !== undefined && alumno.notasUUDD[nombreUD] !== "") {
        suma += parseFloat(alumno.notasUUDD[nombreUD]);
        recuento++;
      }
    }
  });

  return recuento > 0 ? (suma / recuento) : null;
}

function calcularNotaCompetencia(alumno, compObj) {
  let suma = 0;
  let recuento = 0;

  compObj.criterios.forEach(crit => {
    const notaCrit = calcularNotaCriterio(alumno, crit);
    if (notaCrit !== null) {
      suma += notaCrit;
      recuento++;
    }
  });

  return recuento > 0 ? (suma / recuento) : null;
}

function calcularNotaDescriptor(alumno, codDescriptor) {
  let suma = 0;
  let recuento = 0;

  MAPA_CURRICULAR.forEach(compObj => {
    if (compObj.descriptores.includes(codDescriptor)) {
      const notaComp = calcularNotaCompetencia(alumno, compObj);
      if (notaComp !== null) {
        suma += notaComp;
        recuento++;
      }
    }
  });

  return recuento > 0 ? (suma / recuento) : null;
}

function calcularNotaCompetenciaClave(alumno, prefijoCompClave) {
  let descriptoresAsociados = [];

  MAPA_CURRICULAR.forEach(compObj => {
    compObj.descriptores.forEach(desc => {
      const prefijo = desc.replace(/[0-9]/g, '');
      if (prefijo === prefijoCompClave && !descriptoresAsociados.includes(desc)) {
        descriptoresAsociados.push(desc);
      }
    });
  });

  let suma = 0;
  let recuento = 0;

  descriptoresAsociados.forEach(desc => {
    const notaDesc = calcularNotaDescriptor(alumno, desc);
    if (notaDesc !== null) {
      suma += notaDesc;
      recuento++;
    }
  });

  return recuento > 0 ? (suma / recuento) : null;
}

// -------------------------------------------------------------
// RENDERIZADO Y INTERFAZ
// -------------------------------------------------------------

function renderizarTablaPrincipal() {
  const filaCabecera = document.getElementById('filaCabecera');
  const cuerpoAlumnos = document.getElementById('cuerpoAlumnos');

  filaCabecera.innerHTML = `<th class="col-alumno">ALUMNOS</th>`;
  estadoApp.unidades.forEach(ud => {
    const th = document.createElement('th');
    th.innerText = obtenerNombreUD(ud);
    filaCabecera.appendChild(th);
  });
  filaCabecera.innerHTML += `<th style="text-align:center;">INFORMACIÓN</th>`;

  cuerpoAlumnos.innerHTML = '';
  estadoApp.alumnos.forEach((alumno, idx) => {
    const tr = document.createElement('tr');
    const nombreCompleto = `${alumno.apellidos}, ${alumno.nombre}`;
    
    let htmlFila = `<td class="nombre-alumno">${nombreCompleto}</td>`;

    estadoApp.unidades.forEach(ud => {
      const nombreUD = obtenerNombreUD(ud);
      const val = (alumno.notasUUDD && alumno.notasUUDD[nombreUD] !== undefined) ? alumno.notasUUDD[nombreUD] : "";

      htmlFila += `
        <td class="nota-celda">
          <input type="number" class="nota-input" step="0.1" min="0" max="10"
                 value="${val}" placeholder="-"
                 onchange="actualizarNotaUDDirecta(${idx}, '${nombreUD}', this.value)">
        </td>
      `;
    });

    htmlFila += `
      <td style="text-align:center;">
        <button class="btn-info" onclick="verMasInformacion(${idx})">MÁS INFORMACIÓN</button>
      </td>
    `;

    tr.innerHTML = htmlFila;
    cuerpoAlumnos.appendChild(tr);
  });
}

function actualizarNotaUDDirecta(idxAlumno, nombreUD, valor) {
  const alumno = estadoApp.alumnos[idxAlumno];
  if (!alumno.notasUUDD) alumno.notasUUDD = {};

  const num = parseFloat(valor);
  if (!isNaN(num)) {
    alumno.notasUUDD[nombreUD] = num;
  } else {
    delete alumno.notasUUDD[nombreUD];
  }

  marcarCambiosPendientes();
}

// -------------------------------------------------------------
// GESTIÓN Y MODAL DE UNIDADES DIDÁCTICAS (CREAR / EDITAR)
// -------------------------------------------------------------

function abrirModalAgregarUD() {
  udEdicionIdx = null; // Modo creación
  document.getElementById('tituloModalUD').innerText = 'Añadir Unidad Didáctica';
  document.getElementById('inputNombreUD').value = '';
  document.getElementById('inputCriteriosUD').value = '';
  document.getElementById('modalAgregarUD').classList.remove('hidden');
}

function cerrarModalAgregarUD() {
  document.getElementById('modalAgregarUD').classList.add('hidden');
}

function procesarGuardarUnidad() {
  const nombreUD = document.getElementById('inputNombreUD').value.trim();
  const textoCriterios = document.getElementById('inputCriteriosUD').value.trim();

  if (!nombreUD) {
    return alert("Por favor, introduce el nombre de la Unidad Didáctica.");
  }

  const listaCriterios = textoCriterios
    ? textoCriterios.split(/[\s,]+/).map(c => c.trim()).filter(c => c !== "")
    : [];

  if (udEdicionIdx === null) {
    // AÑADIR NUEVA UNIDAD
    estadoApp.unidades.push({
      nombre: nombreUD,
      criterios: listaCriterios
    });
  } else {
    // EDITAR UNIDAD EXISTENTE
    const nombreAnterior = obtenerNombreUD(estadoApp.unidades[udEdicionIdx]);

    estadoApp.unidades[udEdicionIdx] = {
      nombre: nombreUD,
      criterios: listaCriterios
    };

    // Si cambió el nombre de la UD, reasignar las notas guardadas de los alumnos a la nueva clave
    if (nombreAnterior !== nombreUD) {
      estadoApp.alumnos.forEach(alumno => {
        if (alumno.notasUUDD && alumno.notasUUDD[nombreAnterior] !== undefined) {
          alumno.notasUUDD[nombreUD] = alumno.notasUUDD[nombreAnterior];
          delete alumno.notasUUDD[nombreAnterior];
        }
      });
    }
  }

  marcarCambiosPendientes();
  renderizarTablaPrincipal();
  cerrarModalAgregarUD();
}

function abrirModalModificarUUDD() {
  if (estadoApp.unidades.length === 0) return alert("No hay Unidades Didácticas para modificar.");

  const contenedor = document.getElementById('listaUUDDModificar');
  contenedor.innerHTML = '';

  estadoApp.unidades.forEach((ud, index) => {
    const item = document.createElement('div');
    item.className = 'item-uudd';
    const nombre = obtenerNombreUD(ud);
    const critTexto = ud.criterios ? ud.criterios.join(' ') : 'Sin criterios';
    item.innerText = `${index + 1}. ${nombre} (${critTexto})`;
    item.onclick = () => editarUnidadSeleccionada(index);
    contenedor.appendChild(item);
  });

  document.getElementById('modalModificarUUDD').classList.remove('hidden');
}

function cerrarModalModificarUUDD() {
  document.getElementById('modalModificarUUDD').classList.add('hidden');
}

function editarUnidadSeleccionada(index) {
  cerrarModalModificarUUDD();

  udEdicionIdx = index; // Guardar índice para guardar cambios
  const ud = estadoApp.unidades[index];

  document.getElementById('tituloModalUD').innerText = 'Modificar Unidad Didáctica';
  document.getElementById('inputNombreUD').value = obtenerNombreUD(ud);
  document.getElementById('inputCriteriosUD').value = ud.criterios ? ud.criterios.join(' ') : '';
  
  document.getElementById('modalAgregarUD').classList.remove('hidden');
}

// -------------------------------------------------------------
// VISTA "MÁS INFORMACIÓN" (DETALLE DEL ALUMNO)
// -------------------------------------------------------------

function verMasInformacion(idxAlumno) {
  alumnoSeleccionadoIdx = idxAlumno;
  const alumno = estadoApp.alumnos[idxAlumno];

  document.getElementById('app').classList.add('hidden');
  document.getElementById('vistaDetalle').classList.remove('hidden');
  document.getElementById('tituloAlumnoDetalle').innerText = `${alumno.apellidos}, ${alumno.nombre}`;

  renderizarDetalleAlumno();
}

function volverAContactoPrincipal() {
  document.getElementById('vistaDetalle').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  renderizarTablaPrincipal();
}

function renderizarDetalleAlumno() {
  const alumno = estadoApp.alumnos[alumnoSeleccionadoIdx];

  // 1. TABLA UNIDADES DIDÁCTICAS
  const tbodyUD = document.getElementById('tablaDetalleUD');
  tbodyUD.innerHTML = estadoApp.unidades.map(ud => {
    const nombreUD = obtenerNombreUD(ud);
    const nota = (alumno.notasUUDD && alumno.notasUUDD[nombreUD] !== undefined) ? parseFloat(alumno.notasUUDD[nombreUD]) : null;
    return `
      <tr>
        <td>${nombreUD}</td>
        <td class="col-nota">${nota !== null ? nota.toFixed(1) : '-'}</td>
      </tr>
    `;
  }).join('');

  // 2. TABLA CRITERIOS DE EVALUACIÓN
  const tbodyCrit = document.getElementById('tablaDetalleCriterios');
  let htmlCriterios = '';
  MAPA_CURRICULAR.forEach(comp => {
    comp.criterios.forEach(crit => {
      const notaCrit = calcularNotaCriterio(alumno, crit);
      htmlCriterios += `
        <tr>
          <td style="text-align:center;">${crit}</td>
          <td class="col-nota">${notaCrit !== null ? notaCrit.toFixed(1) : '-'}</td>
        </tr>
      `;
    });
  });
  tbodyCrit.innerHTML = htmlCriterios;

  // 3. TABLA COMPETENCIAS ESPECÍFICAS
  const tbodyComp = document.getElementById('tablaDetalleCompetencias');
  tbodyComp.innerHTML = MAPA_CURRICULAR.map(compObj => {
    const notaComp = calcularNotaCompetencia(alumno, compObj);
    return `
      <tr>
        <td style="text-align:center;">${compObj.compNum}</td>
        <td class="col-nota">${notaComp !== null ? notaComp.toFixed(1) : '-'}</td>
      </tr>
    `;
  }).join('');

  // 4. TABLA DESCRIPTORES OPERATIVOS
  const tbodyDesc = document.getElementById('tablaDetalleDescriptores');
  let listaDescriptores = [];
  MAPA_CURRICULAR.forEach(c => {
    c.descriptores.forEach(d => {
      if (!listaDescriptores.includes(d)) listaDescriptores.push(d);
    });
  });
  listaDescriptores.sort();

  tbodyDesc.innerHTML = listaDescriptores.map(desc => {
    const notaDesc = calcularNotaDescriptor(alumno, desc);
    return `
      <tr>
        <td style="text-align:center;">${desc}</td>
        <td class="col-nota">${notaDesc !== null ? notaDesc.toFixed(1) : '-'}</td>
      </tr>
    `;
  }).join('');

  // 5. TABLA COMPETENCIAS CLAVE
  const tbodyCompClave = document.getElementById('tablaDetalleCompClave');
  let conjuntoCompClave = new Set();
  listaDescriptores.forEach(d => {
    conjuntoCompClave.add(d.replace(/[0-9]/g, ''));
  });
  const listaCompClave = Array.from(conjuntoCompClave).sort();

  tbodyCompClave.innerHTML = listaCompClave.map(clave => {
    const notaClave = calcularNotaCompetenciaClave(alumno, clave);
    return `
      <tr>
        <td style="text-align:center;">${clave}</td>
        <td class="col-nota">${notaClave !== null ? notaClave.toFixed(1) : '-'}</td>
      </tr>
    `;
  }).join('');
}

// -------------------------------------------------------------
// GESTIÓN Y MODALES DE ALUMNOS
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

    let nombre = "";
    let apellidos = "";

    if (lineaLimpia.includes(',')) {
      const partes = lineaLimpia.split(',');
      apellidos = partes[0].trim();
      nombre = partes.slice(1).join(',').trim();
    } else {
      const partes = lineaLimpia.split(/\s+/);
      if (partes.length === 1) {
        nombre = partes[0];
        apellidos = "";
      } else {
        nombre = partes[0];
        apellidos = partes.slice(1).join(' ');
      }
    }

    if (nombre || apellidos) {
      estadoApp.alumnos.push({
        nombre: nombre,
        apellidos: apellidos,
        notasUUDD: {}
      });
      añadidos++;
    }
  });

  if (añadidos > 0) {
    marcarCambiosPendientes();
    ordenarAlumnos();
    renderizarTablaPrincipal();
    cerrarModalAgregarMasivo();
    alert(`✓ Se han añadido ${añadidos} alumnos correctamente.`);
  } else {
    alert("No se pudo extraer ningún alumno del texto proporcionado.");
  }
}

function abrirModalModificarAlumno() {
  if (estadoApp.alumnos.length === 0) return alert("No hay alumnos para modificar.");

  const contenedor = document.getElementById('listaAlumnosModificar');
  contenedor.innerHTML = '';

  estadoApp.alumnos.forEach((alumno, index) => {
    const item = document.createElement('div');
    item.className = 'item-alumno';
    item.innerText = `${index + 1}. ${alumno.apellidos}, ${alumno.nombre}`;
    item.onclick = () => renombrarAlumno(index);
    contenedor.appendChild(item);
  });

  document.getElementById('modalModificarAlumno').classList.remove('hidden');
}

function cerrarModalModificarAlumno() {
  document.getElementById('modalModificarAlumno').classList.add('hidden');
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
  cerrarModalModificarAlumno();
  ordenarAlumnos();
  renderizarTablaPrincipal();
}

function abrirModalEliminarAlumno() {
  if (estadoApp.alumnos.length === 0) return alert("No hay alumnos para eliminar.");

  const contenedor = document.getElementById('listaAlumnosEliminar');
  contenedor.innerHTML = '';

  estadoApp.alumnos.forEach((alumno, index) => {
    const item = document.createElement('div');
    item.className = 'item-alumno item-alumno-danger';
    item.innerText = `🗑️ ${index + 1}. ${alumno.apellidos}, ${alumno.nombre}`;
    item.onclick = () => confirmarEliminarAlumno(index);
    contenedor.appendChild(item);
  });

  document.getElementById('modalEliminarAlumno').classList.remove('hidden');
}

function cerrarModalEliminarAlumno() {
  document.getElementById('modalEliminarAlumno').classList.add('hidden');
}

function confirmarEliminarAlumno(index) {
  const alumno = estadoApp.alumnos[index];
  if (confirm(`¿Estás seguro de que deseas eliminar a "${alumno.apellidos}, ${alumno.nombre}"?`)) {
    estadoApp.alumnos.splice(index, 1);
    marcarCambiosPendientes();
    cerrarModalEliminarAlumno();
    renderizarTablaPrincipal();
  }
}

// PERSISTENCIA ARCHIVO
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

function cargarDocumento(event) {
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      estadoApp = JSON.parse(e.target.result);
      marcarComoGuardado();
      iniciarVistaHoja();
    } catch (err) {
      alert("Error al cargar el archivo seleccionado.");
    }
  };
  if (event.target.files[0]) {
    reader.readAsText(event.target.files[0]);
  }
}

function reiniciarApp() {
  if (cambiosSinGuardar) {
    if (!confirm("Tienes cambios sin guardar. ¿Seguro que quieres volver al inicio?")) return;
  }
  location.reload();
}