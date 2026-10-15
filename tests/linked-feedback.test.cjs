'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const L=require('../src/linked-feedback.js');
const target={center:'Centro 3705',course:'1.º ESO',group:'A',studentId:'00012',period:'Octubre 2026'};
const options=()=>({eventId:'batch-1',username:'tutoria1eso',role:'tutor',sessionCode:'session-1',version:'0.10.14',date:'2026-10-15T10:00:00.000Z',source:{sha256:'a'.repeat(64),sheet:'Users'},roster:[],opinions:[]});
const sample=()=>({...options(),roster:[{target,values:{Nombre:'NAME_NOT_TO_SEND',password:'SECRET_NOT_TO_SEND',respondio:'Sí',amistad_recibida_n:16,bullying_companeros_n:0,felicidad:7.5},reactions:{friendship_in:'sorpresa',bullying_peers:'ok'},confidence:0}]});
test('linked records preserve join keys, zero and account; whitelist only the observed indicators',()=>{
  const packet=L.create(sample()),envelope=JSON.parse(packet.feedback_json),r=envelope.records;
  assert.equal(r.length,3);assert.equal(new Set(r.map(x=>x.recordId)).size,3);
  assert.ok(r.every(x=>x.studentId==='00012'&&x.center==='Centro 3705'&&x.username==='tutoria1eso'&&x.sourceSheet==='Users'));
  assert.equal(r.find(x=>x.indicator==='bullying_peers').observedValue,0);
  assert.equal(r.find(x=>x.indicator==='friendship_in').observedValue,16);
  assert.equal(r.find(x=>x.indicator==='friendship_in').reaction,'surprised');
  assert.equal(r.find(x=>x.feedbackType==='student_confidence').confidence,0);
  assert.doesNotMatch(JSON.stringify(packet),/NAME_NOT_TO_SEND|SECRET_NOT_TO_SEND|7\.5/);
  assert.match(packet.message,/Centro 3705 · 1.º ESO · A · Estudiante ID 00012/);
  assert.deepEqual(L.create(sample()),packet);
});
test('same student code in two centers remains distinguishable, plus class opinions without a student',()=>{
  const input=sample();input.roster.push({...input.roster[0],target:{...target,center:'Centro 3884'}});
  input.opinions.push({eventId:'opinion-1',target:{...target,studentId:null},sheet:'group',rating:4,comment:'Más claridad'});
  const r=JSON.parse(L.create(input).feedback_json).records;
  assert.equal(r.filter(x=>x.center==='Centro 3884').length,3);
  const opinion=r.find(x=>x.feedbackType==='interface_opinion');assert.equal(opinion.studentId,null);assert.equal(opinion.rating,4);assert.equal(opinion.reaction,null);
  assert.equal(opinion.observedValue,null);assert.equal(opinion.opinionId,'opinion-1');
});
test('non-response, zero and missing stay separate; nonrespondents still receive mentions',()=>{
  const input=sample();input.roster[0]={target,values:{respondio:'No',bullying_autorreporte:'No',bullying_companeros_n:2,felicidad:null},reactions:{bullying_self:'mal',happiness:'sorpresa',bullying_peers:'ok'},confidence:null,nonParticipation:{reason:'absent_day',detail:''}};
  const rows=JSON.parse(L.create(input).feedback_json).records;
  assert.equal(rows.find(r=>r.indicator==='bullying_self').observedValue,null);
  assert.equal(rows.find(r=>r.indicator==='happiness').valueStatus,'not_answered');
  assert.equal(rows.find(r=>r.indicator==='bullying_peers').observedValue,2);
  assert.equal(rows.find(r=>r.indicator==='bullying_peers').valueStatus,'observed');
  assert.equal(rows.find(r=>r.feedbackType==='non_participation').nonParticipationReason,'absent_day');
  input.roster[0].nonParticipation={reason:'other',detail:''};assert.throws(()=>L.create(input),/motivo/);
});
test('fingerprints identify exact bytes regardless of filename; malformed sources and reactions fail closed',async()=>{
  const a=new TextEncoder().encode('synthetic spreadsheet bytes');
  assert.equal(await L.fingerprint(a),await L.fingerprint(a));
  assert.notEqual(await L.fingerprint(a),await L.fingerprint(new TextEncoder().encode('changed')));
  let input=sample();input.source.sha256='';assert.throws(()=>L.create(input),/archivo de origen/);
  input=sample();input.roster[0].reactions.friendship_in='bad';assert.throws(()=>L.create(input),/Reacción/);
  input=sample();input.roster[0].reactions.extra='ok';assert.throws(()=>L.create(input),/Indicador/);
  input=sample();input.roster[0].confidence=NaN;assert.throws(()=>L.create(input),/Confianza/);
  input=sample();input.roster.push(input.roster[0]);assert.throws(()=>L.create(input),/duplicado/);
});
