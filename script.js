// DICCIONARIOS DE DESCRIPCIÓN PARA TOOLTIPS LOMLOE
const DESCRIPCIONES_COMPETENCIAS = {
  "1": "1. Buscar, seleccionar y organizar información en entornos digitales con actitud crítica y segura.",
  "2": "2. Abordar problemas mediante el diseño y construcción de soluciones tecnológicas sostenibles.",
  "3": "3. Utilizar herramientas informáticas y de diseño para la creación de contenido digital.",
  "4": "4. Representar e comunicar ideas técnicas utilizando simbología y normalización adecuada.",
  "5": "5. Desarrollar un proyecto técnico trabajando de forma cooperativa e inclusiva.",
  "6": "6. Comprender el funcionamiento de los sistemas tecnológicos y su impacto en la sociedad.",
  "7": "7. Hacer uso responsable de los recursos tecnológicos promoviendo el desarrollo sostenible."
};

const DESCRIPCIONES_CRITERIOS = {
  "1.1": "1.1. Buscar y seleccionar información relevante en la red con sentido crítico.",
  "1.2": "1.2. Organizar y almacenar la información digital de forma segura.",
  "1.3": "1.3. Aplicar medidas básicas de seguridad y protección de datos.",
  "2.1": "2.1. Diseñar soluciones tecnológicas creativas a problemas planteados.",
  "2.2": "2.2. Construir prototipos aplicando normas de seguridad e higiene.",
  "3.1": "3.1. Elaborar documentos y presentaciones utilizando aplicaciones informáticas.",
  "4.1": "4.1. Interpretar y realizar bocetos y croquis técnicos utilizando acotación.",
  "5.1": "5.1. Trabajar en equipo repartiendo tareas con empatía y equidad.",
  "5.2": "5.2. Planificar las fases de un proyecto técnico respetando tiempos.",
  "5.3": "5.3. Evaluar el proceso de trabajo en grupo proponiendo mejoras.",
  "6.1": "6.1. Identificar los componentes principales de un sistema informático o tecnológico.",
  "6.2": "6.2. Analizar las repercusiones del avance tecnológico en el entorno social y ambiental.",
  "6.3": "6.3. Valorar la importancia de la ciberseguridad y la identidad digital.",
  "7.1": "7.1. Evaluar el consumo energético e impacto medioambiental de la tecnología.",
  "7.2": "7.2. Aplicar criterios de economía circular en la reutilización de materiales."
};

const DESCRIPCIONES_DESCRIPTORES = {
  "CCL1": "Competencia lingüística: Expresa hechos y opiniones de forma oral y escrita.",
  "CCL3": "Competencia lingüística: Localiza, selecciona y contrasta información de diversas fuentes.",
  "CP2": "Competencia plurilingüe: Interactúa en otras lenguas en situaciones cotidianas.",
  "STEM1": "STEM: Utiliza métodos deductivos e inductivos propios de las ciencias.",
  "STEM2": "STEM: Utiliza el pensamiento científico para plantear hipótesis y resolver problemas.",
  "STEM3": "STEM: Plantea y resuelve problemas analizando críticamente los resultados.",
  "STEM4": "STEM: Interpreta y transmite información con lenguaje científico y técnico.",
  "STEM5": "STEM: Emprende acciones para preservar el medio ambiente y la salud.",
  "CD1": "Competencia digital: Realiza búsquedas avanzadas e interacciona en entornos virtuales.",
  "CD2": "Competencia digital: Crea y modifica contenidos digitales en diversos formatos.",
  "CD3": "Competencia digital: Participa en actividades cooperativas con herramientas digitales.",
  "CD4": "Competencia digital: Protege la identidad digital, datos y privacidad.",
  "CD5": "Competencia digital: Desarrolla soluciones algorítmicas mediante programación.",
  "CPSAA1": "Personal, social y aprender a aprender: Reflexiona sobre sí mismo y sus metas.",
  "CPSAA3": "Personal, social y aprender a aprender: Evalúa sus propios aprendizajes y procesos.",
  "CPSAA4": "Personal, social y aprender a aprender: Favorece la convivencia democrática e inclusiva.",
  "CPSAA5": "Personal, social y aprender a aprender: Mantiene una actitud resiliente y de superación.",
  "CC4": "Competencia ciudadana: Analiza el impacto ecológico y promueve el desarrollo sostenible.",
  "CE1": "Competencia emprendedora: Diseña y gestiona ideas originales generando valor.",
  "CE3": "Competencia emprendedora: Desarrolla proyectos de forma cooperativa liderando tareas.",
  "CCEC3": "Conciencia cultural: Expresa ideas e impresiones utilizando diversos soportes artísticos.",
  "CCEC4": "Conciencia cultural: Diseña productos culturales teniendo en cuenta la estética."
};

const DESCRIPCIONES_COMPETENCIAS_CLAVE = {
  "CCL": "Competencia en Comunicación Lingüística: Comprender y expresar pensamientos, emociones y conceptos de forma oral y escrita.",
  "CP": "Competencia Plurilingüe: Utilizar distintas lenguas de forma eficaz para el aprendizaje y la comunicación.",
  "STEM": "Competencia Matemática y en Ciencia, Tecnología e Ingeniería (STEM): Comprender el mundo utilizando modelos y métodos científicos.",
  "CD": "Competencia Digital: Uso seguro, crítico y responsable de las tecnologías digitales para el aprendizaje y la sociedad.",
  "CPSAA": "Competencia Personal, Social y de Aprender a Aprender: Reflexionar sobre uno mismo, gestionar el tiempo y trabajar colaborativamente.",
  "CC": "Competencia Ciudadana: Actuar como ciudadanos responsables y participar plenamente en la vida social y cívica.",
  "CE": "Competencia Emprendedora: Desarrollar la creatividad y capacidad de transformar ideas en actos que generen valor.",
  "CCEC": "Competencia en Conciencia y Expresión Culturales: Comprender y respetar cómo las ideas son expresadas en distintas culturas."
};

const CONFIG_COMPETENCIAS_CLAVE = {
  "CCL":   { nombre: "CCL - Comunicación Lingüística", colorClass: "comp-ccl" },
  "CP":    { nombre: "CP - Plurilingüe", colorClass: "comp-cp" },
  "STEM":  { nombre: "STEM - Ciencia, Tec. y Mates", colorClass: "comp-stem" },
  "CD":    { nombre: "CD - Digital", colorClass: "comp-cd" },
  "CPSAA": { nombre: "CPSAA - Aprender a Aprender", colorClass: "comp-cpsaa" },
  "CC":    { nombre: "CC - Ciudadana", colorClass: "comp-cc" },
  "CE":    { nombre: "CE - Emprendedora", colorClass: "comp-ce" },
  "CCEC":  { nombre: "CCEC - Expresión Cultural", colorClass: "comp-ccec" }
};

const MAPA_CURRICULAR = [
  { compNum: "1", compNombre: "1. Buscar...", descriptores: ["CCL3", "STEM2", "CD1", "CD4", "CPSAA4", "CE1"], criterios: ["1.1", "1.2", "1.3"] },
  { compNum: "2", compNombre: "2. Abordar...", descriptores: ["CCL1", "STEM1", "STEM3", "CD3", "CPSAA3", "CPSAA5", "CE1", "CE3"], criterios: ["2.1", "2.2"] },
  { compNum: "3", compNombre: "3. Utilizar...", descriptores: ["STEM2", "STEM3", "STEM5", "CD5", "CPSAA1", "CE3", "CCEC3"], criterios: ["3.1"] },
  { compNum: "4", compNombre: "4. Representar...", descriptores: ["CCL1", "STEM4", "CD3", "CCEC3", "CCEC4"], criterios: ["4.1"] },
  { compNum: "5", compNombre: "5. Desarrollar...", descriptores: ["CP2", "STEM1", "STEM3", "CD5", "CPSAA5", "CE3"], criterios: ["5.1", "5.2", "5.3"] },
  { compNum: "6", compNombre: "6. Comprender...", descriptores: ["CP2", "CD2", "CD4", "CD5", "CPSAA4", "CPSAA5"], criterios: ["6.1", "6.2", "6.3"] },
  { compNum: "7", compNombre: "7. Hacer uso...", descriptores: ["STEM2", "STEM5", "CD4", "CC4"], criterios: ["7.1", "7.2"] }
];

let estadoApp = {
  nombreDocumento: "",
  unidades: [
    { 
      id: "ud_1", 
      nombre: "1. PRESENTACIONES GOOGLE", 
      criterios: [
        { codigo: "1.1", peso: 2 },
        { codigo: "1.2", peso: 1 }
      ],
      apartados: [
        { 
          id: "ap_1", nombre: "EXÁMENES", peso: 60,
          subapartados: [
            { id: "sub_1", nombre: "TEMA 1", peso: 50 },
            { id: "sub_2", nombre: "TEMA 2", peso: 50 }
          ]
        },
        { id: "ap_2", nombre: "PRÁCTICAS", peso: 40, subapartados: [] }
      ]
    },
    { 
      id: "ud_2", 
      nombre: "2. PROCESADOR DE TEXTO", 
      criterios: [
        { codigo: "2.1", peso: 3 }
      ], 
      apartados: [] 
    }
  ],
  alumnos: [
    { 
      nombre: "Ana", apellidos: "García López", 
      notasUDManuales: {}, 
      notasApartados: { "sub_1": 8, "sub_2": 6, "ap_2": 9 }
    }
  ]
};

let alumnoSeleccionadoIdx = null;
let udEdicionIdx = null; 
let udActivaIdx = null;

let contextoEngranaje = { idItem: null, idPadre: null, nombre: '', esPadre: true };
let padreApartadoEdicionId = null;
let apartadoEdicionId = null; 
let archivoHandle = null;
let cambiosSinGuardar = false;

window.addEventListener('beforeunload', (event) => {
  if (cambiosSinGuardar) {
    event.preventDefault();
    event.returnValue = '';
  }
});

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
    if (!al.notasApartados) al.notasApartados = {};
    if (!al.notasUDManuales) al.notasUDManuales = {};
  });
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
  migrarEstructuraUD();
  construirFormularioCriterios15();
  document.getElementById('modalInicio').classList.add('hidden');
  document.getElementById('vistaDetalle').classList.add('hidden');
  document.getElementById('vistaUD').classList.add('hidden');
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

function construirFormularioCriterios15() {
  const cont = document.getElementById('contenedorCriteriosUD');
  if (!cont) return;
  cont.innerHTML = '';

  const opcionesCriterios = Object.keys(DESCRIPCIONES_CRITERIOS).map(cod => {
    return `<option value="${cod}">${cod} - ${DESCRIPCIONES_CRITERIOS[cod]}</option>`;
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
    th.textContent = ud.nombre || "";
    th.title = "Haz clic para abrir el desglose de esta Unidad";
    th.onclick = () => abrirVistaUD(index);
    filaCabecera.appendChild(th);
  });
  
  const thInfo = document.createElement('th');
  thInfo.style.textAlign = 'center';
  thInfo.textContent = 'INFORMACIÓN';
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
          tdNota.textContent = '⚠️️';
          tdNota.title = 'Configuración de pesos incompleta en apartados o subapartados (Debe ser 100%)';
        } else {
          const notaUD = calcularNotaUD(alumno, ud);
          tdNota.textContent = notaUD !== null ? notaUD.toFixed(1) : '-';
        }
      }

      tr.appendChild(tdNota);
    });

    const tdBtn = document.createElement('td');
    tdBtn.style.textAlign = 'center';
    const btnInfo = document.createElement('button');
    btnInfo.className = 'btn-info';
    btnInfo.textContent = 'MÁS INFORMACIÓN';
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
          <span class="header-title">${ap.nombre} (${ap.peso}%)</span>
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
          <span class="header-title">${ap.nombre} (${ap.peso}%) ${Math.abs(sumaSub - 100) > 0.01 ? '⚠️' : ''}</span>
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
            <span>${sub.nombre} <small>(${sub.peso}%)</small></span>
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
      padre.subapartados.push({ id: generarIdUnico('sub'), nombre: nombre, peso: peso });
    } else {
      const sub = padre.subapartados.find(s => s.id === apartadoEdicionId);
      if (sub) { sub.nombre = nombre; sub.peso = peso; }
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
      ud.apartados.push({ id: generarIdUnico('ap'), nombre: nombre, peso: peso, subapartados: [] });
    } else {
      const ap = ud.apartados.find(a => a.id === apartadoEdicionId);
      if (ap) { ap.nombre = nombre; ap.peso = peso; }
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
  }).join('');

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
  document.getElementById('tituloModalUD').innerText = 'Añadir Unidad Didáctica';
  document.getElementById('inputNombreUD').value = '';
  
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

  if (udEdicionIdx === null) {
    estadoApp.unidades.push({
      id: generarIdUnico('ud'),
      nombre: nombreUD,
      criterios: listaCriterios,
      apartados: []
    });
  } else {
    estadoApp.unidades[udEdicionIdx].nombre = nombreUD;
    estadoApp.unidades[udEdicionIdx].criterios = listaCriterios;
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
        <button class="btn-info" onclick="event.stopPropagation(); editarUnidadSeleccionada(${index})">✏️ Modificar</button>
        <button class="btn-danger" style="font-size:0.75rem; padding:6px 10px;" onclick="event.stopPropagation(); eliminarUnidadDirecto(${index})">🗑️️ Eliminar</button>
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
  udEdicionIdx = index;
  const ud = estadoApp.unidades[index];

  document.getElementById('tituloModalUD').innerText = 'Modificar Unidad Didáctica';
  document.getElementById('inputNombreUD').value = ud.nombre;

  for (let i = 0; i < 15; i++) {
    const critObj = (ud.criterios && ud.criterios[i]) ? ud.criterios[i] : null;
    if (critObj) {
      document.getElementById(`crit_cod_${i}`).value = typeof critObj === 'string' ? critObj : critObj.codigo;
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
      estadoApp.alumnos.push({ nombre: nombre, apellidos: apellidos, notasUDManuales: {}, notasApartados: {} });
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
        <button class="btn-info" onclick="event.stopPropagation(); renombrarAlumno(${index})">✏️️ Modificar</button>
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