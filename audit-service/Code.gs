/* Install in a PRIVATE Google Sheet via Extensions > Apps Script.
 * This service receives access metadata only, not school records or passwords.
 * No public API reads registrations or events. doPost is the sole write endpoint.
 */
const PBIS_HEADERS={
 auth:['Clave','Proyecto','Version','Cuenta','Rol','DNI parcial','Etiqueta','Hash de escritura'],
 events:['Evento','Proyecto','Version','Cuenta','DNI parcial','Etiqueta','Sesion','Archivo','Tipo','Hora cliente','Recibido UTC'],
 sessions:['Clave','Proyecto','Version','Cuenta','DNI parcial','Etiqueta','Sesion','Archivo','Apertura cliente','Apertura recibida UTC','Ultima actividad cliente','Ultima actividad recibida UTC','Cierre cliente','Cierre recibido UTC','Estado']
};
function onOpen(){SpreadsheetApp.getUi().createMenu('PBIS').addItem('Preparar registro','setupPbisRegistry').addItem('Registrar un proyecto','showPbisRegistration').addToUi();}
function setupPbisRegistry(){
 requireOwner_();
 const book=SpreadsheetApp.getActiveSpreadsheet();if(!book)throw Error('Abre el editor desde la hoja privada.');
 PropertiesService.getScriptProperties().setProperty('PBIS_AUDIT_SPREADSHEET_ID',book.getId());
 PropertiesService.getScriptProperties().setProperty('PBIS_AUDIT_OWNER_EMAIL',Session.getEffectiveUser().getEmail());
 ensureSheet_(book,'Autorizaciones',PBIS_HEADERS.auth);ensureSheet_(book,'Eventos',PBIS_HEADERS.events);ensureSheet_(book,'Sesiones',PBIS_HEADERS.sessions);
 SpreadsheetApp.getUi().alert('Registro preparado. Esta hoja debe permanecer privada; no la publiques ni la compartas con las cuentas docentes.');
}
function showPbisRegistration(){SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutputFromFile('Registro').setWidth(560).setHeight(390),'Registrar proyecto PBIS');}
function requireOwner_(){const active=Session.getActiveUser().getEmail(),effective=Session.getEffectiveUser().getEmail(),configured=PropertiesService.getScriptProperties().getProperty('PBIS_AUDIT_OWNER_EMAIL');if(!active||active!==effective||(configured&&active!==configured))throw Error('Solo la cuenta propietaria puede registrar proyectos desde su hoja privada.');}
function book_(){const id=PropertiesService.getScriptProperties().getProperty('PBIS_AUDIT_SPREADSHEET_ID');if(!id)throw Error('Receptor sin preparar.');return SpreadsheetApp.openById(id);}
function ensureSheet_(book,name,headers){let s=book.getSheetByName(name);if(!s){s=book.insertSheet(name);s.appendRow(headers);s.setFrozenRows(1);}else if(s.getLastRow()===0)s.appendRow(headers);else if(JSON.stringify(s.getRange(1,1,1,headers.length).getValues()[0])!==JSON.stringify(headers))throw Error('La hoja '+name+' no tiene los encabezados esperados.');return s;}
function rows_(s){return s.getLastRow()>1?s.getRange(2,1,s.getLastRow()-1,s.getLastColumn()).getValues():[];}
function safe_(v){return typeof v==='string'&&/^[=+\-@]/.test(v)?'\u200b'+v:v;}
function write_(s,index,row){s.getRange(index,1,1,row.length).setNumberFormats([row.map(v=>typeof v==='number'?'0':'@')]).setValues([row.map(safe_)]);}
function append_(s,row){write_(s,s.getLastRow()+1,row);}
function key_(p,r,u){return p+'|'+r+'|'+u;}
function hash_(value){return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,value,Utilities.Charset.UTF_8));}
function uuid_(s){return typeof s==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(s);}
function validateManifest_(m){
 if(!m||m.schema!=='pbis.audit-registration.v1'||!uuid_(m.projectId)||!Number.isInteger(m.revision)||m.revision<1||!Array.isArray(m.accounts)||!m.accounts.length||m.accounts.length>250||Object.keys(m).some(k=>!['schema','projectId','revision','accounts'].includes(k)))throw Error('Manifiesto no válido.');
 const seen=new Set();for(const a of m.accounts){if(!a||!/^U-[a-f0-9-]{36}$/i.test(a.userCode)||seen.has(a.userCode)||!['tutor','orientador'].includes(a.role)||a.label!==(a.role==='orientador'?'Equipo orientador':'Docente')||!(a.role==='orientador'?a.maskedDni==='':/^\d\*\d\*\*\d\*\d[A-Z]$/.test(a.maskedDni))||!/^[-A-Za-z0-9+/]{43}=$/.test(a.tokenHash)||Object.keys(a).some(k=>!['userCode','role','maskedDni','label','tokenHash'].includes(k)))throw Error('Cuenta no válida en el manifiesto.');seen.add(a.userCode);}
 return m;
}
// Invoked only from the bound Sheet dialog, not exposed through doPost/doGet.
function registerProjectFromJson(text){
 requireOwner_();
 if(typeof text!=='string'||text.length>150000)throw Error('Manifiesto demasiado grande.');const m=validateManifest_(JSON.parse(text)),lock=LockService.getScriptLock();lock.waitLock(15000);
 try{const s=ensureSheet_(book_(),'Autorizaciones',PBIS_HEADERS.auth),rows=rows_(s);let added=0;
  for(const a of m.accounts){const key=key_(m.projectId,m.revision,a.userCode),row=[key,m.projectId,m.revision,a.userCode,a.role,a.maskedDni,a.label,a.tokenHash],old=rows.find(r=>r[0]===key);if(old){if(JSON.stringify(old)!==JSON.stringify(row))throw Error('Esa versión ya está registrada con otra configuración. Genera una nueva versión del proyecto.');}else{append_(s,row);rows.push(row);added++;}}
  return 'Proyecto v'+m.revision+' registrado: '+added+' cuentas nuevas. Las copias anteriores conservan su registro.';
 }finally{lock.releaseLock();}
}
function validateEvent_(body){
 if(!body||Object.keys(body).sort().join(',')!=='event,token'||typeof body.token!=='string'||!/^[A-Za-z0-9+/]{43}=$/.test(body.token))throw Error('Solicitud no válida.');
 const e=body.event,keys=['schema','projectId','revision','userCode','sessionId','fileName','eventId','type','clientTime'];
 if(!e||Object.keys(e).sort().join(',')!==keys.sort().join(',')||e.schema!=='pbis.access.v1'||!uuid_(e.projectId)||!uuid_(e.sessionId)||!uuid_(e.eventId)||!Number.isInteger(e.revision)||e.revision<1||!/^U-[a-f0-9-]{36}$/i.test(e.userCode)||!['open','activity','close'].includes(e.type)||typeof e.fileName!=='string'||!e.fileName||e.fileName.length>180||/[\\/\x00-\x1f]/.test(e.fileName)||typeof e.clientTime!=='string'||!/^\d{4}-\d\d-\d\dT/.test(e.clientTime)||!Number.isFinite(Date.parse(e.clientTime)))throw Error('Evento no válido.');return e;
}
function writeSession_(sheet,eventRow){
 const r=eventRow,key=key_(r[1],r[2],r[3])+'|'+r[6],rows=rows_(sheet),index=rows.findIndex(x=>x[0]===key);
 const value=index<0?[key,r[1],r[2],r[3],r[4],r[5],r[6],r[7],'','','','','','','Sin cierre confirmado']:rows[index];
 if(r[8]==='open'&&(!value[9]||r[10]<value[9])){value[8]=r[9];value[9]=r[10];}
 if(!value[11]||r[10]>value[11]){value[10]=r[9];value[11]=r[10];}
 if(r[8]==='close'){value[12]=r[9];value[13]=r[10];value[14]='Cierre confirmado';}
 if(index<0)append_(sheet,value);else write_(sheet,index+2,value);
}
function receivePbisEvent_(body){
 const e=validateEvent_(body),lock=LockService.getScriptLock();lock.waitLock(15000);
 try{const book=book_(),auth=ensureSheet_(book,'Autorizaciones',PBIS_HEADERS.auth),a=rows_(auth).find(r=>r[0]===key_(e.projectId,e.revision,e.userCode));
  if(!a||a[7]!==hash_(body.token))throw Error('Acceso al registro no autorizado.');
  const events=ensureSheet_(book,'Eventos',PBIS_HEADERS.events),sessions=ensureSheet_(book,'Sesiones',PBIS_HEADERS.sessions),existing=rows_(events),old=existing.find(r=>r[0]===e.eventId);
  let row=[e.eventId,e.projectId,e.revision,e.userCode,a[5],a[6],e.sessionId,safe_(e.fileName),e.type,e.clientTime,new Date().toISOString()];
  if(old){if(JSON.stringify(old.slice(0,10))!==JSON.stringify(row.slice(0,10)))throw Error('Identificador de evento repetido con otro contenido.');row=old;}
  else{const today=row[10].slice(0,10);if(existing.filter(r=>r[3]===e.userCode&&String(r[10]).startsWith(today)).length>=500)throw Error('Límite diario de esta cuenta alcanzado.');append_(events,row);}
  // Re-run on identical retry: repairs a session summary if its first write failed.
  writeSession_(sessions,row);return {ok:true,eventId:e.eventId,receivedAt:row[10]};
 }finally{lock.releaseLock();}
}
function doPost(request){let result;try{const content=request&&request.postData&&request.postData.contents;if(typeof content!=='string'||content.length>4096)throw Error('Solicitud demasiado grande.');result=receivePbisEvent_(JSON.parse(content));}catch(error){result={ok:false,error:String(error.message).slice(0,180)};}return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);}
function doGet(){return ContentService.createTextOutput(JSON.stringify({service:'PBIS access registry',version:1,readAccess:false})).setMimeType(ContentService.MimeType.JSON);}
