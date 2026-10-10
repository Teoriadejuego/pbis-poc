'use strict';
// Read the delivered books through the very same local SheetJS reader as the app.
// These tests never author, modify or recalculate a workbook.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const XLSX = require('../vendor/xlsx.full.min.js');
const C = require('../src/core.js');
const root = path.resolve(__dirname, '..');
const source = relative => fs.readFileSync(path.join(root, relative), 'utf8').replace(/\r\n?/g,'\n');
const fixtures = JSON.parse(source('data/fixtures.json'));
const readBook = name => XLSX.read(fs.readFileSync(path.join(root, 'outputs/entrega-20260929', name + '_evaluacion.xlsx')), {type: 'buffer', cellFormula: false, cellHTML: false, cellDates: false, sheetRows: 60002});
const dataBook = readBook('datos'), keyBook = readBook('llave');
function rows(book, sheet, raw = true) {
  assert.ok(book.Sheets[sheet], 'Required sheet: ' + sheet);
  const all = XLSX.utils.sheet_to_json(book.Sheets[sheet], {header: 1, defval: null, raw, blankrows: false});
  const headers = all[0].map(value => String(value ?? '').trim());
  return all.slice(1).filter(row => row.some(value => value !== null && value !== '' && value !== undefined)).map(row => {
    const object = Object.create(null);
    headers.forEach((header, i) => {if (header) object[header] = row[i] ?? null;});
    return object;
  });
}
const actual = C.validateAndJoin(rows(dataBook, 'Datos'), rows(keyBook, 'Llave'), rows(dataBook, 'Grupos'));
const expected = C.validateAndJoin(fixtures.students, fixtures.keys, fixtures.groups);
test('delivered Excel pair matches every validated student and group value in the frozen fixtures', () => {
  assert.equal(actual.students.length, 1512); assert.equal(actual.groups.length, 54);
  assert.deepEqual(actual.students, expected.students);
  assert.deepEqual(actual.groups, expected.groups);
  assert.deepEqual(actual.warnings, []);
  assert.ok(actual.students.every(row => /^\d{5}$/.test(row.ID)));
  assert.equal(actual.students[0].ID, '00001');
});
test('raw Excel values preserve structural precision independently of cell presentation', () => {
  const rawGroups = rows(dataBook, 'Grupos'), displayedGroups = rows(dataBook, 'Grupos', false);
  assert.equal(rawGroups[0].gini_popularidad, fixtures.groups[0].gini_popularidad);
  assert.equal(rawGroups[0].centralizacion_eigenvector, fixtures.groups[0].centralizacion_eigenvector);
  assert.ok(rawGroups.some((group, i) => Math.abs(group.gini_popularidad - Number(displayedGroups[i].gini_popularidad)) > 1e-6), 'Formatted values lose precision and must not replace the raw Excel values.');
  // Test the actual worker source with the reader in a separate JS context.
  let message;
  const context = {XLSX, self: {postMessage: value => {message = value;}}};
  vm.createContext(context);
  vm.runInContext(source('src/parser-worker.js'), context, {filename: 'parser-worker.js'});
  const bytes = fs.readFileSync(path.join(root, 'outputs/entrega-20260929/datos_evaluacion.xlsx'));
  context.self.onmessage({data: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)});
  assert.ok(message && !message.error, message?.error);
  const groupSheet = message.sheets.find(sheet => sheet.name === 'Grupos');
  const index = groupSheet.rows[0].indexOf('gini_popularidad');
  assert.equal(groupSheet.rows[1][index], fixtures.groups[0].gini_popularidad, 'Worker must use raw:true; displayed two-decimal structural values invalidate normalized scores.');
});
test('all Excel normalized measures and summaries are internally consistent', () => {
  const round = value => Math.round((value + Number.EPSILON) * 10) / 10;
  const ratio = (a, b) => b ? round(10 * a / b) : null;
  for (const student of actual.students) {
    assert.equal(student.popularidad, ratio(student.amistad_recibida_n, student.n_clase - 1));
    assert.equal(student.sociabilidad, ratio(student.amistad_declarada_n, student.n_clase - 1));
    assert.equal(student.reciprocidad_amistad, ratio(student.amistad_reciproca_n, student.amistad_declarada_n));
    assert.equal(student.acierto_amistad, ratio(student.pred_amistad_aciertos, student.pred_amistad_n));
    assert.equal(student.rechazo_recibido, ratio(student.rechazo_recibido_n, student.n_clase - 1));
    assert.equal(student.rechazo_declarado, ratio(student.rechazo_declarado_n, student.n_clase - 1));
    assert.equal(student.reciprocidad_rechazo, ratio(student.rechazo_reciproco_n, student.rechazo_declarado_n));
    assert.equal(student.acierto_rechazo, ratio(student.pred_rechazo_aciertos, student.pred_rechazo_n));
    assert.equal(student.bienestar, ratio(student.bienestar_suma, 12));
    assert.equal(student.centralidad, round(10 * student.centralidad_eigenvector));
    assert.equal(student.mediacion, ratio(student.mediacion_n, student.n_clase - 1));
  }
  for (const metadata of actual.groups) {
    const students = actual.students.filter(student => student.Campus === metadata.Campus && student.Curso === metadata.Curso && student.Grupo === metadata.Grupo);
    const summary = C.aggregate(students, actual.groups);
    assert.equal(summary.n, 28); assert.equal(summary.responses, 28);
    summary.attention.forEach(metric => assert.equal(metric.score, metadata['pos_' + metric.id]));
    assert.equal(metadata.pos_separacion, round(10 * Math.max(0, metadata.modularidad)));
    assert.equal(metadata.pos_desigualdad, round(10 * metadata.gini_popularidad));
    assert.equal(metadata.pos_centralizacion, round(10 * metadata.centralizacion_eigenvector));
  }
});
test('the active account catalogue matches fixture accounts with unique inclusive usernames', () => {
  const deployed=JSON.parse(source('data/profiles.json'));
  assert.deepEqual(deployed,fixtures.profiles);
  assert.equal(deployed.length,12);
  assert.equal(new Set(deployed.map(p=>p.username)).size,12);
  assert.equal(new Set(deployed.map(p=>p.password)).size,12);
  assert.ok(deployed.every(p=>/^(orientacion|tutoria[1-6](p|eso|bach)(pdci|pdcii)?)$/.test(p.username)));
});
test('delivered source relationships contain no duplicates, self-links or unknown students', () => {
  const relations = rows(dataBook, 'Relaciones');
  assert.equal(relations.length, 19584);
  const students = new Map(actual.students.map(student => [student.ID, student]));
  const seen = new Set();
  for (const relationship of relations) {
    assert.notEqual(relationship.ID_origen, relationship.ID_destino);
    const origin = students.get(relationship.ID_origen), destination = students.get(relationship.ID_destino);
    assert.ok(origin && destination);
    for (const field of ['Campus', 'Curso', 'Grupo']) assert.equal(origin[field], destination[field]);
    const key = JSON.stringify([relationship.ID_origen, relationship.ID_destino, relationship.Tipo]);
    assert.ok(!seen.has(key)); seen.add(key);
  }
});
test('built inline scripts compile and exactly match current sources, including literal replacement tokens', async () => {
  const html = source('release/PBIS.html');
  assert.equal(source('site/PBIS.html'), source('site/DEMO.html'));
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]);
  assert.equal(scripts.length, 10);
  const safeScript = script => script.replace(/<\/script/gi, '<\\/script');
  const parser = source('vendor/xlsx.full.min.js') + '\n' + source('src/parser-worker.js');
  const {feedbackConfig}=await import('../tools/feedback-config.mjs');
  const config = 'window.PBIS_PROFILES=' + source('data/profiles.json') + ';\nwindow.PBIS_PARSER=' + JSON.stringify(parser) + ';\nwindow.PBIS_FEEDBACK=' + JSON.stringify({...feedbackConfig(''),batchOnClose:true}) + ';\nwindow.PBIS_BATCH=' + JSON.stringify(feedbackConfig(process.env.PBIS_BATCH_ENDPOINT||'https://formspree.io/f/mvkgydrn')) + ';\nwindow.PBIS_FEEDBACK_WORKER=' + JSON.stringify('') + ';';
  const {completeDemo}=await import('../tools/demo-fixture.mjs');
  const demoConfig='window.PBIS_DEMO_DATA='+JSON.stringify(completeDemo(root,JSON.parse(source('data/fixtures.json'))))+';';
  const expectedScripts = ["window.PBIS_HOME='index.html';\nwindow.PBIS_DEMO_ACCOUNT="+source('data/demo-account.json')+";\n"+config,demoConfig, source('src/core.js'), source('src/raw-wave1.js'), source('src/student-network.js'), source('src/roster-review.js'), source('src/review-batch.js'), source('src/feedback-model.js'), source('src/feedback.js'), source('src/app.js')].map(safeScript);
  for (let i = 0; i < scripts.length; i++) {
    assert.equal(scripts[i], expectedScripts[i], 'Source differs in script ' + i + '. Build replacements must use a function so $& and $\' inside source remain literal.');
    assert.doesNotThrow(() => new vm.Script(scripts[i], {filename: 'PBIS-inline-' + i + '.js'}));
  }
  const css = html.match(/<style>([\s\S]*?)<\/style>/);
  assert.ok(css); assert.equal(css[1], source('src/app.css') + '\n' + source('src/feedback.css'));
});
test('built Content Security Policy hashes match script bytes and restrict connections to feedback', () => {
  const html = source('release/PBIS.html');
  const policy = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"\s*\/?\s*>/);
  assert.ok(policy);
  const hashes = [...policy[1].matchAll(/'sha256-([^']+)'/g)].map(match => match[1]);
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]);
  assert.deepEqual(hashes, scripts.map(script => crypto.createHash('sha256').update(script).digest('base64')));
  assert.ok(policy[1].includes('connect-src '+(process.env.PBIS_BATCH_ENDPOINT || 'https://formspree.io/f/mvkgydrn'))); assert.match(policy[1], /form-action 'none'/);
  assert.doesNotMatch(policy[1], /unsafe-eval|script-src[^;]*unsafe-inline/);
  assert.doesNotMatch(html, /<script[^>]+src=/i);
});
