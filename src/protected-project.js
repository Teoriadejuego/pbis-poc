/* PBIS protected container v1. Web Crypto only; no network or persistent storage.
 * A credential decrypts one grant, never the administrator's compartment.
 * Short, user-requested passwords do NOT resist offline guessing reliably.
 */
(function(root,factory){'use strict';if(typeof module==='object'&&module.exports)module.exports=factory(globalThis,require('./core.js'));else root.PbisProtected=factory(root,root.PbisCore);})(typeof globalThis!=='undefined'?globalThis:this,function(root,C){
'use strict';
const MAGIC='PBIS-PROTECTED/1\n',SCHEMA='pbis.protected.v1',ITERATIONS=600000;
const MAX_BYTES=100*1024*1024,MAX_PLAIN=50*1024*1024,MAX_USERS=250;
const enc=new TextEncoder(),dec=new TextDecoder('utf-8',{fatal:true});
const animals='Toro Leon Lince Delfin Tigre Puma Gato Perro Zorro Lobo Oso Panda Koala Nutria Ciervo Alce Reno Cabra Oveja Vaca Caballo Burro Cebra Jirafa Elefante Rinoceronte Hipopotamo Camello Dromedario Llama Alpaca Mono Gorila Chimpance Lemur Perezoso Armadillo Castor Tejon Mapache Erizo Conejo Liebre Ardilla Raton Hamster Aguila Halcon Buho Lechuza Cuervo Mirlo Pato Ganso Cisne Garza Grulla Flamenco Pelicano Pinguino Tucan Loro Canario Gallina Gallo Pavo Avestruz Emu Foca Morsa Ballena Orca Tiburon Atun Salmon Trucha Sardina Pulpo Calamar Sepia Cangrejo Langosta Tortuga Iguana Lagarto Gecko Cocodrilo Caiman Rana Sapo Salamandra Triton Mariposa Abeja Avispa Hormiga Grillo Escarabajo Libelula Cigarra'.split(' ');
const textFields=['ID','Centro','Campus','Curso','Grupo','Nombre','Tratamiento','respondio','bullying_autorreporte','soledad_frecuente','identifica_apoyo','ambito_nominaciones','ambito_centralidad','centralidad_estado','metodo_centralidad','escala_indicadores','comunidad_amistad'];
const numericFields=[...C.SCORE_COLUMNS,...C.COUNT_COLUMNS,'n_clase','.n_clase','n_centro','mediacion_negativa_n','pred_amistad_n','pred_amistad_aciertos','pred_rechazo_n','pred_rechazo_aciertos','centralidad_eigenvector','centralidad_eigenvector_or','crt_aciertos','felicidad','felicidad_centro','felicidad_diversion','felicidad_soledad','red_centro_pendiente_pct','red_clase_pendiente_pct','bullying_filtro_max_otros','bullying_filtro_excluidos_n','bullying_filtro_admitidos_n','amistad_clase_recibida_n','amistad_clase_declarada_n','amistad_clase_reciproca_n'];
const booleanFields=['red_centro_completa','centralidad_sin_convergencia'];
const groupFields=['Centro','Campus','Curso','Grupo','ID_aula','Periodo','escala_grupo','estructura_red','salones_referencia','red_centro_completa','red_clase_completa','red_centro_pendiente_pct','red_clase_pendiente_pct',...C.GROUP_SCORE_COLUMNS,...C.STRUCTURE_COLUMNS,'grupos_amistad_n','grupos_amistad_tamanos'];
const fail=m=>{throw Error(m);};
function crypto(){if(!root.crypto?.subtle)fail('Este navegador no permite abrir proyectos cifrados. Usa una versión actual de Chrome, Edge, Firefox o Safari.');return root.crypto;}
const bytes=n=>crypto().getRandomValues(new Uint8Array(n));
const id=()=>crypto().randomUUID();
function b64(a){let s='';for(let i=0;i<a.length;i+=8192)s+=String.fromCharCode(...a.subarray(i,i+8192));return btoa(s);}
function un64(s,max=MAX_BYTES){if(typeof s!=='string'||s.length>max*1.34+8||!/^[A-Za-z0-9+/]*={0,2}$/.test(s))fail('Contenido cifrado no válido.');let a;try{a=Uint8Array.from(atob(s),c=>c.charCodeAt(0));}catch{fail('Contenido cifrado no válido.');}if(a.length>max)fail('El contenido supera el tamaño permitido.');return a;}
async function digest(s){return b64(new Uint8Array(await crypto().subtle.digest('SHA-256',typeof s==='string'?enc.encode(s):s)));}
function parse(s){return JSON.parse(s,(k,v)=>{if(['__proto__','constructor','prototype'].includes(k))fail('Campo no permitido en el proyecto.');return v;});}
function string(v,max=200){return typeof v==='string'&&v.length>0&&v.length<=max&&!/[\x00-\x1f]/.test(v);}
function normalizeUser(value){const u=String(value||'').trim().toUpperCase();if(u==='ORIENTACION')return 'orientacion';if(!/^\d{8}[A-Z]$/.test(u)||'TRWAGMYFPDXBNJZSQVHLCKE'[Number(u.slice(0,8))%23]!==u[8])fail('Introduce un DNI válido: ocho cifras y su letra.');return u;}
function maskDni(u){return [...u].map((c,i)=>[1,3,4,6].includes(i)?'*':c).join('');}
function randomInt(n){const limit=Math.floor(4294967296/n)*n;let v;do{v=new DataView(bytes(4).buffer).getUint32(0);}while(v>=limit);return v%n;}
function password(){const first=randomInt(animals.length);let second;do{second=randomInt(animals.length);}while(second===first);return animals[first]+String(randomInt(100)).padStart(2,'0')+animals[second];}
function validPassword(value,role){if(typeof value!=='string'||value.length>100)return false;return role==='orientador'&&value==='FRJ508'||new RegExp('^('+animals.join('|')+')\\d{2}('+animals.join('|')+')$').test(value);}
function endpoint(value){if(!value)return '';if(typeof value!=='string'||!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(value))fail('Usa la dirección /exec del receptor de Google Apps Script.');return value;}
function pdfPermission(value,fallback){if(value===undefined)return fallback;if(typeof value!=='boolean')fail('El permiso de descarga PDF no es válido.');return value;}
// Containers created before per-account PDF permissions keep their behaviour.
function canExportPdf(account){return pdfPermission(account?.canExportPdf,true);}
const classKey=r=>JSON.stringify([r.Centro||r.Campus,r.Curso,r.Grupo]);
function classes(data){return [...new Map(data.students.map(r=>[classKey(r),{key:classKey(r),center:r.Centro||r.Campus,course:r.Curso,group:r.Grupo}])).values()];}
function pick(row,keys){return Object.fromEntries(keys.filter(k=>Object.hasOwn(row,k)).map(k=>[k,row[k]]));}
function snapshot(data,allowed){
 const keys=new Set(allowed),rows=data.students.filter(r=>keys.has(classKey(r))),ids=new Set(rows.map(r=>r.ID));
 return {schema:'pbis.snapshot.v1',students:rows.map(r=>({...pick(r,[...textFields,...numericFields,...booleanFields]),relaciones_red:Array.isArray(r.relaciones_red)?r.relaciones_red.filter(l=>ids.has(l.id)).map(l=>pick(l,['id','tipo','intensidad'])):null,incidencias_calculo:Array.isArray(r.incidencias_calculo)?r.incidencias_calculo.filter(x=>['mediación','predicciones','relaciones'].includes(x)):[]})),groups:data.groups.filter(r=>keys.has(classKey(r))).map(r=>pick(r,groupFields)),warnings:[]};
}
function validateSnapshot(data,allowed){
 if(!data||data.schema!=='pbis.snapshot.v1'||!Array.isArray(data.students)||!data.students.length||data.students.length>10000||!Array.isArray(data.groups)||data.groups.length>1000)fail('Los datos del proyecto no son válidos.');
 const keys=new Set(allowed),ids=new Set(data.students.map(r=>r.ID));
 if(ids.size!==data.students.length||data.students.some(r=>!keys.has(classKey(r)))||data.groups.some(r=>!keys.has(classKey(r))))fail('Los datos no coinciden con las aulas autorizadas.');
 for(const row of data.students){
  if(Object.keys(row).some(k=>![...textFields,...numericFields,...booleanFields,'relaciones_red','incidencias_calculo'].includes(k)))fail('El proyecto contiene campos no permitidos.');
  for(const k of textFields)if(row[k]!=null&&(!string(row[k],k==='Nombre'?300:200)))fail('Texto no válido en '+k+'.');
  for(const k of numericFields)if(row[k]!=null&&(!Number.isFinite(row[k])||Math.abs(row[k])>1e9))fail('Número no válido en '+k+'.');
  for(const k of booleanFields)if(row[k]!=null&&typeof row[k]!=='boolean')fail('Indicador no válido.');
  if(row.incidencias_calculo!=null&&(!Array.isArray(row.incidencias_calculo)||row.incidencias_calculo.some(x=>!['mediación','predicciones','relaciones'].includes(x))))fail('Incidencias no válidas.');
  if(row.relaciones_red!==null){
   if(!Array.isArray(row.relaciones_red)||row.relaciones_red.length>data.students.length)fail('Red no válida.');
   const seen=new Set();for(const l of row.relaciones_red){if(!l||!ids.has(l.id)||l.id===row.ID||seen.has(l.id)||!['amistad','rechazo'].includes(l.tipo)||![1,2].includes(l.intensidad)||Object.keys(l).some(k=>!['id','tipo','intensidad'].includes(k)))fail('La red incluye un vínculo no autorizado.');seen.add(l.id);}
   for(const [type,field]of[['amistad','amistad_declarada_n'],['rechazo','rechazo_declarado_n']])if(row[field]!=null&&row.relaciones_red.filter(l=>l.tipo===type).length>row[field])fail('La red no coincide con los recuentos.');
  }
 }
 // Full source counts remain intact. Core validates all numeric and class invariants;
 // visible links have their own subset invariant, not the legacy complete-network one.
 const checked=C.validateAndJoin(data.students.map(r=>({...r,relaciones_red:null})),null,data.groups);
 checked.students.forEach((r,i)=>{r.relaciones_red=data.students[i].relaciones_red;r.incidencias_calculo=data.students[i].incidencias_calculo||[];});
 return checked;
}
async function importAes(raw){return crypto().subtle.importKey('raw',un64(raw,32),{name:'AES-GCM'},false,['encrypt','decrypt']);}
async function derive(pass,salt){const base=await crypto().subtle.importKey('raw',enc.encode(pass),'PBKDF2',false,['deriveKey']);return crypto().subtle.deriveKey({name:'PBKDF2',salt:un64(salt,16),iterations:ITERATIONS,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);}
async function seal(value,key,aad){const plain=enc.encode(JSON.stringify(value));if(plain.length>MAX_PLAIN)fail('El contenido de un perfil supera 50 MB.');const iv=bytes(12),cipher=await crypto().subtle.encrypt({name:'AES-GCM',iv,additionalData:enc.encode(aad),tagLength:128},key,plain);return {iv:b64(iv),cipher:b64(new Uint8Array(cipher))};}
async function reveal(box,key,aad){if(!box||Object.keys(box).some(k=>!['iv','cipher'].includes(k)))fail('Bloque cifrado no válido.');const iv=un64(box.iv,12);if(iv.length!==12)fail('Bloque cifrado no válido.');const plain=await crypto().subtle.decrypt({name:'AES-GCM',iv,additionalData:enc.encode(aad),tagLength:128},key,un64(box.cipher,MAX_PLAIN+16));if(plain.byteLength>MAX_PLAIN)fail('Contenido demasiado grande.');return parse(dec.decode(plain));}
function aad(project,kind,tag){return JSON.stringify([SCHEMA,project.projectId,project.revision,kind,tag]);}
function parseFile(input){const text=typeof input==='string'?input:dec.decode(input);if(enc.encode(text).length>MAX_BYTES)fail('El proyecto supera 100 MB.');if(!text.startsWith(MAGIC))fail('Este archivo no es un proyecto protegido. Abre los Excel y .pbis antiguos con la carga tradicional.');const p=parse(text.slice(MAGIC.length));if(p.schema!==SCHEMA||p.kdf!=='PBKDF2-SHA256'||p.iterations!==ITERATIONS||!string(p.projectId,40)||!Number.isInteger(p.revision)||p.revision<1||!Array.isArray(p.slots)||!p.slots.length||p.slots.length>MAX_USERS||!Array.isArray(p.compartments)||p.compartments.length>MAX_USERS)fail('Formato o versión del proyecto no compatible.');if(new Set(p.slots.map(s=>s.locator)).size!==p.slots.length||new Set(p.compartments.map(s=>s.id)).size!==p.compartments.length)fail('El proyecto contiene bloques duplicados.');return p;}
async function open(input,username,pass){
 const p=parseFile(input),u=normalizeUser(username);if(typeof pass!=='string'||!pass||pass.length>100)fail('Usuario o contraseña incorrectos, o archivo alterado.');
 const locator=await digest(p.projectId+'\n'+u),slot=p.slots.find(s=>s.locator===locator);let grant,accessKey;
 try{if(!slot)throw Error();const wrapKey=await derive(pass,slot.salt);accessKey=await reveal(slot.wrap,wrapKey,JSON.stringify([SCHEMA,p.projectId,'credential',locator]));grant=await reveal(slot.grant,await importAes(accessKey),aad(p,'grant',locator));}catch{fail('Usuario o contraseña incorrectos, o archivo alterado.');}
 if(!grant||grant.username!==u||!['orientador','tutor'].includes(grant.role)||!string(grant.userCode,50)||!Array.isArray(grant.allowed)||grant.allowed.length>1000||!grant.allowed.length||!string(grant.auditToken,60))fail('La autorización del proyecto no es válida.');
 if(grant.role==='orientador'&&u!=='orientacion'||grant.role==='tutor'&&u==='orientacion')fail('Rol de acceso no válido.');
 grant.canExportPdf=canExportPdf(grant);
 const part=p.compartments.find(x=>x.id===grant.compartment);if(!part)fail('Falta el contenido autorizado.');
 let payload;try{payload=await reveal(part.box,await importAes(grant.key),aad(p,'data',part.id));}catch{fail('El contenido está alterado o no puede descifrarse.');}
 const data=validateSnapshot(payload.data,grant.allowed);endpoint(grant.endpoint);
 const result={projectId:p.projectId,revision:p.revision,grant,data,header:p,admin:null};
 if(grant.role==='orientador'){
  const admin=payload.admin;if(!admin||!Array.isArray(admin.accounts)||admin.accounts.length>MAX_USERS||!admin.accounts.some(a=>a.username==='orientacion'))fail('Configuración de administración no válida.');
  result.admin={...admin,accounts:admin.accounts.map(a=>({...a,canExportPdf:canExportPdf(a)})),data:payload.data,projectId:p.projectId,revision:p.revision,endpoint:grant.endpoint};
 }
 return result;
}
async function build({data,center,accounts,previous=null,auditEndpoint='',onProgress=()=>{}}){
 crypto();auditEndpoint=endpoint(auditEndpoint);
 if(!string(center)||!Array.isArray(accounts)||accounts.length<1||accounts.length>MAX_USERS)fail('Configura entre 1 y 250 cuentas.');
 const available=classes(data).filter(c=>c.center===center);if(!available.length)fail('Selecciona un centro con datos.');
 const allKeys=available.map(c=>c.key),allowedKeys=new Set(allKeys),seen=new Set(),passwords=new Set();
 const p={schema:SCHEMA,projectId:previous?.projectId||id(),revision:(previous?.revision||0)+1,createdAt:new Date().toISOString(),kdf:'PBKDF2-SHA256',iterations:ITERATIONS,slots:[],compartments:[]};
 const prepared=[];
 for(const input of accounts){
  const username=normalizeUser(input.username),role=username==='orientacion'?'orientador':'tutor';if(seen.has(username))fail('Hay cuentas duplicadas.');seen.add(username);
  const allowed=role==='orientador'?allKeys:[...new Set(input.allowed||[])].sort();if(!allowed.length||allowed.some(k=>!allowedKeys.has(k)))fail('Asigna al menos un aula válida a cada cuenta.');
  const old=previous?.accounts?.find(x=>x.username===username);
  const canExportPdf=pdfPermission(input.canExportPdf,old?pdfPermission(old.canExportPdf,true):role==='orientador');
  const changing=typeof input.password==='string'&&input.password.length>0;
  if(!changing&&!old)fail('Falta una contraseña.');
  if(changing&&!validPassword(input.password,role))fail('La contraseña debe usar dos animales de la lista y dos cifras, por ejemplo Toro05Leon.');
  const verifier=changing?await digest(p.projectId+'\npassword\n'+input.password):old.verifier;
  if(passwords.has(verifier))fail('Cada cuenta debe tener una contraseña diferente.');passwords.add(verifier);
  const locator=await digest(p.projectId+'\n'+username),accessKey=changing?b64(bytes(32)):old.accessKey,salt=changing?b64(bytes(16)):old.salt;
  const wrap=changing?await seal(accessKey,await derive(input.password,salt),JSON.stringify([SCHEMA,p.projectId,'credential',locator])):old.wrap;
  prepared.push({username,role,allowed,canExportPdf,userCode:old?.userCode||'U-'+id(),auditToken:old?.auditToken||b64(bytes(32)),verifier,accessKey,salt,wrap,locator});
  onProgress('Preparando cuenta '+prepared.length+' de '+accounts.length+'…');
 }
 if(!seen.has('orientacion'))fail('El proyecto necesita la cuenta de orientación.');
 const scoped=new Map();
 for(const a of prepared){const signature=JSON.stringify([a.role,a.allowed]);if(!scoped.has(signature)){
  const compartment=id(),key=b64(bytes(32)),scopedData=snapshot(data,a.allowed);validateSnapshot(scopedData,a.allowed);
  const payload={data:scopedData};if(a.role==='orientador')payload.admin={accounts:prepared,center};
  p.compartments.push({id:compartment,box:await seal(payload,await importAes(key),aad(p,'data',compartment))});scoped.set(signature,{compartment,key});
 }
 const part=scoped.get(signature),grant={username:a.username,userCode:a.userCode,role:a.role,allowed:a.allowed,canExportPdf:a.canExportPdf,...part,maskedDni:a.role==='orientador'?'':maskDni(a.username),auditToken:a.auditToken,endpoint:auditEndpoint};
 p.slots.push({locator:a.locator,salt:a.salt,wrap:a.wrap,grant:await seal(grant,await importAes(a.accessKey),aad(p,'grant',a.locator))});
 }
 const text=MAGIC+JSON.stringify(p);if(enc.encode(text).length>MAX_BYTES)fail('El archivo protegido supera 100 MB. Reduce el número de perfiles distintos.');
 const manifest={schema:'pbis.audit-registration.v1',projectId:p.projectId,revision:p.revision,center,accounts:await Promise.all(prepared.map(async a=>({userCode:a.userCode,role:a.role,maskedDni:a.role==='orientador'?'':maskDni(a.username),label:a.role==='orientador'?'Equipo orientador':'Docente',tokenHash:await digest(a.auditToken)})))};
 return {text,manifest,projectId:p.projectId,revision:p.revision};
}
return Object.freeze({MAGIC,SCHEMA,ITERATIONS,MAX_BYTES,animals,normalizeUser,maskDni,password,validPassword,endpoint,canExportPdf,classKey,classes,snapshot,validateSnapshot,parseFile,open,build});
});
