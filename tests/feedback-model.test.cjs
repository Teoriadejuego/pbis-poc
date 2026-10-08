'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const XLSX = require('../vendor/xlsx.full.min.js');
const F = require('../src/feedback-model.js');
const source = relative => fs.readFileSync(path.join(__dirname, '..', relative), 'utf8');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const sample = changes => Object.assign({
  eventId: '115c97de-52e4-4e5a-a57c-297787bbf2f4',
  sessionCode: '7a2d4eca-1d70-43f9-bc70-315c339f3e6d',
  role: 'tutor', sheet: 'group', classCode: 'AULA-abcdef0123456789abcdef01', studentCode: null, rating: 4, comment: 'La ficha es clara.',
  version: '0.9.1', date: '2026-09-29'
}, changes);

function runWorker(request) {
  let result;
  let transferred;
  const context = {crypto: crypto.webcrypto, postMessage: (message, transfer) => {result = message; transferred = transfer;}};
  context.self = context;
  vm.createContext(context);
  // Execute precisely the scripts bundled in the real export worker. There is
  // no disk workbook fixture: inspect its returned XLSX bytes in memory.
  vm.runInContext(source('vendor/xlsx.full.min.js') + '\n' + source('src/feedback-model.js') + '\n' + source('src/feedback-worker.js'), context);
  vm.runInContext('self.onmessage({data:' + JSON.stringify(request) + '})', context);
  assert.ok(result, 'The worker must return a result.');
  return {result, transferred};
}

test('opinion records retain only the explicitly permitted anonymous fields', () => {
  const input = sample();
  const opinion = F.makeOpinion(input);
  assert.deepEqual(opinion, input);
  assert.notEqual(opinion, input);
  assert.deepEqual(Object.keys(opinion).sort(), ['classCode', 'comment', 'date', 'eventId', 'rating', 'role', 'sessionCode', 'sheet', 'studentCode', 'version']);
  input.comment = 'changed after creating';
  assert.equal(opinion.comment, 'La ficha es clara.');
  for (const key of ['username', 'name', 'studentName', 'ID', 'center', 'Centro', 'group', 'course', 'profile', 'data', 'email', '__proto__']) {
    const record = sample();
    Object.defineProperty(record, key, {value: key === 'profile' ? {username: 'tutor4a'} : 'Do not export', enumerable: true});
    assert.throws(() => F.makeOpinion(record), /campos no permitidos/, key);
  }
  const symbolRecord = sample();
  symbolRecord[Symbol('name')] = 'Do not export';
  assert.throws(() => F.makeOpinion(symbolRecord), /campos no permitidos/);
  const getterRecord = sample();
  Object.defineProperty(getterRecord, 'comment', {get() {throw new Error('Getter was invoked');}});
  assert.throws(() => F.makeOpinion(getterRecord), /campos no permitidos/);
});

test('secure identifiers are fresh UUIDv4 values, with a secure fallback and no Math.random path', () => {
  const identifiers = Array.from({length: 1000}, () => F.newId());
  assert.ok(identifiers.every(value => UUID.test(value)));
  assert.equal(new Set(identifiers).size, 1000);
  const context = {crypto: {getRandomValues: bytes => crypto.webcrypto.getRandomValues(bytes)}};
  vm.createContext(context);
  vm.runInContext(source('src/feedback-model.js'), context);
  assert.match(context.PbisFeedbackModel.newId(), UUID);
  assert.notEqual(context.PbisFeedbackModel.newId(), context.PbisFeedbackModel.newId());
  context.crypto = undefined;
  assert.throws(() => context.PbisFeedbackModel.newId(), /código de sesión seguro/);
  assert.doesNotMatch(source('src/feedback-model.js'), /Math\.random/);
});

test('session identifier, role, sheet and rating reject coerced or out of scope values', () => {
  for (const field of ['eventId', 'sessionCode']) {
    for (const value of ['', undefined, null, 'tutor4a', '7a2d4eca-1d70-13f9-bc70-315c339f3e6d']) {
      assert.throws(() => F.makeOpinion(sample({[field]: value})), /código/);
    }
  }
  for (const role of ['admin', 'alumno', 'Tutor', null, undefined]) assert.throws(() => F.makeOpinion(sample({role})), /rol/);
  for (const sheet of ['7.º A', 'student', 'grupo', null, undefined]) assert.throws(() => F.makeOpinion(sample({sheet})), /ficha/);
  for (const rating of [0, 6, -1, 2.5, '5', NaN, Infinity, null, undefined]) assert.throws(() => F.makeOpinion(sample({rating})), /valoración/);
  for (const rating of [1, 2, 3, 4, 5]) assert.equal(F.makeOpinion(sample({rating})).rating, rating);
  assert.equal(F.makeOpinion(sample({role: 'orientador', sheet: 'individual', studentCode: '00012'})).role, 'orientador');
  assert.throws(() => F.makeOpinion(null), /formato/);
  assert.throws(() => F.makeOpinion([]), /formato/);
});

test('class and student keys identify the target without accepting human names or mismatched sheets', () => {
  for (const classCode of ['', null, undefined, 'Centro de Sevilla', 'A'.repeat(81), '=FORMULA()', 'niño']) {
    assert.throws(() => F.makeOpinion(sample({classCode})), /clave de aula/);
  }
  for (const studentCode of ['', null, undefined, 'Ana M.', 'A'.repeat(81), '=FORMULA()', 'niño']) {
    assert.throws(() => F.makeOpinion(sample({sheet: 'individual', studentCode})), /clave de estudiante/);
  }
  assert.throws(() => F.makeOpinion(sample({studentCode: '00012'})), /clave de estudiante/);
  const individual = F.makeOpinion(sample({sheet: 'individual', studentCode: '00012', classCode: 'Aula_7:A-2026'}));
  assert.equal(individual.studentCode, '00012'); assert.equal(individual.classCode, 'Aula_7:A-2026');
});

test('generated class keys are deterministic hashes of the exact context, never its readable names', async () => {
  const context = {center: 'Centro de Córdoba', course: '4.º Primaria', group: 'A'};
  const code = await F.classCode(context);
  assert.match(code, /^AULA-[a-f0-9]{24}$/);
  const expected = 'AULA-' + crypto.createHash('sha256').update(JSON.stringify([context.center, context.course, context.group])).digest('hex').slice(0, 24);
  assert.equal(code, expected); assert.equal(await F.classCode({...context}), code);
  assert.notEqual(await F.classCode({...context, group: 'B'}), code);
  assert.notEqual(await F.classCode({...context, center: 'Centro de Sevilla'}), code);
  assert.equal(await F.classCode({explicitCode: 'AULA-A012'}), 'AULA-A012');
  assert.equal(await F.classCode({...context, explicitCode: 'Nombre no permitido'}), code);
  assert.doesNotMatch(code, /Córdoba|Primaria/);
  await assert.rejects(() => F.classCode({center: '', course: '4.º Primaria', group: 'A'}), /identificar el aula/);
});

test('comments preserve Unicode and intentional text while enforcing the character limit', () => {
  assert.equal(F.makeOpinion(sample({comment: '  Más claridad 👩🏽‍🏫\r\nÚtil para orientación.  '})).comment, 'Más claridad 👩🏽‍🏫\nÚtil para orientación.');
  assert.equal(F.makeOpinion(sample({comment: ''})).comment, '');
  assert.equal(F.makeOpinion(sample({comment: '🙂'.repeat(1500)})).comment, '🙂'.repeat(1500));
  assert.throws(() => F.makeOpinion(sample({comment: '🙂'.repeat(1501)})), /1.500/);
  for (const comment of [null, 4, {}, undefined]) assert.throws(() => F.makeOpinion(sample({comment})), /texto/);
  for (const comment of ['abc\u0000def', '\u000b', '\u007f', '\u0085', '\ud800', '\udc00']) {
    assert.throws(() => F.makeOpinion(sample({comment})), /caracteres/);
  }
});

test('dates are genuine calendar days; defaults disclose no exact time or identity', () => {
  for (const date of ['2026-02-29', '2026-04-31', '2026-13-01', '2026-00-01', '2026-09-00', '2026-9-29', '2026-09-29T12:34:00Z', null, '']) {
    assert.throws(() => F.makeOpinion(sample({date})), /fecha/);
  }
  assert.equal(F.makeOpinion(sample({date: '2024-02-29'})).date, '2024-02-29');
  const input = sample(); delete input.date; delete input.version; delete input.eventId;
  const opinion = F.makeOpinion(input);
  assert.equal(opinion.date, new Date().toISOString().slice(0, 10));
  assert.equal(opinion.version, '0.10.5');
  assert.match(opinion.eventId, UUID);
  for (const version of ['name@example.com', '0.9.1 ' , '', null, 1]) assert.throws(() => F.makeOpinion(sample({version})), /versión/);
});

test('export rows are fresh records with fixed Spanish columns and no added metadata', () => {
  assert.deepEqual(F.toSheetRows([sample()]), [{
    ID_opinion: sample().eventId, Codigo_sesion: sample().sessionCode, Fecha: '2026-09-29',
    Rol: 'Tutoría', Ficha: 'Grupo', Clave_aula: sample().classCode, Clave_estudiante: '', Valoracion: 4, Comentario: 'La ficha es clara.', Version: '0.9.1'
  }]);
  const individual = F.toSheetRows([sample({sheet: 'individual', studentCode: '00012'})])[0];
  assert.equal(individual.Ficha, 'Individual'); assert.equal(individual.Clave_estudiante, '00012');
  assert.deepEqual(F.toSheetRows([]), []);
  assert.throws(() => F.toSheetRows({}), /100/);
  assert.throws(() => F.toSheetRows(Array.from({length: 101}, () => sample())), /100/);
  assert.throws(() => F.toSheetRows([sample({username: 'tutor4a'})]), /campos/);
});

test('real worker XLSX contains only Opinions fields and preserves formula-like comments as strings', () => {
  const comments = ['=HYPERLINK("https://example.com","link")', '+SUM(1,2)', '-1+2', '@SUM(A1:A2)', 'Texto con tildes: Córdoba 🙂\nSegunda línea.'];
  const {result, transferred} = runWorker({opinions: comments.map((comment, i) => sample({comment, rating: i + 1}))});
  assert.ok(!result.error, result.error);
  assert.equal(transferred.length, 1);
  assert.equal(transferred[0], result.buffer);
  assert.equal(Object.prototype.toString.call(result.buffer), '[object ArrayBuffer]');
  const book = XLSX.read(Buffer.from(new Uint8Array(result.buffer)), {type: 'buffer', cellFormula: true, cellHTML: false});
  assert.deepEqual(book.SheetNames, ['Opiniones']);
  const sheet = book.Sheets.Opiniones;
  const rows = XLSX.utils.sheet_to_json(sheet, {header: 1, raw: true});
  assert.deepEqual(rows[0], ['ID_opinion', 'Codigo_sesion', 'Fecha', 'Rol', 'Ficha', 'Clave_aula', 'Clave_estudiante', 'Valoracion', 'Comentario', 'Version']);
  assert.equal(rows.length, 6);
  comments.forEach((comment, i) => {
    const cell = sheet['I' + (i + 2)];
    assert.equal(cell.t, 's'); assert.equal(cell.v, comment);
    assert.ok(!('f' in cell)); assert.ok(!('l' in cell));
    assert.equal(sheet['H' + (i + 2)].t, 'n');
  });
  assert.equal(book.Props.Author, 'PBIS');
  for (const cell of Object.values(sheet)) {
    if (cell && typeof cell === 'object') assert.ok(!Object.prototype.hasOwnProperty.call(cell, 'f'));
  }
});

test('worker rejects oversized, invalid and metadata-bearing export requests', () => {
  for (const request of [
    {opinions: Array.from({length: 101}, () => sample())},
    {opinions: [sample({center: 'Sevilla'})]},
    {opinions: [sample({rating: 0})]},
    {opinions: [sample({date: '2026-02-30'})]},
    {opinions: [sample()], profile: {username: 'tutor4a'}},
    {opinions: 'not an array'}, {}, null
  ]) {
    const {result, transferred} = runWorker(request);
    assert.equal(typeof result.error, 'string');
    assert.equal(result.buffer, undefined);
    assert.equal(transferred, undefined);
  }
  assert.ok(!runWorker({opinions: Array.from({length: 100}, () => sample())}).result.error);
});
