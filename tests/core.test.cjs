'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../src/core.js');
function fixture(n = 4) {
  const students = Array.from({length: n}, (_, i) => ({ID: String(i + 1).padStart(4, '0'), Campus: 'Sevilla', Curso: '4.º Primaria', Grupo: 'A',
    ...Object.fromEntries(core.SCORE_COLUMNS.map(key => [key, null])),
    ...Object.fromEntries(core.COUNT_COLUMNS.map(key => [key, null])),
    bullying_autorreporte: null, respondio: null, soledad_frecuente: null, identifica_apoyo: null, comunidad_amistad: null}));
  return {students, keys: students.map(row => ({ID: row.ID, Nombre: 'Nombre ' + row.ID}))};
}
const join = f => core.validateAndJoin(f.students, f.keys, f.groups || []);

test('optional classroom codes remain text, unique and compatible with existing books', () => {
  const f=fixture();f.students[2].Grupo='B';f.students[3].Grupo='B';
  f.groups=['A','B'].map((group,i)=>({Campus:'Sevilla',Curso:'4.º Primaria',Grupo:group,ID_aula:'00'+i}));
  assert.deepEqual(join(f).groups.map(g=>g.ID_aula),['000','001']);
  f.groups[1].ID_aula='000';assert.throws(()=>join(f),/ID_aula debe ser único/);
  f.groups[1].ID_aula=1;assert.throws(()=>join(f),/ID_aula debe ser una clave de texto/);
  f.groups.forEach(g=>delete g.ID_aula);assert.equal(join(f).groups.length,2);
});
test('IDs preserve leading zeroes and homonyms remain separate, without mutating inputs', () => {
  const f = fixture(); f.keys.forEach(row => row.Nombre = 'Ana M.');
  const original = structuredClone(f); const result = join(f);
  assert.deepEqual(f, original); assert.equal(result.students[0].ID, '0001');
  assert.equal(result.students.length, 4); assert.equal(new Set(result.students.map(row => row.ID)).size, 4);
  assert.equal(result.students[0].Nombre, 'Ana M.'); assert.equal(result.students[0]['.n_clase'], 4);
});
test('accepts Centro as alias, rejects contradictions and empty group declarations', () => {
  const f = fixture(); f.students.forEach(row => {row.Centro = row.Campus; delete row.Campus;});
  assert.equal(join(f).students[0].Campus, 'Sevilla');
  f.students[0].Campus = 'Córdoba'; assert.throws(() => join(f), /Campus y Centro/);
  delete f.students[0].Campus; f.students[0].Curso = ''; assert.throws(() => join(f), /Centro, Curso o Grupo/);
});
test('requires mandatory headers and exact unique IDs in both directions', () => {
  let f = fixture(); f.students.forEach(row => delete row.popularidad); assert.throws(() => join(f), /faltan columnas: popularidad/);
  f = fixture(); f.students[1].ID = f.students[0].ID; assert.throws(() => join(f), /IDs duplicados/);
  f = fixture(); f.keys[1].ID = f.keys[0].ID; assert.throws(() => join(f), /IDs duplicados/);
  f = fixture(); f.keys.pop(); assert.throws(() => join(f), /sin correspondencia/);
  f = fixture(); f.keys.push({ID: 'extra', Nombre: 'Otra'}); assert.throws(() => join(f), /no aparecen/);
  f = fixture(); f.students[0].ID = ' '; assert.throws(() => join(f), /IDs vacíos/);
});
test('strict finite numeric parsing accepts decimal commas and leaves blank counts unknown', () => {
  const f = fixture(); f.students[0].popularidad = '5,9'; f.students[0].amistad_recibida_n = '';
  assert.equal(join(f).students[0].popularidad, 5.9); assert.equal(join(f).students[0].amistad_recibida_n, null);
  for (const value of ['Infinity', 'NaN', '0x10', '3m', '1,2,3', Infinity, {}, false]) {
    f.students[0].popularidad = value; assert.throws(() => join(f));
  }
});
test('scores, counts, class size, reciprocity and predictions respect bounds', () => {
  for (const [column, value] of [['popularidad', 11], ['popularidad', -1], ['amistad_recibida_n', 4], ['bienestar_suma', 13], ['mediacion_n', 1.5], ['n_clase', 28], ['centralidad_eigenvector', 1.2]]) {
    const f = fixture(); f.students[0][column] = value; assert.throws(() => join(f), new RegExp(column));
  }
  const f = fixture(); Object.assign(f.students[0], {amistad_reciproca_n: 2, amistad_declarada_n: 1, amistad_recibida_n: 3});
  assert.throws(() => join(f), /correspondidas/);
  f.students[0].amistad_reciproca_n = 1; Object.assign(f.students[0], {pred_amistad_n: 1, pred_amistad_aciertos: 2});
  assert.throws(() => join(f), /superan las predicciones/);
});
test('normalized scores are grounded in their numerator and denominator', () => {
  const f = fixture(); Object.assign(f.students[0], {escala_indicadores: 'normalizada_v1', amistad_recibida_n: 2, popularidad: 6.7,
    amistad_declarada_n: 2, amistad_reciproca_n: 1, reciprocidad_amistad: 5, pred_amistad_n: 2, pred_amistad_aciertos: 1, acierto_amistad: 5,
    bienestar_suma: 9, bienestar: 7.5, centralidad_eigenvector: .85, centralidad: 8.5});
  assert.equal(join(f).students[0].popularidad, 6.7);
  f.students[0].popularidad = 6.65; assert.throws(() => join(f), /popularidad no coincide/);
  f.students[0].popularidad = 9; assert.throws(() => join(f), /popularidad no coincide/);
  f.students[0].popularidad = 6.7; f.students[0].pred_amistad_n = 0; f.students[0].pred_amistad_aciertos = 0;
  assert.throws(() => join(f), /acierto_amistad no coincide/);
  f.students[0].acierto_amistad = null; assert.doesNotThrow(() => join(f));
});
test('legacy arbitrary reference positions remain readable without pretending they are normalized', () => {
  const f = fixture(); Object.assign(f.students[0], {Curso: '7.º', popularidad: 8, amistad_recibida_n: 0});
  assert.equal(join(f).students[0].popularidad, 8);
});
test('missing and nonresponding self-reports are excluded, peer nominees counted distinctly', () => {
  const f = fixture();
  Object.assign(f.students[0], {respondio: 'Sí', bullying_autorreporte: 'Sí', soledad_frecuente: 'No', bullying_companeros_n: 3, rechazo_declarado_n: 2, identifica_apoyo: 'Sí', amistad_reciproca_n: 0, mediacion_n: 3, mediacion_negativa_n: 0});
  Object.assign(f.students[1], {respondio: 'No', bullying_autorreporte: 'Sí', soledad_frecuente: 'Sí', bullying_companeros_n: 1, rechazo_declarado_n: 0, identifica_apoyo: 'No', amistad_reciproca_n: 0, mediacion_n: 1, mediacion_negativa_n: 1});
  Object.assign(f.students[2], {respondio: 'Sí', bullying_autorreporte: null, bullying_companeros_n: 0, rechazo_declarado_n: null, identifica_apoyo: 'No', mediacion_n: 0, mediacion_negativa_n: 0});
  Object.assign(f.students[3], {respondio: null, bullying_autorreporte: 'No', bullying_companeros_n: null, rechazo_declarado_n: 1});
  const result = core.aggregate(join(f).students); const metric = id => result.attention.find(row => row.id === id);
  assert.deepEqual([metric('bullying_declarado').count, metric('bullying_declarado').denominator, metric('bullying_declarado').percent], [1, 2, 50]);
  assert.deepEqual([metric('bullying_companeros').count, metric('bullying_companeros').denominator], [1, 3]);
  assert.equal(metric('soledad').percent, 0); assert.equal(result.responses, null); assert.equal(result.responsesKnown, 3);
  assert.deepEqual([metric('densidad_rechazo').count, metric('densidad_rechazo').denominator, metric('densidad_rechazo').percent], [3, 6, 50]);
  assert.deepEqual([result.supportYes, result.supportNo, result.supportKnown], [1, 1, 2]);
  assert.deepEqual([result.mediators.count, result.mediators.denominator], [2, 3]);
  assert.deepEqual([result.negativeMediators.count, result.negativeMediators.denominator], [1, 3]); assert.equal(result.communities, null);
});
test('all missing means Sin datos, zero valid numerator remains zero and size one has no density', () => {
  const f = fixture(1); const result = core.aggregate(join(f).students);
  assert.equal(result.attention[0].count, null); assert.equal(result.attention[0].percent, null);
  assert.equal(result.attention[3].percent, null); assert.equal(result.supportYes, null); assert.equal(result.supportKnown, 0);
  f.students[0].respondio = 'Sí'; f.students[0].rechazo_declarado_n = 0;
  assert.equal(core.aggregate(join(f).students).attention[3].percent, null);
});
test('centre aggregates recalculate across classes without averaging class rates or merging class community labels', () => {
  const f=fixture();f.students[2].Grupo='B';f.students[3].Grupo='B';
  f.students.forEach((row,i)=>Object.assign(row,{ambito_nominaciones:'centro',n_centro:4,respondio:'Sí',
    bullying_autorreporte:i===0?'Sí':'No',bullying_companeros_n:[3,0,2,0][i],
    soledad_frecuente:i===2?'Sí':'No',amistad_reciproca_n:0,
    amistad_declarada_n:1,amistad_recibida_n:[3,1,0,0][i],rechazo_declarado_n:[1,2,0,1][i],
    identifica_apoyo:i<3?'Sí':'No',mediacion_n:i===1?2:0,
    centralidad_eigenvector:[1,.8,.7,.5][i],comunidad_amistad:i%2?'Red 2':'Red 1'}));
  const students=join(f).students,center=core.aggregateCenter(students);
  const metric=id=>center.attention.find(row=>row.id===id);
  assert.equal(center.n,4);assert.equal(center.classCount,2);assert.equal(center.coverageComplete,true);
  assert.deepEqual([metric('bullying_declarado').count,metric('bullying_companeros').count,metric('soledad').count,metric('sin_reciprocas').count],[1,2,1,4]);
  assert.deepEqual([metric('densidad_rechazo').count,metric('densidad_rechazo').denominator],[4,12]);
  assert.equal(center.giniPopularity,.625);assert.equal(center.centralization,.5);
  assert.equal(center.communities,null);assert.equal(center.separation,null);
  assert.deepEqual([center.supportYes,center.supportNo,center.supportKnown],[3,1,4]);
  assert.throws(()=>core.aggregateCenter([...students,{...students[0],Campus:'Córdoba'}]),/único centro/);
});
test('centre density retains each class denominator for legacy class-only nominations', () => {
  const f=fixture();f.students[2].Grupo='B';f.students[3].Grupo='B';
  f.students.forEach((row,i)=>Object.assign(row,{respondio:'Sí',rechazo_declarado_n:i%2,comunidad_amistad:'Red 1'}));
  const center=core.aggregateCenter(join(f).students);
  const rejection=center.attention.find(row=>row.id==='densidad_rechazo');
  assert.deepEqual([rejection.count,rejection.denominator],[2,4]);
  assert.equal(center.giniPopularity,null);assert.equal(center.coverageComplete,null);
});
test('centre card marks a partial file when the declared centre is larger', () => {
  const f=fixture();f.students.forEach(row=>{row.ambito_nominaciones='centro';row.n_centro=6;});
  const center=core.aggregateCenter(join(f).students);
  assert.deepEqual([center.n,center.expected,center.coverageComplete],[4,6,false]);
});
test('communities sum to students and group metadata cannot cross groups', () => {
  const f = fixture(); f.students.forEach((row, i) => row.comunidad_amistad = i < 3 ? 'G1' : 'G2');
  const students = join(f).students;
  assert.deepEqual(core.aggregate(students).communities, [{name: 'G1', count: 3}, {name: 'G2', count: 1}]);
  assert.equal(core.aggregate(students, {Campus: 'Otro', Curso: '4.º Primaria', Grupo: 'A', Periodo: 'Privado'}).period, null);
  assert.throws(() => core.aggregate([...students, {...students[0], Grupo: 'B'}]), /único centro/);
});
test('validates optional group metadata duplicates, references and normalized scores', () => {
  const f = fixture(); f.groups = [{Campus: 'Sevilla', Curso: '4.º Primaria', Grupo: 'A', pos_soledad: 5}];
  assert.throws(() => join(f), /salones_referencia/);
  f.groups[0].salones_referencia = 48; assert.equal(join(f).groups[0].pos_soledad, 5);
  f.groups.push({...f.groups[0]}); assert.throws(() => join(f), /grupos duplicados/); f.groups.pop();
  f.groups[0].Grupo = 'Z'; assert.throws(() => join(f), /sin estudiantes/); f.groups[0].Grupo = 'A';
  f.groups[0].escala_grupo = 'normalizada_v1'; f.students.forEach(row => row.soledad_frecuente = 'No');
  assert.throws(() => join(f), /pos_soledad no coincide/); f.groups[0].pos_soledad = 0; assert.doesNotThrow(() => join(f));
});
test('tutor scope follows the course across centers and groups; orientation sees all', () => {
  const original = join(fixture()).students;
  const students = [...original, {...original[0], ID: 'otro-centro', Campus: 'Córdoba', Grupo: 'B'}, {...original[0], ID: 'otro-curso', Curso: '1.º ESO'}];
  const scope = {role: 'tutor', center: 'Sevilla', course: '4.º Primaria', group: 'A'};
  assert.equal(core.scopeRows(students, scope).length, 4);
  assert.equal(core.scopeRows(students, {...scope, center: null, group: null}).length, 5);
  assert.equal(core.scopeRows(students, {...scope, course: null}).length, 0);
  assert.equal(core.scopeRows(students, {...scope, course: ''}).length, 0);
  assert.equal(core.scopeRows(students, {role: 'orientador', center: '', course: '4.º Primaria'}).length, 6);
  assert.equal(core.scopeRows(students, {role: 'administrador'}).length, 0);
  assert.equal(core.scopeRows(students, null).length, 0);
});
test('malicious cell text remains data and unsafe object keys are refused', () => {
  const f = fixture(); const payload = '<img src=x onerror="alert(1)">'; f.keys[0].Nombre = payload;
  assert.equal(join(f).students[0].Nombre, payload); assert.equal(core.escapeHtml(payload), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  assert.equal(core.escapeHtml('&\'<>'), '&amp;&#39;&lt;&gt;');
  f.students[0] = JSON.parse(JSON.stringify(f.students[0]).replace(/}$/, ',"__proto__":{"polluted":true}}'));
  assert.throws(() => join(f), /encabezado no permitido/); assert.equal({}.polluted, undefined);
});
test('course helper orders all nine courses without breaking legacy labels', () => {
  assert.equal(core.COURSE_ORDER.length, 9);
  assert.deepEqual(core.sortCourses(['2.º Bachillerato', '4.º Primaria', '1.º ESO', '7.º']), ['4.º Primaria', '1.º ESO', '2.º Bachillerato', '7.º']);
});
test('the complete product fixtures cover nine courses, A/B/C, two centers and inclusive course/PDC profiles', () => {
  const fs = require('node:fs'), path = require('node:path');
  const file = path.join(__dirname, '..', 'data', 'fixtures.json');
  if (!fs.existsSync(file)) return; // Core can also be tested as a standalone module.
  const fixture = JSON.parse(fs.readFileSync(file, 'utf8'));
  const result = core.validateAndJoin(fixture.students, fixture.keys, fixture.groups);
  assert.equal(result.students.length, 1512); assert.equal(result.groups.length, 54); assert.deepEqual(result.warnings, []);
  assert.deepEqual(core.sortCourses([...new Set(result.students.map(row => row.Curso))]), [...core.COURSE_ORDER]);
  assert.deepEqual([...new Set(result.students.map(row => row.Grupo))].sort(), ['A', 'B', 'C']);
  assert.equal(new Set(result.students.map(row => row.Campus)).size, 2);
  for (const metadata of result.groups) {
    const students = result.students.filter(row => row.Campus === metadata.Campus && row.Curso === metadata.Curso && row.Grupo === metadata.Grupo);
    const group = core.aggregate(students, result.groups);
    assert.equal(group.n, 28); assert.equal(group.responses, 28); assert.equal(group.supportKnown, 28);
    assert.equal(group.communities.reduce((sum, item) => sum + item.count, 0), 28);
    for (const attention of group.attention) assert.equal(attention.score, metadata['pos_' + attention.id]);
    for (const first of students) for (const second of students) {
      if (first.amistad_recibida_n > second.amistad_recibida_n) assert.ok(first.popularidad > second.popularidad, 'More received nominations means higher popularity in the same classroom.');
    }
  }
  assert.equal(fixture.profiles.length, 12);
  assert.equal(new Set(fixture.profiles.map(profile=>profile.password)).size, 12);
  assert.ok(fixture.profiles.every(profile=>/^(?=.*[A-Z])(?=.*[0-9])[A-Z0-9]{6}$/.test(profile.password)));
  for (const profile of fixture.profiles) {
    const selected = core.scopeRows(result.students, profile);
    assert.equal(selected.length, profile.role === 'tutor' ? (profile.group ? 0 : 168) : 1512);
    if(profile.role==='tutor'&&!profile.group)assert.equal(new Set(selected.map(row=>row.Campus)).size,2);
  }
});

test('embedded names are read without a second file and do not change indicators',()=>{
 const f=fixture();f.students.forEach(s=>s.Nombre='DO_NOT_DISPLAY');
 const before=structuredClone(f);const unnamed=core.validateAndJoin(f.students,null,[]),named=join(f);
 assert.deepEqual(f,before);
 assert.equal(unnamed.students[0].ID,'0001');assert.ok(unnamed.students.every(s=>s.Nombre==='DO_NOT_DISPLAY'));
 for(let i=0;i<named.students.length;i++){const a={...named.students[i]},b={...unnamed.students[i]};delete a.Nombre;delete b.Nombre;assert.deepEqual(a,b);}
 assert.deepEqual(core.aggregate(unnamed.students),core.aggregate(named.students));
 const pair=fixture();pair.students[0].Nombre='María José';pair.students[0].Apellidos='García López';
 assert.equal(core.validateAndJoin(pair.students,null,[]).students[0].Nombre,'María José García López');
 assert.equal(core.validateAndJoin(fixture().students,null,[]).students[0].Nombre,null);
 assert.throws(()=>core.validateAndJoin(f.students,[],[]));
 const incomplete=f.keys.slice(1);assert.throws(()=>core.validateAndJoin(f.students,incomplete,[]),/sin correspondencia/);
});

test('display names keep given names and show only surname initials',()=>{
 assert.equal(core.displayName('Pablo Rojas Martín'),'Pablo R. M.');
 assert.equal(core.displayName('María José García López'),'María José G. L.');
 assert.equal(core.displayName('Ana M.'),'Ana M.');
 assert.equal(core.displayName('Lucía García'),'Lucía G.');
 assert.equal(core.displayName(null),null);
});

test('summary threshold is two or more, preserving every individual count and denominator',()=>{
 const f=fixture(5),values=[0,1,2,3,null];
 f.students.forEach((r,i)=>Object.assign(r,{bullying_companeros_n:values[i],respondio:'Sí',bullying_autorreporte:i===1?'Sí':'No'}));
 const joined=join(f);
 for(const result of [core.aggregate(joined.students),core.aggregateCenter(joined.students)]){
  const peer=result.attention.find(m=>m.id==='bullying_companeros');
  assert.deepEqual([peer.count,peer.denominator,peer.percent],[2,4,50]);
  assert.equal(result.attention.find(m=>m.id==='bullying_declarado').count,1);
  assert.match(peer.description,/al menos 2 nominaciones/);
 }
 assert.deepEqual(joined.students.map(r=>r.bullying_companeros_n),values);
 assert.deepEqual(values.map(core.hasPeerBullyingSignal),[false,false,true,true,false]);
});

test('old normalized peer scale is refreshed while unsupported comparative positions are not reused',()=>{
 const f=fixture(4);f.students.forEach((r,i)=>r.bullying_companeros_n=[1,2,3,0][i]);
 f.groups=[{Campus:f.students[0].Campus,Curso:f.students[0].Curso,Grupo:f.students[0].Grupo,escala_grupo:'normalizada_v1',pos_bullying_companeros:7.5}];
 const joined=join(f),group=core.aggregate(joined.students,joined.groups);
 assert.equal(joined.groups[0].pos_bullying_companeros,5);
 assert.equal(group.attention.find(m=>m.id==='bullying_companeros').score,5);
 assert.ok(joined.warnings.some(w=>w.includes('mínimo de 2')));
 const comparative=core.aggregate(joined.students,{...joined.groups[0],escala_grupo:'comparativa',pos_bullying_companeros:7.5,salones_referencia:10});
 assert.equal(comparative.attention.find(m=>m.id==='bullying_companeros').score,null);
});

test('PDC accounts recognize spacing and case, require the assigned course, and stay distinct',()=>{
 const rows=[['3.º ESO','PDCI'],['3.º ESO',' PDC I '],['3.º ESO','pdc i'],['3.º ESO','A'],['3.º ESO','PDC II'],['4.º ESO','PDC II'],['4.º ESO','PDCII'],['4.º ESO','PDCI']].map(([Curso,Grupo],i)=>({ID:String(i),Curso,Grupo,Campus:i%2?'Centro 8001':'Centro 8002'}));
 const account={role:'tutor',course:'3.º ESO',group:'PDC I',center:null};
 assert.deepEqual(core.scopeRows(rows,account).map(r=>r.ID),['0','1','2']);
 assert.deepEqual(core.scopeRows(rows,{...account,course:'4.º ESO',group:'PDC II'}).map(r=>r.ID),['5','6']);
 assert.equal(core.scopeRows(rows,{...account,group:null}).length,5);
 assert.equal(core.scopeRows(rows,{...account,group:' '}).length,0);
 assert.equal(core.scopeRows(rows,{...account,group:123}).length,0);
 assert.equal(core.scopeRows(rows,{role:'orientador'}).length,8);
});
