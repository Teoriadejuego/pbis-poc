'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const N=require('../src/class-network.js');
const student=(ID,extra={})=>({ID,Campus:'Centro 3705',Curso:'1.º ESO',Grupo:'A',Nombre:null,amistad_recibida_n:0,relaciones_red:[],...extra});
const link=(id,tipo='amistad',intensidad=1)=>({id,tipo,intensidad});
test('circle includes isolated and nonresponding students, sorted by existing popularity with stable ties and unknowns last',()=>{
  const rows=[student('02',{amistad_recibida_n:4}),student('03',{amistad_recibida_n:null}),student('01',{amistad_recibida_n:4,respondio:'No',relaciones_red:null}),student('04')];
  const before=JSON.stringify(rows),m=N.model(rows);
  assert.deepEqual(m.students.map(r=>r.ID),['01','02','04','03']);assert.equal(m.respondents,3);
  assert.equal(JSON.stringify(rows),before);assert.equal((N.view(rows).match(/data-class-student=/g)||[]).length,4);
  assert.match(N.view(rows),/class-network-unanswered/);assert.match(N.view(rows),/3 de 4 han respondido/);
});
test('every valid class edge keeps its direction, sign and intensity; duplicates, self-links and outside nodes never become extra edges',()=>{
  const rows=[student('01',{relaciones_red:[link('01'),link('02'),link('02','amistad',2),link('X'),link('03','bad'),link('03','rechazo',0)]}),student('02',{relaciones_red:[link('01','rechazo',2),link('03','rechazo')]}),student('03',{relaciones_red:null})];
  const m=N.model(rows);assert.equal(m.edges.length,3);assert.equal(m.outside,1);
  assert.deepEqual(m.edges[0],{from:'01',to:'02',tipo:'amistad',intensidad:2});
  assert.deepEqual(m.edges[1],{from:'02',to:'01',tipo:'rechazo',intensidad:2});
  const g=N.geometry(m);assert.notEqual(g.paths[0].path,g.paths[1].path);assert.ok(g.paths[1].width>g.paths[2].width);
  assert.equal((N.svg(m).match(/marker-end=/g)||[]).length,3);assert.match(N.view(rows),/1 mención hacia un código fuera/);
});
test('class and center boundaries stay closed even if a caller accidentally passes mixed rows',()=>{
  const rows=[student('01',{relaciones_red:[link('02'),link('03')]}),student('02',{Grupo:'B'}),student('03',{Campus:'Other'})];
  const m=N.model(rows);assert.equal(m.students.length,1);assert.equal(m.edges.length,0);assert.equal(m.outside,2);
  assert.doesNotMatch(N.view(rows),/data-class-student="02"|data-class-student="03"|Other/);
});
test('unknown relationships differ from empty answers and a zero received count is not missing',()=>{
  assert.equal(N.view([]),'');
  const unavailable=N.view([student('01',{relaciones_red:null})]);
  assert.match(unavailable,/No hay respuestas de relaciones disponibles/);assert.match(unavailable,/0 recibidas/);
  const empty=N.view([student('01')]);assert.match(empty,/No se observan relaciones entre/);assert.doesNotMatch(empty,/No hay respuestas/);
});
test('an explicit nonresponse with an empty array stays unanswered and can still receive links',()=>{
  const rows=[student('01',{respondio:'No',relaciones_red:[]}),student('02',{relaciones_red:[link('01')]})];
  const m=N.model(rows);assert.equal(m.respondents,1);assert.equal(m.edges.length,1);
  assert.match(N.view(rows),/class-network-unanswered/);assert.match(N.view(rows),/1 de 2 han respondido/);
});
test('received center counts determine order even when the class-only incoming degrees differ',()=>{
  const rows=[student('01',{amistad_recibida_n:18,ambito_nominaciones:'centro',relaciones_red:[link('02')]}),student('02',{amistad_recibida_n:3,ambito_nominaciones:'centro'})];
  assert.equal(N.model(rows).students[0].ID,'01');assert.equal(N.model(rows).scope,'centro');
});
test('same-radius circle runs clockwise from noon with readable node separation and safe path coordinates',()=>{
  for(const n of [1,2,3,12,28,50,100,300]){
    const m=N.model(Array.from({length:n},(_,i)=>student(String(i),{amistad_recibida_n:n-i,relaciones_red:i?[link('0')]:[]}))),g=N.geometry(m);
    assert.equal(g.nodes[0].y,g.center-g.radius);assert.equal(g.nodes[0].x,g.center);
    if(n>2)assert.ok(g.nodes[1].x>g.center);
    for(const node of g.nodes)assert.ok(Math.abs(Math.hypot(node.x-g.center,node.y-g.center)-g.radius)<.01);
    for(let i=0;i<g.nodes.length;i++)for(let j=i+1;j<g.nodes.length;j++)assert.ok(Math.hypot(g.nodes[i].x-g.nodes[j].x,g.nodes[i].y-g.nodes[j].y)>28);
    assert.doesNotMatch(N.svg(m),/NaN|Infinity|undefined/);
  }
});
test('codes and names are escaped, no full surnames appear, and missing names use the original ID',()=>{
  const html=N.view([student('01',{Nombre:'Ana García López'}),student('02" onclick="bad<')]);
  assert.match(html,/Ana G\. L\./);assert.doesNotMatch(html,/García|López|\sonclick="/);assert.match(html,/data-class-student="02&quot; onclick=&quot;bad&lt;"/);
});
test('highlight counts directed incoming and outgoing class edges without removing unrelated students',()=>{
  const element=dataset=>({dataset,classes:new Set(),classList:{toggle(name,on){on?this.owner.classes.add(name):this.owner.classes.delete(name);}}});
  const nodes=['A','B','C','D'].map(classStudent=>element({classStudent})),edges=[['A','B'],['B','A'],['C','B']].map(([classFrom,classTo])=>element({classFrom,classTo}));
  for(const el of [...nodes,...edges])el.classList.owner=el;
  const status={},panel={querySelectorAll:selector=>selector==='[data-class-from]'?edges:nodes,querySelector:()=>status};
  N.highlight(panel,'A');assert.match(status.textContent,/1 mención enviada · 1 recibida/);
  assert.equal(edges[2].classes.has('is-muted'),true);assert.equal(nodes[3].classes.has('is-muted'),true);assert.equal(nodes[0].classes.has('is-selected'),true);
  N.highlight(panel,'outside');assert.equal(status.textContent,'4 estudiantes · 3 menciones dentro del aula');assert.ok([...nodes,...edges].every(el=>!el.classes.has('is-muted')));
});
