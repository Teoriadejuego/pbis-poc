const {test}=require('node:test'),assert=require('node:assert/strict'),create=require('../src/access-audit.js');
const options={endpoint:'https://script.google.com/macros/s/TEST/exec',projectId:'project',revision:1,userCode:'U-test',role:'tutor',maskedDni:'1*3**6*8Z',token:'secret',fileName:'C:\\Users\\private\\centro.pbis',crypto:globalThis.crypto};
test('v2 sends only explicit metadata, no password fields or false initial receipt',async()=>{
 const sent=[],audit=create({...options,centers:['Centro 4826','Centro 4826'],password:'NEVER-SEND',username:'12345678Z',students:[{Nombre:'PRIVATE'}],fetch:async(url,init)=>{const b=JSON.parse(init.body);sent.push(b);return {ok:true,json:async()=>({ok:true,eventId:b.event.eventId})};}});
 assert.equal(audit.status().message,'Registro preparado');await audit.enqueue('open');
 assert.deepEqual(sent[0].event.centers,['Centro 4826']);assert.equal(sent[0].event.schema,'pbis.access.v2');
 assert.doesNotMatch(JSON.stringify(sent),/NEVER-SEND|PRIVATE|12345678Z|password|students/);
 assert.equal(audit.status().message,'Acceso registrado');audit.dispose();
});
test('retries same event until explicit acknowledgement and never sends identity or student data',async()=>{
 const sent=[];let succeed=false;const audit=create({...options,fetch:async(url,init)=>{const body=JSON.parse(init.body);sent.push(body);return {ok:succeed,json:async()=>({ok:true,eventId:body.event.eventId})};}});
 await audit.enqueue('open');assert.equal(audit.pending(),1);succeed=true;await audit.flush();assert.equal(audit.pending(),0);assert.equal(sent[0].event.eventId,sent[1].event.eventId);
 await audit.enqueue('activity');await audit.enqueue('close');await audit.enqueue('close');assert.equal(sent.filter(x=>x.event.type==='close').length,1);
 assert.equal(sent[0].event.fileName,'centro.pbis');assert.equal(sent[0].event.username,undefined);assert.equal(sent[0].event.maskedDni,undefined);assert.equal(sent[0].event.students,undefined);audit.dispose();
});
test('opaque/no receipt is not success, offline queue is memory only and disposed explicitly',async()=>{
 const audit=create({...options,fetch:async()=>({ok:true,type:'opaque'})});await audit.enqueue('open');await audit.enqueue('activity');await audit.enqueue('activity');assert.equal(audit.pending(),2);audit.dispose();assert.equal(audit.pending(),0);
 const inactive=create({...options,endpoint:'',fetch:()=>{throw Error('should not send');}});await inactive.enqueue('open');assert.equal(inactive.pending(),0);assert.match(inactive.status().message,/sin activar/);
});
