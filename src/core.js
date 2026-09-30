/* RADARS data engine. No DOM, network, storage or credentials are used here.
 * Contract: absent numeric/boolean values are null, never zero/No.
 * Browser role filters are navigation aids, not a security boundary.
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RadarsCore = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const COURSE_ORDER = Object.freeze(['4.º Primaria', '5.º Primaria', '6.º Primaria', '1.º ESO', '2.º ESO', '3.º ESO', '4.º ESO', '1.º Bachillerato', '2.º Bachillerato']);
  const SCORE_COLUMNS = Object.freeze(['popularidad', 'sociabilidad', 'reciprocidad_amistad', 'acierto_amistad', 'rechazo_recibido', 'rechazo_declarado', 'reciprocidad_rechazo', 'acierto_rechazo', 'bienestar', 'centralidad', 'mediacion']);
  const COUNT_COLUMNS = Object.freeze(['amistad_recibida_n', 'amistad_declarada_n', 'amistad_reciproca_n', 'rechazo_recibido_n', 'rechazo_declarado_n', 'rechazo_reciproco_n', 'bienestar_suma', 'mediacion_n', 'bullying_companeros_n']);
  const GROUP_SCORE_COLUMNS = Object.freeze(['pos_bullying_declarado', 'pos_bullying_companeros', 'pos_soledad', 'pos_densidad_rechazo', 'pos_sin_reciprocas', 'pos_separacion', 'pos_desigualdad', 'pos_centralizacion']);
  const STRUCTURE_COLUMNS = Object.freeze(['modularidad', 'gini_popularidad', 'centralizacion_eigenvector']);
  const BAD_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const known = value => value !== null && value !== undefined;
  const cleanText = value => {
    if (!known(value)) return null;
    if (typeof value !== 'string' && typeof value !== 'number') throw new Error('Una celda contiene un tipo de dato no admitido. Usa texto o números.');
    const text = String(value).replace(/\u00a0/g, ' ').trim();
    return text || null;
  };
  function safeRows(rows, label, allowEmpty) {
    if (!Array.isArray(rows) || (!allowEmpty && !rows.length)) throw new Error(label + ' no contiene filas.');
    return rows.map((row, index) => {
      if (!row || typeof row !== 'object' || Array.isArray(row) || ![Object.prototype, null].includes(Object.getPrototypeOf(row))) {
        throw new Error(label + ': la fila ' + (index + 2) + ' no tiene un formato válido.');
      }
      const copy = {};
      for (const key of Object.keys(row)) {
        if (BAD_KEYS.has(key)) throw new Error(label + ': encabezado no permitido: ' + key + '.');
        copy[key] = row[key];
      }
      return copy;
    });
  }
  function headers(rows, required, label) {
    const present = new Set(rows.flatMap(row => Object.keys(row)));
    const missing = required.filter(column => !present.has(column));
    if (missing.length) throw new Error(label + ': faltan columnas: ' + missing.join(', ') + '.');
  }
  function parseNumber(value, column, integer, minimum, maximum) {
    const text = cleanText(value);
    if (text === null) return null;
    // Excel numeric strings may use a decimal comma; thousands separators and JS syntax are not accepted.
    if (!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:[eE][+-]?\d+)?$/.test(text)) throw new Error('La columna ' + column + ' contiene un número no válido: ' + text + '.');
    const number = Number(text.replace(',', '.'));
    if (!Number.isFinite(number) || (integer && !Number.isSafeInteger(number))) throw new Error('La columna ' + column + ' debe contener ' + (integer ? 'enteros finitos.' : 'números finitos.'));
    if (number < minimum || number > maximum) throw new Error('La columna ' + column + ' debe estar entre ' + minimum + ' y ' + maximum + '.');
    return number;
  }
  function yesNo(value, column) {
    const text = cleanText(value);
    if (text === null) return null;
    if (/^s[ií]$/i.test(text)) return 'Sí';
    if (/^no$/i.test(text)) return 'No';
    throw new Error('La columna ' + column + ' solo admite Sí, No o una celda vacía.');
  }
  function identifiers(row, label) {
    const campus = cleanText(row.Campus), center = cleanText(row.Centro);
    if (campus && center && campus !== center) throw new Error(label + ': Campus y Centro no coinciden.');
    row.Campus = campus || center;
    row.Centro = row.Campus;
    row.Curso = cleanText(row.Curso);
    row.Grupo = cleanText(row.Grupo);
    if (!row.Campus || !row.Curso || !row.Grupo) throw new Error(label + ': faltan valores de Centro, Curso o Grupo.');
    return row;
  }
  const groupKey = row => JSON.stringify([row.Campus || row.Centro, row.Curso, row.Grupo]);
  const roundScore = value => Math.round((value + Number.EPSILON) * 10) / 10;
  const ratioScore = (count, denominator) => !known(count) || !known(denominator) || denominator <= 0 ? null : roundScore(10 * count / denominator);
  function checkScore(row, column, expected, description) {
    const actual = row[column];
    if (actual === null) return; // Missing output is explicitly allowed and displayed as Sin datos.
    if (expected === null || Math.abs(actual - expected) > 1e-8) throw new Error('ID ' + row.ID + ': ' + column + ' no coincide con ' + description + ' en la escala normalizada_v1.');
  }
  function validateNormalized(row) {
    if (row.escala_indicadores !== 'normalizada_v1') return;
    const peers = row['.n_clase'] - 1;
    for (const [score, count] of [['popularidad', 'amistad_recibida_n'], ['sociabilidad', 'amistad_declarada_n'], ['rechazo_recibido', 'rechazo_recibido_n'], ['rechazo_declarado', 'rechazo_declarado_n'], ['mediacion', 'mediacion_n']]) {
      checkScore(row, score, ratioScore(row[count], peers), count + ' / otras personas del grupo × 10');
    }
    for (const type of ['amistad', 'rechazo']) {
      checkScore(row, 'reciprocidad_' + type, ratioScore(row[type + '_reciproca_n'] ?? row[type + '_reciproco_n'], row[type + '_declarada_n'] ?? row[type + '_declarado_n']), 'elecciones correspondidas / declaradas × 10');
      checkScore(row, 'acierto_' + type, ratioScore(row['pred_' + type + '_aciertos'], row['pred_' + type + '_n']), 'predicciones acertadas / emitidas × 10');
    }
    checkScore(row, 'bienestar', ratioScore(row.bienestar_suma, 12), 'bienestar_suma / 12 × 10');
    checkScore(row, 'centralidad', known(row.centralidad_eigenvector) ? roundScore(10 * row.centralidad_eigenvector) : null, 'centralidad_eigenvector × 10');
  }
  /** Join the complete pair before filtering. Required headers may contain blank cells.
   * Output students retain source fields, with canonical names and nullable typed values.
   * Returned groups are validated metadata rows; warnings never include student names.
   */
  function validateAndJoin(dataRows, keyRows, groupRows) {
    const students = safeRows(dataRows, 'El archivo de indicadores', false);
    const keys = safeRows(keyRows, 'La llave de nombres', false);
    const rawGroups = safeRows(groupRows || [], 'La hoja Grupos', true);
    headers(students, ['ID', 'Curso', 'Grupo', ...SCORE_COLUMNS, ...COUNT_COLUMNS, 'bullying_autorreporte'], 'El archivo de indicadores');
    headers(keys, ['ID', 'Nombre'], 'La llave de nombres');
    const warnings = [], names = new Map(), ids = new Set(), sizes = new Map();
    if ([...students, ...keys].some(row => typeof row.ID === 'number')) warnings.push('Hay IDs guardados como números. Usa formato Texto en ambos archivos para conservar ceros iniciales.');
    keys.forEach(row => {
      row.ID = cleanText(row.ID);
      if (!row.ID) throw new Error('La llave de nombres contiene IDs vacíos.');
      if (names.has(row.ID)) throw new Error('La llave de nombres contiene IDs duplicados: ' + row.ID + '.');
      names.set(row.ID, cleanText(row.Nombre));
    });
    students.forEach(row => {
      identifiers(row, 'El archivo de indicadores');
      row.ID = cleanText(row.ID);
      if (!row.ID) throw new Error('El archivo de indicadores contiene IDs vacíos.');
      if (ids.has(row.ID)) throw new Error('El archivo de indicadores contiene IDs duplicados: ' + row.ID + '.');
      ids.add(row.ID);
      if (!names.has(row.ID)) throw new Error('Hay IDs del archivo de indicadores sin correspondencia en la llave: ' + row.ID + '.');
      row.Nombre = names.get(row.ID);
      sizes.set(groupKey(row), (sizes.get(groupKey(row)) || 0) + 1);
    });
    for (const id of names.keys()) if (!ids.has(id)) throw new Error('La llave incluye IDs que no aparecen en los indicadores: ' + id + '. Carga una pareja de archivos coincidente.');
    students.forEach(row => {
      const size = sizes.get(groupKey(row));
      for (const column of ['n_clase', 'n_class', '.n_clase']) {
        if (own(row, column) && cleanText(row[column]) !== null && parseNumber(row[column], column, true, 1, Number.MAX_SAFE_INTEGER) !== size) throw new Error('ID ' + row.ID + ': ' + column + ' no coincide con los ' + size + ' estudiantes del grupo.');
      }
      row['.n_clase'] = size;
      row.n_clase = size;
      for (const column of SCORE_COLUMNS) row[column] = parseNumber(row[column], column, false, 0, 10);
      for (const column of COUNT_COLUMNS) row[column] = parseNumber(row[column], column, true, 0, column === 'bienestar_suma' ? 12 : size - 1);
      for (const type of ['amistad', 'rechazo']) {
        const reciprocal = type === 'amistad' ? row.amistad_reciproca_n : row.rechazo_reciproco_n;
        const declared = type === 'amistad' ? row.amistad_declarada_n : row.rechazo_declarado_n;
        const received = type === 'amistad' ? row.amistad_recibida_n : row.rechazo_recibido_n;
        if (known(reciprocal) && ((known(declared) && reciprocal > declared) || (known(received) && reciprocal > received))) throw new Error('ID ' + row.ID + ': las elecciones correspondidas de ' + type + ' no pueden superar las emitidas ni las recibidas.');
        for (const suffix of ['n', 'aciertos']) {
          const column = 'pred_' + type + '_' + suffix;
          row[column] = parseNumber(row[column], column, true, 0, size - 1);
        }
        if (known(row['pred_' + type + '_aciertos']) && known(row['pred_' + type + '_n']) && row['pred_' + type + '_aciertos'] > row['pred_' + type + '_n']) throw new Error('ID ' + row.ID + ': los aciertos de ' + type + ' superan las predicciones emitidas.');
      }
      row.centralidad_eigenvector = parseNumber(row.centralidad_eigenvector, 'centralidad_eigenvector', false, 0, 1);
      for (const column of ['bullying_autorreporte', 'respondio', 'soledad_frecuente', 'identifica_apoyo']) row[column] = yesNo(row[column], column);
      row.Tratamiento = cleanText(row.Tratamiento) || 'alumno';
      if (!['alumno', 'alumna'].includes(row.Tratamiento)) throw new Error('El campo técnico Tratamiento contiene un valor no admitido. Consulta el diccionario del Excel.');
      row.comunidad_amistad = cleanText(row.comunidad_amistad);
      row.escala_indicadores = cleanText(row.escala_indicadores);
      if (row.escala_indicadores && !['normalizada_v1', 'comparativa', 'simulada'].includes(row.escala_indicadores)) throw new Error('escala_indicadores desconocida: ' + row.escala_indicadores + '.');
      validateNormalized(row);
    });
    const seenGroups = new Set(), classCodes = new Set();
    const groups = rawGroups.map(row => {
      identifiers(row, 'La hoja Grupos');
      const key = groupKey(row);
      if (seenGroups.has(key)) throw new Error('La hoja Grupos contiene grupos duplicados.');
      if (!sizes.has(key)) throw new Error('La hoja Grupos incluye un grupo sin estudiantes en los indicadores seleccionados.');
      seenGroups.add(key);
      if (own(row, 'ID_aula') && cleanText(row.ID_aula) !== null) {
        if (typeof row.ID_aula !== 'string' || !/^[A-Za-z0-9_.:-]{1,80}$/.test(row.ID_aula)) throw new Error('Grupos: ID_aula debe ser una clave de texto de hasta 80 caracteres, sin espacios.');
        if (classCodes.has(row.ID_aula)) throw new Error('Grupos: ID_aula debe ser único para cada aula.');
        classCodes.add(row.ID_aula);
      }
      for (const column of GROUP_SCORE_COLUMNS) row[column] = parseNumber(row[column], column, false, 0, 10);
      for (const column of STRUCTURE_COLUMNS) row[column] = parseNumber(row[column], column, false, column === 'modularidad' ? -1 : 0, 1);
      row.salones_referencia = parseNumber(row.salones_referencia, 'salones_referencia', true, 2, Number.MAX_SAFE_INTEGER);
      row.Periodo = cleanText(row.Periodo);
      row.escala_grupo = cleanText(row.escala_grupo) || 'comparativa';
      if (!['comparativa', 'normalizada_v1'].includes(row.escala_grupo)) throw new Error('Grupos: escala_grupo desconocida.');
      if (row.escala_grupo === 'comparativa' && GROUP_SCORE_COLUMNS.some(column => known(row[column])) && row.salones_referencia === null) throw new Error('Grupos: indica salones_referencia para las posiciones comparativas suministradas.');
      if (row.escala_grupo === 'normalizada_v1') {
        const summary = aggregate(students.filter(student => groupKey(student) === key), row);
        summary.attention.forEach(metric => {
          const value = row['pos_' + metric.id];
          if (known(value) && (!known(metric.score) || Math.abs(value - metric.score) > 1e-8)) throw new Error('Grupos: pos_' + metric.id + ' no coincide con el porcentaje del grupo en la escala normalizada_v1.');
        });
        for (const [score, field] of [['pos_separacion', 'modularidad'], ['pos_desigualdad', 'gini_popularidad'], ['pos_centralizacion', 'centralizacion_eigenvector']]) {
          if (known(row[score]) && (!known(row[field]) || Math.abs(row[score] - roundScore(10 * Math.max(0, row[field]))) > 1e-8)) throw new Error('Grupos: ' + score + ' no coincide con ' + field + ' × 10.');
        }
      }
      return row;
    });
    if (groups.length && groups.length < sizes.size) warnings.push('Algunos grupos no tienen una fila en Grupos. Sus medidas de estructura aparecerán como Sin datos.');
    if (students.some(row => row.Nombre === null)) warnings.push('Hay IDs sin nombre. Se mostrarán con su ID.');
    if (students.some(row => row.respondio === null)) warnings.push('Falta el estado de respuesta de parte del grupo. Los porcentajes usan únicamente valores conocidos.');
    return {students, groups, warnings};
  }
  function rate(rows, field, predicate, selfReport) {
    const valid = rows.filter(row => (!selfReport || row.respondio !== 'No') && known(row[field]));
    return {count: valid.length ? valid.filter(row => predicate(row[field])).length : null, denominator: valid.length, percent: valid.length ? 100 * valid.filter(row => predicate(row[field])).length / valid.length : null};
  }
  /** Aggregate one complete classroom. Never sum individual positions or diagnoses.
   * attention: count/denominator/percent/score nullable; coverage is a count of usable rows.
   * mediators is a rate object. supportYes/supportNo are nullable counts;
   * supportKnown is their common denominator. communities=null means incomplete assignments.
   * metadata accepts one object or all metadata rows; a foreign group is never used.
   */
  function aggregate(students, metadata) {
    if (!Array.isArray(students) || !students.length) throw new Error('No hay estudiantes en el grupo seleccionado.');
    const key = groupKey(students[0]);
    if (students.some(row => groupKey(row) !== key)) throw new Error('Selecciona un único centro de enseñanza, curso y grupo para ver su ficha.');
    let meta = Array.isArray(metadata) ? metadata.find(row => groupKey(row) === key) : metadata;
    if (meta && (meta.Campus || meta.Centro || meta.Curso || meta.Grupo) && groupKey(meta) !== key) meta = null;
    meta = Object.assign({}, meta || {});
    for (const column of [...GROUP_SCORE_COLUMNS, ...STRUCTURE_COLUMNS, 'salones_referencia', 'Periodo']) if (!known(meta[column])) meta[column] = null;
    const normalized = meta.escala_grupo === 'normalizada_v1' || (!meta.escala_grupo && students.every(row => row.escala_indicadores === 'normalizada_v1'));
    const n = students.length, first = students[0];
    const declared = rate(students, 'bullying_autorreporte', value => value === 'Sí', true);
    const peers = rate(students, 'bullying_companeros_n', value => value > 0, false);
    const alone = rate(students, 'soledad_frecuente', value => value === 'Sí', true);
    const noMutual = rate(students, 'amistad_reciproca_n', value => value === 0, false);
    const rejectionRows = students.filter(row => row.respondio !== 'No' && known(row.rechazo_declarado_n));
    const possible = rejectionRows.length * (n - 1);
    const nominations = rejectionRows.length ? rejectionRows.reduce((sum, row) => sum + row.rechazo_declarado_n, 0) : null;
    const rejection = {count: nominations, denominator: possible, percent: possible ? 100 * nominations / possible : null};
    const fraction = value => value.denominator && known(value.count) ? value.count + ' de ' + value.denominator : 'Sin datos';
    const specs = [
      ['bullying_declarado', 'Acoso escolar: respuesta personal', declared, fraction(declared) + ' estudiantes indican haber sufrido acoso escolar'],
      ['bullying_companeros', 'Acoso escolar: información del grupo', peers, fraction(peers) + ' estudiantes reciben nominaciones, sin contar varias veces a la misma persona'],
      ['soledad', 'Soledad frecuente', alone, fraction(alone) + ' · Casi siempre o siempre · Última semana'],
      ['densidad_rechazo', 'Densidad de rechazo', rejection, known(nominations) && possible ? nominations + ' nominaciones negativas de ' + possible + ' posibles' : 'Sin datos suficientes'],
      ['sin_reciprocas', 'Sin amistades recíprocas', noMutual, fraction(noMutual) + ' no tienen vínculos mutuos en el grupo']
    ];
    const attention = specs.map(([id, title, value, description]) => ({id, title, ...value, score: normalized ? (known(value.percent) ? roundScore(value.percent / 10) : null) : meta['pos_' + id], description, coverage: id === 'densidad_rechazo' ? rejectionRows.length : value.denominator}));
    let communities = null;
    if (students.every(row => known(row.comunidad_amistad) && row.comunidad_amistad !== '')) {
      const counts = new Map();
      students.forEach(row => counts.set(row.comunidad_amistad, (counts.get(row.comunidad_amistad) || 0) + 1));
      communities = [...counts].map(([name, count]) => ({name, count})).sort((a, b) => b.count - a.count || String(a.name).localeCompare(String(b.name), 'es'));
    }
    const support = rate(students, 'identifica_apoyo', value => value === 'Sí', true);
    const noSupport = rate(students, 'identifica_apoyo', value => value === 'No', true);
    return {center: first.Campus || first.Centro, course: first.Curso, group: first.Grupo, n,
      responses: students.every(row => known(row.respondio)) ? students.filter(row => row.respondio === 'Sí').length : null,
      responsesKnown: students.filter(row => known(row.respondio)).length, period: meta.Periodo,
      attention, communities, mediators: rate(students, 'mediacion_n', value => value > 0, false),
      supportYes: support.count, supportNo: noSupport.count, supportKnown: support.denominator,
      metadata: meta, normalized};
  }
  /** Convenience filtering for a trusted local operator. These client profiles do
   * not encrypt data and cannot prevent a user with the source files from reading them.
   */
  function scopeRows(students, profile) {
    if (!Array.isArray(students) || !profile || !['tutor', 'orientador'].includes(profile.role)) return [];
    const fields = [['center', 'Campus'], ['course', 'Curso'], ['group', 'Grupo']];
    if (profile.role === 'tutor' && fields.some(([scope]) => typeof profile[scope] !== 'string' || !profile[scope].trim())) return [];
    // Only null/undefined are wildcards for the orientador; malformed scopes fail closed.
    if (fields.some(([scope]) => known(profile[scope]) && (typeof profile[scope] !== 'string' || !profile[scope].trim()))) return [];
    return students.filter(row => fields.every(([scope, column]) => !known(profile[scope]) || profile[scope] === (column === 'Campus' ? row.Campus || row.Centro : row[column])));
  }
  function compareCourses(a, b) {
    const left = COURSE_ORDER.indexOf(a), right = COURSE_ORDER.indexOf(b);
    if (left >= 0 || right >= 0) return (left < 0 ? COURSE_ORDER.length : left) - (right < 0 ? COURSE_ORDER.length : right);
    return String(a).localeCompare(String(b), 'es', {numeric: true});
  }
  const sortCourses = courses => [...courses].sort(compareCourses);
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[character]));
  return Object.freeze({validateAndJoin, aggregate, scopeRows, COURSE_ORDER, SCORE_COLUMNS, COUNT_COLUMNS, GROUP_SCORE_COLUMNS, STRUCTURE_COLUMNS, compareCourses, sortCourses, escapeHtml});
}));
