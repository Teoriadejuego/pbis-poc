const {test}=require('node:test'),assert=require('node:assert/strict');
const PDF=require('../src/pdf-export.js'),C=require('../src/core.js'),P=require('../src/protected-project.js');
const data=require('./protected-fixture.cjs').data();
const orient=PDF.identity({role:'orientador'}),selection={center:'Centro 4826',course:'1.º ESO',group:'A',student:'S1'};
test('student PDF carries the same permission note in its relationship summary and network page',()=>{
 const N=require('../src/student-network.js');
 const scoped=data.students.filter(r=>r.Grupo==='A');
 const networkNote=N.permissionNote(C.studentNetwork(scoped,'S1'),true);
 assert.ok(networkNote);
 const before=JSON.stringify(data),report=PDF.model({view:'student',selection,students:scoped,groups:data.groups,identity:orient,networkNote});
 assert.equal(report.networkNote,networkNote);
 assert.ok(report.sections.find(s=>s.title==='Relaciones').note.includes(networkNote));
 const full=PDF.model({view:'student',selection,...data,identity:orient});
 assert.equal(full.networkNote,'');
 assert.doesNotMatch(JSON.stringify(full),/no tienes permiso para ver/);
 assert.equal(JSON.stringify(data),before);
});
test('PDF identity preserves masking, demo and orientation; never silently omits a teacher mark',()=>{
 assert.equal(PDF.identity({role:'tutor',protectedProject:true,maskedDni:'1*3**6*8Z',sessionCode:'abcdefgh-1234'}).watermark,'1*3**6*8Z · abcdefgh');
 assert.equal(PDF.identity({role:'tutor',username:'12345678Z',sessionCode:'abcdef'}).watermark,'1*3**6*8Z · abcdef');
 assert.equal(orient.watermark,null);assert.equal(orient.header,'Equipo orientador');
 assert.equal(PDF.identity({demo:true}).watermark,'DATOS SIMULADOS');
 assert.throws(()=>PDF.identity({role:'tutor',username:'a'}),/sesión/);
 assert.throws(()=>PDF.identity({role:'tutor',protectedProject:true,maskedDni:'12345678Z',sessionCode:'abc'}),/marca/);
});
test('PDF uses exact existing centre aggregates and unchanged individual scales',()=>{
 const m=PDF.model({view:'center',selection,...data,identity:orient});
 const g=C.aggregateCenter(data.students);
 assert.equal(m.sections[0].cards[1].score,g.attention.find(x=>x.id==='bullying_companeros').score);
 const before=JSON.stringify(data),s=PDF.model({view:'student',selection,...data,identity:orient});
 const crt=s.sections.find(x=>x.title==='Test de impulsividad');assert.equal(crt.cards[0].answer,'3 / 3');
 assert.ok(crt.cards[0].detail.includes('Media del aula: 3 / 3'));
 assert.equal(s.sections.find(x=>x.title==='Posición en la red').cards[1].score,data.students[0].centralidad);
 assert.equal(JSON.stringify(data),before);
});
test('PDF retains zero versus unanswered and missing values',()=>{
 const students=structuredClone(data.students);Object.assign(students[0],{respondio:'No',bullying_autorreporte:null,bullying_companeros_n:0,crt_aciertos:null,felicidad:null});
 const m=PDF.model({view:'student',selection,students,groups:data.groups,identity:orient});
 assert.equal(m.sections[0].cards[0].answer,'No ha respondido');assert.equal(m.sections[0].cards[1].answer,'0');
 assert.equal(m.sections.find(x=>x.title==='Bienestar').cards[0].answer,'Sin datos');
 assert.equal(m.sections.find(x=>x.title==='Test de impulsividad').cards[0].answer,'Sin datos');
});
test('teacher PDF consumes only its decrypted compartment; preserved centre-based counts',async()=>{
 const aulas=P.classes(data),built=await P.build({data,center:'Centro 4826',accounts:[{username:'orientacion',password:'FRJ508'},{username:'12345678Z',password:'Toro05Leon',allowed:[aulas[0].key]}]});
 const opened=await P.open(built.text,'12345678Z','Toro05Leon');
 const identity=PDF.identity({role:'tutor',protectedProject:true,maskedDni:opened.grant.maskedDni,sessionCode:'session1'});
 const m=PDF.model({view:'student',selection,...opened.data,identity});
 assert.equal(m.sections.find(x=>x.title==='Relaciones').cards[0].answer,String(data.students[0].amistad_recibida_n));
 assert.ok(!JSON.stringify(m).includes('Bruno'));
 assert.throws(()=>PDF.model({view:'center',selection,...opened.data,identity}),/centro completo/);
 assert.throws(()=>PDF.model({view:'student',selection:{...selection,student:'S4'},...opened.data,identity}),/autorizada/);
});
