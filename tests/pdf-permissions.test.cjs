const {test}=require('node:test'),assert=require('node:assert/strict');
const P=require('../src/protected-project.js'),fixture=require('./protected-fixture.cjs');
const data=fixture.data(),allowed=[P.classes(data)[0].key];
const accounts=[{username:'orientacion',password:'FRJ508'},{username:'12345678Z',password:'Toro05Leon',allowed},{username:'87654321X',password:'Lince72Delfin',allowed,canExportPdf:true}];

test('PDF permission belongs to each encrypted account, even when data compartments are shared',async()=>{
 const built=await P.build({data,center:'Centro 4826',accounts});
 const a=await P.open(built.text,accounts[1].username,accounts[1].password),b=await P.open(built.text,accounts[2].username,accounts[2].password),admin=await P.open(built.text,'orientacion','FRJ508');
 assert.equal(a.grant.canExportPdf,false);assert.equal(b.grant.canExportPdf,true);assert.equal(admin.grant.canExportPdf,true);
 assert.equal(a.grant.compartment,b.grant.compartment);assert.deepEqual(a.data,b.data);
 assert.deepEqual(admin.admin.accounts.map(a=>a.canExportPdf),[true,false,true]);
 assert.ok(!built.text.includes('canExportPdf'));assert.ok(!JSON.stringify(built.manifest).includes('canExportPdf'));
 const forged=P.parseFile(built.text);forged.canExportPdf=true;
 assert.equal((await P.open(P.MAGIC+JSON.stringify(forged),accounts[1].username,accounts[1].password)).grant.canExportPdf,false);
 for(const value of ['false','true',0,1,null,{}])await assert.rejects(P.build({data,center:'Centro 4826',accounts:[{...accounts[0],canExportPdf:value}]}),/permiso.*PDF/);
});

test('orientation changes PDF permissions without changing passwords; old copies retain old permissions',async()=>{
 const first=await P.build({data,center:'Centro 4826',accounts}),admin=await P.open(first.text,'orientacion','FRJ508');
 const updated=await P.build({data:admin.admin.data,center:admin.admin.center,previous:admin.admin,accounts:admin.admin.accounts.map(a=>({username:a.username,password:'',allowed:a.allowed,canExportPdf:a.username==='12345678Z'}))});
 const next=await P.open(updated.text,'orientacion','FRJ508');
 assert.equal(next.grant.canExportPdf,false);assert.equal((await P.open(updated.text,'12345678Z','Toro05Leon')).grant.canExportPdf,true);
 assert.equal((await P.open(updated.text,'87654321X','Lince72Delfin')).grant.canExportPdf,false);
 assert.equal((await P.open(first.text,'87654321X','Lince72Delfin')).grant.canExportPdf,true);
 const preserved=await P.build({data:next.admin.data,center:next.admin.center,previous:next.admin,accounts:next.admin.accounts.map(a=>({username:a.username,password:'',allowed:a.allowed}))});
 assert.equal((await P.open(preserved.text,'orientacion','FRJ508')).grant.canExportPdf,false);
 assert.equal((await P.open(preserved.text,'87654321X','Lince72Delfin')).grant.canExportPdf,false);
});

test('legacy encrypted grants remain readable, but malformed PDF permissions are rejected',async()=>{
 const built=await P.build({data,center:'Centro 4826',accounts}),admin=await P.open(built.text,'orientacion','FRJ508');
 async function rewriteGrant(value,remove=false){
  const envelope=P.parseFile(built.text),account=admin.admin.accounts.find(a=>a.username==='12345678Z'),slot=envelope.slots.find(s=>s.locator===account.locator);
  const key=await crypto.subtle.importKey('raw',Buffer.from(account.accessKey,'base64'),'AES-GCM',false,['encrypt','decrypt']);
  const additionalData=new TextEncoder().encode(JSON.stringify([P.SCHEMA,envelope.projectId,envelope.revision,'grant',slot.locator]));
  const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:Buffer.from(slot.grant.iv,'base64'),additionalData,tagLength:128},key,Buffer.from(slot.grant.cipher,'base64'));
  const grant=JSON.parse(new TextDecoder().decode(plain));if(remove)delete grant.canExportPdf;else grant.canExportPdf=value;
  const iv=crypto.getRandomValues(new Uint8Array(12));const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData,tagLength:128},key,new TextEncoder().encode(JSON.stringify(grant)));
  slot.grant={iv:Buffer.from(iv).toString('base64'),cipher:Buffer.from(cipher).toString('base64')};return P.MAGIC+JSON.stringify(envelope);
 }
 assert.equal((await P.open(await rewriteGrant(undefined,true),'12345678Z','Toro05Leon')).grant.canExportPdf,true);
 await assert.rejects(P.open(await rewriteGrant('false'),'12345678Z','Toro05Leon'),/permiso.*PDF/);
});
