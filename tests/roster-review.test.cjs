'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const review=require('../src/roster-review.js');
const batch=require('../src/review-batch.js');

test('class list sorts each indicator in both directions and keeps reactions on student IDs',()=>{
  const rows=[
    {ID:'001',Nombre:'Ana',respondio:'Sí',amistad_recibida_n:4,felicidad:8},
    {ID:'002',Nombre:'Bea',respondio:'Sí',amistad_recibida_n:16,felicidad:3},
    {ID:'003',Nombre:'Celia',respondio:'No',amistad_recibida_n:null,felicidad:null}
  ];
  const store=review.createStore();
  store.toggle('002','friendship_in','mal');
  store.setConfidence('002',-2.5);
  let sort=review.nextSort({key:'student',direction:'asc'},'friendship_in');
  assert.deepEqual(review.sortRows(rows,sort,store).map(row=>row.ID),['002','001','003']);
  sort=review.nextSort(sort,'friendship_in');
  assert.deepEqual(review.sortRows(rows,sort,store).map(row=>row.ID),['001','002','003']);
  assert.equal(store.get('002').reactions.friendship_in,'mal');
  assert.equal(store.get('002').confidence,-2.5);
  const summary=batch.create({eventId:'event-1',username:'tutor7a',role:'tutor',sessionCode:'session-1',roster:[{classCode:'class-1',studentCode:'EST-002',confidence:-2.5,reactions:{friendship_in:'mal'}}],date:'2026-10-05T10:00:00Z'});
  assert.match(summary.message,/Le nombran como amistad: Revisar/);
  assert.doesNotMatch(summary.message,/Bea|amistad_recibida_n/);
});
