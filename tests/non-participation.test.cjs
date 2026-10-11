'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const review=require('../src/roster-review.js'),batch=require('../src/review-batch.js');
const envelope={eventId:'event-1',username:'tutoria1eso',role:'tutor',sessionCode:'session-1',date:'2026-10-11T10:00:00Z'};
const entry={classCode:'AULA-1',studentCode:'EST-1',confidence:null,reactions:{}};

test('non-participation requires explicit No, not absent indicators or a partial survey',()=>{
  assert.equal(review.isNonRespondent({respondio:'No',amistad_recibida_n:5}),true);
  for(const row of [{respondio:'Sí'},{respondio:null},{},{bienestar_suma:null},null])assert.equal(review.isNonRespondent(row),false);
});

test('reasons replace confidence, survive reactions and sorting, and do not mutate source data',()=>{
  const store=review.createStore(),rows=[{ID:'001',Nombre:'Bea',respondio:'No'},{ID:'002',Nombre:'Ana',respondio:'Sí'}];
  const original=structuredClone(rows);
  store.setConfidence('001',2);
  store.setNonParticipation('001','absent_day');
  assert.equal(store.get('001').confidence,null);
  assert.throws(()=>store.setConfidence('001',1),/sustituye/);
  store.toggle('001','friendship_in','sorpresa');
  assert.equal(store.get('001').nonParticipation.reason,'absent_day');
  assert.deepEqual(review.sortRows(rows,{key:'student',direction:'asc'},store).map(row=>row.ID),['002','001']);
  assert.equal(store.snapshot()[0].studentId,'001');
  assert.deepEqual(rows,original);
  store.toggle('001','friendship_in','sorpresa');
  assert.equal(store.snapshot().length,1,'A reason alone must keep the review record');
});

test('Other text is a draft until completed, removed when changing reason, and cleared with the session',()=>{
  const store=review.createStore();
  store.setNonParticipation('001','other','Pendiente de completar la encuesta');
  const snapshot=store.snapshot(),copy=store.get('001');
  snapshot[0].nonParticipation.detail='edited';copy.nonParticipation.detail='edited';
  assert.equal(store.get('001').nonParticipation.detail,'Pendiente de completar la encuesta');
  store.setNonParticipation('001','extended_absence');
  assert.deepEqual(store.get('001').nonParticipation,{reason:'extended_absence',detail:''});
  store.setNonParticipation('001',null);assert.deepEqual(store.snapshot(),[]);
  store.setNonParticipation('001','other');assert.equal(store.get('001').nonParticipation.detail,'');
  store.clear();assert.deepEqual(store.snapshot(),[]);
  for(const args of [['001','unknown'],['001','other',null],['001','other','x'.repeat(301)]])assert.throws(()=>store.setNonParticipation(...args));
});

test('each reason is included in the existing coded feedback summary without confidence',()=>{
  for(const [reason,label] of Object.entries(review.nonParticipationReasons)){
    const nonParticipation={reason,detail:reason==='other'?'Pendiente de completar':''};
    const result=batch.create({...envelope,roster:[{...entry,nonParticipation}]});
    assert.ok(result.message.includes('Motivo de no participación: '+label));
    assert.match(result.message,/AULA-1 \| EST-1/);
    assert.doesNotMatch(result.message,/Confianza:/);
    assert.equal(result.rosterCount,'1');
    if(reason==='other')assert.match(result.message,/Pendiente de completar/);
  }
});

test('incomplete, unknown or contradictory reasons cannot be sent',()=>{
  for(const [nonParticipation,confidence] of [
    [{reason:'other',detail:''},null],[{reason:'other',detail:'  \n '},null],
    [{reason:'other',detail:'x'.repeat(301)},null],[{reason:'unknown',detail:''},null],
    [{reason:'absent_day',detail:'Stale other text'},null],[{reason:'absent_day',detail:''},1]
  ])assert.throws(()=>batch.create({...envelope,roster:[{...entry,nonParticipation,confidence}]}));
});
