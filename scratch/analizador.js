/* Analizador estático de proyectos Scratch 3 (.sb3).
   Compara los bloques del modelo del profesor con los de cada alumno, sin ejecutar nada.
   Funciona igual en el navegador y en Node (para las pruebas). */
(function (G) {
'use strict';

/* ---------- 1. Leer el .sb3 (zip) sin librerías ---------- */
async function inflar(u8) {
  if (typeof DecompressionStream === 'undefined') throw new Error('Este navegador es demasiado antiguo para abrir archivos .sb3. Usa Chrome, Edge o Firefox actualizados.');
  const ds = new DecompressionStream('deflate-raw');
  const flujo = new Blob([u8]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(flujo).arrayBuffer());
}
async function leerProyecto(buf) {
  const u8 = new Uint8Array(buf);
  let i0 = 0; while (i0 < u8.length && /\s/.test(String.fromCharCode(u8[i0]))) i0++;
  if (u8[i0] === 0x7b) return JSON.parse(new TextDecoder().decode(u8));
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  let e = u8.length - 22;
  while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
  if (e < 0) throw new Error('El archivo no es un proyecto de Scratch (.sb3) válido.');
  const n = dv.getUint16(e + 10, true); let p = dv.getUint32(e + 16, true);
  for (let i = 0; i < n; i++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const metodo = dv.getUint16(p + 10, true), tam = dv.getUint32(p + 20, true);
    const ln = dv.getUint16(p + 28, true), lx = dv.getUint16(p + 30, true), lc = dv.getUint16(p + 32, true);
    const local = dv.getUint32(p + 42, true);
    const nombre = new TextDecoder().decode(u8.subarray(p + 46, p + 46 + ln));
    if (/(^|\/)project\.json$/.test(nombre)) {
      const ini = local + 30 + dv.getUint16(local + 26, true) + dv.getUint16(local + 28, true);
      const datos = u8.subarray(ini, ini + tam);
      const txt = new TextDecoder().decode(metodo === 0 ? datos : await inflar(datos));
      return JSON.parse(txt);
    }
    p += 46 + ln + lx + lc;
  }
  throw new Error('No encuentro project.json dentro del archivo. ¿Es un proyecto de Scratch 3?');
}

/* ---------- 2. Diccionario de bloques ----------
   s: firma normalizada (técnicas equivalentes comparten firma)
   f: familia (parecido parcial), w: peso, t: texto en castellano */
const B = {};
function def(ops, s, f, t, w = 1) { for (const op of [].concat(ops)) B[op] = { s, f, t: typeof t === 'object' ? t[op] : t, w }; }
// Eventos (sombreros)
def('event_whenflagclicked', 'al_bandera', 'evento', 'al hacer clic en ⚑');
def('event_whenkeypressed', 'al_tecla', 'evento', 'al presionar tecla {F:KEY_OPTION}');
def(['event_whenthisspriteclicked', 'event_whenstageclicked'], 'al_clic', 'evento', 'al hacer clic en este objeto');
def('event_whenbroadcastreceived', 'al_recibir', 'evento', 'al recibir un mensaje');
def('event_whenbackdropswitchesto', 'al_fondo', 'evento', 'cuando el fondo cambie');
def('event_whengreaterthan', 'al_mayor', 'evento', 'cuando sonido/cronómetro >');
def('event_whentouchingobject', 'al_tocar', 'evento', 'al tocar un objeto');
def('control_start_as_clone', 'al_clon', 'evento', 'al comenzar como clon');
def('procedures_definition', 'al_definir', 'evento', 'definir bloque propio');
def(['event_broadcast', 'event_broadcastandwait'], 'enviar', 'evento', 'enviar mensaje');
// Movimiento
def(['motion_movesteps', 'motion_changexby', 'motion_changeyby'], 'mover', 'mov', { motion_movesteps: 'mover {STEPS} pasos', motion_changexby: 'sumar {DX} a x', motion_changeyby: 'sumar {DY} a y' });
def(['motion_gotoxy', 'motion_setx', 'motion_sety', 'motion_goto'], 'ir', 'mov', { motion_gotoxy: 'ir a x:{X} y:{Y}', motion_setx: 'dar a x el valor {X}', motion_sety: 'dar a y el valor {Y}', motion_goto: 'ir a {TO}' });
def(['motion_glidesecstoxy', 'motion_glideto'], 'deslizar', 'mov', { motion_glidesecstoxy: 'deslizar en {SECS} s a x:{X} y:{Y}', motion_glideto: 'deslizar en {SECS} s a {TO}' });
def(['motion_pointindirection', 'motion_pointtowards'], 'apuntar', 'dir', { motion_pointindirection: 'apuntar en dirección {DIRECTION}', motion_pointtowards: 'apuntar hacia {TOWARDS}' });
def(['motion_turnright', 'motion_turnleft'], 'girar', 'dir', { motion_turnright: 'girar ↻ {DEGREES} grados', motion_turnleft: 'girar ↺ {DEGREES} grados' });
def('motion_setrotationstyle', 'estilo_rot', 'dir', 'fijar estilo de rotación {F:STYLE}', 0.6);
def('motion_ifonedgebounce', 'rebotar', 'mov', 'si toca un borde, rebotar');
// Apariencia
def(['looks_say', 'looks_sayforsecs', 'looks_think', 'looks_thinkforsecs'], 'decir', 'hablar', { looks_say: 'decir {MESSAGE}', looks_sayforsecs: 'decir {MESSAGE} durante {SECS} s', looks_think: 'pensar {MESSAGE}', looks_thinkforsecs: 'pensar {MESSAGE} durante {SECS} s' });
def(['looks_switchcostumeto', 'looks_nextcostume'], 'disfraz', 'aspecto', { looks_switchcostumeto: 'cambiar disfraz a {COSTUME}', looks_nextcostume: 'siguiente disfraz' });
def(['looks_switchbackdropto', 'looks_switchbackdroptoandwait', 'looks_nextbackdrop'], 'fondo', 'fondo', { looks_switchbackdropto: 'cambiar fondo a {BACKDROP}', looks_switchbackdroptoandwait: 'cambiar fondo a {BACKDROP} y esperar', looks_nextbackdrop: 'siguiente fondo' });
def(['looks_setsizeto', 'looks_changesizeby'], 'tamano', 'aspecto', { looks_setsizeto: 'fijar tamaño al {SIZE} %', looks_changesizeby: 'cambiar tamaño en {CHANGE}' });
def('looks_show', 'mostrar', 'visib', 'mostrar');
def('looks_hide', 'esconder', 'visib', 'esconder');
def(['looks_changeeffectby', 'looks_seteffectto', 'looks_cleargraphiceffects'], 'efecto', 'aspecto', { looks_changeeffectby: 'cambiar efecto {F:EFFECT}', looks_seteffectto: 'fijar efecto {F:EFFECT}', looks_cleargraphiceffects: 'quitar efectos gráficos' }, 0.7);
def(['looks_gotofrontback', 'looks_goforwardbackwardlayers'], 'capa', 'aspecto', 'ir a capa', 0.5);
// Sonido
def(['sound_play', 'sound_playuntildone'], 'sonido', 'sonido', { sound_play: 'iniciar sonido {SOUND_MENU}', sound_playuntildone: 'tocar sonido {SOUND_MENU} hasta que termine' }, 0.7);
def('sound_stopallsounds', 'sonido_parar', 'sonido', 'detener todos los sonidos', 0.5);
def(['sound_changevolumeby', 'sound_setvolumeto', 'sound_changeeffectby', 'sound_seteffectto', 'sound_cleareffects'], 'sonido_ef', 'sonido', 'efecto de sonido', 0.5);
// Control
def('control_forever', 'por_siempre', 'bucle', 'por siempre');
def('control_repeat', 'repetir', 'bucle', 'repetir {TIMES}');
def('control_repeat_until', 'repetir_hasta', 'bucle', 'repetir hasta que {CONDITION}');
def(['control_if', 'control_if_else'], 'si', 'si', { control_if: 'si {CONDITION} entonces', control_if_else: 'si {CONDITION} entonces' });
def('control_wait', 'esperar', 'esperar', 'esperar {DURATION} s', 0.7);
def('control_wait_until', 'esperar_hasta', 'esperar', 'esperar hasta que {CONDITION}');
def('control_stop', 'parar', 'parar', 'detener {F:STOP_OPTION}');
def('control_create_clone_of', 'crear_clon', 'clon', 'crear clon de {CLONE_OPTION}');
def('control_delete_this_clone', 'borrar_clon', 'clon', 'borrar este clon');
// Sensores
def(['sensing_touchingobject', 'sensing_touchingcolor', 'sensing_coloristouchingcolor'], 'tocando', 'sensor', { sensing_touchingobject: '¿tocando {TOUCHINGOBJECTMENU}?', sensing_touchingcolor: '¿tocando el color {COLOR}?', sensing_coloristouchingcolor: '¿color tocando color?' });
def('sensing_keypressed', 'tecla', 'sensor', '¿tecla {KEY_OPTION} presionada?');
def('sensing_mousedown', 'raton', 'sensor', '¿ratón presionado?');
def(['sensing_mousex', 'sensing_mousey'], 'raton_pos', 'sensor', 'posición del ratón', 0.6);
def('sensing_distanceto', 'distancia', 'sensor', 'distancia a {DISTANCETOMENU}', 0.8);
def('sensing_askandwait', 'preguntar', 'pregunta', 'preguntar {QUESTION} y esperar');
def('sensing_answer', 'respuesta', 'pregunta', 'respuesta');
def(['sensing_timer', 'sensing_resettimer'], 'cronometro', 'sensor', { sensing_timer: 'cronómetro', sensing_resettimer: 'reiniciar cronómetro' }, 0.7);
def('sensing_setdragmode', 'arrastrable', 'sensor', 'fijar modo de arrastre', 0.6);
def('sensing_of', 'propiedad_de', 'sensor', 'propiedad de otro objeto', 0.6);
// Operadores
def(['operator_equals', 'operator_lt', 'operator_gt'], 'comparar', 'operador', { operator_equals: '{OPERAND1} = {OPERAND2}', operator_lt: '{OPERAND1} < {OPERAND2}', operator_gt: '{OPERAND1} > {OPERAND2}' });
def(['operator_add', 'operator_subtract', 'operator_multiply', 'operator_divide', 'operator_mod', 'operator_round', 'operator_mathop'], 'calculo', 'operador', { operator_add: '{NUM1} + {NUM2}', operator_subtract: '{NUM1} − {NUM2}', operator_multiply: '{NUM1} × {NUM2}', operator_divide: '{NUM1} ÷ {NUM2}', operator_mod: 'resto', operator_round: 'redondear', operator_mathop: 'función matemática' }, 0.7);
def('operator_random', 'azar', 'operador', 'número al azar entre {FROM} y {TO}', 0.8);
def(['operator_and', 'operator_or', 'operator_not'], 'logica', 'logica', { operator_and: '{OPERAND1} y {OPERAND2}', operator_or: '{OPERAND1} o {OPERAND2}', operator_not: 'no {OPERAND}' }, 0.4);
def(['operator_join', 'operator_letter_of', 'operator_length', 'operator_contains'], 'texto', 'texto', { operator_join: '{STRING1}{STRING2}', operator_letter_of: 'letra de', operator_length: 'longitud de', operator_contains: 'contiene' }, 0.4);
// Variables y listas
def('data_setvariableto', 'var_fijar', 'var', 'dar a {F:VARIABLE} el valor {VALUE}');
def('data_changevariableby', 'var_cambiar', 'var', 'sumar {VALUE} a {F:VARIABLE}');
def(['data_showvariable', 'data_hidevariable'], 'var_ver', 'var', { data_showvariable: 'mostrar variable {F:VARIABLE}', data_hidevariable: 'esconder variable {F:VARIABLE}' }, 0.4);
def(['data_addtolist', 'data_insertatlist', 'data_replaceitemoflist'], 'lista_poner', 'lista', 'añadir/insertar en la lista {F:LIST}');
def(['data_deleteoflist', 'data_deletealloflist'], 'lista_borrar', 'lista', 'borrar de la lista {F:LIST}');
def(['data_itemoflist', 'data_itemnumoflist', 'data_lengthoflist', 'data_listcontainsitem'], 'lista_leer', 'lista', 'consultar la lista {F:LIST}', 0.7);
def(['data_showlist', 'data_hidelist'], 'lista_ver', 'lista', 'mostrar/esconder lista', 0.4);
// Bloques propios
def('procedures_call', 'llamar', 'propio', 'usar bloque propio', 0.8);

const SOMBREROS = new Set(['event_whenflagclicked', 'event_whenkeypressed', 'event_whenthisspriteclicked', 'event_whenstageclicked', 'event_whenbroadcastreceived', 'event_whenbackdropswitchesto', 'event_whengreaterthan', 'event_whentouchingobject', 'control_start_as_clone', 'procedures_definition']);
const BUCLES = new Set(['por_siempre', 'repetir', 'repetir_hasta']);
// Técnicas distintas que consiguen lo mismo (parecido entre firmas distintas)
const EQUIV = { 'por_siempre~repetir_hasta': 0.85, 'repetir_hasta~por_siempre': 0.85, 'por_siempre~repetir': 0.6, 'repetir~por_siempre': 0.6, 'repetir~repetir_hasta': 0.75, 'repetir_hasta~repetir': 0.75,
  'al_tecla~tecla': 0.9, 'tecla~al_tecla': 0.9, 'esperar_hasta~si': 0.7, 'si~esperar_hasta': 0.7, 'al_tocar~tocando': 0.9, 'tocando~al_tocar': 0.9,
  'al_clic~raton': 0.6, 'raton~al_clic': 0.6, 'var_fijar~var_cambiar': 0.6, 'var_cambiar~var_fijar': 0.6, 'ir~deslizar': 0.45, 'deslizar~ir': 0.45,
  'mostrar~esconder': 0.3, 'esconder~mostrar': 0.3, 'esconder~borrar_clon': 0.6, 'esconder~efecto': 0.6, 'mostrar~efecto': 0.6, 'borrar_clon~esconder': 0.6, 'apuntar~girar': 0.7, 'girar~apuntar': 0.7 };
// Cuánto vale la misma técnica con un detalle distinto (otra tecla, otro operador…)
const DETALLE = { al_tecla: 0.75, tecla: 0.75, comparar: 0.75, calculo: 0.8, logica: 0.7, parar: 0.6, var_cambiar: 0.45, tocando: 0.85, ir: 0.85, apuntar: 0.9, estilo_rot: 0.9, decir: 0.9, tamano: 0.9, disfraz: 0.95, fondo: 0.95, esperar: 0.95, texto: 0.8, efecto: 0.8 };
// Bloques que solo afectan al propio objeto (si un guion no tiene ninguno, da igual en qué objeto esté)
const LOCALES = new Set(['mover', 'ir', 'deslizar', 'apuntar', 'girar', 'estilo_rot', 'rebotar', 'decir', 'disfraz', 'tamano', 'mostrar', 'esconder', 'efecto', 'capa', 'borrar_clon', 'tocando', 'distancia', 'al_clic', 'al_clon', 'al_tocar', 'arrastrable']);
const ESTRUCTURA = new Set(['por_siempre', 'repetir', 'repetir_hasta', 'si', 'logica', 'al_bandera', 'esperar']);

const TECLAS = { 'right arrow': 'flecha derecha', 'left arrow': 'flecha izquierda', 'up arrow': 'flecha arriba', 'down arrow': 'flecha abajo', space: 'espacio', any: 'cualquiera' };
const PARAR = { all: 'todos', 'this script': 'este programa', 'other scripts in sprite': 'otros programas del objeto' };
const ESPECIAL = { _mouse_: 'puntero del ratón', _edge_: 'borde', _random_: 'posición aleatoria', _myself_: 'mí mismo', _stage_: 'escenario' };

/* ---------- 3. Extraer guiones y rasgos ---------- */
function primerCampo(b) { const k = Object.keys(b.fields || {})[0]; return k ? b.fields[k][0] : ''; }
function valorEntrada(blocks, b, nombre, prof = 0) {
  const inp = b.inputs && b.inputs[nombre]; if (!inp) return '';
  const v = inp[1];
  if (Array.isArray(v)) return String(v[1]);
  const r = blocks[v]; if (!r || typeof r !== 'object') return '';
  if (r.shadow) { const c = primerCampo(r); return ESPECIAL[c] || TECLAS[c] || c; }
  if (!r.inputs || !Object.keys(r.inputs).length) return textoBloque(blocks, r, prof + 1);
  return prof > 4 ? '(…)' : '(' + textoBloque(blocks, r, prof + 1) + ')';
}
function textoBloque(blocks, b, prof = 0) {
  const d = B[b.opcode];
  if (b.opcode === 'data_variable' || b.opcode === 'data_listcontents') return primerCampo(b);
  if (b.opcode === 'argument_reporter_string_number' || b.opcode === 'argument_reporter_boolean') return primerCampo(b);
  if (b.opcode === 'procedures_call' || b.opcode === 'procedures_definition') {
    const pc = b.mutation ? b.mutation.proccode : (blocks[b.inputs && b.inputs.custom_block && b.inputs.custom_block[1]] || {}).mutation?.proccode;
    return (b.opcode === 'procedures_call' ? 'bloque «' : 'definir «') + String(pc || '').replace(/ %[snb]/g, ' ( )') + '»';
  }
  if (!d) return String(b.opcode || '').replace(/^[a-z]+_/, '');
  if (b.opcode === 'operator_not') {
    const inp = b.inputs && b.inputs.OPERAND; const r = inp && typeof inp[1] === 'string' ? blocks[inp[1]] : null;
    if (r && r.opcode === 'operator_equals') return valorEntrada(blocks, r, 'OPERAND1', prof) + ' ≠ ' + valorEntrada(blocks, r, 'OPERAND2', prof);
    if (r) return 'no (' + textoBloque(blocks, r, prof + 1) + ')';
  }
  // cadenas de "o", "y" y "unir" se escriben seguidas, sin paréntesis anidados
  if (b.opcode === 'operator_or' || b.opcode === 'operator_and' || b.opcode === 'operator_join') {
    const partes = [], juntar = x => {
      for (const k of (x.opcode === 'operator_join' ? ['STRING1', 'STRING2'] : ['OPERAND1', 'OPERAND2'])) {
        const inp = x.inputs && x.inputs[k]; const r = inp && typeof inp[1] === 'string' ? blocks[inp[1]] : null;
        if (r && r.opcode === x.opcode) juntar(r);
        else if (r && !r.shadow) partes.push(r.opcode === 'data_variable' ? primerCampo(r) : x.opcode === 'operator_join' ? '(' + textoBloque(blocks, r, prof + 1) + ')' : textoBloque(blocks, r, prof + 1));
        else partes.push(valorEntrada(blocks, x, k, prof));
      }
    };
    juntar(b);
    return b.opcode === 'operator_join' ? partes.join('') : partes.join(b.opcode === 'operator_or' ? ' o ' : ' y ');
  }
  return d.t.replace(/\{F:([A-Z_]+)\}/g, (_, k) => { const c = b.fields && b.fields[k] ? b.fields[k][0] : ''; return TECLAS[c] || PARAR[c] || c; })
    .replace(/\{([A-Z0-9_]+)\}/g, (_, k) => {
      if (b.fields && b.fields[k]) { const c = b.fields[k][0]; return TECLAS[c] || ESPECIAL[c] || c; }
      return valorEntrada(blocks, b, k, prof);
    });
}
const CONDICIONES = ['CONDITION', 'OPERAND', 'OPERAND1', 'OPERAND2'];
function detalle(blocks, b) {
  const op = b.opcode, F = k => (b.fields && b.fields[k] ? String(b.fields[k][0]) : '');
  switch (op) {
    case 'event_whenkeypressed': return F('KEY_OPTION');
    case 'sensing_keypressed': return menuDe(blocks, b, 'KEY_OPTION');
    case 'control_stop': return F('STOP_OPTION') === 'all' ? 'todo' : 'guion';
    case 'operator_equals': return '='; case 'operator_lt': case 'operator_gt': return '<>';
    case 'operator_add': return '+'; case 'operator_subtract': return '-'; case 'operator_multiply': return '*'; case 'operator_divide': return '/';
    case 'operator_and': return 'y'; case 'operator_or': return 'o'; case 'operator_not': return 'no';
    case 'data_changevariableby': { const v = Number(valorEntrada(blocks, b, 'VALUE')); return isNaN(v) ? '?' : v < 0 ? '-' : '+'; }
    case 'sensing_touchingobject': { const m = menuDe(blocks, b, 'TOUCHINGOBJECTMENU'); return m === '_edge_' ? 'borde' : m === '_mouse_' ? 'raton' : 'objeto'; }
    case 'sensing_touchingcolor': case 'sensing_coloristouchingcolor': return 'objeto'; // tocar un color suele ser tocar algo dibujado
    case 'motion_goto': { const m = menuDe(blocks, b, 'TO'); return m === '_random_' ? 'azar' : m === '_mouse_' ? 'raton' : 'objeto'; }
    case 'motion_pointtowards': return 'hacia';
    case 'looks_think': case 'looks_thinkforsecs': return 'pensar';
    case 'looks_setsizeto': return 'fijar';
    case 'looks_switchcostumeto': case 'looks_nextcostume': case 'looks_switchbackdropto': case 'looks_nextbackdrop': case 'looks_switchbackdroptoandwait': return '';
    case 'control_create_clone_of': return menuDe(blocks, b, 'CLONE_OPTION') === '_myself_' ? 'yo' : 'otro';
    default: return '';
  }
}
function menuDe(blocks, b, nombre) {
  const inp = b.inputs && b.inputs[nombre]; if (!inp) return (b.fields && b.fields[nombre] ? b.fields[nombre][0] : '');
  const r = blocks[inp[1]]; return r && typeof r === 'object' ? primerCampo(r) : '';
}
// ¿El valor es "misma variable ± algo"? Entonces "dar a V el valor V+1" equivale a "sumar 1 a V".
function esCambioDeSiMisma(blocks, b) {
  const inp = b.inputs && b.inputs.VALUE; if (!inp || typeof inp[1] !== 'string') return null;
  const r = blocks[inp[1]]; if (!r || !/operator_(add|subtract)/.test(r.opcode)) return null;
  const vid = b.fields.VARIABLE && b.fields.VARIABLE[1];
  for (const k of ['NUM1', 'NUM2']) { const x = r.inputs[k]; if (!x) continue; const v = x[1];
    if (Array.isArray(v) && v[0] === 12 && v[2] === vid) return r.opcode === 'operator_subtract' ? '-' : (otroSigno(r, k) || '+');
    const rb = typeof v === 'string' ? blocks[v] : null; if (rb && rb.opcode === 'data_variable' && rb.fields.VARIABLE[1] === vid) return r.opcode === 'operator_subtract' ? '-' : (otroSigno(r, k) || '+'); }
  return null;
  function otroSigno(r, k) { const o = r.inputs[k === 'NUM1' ? 'NUM2' : 'NUM1']; const n = o && Array.isArray(o[1]) ? Number(o[1][1]) : NaN; return isNaN(n) ? null : n < 0 ? '-' : '+'; }
}
function teclaEn(blocks, id, prof = 0) { // busca un "¿tecla presionada?" dentro de una condición
  const b = blocks[id]; if (!b || typeof b !== 'object' || prof > 4) return null;
  if (b.opcode === 'sensing_keypressed') return menuDe(blocks, b, 'KEY_OPTION');
  for (const k of CONDICIONES) { const x = b.inputs && b.inputs[k]; if (x && typeof x[1] === 'string') { const t = teclaEn(blocks, x[1], prof + 1); if (t) return t; } }
  return null;
}

function extraer(pj) {
  const stage = pj.targets.find(t => t.isStage) || { variables: {} };
  const globales = new Set(Object.keys(stage.variables || {}));
  const objetos = [];
  for (const t of pj.targets) {
    const blocks = t.blocks || {};
    const guiones = [];
    for (const [id, b] of Object.entries(blocks)) {
      if (!b || typeof b !== 'object' || !b.topLevel || !SOMBREROS.has(b.opcode)) continue;
      if (!b.next && b.opcode !== 'procedures_definition') continue; // sombrero vacío
      guiones.push(extraerGuion(blocks, id, globales, t.isStage ? 'Escenario' : t.name));
    }
    guiones.sort((a, b) => a.orden - b.orden);
    const sueltos = Object.values(blocks).filter(b => b && typeof b === 'object' && b.topLevel && !b.shadow && !SOMBREROS.has(b.opcode) && !/^(data_variable|data_listcontents)$/.test(b.opcode)).length;
    const r = { nombre: t.isStage ? 'Escenario' : t.name, escenario: !!t.isStage, guiones, sueltos };
    r.rasgos = guiones.flatMap(g => g.rasgos);
    objetos.push(r);
  }
  // quién envía cada mensaje (para tratar "al recibir" como si estuviera donde se envía)
  const envios = objetos.flatMap(o => o.guiones.flatMap(g => g.envios));
  for (const o of objetos) for (const g of o.guiones) if (g.recibe !== null) g.emisores = envios.filter(e => e.msg === g.recibe);
  const variables = {}, listas = {};
  for (const t of pj.targets) for (const [id, v] of Object.entries(t.variables || {})) variables[id] = { nombre: v[0], global: !!t.isStage, dueno: t.isStage ? null : t.name };
  for (const t of pj.targets) for (const [id, v] of Object.entries(t.lists || {})) listas[id] = { nombre: v[0], global: !!t.isStage };
  const inventario = {
    objetos: pj.targets.filter(t => !t.isStage).map(t => ({ nombre: t.name, disfraces: (t.costumes || []).length, visible: t.visible !== false })),
    fondos: (stage.costumes || []).map(c => c.name), variables, listas,
    sonidos: pj.targets.reduce((n, t) => n + (t.sounds || []).length, 0)
  };
  return { objetos, todos: objetos.flatMap(o => o.rasgos), sueltos: objetos.reduce((n, o) => n + o.sueltos, 0), inventario };
}

const CATEGORIA = { mover: 'mov', ir: 'mov', deslizar: 'mov', apuntar: 'mov', girar: 'mov', estilo_rot: 'mov', rebotar: 'mov',
  disfraz: 'aspecto', tamano: 'aspecto', efecto: 'aspecto', capa: 'aspecto', mostrar: 'aspecto', esconder: 'aspecto', decir: 'hablar',
  fondo: 'fin', parar: 'fin', enviar: 'mensaje', preguntar: 'pregunta', sonido: 'sonido', sonido_parar: 'sonido', sonido_ef: 'sonido',
  crear_clon: 'clon', borrar_clon: 'clon', esperar: 'esperar', esperar_hasta: 'esperar' };
// Variables que lee un bloque (y sus reporteros)
function leeVariables(blocks, b, out = new Set(), prof = 0) {
  if (prof > 8 || !b) return out;
  for (const [k, inp] of Object.entries(b.inputs || {})) {
    if (k === 'SUBSTACK' || k === 'SUBSTACK2') continue;
    const v = inp[1];
    if (Array.isArray(v)) { if (v[0] === 12 || v[0] === 13) out.add(v[2]); continue; }
    const r = blocks[v]; if (!r || typeof r !== 'object') continue;
    if (r.opcode === 'data_variable') out.add(r.fields.VARIABLE[1]);
    else if (r.opcode === 'data_listcontents') out.add(r.fields.LIST[1]);
    else if (r.opcode === 'sensing_answer') out.add('@respuesta');
    else leeVariables(blocks, r, out, prof + 1);
  }
  if (/^data_.*list/.test(b.opcode) && b.fields && b.fields.LIST) out.add(b.fields.LIST[1]);
  return out;
}

// ¿A qué actor (objeto, variable, fondo…) afecta un bloque?
function msgDe(blocks, b) {
  const inp = b.inputs && b.inputs.BROADCAST_INPUT; if (!inp) return '';
  const v = inp[1]; if (Array.isArray(v)) return String(v[1]);
  const r = blocks[v]; return r && typeof r === 'object' ? (r.shadow ? primerCampo(r) : '?') : '';
}
function actorDe(blocks, b, s, objeto) {
  const op = b.opcode;
  if (/^data_(setvariableto|changevariableby|showvariable|hidevariable)$/.test(op) && b.fields.VARIABLE) return 'var:' + b.fields.VARIABLE[1];
  if (/^data_.*list/.test(op) && b.fields && b.fields.LIST) return 'lista:' + b.fields.LIST[1];
  if (s === 'fondo') return 'fondo';
  if (op === 'control_stop') return 'juego';
  if (op === 'sensing_askandwait') return 'pregunta';
  if (op === 'control_create_clone_of') { const m = menuDe(blocks, b, 'CLONE_OPTION'); return 'obj:' + (!m || m === '_myself_' ? objeto : m); }
  if (/^event_broadcast/.test(op)) return null;
  if (s === 'esperar' || s === 'esperar_hasta') return '@esperar';
  if (objeto === 'Escenario') return /^(looks|sound)_/.test(op) ? 'fondo' : 'otros';
  if (/^(motion|looks|sound|pen)_/.test(op) || op === 'control_delete_this_clone' || op === 'sensing_setdragmode') return 'obj:' + objeto;
  return 'otros';
}

function extraerGuion(blocks, idSombrero, globales, objeto) {
  const rasgos = [], lineas = [], lineaIds = [], segmentos = [], envios = [];
  const h = blocks[idSombrero];
  let disp = 'bandera';
  if (h.opcode === 'event_whenkeypressed') disp = 'tecla:' + h.fields.KEY_OPTION[0];
  else if (h.opcode !== 'event_whenflagclicked') disp = B[h.opcode] ? B[h.opcode].s : h.opcode;
  let local = false;
  const meter = (b, ctx, trig, esReportero) => {
    const d = B[b.opcode];
    let s = d ? d.s : b.opcode, f = d ? d.f : b.opcode.split('_')[0], w = d ? d.w : 0.8, det = detalle(blocks, b);
    if (b.opcode === 'data_setvariableto') { const sg = esCambioDeSiMisma(blocks, b); if (sg) { s = 'var_cambiar'; det = sg; } }
    let loc = LOCALES.has(s);
    if (b.opcode === 'data_setvariableto' || b.opcode === 'data_changevariableby') { const vid = b.fields.VARIABLE && b.fields.VARIABLE[1]; if (vid && !globales.has(vid)) loc = true; }
    if (loc) local = true;
    const r = { s, f, d: det, c: ctx, t: trig, w, r: !!esReportero, txt: textoBloque(blocks, b), op: b.opcode, loc };
    rasgos.push(r);
    return r;
  };
  const reporteros = (b, ctx, trig, prof = 0, out = []) => {
    for (const [k, inp] of Object.entries(b.inputs || {})) {
      if (k === 'SUBSTACK' || k === 'SUBSTACK2' || k === 'custom_block') continue;
      const v = inp[1]; if (typeof v !== 'string') continue;
      const r = blocks[v]; if (!r || typeof r !== 'object' || r.shadow) continue;
      if (r.opcode === 'data_variable' || r.opcode === 'data_listcontents' || r.opcode.startsWith('argument_')) continue;
      // «tocando A o tocando B o tocando C» cuenta como una sola condición «tocando»: los alumnos lo hacen a ojo
      // (un solo color que ya cubre las rocas, otro objeto…), así que no se exige el mismo número de alternativas.
      if (r.opcode === 'operator_or') {
        const hojas = [], juntar = x => { for (const k of ['OPERAND1', 'OPERAND2']) { const i2 = x.inputs && x.inputs[k]; const y = i2 && typeof i2[1] === 'string' ? blocks[i2[1]] : null; if (!y) continue; if (y.opcode === 'operator_or') juntar(y); else hojas.push(y); } };
        juntar(r);
        const firmas = new Set(hojas.map(y => B[y.opcode] ? B[y.opcode].s : y.opcode));
        if (hojas.length && firmas.size === 1) {
          const f = meter(hojas[0], ctx, trig, true); f.txt = textoBloque(blocks, r); out.push(f);
          if (prof < 6) reporteros(hojas[0], ctx, trig, prof + 1, out);
          continue;
        }
      }
      out.push(meter(r, ctx, trig, true));
      if (prof < 6) reporteros(r, ctx, trig, prof + 1, out);
    }
    return out;
  };
  // seg: tramo de bloques seguidos que se ejecutan juntos (cuerpo del sombrero, de un bucle o de un "si")
  const recorrer = (id, ctx, trig, sangria, dentroBucle, seg) => {
    let guard = 0;
    while (id && guard++ < 2000) {
      const b = blocks[id]; if (!b || typeof b !== 'object') break;
      lineas.push('  '.repeat(sangria) + textoBloque(blocks, b)); lineaIds.push(id);
      const rb = meter(b, ctx, trig, false);
      let trigDentro = trig;
      if ((b.opcode === 'control_if' || b.opcode === 'control_if_else') && dentroBucle && b.inputs.CONDITION) {
        const k = teclaEn(blocks, b.inputs.CONDITION[1]); if (k) trigDentro = 'tecla:' + k;
      }
      const rep = reporteros(b, ctx + '|' + (B[b.opcode] ? B[b.opcode].s : b.opcode), trigDentro);
      const sig = B[b.opcode] ? B[b.opcode].s : '';
      const tok = BUCLES.has(sig) ? 'bucle' : sig === 'si' ? 'si' : sig || b.opcode;
      const tieneC = b.inputs && (b.inputs.SUBSTACK || b.inputs.SUBSTACK2) || /^control_(forever|repeat|repeat_until|if|if_else)$/.test(b.opcode);
      if (!tieneC) {
        let escribe = null;
        if (b.fields && b.fields.VARIABLE && /^data_(set|change)variable/.test(b.opcode)) escribe = b.fields.VARIABLE[1];
        if (b.fields && b.fields.LIST && /^data_(addto|insertat|replaceitemof|deleteof|deleteallof)list/.test(b.opcode)) escribe = b.fields.LIST[1];
        if (b.opcode === 'sensing_askandwait') escribe = '@respuesta';
        let cat = CATEGORIA[rb.s] || 'otro:' + b.opcode;
        if (escribe) cat = (b.opcode === 'sensing_askandwait' ? 'pregunta' : 'var:' + escribe);
        seg.sentencias.push({ id, cat, escribe, lee: leeVariables(blocks, b), rasgos: [rb, ...rep], txt: rb.txt, actor: actorDe(blocks, b, rb.s, objeto), valor: /^data_(set|change)variable/.test(b.opcode) ? { op: rb.s === 'var_cambiar' ? 'cambia' : 'fija', v: valorEntrada(blocks, b, 'VALUE') } : null,
          nombreVar: b.fields && (b.fields.VARIABLE || b.fields.LIST) ? (b.fields.VARIABLE || b.fields.LIST)[0] : null });
        if (/^event_broadcast/.test(b.opcode)) envios.push({ msg: msgDe(blocks, b), cadena: seg.cadena.concat([rb]), cadenaIds: seg.cadenaIds.concat([id]), objeto });
      } else {
        const cond = b.inputs && b.inputs.CONDITION && typeof b.inputs.CONDITION[1] === 'string' ? textoBloque(blocks, blocks[b.inputs.CONDITION[1]] || {}) : '';
        const esSi = sig === 'si';
        const hijo = (sub, sino) => {
          const s2 = { cadena: seg.cadena.concat([rb, ...rep]), cadenaIds: seg.cadenaIds.concat([id]), sentencias: [],
            conds: seg.conds.concat(esSi ? [(sino ? 'si no se cumple «' + cond + '»' : 'si ' + cond)] : sig === 'repetir_hasta' ? ['repetir hasta que ' + cond] : []),
            condicional: seg.condicional || esSi, bucle: seg.bucle || BUCLES.has(sig) };
          segmentos.push(s2);
          recorrer(sub, ctx + '>' + (sino ? 'sino' : tok), sino ? trig : trigDentro, sangria + 1, dentroBucle || BUCLES.has(sig), s2);
        };
        if (b.inputs && b.inputs.SUBSTACK && typeof b.inputs.SUBSTACK[1] === 'string') hijo(b.inputs.SUBSTACK[1], false);
        if (b.inputs && b.inputs.SUBSTACK2 && typeof b.inputs.SUBSTACK2[1] === 'string') { lineas.push('  '.repeat(sangria) + 'si no'); lineaIds.push(id); hijo(b.inputs.SUBSTACK2[1], true); }
      }
      id = b.next;
    }
  };
  const rh = meter(h, '', disp, false);
  lineas.push(textoBloque(blocks, h)); lineaIds.push(idSombrero);
  const rep = reporteros(h, '', disp);
  const raiz = { cadena: [rh, ...rep], cadenaIds: [idSombrero], sentencias: [], conds: [], condicional: false, bucle: false };
  segmentos.unshift(raiz);
  recorrer(h.next, '', disp, 1, false, raiz);
  const recibe = h.opcode === 'event_whenbroadcastreceived' && h.fields.BROADCAST_OPTION ? String(h.fields.BROADCAST_OPTION[0]) : null;
  return { objeto, disp, rasgos, lineas, lineaIds, local, envios, recibe, segmentos: segmentos.filter(x => x.sentencias.length), orden: (h.y || 0) * 10 + (h.x || 0) / 100, id: idSombrero };
}

/* ---------- 4. Comparar rasgos ---------- */
function factorDisparo(a, b) {
  if (a === b) return 1;
  if (a.startsWith('tecla:') && b.startsWith('tecla:')) return 0.8;
  return 0.6;
}
function parecidoRasgo(m, a) {
  let v;
  if (m.s === a.s) v = m.d === a.d ? 1 : (DETALLE[m.s] ?? 0.8);
  else if (EQUIV[m.s + '~' + a.s]) v = EQUIV[m.s + '~' + a.s] * (m.d && a.d && m.d !== a.d ? 0.8 : 1);
  else if (m.f === a.f) v = 0.45;
  else return 0;
  if (m.c !== a.c) v *= 0.85;
  return v * factorDisparo(m.t, a.t);
}
// Empareja cada bloque del modelo con un bloque distinto del alumno (el más parecido que quede libre)
function emparejar(modelo, alumno) {
  const pares = [];
  for (let i = 0; i < modelo.length; i++) for (let j = 0; j < alumno.length; j++) {
    const v = parecidoRasgo(modelo[i], alumno[j]); if (v > 0) pares.push([v * modelo[i].w, v, i, j]);
  }
  pares.sort((x, y) => (y[1] >= 0.4) - (x[1] >= 0.4) || y[0] - x[0] || x[2] - y[2]);
  const usadoM = new Array(modelo.length).fill(-1), valor = new Array(modelo.length).fill(0), usadoA = new Set();
  for (const [, v, i, j] of pares) { if (v < 0.4) break; if (usadoM[i] >= 0 || usadoA.has(j)) continue; usadoM[i] = j; valor[i] = v; usadoA.add(j); }
  // Los bloques de estructura (sombrero, por siempre, si…) solo cuentan en la medida en que aparece el contenido
  let sC = 0, pC = 0, sE = 0, pE = 0, contenido = 0;
  modelo.forEach((m, i) => { const w = m.w * (m.k || 1);
    if (ESTRUCTURA.has(m.s)) { sE += w * valor[i]; pE += w; } else { sC += w * valor[i]; pC += w; if (valor[i] >= 0.6) contenido++; } });
  const simC = pC ? sC / pC : 1;
  const sim = (sC + sE * Math.min(1, 2 * simC)) / ((pC + pE) || 1);
  return { sim, simC, valor, pareja: usadoM, contenido };
}

/* ---------- 5. Apartados a partir del modelo ---------- */
function forma(g) { return g.rasgos.map(r => r.s + '@' + r.c + (r.s === 'var_cambiar' || r.s === 'parar' ? r.d : '')).sort().join(','); }
function multiconjunto(rs) { const m = new Map(); for (const r of rs) { const k = r.s + '/' + r.d; m.set(k, (m.get(k) || 0) + 1); } return m; }
function contenidoEn(a, b) { const mb = multiconjunto(b); for (const [k, n] of multiconjunto(a)) if ((mb.get(k) || 0) < n) return false; return true; }

function agrupar(modelo, instancias, describirFn) {
  const grupos = new Map();
  for (const g of instancias) {
    const k = forma(g);
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k).push(g);
  }
  let aps = [];
  for (const gs of grupos.values()) {
    const porObjeto = new Map();
    for (const g of gs) { if (!porObjeto.has(g.objeto)) porObjeto.set(g.objeto, []); porObjeto.get(g.objeto).push(g); }
    const global = gs.every(g => !g.local);
    aps.push({ guiones: gs, copias: [...porObjeto.values()], global });
  }
  // Algo "global" que ya está dentro de otro apartado (p. ej. "dar a PUNTOS el valor 0" repetido en cada moneda) no es un apartado aparte
  aps = aps.filter(a => !(a.global && aps.some(b => b !== a && b.guiones[0].rasgos.length > a.guiones[0].rasgos.length && contenidoEn(a.guiones[0].rasgos, b.guiones[0].rasgos))));
  // Lo que se repite en muchos apartados (ir a x:y, por siempre…) distingue poco; lo raro pesa más
  const cuenta = new Map();
  for (const a of aps) for (const sg of new Set(a.guiones.flatMap(g => g.rasgos.map(r => r.s)))) cuenta.set(sg, (cuenta.get(sg) || 0) + 1);
  for (const a of aps) for (const g of a.guiones) g.rasgos = g.rasgos.map(r => Object.assign({}, r, { k: 1 / Math.sqrt(cuenta.get(r.s) || 1) }));
  aps.sort((a, b) => ordenObjeto(modelo, a) - ordenObjeto(modelo, b) || a.guiones[0].orden - b.guiones[0].orden);
  aps.forEach((a, i) => { a.id = 'a' + (i + 1); Object.assign(a, describirFn(a)); a.on = true; a.imp = 'medio'; });
  return aps;
}
function crearApartados(modelo) { return agrupar(modelo, modelo.objetos.flatMap(o => o.guiones), describir); }

/* Ítems a partir de la partida del profesor: cada cosa que pasa (un grupo de bloques que se ejecutan
   juntos y hacen lo mismo) con las condiciones y el evento que la provocan. */
function itemsDeGuion(g) {
  const out = [];
  // Todo lo que se ejecuta sin condiciones en un programa (al empezar, en el bucle…) es un solo ítem
  const libres = g.segmentos.filter(x => !x.condicional);
  if (libres.length) {
    const rasgos = [...new Set(libres.flatMap(x => x.cadena.concat(x.sentencias.flatMap(y => y.rasgos))))];
    const sents = libres.flatMap(x => x.sentencias);
    out.push({ objeto: g.objeto, disp: g.disp, guion: g, conds: [], efectos: sents.map(x => x.txt), ids: sents.map(x => x.id), marcadas: [...new Set(libres.flatMap(x => x.cadenaIds.concat(x.sentencias.map(y => y.id))))],
      rasgos, local: rasgos.some(r => r.loc), orden: g.orden, lineas: g.lineas, lineaIds: g.lineaIds, bucle: libres.some(x => x.bucle) });
  }
  g.segmentos.forEach((seg, si) => {
    if (!seg.condicional) return;
    const S = seg.sentencias, n = S.length;
    const padre = S.map((_, i) => i), raiz = i => padre[i] === i ? i : (padre[i] = raiz(padre[i]));
    const unir = (i, j) => { padre[raiz(i)] = raiz(j); };
    {
      const primero = new Map();
      S.forEach((x, i) => { if (x.cat === 'esperar') return; if (primero.has(x.cat)) unir(i, primero.get(x.cat)); else primero.set(x.cat, i); });
      S.forEach((x, j) => { for (const v of x.lee) S.forEach((y, i) => { if (i !== j && y.escribe === v) unir(i, j); }); });
      S.forEach((x, i) => { if (x.cat !== 'esperar') return; let k = i - 1; while (k >= 0 && S[k].cat === 'esperar') k--; if (k < 0) { k = i + 1; while (k < n && S[k].cat === 'esperar') k++; } if (k >= 0 && k < n) unir(i, k); });
    }
    const grupos = new Map();
    S.forEach((x, i) => { const r = raiz(i); if (!grupos.has(r)) grupos.set(r, []); grupos.get(r).push(x); });
    [...grupos.values()].forEach((grp, gi) => {
      const rasgos = seg.cadena.concat(grp.flatMap(x => x.rasgos));
      out.push({ objeto: g.objeto, disp: g.disp, guion: g, conds: seg.conds, efectos: grp.map(x => x.txt), ids: grp.map(x => x.id), marcadas: seg.cadenaIds.concat(grp.map(x => x.id)),
        rasgos, local: rasgos.some(r => r.loc), orden: g.orden + si * 1e-3 + gi * 1e-5, lineas: g.lineas, lineaIds: g.lineaIds });
    });
  });
  return out;
}
function crearItems(modelo, ejecutados) {
  const veces = k => (ejecutados instanceof Map ? ejecutados.get(k) : ejecutados[k]) || 0;
  const inst = modelo.objetos.flatMap(o => o.guiones.flatMap(itemsDeGuion));
  for (const it of inst) it.veces = Math.max(0, ...it.ids.map(id => veces(it.objeto + '|' + id)));
  const aps = agrupar(modelo, inst, describirItem);
  for (const a of aps) { a.veces = a.guiones.reduce((s, g) => s + g.veces, 0); a.visto = a.veces > 0; a.on = a.visto; }
  // primero lo que ha pasado en la partida
  aps.sort((a, b) => (b.visto - a.visto) || 0);
  aps.forEach((a, i) => a.id = 'a' + (i + 1));
  return aps;
}
function describirItem(a) {
  const g = a.guiones[0];
  const teclas = [...new Set(a.guiones.map(x => x.disp).filter(d => d.startsWith('tecla:')))];
  const disparo = teclas.length > 1 ? 'Al presionar ' + teclas.map(t => TECLAS[t.slice(6)] || t.slice(6)).join(', ') : nombreDisparo(g);
  const ef = g.efectos.length > 4 ? g.efectos.slice(0, 4).join(', ') + '…' : g.efectos.join(', ');
  const titulo = disparo + (g.conds.length ? ', ' + g.conds.join(', ') : '') + ': ' + ef;
  const ultima = g.conds.length ? g.conds[g.conds.length - 1] : '';
  const corta = t => t.length > 28 ? t.slice(0, 26) + '…' : t;
  const corto = (ultima ? corta(ultima.replace(/^si /, '')) + ' → ' : teclas.length > 1 ? 'Flechas → ' : g.disp.startsWith('tecla:') ? (TECLAS[g.disp.slice(6)] || g.disp.slice(6)) + ' → ' : g.disp === 'bandera' ? 'Al empezar → ' : '') + g.efectos.join(', ');
  const dondes = a.copias.map(c => c[0].objeto);
  let donde;
  if (a.global) donde = 'En cualquier objeto (en tu modelo: ' + (dondes.length > 1 ? 'repetido en ' + dondes.length + ' objetos' : dondes[0]) + ')';
  else if (a.copias.length > 1) donde = 'En ' + a.copias.length + ' objetos distintos: ' + dondes.join(', ');
  else donde = 'Objeto: ' + dondes[0];
  return { titulo, donde, corto, codigo: g.lineas, lineaIds: g.lineaIds, marcadas: g.marcadas };
}
function ordenObjeto(modelo, a) { const i = modelo.objetos.findIndex(o => o.nombre === a.guiones[0].objeto); return i < 0 ? 99 : (modelo.objetos[i].escenario ? 0 : i); }

function nombreDisparo(g) {
  if (g.disp === 'bandera') return 'Al hacer clic en la bandera';
  if (g.disp.startsWith('tecla:')) return 'Al presionar ' + (TECLAS[g.disp.slice(6)] || 'la tecla ' + g.disp.slice(6));
  const m = { al_clic: 'Al hacer clic en el objeto', al_recibir: 'Al recibir un mensaje', al_clon: 'Al comenzar como clon', al_fondo: 'Cuando cambia el fondo', al_mayor: 'Cuando el sonido o el cronómetro supera un valor', al_definir: 'Bloque propio', al_tocar: 'Al tocar un objeto' };
  return m[g.disp] || 'Programa';
}
const RESUMEN = { mover: 'moverse', ir: 'ir a una posición', deslizar: 'deslizarse', apuntar: 'apuntar en una dirección', girar: 'girar', estilo_rot: 'estilo de rotación', rebotar: 'rebotar en el borde',
  decir: 'decir un mensaje', disfraz: 'cambiar de disfraz', fondo: 'cambiar el fondo', tamano: 'cambiar de tamaño', mostrar: 'mostrarse', esconder: 'esconderse', efecto: 'efectos gráficos', sonido: 'sonido',
  esperar: 'esperar', parar: 'detener', crear_clon: 'crear clones', borrar_clon: 'borrar el clon', tocando: 'si toca algo', tecla: 'si se pulsa una tecla', preguntar: 'hacer una pregunta', respuesta: 'comprobar la respuesta',
  var_fijar: 'dar valor a una variable', var_cambiar: 'sumar o restar a una variable', azar: 'números al azar', comparar: 'comparar', enviar: 'enviar un mensaje', lista_poner: 'añadir a una lista', lista_borrar: 'borrar de una lista', lista_leer: 'consultar una lista', por_siempre: 'por siempre', repetir: 'repetir', repetir_hasta: 'repetir hasta', llamar: 'bloque propio', raton: 'si se pulsa el ratón', distancia: 'distancia' };
function describir(a) {
  const g = a.guiones[0];
  const vistos = [];
  for (const r of g.rasgos.slice(1)) { const t = RESUMEN[r.s]; if (t && !vistos.includes(t)) vistos.push(t); }
  // la variable concreta ayuda al profesor a reconocer el apartado
  const vars = [...new Set(g.rasgos.filter(r => /^data_(set|change)variable/.test(r.op)).map(r => r.txt.replace(/^(dar a |sumar .* a )/, '').replace(/ el valor .*$/, '')))];
  let titulo = nombreDisparo(g) + ': ' + (vistos.slice(0, 5).join(', ') || 'programa') + (vistos.length > 5 ? '…' : '');
  if (vars.length) titulo += ' (' + vars.slice(0, 2).join(', ') + ')';
  const teclas = [...new Set(a.guiones.map(x => x.disp).filter(d => d.startsWith('tecla:')))];
  const dondes = a.copias.map(c => c[0].objeto);
  let donde;
  if (a.global) donde = 'En ' + (dondes.length > 1 ? 'cualquier objeto (en tu modelo está repetido en ' + dondes.length + ')' : 'cualquier objeto (en tu modelo: ' + dondes[0] + ')');
  else if (a.copias.length > 1) donde = 'En ' + a.copias.length + ' objetos distintos: ' + dondes.join(', ');
  else donde = 'Objeto: ' + dondes[0];
  if (teclas.length > 1) { titulo = 'Al presionar ' + teclas.map(t => TECLAS[t.slice(6)] || t.slice(6)).join(', ') + ': ' + (vistos.slice(0, 5).join(', ')); }
  const corto = (teclas.length > 1 ? 'Teclas: ' : '') + vistos.slice(0, 3).join(', ');
  return { titulo, donde, corto, codigo: g.lineas };
}

/* ---------- 6. Corregir un alumno ---------- */
function puntuarCopia(copia, rasgos) { // una copia = los guiones de ese apartado en un objeto del modelo
  let s = 0, sc = 0, cont = 0; const res = [];
  for (const g of copia) { const e = emparejar(g.rasgos, rasgos); s += e.sim; sc += e.simC; cont += e.contenido; res.push(e); }
  return { sim: s / copia.length, simC: sc / copia.length, contenido: cont, res };
}
function corregirApartado(ap, alumno) {
  const objetos = alumno.objetos.filter(o => o.rasgos.length);
  const conjunto = { nombre: 'varios objetos', rasgos: alumno.todos, todos: true };
  const candidatos = (ap.global || ap.copias.length === 1) ? [...objetos, conjunto] : objetos;
  // matriz copia × objeto del alumno
  const M = ap.copias.map(c => candidatos.map(o => { const p = puntuarCopia(c, o.rasgos); if (o.todos) p.sim *= 0.95; return p; }));
  let asignado = [];
  if (ap.global) {
    let mejor = null;
    M.forEach((fila, ci) => fila.forEach((p, oi) => { if (!mejor || p.sim > mejor.p.sim) mejor = { ci, oi, p }; }));
    asignado = mejor ? [mejor] : [];
    var sim = mejor ? mejor.p.sim : 0, necesarias = 1;
  } else {
    const pares = [];
    M.forEach((fila, ci) => fila.forEach((p, oi) => pares.push({ ci, oi, p })));
    pares.sort((x, y) => y.p.sim - x.p.sim);
    const usC = new Set(), usO = new Set();
    for (const x of pares) { if (usC.has(x.ci) || usO.has(x.oi) || x.p.sim <= 0) continue; usC.add(x.ci); usO.add(x.oi); asignado.push(x); }
    var sim = asignado.reduce((s, x) => s + x.p.sim, 0) / ap.copias.length, necesarias = ap.copias.length;
    // Alternativa: lo ha resuelto una sola vez de forma centralizada (p. ej. el jugador detecta todas las monedas). Cuenta, pero menos.
    const central = puntuarCopia(ap.copias[0], alumno.todos);
    if (central.sim * 0.6 > sim && central.simC >= 0.5) { asignado = [{ ci: 0, oi: candidatos.length, p: central }]; candidatos.push({ nombre: 'un solo programa para todos', todos: true }); sim = central.sim * 0.6; var centralizado = true; }
  }
  // texto de detalle
  const det = [];
  const faltan = new Map(), aMedias = new Map();
  for (const x of asignado) {
    const copia = ap.copias[x.ci];
    copia.forEach((g, gi) => g.rasgos.forEach((r, ri) => {
      const v = x.p.res[gi].valor[ri];
      const clave = r.txt.replace(/-?\d+([.,]\d+)?/g, '#');
      const m = v < 0.45 ? faltan : v < 0.8 ? aMedias : null;
      if (m && !m.has(clave)) m.set(clave, r.txt);
    }));
  }
  const dondes = asignado.map(x => candidatos[x.oi].nombre);
  const contenido = asignado.reduce((s, x) => s + x.p.contenido, 0);
  let nota = aNota(sim);
  if (!contenido) nota = 0;
  if (nota === 0) det.push({ ok: false, t: 'No se encuentra nada parecido en su juego.' });
  else {
    det.push({ ok: true, t: 'Encontrado en: ' + [...new Set(dondes)].join(', ') + (necesarias > 1 ? ' (' + asignado.length + ' de ' + necesarias + ' objetos)' : '') + ' · parecido ' + Math.round(sim * 100) + ' %' });
    if (centralizado) det.push({ ok: false, medio: true, t: 'Lo resuelve en un solo sitio en vez de en cada objeto: cuenta en parte.' });
    else if (necesarias > 1 && asignado.length < necesarias) det.push({ ok: false, t: 'Faltan ' + (necesarias - asignado.length) + ' objetos con este programa.' });
    const lista = (m, max = 6) => [...m.values()].slice(0, max).map(t => '«' + t + '»').join(', ') + (m.size > max ? '…' : '');
    if (faltan.size) det.push({ ok: false, t: 'Falta o no se parece: ' + lista(faltan) });
    if (aMedias.size) det.push({ ok: false, medio: true, t: 'Hecho de otra forma o en otro sitio (cuenta en parte): ' + lista(aMedias) });
    if (!faltan.size && !aMedias.size) det.push({ ok: true, t: 'Están todos los bloques.' });
  }
  return { nota, sim, det };
}
function aNota(sim) {
  if (sim < 0.2) return 0;
  if (sim >= 0.9) return 10;
  const n = (sim - 0.2) / (0.9 - 0.2) * 10;
  return Math.round(n * 2) / 2;
}
function corregir(apartados, alumno) {
  const r = {};
  for (const ap of apartados) r[ap.id] = corregirApartado(ap, alumno);
  return r;
}

/* ---------- 7. Corrección por ACTORES ----------
   Actor = cada cosa que puede cambiar en el juego: un objeto (y sus clones), una variable, una lista,
   el fondo, la pregunta, el fin del juego. Para cada actor se reúnen TODOS los bloques que le afectan,
   estén en el objeto que estén, junto con lo que los provoca (evento y condiciones). */
const normN = t => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ]/g, '');

// Unidades: bloques seguidos que afectan al mismo actor y se ejecutan juntos, con su evento y condiciones
function unidadesDeGuion(g) {
  const out = [];
  // "al recibir mensaje" se trata como si estuviera donde se envía el mensaje (con sus condiciones)
  const prefijos = g.emisores && g.emisores.length ? g.emisores.map(e => ({ cadena: e.cadena, ids: e.cadenaIds, via: e.objeto })) : [null];
  const hacer = (sents, seg, cadena, cadenaIds, libre) => {
    // los "esperar" van con el bloque de al lado
    const actores = sents.map(x => x.actor);
    for (let i = 0; i < actores.length; i++) if (actores[i] === '@esperar') { let k = i - 1; while (k >= 0 && actores[k] === '@esperar') k--; if (k < 0) { k = i + 1; while (k < actores.length && actores[k] === '@esperar') k++; } actores[i] = k >= 0 && k < actores.length && actores[k] !== '@esperar' ? actores[k] : 'otros'; }
    // variables auxiliares: si una variable se rellena para usarla enseguida en otro bloque del mismo tramo
    // (nº1 y nº2 para la pregunta), forma parte del actor de ese bloque
    sents.forEach((x, i) => {
      if (!x.escribe || !actores[i] || !actores[i].startsWith('var:')) return;
      const j = sents.findIndex((y, k) => k > i && y.lee && y.lee.has(x.escribe) && actores[k] && actores[k] !== actores[i] && !actores[k].startsWith('var:'));
      if (j >= 0) actores[i] = actores[j];
    });
    const porActor = new Map();
    sents.forEach((x, i) => { const a = actores[i]; if (!a) return; if (!porActor.has(a)) porActor.set(a, []); porActor.get(a).push(x); });
    for (const [actor, xs] of porActor) {
      for (const pre of prefijos) {
        const cad = pre ? pre.cadena.concat(cadena.slice(1)) : cadena;
        const rasgos = [...new Set(cad.concat(xs.flatMap(y => y.rasgos)))];
        out.push({ actor, objeto: g.objeto, disp: g.disp, guion: g, conds: seg ? seg.conds : [], efectos: xs.map(y => y.txt), ids: xs.map(y => y.id),
          marcadas: [...new Set(cadenaIds.concat(xs.map(y => y.id)))], rasgos, local: rasgos.some(r => r.loc), lineas: g.lineas, lineaIds: g.lineaIds,
          via: pre ? pre.via : null, valores: xs.map(y => y.valor).filter(Boolean), nombreVar: xs.find(y => y.nombreVar) ? xs.find(y => y.nombreVar).nombreVar : null, orden: g.orden });
      }
    }
  };
  const libres = g.segmentos.filter(x => !x.condicional);
  if (libres.length) hacer(libres.flatMap(x => x.sentencias), null, [...new Set(libres.flatMap(x => x.cadena))], [...new Set(libres.flatMap(x => x.cadenaIds))], true);
  for (const seg of g.segmentos) if (seg.condicional) hacer(seg.sentencias, seg, seg.cadena, seg.cadenaIds, false);
  return out;
}

function nombreActor(clave, proy) {
  const [tipo, ...r] = clave.split(':'); const id = r.join(':');
  if (tipo === 'obj') return { tipo: 'objeto', nombre: id };
  if (tipo === 'var') { const v = proy.inventario.variables[id]; return { tipo: 'variable', nombre: v ? v.nombre : id }; }
  if (tipo === 'lista') { const v = proy.inventario.listas[id]; return { tipo: 'lista', nombre: v ? v.nombre : id }; }
  return { tipo, nombre: { fondo: 'Fondo del escenario', juego: 'Fin del juego (detener)', pregunta: 'Preguntas', otros: 'Otros bloques' }[tipo] || tipo };
}

// Todos los actores de un proyecto con sus unidades
function actoresDe(proy) {
  const m = new Map();
  for (const o of proy.objetos) for (const g of o.guiones) for (const u of unidadesDeGuion(g)) {
    if (!m.has(u.actor)) m.set(u.actor, Object.assign({ clave: u.actor, unidades: [] }, nombreActor(u.actor, proy)));
    m.get(u.actor).unidades.push(u);
  }
  for (const a of m.values()) { a.rasgos = a.unidades.flatMap(u => u.rasgos); if (a.tipo === 'objeto' && !proy.objetos.some(o => o.nombre === a.nombre)) a.tipo = 'otros'; }
  return m;
}

function formaUnidades(us) { return us.map(u => forma(u)).sort().join('|'); }
function prefijoComun(ns) { let p = ns[0] || ''; for (const n of ns) while (p && !n.startsWith(p)) p = p.slice(0, -1); return p.replace(/[\s\d_-]+$/, '').trim(); }

function describirUnidad(u, grupo) {
  const teclas = [...new Set(grupo.map(x => x.disp).filter(d => d.startsWith('tecla:')))];
  const disparo = teclas.length > 1 ? 'Al presionar ' + teclas.map(t => TECLAS[t.slice(6)] || t.slice(6)).join(', ') : nombreDisparo(u);
  const ef = u.efectos.length > 4 ? u.efectos.slice(0, 4).join(', ') + '…' : u.efectos.join(', ');
  return disparo + (u.via ? ' (mensaje enviado desde ' + u.via + ')' : '') + (u.conds.length ? ', ' + u.conds.join(', ') : '') + ': ' + ef;
}

// Apartados = actores del modelo (los objetos iguales, como 8 monedas, se juntan)
function crearActores(modelo, ejecutados) {
  const veces = k => !ejecutados ? 1 : ((ejecutados instanceof Map ? ejecutados.get(k) : ejecutados[k]) || 0);
  const act = actoresDe(modelo);
  // pesos: lo que se repite mucho en el juego distingue poco
  const todas = [...act.values()].flatMap(a => a.unidades);
  const cuenta = new Map();
  for (const u of todas) for (const sg of new Set(u.rasgos.map(r => r.s))) cuenta.set(sg, (cuenta.get(sg) || 0) + 1);
  const total = todas.length || 1;
  for (const u of todas) u.rasgos = u.rasgos.map(r => Object.assign({}, r, { k: Math.max(0.35, 1 / Math.sqrt(Math.max(1, (cuenta.get(r.s) || 1) * 6 / total * 2))) }));
  // grupos de unidades iguales dentro de un actor (las 4 flechas…)
  // Solo se juntan unidades que hacen lo mismo con otra tecla (las 4 flechas); «si VIDAS = 0 → GAME OVER» y
  // «si PUNTOS = 8 → GANASTE» tienen la misma forma pero son cosas distintas: se distinguen por condición y destino.
  const claveU = u => forma(u) + '#' + u.conds.join('|').replace(/-?\d+([.,]\d+)?/g, '#') + '#' + u.efectos.filter(t => /fondo|disfraz|variable|valor|sumar .* a [^xy]/.test(t)).map(t => t.replace(/-?\d+([.,]\d+)?/g, '#')).join('|');
  const agruparU = us => { const g = new Map(); for (const u of us) { const k = claveU(u); if (!g.has(k)) g.set(k, []); g.get(k).push(u); } return [...g.values()]; };
  // objetos con el mismo comportamiento se juntan en un apartado
  const objs = [...act.values()].filter(a => a.tipo === 'objeto');
  const porForma = new Map();
  for (const a of objs) { const k = formaUnidades(a.unidades); if (!porForma.has(k)) porForma.set(k, []); porForma.get(k).push(a); }
  const aps = [];
  const nuevoAp = (tipo, titulo, miembros, clave) => {
    const grupos = agruparU(miembros[0].unidades).map((us, i) => {
      const u = us[0];
      const vistas = miembros.flatMap(m => m.unidades.filter(x => claveU(x) === claveU(u)));
      const n = vistas.reduce((s, x) => s + Math.max(0, ...x.ids.map(id => veces(x.objeto + '|' + id))), 0);
      return { id: '', unidades: us, titulo: describirUnidad(u, us), veces: n, visto: n > 0, on: n > 0, codigo: u.lineas, lineaIds: u.lineaIds, marcadas: u.marcadas, objeto: u.objeto };
    });
    aps.push({ tipo, titulo, clave, miembros, grupos, on: true, imp: 'medio' });
  };
  for (const [, ms] of porForma) {
    if (ms.length > 1) nuevoAp('objeto', (prefijoComun(ms.map(m => m.nombre)) || 'Objetos iguales') + ' (' + ms.length + ' objetos: ' + ms.map(m => m.nombre).join(', ') + ')', ms);
    else nuevoAp('objeto', 'Objeto «' + ms[0].nombre + '»', ms);
  }
  const orden = { fondo: 1, juego: 2, variable: 3, lista: 4, pregunta: 5, otros: 9 };
  for (const a of [...act.values()].filter(a => a.tipo !== 'objeto').sort((x, y) => (orden[x.tipo] || 8) - (orden[y.tipo] || 8)))
    nuevoAp(a.tipo, a.tipo === 'variable' ? 'Variable «' + a.nombre + '»' : a.tipo === 'lista' ? 'Lista «' + a.nombre + '»' : a.nombre, [a], a.clave);
  // orden: jugador/objetos según el modelo, luego fondo, fin, variables…
  const posObj = n => { const i = modelo.objetos.findIndex(o => o.nombre === n); return i < 0 ? 99 : i; };
  aps.sort((a, b) => (a.tipo === 'objeto' ? 0 : orden[a.tipo] || 8) - (b.tipo === 'objeto' ? 0 : orden[b.tipo] || 8) || (a.tipo === 'objeto' && b.tipo === 'objeto' ? posObj(a.miembros[0].nombre) - posObj(b.miembros[0].nombre) : 0));
  // Comprobación: ningún bloque de ningún objeto se queda sin mirar
  const asignados = new Set(todas.flatMap(u => u.ids.map(id => u.objeto + '|' + id)));
  const revision = { objetos: modelo.objetos.length, programas: 0, bloques: 0, sinActor: [] };
  for (const o of modelo.objetos) for (const g of o.guiones) { revision.programas++; for (const seg of g.segmentos) for (const x of seg.sentencias) { revision.bloques++; if (!asignados.has(o.nombre + '|' + x.id) && !/^event_broadcast/.test(x.rasgos[0].op)) revision.sinActor.push(o.nombre + ': ' + x.txt); } }
  revision.sueltos = modelo.sueltos;
  // apartado de elementos (inventario)
  const inv = modelo.inventario;
  aps.unshift({ tipo: 'elementos', titulo: 'Elementos del juego: ' + inv.objetos.length + ' objetos, ' + inv.fondos.length + ' fondos, ' + Object.keys(inv.variables).length + ' variables' + (Object.keys(inv.listas).length ? ', ' + Object.keys(inv.listas).length + ' listas' : ''), miembros: [], grupos: [], on: true, imp: 'bajo' });
  aps.revision = revision;
  aps.forEach((a, i) => { a.id = 'a' + (i + 1); a.grupos.forEach((g, j) => g.id = a.id + 'g' + (j + 1)); a.visto = !a.grupos.length || a.grupos.some(g => g.visto); if (ejecutados && a.grupos.length && !a.visto) a.on = false; });
  return aps;
}

// --- corregir un alumno por actores ---
function puntuarGrupo(g, rasgos) { // media de las unidades del grupo (p. ej. las 4 flechas)
  const res = g.unidades.map(u => emparejar(u.rasgos, rasgos));
  return { sim: res.reduce((s, e) => s + e.sim, 0) / res.length, contenido: res.reduce((s, e) => s + e.contenido, 0), res };
}
function puntuarMiembro(ap, rasgos) {
  const gs = ap.grupos.filter(g => g.on);
  if (!gs.length) return 0;
  return gs.reduce((s, g) => s + puntuarGrupo(g, rasgos).sim, 0) / gs.length;
}
function corregirActores(apartados, alumnoProy) {
  const actA = actoresDe(alumnoProy);
  const objA = [...actA.values()].filter(a => a.tipo === 'objeto');
  const res = {};
  // 1) emparejar objetos: cada objeto del modelo con un objeto distinto del alumno (el que más se parece)
  const pares = [];
  for (const ap of apartados.filter(a => a.tipo === 'objeto' && a.on)) for (const m of ap.miembros) for (const o of objA) {
    const v = puntuarMiembro(ap, o.rasgos); if (v > 0.15) pares.push({ ap, m, o, v: v + (normN(m.nombre) === normN(o.nombre) ? 0.05 : 0) });
  }
  pares.sort((x, y) => y.v - x.v);
  const asig = new Map(), usados = new Set();
  for (const p of pares) { if (asig.has(p.m) || usados.has(p.o)) continue; asig.set(p.m, p.o); usados.add(p.o); }
  // 2) emparejar variables y listas: por lo que se hace con ellas (y un poco por el nombre)
  for (const tipo of ['variable', 'lista']) {
    const cand = [...actA.values()].filter(a => a.tipo === tipo);
    const mods = apartados.filter(a => a.tipo === tipo && a.on);
    const us = new Set();
    // primero las que se llaman igual (o casi: vida / vidas)
    for (const igual of [(a, b) => normN(a) === normN(b), parecidoNombre])
      for (const ap of mods) { if (asig.has(ap.miembros[0])) continue; const c = cand.find(c => !us.has(c) && igual(c.nombre, ap.miembros[0].nombre)); if (c) { asig.set(ap.miembros[0], c); us.add(c); } }
    // después, por lo que se hace con ellas
    const ps = [];
    for (const ap of mods) if (!asig.has(ap.miembros[0])) for (const c of cand) if (!us.has(c)) {
      const v = puntuarMiembro(ap, c.rasgos) + perfilVar(ap.miembros[0], c);
      ps.push({ m: ap.miembros[0], o: c, v });
    }
    ps.sort((x, y) => y.v - x.v);
    for (const p of ps) { if (p.v < 0.4 || asig.has(p.m) || us.has(p.o)) continue; asig.set(p.m, p.o); us.add(p.o); }
  }
  // 3) nota de cada apartado
  for (const ap of apartados) {
    if (ap.tipo === 'elementos') { res[ap.id] = corregirElementos(ap, alumnoProy); continue; }
    const gs = ap.grupos.filter(g => g.on);
    const det = [], notasG = {};
    let sumaNotas = 0;
    const dondes = [];
    for (const g of gs) {
      let notaG = 0, faltan = new Map(), aMedias = new Map(), simG = 0;
      for (const m of ap.miembros) {
        let o = asig.get(m) || (['fondo', 'juego', 'pregunta', 'otros'].includes(ap.tipo) ? actA.get(ap.clave) : null);
        if (!o) continue;
        const p = puntuarGrupo(g, o.rasgos);
        // si no aparece en su actor, se mira en todo el juego (lo ha hecho de otra forma): cuenta menos
        let sim = p.sim, r = p;
        if (p.sim < 0.5) { const todo = puntuarGrupo(g, alumnoProy.todos); if (todo.sim >= 0.6 && todo.sim * 0.7 > sim) { sim = todo.sim * 0.7; r = todo; } }
        simG += sim / ap.miembros.length;
        g.unidades.forEach((u, ui) => u.rasgos.forEach((x, ri) => {
          const v = r.res[ui].valor[ri]; const k = x.txt.replace(/-?\d+([.,]\d+)?/g, '#');
          const mm = v < 0.45 ? faltan : v < 0.8 ? aMedias : null; if (mm && !mm.has(k)) mm.set(k, x.txt);
        }));
      }
      notaG = aNota(simG);
      notasG[g.id] = notaG; sumaNotas += notaG;
      const lista = (m, max = 5) => [...m.values()].slice(0, max).map(t => '«' + t + '»').join(', ') + (m.size > max ? '…' : '');
      const d = [];
      if (notaG === 0) d.push({ ok: false, t: 'No lo tiene.' });
      else { if (faltan.size) d.push({ ok: false, t: 'Falta o no se parece: ' + lista(faltan) }); if (aMedias.size) d.push({ ok: false, medio: true, t: 'Hecho de otra forma (cuenta en parte): ' + lista(aMedias) }); if (!faltan.size && !aMedias.size) d.push({ ok: true, t: 'Igual que en el modelo.' }); }
      det.push({ grupo: g, nota: notaG, det: d });
    }
    for (const m of ap.miembros) { const o = asig.get(m) || (['fondo', 'juego', 'pregunta', 'otros'].includes(ap.tipo) ? actA.get(ap.clave) : null); dondes.push(o ? o.nombre : null); }
    const nota = gs.length ? Math.round(sumaNotas / gs.length * 2) / 2 : 0;
    let corresp;
    if (ap.tipo === 'objeto') { const ok = dondes.filter(Boolean); corresp = ap.miembros.length > 1 ? (ok.length ? 'Sus objetos: ' + ok.join(', ') + (ok.length < ap.miembros.length ? ' (' + ok.length + ' de ' + ap.miembros.length + ')' : '') : 'No tiene objetos que hagan esto.') : (ok.length ? 'Su objeto: «' + ok[0] + '»' : 'No tiene ningún objeto que haga esto.'); }
    else if (ap.tipo === 'variable' || ap.tipo === 'lista') corresp = dondes[0] ? 'Su ' + ap.tipo + ': «' + dondes[0] + '»' : 'No tiene una ' + ap.tipo + ' que haga esto.';
    res[ap.id] = { nota, grupos: notasG, det: det, corresp: corresp || '', sim: nota / 10 };
  }
  return res;
}
// El papel de una variable se nota en con qué valor empieza y si sube o baja (vidas: empieza en 3 y baja)
function perfilVar(m, c) {
  const pf = a => { const ini = new Set(), sig = new Set(); for (const u of a.unidades) for (const x of u.valores || []) { const n = Number(x.v); if (x.op === 'fija' && !isNaN(n) && x.v !== '') ini.add(n); if (x.op === 'cambia') sig.add(isNaN(n) ? '?' : n < 0 ? '-' : '+'); } return { ini, sig }; };
  const a = pf(m), b = pf(c);
  let bonus = 0;
  if (a.ini.size && b.ini.size) bonus += [...a.ini].some(x => b.ini.has(x)) ? 0.15 : -0.2;
  if (a.sig.size && b.sig.size) bonus += [...a.sig].some(x => b.sig.has(x)) ? 0.1 : -0.2;
  return bonus;
}
function parecidoNombre(a, b) { a = normN(a); b = normN(b); return a.length > 2 && b.length > 2 && (a.includes(b) || b.includes(a)); }
function corregirElementos(ap, al) {
  const ia = al.inventario, im = ap._inv;
  const lineas = [], ratios = [];
  const comp = (nombre, m, a) => { if (!m) return; const r = Math.min(1, a / m); ratios.push(r); lineas.push({ ok: a >= m, medio: a < m && a > 0, t: nombre + ': ' + a + ' (modelo: ' + m + ')' }); };
  comp('Objetos', im.objetos, ia.objetos.length);
  comp('Fondos', im.fondos, ia.fondos.length);
  comp('Variables', im.variables, Object.keys(ia.variables).filter(k => !/^mi variable$|^my variable$/i.test(ia.variables[k].nombre)).length);
  comp('Listas', im.listas, Object.keys(ia.listas).length);
  const nota = ratios.length ? Math.round(ratios.reduce((s, r) => s + r, 0) / ratios.length * 20) / 2 : 10;
  return { nota, det: [{ grupo: null, nota, det: lineas }], grupos: {}, corresp: '' };
}
function prepararElementos(aps, modelo) {
  const inv = modelo.inventario;
  const ap = aps.find(a => a.tipo === 'elementos');
  if (ap) ap._inv = { objetos: inv.objetos.length, fondos: inv.fondos.length, variables: Object.keys(inv.variables).filter(k => !/^mi variable$|^my variable$/i.test(inv.variables[k].nombre)).length, listas: Object.keys(inv.listas).length };
  return aps;
}

const API = { leerProyecto, extraer, crearApartados, crearItems, crearActores: (m, e) => prepararElementos(crearActores(m, e), m), corregirActores, actoresDe, corregir, corregirApartado, aNota, emparejar };
if (typeof module !== 'undefined' && module.exports) module.exports = API; else G.Analizador = API;
})(typeof window !== 'undefined' ? window : globalThis);
