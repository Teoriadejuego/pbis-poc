(function(){
'use strict';
const C=window.PbisCore,N=window.PbisStudentNetwork,G=window.PbisClassNetwork,root=document.getElementById('root'),E=C.escapeHtml;
const rosterReviews=window.PbisRosterReview.createStore();
let profile=null,books={data:null},dataset=null,view='group',selection={center:'',course:'',group:'',student:''},rosterSort={key:'student',direction:'asc'},generation=0,lastActivity=Date.now(),entryCredentials=null;
const jobs=new Set();
const fileVersion={data:0};
const demoAccount=window.PBIS_DEMO_ACCOUNT||{username:'demo',password:'DEMO26'};
const hasDemo=!!(window.PBIS_DEMO_URL||window.PBIS_DEMO_DATA);
let demoSession=false,closeDestination='login';
let sourceMode='none';
let closing=false,closeEventId=null,closeAbort=null,pendingReviewBatch=null,pendingReviewSignature=null;
let demoAbort=null;
let tour=null;
let protectedSession=null,accessAudit=null,auditTimer=null,finishing=false,watermarkObserver=null;
function removeProjectSession(){if(auditTimer!==null)clearInterval(auditTimer);auditTimer=null;watermarkObserver?.disconnect();watermarkObserver=null;accessAudit?.dispose();accessAudit=null;protectedSession=null;document.querySelectorAll('.protected-watermark,.protected-audit-status,.protected-dialog').forEach(x=>{if(x.tagName==='DIALOG')x.close();x.remove();});}
function projectWatermark(){
 document.querySelectorAll('.protected-watermark').forEach(x=>x.remove());
 if(!protectedSession||protectedSession.grant.role==='orientador')return;
 const overlay=document.createElement('div');overlay.className='protected-watermark';overlay.setAttribute('aria-hidden','true');
 const label=protectedSession.grant.maskedDni+' · '+accessAudit.sessionId.slice(0,8);
 for(let i=0;i<24;i++){const span=document.createElement('span');span.textContent=label;overlay.append(span);}document.body.append(overlay);
 const markDialogs=()=>document.querySelectorAll('dialog[open]').forEach(d=>{if(!d.querySelector('.protected-watermark'))d.append(overlay.cloneNode(true));});
 watermarkObserver=new MutationObserver(markDialogs);watermarkObserver.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open']});markDialogs();
}
async function activateProtected(session,fileName,buffer,current=()=>true){
 const sha256=await window.PbisLinkedFeedback.fingerprint(buffer);if(!current())return;clearState();protectedSession=session;
 profile={username:session.grant.userCode,role:session.grant.role,center:null,course:null,group:null,label:session.grant.role==='orientador'?'Equipo orientador':'Docente · '+session.grant.maskedDni};
 window.PbisFeedback.startSession(profile.role);sourceMode='protected';lastActivity=Date.now();workspace();
 dataset={students:session.data.students.map(r=>({...r,Nombre:C.displayName(r.Nombre)})),groups:session.data.groups,warnings:[]};
 books={data:{sha256,sheets:[]}};document.getElementById('sheet-data').innerHTML='<option>Proyecto protegido</option>';
 document.getElementById('import-details').hidden=true;document.getElementById('change-files').hidden=true;
 const first=dataset.students[0];selection={center:first.Centro,course:first.Curso,group:first.Grupo,student:first.ID};
 for(const id of ['tab-group','tab-roster','tab-student','tab-center']){const button=document.getElementById(id);if(button)button.disabled=false;}
 document.getElementById('main').classList.add('results-mode');changeView('group');
 const note=document.createElement('div');note.className='protected-audit-status';note.setAttribute('role','status');document.querySelector('.topbar').after(note);
 accessAudit=window.PbisAccessAudit.create({endpoint:session.grant.endpoint,projectId:session.projectId,revision:session.revision,userCode:session.grant.userCode,role:session.grant.role,maskedDni:session.grant.maskedDni,token:session.grant.auditToken,fileName,onStatus:message=>{if(note.isConnected)note.textContent=message;}});
 accessAudit.enqueue('open');projectWatermark();
 auditTimer=setInterval(()=>{if(!document.hidden&&Date.now()-lastActivity<5*60*1000)accessAudit?.enqueue('activity');else accessAudit?.flush();},5*60*1000);
 document.getElementById('tab-group').focus();
}
function administerProject(){
 if(profile?.role!=='orientador'||demoSession)return;
 const ticket=generation;
 window.PbisProjectUI.showAdmin({previous:protectedSession?.admin||null,loadBook:async file=>{
  if(!/\.(xlsx|xls|pbis)$/i.test(file.name)||file.size>20*1024*1024)throw Error('Selecciona un Excel compatible de hasta 20 MB.');
  return parseFile(file,'admin',()=>ticket===generation&&profile?.role==='orientador');
 },convertSheet:(book,name)=>{let data=rowsFor(book,name),groups=book.sheets.some(s=>s.name==='Grupos')?rowsFor(book,'Grupos'):[];
  if(window.PbisWave1.isWave1(data)){const converted=window.PbisWave1.convert(data);data=converted.students;groups=converted.groups;}
  return C.validateAndJoin(data,null,groups);
 }});
}
const paths={brand:'<path d="M4 21V12M12 21V4M20 21V8"/>',people:'<circle cx="12" cy="7" r="3"/><path d="M6 21v-3a6 6 0 0 1 12 0v3M4 9a2.5 2.5 0 0 0 0 5M20 9a2.5 2.5 0 0 1 0 5M2 21v-2a4 4 0 0 1 2-3M22 21v-2a4 4 0 0 0-2-3"/>',person:'<circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/>',heart:'<path d="M21 4a5 5 0 0 0-7 0l-2 2-2-2a5 5 0 0 0-7 7l9 10 9-10a5 5 0 0 0 0-7Z"/>',file:'<path d="M5 2h9l5 5v15H5zM14 2v6h5M8 12h8M8 16h8"/>',ban:'<circle cx="12" cy="12" r="9"/><path d="m6 6 12 12"/>',alone:'<circle cx="12" cy="12" r="9"/><path d="M8 9h.01M16 9h.01M7 17q5-7 10 0"/>',megaphone:'<path d="M3 10h5l12-6v16L8 14H3zM8 14l2 7H6l-2-7"/>',network:'<circle cx="12" cy="4" r="2.5"/><circle cx="4" cy="20" r="2.5"/><circle cx="20" cy="20" r="2.5"/><path d="m11 7-6 10M13 7l6 10M7 20h10"/>'};
const svg=(name)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.people}</svg>`;
const brand=()=>`<button class="brand brand-home" type="button" aria-label="PBIS: cerrar sesión y volver al inicio">${svg('brand')}<span>PBIS</span></button>`;
const number=x=>x===null||x===undefined||!Number.isFinite(Number(x))?'Sin datos':Number(x).toLocaleString('es-ES',{maximumFractionDigits:1});
const percent=x=>x==null?'Sin datos':`${number(x)} %`;
const known=(...x)=>x.every(v=>v!==null&&v!==undefined);
function detail(values,fn){return known(...values)?fn(...values):'Sin datos suficientes';}
function meter(value,title){if(!known(value))return '<p class="missing">Sin datos para este indicador</p>';return `<div class="meter-wrap"><span>0</span><div class="meter" role="meter" aria-label="${E(title)}" aria-valuemin="0" aria-valuemax="10" aria-valuenow="${Number(value)}"><span class="marker" style="left:${Math.max(0,Math.min(100,Number(value)*10))}%"></span></div><span>10</span></div>`;}
function score(value){return value==null?'<span class="missing">Sin datos</span>':`${number(value)}<small> / 10</small>`;}
function legend(){return '<div class="legend"><span>Menor valor</span><span class="gradient" aria-hidden="true"></span><span>Mayor valor</span></div>';}
function networkCoverageNote(row){const pending=row?.red_centro_pendiente_pct;return typeof pending==='number'&&pending>0?`<p class="network-coverage-note">Faltan respuestas sobre relaciones del ${E(number(pending))} % del centro.</p>`:'';}
function section(n,title,color){return `<div class="section-label ${color||''}"><span class="section-number">${n}</span><h3>${title}</h3></div>`;}
function metric(title,value,text,missingLabel){const valueHtml=value==null&&missingLabel?`<span class="missing">${E(missingLabel)}</span>`:score(value);return `<div class="metric"><div class="metric-top"><h4>${E(title)}</h4><div class="score">${valueHtml}</div></div><p>${E(text)}</p>${value==null&&missingLabel?'':meter(value,title)}</div>`;}
function cancelJobs(kind){for(const job of [...jobs]){if(kind&&job.kind!==kind)continue;job.worker.terminate();URL.revokeObjectURL(job.url);clearTimeout(job.timer);jobs.delete(job);job.reject(Error('Lectura cancelada.'));}}
function clearState(){entryCredentials=null;removeProjectSession();stopTour();demoSession=false;closeDestination='login';closeAbort?.abort();closeAbort=null;demoAbort?.abort();demoAbort=null;closing=false;closeEventId=null;pendingReviewBatch=null;pendingReviewSignature=null;document.getElementById('review-send-dialog')?.remove();window.PBIS_UPDATE_CLOSE=null;window.PbisFeedback.reset();rosterReviews.clear();generation++;cancelJobs();sourceMode='none';books={data:null};dataset=null;profile=null;selection={center:'',course:'',group:'',student:''};rosterSort={key:'student',direction:'asc'};view='group';root.querySelectorAll('input').forEach(x=>{x.value='';});}
async function finish(message='Sesión cerrada. Los datos se han retirado de la consulta.',destination='login'){
 if(finishing)return;finishing=true;
 try{if(accessAudit){const audit=accessAudit;document.getElementById('main')?.setAttribute('inert','');closeStatus('Cerrando la consulta…');await Promise.race([audit.enqueue('close'),new Promise(resolve=>setTimeout(resolve,2200))]);if(audit.pending())message+=' El cierre no se ha confirmado en el registro de accesos.';}
 clearState();demoSession=false;closeDestination='login';login(message);if(destination==='home')window.location.assign(window.PBIS_HOME||'index.html');}finally{finishing=false;}
}
function bindBrand(){document.querySelectorAll('.brand-home').forEach(button=>button.onclick=()=>profile?requestSessionClose('home'):finish('','home'));}
async function enterDemo(guided=false){
  if(!hasDemo)return;
  if(profile&&hasSessionReviews()&&!demoSession){closeStatus('Envía o descarta las valoraciones antes de abrir la demo.');return;}
  if(profile&&!demoSession&&['files','protected'].includes(sourceMode)){closeStatus('Cierra tu consulta antes de abrir la demo.');return;}
  clearState();demoSession=true;profile={username:'demo',role:'orientador',center:null,course:null,group:null,label:'Demo · datos simulados'};
  window.PbisFeedback.startSession('orientador',{demo:true});lastActivity=Date.now();workspace();
  if(guided){tour={step:'load',lastStep:''};renderTour();}else await loadDemo();
}
async function reviewBatch(){
  if(demoSession)return null;
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
    if(review.nonParticipation&&!window.PbisRosterReview.isNonRespondent(row))throw Error('El motivo de no participación solo corresponde a una encuesta sin responder.');
    roster.push({target:{center:row.Centro,course:row.Curso,group:row.Grupo,studentId:row.ID,period:meta?.Periodo??null},values:row,reactions:review.reactions,confidence:review.confidence,...(review.nonParticipation?{nonParticipation:review.nonParticipation}:{})});
  }
  const source={sha256:books.data.sha256,sheet:document.getElementById('sheet-data').value};
  const signature=JSON.stringify({sessionCode,source,roster:roster.map(r=>({...r,values:Object.fromEntries(['respondio',...Object.values(window.PbisLinkedFeedback.fields).map(f=>f[0])].map(k=>[k,r.values[k]??null]))})),opinions});
  if(pendingReviewBatch&&pendingReviewSignature===signature)return pendingReviewBatch;
  if(pendingReviewBatch)closeEventId=null;
  closeEventId??=window.PbisFeedbackModel.newId();
  const batch=window.PbisLinkedFeedback.create({eventId:closeEventId,username:profile.username,role:profile.role,sessionCode,source,version:window.PBIS_FEEDBACK.version,roster,opinions});
  pendingReviewBatch=batch;pendingReviewSignature=signature;
  return batch;
}
function closeStatus(message,failed=false){
  let box=document.getElementById('close-status');
  if(!box){box=document.createElement('div');box.id='close-status';box.className='close-status';box.setAttribute('role','status');document.querySelector('.topbar').after(box);}
  box.replaceChildren();
  const text=document.createElement('p');text.textContent=message;box.append(text);
  if(failed){
    if(pendingReviewBatch){const save=document.createElement('button');save.type='button';save.className='quiet';save.textContent='Guardar copia JSON';save.onclick=downloadReviewBatch;box.append(save);}
    const retry=document.createElement('button');retry.type='button';retry.className='quiet';retry.textContent='Revisar y reintentar';retry.onclick=()=>showReviewPreview();box.append(retry);
    const discard=document.createElement('button');discard.type='button';discard.className='quiet';discard.textContent='Cerrar sin enviar';discard.onclick=()=>finish('Sesión cerrada sin enviar las valoraciones.',closeDestination);box.append(discard);
  }
}
function downloadReviewBatch(){
  if(!pendingReviewBatch)return;
  const url=URL.createObjectURL(new Blob([pendingReviewBatch.feedback_json],{type:'application/json;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download='PBIS_feedback_'+pendingReviewBatch.eventId+'.json';document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  closeStatus('Copia JSON preparada. Comprueba que se ha descargado; descargarla no envía las valoraciones.');
}
function reviewCount(){return rosterReviews.snapshot().reduce((total,entry)=>total+Object.keys(entry.reactions).length+(entry.confidence===null?0:1)+(entry.nonParticipation?1:0),0)+window.PbisFeedback.sessionSnapshot().opinions.length;}
function draftCount(){return window.PbisFeedback.draftCount?.()||0;}
function hasSessionReviews(){return reviewCount()>0||draftCount()>0;}
function updateCloseAction(){const button=document.getElementById('logout');if(!button||closing)return;const count=reviewCount(),drafts=draftCount();button.textContent='Cerrar sesión';button.setAttribute('aria-label',button.textContent);
  let preview=document.getElementById('review-send-preview');
  if(!demoSession&&(count||drafts)){if(!preview){button.insertAdjacentHTML('beforebegin','<button id="review-send-preview" type="button" class="quiet">Revisar y enviar</button>');preview=document.getElementById('review-send-preview');}preview.textContent=`Revisar y enviar · ${count}${drafts?' + borrador':''}`;preview.onclick=()=>showReviewPreview();}
  else preview?.remove();
  let state=document.getElementById('review-pending-state');
  if(!demoSession&&(count||drafts)){
    if(!state){state=document.createElement('p');state.id='review-pending-state';state.className='review-pending-state';state.setAttribute('role','status');document.querySelector('.topbar').append(state);}
    const status=`${count} valoraciones pendientes${drafts?` · ${drafts} opiniones sin añadir`:''}. Envío automático tras 15 min sin actividad${drafts?'; revisa antes los borradores':''}.`;
    if(state.textContent!==status)state.textContent=status;
  }
  else state?.remove();
}
async function requestSessionClose(destination='login'){
  if(closing||!profile)return;
  window.PbisFeedback.closeContext();
  if(!demoSession&&hasSessionReviews())return showReviewPreview(destination);
  return closeWithReviews(destination);
}
async function showReviewPreview(destination=null){
  try{
    if(closing||!profile||demoSession)return;
    window.PbisFeedback.closeContext();
    const batch=await reviewBatch(),drafts=draftCount();if(!batch&&!drafts)return;
    document.getElementById('review-send-dialog')?.remove();
    const dialog=document.createElement('dialog');dialog.id='review-send-dialog';dialog.className='review-send-dialog';dialog.setAttribute('aria-labelledby','review-send-title');
    dialog.innerHTML=`<div class="feedback-heading"><h2 id="review-send-title">Revisa antes de enviar</h2><button type="button" class="quiet" id="review-preview-close">Volver a la consulta</button></div><p>Compartirás con el equipo PBIS, mediante Formspree, tu cuenta, centro, curso, aula, código de estudiante, valoraciones y valores de los indicadores valorados. Se incluyen la versión y una huella del archivo. No se adjuntan nombres ni el Excel completo. Revisa también que tus comentarios no identifiquen personas.</p><p>Destino: ${E(window.PBIS_FEEDBACK.recipient)} · ${E(batch?.recordCount||0)} registros.</p>${drafts?`<p role="alert">Tienes ${drafts} opiniones sin añadir. Revísalas o descártalas antes de enviar.</p><div class="review-send-actions"><button id="review-draft-open" type="button" class="btn secondary">Revisar borrador</button><button id="review-draft-discard" type="button" class="quiet">Descartar borradores</button></div>`:''}<pre id="review-preview-content"></pre><div class="review-send-actions"><button id="review-preview-send" type="button" class="btn" ${!batch||drafts?'disabled':''}>${destination?'Enviar y cerrar sesión':'Enviar valoraciones'}</button><button id="review-preview-save" type="button" class="btn secondary" ${!batch||drafts?'disabled':''}>Guardar copia JSON</button>${destination?'<button id="review-preview-discard" type="button" class="quiet">Cerrar sin enviar</button>':''}</div><p class="subtle">${destination?'Cerrar sin enviar elimina las valoraciones de esta sesión.':'Tras el envío podrás seguir consultando las fichas.'} Una copia JSON se recupera con el importador del proyecto; no vuelve a cargar la consulta.</p>`;
    document.body.append(dialog);document.getElementById('review-preview-content').textContent=batch?.message||'No hay valoraciones añadidas todavía.';
    document.getElementById('review-preview-close').onclick=()=>dialog.close();
    document.getElementById('review-preview-save').onclick=downloadReviewBatch;
    document.getElementById('review-preview-send').onclick=()=>{dialog.close();return closeWithReviews(destination||'login',!destination);};
    if(destination)document.getElementById('review-preview-discard').onclick=()=>finish('Sesión cerrada sin enviar las valoraciones.',destination);
    if(drafts){document.getElementById('review-draft-open').onclick=()=>{dialog.close();window.PbisFeedback.openDraft();};document.getElementById('review-draft-discard').onclick=()=>{window.PbisFeedback.discardDrafts();updateCloseAction();dialog.close();if(!hasSessionReviews()&&destination)finish('Sesión cerrada sin enviar las valoraciones.',destination);else if(hasSessionReviews())showReviewPreview(destination);};}
    dialog.showModal();
  }catch(error){closeStatus(error.message);}
}
async function closeWithReviews(destination='login',keepOpen=false){
  if(closing||!profile)return;
  const sendGeneration=generation;
  closeDestination=destination==='home'?'home':'login';
  const completedPractice=demoSession&&tour?.step==='close';
  // Training marks never become part of an outgoing review batch.
  if(tour)stopTour();
  const button=document.getElementById('logout');
  closing=true;button.disabled=true;button.textContent='Cerrando…';button.setAttribute('aria-label','Cerrando sesión');
  document.getElementById('main').inert=true;document.querySelector('.topbar').inert=true;
  try{
    const batch=await reviewBatch();
    if(!batch){await finish(completedPractice?'Práctica completada. Has cerrado la sesión: las fichas se han retirado y las valoraciones de práctica se han eliminado.':demoSession?'Demo cerrada. Las valoraciones de práctica se han eliminado.':undefined,closeDestination);return;}
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
    if(sendGeneration!==generation)return;
    if(receipt.ok!==true)throw Error('Formspree no ha confirmado el registro.');
    if(keepOpen){rosterReviews.clear();window.PbisFeedback.acknowledge();pendingReviewBatch=null;pendingReviewSignature=null;closeEventId=null;renderReport();closeStatus('Formspree ha confirmado el registro. Puedes seguir consultando. El aviso por correo puede tardar.');}
    else await finish('Formspree ha confirmado el registro. El aviso por correo puede tardar.',closeDestination);
  }catch(error){
    if(!profile||sendGeneration!==generation)return;
    lastActivity=Date.now();
    closeStatus(pendingReviewBatch?`No se ha podido confirmar el envío: ${error.message} La sesión permanece abierta. Si reintentas, podría llegar una copia adicional.`:`${error.message} No se ha enviado ninguna valoración. La sesión permanece abierta.`,true);
  }finally{if(sendGeneration===generation){closing=false;button.disabled=false;updateCloseAction();const main=document.getElementById('main'),bar=document.querySelector('.topbar');if(main)main.inert=false;if(bar)bar.inert=false;}}
}
function showHelp(){document.getElementById('help').showModal();}
document.getElementById('close-help').addEventListener('click',()=>document.getElementById('help').close());
const tourClass={center:'',course:'1.º ESO',group:'A'};
function tourRow(id){return dataset?.students.find(row=>row.ID===id);}
function tourAtClass(){return !!dataset&&selection.center===tourClass.center&&selection.course===tourClass.course&&selection.group===tourClass.group;}
function stopTour(){
  if(!tour)return;
  document.querySelectorAll('.tour-target').forEach(element=>element.classList.remove('tour-target'));
  document.getElementById('tour-panel')?.remove();
  // Every reaction and slider movement made while learning is a disposable exercise.
  rosterReviews.clear();tour=null;updateCloseAction();
  if(dataset&&view==='roster')renderReport();
}
function tourMove(step){if(!tour)return;tour.step=step;tour.lastStep='';renderTour();}
function tourTarget(){
  const target={login:'#login-form',load:'#load-demo',class:'#filters',group:'#tab-roster',sort:'[data-roster-sort="bullying_peers"]',reaction:'tr[data-student-id="00280"] td:nth-child(3) [data-roster-open]',practice:'tr[data-student-id="00280"] td:nth-child(3) [data-roster-open]',compare:'tr[data-student-id="00280"]',ana:'tr[data-student-id="00253"] .student-link','student-bullying':'.summary-wide','student-wellbeing':'.summary-wellbeing','student-relations':'.summary-friendship','student-details':'.expanded-details > summary',network:'.student-network',center:'#report-content',close:'#logout',confidence:'tr[data-student-id="00253"] [data-roster-confidence]'};
  return document.querySelector(target[tour?.step]||'#__tour_no_target');
}
function renderTour(){
  if(!tour)return;
  const samuel=tourRow('00280'),ana=tourRow('00253');
  const steps={
    login:['1 de 16','Entra en la cuenta demo',`Cuenta: ${demoAccount.username} · Contraseña: ${demoAccount.password}. Escríbelas y pulsa «Entrar». Esta cuenta solo utiliza archivos de prueba.`],
    load:['2 de 16','Carga un ejemplo','Pulsa «Cargar datos demo». Estos datos son simulados y no representan a estudiantes reales.'],
    class:['3 de 16','Elige el aula del ejercicio',`En los filtros selecciona ${tourClass.center} → ${tourClass.course} → ${tourClass.group}. Avanzaremos cuando coincidan los tres campos.`],
    group:['4 de 16','Lee primero las señales','La ficha empieza por preguntas sobre acoso, bienestar y relaciones. Cada respuesta indica su fuente y cobertura. Pulsa «Lista de aula».'],
    sort:['5 de 16','Ordena para encontrar una señal','En la lista, pulsa «Menciones de acoso recibidas» hasta que el orden sea descendente. Verás primero los recuentos mayores.'],
    reaction:['6 de 16','Contrasta dos respuestas',`${samuel?.Nombre||'Samuel L.'} no declara haber sufrido acoso y recibe ${number(samuel?.bullying_companeros_n)} menciones de acoso. La diferencia merece contraste profesional, no una conclusión automática. Pulsa ese dato y marca «Me sorprende».`],
    compare:['7 de 16','Mira otra dimensión',`${ana?.Nombre||'Ana M.'} recibe ${number(ana?.amistad_recibida_n)} menciones de buenas relaciones. Es una medida distinta: nunca compenses una señal de atención con buenas relaciones. Muestra su fila para seguir.`, 'Mostrar a Ana'],
    ana:['8 de 16','Abre su ficha','Pulsa el nombre de Ana en la lista. Su resumen empieza por señales de acoso, bienestar y buenas relaciones.'],
    'student-bullying':['9 de 16','Separa las fuentes de acoso',`${ana?.Nombre||'Ana M.'} responde «${ana?.bullying_autorreporte??'Sin datos'}» y recibe ${number(ana?.bullying_companeros_n)} menciones de acoso. Son fuentes distintas; ni el color ni un cero establecen un diagnóstico.`, 'Continuar: bienestar'],
    'student-wellbeing':['10 de 16','Bienestar','Aquí aparecen las tres respuestas originales. La soledad se invierte solo al calcular el índice; la respuesta que ves no se modifica.', 'Continuar: relaciones'],
    'student-relations':['11 de 16','Relaciones',`${ana?.Nombre||'Ana M.'} recibe ${number(ana?.amistad_recibida_n)} menciones de buenas relaciones. Las buenas relaciones mutuas son aquellas que ambas personas declaran.`, 'Continuar: más indicadores'],
    'student-details':['12 de 16','Amplía con contexto','Pulsa «Ver más indicadores» para consultar posición, mediación, el test de impulsividad y otros indicadores relacionales.'],
    network:['13 de 16','Observa las relaciones','El estudiante aparece en el centro. Azul indica una buena relación y rojo una mala relación; las flechas salen de quien nombra. Pulsa + para ampliar y Ajustar para ver la red completa. Las tarjetas abren las fichas; el borde discontinuo indica otra aula.','Ver ficha de centro'],
    center:['14 de 16','Amplía la mirada al centro','Orientación puede ver los totales del centro. Los recuentos de mediación distinguen menciones de buena y mala mediación. Después vuelve al ejercicio para valorar tu confianza en los datos.','Volver a la lista'],
    confidence:['15 de 16','Valora tu confianza en los datos','Busca la fila de Ana y mueve el control «Confianza en los datos» entre −5 y +5. Es tu apreciación, separada de las respuestas.'],
    practice:['Ejercicio esencial','Valora un dato de la lista',`${samuel?.Nombre||'Samuel L.'} no declara haber sufrido acoso y recibe ${number(samuel?.bullying_companeros_n)} menciones de acoso. Pulsa «Menciones de acoso recibidas» en su fila y elige «Me sorprende». No implica un diagnóstico.`],
    close:['16 de 16','Termina revisando tus valoraciones','Pulsa «Cerrar sesión», arriba, para terminar. En una consulta con tu cuenta, este botón permite revisar tus comentarios y valoraciones antes de enviarlos al equipo PBIS: espera la confirmación antes de cerrar la pestaña. También retira las fichas de la pantalla. Ahora practicarás el cierre; no se enviarán datos de esta demo.']
  };
  const [progress,title,description,action]=steps[tour.step]||['Preparando','Cargando el ejemplo','Espera a que se muestren los datos simulados.'];
  let panel=document.getElementById('tour-panel');if(!panel){panel=document.createElement('aside');panel.id='tour-panel';panel.className='tour-panel';panel.setAttribute('aria-label','Práctica guiada de PBIS');document.body.append(panel);}
  panel.classList.toggle('tour-navigation',['group','close'].includes(tour.step));
  panel.classList.toggle('tour-student-summary',['student-bullying','student-wellbeing','student-relations'].includes(tour.step));
  panel.innerHTML=`<div class="tour-top"><span class="eyebrow">PRÁCTICA GUIADA · ${E(progress)}</span><button id="tour-skip" type="button" class="quiet">${['close','practice','confidence'].includes(tour.step)?'Cerrar guía':'Saltar al ejercicio de valoración'}</button></div><h2>${E(title)}</h2><p>${E(description)}</p>${action?`<button id="tour-action" class="btn" type="button">${E(action)}</button>`:''}<p class="tour-note">Solo datos simulados · Las marcas de práctica no se enviarán.</p>`;
  panel.setAttribute('aria-live','polite');
  panel.querySelector('#tour-skip').onclick=()=>['close','practice','confidence'].includes(tour.step)?stopTour():jumpToValuation();
  if(action)panel.querySelector('#tour-action').onclick=()=>{
    if(tour.step==='compare'){tourMove('ana');}
    else if(tour.step==='student-bullying')tourMove('student-wellbeing');
    else if(tour.step==='student-wellbeing')tourMove('student-relations');
    else if(tour.step==='student-relations')tourMove(document.querySelector('.expanded-details')?.open?'network':'student-details');
    else if(tour.step==='network'){tour.step='center';changeView('center');}
    else if(tour.step==='center'){tour.step='confidence';placeTourClass();tourMove('confidence');}
  };
  document.querySelectorAll('.tour-target').forEach(element=>element.classList.remove('tour-target'));
  const target=tourTarget();if(target){target.classList.add('tour-target');if(tour.lastStep!==tour.step)target.scrollIntoView({block:tour.step.startsWith('student-')?'start':'center',inline:'nearest'});}
  tour.lastStep=tour.step;
}
function startTour(){
  if(!hasDemo)return;
  if(!profile){tour={step:'login',lastStep:''};login();renderTour();return;}
  if(hasSessionReviews()){closeStatus('Finaliza o descarta las valoraciones pendientes antes de iniciar la práctica.');return;}
  if(profile&&sourceMode==='files'){closeStatus('La práctica utiliza el ejemplo simulado. Cierra esta consulta antes de iniciarla.');return;}
  if(!demoSession){clearState();tour={step:'login',lastStep:''};login();renderTour();return;}
  tour={step:profile?(dataset?'class':'load'):'login',lastStep:''};
  if(dataset){selection={center:tourClass.center,course:'4.º Primaria',group:'A',student:''};changeView('group');}
  renderTour();
}
function placeTourClass(){
  if(!dataset)return false;
  const exists=dataset.students.some(row=>row.Campus===tourClass.center&&row.Curso===tourClass.course&&row.Grupo===tourClass.group);
  if(!exists)return false;
  selection.center=tourClass.center;selection.course=tourClass.course;selection.group=tourClass.group;selection.student='00280';
  changeView('roster');return true;
}
async function jumpToValuation(){
  if(!hasDemo)return;
  if(!tour&&hasSessionReviews()){closeStatus('Finaliza o descarta las valoraciones pendientes antes de iniciar otra práctica.');return;}
  if(!demoSession){await enterDemo(false);if(!dataset)return;}
  if(profile&&sourceMode==='files'){closeStatus('El ejercicio utiliza datos simulados. Cierra esta consulta antes de empezarlo.');return;}
  if(tour){rosterReviews.clear();updateCloseAction();}
  tour={step:'quick-loading',lastStep:'',quickStart:true};
  if(!profile)return;
  if(!dataset){renderTour();await loadDemo();return;}
  if(sourceMode!=='demo'||!placeTourClass()){stopTour();return;}
  tourMove('practice');
}
function login(message=''){
root.innerHTML=`<main id="main" class="login"><section class="login-story">${brand()}<div><span class="eyebrow">ORIENTACIÓN Y CONVIVENCIA ESCOLAR</span><h1>Cada vínculo<br>cuenta.</h1><p class="intro">Indicadores de aula y estudiante para orientar la conversación.</p></div><svg class="login-art" viewBox="0 0 430 210" fill="none" aria-hidden="true"><path d="m62 80 104-42 79 74 110-67M62 80l52 96 131-64 97 60M166 38l-52 138M245 112l110-67M342 172 355 45" stroke="var(--turquoise)" stroke-width="1.4"/><circle cx="62" cy="80" r="21" fill="var(--lime)"/><circle cx="166" cy="38" r="14" fill="var(--blue-soft)"/><circle cx="245" cy="112" r="36" fill="var(--white)"/><circle cx="355" cy="45" r="24" fill="var(--turquoise)"/><circle cx="114" cy="176" r="27" fill="var(--blue-soft)"/><circle cx="342" cy="172" r="16" fill="var(--lime)"/><circle cx="245" cy="112" r="49" stroke="var(--turquoise)"/></svg><footer><span>4.º de Primaria → 2.º de Bachillerato</span><span>Edición de evaluación · 0.11.0</span></footer></section><section class="login-side"><div class="login-panel"><span class="pill"><span class="dot"></span>CONSULTA EN TU NAVEGADOR</span><h2>Accede a las fichas</h2>${hasDemo?`<div class="demo-access"><button id="start-tour-login" class="btn" type="button">Comenzar práctica guiada →</button></div>`:''}<p class="intro">Introduce tu usuario y contraseña. Los permisos se comprueban al cargar el archivo.</p>${message?`<p class="toast" role="status">${E(message)}</p>`:''}<form id="login-form" autocomplete="off"><label class="field">Usuario o DNI<input id="username" name="pbis-user" autocomplete="off" autocapitalize="none" spellcheck="false" required placeholder="Tu cuenta de acceso"></label><label class="field">Contraseña<span class="password-wrap"><input id="password" name="pbis-password" type="password" autocomplete="off" required placeholder="Introduce tu contraseña"><button id="show-password" type="button" aria-label="Mostrar contraseña" aria-pressed="false">Mostrar</button></span></label><p id="login-error" class="error" role="alert"></p><button class="btn" type="submit">Entrar <span aria-hidden="true">→</span></button></form><p class="login-note">Los archivos se leen en este navegador. Puedes revisar y enviar las valoraciones a PBIS. Tras 15 minutos sin actividad se intentan enviar automáticamente por Formspree.<br><button id="login-help" class="quiet" type="button">Cómo empezar ↗</button></p></div></section></main>`;
bindBrand();
document.getElementById('login-help').onclick=showHelp;
if(hasDemo){
  document.getElementById('start-tour-login').onclick=startTour;
}
document.getElementById('show-password').onclick=function(){const input=document.getElementById('password'),show=input.type==='password';input.type=show?'text':'password';this.textContent=show?'Ocultar':'Mostrar';this.setAttribute('aria-pressed',String(show));this.setAttribute('aria-label',show?'Ocultar contraseña':'Mostrar contraseña');};
document.getElementById('login-form').onsubmit=function(event){event.preventDefault();
const username=document.getElementById('username').value.trim(),password=document.getElementById('password').value,u=username.toLowerCase();
if(!username||!password){document.getElementById('login-error').textContent='Introduce tu usuario y contraseña para continuar.';return;}
if(hasDemo&&u===demoAccount.username&&password.trim().toUpperCase()===demoAccount.password)return enterDemo(true);
const account=window.PBIS_PROFILES.find(x=>x.username===u&&x.password===password.trim().toUpperCase());
// Credentials are provisional until a file is authorized. Never infer a role from its name.
entryCredentials={username,password,legacyAccount:!!account};document.getElementById('password').value='';
demoSession=false;profile=account?{...account}:{username:'',role:'pending',label:'Acceso pendiente'};delete profile.password;
if(account)window.PbisFeedback.startSession(profile.role);else window.PbisFeedback.reset();
lastActivity=Date.now();workspace();if(tour?.step==='login')tour.quickStart?jumpToValuation():tourMove('load');else if(tour?.step==='quick-loading')jumpToValuation();};
}
function canViewCenter(){return profile?.role==='orientador';}
function renderAccounts(showKeys=false){
  if(profile?.role!=='orientador'||demoSession)return;
  const dialog=document.getElementById('accounts-dialog');
  if(!dialog)return;
  const accounts=window.PBIS_PROFILES.slice().sort((a,b)=>a.role===b.role?C.compareCourses(a.course||'',b.course||''):a.role==='orientador'?-1:1);
  dialog.innerHTML=`<div class="accounts-heading"><div><span class="eyebrow">GESTIÓN DE ACCESOS · PILOTO</span><h2>Cuentas y contraseñas</h2></div><button id="close-accounts" class="quiet" type="button">Cerrar ×</button></div><p>Orientación consulta todas las cuentas y entrega cada contraseña a la persona autorizada. Las cuentas por curso consultan todas sus aulas. Las cuentas PDC I y PDC II consultan solo su curso y aula.</p><div class="accounts-actions"><button id="toggle-account-keys" class="btn secondary" type="button">${showKeys?'Ocultar contraseñas':'Mostrar contraseñas'}</button></div><div class="accounts-scroll"><table class="accounts-table"><thead><tr><th>Cuenta</th><th>Alcance</th><th>Contraseña</th></tr></thead><tbody>${accounts.map(account=>`<tr><td><strong>${E(account.username)}</strong></td><td>${E(account.role==='orientador'?'Todos los cursos, centros y aulas':account.course+(account.group?' · '+account.group+' · todos los centros':' · todos los centros y aulas'))}</td><td><code>${showKeys?E(account.password):'••••••'}</code></td></tr>`).join('')}</tbody></table></div><p class="accounts-note">Estas contraseñas están incluidas en el código de esta edición pública de prueba. Para datos reales hace falta autenticación gestionada fuera del navegador.</p>`;
  document.getElementById('close-accounts').onclick=()=>dialog.close();
  document.getElementById('toggle-account-keys').onclick=()=>renderAccounts(!showKeys);
}
function workspace(){
root.innerHTML=`<header class="topbar"><div class="topbar-inner"><div>${brand()}<p class="brand-caption">Orientación y convivencia escolar</p></div><div class="top-actions"><div class="user-info"><strong>${E(profile.label)}</strong>${E(profile.username)}</div><button id="help-button" type="button" class="quiet">Ayuda</button><button id="logout" type="button" class="btn secondary">Cerrar sesión</button></div></div></header>${demoSession?'<div class="demo-mode-note"><span><strong>Modo demo</strong> · Datos simulados. Las valoraciones son de práctica.</span><button id="demo-account" type="button" class="quiet">Acceder con mi cuenta →</button></div>':''}<main id="main" class="main"><div class="workspace-title"><div><span class="eyebrow">ESPACIO DE CONSULTA</span><h1>Comprender para acompañar.</h1><p>Explora el aula, compara los datos y abre cada ficha.</p></div><span class="pill"><span class="dot"></span>En tu navegador</span></div>${hasDemo&&demoSession?`<section class="demo-banner" aria-label="Prueba de concepto"><div><strong>Ejemplo para explorar las fichas</strong><p id="demo-source">Pulsa «Cargar datos demo» para consultar los datos simulados.</p></div><button id="load-demo" class="btn secondary" type="button">Cargar datos demo</button></section>`:''}<details id="import-details" class="upload-area${demoSession?' hidden':''}" open><summary>${svg('file').replace('<svg ','<svg width="18" height="18" ')}Archivos de la consulta <span id="import-summary" class="subtle">Carga el archivo de datos</span></summary><div class="import-body"><div class="uploads">${upload('data','01','Abrir proyecto','Selecciona tu archivo .pbis o Excel. Comprobaremos el acceso antes de mostrar las fichas.')}</div><div class="import-bottom"><button id="show-reports" class="btn" type="button" disabled>Abrir consulta <span aria-hidden="true">→</span></button><p>Excel: hasta 20 MB · Proyecto cifrado: hasta 100 MB.<br>Al sustituir el archivo se retiran los resultados anteriores.</p></div><p id="import-error" class="error" role="alert"></p>${demoSession?'':'<button id="change-access" class="quiet" type="button">Cambiar usuario o contraseña</button>'}<p id="import-status" class="status" role="status" aria-live="polite"></p>${demoSession?'':'<p class="subtle">Si el proyecto tiene registro de uso activado, se comunicarán el código de cuenta, DNI parcial, nombre del archivo y fechas de uso a la hoja privada del equipo PBIS. No se envían los datos del alumnado a ese registro.</p>'}</div></details><div class="results-tools"><div><span class="eyebrow">CONSULTA DEL AULA</span><h1>Vista de aula</h1></div>${demoSession?'':'<button id="change-files" class="btn secondary" type="button">Cambiar archivo</button>'}</div><div class="tabs" role="tablist" aria-label="Tipo de ficha"><button id="tab-group" class="tab" role="tab" aria-selected="true" aria-controls="report-content" disabled>${svg('people')}Ficha de aula</button><button id="tab-roster" class="tab" role="tab" aria-selected="false" aria-controls="report-content" tabindex="-1" disabled>Lista de aula</button><button id="tab-student" class="tab" role="tab" aria-selected="false" aria-controls="report-content" tabindex="-1" disabled>${svg('person')}Ficha de estudiante</button></div><div id="filters" class="filters hidden"></div><div id="report-content" role="tabpanel" aria-labelledby="tab-group">${empty()}</div><footer class="bottom"><span>PBIS · Edición de evaluación 0.11.0 · Los Excel permanecen en este navegador.</span><span>Las fichas orientan la conversación; la interpretación es profesional.</span></footer></main>`;
if(canViewCenter()){document.querySelector('.tabs').classList.add('has-center');document.querySelector('.tabs').insertAdjacentHTML('afterbegin',`<button id="tab-center" class="tab" role="tab" aria-selected="false" aria-controls="report-content" tabindex="-1" disabled>${svg('network')}Ficha de centro</button>`);}
if(profile.role==='orientador'&&!demoSession){
  document.querySelector('.user-info').textContent='Equipo orientador';
  document.querySelector('.top-actions').insertAdjacentHTML('afterbegin','<button id="admin-project" class="quiet" type="button">Administrar el proyecto</button>');
  document.getElementById('admin-project').onclick=administerProject;
}
if(profile.role==='orientador'&&!demoSession&&!protectedSession){
  document.querySelector('.top-actions').insertAdjacentHTML('afterbegin','<button id="open-accounts" class="quiet" type="button">Cuentas y contraseñas</button>');
  root.insertAdjacentHTML('beforeend','<dialog id="accounts-dialog" class="accounts-dialog" aria-label="Cuentas y contraseñas de acceso"></dialog>');
  document.getElementById('open-accounts').onclick=()=>{renderAccounts();document.getElementById('accounts-dialog').showModal();};
  document.getElementById('accounts-dialog').addEventListener('close',()=>renderAccounts());
}
bindBrand();if(demoSession)document.getElementById('demo-account').onclick=()=>finish('Accede con tu cuenta para cargar un archivo.');
document.getElementById('logout').onclick=()=>requestSessionClose();document.getElementById('help-button').onclick=showHelp;
if(hasDemo){const id=demoSession?'start-tour':'open-demo';document.getElementById('help-button').insertAdjacentHTML('afterend',`<button id="${id}" type="button" class="quiet">Práctica guiada</button>`);document.getElementById(id).onclick=startTour;}
window.PBIS_UPDATE_CLOSE=updateCloseAction;
updateCloseAction();
const reportContent=document.getElementById('report-content');
reportContent.addEventListener('click',rosterReviewClick);
reportContent.addEventListener('click',studentNetworkClick);
reportContent.addEventListener('click',classNetworkClick);
reportContent.addEventListener('change',event=>{
  const select=event.target.closest('[data-class-network-highlight]');
  if(select)G.highlight(select.closest('.class-network'),select.value);
});
reportContent.addEventListener('input',rosterReviewInput);
reportContent.addEventListener('change',rosterReviewChange);
reportContent.addEventListener('pointerup',rosterReviewChange);
reportContent.addEventListener('pointerdown',rosterReviewStart);
reportContent.addEventListener('toggle',event=>{
  if(!event.target.matches('.expanded-details')||!event.target.open)return;
  if(tour?.step==='student-details')tourMove('network');
},true);
{const sheet=document.getElementById('sheet-data');document.getElementById('file-data').onchange=()=>chooseFile('data');sheet.onfocus=()=>{sheet.dataset.previous=sheet.value;};sheet.onchange=()=>{if(hasSessionReviews()){sheet.value=sheet.dataset.previous||sheet.value;closeStatus('Envía o descarta las valoraciones antes de cambiar la hoja.');return;}sheet.dataset.previous=sheet.value;invalidate('La hoja ha cambiado. Abre las fichas para validar la nueva selección.');};}
document.getElementById('show-reports').onclick=openReports;
if(!demoSession)document.getElementById('change-access').onclick=()=>requestSessionClose();
if(hasDemo&&demoSession)document.getElementById('load-demo').onclick=loadDemo;
document.getElementById('tab-group').onclick=()=>changeView('group');document.getElementById('tab-roster').onclick=()=>changeView('roster');document.getElementById('tab-student').onclick=()=>changeView('student');
if(canViewCenter())document.getElementById('tab-center').onclick=()=>changeView('center');
document.querySelector('.tabs').onkeydown=e=>{if(!dataset||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const views=canViewCenter()?['center','group','roster','student']:['group','roster','student'],i=views.indexOf(view);changeView(e.key==='Home'?views[0]:e.key==='End'?'student':views[(i+(e.key==='ArrowRight'?1:views.length-1))%views.length]);document.getElementById('tab-'+view).focus();};if(!demoSession)document.getElementById('change-files').onclick=()=>{if(hasSessionReviews()){closeStatus('Envía o descarta las valoraciones antes de cambiar los archivos.');return;}document.getElementById('main').classList.remove('results-mode');document.getElementById('import-details').open=true;document.getElementById('import-details').scrollIntoView({block:'start'});};
}
async function loadDemo(){
if(!hasDemo||!profile||!demoSession)return;
if(hasSessionReviews()){closeStatus('Envía o descarta las valoraciones antes de volver a cargar el ejemplo.');return;}
const ticket=++generation,button=document.getElementById('load-demo');
cancelJobs();demoAbort?.abort();demoAbort=new AbortController();sourceMode='demo';
button.disabled=true;document.getElementById('demo-source').textContent='Cargando datos simulados…';
try{
  let demo=window.PBIS_DEMO_DATA;
  if(!demo){const response=await fetch(window.PBIS_DEMO_URL,{credentials:'omit',cache:'no-store',redirect:'error',signal:demoAbort.signal});if(!response.ok)throw Error('No se ha podido cargar el ejemplo.');demo=await response.json();}
  if(ticket!==generation||sourceMode!=='demo'||!profile)return;
  if(!demo||!Array.isArray(demo.students)||!Array.isArray(demo.groups))throw Error('El ejemplo no tiene el formato esperado.');
  const table=(name,records)=>{const headers=[...new Set(records.flatMap(row=>Object.keys(row)))];return {name,rows:[headers,...records.map(row=>headers.map(h=>row[h]??null))]};};
  const demoNames=new Map((demo.keys||[]).map(row=>[String(row.ID),row.Nombre]));
  const demoStudents=demo.students.map(row=>({...row,Nombre:row.Nombre||demoNames.get(String(row.ID))||null}));
  const practiceStudent=demoStudents.find(row=>String(row.ID)==='00253');
  if(practiceStudent)Object.assign(tourClass,{center:practiceStudent.Centro||practiceStudent.Campus,course:practiceStudent.Curso,group:practiceStudent.Grupo});
  books={data:{sheets:[table('Datos',demoStudents),table('Grupos',demo.groups)]}};
  fileVersion.data++;document.getElementById('file-data').value='';const select=document.getElementById('sheet-data');select.innerHTML=books.data.sheets.map(x=>`<option value="${E(x.name)}">${E(x.name)}</option>`).join('');select.disabled=false;
  invalidate('Ejemplo simulado preparado en este navegador.');document.getElementById('demo-source').textContent='Datos simulados activos · Elige centro, curso y aula.';openReports();
  if(tour?.step==='load')tourMove('class');
  else if(tour?.step==='quick-loading'){
    if(placeTourClass())tourMove('practice');else {stopTour();closeStatus('El ejemplo no contiene el aula prevista para esta práctica.');}
  }
}catch(error){if(ticket===generation&&sourceMode==='demo'&&profile){sourceMode='none';document.getElementById('demo-source').textContent=error.name==='AbortError'?'Carga cancelada.':'No se ha podido cargar el ejemplo. Comprueba la conexión y vuelve a intentarlo.';}}
finally{if(ticket===generation&&button.isConnected){button.disabled=false;demoAbort=null;}}
}
function upload(kind,num,title,desc){return `<section class="upload-card"><div class="upload-heading"><span class="upload-index">${num}</span><h3>${title}</h3></div><p>${desc}</p><label class="field"><span class="hidden">${title}</span><input type="file" id="file-${kind}" accept=".pbis,.xlsx,.xls" aria-label="${title}"></label><label class="field sheet-field">Hoja del archivo<select id="sheet-${kind}" disabled aria-label="Hoja de indicadores"></select></label></section>`;}
function empty(text=demoSession?'Pulsa «Cargar datos demo» para empezar.':'Selecciona el archivo de datos y pulsa «Abrir consulta».'){return `<section class="empty-state"><span class="empty-icon">${svg('network')}</span><h2>Una mirada que empieza por los datos.</h2><p>${E(text)}</p></section>`;}
function invalidate(message='Los archivos han cambiado. Valida la selección para continuar.'){
window.PbisFeedback.closeContext();
rosterReviews.clear();
rosterSort={key:'student',direction:'asc'};
dataset=null;document.getElementById('main').classList.remove('results-mode');document.getElementById('filters').classList.add('hidden');document.getElementById('filters').innerHTML='';document.getElementById('report-content').innerHTML=empty();document.getElementById('import-summary').textContent='Consulta pendiente de validar';document.getElementById('import-error').textContent='';document.getElementById('import-status').className='status';document.getElementById('import-status').textContent=message;document.getElementById('tab-group').disabled=true;document.getElementById('tab-roster').disabled=true;document.getElementById('tab-student').disabled=true;document.getElementById('show-reports').disabled=!books.data;
if(canViewCenter())document.getElementById('tab-center').disabled=true;
}
async function parseFile(file,kind,current,suppliedBuffer=null){const buffer=suppliedBuffer||await file.arrayBuffer();if(!current())throw Error('Lectura cancelada.');const sha256=await window.PbisLinkedFeedback.fingerprint(buffer);if(!current())throw Error('Lectura cancelada.');return new Promise((resolve,reject)=>{const url=URL.createObjectURL(new Blob([window.PBIS_PARSER],{type:'text/javascript'}));const worker=new Worker(url);const job={worker,url,reject,kind,timer:null};const close=()=>{worker.terminate();URL.revokeObjectURL(url);clearTimeout(job.timer);jobs.delete(job);};job.timer=setTimeout(()=>{close();reject(Error('La lectura ha tardado demasiado. Reduce el tamaño del archivo.'));},30000);jobs.add(job);worker.onmessage=e=>{close();e.data.error?reject(Error(e.data.error)):resolve({...e.data,sha256});};worker.onerror=()=>{close();reject(Error('El navegador no ha podido leer el archivo. Abre PBIS.html con una versión actual de Chrome, Edge, Firefox o Safari.'));};worker.postMessage(buffer,[buffer]);});}
const accessDenied='No tienes permisos para visualizar este archivo con el usuario y la contraseña introducidos. Revisa tus credenciales con orientación.';
async function chooseFile(kind){
if(demoSession||protectedSession)return;
if(hasSessionReviews()){document.getElementById(`file-${kind}`).value='';closeStatus('Envía o descarta las valoraciones antes de cambiar los archivos.');return;}
if(sourceMode==='demo'){demoAbort?.abort();books={data:null};}
sourceMode='files';if(document.getElementById('demo-source'))document.getElementById('demo-source').textContent='Consulta con tu archivo · El ejemplo se ha retirado.';

const file=document.getElementById(`file-${kind}`).files[0];const ticket=++fileVersion[kind],session=generation,current=()=>ticket===fileVersion[kind]&&session===generation&&!!profile;cancelJobs(kind);books[kind]=null;const select=document.getElementById(`sheet-${kind}`);select.innerHTML='';select.disabled=true;invalidate(file?'Leyendo el archivo en este equipo…':'Carga el archivo de datos para continuar.');if(!file)return;
try{
 if(!/\.(pbis|xlsx|xls)$/i.test(file.name))throw Error('Selecciona un archivo .pbis, .xlsx o .xls.');
 if(file.size>window.PbisProtected.MAX_BYTES)throw Error('El archivo supera los 100 MB admitidos.');
 const buffer=await file.arrayBuffer();if(!current())return;
 const prefix=String.fromCharCode(...new Uint8Array(buffer,0,Math.min(buffer.byteLength,64)));
 if(prefix.startsWith('PBIS-PROTECTED/')){
  document.getElementById('import-status').textContent='Comprobando los permisos del archivo…';
  let opened;try{opened=await window.PbisProtected.open(buffer,entryCredentials?.username,entryCredentials?.password);}catch(error){if(/incorrectos|DNI válido/.test(error.message))throw Error(accessDenied);throw error;}
  if(!current())return;await activateProtected(opened,file.name,buffer,current);return;
 }
 if(!entryCredentials?.legacyAccount)throw Error(accessDenied);
 if(file.size>20*1024*1024)throw Error('El Excel supera los 20 MB. Prepara una copia con las hojas necesarias.');
 const book=await parseFile(file,kind,current,buffer);if(!current())return;books[kind]=book;const valid=book.sheets.filter(x=>!x.unsupported);if(!valid.length)throw Error('No hay hojas compatibles: el máximo es 10.000 registros y 100 columnas por hoja, con un millón de celdas en total.');select.innerHTML=valid.map(x=>`<option value="${E(x.name)}">${E(x.name)}</option>`).join('');select.disabled=false;const preferred=valid.some(x=>x.name==='Users')?'Users':'Datos';if(valid.some(x=>x.name===preferred))select.value=preferred;invalidate('Archivo preparado. Revisa la hoja y pulsa «Abrir consulta».');}
catch(error){if(!current())return;books[kind]=null;document.getElementById('import-error').textContent=error.message;document.getElementById('import-status').textContent='';document.getElementById('show-reports').disabled=true;}
}
function rowsFor(book,name){const sheet=book.sheets.find(x=>x.name===name);if(!sheet||sheet.unsupported)throw Error(`La hoja ${name} no es compatible.`);const rows=sheet.rows;if(!rows.length)throw Error(`La hoja ${name} está vacía.`);const headers=rows[0].map(x=>String(x??'').trim());const used=headers.filter(Boolean);if(new Set(used).size!==used.length)throw Error(`La hoja ${name} tiene encabezados repetidos.`);if(headers.some(x=>['__proto__','prototype','constructor'].includes(x)))throw Error('La hoja contiene un encabezado no permitido.');if(rows.length>10001)throw Error(`La hoja ${name} supera los 10.000 registros admitidos.`);return rows.slice(1).filter(row=>row.some(x=>x!==null&&x!==''&&x!==undefined)).map(row=>{const result=Object.create(null);headers.forEach((h,i)=>{if(h)result[h]=row[i]??null;});return result;});}
function openReports(){
if(protectedSession)return;
if(demoSession&&sourceMode!=='demo')return;
if(!demoSession&&!entryCredentials?.legacyAccount){document.getElementById('import-error').textContent=accessDenied;return;}
try{let data=rowsFor(books.data,document.getElementById('sheet-data').value),meta=books.data.sheets.some(x=>x.name==='Grupos')?rowsFor(books.data,'Grupos'):[],conversionWarnings=[];
if(window.PbisWave1?.isWave1(data)){const converted=window.PbisWave1.convert(data);data=converted.students;meta=converted.groups;conversionWarnings=converted.warnings;}
const all=C.validateAndJoin(data,null,meta);const scoped=C.scopeRows(all.students,profile).map(row=>({...row,Nombre:C.displayName(row.Nombre)}));if(!scoped.length)throw Error('No hay estudiantes del curso o aula asignados a esta cuenta. Comprueba las columnas Curso y Grupo (aula).');dataset={students:scoped,groups:all.groups.filter(g=>scoped.some(s=>s.Campus===g.Campus&&s.Curso===g.Curso&&s.Grupo===g.Grupo)),warnings:[...conversionWarnings,...all.warnings]};
const preferred=scoped.find(row=>row.Nombre==='Ana M.')||scoped[0];selection={center:profile.center||preferred.Campus,course:profile.course||preferred.Curso,group:preferred.Grupo,student:preferred.ID};document.getElementById('import-error').textContent='';document.getElementById('import-status').textContent=`${scoped.length.toLocaleString('es-ES')} estudiantes disponibles para tu perfil. ${dataset.warnings.join(' ')}`;document.getElementById('import-status').className='status success';document.getElementById('import-summary').textContent=`${scoped.length.toLocaleString('es-ES')} estudiantes · ${scoped.some(row=>row.Nombre)?'Con nombres':'Consulta por códigos'}`;document.getElementById('import-details').open=false;document.getElementById('tab-group').disabled=false;document.getElementById('tab-roster').disabled=false;document.getElementById('tab-student').disabled=false;view='group';document.getElementById('main').classList.add('results-mode');changeView('group');document.getElementById('tab-group').focus();}
catch(error){dataset=null;document.getElementById('filters').innerHTML='';document.getElementById('filters').classList.add('hidden');document.getElementById('report-content').innerHTML=empty('Revisa el mensaje de validación y el archivo de datos.');document.getElementById('import-error').textContent=error.message;document.getElementById('import-status').textContent='';document.getElementById('import-details').open=true;}
}
const studentLabel=r=>r.Nombre?`${r.Nombre} · ${r.ID}`:`Estudiante · ${r.ID}`;
const unique=a=>[...new Set(a)];
function selectMarkup(id,label,options,chosen,extra=''){return `<label class="field ${extra}">${label}<select id="${id}">${options.map(x=>`<option value="${E(x.value??x)}" ${(x.value??x)===chosen?'selected':''}>${E(x.label??x)}</option>`).join('')}</select></label>`;}
function currentRows(){return dataset.students.filter(x=>x.Campus===selection.center&&x.Curso===selection.course&&x.Grupo===selection.group);}
function renderFilters(){const centers=unique(dataset.students.map(x=>x.Campus)).sort((a,b)=>a.localeCompare(b,'es'));if(!centers.includes(selection.center))selection.center=centers[0];const courses=unique(dataset.students.filter(x=>x.Campus===selection.center).map(x=>x.Curso)).sort((a,b)=>{const ai=C.COURSE_ORDER.indexOf(a),bi=C.COURSE_ORDER.indexOf(b);return (ai<0?99:ai)-(bi<0?99:bi)||a.localeCompare(b,'es');});if(!courses.includes(selection.course))selection.course=courses[0];const groups=unique(dataset.students.filter(x=>x.Campus===selection.center&&x.Curso===selection.course).map(x=>x.Grupo)).sort();if(!groups.includes(selection.group))selection.group=groups[0];const students=currentRows().slice().sort((a,b)=>(a.Nombre||'').localeCompare(b.Nombre||'','es')||a.ID.localeCompare(b.ID));if(!students.some(x=>x.ID===selection.student))selection.student=(students.find(x=>x.Nombre==='Ana M.')||students[0]).ID;
const filters=document.getElementById('filters');filters.className=`filters ${view==='student'?'individual':view==='center'?'center-only':''}`;filters.innerHTML=selectMarkup('center','Centro',centers,selection.center)+(view==='center'?'':selectMarkup('course','Curso',courses,selection.course)+selectMarkup('group','Aula',groups,selection.group)+(view==='student'?`<label class="field student-search">Buscar estudiante<input id="student-search" type="search" placeholder="${dataset?.students.some(row=>row.Nombre)?'Nombre o código':'Código de estudiante'}" autocomplete="off"></label>`+selectMarkup('student','Estudiante',students.map(x=>({value:x.ID,label:studentLabel(x)})),selection.student,'student-select'):''));
for(const kind of (view==='center'?['center']:['center','course','group']))document.getElementById(kind).onchange=e=>{selection[kind]=e.target.value;renderFilters();renderReport();document.getElementById(kind).focus();if(tour){if(!tourAtClass())tourMove('class');else if(tour.step==='class')tourMove('group');else renderTour();}};if(view==='student'){document.getElementById('student').onchange=e=>{selection.student=e.target.value;renderReport();};document.getElementById('student-search').oninput=e=>{const term=e.target.value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const found=students.filter(x=>`${x.Nombre} ${x.ID}`.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(term));document.getElementById('student').innerHTML=found.length?found.map(x=>`<option value="${E(x.ID)}">${E(studentLabel(x))}</option>`).join(''):'<option value="">Sin coincidencias</option>';document.getElementById('student').disabled=!found.length;if(found.length){selection.student=found[0].ID;renderReport();}else document.getElementById('report-content').innerHTML=empty('No hay estudiantes que coincidan con la búsqueda. Prueba otro nombre o código.');};}}
function changeView(next){if(!dataset)return;if(next==='center'&&!canViewCenter())return;if(next==='center'&&tour&&tour.step!=='center')stopTour();view=next;const tabs=[...(canViewCenter()?['center']:[]),'group','roster','student'];for(const id of tabs){const tab=document.getElementById('tab-'+id),chosen=next===id;tab.disabled=false;tab.setAttribute('aria-selected',String(chosen));tab.tabIndex=chosen?0:-1;}document.getElementById('report-content').setAttribute('aria-labelledby','tab-'+next);document.querySelector('.results-tools .eyebrow').textContent=next==='center'?'CONSULTA DEL CENTRO':'CONSULTA DEL AULA';document.querySelector('.results-tools h1').textContent=next==='center'?'Vista de centro':'Vista de aula';renderFilters();renderReport();if(tour?.step==='group'&&next==='roster')tourMove('sort');else if(tour?.step==='ana'&&next==='student'&&selection.student==='00253')tourMove('student-bullying');else if(tour)renderTour();}
function reportHero(title,subtitle,type){return `<header class="report-hero"><div><span class="eyebrow">${E(selection.center)} · PBIS</span><h2>${E(title)}</h2><p>${E(subtitle)}</p></div><div class="hero-type">${type}</div></header>`;}
function reading(normalized=true){return `<div class="reading"><span><strong>Escala 0–10</strong></span>${legend()}</div>`;}
function renderReport(){
  if(!dataset)return;
  window.PbisFeedback.closeContext();
  const rows=currentRows(),centerRows=dataset.students.filter(row=>row.Campus===selection.center);
  const meta=dataset.groups.find(g=>g.Campus===selection.center&&g.Curso===selection.course&&g.Grupo===selection.group);
  const feedback=view==='center'?'':`<div class="feedback-toolbar"><button id="open-feedback" class="feedback-trigger" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M21 11a9 9 0 0 1-9 9H3l2-5a9 9 0 1 1 16-4Z"/><path d="M8 9h8M8 13h5"/></svg>Opinar sobre esta ficha</button></div>`;
  const report=view==='center'?centerReport(centerRows):view==='group'?groupReportBrief(rows,meta)+'<div class="class-next"><button id="open-roster" class="btn" type="button">Ver lista de aula →</button></div>':view==='roster'?rosterReport(rows):studentReport(rows.find(x=>x.ID===selection.student)||rows[0],rows,centerRows);
  document.getElementById('report-content').innerHTML=feedback+consultationContext(view==='center'?centerRows:rows)+importQualityNote(centerRows)+report;
  if(view==='group')document.getElementById('open-roster').onclick=()=>changeView('roster');
  if(view==='roster')document.querySelectorAll('.student-link[data-student-id]').forEach(button=>button.onclick=()=>{selection.student=button.dataset.studentId;changeView('student');if(!tour)document.getElementById('report-content').scrollIntoView({block:'start'});});
  if(view==='student')document.getElementById('back-to-roster').onclick=()=>changeView('roster');
  if(view==='center')return;
  document.getElementById('open-feedback').onclick=async function(){const button=this,ticket=generation,type=view==='student'?'individual':view==='roster'?'roster':'group',studentCode=type==='individual'?selection.student:null;button.disabled=true;try{const classCode=await window.PbisFeedbackModel.classCode({center:selection.center,course:selection.course,group:selection.group,});if(ticket===generation&&button.isConnected)window.PbisFeedback.open({sheet:type,classCode,studentCode,target:{center:selection.center,course:selection.course,group:selection.group,studentId:studentCode,period:meta?.Periodo??null}});}catch(error){if(button.isConnected){let issue=document.createElement('p');issue.className='feedback-issue';issue.setAttribute('role','alert');issue.textContent=error.message;button.parentElement.append(issue);}}finally{if(button.isConnected)button.disabled=false;}};
}
function consultationContext(rows){
  const info=C.consultationContext(rows,dataset.groups);
  const period=info.periods.length?info.periods.join(' · '):'Periodo no indicado';
  return `<details class="consultation-context"><summary>${E(period)} · ${info.answered} de ${info.total} con respuesta registrada</summary><p>${info.unanswered} sin respuesta registrada · ${info.unknown} con estado desconocido. Una respuesta registrada puede estar incompleta; cada indicador usa los datos disponibles.</p><p>Ámbito de las menciones: ${info.nominationScope==='centro'?'todo el centro':info.nominationScope==='aula'?'el aula':'según el archivo; no consta un ámbito único'}.${info.undatedClasses?` ${info.undatedClasses} aulas sin periodo indicado.`:''}${info.periods.length>1?' Hay varios periodos: este resumen no permite comparar su evolución.':''}</p><p>0 es un valor observado; «No respondió» indica ausencia de respuesta propia y «Datos insuficientes» o «Sin datos», falta de información. Ninguno permite concluir por sí solo que no hay dificultades. Esta consulta no registra asistencia ni oportunidades de observación.</p></details>`;
}
function importQualityNote(rows){
  const count=rows.reduce((sum,row)=>sum+(Array.isArray(row.incidencias_calculo)?row.incidencias_calculo.length:0),0);
  const centrality=rows.some(row=>row.centralidad_sin_convergencia===true);
  const messages=[];
  if(count)messages.push(`${count} ${count===1?'respuesta del centro contiene':'respuestas del centro contienen'} «Error en relación» en el archivo. Estas respuestas necesitan revisión; no se cuentan como ceros.`);
  if(centrality)messages.push('No se ha podido calcular la centralidad. Los demás datos siguen disponibles.');
  return messages.length?`<p id="report-import-warning" class="network-coverage-note" role="status">${messages.join(' ')}</p>`:'';
}
function centerReport(rows){
  const g=C.aggregateCenter(rows),item=id=>g.attention.find(value=>value.id===id);
  const datum=value=>value?.count==null?'Sin datos':`${number(value.count)} de ${number(value.denominator)}`;
  const answer=(question,value,note)=>`<div class="group-answer"><h5>${E(question)}</h5><strong>${E(datum(value))}</strong>${value?.percent==null?'':`<span>${E(percent(value.percent))}</span>`}<p>${E(note)}</p></div>`;
  const icons=['megaphone','people','alone','ban','heart'];
  const support=(count)=>known(count)?`${number(count)} <small>de ${number(g.supportKnown)}</small>`:'<span class="missing">Sin datos</span>';
  const coverage=g.coverageComplete===false?`El archivo incluye ${number(g.n)} de ${number(g.expected)} estudiantes del centro.`:'';
  const detail=`${reading(g.normalized)}<section class="section-panel panel-attention">${section('01','Señales de atención')}<div>${g.attention.map((a,i)=>`<div class="attention-row${a.id.startsWith('bullying_')?' is-bullying':''}"><span class="icon-bubble">${svg(icons[i])}</span><div class="attention-title"><h4>${E(a.title)}</h4><p>${E(a.description)}</p></div><div class="stat ${a.percent==null?'missing':''}">${percent(a.percent)}</div><div class="attention-scale"><div class="meter-label">${a.score==null?'Sin escala disponible':number(a.score)+' / 10'}</div>${meter(a.score,a.title)}</div></div>`).join('')}</div></section>
    <section class="section-panel panel-context">${section('02','Mediación y convivencia','panel-context')}<div class="mediation-grid"><div><h4>Estudiantes con menciones de buena mediación</h4><div class="stat">${g.mediators.count==null?'Sin datos':number(g.mediators.count)}</div><p>Al menos una mención de buena o muy buena mediación. ${g.mediators.denominator?`${number(g.mediators.denominator)} registros disponibles.`:'Sin desglose por valoración en este archivo.'}</p></div><div><h4>Estudiantes con menciones de mala mediación</h4><div class="stat">${g.negativeMediators.count==null?'Sin datos':number(g.negativeMediators.count)}</div><p>Al menos una mención de mala o muy mala mediación. ${g.negativeMediators.denominator?`${number(g.negativeMediators.denominator)} registros disponibles.`:'Sin desglose por valoración en este archivo.'}</p></div></div><p class="section-note">Una persona puede recibir menciones de buena y mala mediación.</p></section>`;
  return `<article class="report">${reportHero(selection.center,`${number(g.n)} ${g.n===1?'estudiante':'estudiantes'} · ${number(g.classCount)} ${g.classCount===1?'aula':'aulas'} · ${g.responses==null?'Respuestas sin cobertura completa':`${number(g.responses)} ${g.responses===1?'respuesta':'respuestas'}`}`,'Ficha de centro')}<div class="report-body group-brief center-brief"><h3 class="summary-heading">Resumen del centro</h3>${networkCoverageNote(rows[0])}${coverage?`<p class="center-coverage">${E(coverage)}</p>`:''}<div class="group-summary-grid">
    <section class="group-summary-panel group-summary-alert" aria-labelledby="center-alert-title"><h4 id="center-alert-title">Señales de acoso escolar</h4>${answer('¿Cuántos estudiantes declaran haber sufrido acoso?',item('bullying_declarado'),'Respuesta personal.')}${answer('¿Cuántos reciben al menos 2 menciones de acoso?',item('bullying_companeros'),'Cada estudiante cuenta una vez; requiere menciones de al menos 2 personas distintas.')}<p class="group-summary-note">Las dos fuentes pueden coincidir; no se suman.</p></section>
    <section class="group-summary-panel group-summary-wellbeing" aria-labelledby="center-wellbeing-title"><h4 id="center-wellbeing-title">Bienestar</h4>${answer('¿Cuántos indican soledad frecuente?',item('soledad'),'Casi siempre o siempre durante la última semana.')}</section>
    <section class="group-summary-panel group-summary-friendship" aria-labelledby="center-friendship-title"><h4 id="center-friendship-title">Relaciones</h4>${answer('¿Cuántos no tienen buenas relaciones mutuas registradas?',item('sin_reciprocas'),'Vínculos observados entre estudiantes del centro.')}<p class="group-summary-note">El recuento se basa en las respuestas disponibles.</p></section>
    </div><details class="expanded-details"><summary>Ver más indicadores <span aria-hidden="true">↓</span></summary><div class="group-expanded">${detail}</div></details></div></article>`;
}
function groupReport(rows,meta){const g=C.aggregate(rows,meta),icons=['megaphone','people','alone','ban','heart'];const structure=(title,position,reason)=>`<div class="mini-card"><h4>${title}</h4><div class="stat">${position==null&&reason?`<span class="missing">${E(reason)}</span>`:score(position)}</div>${position==null&&reason?'':meter(position,title)}</div>`;return `<article class="report">${reportHero(`${selection.course} · ${selection.group}`,`${g.n} estudiantes · ${g.responses==null?'Respuestas sin cobertura completa':g.responses+' respuestas'}${g.period?' · '+g.period:''}`,'Ficha de aula')}<div class="report-body">${reading(g.normalized)}<section class="section-panel panel-attention">${section('01','Señales de atención')}<div>${g.attention.map((a,i)=>`<div class="attention-row${a.id.startsWith('bullying_')?' is-bullying':''}"><span class="icon-bubble">${svg(icons[i])}</span><div class="attention-title"><h4>${E(a.title)}</h4><p>${E(a.description)}</p></div><div class="stat ${a.percent==null?'missing':''}">${percent(a.percent)}</div><div class="attention-scale"><div class="meter-label">${a.score==null?'Sin escala disponible':number(a.score)+' / 10'}</div>${meter(a.score,a.title)}</div></div>`).join('')}</div></section><section class="section-panel panel-connections">${section('02','Comunidades de relaciones','panel-connections')}<div class="integration-grid"><div class="mini-card"><h4>Comunidades de relaciones</h4><div class="stat">${g.communities?g.communities.length:'<span class="missing">Sin datos</span>'}</div>${g.communities?`<div class="community-bar" aria-hidden="true">${g.communities.map(c=>`<span style="flex:${c.count}"></span>`).join('')}</div><p>${g.communities.map(c=>`${E(String(c.name).replace(/^Red (\d+)$/, 'Comunidad $1'))}: ${c.count}`).join(' · ')} estudiantes</p>`:'<p>No hay información suficiente para identificar agrupaciones.</p>'}</div>${structure('Separación entre comunidades',meta?.pos_separacion,meta?.red_clase_completa===false?'Faltan respuestas':null)}${structure('Desigualdad de buenas relaciones recibidas',meta?.pos_desigualdad,meta?.red_centro_completa===false?'Faltan respuestas':null)}${structure('Centralización del aula',meta?.pos_centralizacion,meta?.red_centro_completa===false?'Faltan respuestas':null)}</div><p class="section-note">Tener varias comunidades no implica conflicto.</p></section><section class="section-panel panel-context">${section('03','Mediación y convivencia','panel-context')}<div class="mediation-grid"><div><h4>Estudiantes con menciones de buena mediación</h4><div class="stat">${number(g.mediators.count)}</div><p>Al menos una mención de buena o muy buena mediación de otras personas. ${g.mediators.denominator?`${number(g.mediators.denominator)} registros disponibles.`:'Sin desglose por valoración en este archivo.'}</p></div><div><h4>Estudiantes con menciones de mala mediación</h4><div class="stat">${g.negativeMediators.count==null?'Sin datos':number(g.negativeMediators.count)}</div><p>Al menos una mención de mala o muy mala mediación de otras personas. ${g.negativeMediators.denominator?`${number(g.negativeMediators.denominator)} registros disponibles.`:'Sin desglose por valoración en este archivo.'}</p></div></div><p class="section-note">Una persona puede recibir menciones de buena y mala mediación.</p></section></div></article>`;}
function groupReportBrief(rows,meta){
  const g=C.aggregate(rows,meta);
  const item=id=>g.attention.find(value=>value.id===id);
  const datum=value=>value?.count==null?'Sin datos':`${number(value.count)} de ${number(value.denominator)}`;
  const rate=value=>value?.percent==null?'':percent(value.percent);
  const answer=(question,value,note)=>`<div class="group-answer"><h5>${E(question)}</h5><strong>${E(datum(value))}</strong>${rate(value)?`<span>${E(rate(value))}</span>`:''}${note?`<p>${E(note)}</p>`:''}</div>`;
  const complete=groupReport(rows,meta);
  const bodyStart='<div class="report-body">';
  const expanded=complete.slice(complete.indexOf(bodyStart)+bodyStart.length,-'</div></article>'.length);
  return `<article class="report">${reportHero(`${selection.course} · ${selection.group}`,`${g.n} estudiantes · ${g.responses==null?'Respuestas sin cobertura completa':g.responses+' respuestas'}${g.period?' · '+g.period:''}`,'Ficha de aula')}
    <div class="report-body group-brief"><h3 class="summary-heading">Resumen del aula</h3>${networkCoverageNote(rows[0])}<div class="group-summary-grid">
      <section class="group-summary-panel group-summary-alert" aria-labelledby="group-summary-alert-title"><h4 id="group-summary-alert-title">Señales de acoso escolar</h4>
        ${answer('¿Cuántos estudiantes declaran haber sufrido acoso?',item('bullying_declarado'),'Respuesta personal.')}
        ${answer('¿Cuántos reciben al menos 2 menciones de acoso?',item('bullying_companeros'),'Cada estudiante cuenta una vez; requiere menciones de al menos 2 personas distintas.')}
        <p class="group-summary-note">Las dos fuentes pueden coincidir; no se suman.</p></section>
      <section class="group-summary-panel group-summary-wellbeing" aria-labelledby="group-summary-wellbeing-title"><h4 id="group-summary-wellbeing-title">Bienestar</h4>
        ${answer('¿Cuántos indican soledad frecuente?',item('soledad'),'Casi siempre o siempre durante la última semana.')}
        </section>
      <section class="group-summary-panel group-summary-friendship" aria-labelledby="group-summary-friendship-title"><h4 id="group-summary-friendship-title">Relaciones</h4>
        ${answer('¿Cuántos no tienen buenas relaciones mutuas registradas?',item('sin_reciprocas'),'Buenas relaciones declaradas por ambas personas.')}
        <p class="group-summary-note">Amplía para ver las comunidades de relaciones y la red del aula.</p></section>
    </div><details class="expanded-details"><summary>Ver más indicadores <span aria-hidden="true">↓</span></summary><div class="group-expanded">${expanded}${G.view(rows)}</div></details></div></article>`;
}
function classNetworkClick(event){
  const toggle=event.target.closest('button[data-class-network-layout-toggle]');
  if(toggle&&dataset&&view==='group'){
    event.preventDefault();
    const panel=toggle.closest('.class-network');
    if(G.setLayout(panel,currentRows(),panel.dataset.classNetworkLayout==='communities'?'circle':'communities'))N.zoom(panel,'fit');
    return;
  }
  const link=event.target.closest('a[data-class-student]');
  if(!link||!dataset||view!=='group')return;
  event.preventDefault();
  const target=currentRows().find(row=>row.ID===link.dataset.classStudent);
  if(!target)return;
  if(tour)stopTour();
  selection.student=target.ID;
  changeView('student');
  const heading=document.querySelector('.report-hero h2');
  heading.setAttribute('tabindex','-1');heading.focus();
}
function cellTone(value,kind){
  if(value==null)return 'tone-missing';
  if(kind==='self')return value==='Sí'?'tone-danger':'tone-calm';
  if(kind==='peer')return value>0?'tone-danger':'tone-calm';
  if(kind==='happiness')return 'tone-neutral';
  return 'tone-neutral';
}
function classCell(value,kind,unit='',missingLabel='Datos insuficientes'){
  const content=value==null?E(missingLabel):`${kind==='self'?E(value):number(value)}${unit}`;
  return `<span class="class-value ${cellTone(value,kind)}">${content}</span>`;
}
const reviewChoices=[['ok','👍','OK'],['mal','👎','Revisar'],['sorpresa','😮','Me sorprende']];
const rosterColumns=[
  ['bullying_self','Declara haber sufrido acoso','bullying_autorreporte','self'],
  ['bullying_peers','Menciones de acoso recibidas','bullying_companeros_n','peer'],
  ['happiness','Bienestar','felicidad','happiness'],
  ['friendship_out','Buenas relaciones declaradas','amistad_declarada_n','count'],
  ['friendship_in','Buenas relaciones recibidas','amistad_recibida_n','count'],
  ['rejection_out','Malas relaciones declaradas','rechazo_declarado_n','count'],
  ['rejection_in','Malas relaciones recibidas','rechazo_recibido_n','count']
];
function reviewCell(row,column,rowIndex){
  const [key,label,field,kind]=column;
  const value=key==='bullying_self'&&row.respondio==='No'?null:row[field];
  const selected=rosterReviews.get(row.ID).reactions[key];
  const missingLabel=row.respondio==='No'&&['bullying_self','happiness','friendship_out','rejection_out'].includes(key)?'No respondió':'Datos insuficientes';
  const person=row.Nombre||`código ${row.ID}`;
  const selectedLabel=reviewChoices.find(([reaction])=>reaction===selected)?.[2]||'';
  const optionsId=`review-options-${rowIndex}-${key}`;
  const buttons=reviewChoices.map(([reaction,emoji,text])=>`<button type="button" class="reaction-button reaction-${reaction}" data-roster-reaction="${reaction}" data-student-id="${E(row.ID)}" data-indicator="${key}" aria-label="${E(`${text}: ${label} de ${person}`)}" aria-pressed="${selected===reaction}" title="${E(text)}"><span aria-hidden="true">${emoji}</span><span class="reaction-label">${E(text)}</span></button>`).join('');
  return `<div class="review-cell"><button type="button" class="review-value" data-roster-open aria-expanded="false" aria-controls="${optionsId}" aria-label="${E(`Valorar ${label} de ${person}`)}">${classCell(value,kind,key==='happiness'&&value!=null?' / 10':'',missingLabel)}<span class="review-chevron" aria-hidden="true">⌄</span></button><span class="review-current" ${selected?'':'hidden'}>${E(selectedLabel)}</span><div id="${optionsId}" class="reaction-group" role="group" aria-label="${E(`Tu valoración de ${label} de ${person}`)}" hidden>${buttons}</div></div>`;
}
const confidenceLabel=value=>value===null?'Sin valorar':`${value>0?'+':''}${number(value)}`;
function nonParticipationCell(row){
  const entry=rosterReviews.get(row.ID).nonParticipation;
  const person=row.Nombre||`código ${row.ID}`;
  return `<div class="non-participation-control"><label><span>Motivo de no participación</span><select data-roster-reason data-student-id="${E(row.ID)}" aria-label="${E(`Motivo de no participación de ${person}`)}"><option value="">Seleccionar motivo</option>${Object.entries(window.PbisRosterReview.nonParticipationReasons).map(([value,label])=>`<option value="${value}" ${entry?.reason===value?'selected':''}>${E(label)}</option>`).join('')}</select></label><label class="non-participation-detail" ${entry?.reason==='other'?'':'hidden'}><span>Especifica el motivo</span><textarea data-roster-reason-detail data-student-id="${E(row.ID)}" rows="3" maxlength="300" ${entry?.reason==='other'?'required':''} aria-label="${E(`Otro motivo de no participación de ${person}`)}" placeholder="Describe brevemente el motivo, sin nombres ni detalles personales.">${E(entry?.detail||'')}</textarea><small>Máximo 300 caracteres.</small></label></div>`;
}
function confidenceCell(row){
  if(window.PbisRosterReview.isNonRespondent(row))return nonParticipationCell(row);
  const value=rosterReviews.get(row.ID).confidence;
  const person=row.Nombre||`código ${row.ID}`;
  return `<div class="confidence-control"><input type="range" min="-5" max="5" step="0.1" value="${value??0}" data-roster-confidence data-student-id="${E(row.ID)}" aria-label="${E(`Confianza en los datos de ${person}, de menos cinco a más cinco`)}"><div class="confidence-scale"><span>−5</span><span>0</span><span>+5</span></div><div class="confidence-result"><output aria-live="polite">${confidenceLabel(value)}</output><button type="button" class="confidence-clear" data-roster-clear data-student-id="${E(row.ID)}" aria-label="Quitar valoración de confianza de ${E(person)}" ${value===null?'hidden':''}>Quitar</button></div></div>`;
}
function rosterReport(rows){
  const ordered=window.PbisRosterReview.sortRows(rows,rosterSort,rosterReviews);
  const sortHeader=(key,label)=>{const active=rosterSort.key===key;const direction=active?rosterSort.direction:'none';const arrow=active?(direction==='asc'?'↑':'↓'):'↕';return `<th scope="col" aria-sort="${direction==='asc'?'ascending':direction==='desc'?'descending':'none'}"><button type="button" class="roster-sort" data-roster-sort="${key}" aria-label="Ordenar por ${E(label)}" title="Ordenar por ${E(label)}">${E(label)} <span aria-hidden="true">${arrow}</span></button></th>`;};
  const header=rosterColumns.map(([key,label])=>sortHeader(key,label)).join('');
  const body=ordered.map((row,rowIndex)=>`<tr data-student-id="${E(row.ID)}" class="${window.PbisRosterReview.isNonRespondent(row)?'roster-no-response':''}"><th scope="row"><button type="button" class="student-link" data-student-id="${E(row.ID)}">${E(row.Nombre||'Estudiante')}<span>${E(row.ID)}</span>${window.PbisRosterReview.isNonRespondent(row)?'<small class="participation-tag">No ha respondido</small>':''}</button></th>${rosterColumns.map(column=>`<td>${reviewCell(row,column,rowIndex)}</td>`).join('')}<td>${confidenceCell(row)}</td></tr>`).join('');
  return `<article class="report">${reportHero(`${selection.course} · ${selection.group}`,`${rows.length} estudiantes · ${selection.center}`,'Lista de aula')}<div class="report-body"><p class="roster-intro">Ordena por una columna. Pulsa un dato para valorarlo o un nombre para abrir su ficha.</p>${networkCoverageNote(rows[0])}<p class="roster-scroll-hint">Desliza la tabla para ver más indicadores →</p><div class="roster-scroll" tabindex="0" aria-label="Tabla de estudiantes del aula, desplazable horizontalmente"><table class="roster-table"><thead><tr>${sortHeader('student','Estudiante')}${header}${sortHeader('confidence','Confianza en los datos o motivo')}</tr></thead><tbody>${body}</tbody></table></div><details class="roster-method"><summary>Cómo se leen estos datos</summary><p>Bienestar: centro y diversión (0–4), más soledad invertida (4–0); la suma se expresa de 0 a 10. «Declara haber sufrido acoso» procede de marcar el propio código en acoso; «Menciones de acoso recibidas» muestra el recuento recibido. Los resúmenes de aula y centro cuentan únicamente estudiantes con 2 o más menciones válidas. En Wave 1, las menciones pueden proceder de todo el centro. Confianza en los datos: −5 significa muy baja; +5, muy alta. Cero es intermedia y «Sin valorar» significa que aún no has respondido. Las reacciones expresan si el dato encaja con tu conocimiento del contexto: OK, Revisar o Me sorprende. La confianza indica cuánto te permite interpretar esos datos. No valoras la conducta del estudiante ni creas una actuación de seguimiento. Las valoraciones no modifican los indicadores. Solo se destaca la fila cuando el archivo indica que no ha respondido; una respuesta parcial o un estado desconocido no se interpreta como ausencia. El motivo se incluye en el resumen de la sesión y no cambia la encuesta. Al ordenar por confianza, las filas sin puntuación quedan al final.</p></details></div></article>`;
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
  if(!dataset)return;
  const select=event.target.closest('select[data-roster-reason]');
  if(select){
    const row=currentRows().find(row=>row.ID===select.dataset.studentId);
    if(!window.PbisRosterReview.isNonRespondent(row))return;
    rosterReviews.setNonParticipation(row.ID,select.value||null);
    const control=select.closest('.non-participation-control'),label=control.querySelector('.non-participation-detail'),text=control.querySelector('textarea');
    label.hidden=select.value!=='other';text.value='';text.required=!label.hidden;text.setCustomValidity(text.required?'Especifica el motivo.':'');
    if(!label.hidden)text.focus();
    updateCloseAction();return;
  }
  if(event.target.matches('input[data-roster-confidence]')&&rosterSort.key==='confidence')updateRosterOrder();
}
function rosterReviewInput(event){
  if(!dataset)return;
  const text=event.target.closest('textarea[data-roster-reason-detail]');
  if(text){
    const row=currentRows().find(row=>row.ID===text.dataset.studentId);
    if(!window.PbisRosterReview.isNonRespondent(row)||rosterReviews.get(row.ID).nonParticipation?.reason!=='other')return;
    rosterReviews.setNonParticipation(row.ID,'other',text.value);
    text.setCustomValidity(text.value.trim()?'':'Especifica el motivo.');updateCloseAction();return;
  }
  const slider=event.target.closest('input[data-roster-confidence]');
  if(!slider||!currentRows().some(row=>row.ID===slider.dataset.studentId&&!window.PbisRosterReview.isNonRespondent(row)))return;
  const value=Math.round(Number(slider.value)*10)/10;
  rosterReviews.setConfidence(slider.dataset.studentId,value);
  updateCloseAction();
  const control=slider.closest('.confidence-control');
  control.querySelector('output').textContent=confidenceLabel(value);
  control.querySelector('[data-roster-clear]').hidden=false;
  if(tour?.step==='confidence'&&slider.dataset.studentId==='00253')tourMove('close');
}
function rosterReviewClick(event){
  const sortButton=event.target.closest('button[data-roster-sort]');
  if(sortButton){rosterSort=window.PbisRosterReview.nextSort(rosterSort,sortButton.dataset.rosterSort);updateRosterOrder();if(tour?.step==='sort'&&rosterSort.key==='bullying_peers'&&rosterSort.direction==='desc')tourMove('reaction');return;}
  const opener=event.target.closest('button[data-roster-open]');
  if(opener){
    const group=opener.parentElement.querySelector('.reaction-group');
    const willOpen=group.hidden;
    document.querySelectorAll('#report-content .reaction-group:not([hidden])').forEach(item=>{item.hidden=true;item.parentElement.querySelector('[data-roster-open]').setAttribute('aria-expanded','false');});
    group.hidden=!willOpen;
    opener.setAttribute('aria-expanded',String(willOpen));
    if(willOpen)group.scrollIntoView({block:'nearest',inline:'nearest'});
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
    if(selected&&studentId==='00280'&&indicator==='bullying_peers'&&rosterReaction==='sorpresa'){
      if(tour?.step==='reaction')tourMove('compare');
      else if(tour?.step==='practice')tourMove('confidence');
    }
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
  if(!slider||!currentRows().some(row=>row.ID===slider.dataset.studentId&&!window.PbisRosterReview.isNonRespondent(row)))return;
  if(rosterReviews.get(slider.dataset.studentId).confidence===null){
    rosterReviews.setConfidence(slider.dataset.studentId,Number(slider.value));
    updateCloseAction();
    const control=slider.closest('.confidence-control');
    control.querySelector('output').textContent=confidenceLabel(Number(slider.value));
    control.querySelector('[data-roster-clear]').hidden=false;
  }
}
function studentReport(r,classRows=[r],visibleRows=classRows){
  const self=r.respondio==='No'?'No ha respondido':r.bullying_autorreporte;
  const name=r.Nombre||`Estudiante · ${r.ID}`;
  const scope=r.ambito_nominaciones==='centro'?'del centro':'del aula';
  const average=values=>{const valid=values.filter(value=>typeof value==='number'&&Number.isFinite(value));return valid.length?valid.reduce((sum,value)=>sum+value,0)/valid.length:null;};
  const classMean=field=>average(classRows.map(row=>row[field]));
  const countMax=field=>Math.max(1,...classRows.map(row=>row[field]).filter(value=>typeof value==='number'&&Number.isFinite(value)));
  const reciprocity=row=>known(row.amistad_reciproca_n,row.amistad_declarada_n)&&row.amistad_declarada_n>0?100*row.amistad_reciproca_n/row.amistad_declarada_n:null;
  const ownReciprocity=reciprocity(r),meanReciprocity=average(classRows.map(reciprocity));
  const comparison=(title,description,own,mean,maximum,ownText,meanText)=>{
    const bar=own==null||mean==null?'':`<div class="summary-compare-track" role="img" aria-label="${E(`${title}: ${ownText}; ${meanText}`)}"><span class="summary-compare-fill" style="width:${Math.min(100,100*own/maximum)}%"></span><span class="summary-compare-average" style="left:${Math.min(100,100*mean/maximum)}%"></span></div>`;
    return `<div class="summary-comparison"><div class="summary-comparison-copy"><h5>${E(title)}</h5><p>${E(description)}</p></div><div class="summary-comparison-data">${bar}<div class="summary-comparison-values"><strong>${E(ownText)}</strong><span>${E(meanText)}</span></div></div></div>`;
  };
  const countText=value=>value==null?'Sin datos':`${number(value)} ${value===1?'estudiante':'estudiantes'}`;
  const nominationText=(value,relation)=>value==null?'Sin recuento disponible.':`${countText(value)} ${scope} ${value===1?'declara':'declaran'} ${relation==='amistad'?'buena':'mala'} relación con esta persona.`;
  const meanText=value=>value==null?'Media del aula: Sin datos':`Media del aula: ${number(value)}`;
  const receivedFriendMean=classMean('amistad_recibida_n'),receivedRejectMean=classMean('rechazo_recibido_n');
  const crtScores=classRows.map(row=>row.crt_aciertos).filter(value=>typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=3);
  const crtMean=average(crtScores);
  const recText=ownReciprocity===null?known(r.amistad_declarada_n)&&r.amistad_declarada_n===0?'No aplicable · 0 relaciones declaradas':'Sin datos':`${number(r.amistad_reciproca_n)} de ${number(r.amistad_declarada_n)} · ${number(ownReciprocity)} %`;
  const freq=value=>value===null||value===undefined?'Sin datos':['Nunca','Casi nunca','Algunas veces','Casi siempre','Siempre'][value]||'Sin datos';
  const position=(title,value,detail,missingLabel='Sin datos')=>`<div class="summary-position-item"><span>${E(title)}</span><strong>${value==null?E(missingLabel):`${number(value)} <small>/ 10</small>`}</strong><small>${E(detail)}</small></div>`;
  const signalTone=self==='Sí'?'summary-alert':r.bullying_companeros_n>0?'summary-caution':'summary-neutral';
  const signal=(title,value)=>`<div class="summary-signal"><span>${E(title)}</span><strong>${E(value)}</strong></div>`;
  return `<article class="report">${reportHero(name,`${r.Curso} · ${r.Grupo} · Código ${r.ID}`,'Ficha de estudiante')}
    <div class="report-body student-brief"><button id="back-to-roster" class="quiet back-list" type="button">← Volver a la lista de aula</button>
    <h3 class="summary-heading">Resumen de la ficha</h3>${networkCoverageNote(r)}
    <div class="summary-grid">
      <section class="summary-panel summary-wide ${signalTone}" aria-labelledby="summary-bullying-title"><h4 id="summary-bullying-title">Señales de acoso escolar</h4><div class="summary-signal-grid">
        ${signal('¿Declara haber sufrido acoso?',self??(r.respondio==='No'?'No respondió':'Datos insuficientes'))}
        ${signal('¿Cuántas menciones de acoso recibe?',countText(r.bullying_companeros_n))}
        </div><p class="summary-note">Son señales para contrastar, no un diagnóstico.</p>
      </section>
      <section class="summary-panel summary-wellbeing" aria-labelledby="summary-wellbeing-title"><div class="summary-card-heading"><h4 id="summary-wellbeing-title">Bienestar</h4><strong>${r.felicidad==null?'Sin datos':`${number(r.felicidad)} / 10`}</strong></div>
        <p class="summary-time">Durante la última semana</p><div class="summary-wellbeing-facts"><p>¿Con qué frecuencia se ha sentido bien en el centro? <strong>${E(freq(r.felicidad_centro))}</strong></p><p>¿Con qué frecuencia ha disfrutado con sus amistades? <strong>${E(freq(r.felicidad_diversion))}</strong></p><p>¿Con qué frecuencia ha sentido soledad? <strong>${E(freq(r.felicidad_soledad))}</strong></p></div>
        <details class="reading-note"><summary>Cómo se calcula</summary><p>El índice combina estas tres respuestas e invierte la de soledad. Suma 0–12, expresada de 0 a 10.</p></details>
      </section>
      <section class="summary-panel summary-friendship" aria-labelledby="summary-friendship-title"><h4 id="summary-friendship-title">Relaciones</h4><p class="summary-legend"><span class="summary-key-person"></span> Estudiante <span class="summary-key-mean"></span> Media del aula</p>
        ${comparison('¿Cuántas buenas relaciones recibe?',nominationText(r.amistad_recibida_n,'amistad'),r.amistad_recibida_n,receivedFriendMean,countMax('amistad_recibida_n'),countText(r.amistad_recibida_n),meanText(receivedFriendMean))}
        ${comparison('¿Cuántas malas relaciones recibe?',nominationText(r.rechazo_recibido_n,'rechazo'),r.rechazo_recibido_n,receivedRejectMean,countMax('rechazo_recibido_n'),countText(r.rechazo_recibido_n),meanText(receivedRejectMean))}
        ${comparison('¿Cuántas buenas relaciones son mutuas?',ownReciprocity===null?(r.amistad_declarada_n===0?'No ha declarado buenas relaciones.':'Falta su respuesta sobre relaciones.'):`${number(ownReciprocity)} % de sus buenas relaciones declaradas son mutuas.`,ownReciprocity,meanReciprocity,100,recText,meanReciprocity===null?(r.red_centro_completa===false?'Media del aula: No calculable':'Media del aula: Sin datos'):`Media del aula: ${number(meanReciprocity)} %`)}
        <details class="reading-note"><summary>Cómo leer las relaciones</summary><p>Buenas relaciones incluye «buena» y «muy buena relación»; muy buenas relaciones es un subconjunto. Malas relaciones incluye «mala» y «muy mala relación». </p><p>Las medias usan los datos disponibles de esta aula. Las menciones pueden venir de todo el centro. Las barras de recuentos llegan al máximo observado en el aula; las relaciones mutuas usan 0–100 %.</p></details>
      </section>
    </div>
    <details class="expanded-details"><summary>Ver más indicadores <span aria-hidden="true">↓</span></summary><div class="student-more-grid">
      <section class="summary-panel summary-position" aria-labelledby="summary-position-title"><h4 id="summary-position-title">Posición en la red</h4>
        ${position('¿Qué puntuación tiene en buenas relaciones recibidas?',r.popularidad,r.amistad_recibida_n==null?'Menciones recibidas: Sin datos':`Buenas relaciones recibidas: ${number(r.amistad_recibida_n)}`)}
        ${position('¿Cuál es su centralidad?',r.centralidad,r.ambito_centralidad==='clase'?'Conexión con las buenas relaciones de su aula':'Conexión con sus buenas relaciones',r.centralidad_estado==='no_edges'?'Sin buenas relaciones en esta red':r.centralidad_estado==='non_unique'?'Sin un resultado único':r.centralidad_estado==='no_convergence'?'Cálculo pendiente':'Sin datos')}
        ${r.ambito_centralidad==='clase'?`<details class="reading-note"><summary>Cómo se calcula la centralidad</summary><p>Se calcula dentro del aula. Cada mención de buena relación pesa uno; si es recíproca, suma dos. El valor mayor del aula es 10.${r.red_clase_pendiente_pct>0?` Falta por completar el ${number(r.red_clase_pendiente_pct)} % de las respuestas relacionales de esta aula.`:''}</p></details>`:''}
      </section>
      <section class="summary-panel summary-mediation" aria-labelledby="summary-mediation-title"><h4 id="summary-mediation-title">Mediación</h4><p class="summary-question">¿Cuántas menciones de buena mediación recibe?</p><strong class="summary-big-value">${countText(r.mediacion_negativa_n==null?null:r.mediacion_n)}</strong><p class="summary-question">¿Cuántas menciones de mala mediación recibe?</p><strong class="summary-big-value">${countText(r.mediacion_negativa_n)}</strong><p class="summary-note">Buena y mala mediación incluyen las respuestas «muy buena» y «muy mala», respectivamente. Una persona puede recibir ambas.</p></section>
      ${Object.prototype.hasOwnProperty.call(r,'crt_aciertos')?`<section class="summary-panel summary-cognitive" aria-labelledby="summary-cognitive-title"><h4 id="summary-cognitive-title">Test de impulsividad</h4><p class="summary-question">¿Cuántas de las tres preguntas acertó?</p><strong class="summary-big-value">${r.crt_aciertos==null?'Sin datos':`${number(r.crt_aciertos)} <small>/ 3</small>`}</strong><p class="summary-class-mean">Media del aula: ${crtMean==null?'Sin datos':`${number(crtMean)} / 3`}${crtMean==null?'':` · ${number(crtScores.length)} ${crtScores.length===1?'respuesta válida':'respuestas válidas'}`}</p>${r.crt_aciertos==null?'':`<div class="summary-crt-track" role="img" aria-label="${number(r.crt_aciertos)} aciertos de 3"><span style="width:${100*r.crt_aciertos/3}%"></span></div><div class="summary-crt-labels"><span>0</span><span>1</span><span>2</span><span>3</span></div>`}<p class="summary-note">Este resultado no diagnostica impulsividad.</p></section>`:''}
    </div>${studentReportExpanded(r)}${studentNetworkSection(C.studentNetwork(visibleRows,r.ID))}</details></div></article>`;
}

function studentReportExpanded(r){
  const normalized=['normalizada_v1','centro_observado_v1'].includes(r.escala_indicadores);
  const pred=t=>detail([r[`pred_${t}_aciertos`],r[`pred_${t}_n`]],(a,n)=>n?`${a} de ${n} predicciones correctas`:'Sin predicciones declaradas');
  return `<div class="expanded-report">${reading(normalized)}<div class="network-grid">
    <section class="section-panel panel-connections">${section('01','Buenas relaciones','panel-connections')}
      ${metric('Buenas relaciones declaradas',r.sociabilidad,detail([r.amistad_declarada_n],n=>`Declara buena relación con ${n} ${n===1?'estudiante':'estudiantes'}`))}
      ${metric('Acierto de predicciones de buenas relaciones',r.acierto_amistad,pred('amistad'),r.pred_amistad_n===0?'No aplicable':null)}
    </section>
    <section class="section-panel panel-context">${section('02','Malas relaciones','panel-context')}
      ${metric('Malas relaciones declaradas',r.rechazo_declarado,detail([r.rechazo_declarado_n],n=>`Nombra a ${n} ${n===1?'estudiante':'estudiantes'} con quienes declara mala relación`))}
      ${metric('Malas relaciones mutuas',r.reciprocidad_rechazo,detail([r.rechazo_reciproco_n,r.rechazo_declarado_n],(a,b)=>b?`${a} de sus ${b} malas relaciones declaradas son mutuas`:'Sin relaciones declaradas'),r.rechazo_declarado_n===0?'No aplicable':null)}
      ${metric('Acierto de predicciones de malas relaciones',r.acierto_rechazo,pred('rechazo'),r.pred_rechazo_n===0?'No aplicable':null)}
    </section></div></div>`;
}
function studentNetworkSection(network){return N.view(network);}
function studentNetworkClick(event){
  const zoom=event.target.closest('button[data-network-zoom]');
  if(zoom){N.zoom(zoom.closest('.student-network'),zoom.dataset.networkZoom);return;}
  const link=event.target.closest('a[data-network-student]');
  if(!link||!dataset||view!=='student')return;
  event.preventDefault();
  const target=dataset.students.find(row=>row.ID===link.dataset.networkStudent);
  if(!target||target.Campus!==selection.center)return;
  const network=C.studentNetwork(dataset.students,selection.student);
  if(!network.neighbors.some(row=>row.ID===target.ID))return;
  if(tour)stopTour();
  selection={center:target.Campus,course:target.Curso,group:target.Grupo,student:target.ID};
  changeView('student');
  const heading=document.querySelector('.report-hero h2');
  heading.setAttribute('tabindex','-1');heading.focus();
}
for(const event of ['pointerdown','keydown','wheel','touchstart'])document.addEventListener(event,()=>{lastActivity=Date.now();},{passive:true});
async function checkInactivity(){
  if(!profile||closing)return;
  const idle=Date.now()-lastActivity;
  if(idle>15*60*1000){
    if(!demoSession&&hasSessionReviews()){
      if(draftCount()){
        if(!document.getElementById('review-incomplete-open')){
          closeStatus('Hay opiniones sin terminar. La consulta no se ha cerrado para evitar perderlas. Complétalas o descártalas antes de enviar.');
          const review=document.createElement('button');review.id='review-incomplete-open';review.type='button';review.className='quiet';review.textContent='Revisar lo pendiente';review.onclick=()=>showReviewPreview();document.getElementById('close-status').append(review);
        }
        return;
      }
      // A timeout must not discard feedback. Only the provider acknowledgement
      // permits closeWithReviews to retire this session; failures retain it.
      return closeWithReviews();
    }
    finish('La consulta ha caducado tras 15 minutos sin actividad. Vuelve a entrar para continuar.');return;
  }
  if(idle>13*60*1000&&!demoSession&&hasSessionReviews()&&!document.getElementById('continue-session')){
    closeStatus('En menos de 2 minutos se intentarán enviar las valoraciones añadidas al equipo PBIS por Formspree y cerrar la sesión. Puedes revisarlas o continuar la consulta. Si el envío falla o quedan borradores, no se borrarán.');
    const button=document.createElement('button');button.id='continue-session';button.type='button';button.className='quiet';button.textContent='Continuar consulta';button.onclick=()=>{lastActivity=Date.now();document.getElementById('close-status')?.remove();};document.getElementById('close-status').append(button);
  }
}
setInterval(checkInactivity,5000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkInactivity();});
window.addEventListener('online',()=>accessAudit?.flush());
window.addEventListener('beforeunload',event=>{if(profile&&!demoSession&&hasSessionReviews()){event.preventDefault();event.returnValue='';}});
window.addEventListener('pagehide',()=>{clearState();root.replaceChildren();});
window.addEventListener('pageshow',event=>{if(event.persisted)login('La consulta anterior se ha cerrado. Vuelve a identificarte.');});
login();
if(hasDemo&&['#demo','#guia'].includes(window.location?.hash))startTour();
})();
