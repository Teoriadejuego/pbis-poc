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
 const unsafeName={...event,eventId:crypto.randomUUID(),fileName:'=prueba.pbis'};c.receivePbisEvent_({token,event:unsafeName});c.receivePbisEvent_({token,event:unsafeName});assert.equal(sheets.get('Eventos').rows.length,3);assert.equal(sheets.get('Eventos').rows[2][7][0],'\u200b');
 c.receivePbisEvent_({token,event:{...event,eventId:crypto.randomUUID(),type:'close'}});assert.equal(sheets.get('Sesiones').rows[1][14],'Cierre confirmado');
 assert.ok(!JSON.stringify(sheets.get('Eventos').rows).includes(token));
});
