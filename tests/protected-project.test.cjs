const {test}=require('node:test'),assert=require('node:assert/strict');
const P=require('../src/protected-project.js'),C=require('../src/core.js'),fixture=require('./protected-fixture.cjs');
test('one encrypted file grants disjoint classroom data, retains full-centre indicators and no foreign links',async()=>{
 const data=fixture.data(),classes=P.classes(data),accounts=[{username:'orientacion',password:'FRJ508'},{username:'12345678Z',password:'Toro05Leon',allowed:[classes[0].key]},{username:'87654321X',password:'Lince72Delfin',allowed:[classes[1].key]}];
 const built=await P.build({data,center:'Centro 4826',accounts});
 for(const secret of ['Ana','Bruno','Oculto','12345678Z','87654321X','Toro05Leon','FRJ508','S1','S6'])assert.equal(built.text.includes('"'+secret+'"'),false);
 const a=await P.open(built.text,'12345678z','Toro05Leon'),b=await P.open(built.text,'87654321X','Lince72Delfin'),admin=await P.open(built.text,'orientacion','FRJ508');
 assert.equal(a.data.students.length,3);assert.equal(b.data.students.length,3);assert.equal(admin.data.students.length,6);assert.equal(a.admin,null);assert.equal(a.grant.maskedDni,'1*3**6*8Z');
 assert.ok(!JSON.stringify(a).includes('Oculto'));assert.ok(!JSON.stringify(a.data).includes('S4'));assert.ok(!JSON.stringify(b.data).includes('S1'));
 assert.ok(a.data.students.every(s=>s.amistad_recibida_n===5&&s.relaciones_red.length===2));
 for(const row of a.data.students){const original=data.students.find(r=>r.ID===row.ID);for(const field of [...C.SCORE_COLUMNS,...C.COUNT_COLUMNS,'centralidad_eigenvector'])assert.equal(row[field],original[field],field);}
 a.grant.role='orientador';assert.equal(C.aggregateCenter(a.data.students).n,3);assert.equal(a.admin,null);
 await assert.rejects(P.open(built.text,'12345678Z','Lince72Delfin'),/incorrectos/);
 const damaged=P.parseFile(built.text);damaged.compartments.forEach(c=>c.box.cipher='AAAA'+c.box.cipher.slice(4));await assert.rejects(P.open(P.MAGIC+JSON.stringify(damaged),'12345678Z','Toro05Leon'),/alterado/);
 const changed=await P.build({data:admin.admin.data,center:'Centro 4826',previous:admin.admin,accounts:[{username:'orientacion',password:'Nutria42Leon'},{username:'12345678Z',password:'',allowed:[classes[1].key]}]});
 await assert.rejects(P.open(changed.text,'orientacion','FRJ508'),/incorrectos/);assert.equal((await P.open(changed.text,'orientacion','Nutria42Leon')).data.students.length,6);
 assert.ok((await P.open(changed.text,'12345678Z','Toro05Leon')).data.students.every(s=>s.Grupo==='B'));
 await assert.rejects(P.open(changed.text,'87654321X','Lince72Delfin'),/incorrectos/);
 assert.equal(changed.revision,2);assert.ok(!JSON.stringify(changed.manifest).includes('12345678Z'));assert.ok(!JSON.stringify(changed.manifest).includes('Toro05Leon'));
 const resetAdmin=await P.open(changed.text,'orientacion','Nutria42Leon');
 const reset=await P.build({data:resetAdmin.admin.data,center:'Centro 4826',previous:resetAdmin.admin,accounts:[{username:'orientacion',password:''},{username:'12345678Z',password:'Gato81Perro',allowed:[classes[0].key]}]});
 await assert.rejects(P.open(reset.text,'12345678Z','Toro05Leon'));assert.equal((await P.open(reset.text,'12345678Z','Gato81Perro')).data.students.length,3);
});
test('validates identifiers, password uniqueness, classroom assignment, costs, legacy detection and scoped contract',async()=>{
 const data=fixture.data(),allowed=P.classes(data).map(c=>c.key);
 assert.throws(()=>P.normalizeUser('12345678A'),/DNI/);assert.equal(P.normalizeUser('orientacion'),'orientacion');
 for(let i=0;i<30;i++)assert.ok(P.validPassword(P.password(),'tutor'));
 const admin={username:'orientacion',password:'FRJ508'};
 await assert.rejects(P.build({data,center:'Centro 4826',accounts:[admin,{username:'12345678Z',password:'Toro05Leon',allowed:[]}]}),/aula/);
 await assert.rejects(P.build({data,center:'Centro 4826',accounts:[admin,{username:'12345678Z',password:'Toro05Leon',allowed},{username:'87654321X',password:'Toro05Leon',allowed}]}),/diferente/);
 assert.throws(()=>P.parseFile('PK test'),/tradicional/);
 assert.throws(()=>P.parseFile(P.MAGIC+JSON.stringify({schema:P.SCHEMA,iterations:999999999})),/compatible/);
 const scoped=P.snapshot(data,[allowed[0]]);scoped.students[0].relaciones_red.push({id:'S4',tipo:'amistad',intensidad:1});assert.throws(()=>P.validateSnapshot(scoped,[allowed[0]]),/no autorizado/);
 assert.throws(()=>P.endpoint('https://attacker.example/collect'),/Google/);
});

test('identical classroom scopes share only data, not credential grants; grant tampering is rejected',async()=>{
 const data=fixture.data(),allowed=[P.classes(data)[0].key];
 const built=await P.build({data,center:'Centro 4826',accounts:[{username:'orientacion',password:'FRJ508'},{username:'12345678Z',password:'Toro05Leon',allowed},{username:'87654321X',password:'Lince72Delfin',allowed}]});
 const envelope=P.parseFile(built.text);assert.equal(envelope.compartments.length,2);assert.equal(envelope.slots.length,3);
 const a=await P.open(built.text,'12345678Z','Toro05Leon'),b=await P.open(built.text,'87654321X','Lince72Delfin');
 assert.equal(a.grant.compartment,b.grant.compartment);assert.notEqual(a.grant.userCode,b.grant.userCode);assert.notEqual(a.grant.auditToken,b.grant.auditToken);
 envelope.slots[1].grant=envelope.slots[2].grant;await assert.rejects(P.open(P.MAGIC+JSON.stringify(envelope),'12345678Z','Toro05Leon'),/alterado/);
});
