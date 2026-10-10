/* PBIS data engine. No DOM, network, storage or credentials are used here.
 * Contract: absent numeric/boolean values are null, never zero/No.
 * Browser role filters are navigation aids, not a security boundary.
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PbisCore = factory();
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
  const MIN_BULLYING_PEERS = 2;
  const hasPeerBullyingSignal = value => known(value) && value >= MIN_BULLYING_PEERS;
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
  function happiness(row) {
    const values = [row.felicidad_centro, row.felicidad_diversion, row.felicidad_soledad];
    return values.every(known) ? roundScore(10 * (values[0] + values[1] + 4 - values[2]) / 12) : null;
  }
  function checkScore(row, column, expected, description) {
    const actual = row[column];
    if (actual === null) return; // Missing output is explicitly allowed and displayed as Sin datos.
    if (expected === null || Math.abs(actual - expected) > 1e-8) throw new Error('ID ' + row.ID + ': ' + column + ' no coincide con ' + description + ' en la escala normalizada_v1.');
  }
  function validateNormalized(row) {
    if (!['normalizada_v1', 'centro_observado_v1'].includes(row.escala_indicadores)) return;
    const peers = (row.escala_indicadores === 'centro_observado_v1' ? row.n_centro : row['.n_clase']) - 1;
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
    const hasKey = keyRows !== null && keyRows !== undefined;
    const keys = hasKey ? safeRows(keyRows, 'La llave de nombres', false) : [];
    const rawGroups = safeRows(groupRows || [], 'La hoja Grupos', true);
    headers(students, ['ID', 'Curso', 'Grupo', ...SCORE_COLUMNS, ...COUNT_COLUMNS, 'bullying_autorreporte'], 'El archivo de indicadores');
    if (hasKey) headers(keys, ['ID', 'Nombre'], 'La llave de nombres');
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
      if (hasKey && !names.has(row.ID)) throw new Error('Hay IDs del archivo de indicadores sin correspondencia en la llave: ' + row.ID + '.');
      // Wave 1 and processed sheets may carry the name in this same file.
      // Preserve it when no separate key was supplied; codes remain the fallback.
      const given = cleanText(row.Nombre ?? row.nombre);
      const family = cleanText(row.Apellidos ?? row.apellidos);
      row.Nombre = hasKey ? names.get(row.ID) : [given, family].filter(Boolean).join(' ') || null;
      sizes.set(groupKey(row), (sizes.get(groupKey(row)) || 0) + 1);
    });
    for (const id of names.keys()) if (!ids.has(id)) throw new Error('La llave incluye IDs que no aparecen en los indicadores: ' + id + '. Carga una pareja de archivos coincidente.');
    students.forEach(row => {
      const size = sizes.get(groupKey(row));
      row.ambito_nominaciones = cleanText(row.ambito_nominaciones);
      if (row.ambito_nominaciones && row.ambito_nominaciones !== 'centro') throw new Error('Ámbito de nominaciones desconocido.');
      row.n_centro = parseNumber(row.n_centro, 'n_centro', true, 1, Number.MAX_SAFE_INTEGER);
      const nominationMaximum = row.ambito_nominaciones === 'centro' ? (row.n_centro || 0) - 1 : size - 1;
      if (nominationMaximum < size - 1) throw new Error('n_centro no puede ser menor que el tamaño del grupo.');
      for (const column of ['n_clase', 'n_class', '.n_clase']) {
        if (own(row, column) && cleanText(row[column]) !== null && parseNumber(row[column], column, true, 1, Number.MAX_SAFE_INTEGER) !== size) throw new Error('ID ' + row.ID + ': ' + column + ' no coincide con los ' + size + ' estudiantes del grupo.');
      }
      row['.n_clase'] = size;
      row.n_clase = size;
      for (const column of SCORE_COLUMNS) row[column] = parseNumber(row[column], column, false, 0, 10);
      for (const column of COUNT_COLUMNS) row[column] = parseNumber(row[column], column, true, 0, column === 'bienestar_suma' ? 12 : nominationMaximum);
      // Optional in older calculated workbooks; never infer negative mediation from total nominations.
      row.mediacion_negativa_n = parseNumber(row.mediacion_negativa_n, 'mediacion_negativa_n', true, 0, nominationMaximum);
      for (const type of ['amistad', 'rechazo']) {
        const reciprocal = type === 'amistad' ? row.amistad_reciproca_n : row.rechazo_reciproco_n;
        const declared = type === 'amistad' ? row.amistad_declarada_n : row.rechazo_declarado_n;
        const received = type === 'amistad' ? row.amistad_recibida_n : row.rechazo_recibido_n;
        if (known(reciprocal) && ((known(declared) && reciprocal > declared) || (known(received) && reciprocal > received))) throw new Error('ID ' + row.ID + ': las elecciones correspondidas de ' + type + ' no pueden superar las emitidas ni las recibidas.');
        for (const suffix of ['n', 'aciertos']) {
          const column = 'pred_' + type + '_' + suffix;
          row[column] = parseNumber(row[column], column, true, 0, nominationMaximum);
        }
        if (known(row['pred_' + type + '_aciertos']) && known(row['pred_' + type + '_n']) && row['pred_' + type + '_aciertos'] > row['pred_' + type + '_n']) throw new Error('ID ' + row.ID + ': los aciertos de ' + type + ' superan las predicciones emitidas.');
      }
      row.centralidad_eigenvector = parseNumber(row.centralidad_eigenvector, 'centralidad_eigenvector', false, 0, 1);
      if (Object.prototype.hasOwnProperty.call(row, 'crt_aciertos')) row.crt_aciertos = parseNumber(row.crt_aciertos, 'crt_aciertos', true, 0, 3);
      for (const column of ['felicidad_centro', 'felicidad_diversion', 'felicidad_soledad']) row[column] = parseNumber(row[column], column, true, 0, 4);
      row.felicidad = happiness(row);
      for (const column of ['bullying_autorreporte', 'respondio', 'soledad_frecuente', 'identifica_apoyo']) row[column] = yesNo(row[column], column);
      row.Tratamiento = cleanText(row.Tratamiento) || 'alumno';
      if (!['alumno', 'alumna'].includes(row.Tratamiento)) throw new Error('El campo técnico Tratamiento contiene un valor no admitido. Consulta el diccionario del Excel.');
      row.comunidad_amistad = cleanText(row.comunidad_amistad);
      row.escala_indicadores = cleanText(row.escala_indicadores);
      if (row.escala_indicadores && !['normalizada_v1', 'centro_observado_v1', 'comparativa', 'simulada'].includes(row.escala_indicadores)) throw new Error('escala_indicadores desconocida: ' + row.escala_indicadores + '.');
      validateNormalized(row);
    });
    const studentsById = new Map(students.map(row => [row.ID, row]));
    students.forEach(row => {
      if (!own(row, 'relaciones_red') || row.relaciones_red === null || row.relaciones_red === undefined) {
        row.relaciones_red = null;
        return;
      }
      if (!Array.isArray(row.relaciones_red)) throw new Error('ID ' + row.ID + ': relaciones_red debe ser una lista de vínculos.');
      const targets = new Set();
      row.relaciones_red = row.relaciones_red.map(link => {
        if (!link || typeof link !== 'object' || Array.isArray(link)) throw new Error('ID ' + row.ID + ': vínculo de red no válido.');
        const target = cleanText(link.id), peer = studentsById.get(target);
        if (!peer || peer.Campus !== row.Campus || target === row.ID || targets.has(target)) throw new Error('ID ' + row.ID + ': vínculo de red duplicado, propio o ajeno al centro.');
        if (!['amistad', 'rechazo'].includes(link.tipo) || ![1, 2].includes(link.intensidad)) throw new Error('ID ' + row.ID + ': tipo o intensidad de vínculo no válido.');
        targets.add(target);
        return {id: target, tipo: link.tipo, intensidad: link.intensidad};
      });
      for (const [tipo, field] of [['amistad', 'amistad_declarada_n'], ['rechazo', 'rechazo_declarado_n']]) {
        if (known(row[field]) && row.relaciones_red.filter(link => link.tipo === tipo).length !== row[field]) throw new Error('ID ' + row.ID + ': los vínculos de ' + tipo + ' no coinciden con el recuento declarado.');
      }
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
      if (!['comparativa', 'normalizada_v1', 'centro_observado_v1'].includes(row.escala_grupo)) throw new Error('Grupos: escala_grupo desconocida.');
      if (row.escala_grupo === 'comparativa' && GROUP_SCORE_COLUMNS.some(column => known(row[column])) && row.salones_referencia === null) throw new Error('Grupos: indica salones_referencia para las posiciones comparativas suministradas.');
      if (['normalizada_v1', 'centro_observado_v1'].includes(row.escala_grupo)) {
        const summary = aggregate(students.filter(student => groupKey(student) === key), row);
        // Older calculated files may carry the former >= 1 scale. Recompute this
        // normalized measure from counts under the current recipient criterion.
        const peerScore = summary.attention.find(metric => metric.id === 'bullying_companeros').score;
        if (known(row.pos_bullying_companeros) && row.pos_bullying_companeros !== peerScore) {
          row.pos_bullying_companeros = peerScore;
          const message = 'La escala de acoso por pares se ha recalculado con un mínimo de 2 nominaciones recibidas.';
          if (!warnings.includes(message)) warnings.push(message);
        }
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
   * mediators and negativeMediators count distinct recipients, not nominations.
   * Older calculated sheets without a polarity split show unknown mediation counts.
   * supportYes/supportNo are legacy nullable counts; supportKnown is their denominator.
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
    const normalized = ['normalizada_v1', 'centro_observado_v1'].includes(meta.escala_grupo) || (!meta.escala_grupo && students.every(row => ['normalizada_v1', 'centro_observado_v1'].includes(row.escala_indicadores)));
    const n = students.length, first = students[0];
    const declared = rate(students, 'bullying_autorreporte', value => value === 'Sí', true);
    const peers = rate(students, 'bullying_companeros_n', hasPeerBullyingSignal, false);
    const alone = rate(students, 'soledad_frecuente', value => value === 'Sí', true);
    const noMutual = rate(students, 'amistad_reciproca_n', value => value === 0, false);
    const rejectionRows = students.filter(row => row.respondio !== 'No' && known(row.rechazo_declarado_n));
    const possible = rejectionRows.length * (first.ambito_nominaciones === 'centro' ? first.n_centro - 1 : n - 1);
    const nominations = rejectionRows.length ? rejectionRows.reduce((sum, row) => sum + row.rechazo_declarado_n, 0) : null;
    const rejection = {count: nominations, denominator: possible, percent: possible ? 100 * nominations / possible : null};
    const fraction = value => value.denominator && known(value.count) ? value.count + ' de ' + value.denominator : 'Sin datos';
    const scope = first.ambito_nominaciones === 'centro' ? 'centro' : 'grupo';
    const specs = [
      ['bullying_declarado', 'Acoso escolar: respuesta personal', declared, fraction(declared) + ' estudiantes indican haber sufrido acoso escolar'],
      ['bullying_companeros', 'Acoso escolar: información del ' + scope, peers, fraction(peers) + ' estudiantes reciben al menos 2 nominaciones de personas distintas del ' + scope],
      ['soledad', 'Soledad frecuente', alone, fraction(alone) + ' · Casi siempre o siempre · Última semana'],
      ['densidad_rechazo', 'Densidad de rechazo', rejection, known(nominations) && possible ? nominations + ' nominaciones negativas de ' + possible + ' posibles hacia el ' + scope : 'Sin datos suficientes'],
      ['sin_reciprocas', 'Sin amistades recíprocas', noMutual, fraction(noMutual) + ' no tienen vínculos mutuos registrados en el ' + scope]
    ];
    const attention = specs.map(([id, title, value, description]) => ({id, title, ...value, score: normalized ? (known(value.percent) ? roundScore(value.percent / 10) : null) : (id === 'bullying_companeros' ? null : meta['pos_' + id]), description, coverage: id === 'densidad_rechazo' ? rejectionRows.length : value.denominator}));
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
      attention, communities, mediators: rate(students.filter(row => known(row.mediacion_negativa_n)), 'mediacion_n', value => value > 0, false),
      negativeMediators: rate(students, 'mediacion_negativa_n', value => value > 0, false),
      supportYes: support.count, supportNo: noSupport.count, supportKnown: support.denominator,
      metadata: meta, normalized};
  }
  /** Centre-wide counts use student records, never an average of class percentages.
   * Classroom community labels and modularity are not centre-wide networks.
   */
  function aggregateCenter(students) {
    if (!Array.isArray(students) || !students.length) throw new Error('No hay estudiantes en el centro seleccionado.');
    const center=students[0].Campus || students[0].Centro;
    if (students.some(row=>(row.Campus || row.Centro)!==center)) throw new Error('Selecciona un único centro de enseñanza para ver su ficha.');
    const n=students.length;
    const expectedSizes=[...new Set(students.map(row=>row.n_centro).filter(known))];
    if (expectedSizes.length>1) throw new Error('El tamaño declarado del centro no coincide entre estudiantes.');
    const expected=expectedSizes.length?expectedSizes[0]:null;
    if (expected!==null&&expected<n) throw new Error('El tamaño declarado del centro es menor que los estudiantes disponibles.');
    const normalized=students.every(row=>['normalizada_v1','centro_observado_v1'].includes(row.escala_indicadores));
    const declared=rate(students,'bullying_autorreporte',value=>value==='Sí',true);
    const peers=rate(students,'bullying_companeros_n',hasPeerBullyingSignal,false);
    const alone=rate(students,'soledad_frecuente',value=>value==='Sí',true);
    const noMutual=rate(students,'amistad_reciproca_n',value=>value===0,false);
    const rejectionRows=students.filter(row=>row.respondio!=='No'&&known(row.rechazo_declarado_n));
    const nominations=rejectionRows.length?rejectionRows.reduce((sum,row)=>sum+row.rechazo_declarado_n,0):null;
    const possible=rejectionRows.reduce((sum,row)=>sum+(row.ambito_nominaciones==='centro'?(row.n_centro || n)-1:row['.n_clase']-1),0);
    const rejection={count:nominations,denominator:possible,percent:possible&&known(nominations)?100*nominations/possible:null};
    const fraction=value=>value.denominator&&known(value.count)?`${value.count} de ${value.denominator}`:'Sin datos';
    const specs=[
      ['bullying_declarado','Acoso escolar: respuesta personal',declared,`${fraction(declared)} estudiantes indican haber sufrido acoso escolar`],
      ['bullying_companeros','Acoso escolar: información del centro',peers,`${fraction(peers)} estudiantes reciben al menos 2 nominaciones de personas distintas del centro`],
      ['soledad','Soledad frecuente',alone,`${fraction(alone)} · Casi siempre o siempre · Última semana`],
      ['densidad_rechazo','Densidad de rechazo',rejection,known(nominations)&&possible?`${nominations} nominaciones negativas de ${possible} posibles`:'Sin datos suficientes'],
      ['sin_reciprocas','Sin amistades recíprocas',noMutual,`${fraction(noMutual)} no tienen vínculos mutuos registrados`]
    ];
    const attention=specs.map(([id,title,value,description])=>({id,title,...value,score:normalized&&known(value.percent)?roundScore(value.percent/10):null,description}));
    const centerScoped=students.every(row=>row.ambito_nominaciones==='centro');
    const received=students.map(row=>row.amistad_recibida_n);
    let giniPopularity=null;
    if(centerScoped&&students.every(row=>known(row.amistad_declarada_n))&&received.every(known)){
      const total=received.reduce((sum,value)=>sum+value,0);
      const ordered=[...received].sort((a,b)=>a-b);
      giniPopularity=total?Math.max(0,Math.min(1,2*ordered.reduce((sum,value,index)=>sum+(index+1)*value,0)/(n*total)-(n+1)/n)):0;
    }
    const eigen=students.map(row=>row.centralidad_eigenvector);
    const centralization=centerScoped&&n>2&&eigen.every(known)?Math.max(0,Math.min(1,eigen.reduce((sum,value)=>sum+1-value,0)/(n-2))):null;
    const support=rate(students,'identifica_apoyo',value=>value==='Sí',true);
    const noSupport=rate(students,'identifica_apoyo',value=>value==='No',true);
    return {center,n,expected,coverageComplete:expected===null?null:expected===n,
      classCount:new Set(students.map(row=>JSON.stringify([row.Curso,row.Grupo]))).size,
      responses:students.every(row=>known(row.respondio))?students.filter(row=>row.respondio==='Sí').length:null,
      responsesKnown:students.filter(row=>known(row.respondio)).length,attention,normalized,
      communities:null,separation:null,giniPopularity,centralization,
      mediators:rate(students.filter(row=>known(row.mediacion_negativa_n)),'mediacion_n',value=>value>0,false),
      negativeMediators:rate(students,'mediacion_negativa_n',value=>value>0,false),
      supportYes:support.count,supportNo:noSupport.count,supportKnown:support.denominator};
  }
  /** Convenience filtering for a trusted local operator. These client profiles do
   * not encrypt data and cannot prevent a user with the source files from reading them.
   */
  function normalizeGroup(value) {
    if (typeof value !== 'string') return '';
    const group = value.replace(/\s+/g, ' ').trim().toLocaleUpperCase('es-ES');
    const pdc = group.match(/^PDC\s*(II|I)$/);
    return pdc ? 'PDC ' + pdc[1] : group;
  }
  function scopeRows(students, profile) {
    if (!Array.isArray(students) || !profile || !['tutor', 'orientador'].includes(profile.role)) return [];
    if (profile.role === 'orientador') return students.slice();
    if (typeof profile.course !== 'string' || !profile.course.trim()) return [];
    const hasGroup = profile.group !== null && profile.group !== undefined;
    const group = hasGroup ? normalizeGroup(profile.group) : null;
    if (hasGroup && !group) return [];
    return students.filter(row => row.Curso === profile.course && (!hasGroup || normalizeGroup(row.Grupo) === group));
  }
  /** The caller passes only rows visible to this profile. Never reveal links to
   * students outside that set, even when the raw Wave 1 answer names them.
   */
  function studentNetwork(visibleRows, studentId) {
    const selected = visibleRows.find(row => row.ID === studentId);
    if (!selected) throw new Error('El estudiante no está disponible en esta consulta.');
    const rows = visibleRows.filter(row => row.Campus === selected.Campus);
    const byId = new Map(rows.map(row => [row.ID, row]));
    const available = rows.some(row => Array.isArray(row.relaciones_red));
    const edges = [];
    if (available) for (const row of rows) {
      if (!Array.isArray(row.relaciones_red)) continue;
      for (const link of row.relaciones_red) {
        if (!byId.has(link.id) || (row.ID !== studentId && link.id !== studentId)) continue;
        edges.push({from: row.ID, to: link.id, tipo: link.tipo, intensidad: link.intensidad});
      }
    }
    const ids = new Set(edges.flatMap(edge => [edge.from, edge.to]).filter(id => id !== studentId));
    const neighbors = [...ids].map(id => byId.get(id)).sort((a, b) => (a.Nombre || a.ID).localeCompare(b.Nombre || b.ID, 'es') || a.ID.localeCompare(b.ID));
    return {selected, neighbors, edges, available, outgoingKnown: Array.isArray(selected.relaciones_red),
      respondents: rows.filter(row => Array.isArray(row.relaciones_red)).length, visibleCount: rows.length};
  }
  function compareCourses(a, b) {
    const left = COURSE_ORDER.indexOf(a), right = COURSE_ORDER.indexOf(b);
    if (left >= 0 || right >= 0) return (left < 0 ? COURSE_ORDER.length : left) - (right < 0 ? COURSE_ORDER.length : right);
    return String(a).localeCompare(String(b), 'es', {numeric: true});
  }
  const sortCourses = courses => [...courses].sort(compareCourses);
  function displayName(value) {
    const full = cleanText(value);
    if (!full) return null;
    const parts = full.split(/\s+/);
    if (parts.length === 1) return parts[0];
    const initial = part => Array.from(part)[0].toLocaleUpperCase('es-ES') + '.';
    if (parts.length === 2) return parts[0] + ' ' + initial(parts[1]);
    return parts.slice(0, -2).join(' ') + ' ' + initial(parts.at(-2)) + ' ' + initial(parts.at(-1));
  }
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[character]));
  return Object.freeze({MIN_BULLYING_PEERS, hasPeerBullyingSignal, normalizeGroup, validateAndJoin, aggregate, aggregateCenter, studentNetwork, scopeRows, happiness, displayName, COURSE_ORDER, SCORE_COLUMNS, COUNT_COLUMNS, GROUP_SCORE_COLUMNS, STRUCTURE_COLUMNS, compareCourses, sortCourses, escapeHtml});
}));
