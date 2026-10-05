(function(){
'use strict';
const C=window.PbisCore,root=document.getElementById('root'),E=C.escapeHtml;
const rosterReviews=window.PbisRosterReview.createStore();
let profile=null,books={data:null,key:null},dataset=null,view='group',selection={center:'',course:'',group:'',student:''},rosterSort={key:'student',direction:'asc'},generation=0,lastActivity=Date.now(),failures=0,blockedUntil=0;
const jobs=new Set();
const fileVersion={data:0,key:0};
const hasDemo=!!window.PBIS_DEMO_URL;
let sourceMode='none';
let closing=false,closeEventId=null,closeAbort=null,pendingReviewBatch=null;
let demoAbort=null;
const paths={brand:'<path d="M4 21V12M12 21V4M20 21V8"/>',people:'<circle cx="12" cy="7" r="3"/><path d="M6 21v-3a6 6 0 0 1 12 0v3M4 9a2.5 2.5 0 0 0 0 5M20 9a2.5 2.5 0 0 1 0 5M2 21v-2a4 4 0 0 1 2-3M22 21v-2a4 4 0 0 0-2-3"/>',person:'<circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/>',heart:'<path d="M21 4a5 5 0 0 0-7 0l-2 2-2-2a5 5 0 0 0-7 7l9 10 9-10a5 5 0 0 0 0-7Z"/>',file:'<path d="M5 2h9l5 5v15H5zM14 2v6h5M8 12h8M8 16h8"/>',ban:'<circle cx="12" cy="12" r="9"/><path d="m6 6 12 12"/>',alone:'<circle cx="12" cy="12" r="9"/><path d="M8 9h.01M16 9h.01M7 17q5-7 10 0"/>',megaphone:'<path d="M3 10h5l12-6v16L8 14H3zM8 14l2 7H6l-2-7"/>',network:'<circle cx="12" cy="4" r="2.5"/><circle cx="4" cy="20" r="2.5"/><circle cx="20" cy="20" r="2.5"/><path d="m11 7-6 10M13 7l6 10M7 20h10"/>'};
const svg=(name)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.people}</svg>`;
const brand=()=>`<div class="brand">${svg('brand')}<span>PBIS</span></div>`;
const number=x=>x===null||x===undefined||!Number.isFinite(Number(x))?'Sin datos':Number(x).toLocaleString('es-ES',{maximumFractionDigits:1});
const percent=x=>x==null?'Sin datos':`${number(x)} %`;
const known=(...x)=>x.every(v=>v!==null&&v!==undefined);
function detail(values,fn){return known(...values)?fn(...values):'Sin datos suficientes';}
function meter(value,title){if(!known(value))return '<p class="missing">Sin datos para este indicador</p>';return `<div class="meter-wrap"><span>0</span><div class="meter" role="meter" aria-label="${E(title)}" aria-valuemin="0" aria-valuemax="10" aria-valuenow="${Number(value)}"><span class="marker" style="left:${Math.max(0,Math.min(100,Number(value)*10))}%"></span></div><span>10</span></div>`;}
function score(value){return value==null?'<span class="missing">Sin datos</span>':`${number(value)}<small> / 10</small>`;}
function legend(){return '<div class="legend"><span>Menor valor</span><span class="gradient" aria-hidden="true"></span><span>Mayor valor</span></div>';}
function section(n,title,color){return `<div class="section-label ${color||''}"><span class="section-number">${n}</span><h3>${title}</h3></div>`;}
function metric(title,value,text){return `<div class="metric"><div class="metric-top"><h4>${E(title)}</h4><div class="score">${score(value)}</div></div><p>${E(text)}</p>${meter(value,title)}</div>`;}
function cancelJobs(kind){for(const job of [...jobs]){if(kind&&job.kind!==kind)continue;job.worker.terminate();URL.revokeObjectURL(job.url);clearTimeout(job.timer);jobs.delete(job);job.reject(Error('Lectura cancelada.'));}}
function clearState(){closeAbort?.abort();closeAbort=null;demoAbort?.abort();demoAbort=null;closing=false;closeEventId=null;pendingReviewBatch=null;window.PBIS_UPDATE_CLOSE=null;window.PbisFeedback.reset();rosterReviews.clear();generation++;cancelJobs();sourceMode='none';books={data:null,key:null};dataset=null;profile=null;selection={center:'',course:'',group:'',student:''};rosterSort={key:'student',direction:'asc'};view='group';root.querySelectorAll('input').forEach(x=>{x.value='';});}
function finish(message='Has cerrado la sesión. Los archivos y resultados se han retirado de esta consulta.'){clearState();login(message);}
async function reviewBatch(){
  const {sessionCode,opinions}=window.PbisFeedback.sessionSnapshot();
  const rated=rosterReviews.snapshot();
  if(!rated.length&&!opinions.length)return null;
  if(!dataset||!sessionCode||!profile)throw Error('La consulta ya no está disponible.');
  const byId=new Map(dataset.students.map(row=>[row.ID,row]));
  const roster=[];
  for(const review of rated){
    const row=byId.get(review.studentId);
    if(!row)throw Error('Una valoración no corresponde a los datos actuales.');
    const meta=dataset.groups.find(group=>group.Centro===row.Centro&&group.Curso===row.Curso&&group.Grupo===row.Grupo);
    const classCode=await window.PbisFeedbackModel.classCode({center:row.Centro,course:row.Curso,group:row.Grupo,explicitCode:meta?.ID_aula});
    roster.push({classCode,studentCode:await window.PbisReviewBatch.studentCode(classCode,row.ID),reactions:review.reactions,confidence:review.confidence});
  }
  const codedOpinions=[];
  for(const opinion of opinions)codedOpinions.push({
    classCode:opinion.classCode,
    studentCode:opinion.studentCode===null?null:await window.PbisReviewBatch.studentCode(opinion.classCode,opinion.studentCode),
    sheet:opinion.sheet,rating:opinion.rating,comment:opinion.comment
  });
  closeEventId??=window.PbisFeedbackModel.newId();
  return window.PbisReviewBatch.create({eventId:closeEventId,username:profile.username,role:profile.role,sessionCode,roster,opinions:codedOpinions});
}
function closeStatus(message,failed=false){
  let box=document.getElementById('close-status');
  if(!box){box=document.createElement('div');box.id='close-status';box.className='close-status';box.setAttribute('role','status');document.querySelector('.topbar').after(box);}
  box.replaceChildren();
  const text=document.createElement('p');text.textContent=message;box.append(text);
  if(failed){
    if(pendingReviewBatch){const save=document.createElement('button');save.type='button';save.className='quiet';save.textContent='Guardar resumen local';save.onclick=downloadReviewBatch;box.append(save);}
    const discard=document.createElement('button');discard.type='button';discard.className='quiet';discard.textContent='Cerrar sin enviar';discard.onclick=()=>finish('Sesión cerrada sin enviar las valoraciones.');box.append(discard);
  }
}
function downloadReviewBatch(){
  if(!pendingReviewBatch)return;
  const url=URL.createObjectURL(new Blob([pendingReviewBatch.message],{type:'text/plain;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download='PBIS_valoraciones_pendientes.txt';document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function reviewCount(){return rosterReviews.snapshot().reduce((total,entry)=>total+Object.keys(entry.reactions).length+(entry.confidence===null?0:1),0)+window.PbisFeedback.sessionSnapshot().opinions.length;}
function hasSessionReviews(){return reviewCount()>0;}
function updateCloseAction(){const button=document.getElementById('logout');if(!button||closing)return;const count=reviewCount();button.textContent=count?`Enviar valoraciones y cerrar · ${count}`:'Cerrar sesión';button.setAttribute('aria-label',count?`Enviar ${count} ${count===1?'valoración':'valoraciones'} y cerrar sesión`:'Cerrar sesión');}
async function closeWithReviews(){
  if(closing||!profile)return;
  const button=document.getElementById('logout');
  closing=true;button.disabled=true;button.textContent='Cerrando…';button.setAttribute('aria-label','Cerrando sesión');
  try{
    const batch=await reviewBatch();
    if(!batch){finish();return;}
    pendingReviewBatch=batch;
    if(!window.PBIS_BATCH?.endpoint)throw Error('El correo de cierre no está configurado.');
    closeStatus('Enviando las valoraciones de esta sesión…');
    closeAbort=new AbortController();
    const timer=setTimeout(()=>closeAbort?.abort(),20000);
    let response;
    try{response=await fetch(window.PBIS_BATCH.endpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(batch),credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store',redirect:'error',signal:closeAbort.signal});}
    finally{clearTimeout(timer);closeAbort=null;}
    if(!response.ok)throw Error(response.status===429?'El servicio ha limitado los envíos. Inténtalo más tarde.':'Formspree no ha confirmado el registro.');
    const receipt=await response.json();
    if(receipt.ok!==true)throw Error('Formspree no ha confirmado el registro.');
    finish('Formspree ha registrado las valoraciones de la sesión. El aviso por correo puede tardar.');
  }catch(error){
    if(!profile)return;
    lastActivity=Date.now();
    closeStatus(`No se ha podido confirmar el envío: ${error.message} La sesión permanece abierta. Si reintentas, podría llegar una copia adicional.`,true);
    button.disabled=false;button.textContent='Reintentar envío y cierre';button.setAttribute('aria-label','Reintentar envío y cierre de sesión');
  }finally{closing=false;}
}
function showHelp(){document.getElementById('help').showModal();}
document.getElementById('close-help').addEventListener('click',()=>document.getElementById('help').close());
function login(message=''){
root.innerHTML=`<main id="main" class="login"><section class="login-story">${brand()}<div><span class="eyebrow">ORIENTACIÓN Y CONVIVENCIA ESCOLAR</span><h1>Cada vínculo<br>cuenta.</h1><p class="intro">Indicadores de clase y estudiante para orientar la conversación.</p></div><svg class="login-art" viewBox="0 0 430 210" fill="none" aria-hidden="true"><path d="m62 80 104-42 79 74 110-67M62 80l52 96 131-64 97 60M166 38l-52 138M245 112l110-67M342 172 355 45" stroke="var(--turquoise)" stroke-width="1.4"/><circle cx="62" cy="80" r="21" fill="var(--lime)"/><circle cx="166" cy="38" r="14" fill="var(--blue-soft)"/><circle cx="245" cy="112" r="36" fill="var(--white)"/><circle cx="355" cy="45" r="24" fill="var(--turquoise)"/><circle cx="114" cy="176" r="27" fill="var(--blue-soft)"/><circle cx="342" cy="172" r="16" fill="var(--lime)"/><circle cx="245" cy="112" r="49" stroke="var(--turquoise)"/></svg><footer><span>4.º de Primaria → 2.º de Bachillerato</span><span>Edición de evaluación · 0.9.1</span></footer></section><section class="login-side"><div class="login-panel"><span class="pill"><span class="dot"></span>CONSULTA EN TU NAVEGADOR</span><h2>Accede a las fichas</h2>${hasDemo?`<div class="demo-access"><p>Entra con orientación y pulsa «Cargar ejemplo» para explorar datos simulados.</p><button id="demo-login" class="btn secondary" type="button">Probar con orientación <span aria-hidden="true">→</span></button></div>`:''}<p class="intro">Usa tu perfil de tutoría u orientación.</p>${message?`<p class="toast" role="status">${E(message)}</p>`:''}<form id="login-form" autocomplete="off"><label class="field">Cuenta de acceso<input id="username" name="pbis-user" autocomplete="off" autocapitalize="none" spellcheck="false" required placeholder="Tu cuenta de acceso"></label><label class="field">Contraseña<span class="password-wrap"><input id="password" name="pbis-password" type="password" autocomplete="off" required placeholder="Introduce tu contraseña"><button id="show-password" type="button" aria-label="Mostrar contraseña" aria-pressed="false">Mostrar</button></span></label><p id="login-error" class="error" role="alert"></p><button class="btn" type="submit">Entrar <span aria-hidden="true">→</span></button></form><p class="login-note">Los archivos se leen en este navegador. Las valoraciones se envían por Formspree al cerrar sesión.<br><button id="login-help" class="quiet" type="button">Cómo empezar ↗</button></p></div></section></main>`;
document.getElementById('login-help').onclick=showHelp;
if(hasDemo)document.getElementById('demo-login').onclick=()=>{document.getElementById('username').value='orientador';document.getElementById('password').value='1234';document.getElementById('login-form').requestSubmit();};
document.getElementById('show-password').onclick=function(){const input=document.getElementById('password'),show=input.type==='password';input.type=show?'text':'password';this.textContent=show?'Ocultar':'Mostrar';this.setAttribute('aria-pressed',String(show));this.setAttribute('aria-label',show?'Ocultar contraseña':'Mostrar contraseña');};
document.getElementById('login-form').onsubmit=function(event){event.preventDefault();const err=document.getElementById('login-error');if(Date.now()<blockedUntil){err.textContent='Espera unos segundos antes de volver a intentarlo.';return;}
const u=document.getElementById('username').value.trim().toLowerCase(),p=document.getElementById('password').value;
const account=window.PBIS_PROFILES.find(x=>x.username===u&&x.password===p);
document.getElementById('password').value='';if(!account){failures++;if(failures>=5){blockedUntil=Date.now()+30000;failures=0;}err.textContent='Cuenta o contraseña incorrectas. Revisa tu hoja de perfiles.';return;}
profile={...account};delete profile.password;window.PbisFeedback.startSession(profile.role);failures=0;lastActivity=Date.now();workspace();};
}
function workspace(){
root.innerHTML=`<header class="topbar"><div class="topbar-inner"><div>${brand()}<p class="brand-caption">Orientación y convivencia escolar</p></div><div class="top-actions"><div class="user-info"><strong>${E(profile.label)}</strong>${E(profile.username)}</div><button id="help-button" type="button" class="quiet">Ayuda</button><button id="logout" type="button" class="btn secondary">Cerrar sesión</button></div></div></header><main id="main" class="main"><div class="workspace-title"><div><span class="eyebrow">ESPACIO DE CONSULTA</span><h1>Comprender para acompañar.</h1><p>Explora la clase, compara los datos y abre cada ficha.</p></div><span class="pill"><span class="dot"></span>En tu navegador</span></div>${hasDemo?`<section class="demo-banner" aria-label="Prueba de concepto"><div><strong>Ejemplo para explorar las fichas</strong><p id="demo-source">Pulsa «Cargar ejemplo» para consultar los datos simulados.</p></div><button id="load-demo" class="btn secondary" type="button">Cargar ejemplo</button></section>`:''}<details id="import-details" class="upload-area" open><summary>${svg('file').replace('<svg ','<svg width="18" height="18" ')}Archivos de la consulta <span id="import-summary" class="subtle">Carga los indicadores; la llave es opcional</span></summary><div class="import-body"><div class="uploads">${upload('data','01','Datos e indicadores','Archivo .pbis o Excel con IDs, cursos, grupos e indicadores.')}${upload('key','02','Llave ID–nombre · Opcional','Añádela para mostrar nombres. Sin ella se muestran códigos.')}</div><div class="import-bottom"><button id="show-reports" class="btn" type="button" disabled>Abrir consulta <span aria-hidden="true">→</span></button><p>Indicadores .pbis, .xlsx o .xls · llave Excel opcional · máximo 20 MB por archivo.<br>Al sustituir un archivo se retiran los resultados anteriores.</p></div><p id="import-error" class="error" role="alert"></p><p id="import-status" class="status" role="status" aria-live="polite"></p></div></details><div class="results-tools"><div><span class="eyebrow">CONSULTA DEL GRUPO</span><h1>Vista de clase</h1></div><button id="change-files" class="btn secondary" type="button">Cambiar archivos</button></div><div class="tabs" role="tablist" aria-label="Tipo de ficha"><button id="tab-group" class="tab" role="tab" aria-selected="true" aria-controls="report-content" disabled>${svg('people')}Ficha de clase</button><button id="tab-roster" class="tab" role="tab" aria-selected="false" aria-controls="report-content" tabindex="-1" disabled>Lista de clase</button><button id="tab-student" class="tab" role="tab" aria-selected="false" aria-controls="report-content" tabindex="-1" disabled>${svg('person')}Ficha individual</button></div><div id="filters" class="filters hidden"></div><div id="report-content" role="tabpanel" aria-labelledby="tab-group">${empty()}</div><footer class="bottom"><span>PBIS · Edición de evaluación 0.9.1 · Los Excel permanecen en este navegador.</span><span>La lectura de los indicadores requiere contexto profesional.</span></footer></main>`;
document.getElementById('logout').onclick=closeWithReviews;document.getElementById('help-button').onclick=showHelp;
window.PBIS_UPDATE_CLOSE=updateCloseAction;
updateCloseAction();
const reportContent=document.getElementById('report-content');
reportContent.addEventListener('click',rosterReviewClick);
reportContent.addEventListener('input',rosterReviewInput);
reportContent.addEventListener('change',rosterReviewChange);
reportContent.addEventListener('pointerup',rosterReviewChange);
reportContent.addEventListener('pointerdown',rosterReviewStart);
for(const kind of ['data','key']){const sheet=document.getElementById(`sheet-${kind}`);document.getElementById(`file-${kind}`).onchange=()=>chooseFile(kind);sheet.onfocus=()=>{sheet.dataset.previous=sheet.value;};sheet.onchange=()=>{if(hasSessionReviews()){sheet.value=sheet.dataset.previous||sheet.value;closeStatus('Envía o descarta las valoraciones antes de cambiar la hoja.');return;}sheet.dataset.previous=sheet.value;invalidate('La hoja ha cambiado. Abre las fichas para validar la nueva selección.');};}
document.getElementById('show-reports').onclick=openReports;
document.getElementById('remove-key').onclick=()=>{if(hasSessionReviews()){closeStatus('Envía o descarta las valoraciones antes de retirar la llave.');return;}fileVersion.key++;cancelJobs('key');books.key=null;document.getElementById('file-key').value='';document.getElementById('sheet-key').innerHTML='';document.getElementById('sheet-key').disabled=true;invalidate('Llave retirada. Se mostrarán únicamente códigos.');if(books.data)openReports();};
if(hasDemo)document.getElementById('load-demo').onclick=loadDemo;
document.getElementById('tab-group').onclick=()=>changeView('group');document.getElementById('tab-roster').onclick=()=>changeView('roster');document.getElementById('tab-student').onclick=()=>changeView('student');
document.querySelector('.tabs').onkeydown=e=>{if(!dataset||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const views=['group','roster','student'],i=views.indexOf(view);changeView(e.key==='Home'?'group':e.key==='End'?'student':views[(i+(e.key==='ArrowRight'?1:2))%3]);document.getElementById('tab-'+view).focus();};document.getElementById('change-files').onclick=()=>{if(hasSessionReviews()){closeStatus('Envía o descarta las valoraciones antes de cambiar los archivos.');return;}document.getElementById('main').classList.remove('results-mode');document.getElementById('import-details').open=true;document.getElementById('import-details').scrollIntoView({block:'start'});};
}
async function loadDemo(){
if(!hasDemo||!profile)return;
if(hasSessionReviews()){closeStatus('Envía o descarta las valoraciones antes de volver a cargar el ejemplo.');return;}
const ticket=++generation,button=document.getElementById('load-demo');
cancelJobs();demoAbort?.abort();demoAbort=new AbortController();sourceMode='demo';
button.disabled=true;document.getElementById('demo-source').textContent='Cargando datos simulados…';
try{
  const response=await fetch(window.PBIS_DEMO_URL,{credentials:'omit',cache:'no-store',redirect:'error',signal:demoAbort.signal});
  if(!response.ok)throw Error('No se ha podido cargar el ejemplo.');
  const demo=await response.json();
  if(ticket!==generation||sourceMode!=='demo'||!profile)return;
  if(!demo||!Array.isArray(demo.students)||!Array.isArray(demo.keys)||!Array.isArray(demo.groups))throw Error('El ejemplo no tiene el formato esperado.');
  const table=(name,records)=>{const headers=[...new Set(records.flatMap(row=>Object.keys(row)))];return {name,rows:[headers,...records.map(row=>headers.map(h=>row[h]??null))]};};
  books={data:{sheets:[table('Datos',demo.students),table('Grupos',demo.groups)]},key:{sheets:[table('Llave',demo.keys)]}};
  for(const kind of ['data','key']){fileVersion[kind]++;document.getElementById(`file-${kind}`).value='';const select=document.getElementById(`sheet-${kind}`);select.innerHTML=books[kind].sheets.map(x=>`<option value="${E(x.name)}">${E(x.name)}</option>`).join('');select.disabled=false;}
  invalidate('Ejemplo simulado preparado en este navegador.');document.getElementById('demo-source').textContent='Datos simulados activos · Elige centro, curso y grupo.';openReports();
}catch(error){if(ticket===generation&&sourceMode==='demo'&&profile){sourceMode='none';document.getElementById('demo-source').textContent=error.name==='AbortError'?'Carga cancelada.':'No se ha podido cargar el ejemplo. Comprueba la conexión y vuelve a intentarlo.';}}
finally{if(ticket===generation&&button.isConnected){button.disabled=false;demoAbort=null;}}
}
function upload(kind,num,title,desc){return `<section class="upload-card"><div class="upload-heading"><span class="upload-index">${num}</span><h3>${title}</h3></div><p>${desc}</p><label class="field"><span class="hidden">${title}</span><input type="file" id="file-${kind}" accept="${kind==='data'?'.pbis,.xlsx,.xls':'.xlsx,.xls'}" aria-label="${title}"></label><label class="field sheet-field">Hoja del archivo<select id="sheet-${kind}" disabled aria-label="${kind==='data'?'Hoja de indicadores':'Hoja de nombres'}"></select></label>${kind==='key'?'<button id="remove-key" type="button" class="quiet">Consultar sin nombres · Retirar llave</button>':''}</section>`;}
function empty(text=hasDemo&&sourceMode==='none'?'Pulsa «Cargar ejemplo» o selecciona tu archivo de indicadores y después «Abrir consulta».':'Selecciona los indicadores. La llave de nombres es opcional. Después pulsa «Abrir consulta».'){return `<section class="empty-state"><span class="empty-icon">${svg('network')}</span><h2>Una mirada que empieza por los datos.</h2><p>${E(text)}</p></section>`;}
function invalidate(message='Los archivos han cambiado. Valida la selección para continuar.'){
window.PbisFeedback.closeContext();
rosterReviews.clear();
rosterSort={key:'student',direction:'asc'};
dataset=null;document.getElementById('main').classList.remove('results-mode');document.getElementById('filters').classList.add('hidden');document.getElementById('filters').innerHTML='';document.getElementById('report-content').innerHTML=empty();document.getElementById('import-summary').textContent='Consulta pendiente de validar';document.getElementById('import-error').textContent='';document.getElementById('import-status').className='status';document.getElementById('import-status').textContent=message;document.getElementById('tab-group').disabled=true;document.getElementById('tab-roster').disabled=true;document.getElementById('tab-student').disabled=true;document.getElementById('show-reports').disabled=!books.data||(!books.key&&document.getElementById('file-key').files.length>0);
}
async function parseFile(file,kind,current){const buffer=await file.arrayBuffer();if(!current())throw Error('Lectura cancelada.');return new Promise((resolve,reject)=>{const url=URL.createObjectURL(new Blob([window.PBIS_PARSER],{type:'text/javascript'}));const worker=new Worker(url);const job={worker,url,reject,kind,timer:null};const close=()=>{worker.terminate();URL.revokeObjectURL(url);clearTimeout(job.timer);jobs.delete(job);};job.timer=setTimeout(()=>{close();reject(Error('La lectura ha tardado demasiado. Reduce el tamaño del archivo.'));},30000);jobs.add(job);worker.onmessage=e=>{close();e.data.error?reject(Error(e.data.error)):resolve(e.data);};worker.onerror=()=>{close();reject(Error('El navegador no ha podido leer el archivo. Abre PBIS.html con una versión actual de Chrome, Edge, Firefox o Safari.'));};worker.postMessage(buffer,[buffer]);});}
async function chooseFile(kind){
if(hasSessionReviews()){document.getElementById(`file-${kind}`).value='';closeStatus('Envía o descarta las valoraciones antes de cambiar los archivos.');return;}
if(sourceMode==='demo'){demoAbort?.abort();const other=kind==='data'?'key':'data';books={data:null,key:null};fileVersion[other]++;cancelJobs(other);document.getElementById(`file-${other}`).value='';document.getElementById(`sheet-${other}`).innerHTML='';document.getElementById(`sheet-${other}`).disabled=true;}
sourceMode='files';if(hasDemo)document.getElementById('demo-source').textContent='Consulta con tus archivos · La llave de nombres es opcional; cárgala por separado. El ejemplo se ha retirado.';

const file=document.getElementById(`file-${kind}`).files[0];const ticket=++fileVersion[kind],session=generation,current=()=>ticket===fileVersion[kind]&&session===generation&&!!profile;cancelJobs(kind);books[kind]=null;const select=document.getElementById(`sheet-${kind}`);select.innerHTML='';select.disabled=true;invalidate(file?'Leyendo el archivo en este equipo…':'Carga los indicadores para continuar; la llave es opcional.');if(!file)return;
try{if(!(kind==='data'?/\.(pbis|xlsx|xls)$/i:/\.(xlsx|xls)$/i).test(file.name))throw Error(kind==='data'?'Selecciona un archivo .pbis (Excel renombrado), .xlsx o .xls.':'La llave debe ser un Excel .xlsx o .xls.');if(file.size>20*1024*1024)throw Error('El archivo supera los 20 MB. Prepara una copia con las hojas necesarias.');const book=await parseFile(file,kind,current);if(!current())return;books[kind]=book;const valid=book.sheets.filter(x=>!x.unsupported);if(!valid.length)throw Error('No hay hojas compatibles: el máximo es 10.000 registros y 100 columnas por hoja, con un millón de celdas en total.');select.innerHTML=valid.map(x=>`<option value="${E(x.name)}">${E(x.name)}</option>`).join('');select.disabled=false;const preferred=kind==='data'?'Datos':'Llave';if(valid.some(x=>x.name===preferred))select.value=preferred;invalidate('Archivo preparado. Selecciona las hojas y pulsa «Abrir consulta».');}
catch(error){if(!current())return;books[kind]=null;document.getElementById('import-error').textContent=error.message;document.getElementById('import-status').textContent='';document.getElementById('show-reports').disabled=true;}
}
function rowsFor(book,name){const sheet=book.sheets.find(x=>x.name===name);if(!sheet||sheet.unsupported)throw Error(`La hoja ${name} no es compatible.`);const rows=sheet.rows;if(!rows.length)throw Error(`La hoja ${name} está vacía.`);const headers=rows[0].map(x=>String(x??'').trim());const used=headers.filter(Boolean);if(new Set(used).size!==used.length)throw Error(`La hoja ${name} tiene encabezados repetidos.`);if(headers.some(x=>['__proto__','prototype','constructor'].includes(x)))throw Error('La hoja contiene un encabezado no permitido.');if(rows.length>10001)throw Error(`La hoja ${name} supera los 10.000 registros admitidos.`);return rows.slice(1).filter(row=>row.some(x=>x!==null&&x!==''&&x!==undefined)).map(row=>{const result=Object.create(null);headers.forEach((h,i)=>{if(h)result[h]=row[i]??null;});return result;});}
function openReports(){
try{const data=rowsFor(books.data,document.getElementById('sheet-data').value),key=books.key?rowsFor(books.key,document.getElementById('sheet-key').value):null,meta=books.data.sheets.some(x=>x.name==='Grupos')?rowsFor(books.data,'Grupos'):[];
const all=C.validateAndJoin(data,key,meta);const scoped=C.scopeRows(all.students,profile);if(!scoped.length)throw Error('Estos archivos no contienen estudiantes de tu perfil. Comprueba el centro, curso y grupo de la hoja de perfiles.');dataset={students:scoped,groups:all.groups.filter(g=>scoped.some(s=>s.Campus===g.Campus&&s.Curso===g.Curso&&s.Grupo===g.Grupo)),warnings:all.warnings};
const preferred=scoped.find(row=>row.Nombre==='Ana M.')||scoped[0];selection={center:profile.center||preferred.Campus,course:profile.course||preferred.Curso,group:profile.group||preferred.Grupo,student:preferred.ID};document.getElementById('import-error').textContent='';document.getElementById('import-status').textContent=`${scoped.length.toLocaleString('es-ES')} estudiantes disponibles para tu perfil. ${all.warnings.join(' ')}`;document.getElementById('import-status').className='status success';document.getElementById('import-summary').textContent=`${scoped.length.toLocaleString('es-ES')} estudiantes · ${books.key?'Con llave de nombres':'Consulta por códigos'}`;document.getElementById('import-details').open=false;document.getElementById('tab-group').disabled=false;document.getElementById('tab-roster').disabled=false;document.getElementById('tab-student').disabled=false;view='group';document.getElementById('main').classList.add('results-mode');changeView('group');document.getElementById('tab-group').focus();}
catch(error){dataset=null;document.getElementById('filters').innerHTML='';document.getElementById('filters').classList.add('hidden');document.getElementById('report-content').innerHTML=empty('Revisa el mensaje de validación y revisa los indicadores y, si la has añadido, la llave de nombres.');document.getElementById('import-error').textContent=error.message;document.getElementById('import-status').textContent='';document.getElementById('import-details').open=true;}
}
const studentLabel=r=>r.Nombre?`${r.Nombre} · ${r.ID}`:`Estudiante · ${r.ID}`;
const unique=a=>[...new Set(a)];
function selectMarkup(id,label,options,chosen,extra=''){return `<label class="field ${extra}">${label}<select id="${id}">${options.map(x=>`<option value="${E(x.value??x)}" ${(x.value??x)===chosen?'selected':''}>${E(x.label??x)}</option>`).join('')}</select></label>`;}
function currentRows(){return dataset.students.filter(x=>x.Campus===selection.center&&x.Curso===selection.course&&x.Grupo===selection.group);}
function renderFilters(){const centers=unique(dataset.students.map(x=>x.Campus)).sort((a,b)=>a.localeCompare(b,'es'));if(!centers.includes(selection.center))selection.center=centers[0];const courses=unique(dataset.students.filter(x=>x.Campus===selection.center).map(x=>x.Curso)).sort((a,b)=>{const ai=C.COURSE_ORDER.indexOf(a),bi=C.COURSE_ORDER.indexOf(b);return (ai<0?99:ai)-(bi<0?99:bi)||a.localeCompare(b,'es');});if(!courses.includes(selection.course))selection.course=courses[0];const groups=unique(dataset.students.filter(x=>x.Campus===selection.center&&x.Curso===selection.course).map(x=>x.Grupo)).sort();if(!groups.includes(selection.group))selection.group=groups[0];const students=currentRows().slice().sort((a,b)=>(a.Nombre||'').localeCompare(b.Nombre||'','es')||a.ID.localeCompare(b.ID));if(!students.some(x=>x.ID===selection.student))selection.student=(students.find(x=>x.Nombre==='Ana M.')||students[0]).ID;
const filters=document.getElementById('filters');filters.className=`filters ${view==='student'?'individual':''}`;filters.innerHTML=selectMarkup('center','Centro de enseñanza',centers,selection.center)+selectMarkup('course','Curso',courses,selection.course)+selectMarkup('group','Grupo',groups,selection.group)+(view==='student'?`<label class="field student-search">Buscar estudiante<input id="student-search" type="search" placeholder="${books.key?'Nombre o código':'Código de estudiante'}" autocomplete="off"></label>`+selectMarkup('student','Estudiante',students.map(x=>({value:x.ID,label:studentLabel(x)})),selection.student,'student-select'):'');
for(const kind of ['center','course','group'])document.getElementById(kind).onchange=e=>{selection[kind]=e.target.value;renderFilters();renderReport();document.getElementById(kind).focus();};if(view==='student'){document.getElementById('student').onchange=e=>{selection.student=e.target.value;renderReport();};document.getElementById('student-search').oninput=e=>{const term=e.target.value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const found=students.filter(x=>`${x.Nombre} ${x.ID}`.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(term));document.getElementById('student').innerHTML=found.length?found.map(x=>`<option value="${E(x.ID)}">${E(studentLabel(x))}</option>`).join(''):'<option value="">Sin coincidencias</option>';document.getElementById('student').disabled=!found.length;if(found.length){selection.student=found[0].ID;renderReport();}else document.getElementById('report-content').innerHTML=empty('No hay estudiantes que coincidan con la búsqueda. Prueba otro nombre o ID.');};}}
function changeView(next){if(!dataset)return;view=next;for(const [id,chosen]of[['tab-group',next==='group'],['tab-roster',next==='roster'],['tab-student',next==='student']]){document.getElementById(id).setAttribute('aria-selected',String(chosen));document.getElementById(id).tabIndex=chosen?0:-1;}document.getElementById('report-content').setAttribute('aria-labelledby','tab-'+next);renderFilters();renderReport();}
function reportHero(title,subtitle,type){return `<header class="report-hero"><div><span class="eyebrow">${E(selection.center)} · PBIS</span><h2>${E(title)}</h2><p>${E(subtitle)}</p></div><div class="hero-type">${type}</div></header>`;}
function reading(normalized=true){return `<div class="reading"><span><strong>${normalized?'Indicadores normalizados':'Indicadores suministrados'}</strong> · escala 0–10</span>${legend()}</div>`;}
function renderReport(){if(!dataset)return;window.PbisFeedback.closeContext();const rows=currentRows(),meta=dataset.groups.find(g=>g.Campus===selection.center&&g.Curso===selection.course&&g.Grupo===selection.group);document.getElementById('report-content').innerHTML=`<div class="feedback-toolbar"><button id="open-feedback" class="feedback-trigger" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M21 11a9 9 0 0 1-9 9H3l2-5a9 9 0 1 1 16-4Z"/><path d="M8 9h8M8 13h5"/></svg>Valorar esta ficha</button></div>`+(view==='group'?groupReport(rows,meta)+'<div class="class-next"><button id="open-roster" class="btn" type="button">Ver lista de clase →</button></div>':view==='roster'?rosterReport(rows):studentReport(rows.find(x=>x.ID===selection.student)||rows[0]));if(view==='group')document.getElementById('open-roster').onclick=()=>changeView('roster');if(view==='roster')document.querySelectorAll('.student-link[data-student-id]').forEach(button=>button.onclick=()=>{selection.student=button.dataset.studentId;changeView('student');document.getElementById('report-content').scrollIntoView({block:'start'});});if(view==='student')document.getElementById('back-to-roster').onclick=()=>changeView('roster');document.getElementById('open-feedback').onclick=async function(){const button=this,ticket=generation,type=view==='student'?'individual':view==='roster'?'roster':'group',studentCode=type==='individual'?selection.student:null;button.disabled=true;try{const classCode=await window.PbisFeedbackModel.classCode({center:selection.center,course:selection.course,group:selection.group,explicitCode:meta?.ID_aula});if(ticket===generation&&button.isConnected)window.PbisFeedback.open({sheet:type,classCode,studentCode});}catch(error){if(button.isConnected){let issue=document.createElement('p');issue.className='feedback-issue';issue.setAttribute('role','alert');issue.textContent=error.message;button.parentElement.append(issue);}}finally{if(button.isConnected)button.disabled=false;}};}
function groupReport(rows,meta){const g=C.aggregate(rows,meta),icons=['megaphone','people','alone','ban','heart'];const countSupport=(x)=>known(x)?`${number(x)} <small>de ${number(g.supportKnown)}</small>`:'<span class="missing">Sin datos</span>';const structure=(title,position)=>`<div class="mini-card"><h4>${title}</h4><div class="stat">${score(position)}</div>${meter(position,title)}</div>`;return `<article class="report">${reportHero(`${selection.course} · ${selection.group}`,`${g.n} estudiantes · ${g.responses==null?'Respuestas sin cobertura completa':g.responses+' respuestas'}${g.period?' · '+g.period:''}`,'Ficha de clase')}<div class="report-body">${reading(g.normalized)}<section class="section-panel panel-attention">${section('01','Señales de atención')}<div>${g.attention.map((a,i)=>`<div class="attention-row${a.id.startsWith('bullying_')?' is-bullying':''}"><span class="icon-bubble">${svg(icons[i])}</span><div class="attention-title"><h4>${E(a.title)}</h4><p>${E(a.description)}</p></div><div class="stat ${a.percent==null?'missing':''}">${percent(a.percent)}</div><div class="attention-scale"><div class="meter-label">${a.score==null?'Sin escala disponible':number(a.score)+' / 10'}</div>${meter(a.score,a.title)}</div></div>`).join('')}</div><p class="section-note">Una misma persona puede figurar en ambas fuentes: no sumes los recuentos. Son señales, no diagnósticos. Aquí no se define un umbral de bienestar.</p></section><section class="section-panel panel-connections">${section('02','Grupos e integración','panel-connections')}<div class="integration-grid"><div class="mini-card"><h4>Grupos de amistad</h4><div class="stat">${g.communities?g.communities.length:'<span class="missing">Sin datos</span>'}</div>${g.communities?`<div class="community-bar" aria-hidden="true">${g.communities.map(c=>`<span style="flex:${c.count}"></span>`).join('')}</div><p>${g.communities.map(c=>`${E(c.name)}: ${c.count}`).join(' · ')} estudiantes</p>`:'<p>Se requiere una asignación de comunidad completa.</p>'}</div>${structure('Separación entre grupos',meta?.pos_separacion)}${structure('Desigualdad de popularidad',meta?.pos_desigualdad)}${structure('Centralización del grupo',meta?.pos_centralizacion)}</div><p class="section-note">Varios grupos no implican conflicto; importa cómo se conectan. Las medidas estructurales proceden de la hoja Grupos.</p></section><section class="section-panel panel-context">${section('03','Mediación y convivencia','panel-context')}<div class="mediation-grid"><div><h4>Estudiantes con reconocimiento<br>en mediación</h4><div class="stat">${number(g.mediators.count)}</div><p>Al menos una nominación de otras personas del grupo. ${number(g.mediators.denominator)} registros conocidos.</p></div><div><h4>Identifican<br>a quién acudir</h4><div class="stat">${countSupport(g.supportYes)}</div><p>${g.supportKnown?percent(g.supportYes/g.supportKnown*100):'Sin datos'} de las respuestas válidas.</p></div><div><h4>No identifican<br>a quién acudir</h4><div class="stat">${countSupport(g.supportNo)}</div><p>${g.supportKnown?percent(g.supportNo/g.supportKnown*100):'Sin datos'} de las respuestas válidas.</p></div></div><p class="section-note">La mediación se interpreta junto al nivel de conflicto. Una ausencia de respuesta no cuenta como «No».</p></section><p class="report-footer">${g.normalized?'Escalas normalizadas, no percentiles entre centros.':`Puntuaciones suministradas${meta?.salones_referencia?' · Referencia: '+number(meta.salones_referencia)+' grupos':''}. Requieren conocer su método de cálculo.`} Consulta las definiciones y fórmulas en el diccionario del Excel. Los porcentajes muestran sus denominadores válidos.</p></div></article>`;}
function cellTone(value,kind){
  if(value==null)return 'tone-missing';
  if(kind==='self')return value==='Sí'?'tone-danger':'tone-calm';
  if(kind==='peer')return value>0?'tone-danger':'tone-calm';
  if(kind==='happiness')return value<3.4?'tone-danger':value<6.7?'tone-caution':'tone-calm';
  return 'tone-neutral';
}
function classCell(value,kind,unit=''){
  const content=value==null?'Sin datos':`${kind==='self'?E(value):number(value)}${unit}`;
  return `<span class="class-value ${cellTone(value,kind)}">${content}</span>`;
}
const reviewChoices=[['ok','👍','OK'],['mal','👎','Revisar'],['sorpresa','😮','Me sorprende']];
const rosterColumns=[
  ['bullying_self','Se señala','bullying_autorreporte','self'],
  ['bullying_peers','Le señalan','bullying_companeros_n','peer'],
  ['happiness','Felicidad','felicidad','happiness'],
  ['friendship_out','Amistades que nombra','amistad_declarada_n','count'],
  ['friendship_in','Le nombran como amistad','amistad_recibida_n','count'],
  ['rejection_out','Rechazos que nombra','rechazo_declarado_n','count'],
  ['rejection_in','Le nombran en rechazo','rechazo_recibido_n','count']
];
function reviewCell(row,column,rowIndex){
  const [key,label,field,kind]=column;
  const value=key==='bullying_self'&&row.respondio==='No'?null:row[field];
  const selected=rosterReviews.get(row.ID).reactions[key];
  const person=row.Nombre||`código ${row.ID}`;
  const selectedLabel=reviewChoices.find(([reaction])=>reaction===selected)?.[2]||'';
  const optionsId=`review-options-${rowIndex}-${key}`;
  const buttons=reviewChoices.map(([reaction,emoji,text])=>`<button type="button" class="reaction-button reaction-${reaction}" data-roster-reaction="${reaction}" data-student-id="${E(row.ID)}" data-indicator="${key}" aria-label="${E(`${text}: ${label} de ${person}`)}" aria-pressed="${selected===reaction}" title="${E(text)}"><span aria-hidden="true">${emoji}</span></button>`).join('');
  return `<div class="review-cell"><button type="button" class="review-value" data-roster-open aria-expanded="false" aria-controls="${optionsId}" aria-label="${E(`Valorar ${label} de ${person}`)}">${classCell(value,kind,key==='happiness'&&value!=null?' / 10':'')}<span class="review-chevron" aria-hidden="true">⌄</span></button><span class="review-current" ${selected?'':'hidden'}>${E(selectedLabel)}</span><div id="${optionsId}" class="reaction-group" role="group" aria-label="${E(`Tu valoración de ${label} de ${person}`)}" hidden>${buttons}</div></div>`;
}
const confidenceLabel=value=>value===null?'Sin valorar':`${value>0?'+':''}${number(value)}`;
function confidenceCell(row){
  const value=rosterReviews.get(row.ID).confidence;
  const person=row.Nombre||`código ${row.ID}`;
  return `<div class="confidence-control"><input type="range" min="-5" max="5" step="0.1" value="${value??0}" data-roster-confidence data-student-id="${E(row.ID)}" aria-label="${E(`Confianza en los datos de ${person}, de menos cinco a más cinco`)}"><div class="confidence-scale"><span>−5</span><span>0</span><span>+5</span></div><div class="confidence-result"><output aria-live="polite">${confidenceLabel(value)}</output><button type="button" class="confidence-clear" data-roster-clear data-student-id="${E(row.ID)}" aria-label="Quitar valoración de confianza de ${E(person)}" ${value===null?'hidden':''}>Quitar</button></div></div>`;
}
function rosterReport(rows){
  const ordered=window.PbisRosterReview.sortRows(rows,rosterSort,rosterReviews);
  const sortHeader=(key,label)=>{const active=rosterSort.key===key;const direction=active?rosterSort.direction:'none';const arrow=active?(direction==='asc'?'↑':'↓'):'↕';return `<th scope="col" aria-sort="${direction==='asc'?'ascending':direction==='desc'?'descending':'none'}"><button type="button" class="roster-sort" data-roster-sort="${key}" aria-label="Ordenar por ${E(label)}" title="Ordenar por ${E(label)}">${E(label)} <span aria-hidden="true">${arrow}</span></button></th>`;};
  const header=rosterColumns.map(([key,label])=>sortHeader(key,label)).join('');
  const body=ordered.map((row,rowIndex)=>`<tr data-student-id="${E(row.ID)}"><th scope="row"><button type="button" class="student-link" data-student-id="${E(row.ID)}">${E(row.Nombre||'Estudiante')}<span>${E(row.ID)}</span></button></th>${rosterColumns.map(column=>`<td>${reviewCell(row,column,rowIndex)}</td>`).join('')}<td>${confidenceCell(row)}</td></tr>`).join('');
  return `<article class="report">${reportHero(`${selection.course} · ${selection.group}`,`${rows.length} estudiantes · ${selection.center}`,'Lista de clase')}<div class="report-body"><p class="roster-intro">Pulsa una columna para ordenar. Selecciona un dato para valorarlo o un nombre para abrir su ficha. La confianza (−5 a +5) no modifica los indicadores.</p><p class="roster-scroll-hint">Desliza la tabla para ver más indicadores →</p><div class="roster-scroll" tabindex="0" aria-label="Tabla de estudiantes del grupo, desplazable horizontalmente"><table class="roster-table"><thead><tr>${sortHeader('student','Estudiante')}${header}${sortHeader('confidence','Confianza en los datos')}</tr></thead><tbody>${body}</tbody></table></div><details class="roster-method"><summary>Cómo se leen estos datos</summary><p>Felicidad: centro y diversión (0–4), más soledad invertida (4–0); la suma se expresa de 0 a 10. «Se señala» es la respuesta personal sobre acoso; «Le señalan» cuenta otras personas. Las valoraciones del profesorado se guardan por separado.</p></details></div></article>`;
}
function updateRosterOrder(){
  if(view!=='roster'||!dataset)return;
  const table=document.querySelector('#report-content .roster-table');
  if(!table)return;
  const body=table.tBodies[0];
  const elements=new Map([...body.rows].map(row=>[row.dataset.studentId,row]));
  body.append(...window.PbisRosterReview.sortRows(currentRows(),rosterSort,rosterReviews).map(row=>elements.get(row.ID)).filter(Boolean));
  table.querySelectorAll('thead th').forEach(th=>{const button=th.querySelector('[data-roster-sort]');const active=button.dataset.rosterSort===rosterSort.key;th.setAttribute('aria-sort',active?(rosterSort.direction==='asc'?'ascending':'descending'):'none');button.querySelector('span').textContent=active?(rosterSort.direction==='asc'?'↑':'↓'):'↕';});
}
function rosterReviewChange(event){
  if(event.target.matches('input[data-roster-confidence]')&&rosterSort.key==='confidence')updateRosterOrder();
}
function rosterReviewInput(event){
  const slider=event.target.closest('input[data-roster-confidence]');
  if(!slider||!currentRows().some(row=>row.ID===slider.dataset.studentId))return;
  const value=Math.round(Number(slider.value)*10)/10;
  rosterReviews.setConfidence(slider.dataset.studentId,value);
  updateCloseAction();
  const control=slider.closest('.confidence-control');
  control.querySelector('output').textContent=confidenceLabel(value);
  control.querySelector('[data-roster-clear]').hidden=false;
}
function rosterReviewClick(event){
  const sortButton=event.target.closest('button[data-roster-sort]');
  if(sortButton){rosterSort=window.PbisRosterReview.nextSort(rosterSort,sortButton.dataset.rosterSort);updateRosterOrder();return;}
  const opener=event.target.closest('button[data-roster-open]');
  if(opener){
    const group=opener.parentElement.querySelector('.reaction-group');
    const willOpen=group.hidden;
    document.querySelectorAll('#report-content .reaction-group:not([hidden])').forEach(item=>{item.hidden=true;item.parentElement.querySelector('[data-roster-open]').setAttribute('aria-expanded','false');});
    group.hidden=!willOpen;
    opener.setAttribute('aria-expanded',String(willOpen));
    return;
  }
  const reaction=event.target.closest('button[data-roster-reaction]');
  if(reaction&&currentRows().some(row=>row.ID===reaction.dataset.studentId)){
    const {studentId,indicator,rosterReaction}=reaction.dataset;
    const selected=rosterReviews.toggle(studentId,indicator,rosterReaction);
    updateCloseAction();
    const cell=reaction.closest('.review-cell');
    const group=cell.querySelector('.reaction-group');
    group.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.rosterReaction===selected)));
    const current=cell.querySelector('.review-current');
    current.textContent=reviewChoices.find(([choice])=>choice===selected)?.[2]||'';
    current.hidden=!selected;
    group.hidden=true;
    const valueButton=cell.querySelector('[data-roster-open]');
    valueButton.setAttribute('aria-expanded','false');
    valueButton.focus();
    return;
  }
  const clear=event.target.closest('button[data-roster-clear]');
  if(clear&&currentRows().some(row=>row.ID===clear.dataset.studentId)){
    rosterReviews.setConfidence(clear.dataset.studentId,null);
    updateCloseAction();
    const control=clear.closest('.confidence-control');
    control.querySelector('input').value='0';
    control.querySelector('output').textContent='Sin valorar';
    clear.hidden=true;
    if(rosterSort.key==='confidence')updateRosterOrder();
  }
}
function rosterReviewStart(event){
  const slider=event.target.closest('input[data-roster-confidence]');
  if(!slider||!currentRows().some(row=>row.ID===slider.dataset.studentId))return;
  if(rosterReviews.get(slider.dataset.studentId).confidence===null){
    rosterReviews.setConfidence(slider.dataset.studentId,Number(slider.value));
    updateCloseAction();
    const control=slider.closest('.confidence-control');
    control.querySelector('output').textContent=confidenceLabel(Number(slider.value));
    control.querySelector('[data-roster-clear]').hidden=false;
  }
}
function studentReport(r){
  const self=r.respondio==='No'?'No respondió':r.bullying_autorreporte;
  const name=r.Nombre||`Estudiante · ${r.ID}`;
  const item=(title,value,tone,unit='')=>`<div class="summary-item"><span>${title}</span>${classCell(value,tone,unit)}</div>`;
  return `<article class="report">${reportHero(name,`${r.Curso} · ${r.Grupo} · ID ${r.ID}`,'Ficha individual')}<div class="report-body"><button id="back-to-roster" class="quiet back-list" type="button">← Volver a la lista de clase</button><h3 class="summary-heading">Indicadores principales</h3><div class="summary-grid"><section class="summary-panel summary-alert"><h4>Acoso escolar</h4>${item('Se señala',self,'self')}${item('Le señalan otras personas',r.bullying_companeros_n,'peer')}</section><section class="summary-panel"><h4>Felicidad</h4>${item('Índice de tres respuestas',r.felicidad,'happiness',r.felicidad==null?'':' / 10')}<p>Centro y diversión; soledad con puntuación invertida.</p></section><section class="summary-panel"><h4>Relaciones en la clase</h4>${item('Amistades que nombra',r.amistad_declarada_n,'count')}${item('Le nombran como amistad',r.amistad_recibida_n,'count')}${item('Rechazos que nombra',r.rechazo_declarado_n,'count')}${item('Le nombran en rechazo',r.rechazo_recibido_n,'count')}</section></div><details class="expanded-details"><summary>Ver más indicadores</summary>${studentReportExpanded(r)}</details></div></article>`;
}

function studentReportExpanded(r){const self=r.respondio==='No'?'No respondió':r.bullying_autorreporte;const normalized=r.escala_indicadores==='normalizada_v1';const pred=t=>detail([r[`pred_${t}_aciertos`],r[`pred_${t}_n`]],(a,n)=>n?`${a} de ${n} predicciones correctas`:'Sin predicciones declaradas');return `<div class="expanded-report">${reading(normalized)}<div class="network-grid"><section class="section-panel panel-connections">${section('01','Red de amistad','panel-connections')}${metric('Popularidad',r.popularidad,detail([r.amistad_recibida_n],n=>`Recibe ${n} nominaciones de amistad`))}${metric('Sociabilidad declarada',r.sociabilidad,detail([r.amistad_declarada_n],n=>`Indica vínculos de amistad con ${n} estudiantes`))}${metric('Reciprocidad',r.reciprocidad_amistad,detail([r.amistad_reciproca_n,r.amistad_declarada_n],(a,b)=>b?`${a} de sus ${b} elecciones son correspondidas`:'Sin elecciones declaradas'))}${metric('Acierto de sus predicciones',r.acierto_amistad,pred('amistad'))}</section><section class="section-panel panel-context">${section('02','Red de rechazo','panel-context')}${metric('Rechazo recibido',r.rechazo_recibido,detail([r.rechazo_recibido_n],n=>`Recibe ${n} nominaciones de rechazo`))}${metric('Rechazo declarado',r.rechazo_declarado,detail([r.rechazo_declarado_n],n=>`Nombra a ${n} estudiantes en la red de rechazo`))}${metric('Reciprocidad del rechazo',r.reciprocidad_rechazo,detail([r.rechazo_reciproco_n,r.rechazo_declarado_n],(a,b)=>b?`${a} de sus ${b} elecciones son correspondidas`:'Sin elecciones declaradas'))}${metric('Acierto de sus predicciones',r.acierto_rechazo,pred('rechazo'))}</section></div>${section('03','Bienestar y papel en el grupo')}<div class="well-grid">${metric('Bienestar personal',r.bienestar,detail([r.bienestar_suma],n=>`Suma de respuestas: ${n}/12 · Durante la última semana`)).replace('class="metric"','class="metric wide"')}${metric('Centralidad',r.centralidad,'Posición estructural en la red de amistad')}${metric('Reconocimiento en mediación',r.mediacion,detail([r.mediacion_n],n=>`${n} estudiantes le identifican como referente en mediación`))}</div><section class="bullying-box"><h3>Señales de acoso escolar</h3><div class="bullying-grid"><div><h4>Respuesta personal</h4><div class="stat">${E(self??'Sin datos')}</div><p>${self==='No respondió'?'No consta participación en el cuestionario.':self==='Sí'?'Indica que ha sufrido acoso escolar.':self==='No'?'Indica que no ha sufrido acoso escolar.':'No consta respuesta a esta pregunta.'}</p></div><div><h4>Información del grupo</h4><div class="stat">${detail([r.bullying_companeros_n],n=>`${n} <small>de ${r['.n_clase']-1}</small>`)}</div><p>Estudiantes del grupo que indican que ha sufrido acoso escolar. La respuesta personal se registra por separado.</p></div></div></section><p class="report-footer">${normalized?'Las puntuaciones reflejan proporciones o medidas normalizadas, no posiciones percentiles.':'Puntuaciones suministradas en el Excel.'} Esta ficha debe interpretarse con contexto y junto a la visión del grupo. No establece diagnósticos ni decisiones automáticas.</p></div>`;}
for(const event of ['pointerdown','keydown','wheel','touchstart'])document.addEventListener(event,()=>{lastActivity=Date.now();},{passive:true});
setInterval(()=>{if(profile&&Date.now()-lastActivity>15*60*1000)finish('La consulta se ha cerrado tras 15 minutos sin actividad. Vuelve a entrar para continuar.');},5000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&profile&&Date.now()-lastActivity>15*60*1000)finish('La sesión ha caducado por inactividad.');});
window.addEventListener('pagehide',()=>{clearState();root.replaceChildren();});
window.addEventListener('pageshow',event=>{if(event.persisted)login('La consulta anterior se ha cerrado. Vuelve a identificarte.');});
login();
})();
