const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
function service(){
 const sheets=new Map(),props=new Map([['PBIS_AUDIT_SPREADSHEET_ID','private-sheet'],['PBIS_AUDIT_OWNER_EMAIL','owner@example.test']]);let owner=true;
 function sheet(){const rows=[];return {rows,getLastRow:()=>rows.length,getLastColumn:()=>rows[0]?.length||0,appendRow:r=>rows.push([...r]),setFrozenRows(){},getRange:(start,col,count,width)=>({getValues:()=>rows.slice(start-1,start-1+count).map(r=>r.slice(col-1,col-1+width)),setNumberFormats(){return this;},setValues:values=>values.forEach((v,i)=>rows[start-1+i]=v)})};}
 const book={getSheetByName:n=>sheets.get(n),insertSheet:n=>{const s=sheet();sheets.set(n,s);return s;}};
 const context={console,Date,JSON,Set,SpreadsheetApp:{openById:()=>book},PropertiesService:{getScriptProperties:()=>({getProperty:k=>props.get(k)})},LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},Session:{getActiveUser:()=>({getEmail:()=>owner?'owner@example.test':''}),getEffectiveUser:()=>({getEmail:()=> 'owner@example.test'})},Utilities:{DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},computeDigest:(algo,s)=>Array.from(crypto.createHash('sha256').update(s).digest()),base64Encode:a=>Buffer.from(a).toString('base64')}};
 vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve('../audit-service/Code.gs'),'utf8'),context);return {context,sheets,setOwner:value=>owner=value};
}
test('private registration, authenticated append, replay repair, no duplicate events or spoofed users',()=>{
 const {context:c,sheets,setOwner}=service(),projectId=crypto.randomUUID(),userCode='U-'+crypto.randomUUID(),token=crypto.randomBytes(32).toString('base64');
 const m={schema:'pbis.audit-registration.v1',projectId,revision:1,accounts:[{userCode,role:'tutor',maskedDni:'1*3**6*8Z',label:'Docente',tokenHash:crypto.createHash('sha256').update(token).digest('base64')}]};
 setOwner(false);assert.throws(()=>c.registerProjectFromJson(JSON.stringify(m)),/propietaria/);setOwner(true);c.registerProjectFromJson(JSON.stringify(m));
 const event={schema:'pbis.access.v1',projectId,revision:1,userCode,sessionId:crypto.randomUUID(),fileName:'Centro 4826.pbis',eventId:crypto.randomUUID(),type:'open',clientTime:new Date().toISOString()};
 assert.throws(()=>c.receivePbisEvent_({token:crypto.randomBytes(32).toString('base64'),event}),/autorizado/);
 assert.equal(c.receivePbisEvent_({token,event}).ok,true);assert.equal(c.receivePbisEvent_({token,event}).ok,true);assert.equal(sheets.get('Eventos').rows.length,2);assert.equal(sheets.get('Sesiones').rows.length,2);assert.equal(sheets.get('Sesiones').rows[1][14],'Sin cierre confirmado');
 assert.throws(()=>c.receivePbisEvent_({token,event:{...event,fileName:'otro.pbis'}}),/otro contenido/);
 assert.throws(()=>c.receivePbisEvent_({token,event:{...event,students:[]}}),/no válido/);
 sheets.get('Sesiones').rows.splice(1);c.receivePbisEvent_({token,event});assert.equal(sheets.get('Sesiones').rows.length,2);assert.equal(sheets.get('Eventos').rows.length,2);
 const unsafeName={...event,eventId:crypto.randomUUID(),fileName:'=prueba.pbis',sessionId:crypto.randomUUID()};c.receivePbisEvent_({token,event:unsafeName});c.receivePbisEvent_({token,event:unsafeName});assert.equal(sheets.get('Eventos').rows.length,3);assert.equal(sheets.get('Eventos').rows[2][7][0],'\u200b');
 c.receivePbisEvent_({token,event:{...event,eventId:crypto.randomUUID(),type:'close'}});assert.equal(sheets.get('Sesiones').rows[1][14],'Cierre confirmado');
 assert.ok(!JSON.stringify(sheets.get('Eventos').rows).includes(token));
});

function connection(){return {schema:'pbis.audit-connection.v1',endpoint:'https://script.google.com/macros/s/TEST/exec',projectId:crypto.randomUUID(),revision:1,userCode:'U-'+crypto.randomUUID(),username:'orientacion',token:crypto.randomBytes(32).toString('base64')};}
function eventFor(c,extra={}){return {schema:'pbis.access.v2',projectId:c.projectId,revision:1,userCode:c.userCode,sessionId:crypto.randomUUID(),fileName:'prueba.xlsx',eventId:crypto.randomUUID(),type:'open',clientTime:new Date().toISOString(),centers:['Centro 4826'],...extra};}

test('a hash beginning with plus remains authenticated and registration stays idempotent',()=>{
 const token=Buffer.alloc(32,48).toString('base64'),tokenHash=crypto.createHash('sha256').update(token).digest('base64');
 assert.ok(tokenHash.startsWith('+'));
 for(const mode of ['excel','protected']){
  const {context:c,sheets}=service(),config={...connection(),token};
  const manifest={schema:'pbis.audit-registration.v1',projectId:config.projectId,revision:1,center:'Centro 4826',accounts:[{userCode:config.userCode,role:'orientador',maskedDni:'',label:'Equipo orientador',tokenHash}]};
  const register=()=>mode==='excel'?c.registerOrientationConnection(JSON.stringify(config)):c.registerProjectFromJson(JSON.stringify(manifest));
  register();register();assert.equal(sheets.get('Autorizaciones').rows.length,2);
  assert.equal(sheets.get('Autorizaciones').rows[1][7],'\u200b'+tokenHash);
  const event=eventFor(config);assert.equal(c.receivePbisEvent_({token,event}).ok,true);
  assert.equal(c.receivePbisEvent_({token,event}).ok,true);assert.equal(sheets.get('Eventos').rows.length,2);
  assert.throws(()=>c.receivePbisEvent_({token:Buffer.alloc(32,49).toString('base64'),event}),/autorizado/);
 }
});
test('orientation raw consultation stores account, centers, file, open and close with no secrets',()=>{
 const {context:c,sheets,setOwner}=service(),config=connection();
 setOwner(false);assert.throws(()=>c.registerOrientationConnection(JSON.stringify(config)),/propietaria/);setOwner(true);
 c.registerOrientationConnection(JSON.stringify(config));c.registerOrientationConnection(JSON.stringify(config));
 const event=eventFor(config,{centers:['Centro 4826','Centro 4827']});c.receivePbisEvent_({token:config.token,event});c.receivePbisEvent_({token:config.token,event});
 const session=sheets.get('Sesiones').rows[1];assert.equal(session[15],'Centro 4826 | Centro 4827');assert.equal(session[16],'excel');assert.equal(session[17],'orientacion');assert.equal(session[14],'Sin cierre confirmado');
 c.receivePbisEvent_({token:config.token,event:{...event,eventId:crypto.randomUUID(),type:'close'}});
 assert.equal(sheets.get('Sesiones').rows[1][14],'Cierre confirmado');assert.equal(sheets.get('Eventos').rows.length,3);
 for(const sheet of sheets.values())assert.ok(!JSON.stringify(sheet.rows).includes(config.token));
 const before=JSON.stringify([...sheets.values()].map(s=>s.rows));
 for(const key of ['password','contraseña','students','answers','username'])assert.throws(()=>c.receivePbisEvent_({token:config.token,event:{...event,[key]:'DO-NOT-STORE'}}));
 assert.equal(JSON.stringify([...sheets.values()].map(s=>s.rows)),before);
});
test('receiver prevents changing file or centre in one session and binds protected centre',()=>{
 const {context:c,sheets}=service(),config=connection();c.registerOrientationConnection(JSON.stringify(config));const e=eventFor(config);c.receivePbisEvent_({token:config.token,event:e});
 assert.throws(()=>c.receivePbisEvent_({token:config.token,event:{...e,eventId:crypto.randomUUID(),centers:['Centro 9999'],type:'close'}}),/sesión nueva/);
 assert.equal(sheets.get('Eventos').rows.length,2);
 const other=connection(),m={schema:'pbis.audit-registration.v1',projectId:other.projectId,revision:1,center:'Centro 4826',accounts:[{userCode:other.userCode,role:'orientador',maskedDni:'',label:'Equipo orientador',tokenHash:crypto.createHash('sha256').update(other.token).digest('base64')}]};
 c.registerProjectFromJson(JSON.stringify(m));const valid=eventFor(other);c.receivePbisEvent_({token:other.token,event:valid});
 assert.throws(()=>c.receivePbisEvent_({token:other.token,event:{...valid,eventId:crypto.randomUUID(),centers:['Centro 9999']}}),/centro no coincide/);
});
test('old sheet headers migrate without deleting records, old clients remain accepted',()=>{
 const {context:c,sheets}=service(),config=connection(),m={schema:'pbis.audit-registration.v1',projectId:config.projectId,revision:1,accounts:[{userCode:config.userCode,role:'orientador',maskedDni:'',label:'Equipo orientador',tokenHash:crypto.createHash('sha256').update(config.token).digest('base64')}]};
 c.registerProjectFromJson(JSON.stringify(m));const e=eventFor(config);delete e.centers;e.schema='pbis.access.v1';c.receivePbisEvent_({token:config.token,event:e});
 for(const [name,n]of [['Autorizaciones',8],['Eventos',11],['Sesiones',15]])for(const row of sheets.get(name).rows)row.splice(n);
 c.registerProjectFromJson(JSON.stringify(m));c.receivePbisEvent_({token:config.token,event:e});
 assert.equal(sheets.get('Eventos').rows.length,2);assert.equal(sheets.get('Sesiones').rows[1][17],'orientacion');
});
