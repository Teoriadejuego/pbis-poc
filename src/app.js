(function(){
'use strict';
const C=window.PbisCore,root=document.getElementById('root'),E=C.escapeHtml;
const rosterReviews=window.PbisRosterReview.createStore();
let profile=null,books={data:null},dataset=null,view='group',selection={center:'',course:'',group:'',student:''},rosterSort={key:'student',direction:'asc'},generation=0,lastActivity=Date.now(),failures=0,blockedUntil=0;
const jobs=new Set();
const fileVersion={data:0};
const demoAccount=window.PBIS_DEMO_ACCOUNT||{username:'demo',password:'DEMO26'};
const hasDemo=!!(window.PBIS_DEMO_URL||window.PBIS_DEMO_DATA);
let demoSession=false,closeDestination='login';
let sourceMode='none';
let closing=false,closeEventId=null,closeAbort=null,pendingReviewBatch=null;
let demoAbort=null;
let tour=null;
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
function networkCoverageNote(row){const pending=row?.red_centro_pendiente_pct;return typeof pending==='number'&&pending>0?`<p class="network-coverage-note">Falta por completar el ${E(number(pending))} % de la red del centro: estudiantes sin respuesta relacional. Las medidas de red usan los vínculos observados y pueden cambiar al completarse.</p>`:'';}
function section(n,title,color){return `<div class="section-label ${color||''}"><span class="section-number">${n}</span><h3>${title}</h3></div>`;}
function metric(title,value,text,missingLabel){const valueHtml=value==null&&missingLabel?`<span class="missing">${E(missingLabel)}</span>`:score(value);return `<div class="metric"><div class="metric-top"><h4>${E(title)}</h4><div class="score">${valueHtml}</div></div><p>${E(text)}</p>${value==null&&missingLabel?'':meter(value,title)}</div>`;}
function cancelJobs(kind){for(const job of [...jobs]){if(kind&&job.kind!==kind)continue;job.worker.terminate();URL.revokeObjectURL(job.url);clearTimeout(job.timer);jobs.delete(job);job.reject(Error('Lectura cancelada.'));}}
function clearState(){stopTour();demoSession=false;closeDestination='login';closeAbort?.abort();closeAbort=null;demoAbort?.abort();demoAbort=null;closing=false;closeEventId=null;pendingReviewBatch=null;window.PBIS_UPDATE_CLOSE=null;window.PbisFeedback.reset();rosterReviews.clear();generation++;cancelJobs();sourceMode='none';books={data:null};dataset=null;profile=null;selection={center:'',course:'',group:'',student:''};rosterSort={key:'student',direction:'asc'};view='group';root.querySelectorAll('input').forEach(x=>{x.value='';});}
function finish(message='Sesión cerrada. Los datos se han retirado de la consulta.',destination='login'){clearState();demoSession=false;closeDestination='login';login(message);if(destination==='home')window.location.assign(window.PBIS_HOME||'index.html');}
function bindBrand(){document.querySelectorAll('.brand-home').forEach(button=>button.onclick=()=>profile?closeWithReviews('home'):finish('','home'));}
async function enterDemo(guided=false){
  if(!hasDemo)return;
  if(profile&&hasSessionReviews()&&!demoSession){closeStatus('Envía o descarta las valoraciones antes de abrir la demo.');return;}
  if(profile&&!demoSession&&sourceMode==='files'){closeStatus('Cierra tu consulta antes de abrir la demo.');return;}
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
    const discard=document.createElement('button');discard.type='button';discard.className='quiet';discard.textContent='Cerrar sin enviar';discard.onclick=()=>finish('Sesión cerrada sin enviar las valoraciones.',closeDestination);box.append(discard);
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
function updateCloseAction(){const button=document.getElementById('logout');if(!button||closing)return;const count=reviewCount();button.textContent=demoSession?'Cerrar sesión':count?`Enviar valoraciones y cerrar · ${count}`:'Cerrar sesión';button.setAttribute('aria-label',button.textContent);}
async function closeWithReviews(destination='login'){
  if(closing||!profile)return;
  closeDestination=destination==='home'?'home':'login';
  const completedPractice=demoSession&&tour?.step==='close';
  // Training marks never become part of an outgoing review batch.
  if(tour)stopTour();
  const button=document.getElementById('logout');
  closing=true;button.disabled=true;button.textContent='Cerrando…';button.setAttribute('aria-label','Cerrando sesión');
  try{
    const batch=await reviewBatch();
    if(!batch){finish(completedPractice?'Práctica completada. Has cerrado la sesión: las fichas se han retirado y las valoraciones de práctica se han eliminado.':demoSession?'Demo cerrada. Las valoraciones de práctica se han eliminado.':undefined,closeDestination);return;}
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
    finish('Valoraciones registradas. El aviso por correo puede tardar.',closeDestination);
  }catch(error){
    if(!profile)return;
    lastActivity=Date.now();
    closeStatus(`No se ha podido confirmar el envío: ${error.message} La sesión permanece abierta. Si reintentas, podría llegar una copia adicional.`,true);
    button.disabled=false;button.textContent='Reintentar envío y cierre';button.setAttribute('aria-label','Reintentar envío y cierre de sesión');button.onclick=()=>closeWithReviews(closeDestination);
  }finally{closing=false;}
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
    class:['3 de 16','Elige la clase del ejercicio',`En los filtros selecciona ${tourClass.center} → ${tourClass.course} → ${tourClass.group}. Avanzaremos cuando coincidan los tres campos.`],
    group:['4 de 16','Lee primero las señales','La ficha empieza por preguntas sobre acoso, bienestar y amistades. Cada respuesta indica su fuente y cobertura. Pulsa «Lista de clase».'],
    sort:['5 de 16','Ordena para encontrar una señal','En la lista, pulsa «Le señalan» hasta que el orden sea descendente. Verás primero los recuentos mayores.'],
    reaction:['6 de 16','Contrasta dos respuestas',`${samuel?.Nombre||'Samuel L.'} no se señala y ${number(samuel?.bullying_companeros_n)} personas le señalan. La diferencia merece contraste profesional, no una conclusión automática. Pulsa ese dato y marca «Me sorprende».`],
    compare:['7 de 16','Mira otra dimensión',`${ana?.Nombre||'Ana M.'} recibe ${number(ana?.amistad_recibida_n)} nominaciones de amistad. Es una medida distinta: nunca compenses una señal de atención con amistades. Muestra su fila para seguir.`, 'Mostrar a Ana'],
    ana:['8 de 16','Abre su ficha','Pulsa el nombre de Ana en la lista. Su resumen empieza por señales de acoso, bienestar y relaciones de amistad.'],
    'student-bullying':['9 de 16','Separa las fuentes de acoso',`${ana?.Nombre||'Ana M.'} responde «${ana?.bullying_autorreporte??'Sin datos'}» y ${number(ana?.bullying_companeros_n)} personas le señalan. Son fuentes distintas; ni el color ni un cero establecen un diagnóstico.`, 'Continuar: bienestar'],
    'student-wellbeing':['10 de 16','Bienestar','Aquí aparecen las tres respuestas originales. La soledad se invierte solo al calcular el índice; la respuesta que ves no se modifica.', 'Continuar: amistades'],
    'student-relations':['11 de 16','Relaciones de amistad',`${ana?.Nombre||'Ana M.'} recibe ${number(ana?.amistad_recibida_n)} nominaciones de amistad. Las elecciones correspondidas se leen con su propio denominador.`, 'Continuar: más indicadores'],
    'student-details':['12 de 16','Amplía con contexto','Pulsa «Ver más indicadores» para consultar posición, mediación, el test de impulsividad y otros indicadores relacionales.'],
    network:['13 de 16','Observa las relaciones','En el detalle tienes mediación, test de impulsividad y una red con flechas de entrada y salida. El color distingue amistad y rechazo; el grosor, intensidad. Puedes comprobar cada vínculo en su lista.','Ver ficha de centro'],
    center:['14 de 16','Amplía la mirada al centro','Orientación puede ver los totales del centro. Los recuentos de mediación distinguen valoraciones positivas y negativas. Después vuelve al ejercicio para expresar tu confianza.','Volver a la lista'],
    confidence:['15 de 16','Valora tu confianza','Busca la fila de Ana y mueve el control «Confianza en los datos» entre −5 y +5. Es tu apreciación, separada de las respuestas.'],
    practice:['Ejercicio esencial','Valora un dato de la lista',`${samuel?.Nombre||'Samuel L.'} no se señala y ${number(samuel?.bullying_companeros_n)} personas le señalan. Pulsa «Le señalan» en su fila y elige «Me sorprende». No implica un diagnóstico.`],
    close:['16 de 16','Tus comentarios se envían al cerrar','Pulsa «Cerrar sesión», arriba, para terminar. En una consulta con tu cuenta, este botón envía al equipo PBIS tus comentarios y valoraciones: espera la confirmación antes de cerrar la pestaña. También retira las fichas de la pantalla. Ahora practicarás el cierre; no se enviarán datos de esta demo.']
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
root.innerHTML=`<main id="main" class="login"><section class="login-story">${brand()}<div><span class="eyebrow">ORIENTACIÓN Y CONVIVENCIA ESCOLAR</span><h1>Cada vínculo<br>cuenta.</h1><p class="intro">Indicadores de clase y estudiante para orientar la conversación.</p></div><svg class="login-art" viewBox="0 0 430 210" fill="none" aria-hidden="true"><path d="m62 80 104-42 79 74 110-67M62 80l52 96 131-64 97 60M166 38l-52 138M245 112l110-67M342 172 355 45" stroke="var(--turquoise)" stroke-width="1.4"/><circle cx="62" cy="80" r="21" fill="var(--lime)"/><circle cx="166" cy="38" r="14" fill="var(--blue-soft)"/><circle cx="245" cy="112" r="36" fill="var(--white)"/><circle cx="355" cy="45" r="24" fill="var(--turquoise)"/><circle cx="114" cy="176" r="27" fill="var(--blue-soft)"/><circle cx="342" cy="172" r="16" fill="var(--lime)"/><circle cx="245" cy="112" r="49" stroke="var(--turquoise)"/></svg><footer><span>4.º de Primaria → 2.º de Bachillerato</span><span>Edición de evaluación · 0.10.2</span></footer></section><section class="login-side"><div class="login-panel"><span class="pill"><span class="dot"></span>CONSULTA EN TU NAVEGADOR</span><h2>Accede a las fichas</h2>${hasDemo?`<div class="demo-access"><button id="start-tour-login" class="btn" type="button">Comenzar práctica guiada →</button></div>`:''}<p class="intro">¿Tienes una cuenta? Accede con las claves que te entregue orientación.</p>${message?`<p class="toast" role="status">${E(message)}</p>`:''}<form id="login-form" autocomplete="off"><label class="field">Cuenta de acceso<input id="username" name="pbis-user" autocomplete="off" autocapitalize="none" spellcheck="false" required placeholder="Tu cuenta de acceso"></label><label class="field">Contraseña<span class="password-wrap"><input id="password" name="pbis-password" type="password" autocomplete="off" required placeholder="Introduce tu contraseña"><button id="show-password" type="button" aria-label="Mostrar contraseña" aria-pressed="false">Mostrar</button></span></label><p id="login-error" class="error" role="alert"></p><button class="btn" type="submit">Entrar <span aria-hidden="true">→</span></button></form><p class="login-note">Los archivos se leen en este navegador. Las valoraciones se envían por Formspree al cerrar sesión.<br><button id="login-help" class="quiet" type="button">Cómo empezar ↗</button></p></div></section></main>`;
bindBrand();
document.getElementById('login-help').onclick=showHelp;
if(hasDemo){
  document.getElementById('start-tour-login').onclick=startTour;
}
document.getElementById('show-password').onclick=function(){const input=document.getElementById('password'),show=input.type==='password';input.type=show?'text':'password';this.textContent=show?'Ocultar':'Mostrar';this.setAttribute('aria-pressed',String(show));this.setAttribute('aria-label',show?'Ocultar contraseña':'Mostrar contraseña');};
document.getElementById('login-form').onsubmit=function(event){event.preventDefault();const err=document.getElementById('login-error');if(Date.now()<blockedUntil){err.textContent='Espera unos segundos antes de volver a intentarlo.';return;}
const u=document.getElementById('username').value.trim().toLowerCase(),p=document.getElementById('password').value.trim().toUpperCase();
if(hasDemo&&u===demoAccount.username&&p===demoAccount.password){failures=0;return enterDemo(true);}
const account=window.PBIS_PROFILES.find(x=>x.username===u&&x.password===p);
document.getElementById('password').value='';if(!account){failures++;if(failures>=5){blockedUntil=Date.now()+30000;failures=0;}err.textContent='Cuenta o clave incorrectas. Revisa el acceso que te ha entregado orientación.';return;}
demoSession=false;profile={...account};delete profile.password;window.PbisFeedback.startSession(profile.role);failures=0;lastActivity=Date.now();workspace();if(tour?.step==='login')tour.quickStart?jumpToValuation():tourMove('load');else if(tour?.step==='quick-loading')jumpToValuation();};
}
function canViewCenter(){return profile?.role==='orientador';}
function renderAccounts(showKeys=false){
  if(profile?.role!=='orientador'||demoSession)return;
  const dialog=document.getElementById('accounts-dialog');
  if(!dialog)return;
  const accounts=window.PBIS_PROFILES.slice().sort((a,b)=>a.role===b.role?C.compareCourses(a.course||'',b.course||''):a.role==='orientador'?-1:1);
  dialog.innerHTML=`<div class="accounts-heading"><div><span class="eyebrow">GESTIÓN DE ACCESOS · PILOTO</span><h2>Cuentas y claves</h2></div><button id="close-accounts" class="quiet" type="button">Cerrar ×</button></div><p>Orientación consulta todas las cuentas y entrega cada clave a la persona autorizada. Las tutorías consultan su curso en todos los centros y grupos cargados.</p><div class="accounts-actions"><button id="toggle-account-keys" class="btn secondary" type="button">${showKeys?'Ocultar claves':'Mostrar claves'}</button></div><div class="accounts-scroll"><table class="accounts-table"><thead><tr><th>Cuenta</th><th>Alcance</th><th>Clave</th></tr></thead><tbody>${accounts.map(account=>`<tr><td><strong>${E(account.username)}</strong></td><td>${E(account.role==='orientador'?'Todos los cursos, centros y grupos':account.course+' · todos los centros y grupos')}</td><td><code>${showKeys?E(account.password):'••••••'}</code></td></tr>`).join('')}</tbody></table></div><p class="accounts-note">Estas claves están incluidas en el código de esta edición pública de prueba. Para datos reales hace falta autenticación gestionada fuera del navegador.</p>`;
  document.getElementById('close-accounts').onclick=()=>dialog.close();
  document.getElementById('toggle-account-keys').onclick=()=>renderAccounts(!showKeys);
}
function workspace(){
root.innerHTML=`<header class="topbar"><div class="topbar-inner"><div>${brand()}<p class="brand-caption">Orientación y convivencia escolar</p></div><div class="top-actions"><div class="user-info"><strong>${E(profile.label)}</strong>${E(profile.username)}</div><button id="help-button" type="button" class="quiet">Ayuda</button><button id="logout" type="button" class="btn secondary">Cerrar sesión</button></div></div></header>${demoSession?'<div class="demo-mode-note"><span><strong>Modo demo</strong> · Datos simulados. Las valoraciones son de práctica.</span><button id="demo-account" type="button" class="quiet">Acceder con mi cuenta →</button></div>':''}<main id="main" class="main"><div class="workspace-title"><div><span class="eyebrow">ESPACIO DE CONSULTA</span><h1>Comprender para acompañar.</h1><p>Explora la clase, compara los datos y abre cada ficha.</p></div><span class="pill"><span class="dot"></span>En tu navegador</span></div>${hasDemo&&demoSession?`<section class="demo-banner" aria-label="Prueba de concepto"><div><strong>Ejemplo para explorar las fichas</strong><p id="demo-source">Pulsa «Cargar datos demo» para consultar los datos simulados.</p></div><button id="load-demo" class="btn secondary" type="button">Cargar datos demo</button></section>`:''}<details id="import-details" class="upload-area${demoSession?' hidden':''}" open><summary>${svg('file').replace('<svg ','<svg width="18" height="18" ')}Archivos de la consulta <span id="import-summary" class="subtle">Carga el archivo de datos</span></summary><div class="import-body"><div class="uploads">${upload('data','01','Datos e indicadores','Carga el archivo .pbis o Excel del cuestionario (Users) o de indicadores (Datos). Los nombres son opcionales.')}</div><div class="import-bottom"><button id="show-reports" class="btn" type="button" disabled>Abrir consulta <span aria-hidden="true">→</span></button><p>Datos .pbis, .xlsx o .xls · máximo 20 MB.<br>Al sustituir el archivo se retiran los resultados anteriores.</p></div><p id="import-error" class="error" role="alert"></p><p id="import-status" class="status" role="status" aria-live="polite"></p></div></details><div class="results-tools"><div><span class="eyebrow">CONSULTA DEL GRUPO</span><h1>Vista de clase</h1></div>${demoSession?'':'<button id="change-files" class="btn secondary" type="button">Cambiar archivo</button>'}</div><div class="tabs" role="tablist" aria-label="Tipo de ficha"><button id="tab-group" class="tab" role="tab" aria-selected="true" aria-controls="report-content" disabled>${svg('people')}Ficha de clase</button><button id="tab-roster" class="tab" role="tab" aria-selected="false" aria-controls="report-content" tabindex="-1" disabled>Lista de clase</button><button id="tab-student" class="tab" role="tab" aria-selected="false" aria-controls="report-content" tabindex="-1" disabled>${svg('person')}Ficha individual</button></div><div id="filters" class="filters hidden"></div><div id="report-content" role="tabpanel" aria-labelledby="tab-group">${empty()}</div><footer class="bottom"><span>PBIS · Edición de evaluación 0.10.2 · Los Excel permanecen en este navegador.</span><span>Las fichas orientan la conversación; la interpretación es profesional.</span></footer></main>`;
if(canViewCenter()){document.querySelector('.tabs').classList.add('has-center');document.querySelector('.tabs').insertAdjacentHTML('afterbegin',`<button id="tab-center" class="tab" role="tab" aria-selected="false" aria-controls="report-content" tabindex="-1" disabled>${svg('network')}Ficha de centro</button>`);}
if(profile.role==='orientador'&&!demoSession){
  document.querySelector('.top-actions').insertAdjacentHTML('afterbegin','<button id="open-accounts" class="quiet" type="button">Cuentas y claves</button>');
  root.insertAdjacentHTML('beforeend','<dialog id="accounts-dialog" class="accounts-dialog" aria-label="Cuentas y claves de acceso"></dialog>');
  document.getElementById('open-accounts').onclick=()=>{renderAccounts();document.getElementById('accounts-dialog').showModal();};
  document.getElementById('accounts-dialog').addEventListener('close',()=>renderAccounts());
}
bindBrand();if(demoSession)document.getElementById('demo-account').onclick=()=>finish('Accede con tu cuenta para cargar un archivo.');
document.getElementById('logout').onclick=()=>closeWithReviews();document.getElementById('help-button').onclick=showHelp;
if(hasDemo){const id=demoSession?'start-tour':'open-demo';document.getElementById('help-button').insertAdjacentHTML('afterend',`<button id="${id}" type="button" class="quiet">Práctica guiada</button>`);document.getElementById(id).onclick=startTour;}
window.PBIS_UPDATE_CLOSE=updateCloseAction;
updateCloseAction();
const reportContent=document.getElementById('report-content');
reportContent.addEventListener('click',rosterReviewClick);
reportContent.addEventListener('input',rosterReviewInput);
reportContent.addEventListener('change',rosterReviewChange);
reportContent.addEventListener('pointerup',rosterReviewChange);
reportContent.addEventListener('pointerdown',rosterReviewStart);
reportContent.addEventListener('toggle',event=>{
  if(!event.target.matches('.expanded-details')||!event.target.open)return;
  const network=event.target.querySelector('.student-network-scroll');
  if(network)network.scrollLeft=Math.max(0,(network.scrollWidth-network.clientWidth)/2);
  if(tour?.step==='student-details')tourMove('network');
},true);
{const sheet=document.getElementById('sheet-data');document.getElementById('file-data').onchange=()=>chooseFile('data');sheet.onfocus=()=>{sheet.dataset.previous=sheet.value;};sheet.onchange=()=>{if(hasSessionReviews()){sheet.value=sheet.dataset.previous||sheet.value;closeStatus('Envía o descarta las valoraciones antes de cambiar la hoja.');return;}sheet.dataset.previous=sheet.value;invalidate('La hoja ha cambiado. Abre las fichas para validar la nueva selección.');};}
document.getElementById('show-reports').onclick=openReports;
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
  invalidate('Ejemplo simulado preparado en este navegador.');document.getElementById('demo-source').textContent='Datos simulados activos · Elige centro, curso y grupo.';openReports();
  if(tour?.step==='load')tourMove('class');
  else if(tour?.step==='quick-loading'){
    if(placeTourClass())tourMove('practice');else {stopTour();closeStatus('El ejemplo no contiene la clase prevista para esta práctica.');}
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
async function parseFile(file,kind,current){const buffer=await file.arrayBuffer();if(!current())throw Error('Lectura cancelada.');return new Promise((resolve,reject)=>{const url=URL.createObjectURL(new Blob([window.PBIS_PARSER],{type:'text/javascript'}));const worker=new Worker(url);const job={worker,url,reject,kind,timer:null};const close=()=>{worker.terminate();URL.revokeObjectURL(url);clearTimeout(job.timer);jobs.delete(job);};job.timer=setTimeout(()=>{close();reject(Error('La lectura ha tardado demasiado. Reduce el tamaño del archivo.'));},30000);jobs.add(job);worker.onmessage=e=>{close();e.data.error?reject(Error(e.data.error)):resolve(e.data);};worker.onerror=()=>{close();reject(Error('El navegador no ha podido leer el archivo. Abre PBIS.html con una versión actual de Chrome, Edge, Firefox o Safari.'));};worker.postMessage(buffer,[buffer]);});}
async function chooseFile(kind){
if(demoSession)return;
if(hasSessionReviews()){document.getElementById(`file-${kind}`).value='';closeStatus('Envía o descarta las valoraciones antes de cambiar los archivos.');return;}
if(sourceMode==='demo'){demoAbort?.abort();books={data:null};}
sourceMode='files';if(document.getElementById('demo-source'))document.getElementById('demo-source').textContent='Consulta con tu archivo · El ejemplo se ha retirado.';

const file=document.getElementById(`file-${kind}`).files[0];const ticket=++fileVersion[kind],session=generation,current=()=>ticket===fileVersion[kind]&&session===generation&&!!profile;cancelJobs(kind);books[kind]=null;const select=document.getElementById(`sheet-${kind}`);select.innerHTML='';select.disabled=true;invalidate(file?'Leyendo el archivo en este equipo…':'Carga el archivo de datos para continuar.');if(!file)return;
try{if(!/\.(pbis|xlsx|xls)$/i.test(file.name))throw Error('Selecciona un archivo .pbis (Excel renombrado), .xlsx o .xls.');if(file.size>20*1024*1024)throw Error('El archivo supera los 20 MB. Prepara una copia con las hojas necesarias.');const book=await parseFile(file,kind,current);if(!current())return;books[kind]=book;const valid=book.sheets.filter(x=>!x.unsupported);if(!valid.length)throw Error('No hay hojas compatibles: el máximo es 10.000 registros y 100 columnas por hoja, con un millón de celdas en total.');select.innerHTML=valid.map(x=>`<option value="${E(x.name)}">${E(x.name)}</option>`).join('');select.disabled=false;const preferred=valid.some(x=>x.name==='Users')?'Users':'Datos';if(valid.some(x=>x.name===preferred))select.value=preferred;invalidate('Archivo preparado. Revisa la hoja y pulsa «Abrir consulta».');}
catch(error){if(!current())return;books[kind]=null;document.getElementById('import-error').textContent=error.message;document.getElementById('import-status').textContent='';document.getElementById('show-reports').disabled=true;}
}
function rowsFor(book,name){const sheet=book.sheets.find(x=>x.name===name);if(!sheet||sheet.unsupported)throw Error(`La hoja ${name} no es compatible.`);const rows=sheet.rows;if(!rows.length)throw Error(`La hoja ${name} está vacía.`);const headers=rows[0].map(x=>String(x??'').trim());const used=headers.filter(Boolean);if(new Set(used).size!==used.length)throw Error(`La hoja ${name} tiene encabezados repetidos.`);if(headers.some(x=>['__proto__','prototype','constructor'].includes(x)))throw Error('La hoja contiene un encabezado no permitido.');if(rows.length>10001)throw Error(`La hoja ${name} supera los 10.000 registros admitidos.`);return rows.slice(1).filter(row=>row.some(x=>x!==null&&x!==''&&x!==undefined)).map(row=>{const result=Object.create(null);headers.forEach((h,i)=>{if(h)result[h]=row[i]??null;});return result;});}
function openReports(){
if(demoSession&&sourceMode!=='demo')return;
try{let data=rowsFor(books.data,document.getElementById('sheet-data').value),meta=books.data.sheets.some(x=>x.name==='Grupos')?rowsFor(books.data,'Grupos'):[],conversionWarnings=[];
if(window.PbisWave1?.isWave1(data)){const converted=window.PbisWave1.convert(data);data=converted.students;meta=converted.groups;conversionWarnings=converted.warnings;}
const all=C.validateAndJoin(data,null,meta);const scoped=C.scopeRows(all.students,profile).map(row=>({...row,Nombre:C.displayName(row.Nombre)}));if(!scoped.length)throw Error('No hay estudiantes de tu curso en este archivo. Comprueba tu cuenta y la columna Curso.');dataset={students:scoped,groups:all.groups.filter(g=>scoped.some(s=>s.Campus===g.Campus&&s.Curso===g.Curso&&s.Grupo===g.Grupo)),warnings:[...conversionWarnings,...all.warnings]};
const preferred=scoped.find(row=>row.Nombre==='Ana M.')||scoped[0];selection={center:profile.center||preferred.Campus,course:profile.course||preferred.Curso,group:profile.group||preferred.Grupo,student:preferred.ID};document.getElementById('import-error').textContent='';document.getElementById('import-status').textContent=`${scoped.length.toLocaleString('es-ES')} estudiantes disponibles para tu perfil. ${dataset.warnings.join(' ')}`;document.getElementById('import-status').className='status success';document.getElementById('import-summary').textContent=`${scoped.length.toLocaleString('es-ES')} estudiantes · ${scoped.some(row=>row.Nombre)?'Con nombres':'Consulta por códigos'}`;document.getElementById('import-details').open=false;document.getElementById('tab-group').disabled=false;document.getElementById('tab-roster').disabled=false;document.getElementById('tab-student').disabled=false;view='group';document.getElementById('main').classList.add('results-mode');changeView('group');document.getElementById('tab-group').focus();}
catch(error){dataset=null;document.getElementById('filters').innerHTML='';document.getElementById('filters').classList.add('hidden');document.getElementById('report-content').innerHTML=empty('Revisa el mensaje de validación y el archivo de datos.');document.getElementById('import-error').textContent=error.message;document.getElementById('import-status').textContent='';document.getElementById('import-details').open=true;}
}
const studentLabel=r=>r.Nombre?`${r.Nombre} · ${r.ID}`:`Estudiante · ${r.ID}`;
const unique=a=>[...new Set(a)];
function selectMarkup(id,label,options,chosen,extra=''){return `<label class="field ${extra}">${label}<select id="${id}">${options.map(x=>`<option value="${E(x.value??x)}" ${(x.value??x)===chosen?'selected':''}>${E(x.label??x)}</option>`).join('')}</select></label>`;}
function currentRows(){return dataset.students.filter(x=>x.Campus===selection.center&&x.Curso===selection.course&&x.Grupo===selection.group);}
function renderFilters(){const centers=unique(dataset.students.map(x=>x.Campus)).sort((a,b)=>a.localeCompare(b,'es'));if(!centers.includes(selection.center))selection.center=centers[0];const courses=unique(dataset.students.filter(x=>x.Campus===selection.center).map(x=>x.Curso)).sort((a,b)=>{const ai=C.COURSE_ORDER.indexOf(a),bi=C.COURSE_ORDER.indexOf(b);return (ai<0?99:ai)-(bi<0?99:bi)||a.localeCompare(b,'es');});if(!courses.includes(selection.course))selection.course=courses[0];const groups=unique(dataset.students.filter(x=>x.Campus===selection.center&&x.Curso===selection.course).map(x=>x.Grupo)).sort();if(!groups.includes(selection.group))selection.group=groups[0];const students=currentRows().slice().sort((a,b)=>(a.Nombre||'').localeCompare(b.Nombre||'','es')||a.ID.localeCompare(b.ID));if(!students.some(x=>x.ID===selection.student))selection.student=(students.find(x=>x.Nombre==='Ana M.')||students[0]).ID;
const filters=document.getElementById('filters');filters.className=`filters ${view==='student'?'individual':view==='center'?'center-only':''}`;filters.innerHTML=selectMarkup('center','Centro de enseñanza',centers,selection.center)+(view==='center'?'':selectMarkup('course','Curso',courses,selection.course)+selectMarkup('group','Grupo',groups,selection.group)+(view==='student'?`<label class="field student-search">Buscar estudiante<input id="student-search" type="search" placeholder="${dataset?.students.some(row=>row.Nombre)?'Nombre o código':'Código de estudiante'}" autocomplete="off"></label>`+selectMarkup('student','Estudiante',students.map(x=>({value:x.ID,label:studentLabel(x)})),selection.student,'student-select'):''));
for(const kind of (view==='center'?['center']:['center','course','group']))document.getElementById(kind).onchange=e=>{selection[kind]=e.target.value;renderFilters();renderReport();document.getElementById(kind).focus();if(tour){if(!tourAtClass())tourMove('class');else if(tour.step==='class')tourMove('group');else renderTour();}};if(view==='student'){document.getElementById('student').onchange=e=>{selection.student=e.target.value;renderReport();};document.getElementById('student-search').oninput=e=>{const term=e.target.value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const found=students.filter(x=>`${x.Nombre} ${x.ID}`.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(term));document.getElementById('student').innerHTML=found.length?found.map(x=>`<option value="${E(x.ID)}">${E(studentLabel(x))}</option>`).join(''):'<option value="">Sin coincidencias</option>';document.getElementById('student').disabled=!found.length;if(found.length){selection.student=found[0].ID;renderReport();}else document.getElementById('report-content').innerHTML=empty('No hay estudiantes que coincidan con la búsqueda. Prueba otro nombre o ID.');};}}
function changeView(next){if(!dataset)return;if(next==='center'&&!canViewCenter())return;if(next==='center'&&tour&&tour.step!=='center')stopTour();view=next;const tabs=[...(canViewCenter()?['center']:[]),'group','roster','student'];for(const id of tabs){const tab=document.getElementById('tab-'+id),chosen=next===id;tab.disabled=false;tab.setAttribute('aria-selected',String(chosen));tab.tabIndex=chosen?0:-1;}document.getElementById('report-content').setAttribute('aria-labelledby','tab-'+next);document.querySelector('.results-tools .eyebrow').textContent=next==='center'?'CONSULTA DEL CENTRO':'CONSULTA DEL GRUPO';document.querySelector('.results-tools h1').textContent=next==='center'?'Vista de centro':'Vista de clase';renderFilters();renderReport();if(tour?.step==='group'&&next==='roster')tourMove('sort');else if(tour?.step==='ana'&&next==='student'&&selection.student==='00253')tourMove('student-bullying');else if(tour)renderTour();}
function reportHero(title,subtitle,type){return `<header class="report-hero"><div><span class="eyebrow">${E(selection.center)} · PBIS</span><h2>${E(title)}</h2><p>${E(subtitle)}</p></div><div class="hero-type">${type}</div></header>`;}
function reading(normalized=true){return `<div class="reading"><span><strong>${normalized?'Indicadores normalizados':'Indicadores suministrados'}</strong> · escala 0–10</span>${legend()}</div>`;}
function renderReport(){
  if(!dataset)return;
  window.PbisFeedback.closeContext();
  const rows=currentRows(),centerRows=dataset.students.filter(row=>row.Campus===selection.center);
  const meta=dataset.groups.find(g=>g.Campus===selection.center&&g.Curso===selection.course&&g.Grupo===selection.group);
  const feedback=view==='center'?'':`<div class="feedback-toolbar"><button id="open-feedback" class="feedback-trigger" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M21 11a9 9 0 0 1-9 9H3l2-5a9 9 0 1 1 16-4Z"/><path d="M8 9h8M8 13h5"/></svg>Valorar esta ficha</button></div>`;
  const report=view==='center'?centerReport(centerRows):view==='group'?groupReportBrief(rows,meta)+'<div class="class-next"><button id="open-roster" class="btn" type="button">Ver lista de clase →</button></div>':view==='roster'?rosterReport(rows):studentReport(rows.find(x=>x.ID===selection.student)||rows[0],rows,centerRows);
  document.getElementById('report-content').innerHTML=feedback+report;
  if(view==='group')document.getElementById('open-roster').onclick=()=>changeView('roster');
  if(view==='roster')document.querySelectorAll('.student-link[data-student-id]').forEach(button=>button.onclick=()=>{selection.student=button.dataset.studentId;changeView('student');if(!tour)document.getElementById('report-content').scrollIntoView({block:'start'});});
  if(view==='student')document.getElementById('back-to-roster').onclick=()=>changeView('roster');
  if(view==='center')return;
  document.getElementById('open-feedback').onclick=async function(){const button=this,ticket=generation,type=view==='student'?'individual':view==='roster'?'roster':'group',studentCode=type==='individual'?selection.student:null;button.disabled=true;try{const classCode=await window.PbisFeedbackModel.classCode({center:selection.center,course:selection.course,group:selection.group,explicitCode:meta?.ID_aula});if(ticket===generation&&button.isConnected)window.PbisFeedback.open({sheet:type,classCode,studentCode});}catch(error){if(button.isConnected){let issue=document.createElement('p');issue.className='feedback-issue';issue.setAttribute('role','alert');issue.textContent=error.message;button.parentElement.append(issue);}}finally{if(button.isConnected)button.disabled=false;}};
}
function centerReport(rows){
  const g=C.aggregateCenter(rows),item=id=>g.attention.find(value=>value.id===id);
  const datum=value=>value?.count==null?'Sin datos':`${number(value.count)} de ${number(value.denominator)}`;
  const answer=(question,value,note)=>`<div class="group-answer"><h5>${E(question)}</h5><strong>${E(datum(value))}</strong>${value?.percent==null?'':`<span>${E(percent(value.percent))}</span>`}<p>${E(note)}</p></div>`;
  const icons=['megaphone','people','alone','ban','heart'];
  const support=(count)=>known(count)?`${number(count)} <small>de ${number(g.supportKnown)}</small>`:'<span class="missing">Sin datos</span>';
  const coverage=g.coverageComplete===false?`El archivo contiene ${number(g.n)} de ${number(g.expected)} estudiantes declarados para este centro. Los resultados se refieren solo a los registros disponibles.`:'Los resultados se refieren a los registros disponibles en el archivo.';
  const detail=`${reading(g.normalized)}<section class="section-panel panel-attention">${section('01','Señales de atención')}<div>${g.attention.map((a,i)=>`<div class="attention-row${a.id.startsWith('bullying_')?' is-bullying':''}"><span class="icon-bubble">${svg(icons[i])}</span><div class="attention-title"><h4>${E(a.title)}</h4><p>${E(a.description)}</p></div><div class="stat ${a.percent==null?'missing':''}">${percent(a.percent)}</div><div class="attention-scale"><div class="meter-label">${a.score==null?'Sin escala disponible':number(a.score)+' / 10'}</div>${meter(a.score,a.title)}</div></div>`).join('')}</div><p class="section-note">Las dos fuentes de acoso pueden coincidir y no se suman. Los porcentajes usan los registros válidos de todo el centro.</p></section>
    <section class="section-panel panel-context">${section('02','Mediación y convivencia','panel-context')}<div class="mediation-grid"><div><h4>Estudiantes con valoración positiva en mediación</h4><div class="stat">${g.mediators.count==null?'Sin datos':number(g.mediators.count)}</div><p>Al menos una nominación de buena o muy buena mediación. ${g.mediators.denominator?`${number(g.mediators.denominator)} registros disponibles.`:'Sin desglose por valoración en este archivo.'}</p></div><div><h4>Estudiantes con valoración negativa en mediación</h4><div class="stat">${g.negativeMediators.count==null?'Sin datos':number(g.negativeMediators.count)}</div><p>Al menos una nominación de mala o muy mala mediación. ${g.negativeMediators.denominator?`${number(g.negativeMediators.denominator)} registros disponibles.`:'Sin desglose por valoración en este archivo.'}</p></div></div><p class="section-note">Una persona puede figurar en ambas categorías. Se cuentan las nominaciones recibidas de otras personas.</p></section><p class="report-footer">${E(coverage)} Los recuentos recibidos pueden aumentar si faltan respuestas. Estas señales no establecen diagnósticos.</p>`;
  return `<article class="report">${reportHero(selection.center,`${number(g.n)} ${g.n===1?'estudiante':'estudiantes'} · ${number(g.classCount)} ${g.classCount===1?'clase':'clases'} · ${g.responses==null?'Respuestas sin cobertura completa':`${number(g.responses)} ${g.responses===1?'respuesta':'respuestas'}`}`,'Ficha de centro')}<div class="report-body group-brief center-brief"><h3 class="summary-heading">Resumen del centro</h3>${networkCoverageNote(rows[0])}<p class="center-coverage">${E(coverage)}</p><div class="group-summary-grid">
    <section class="group-summary-panel group-summary-alert" aria-labelledby="center-alert-title"><h4 id="center-alert-title">Señales de acoso escolar</h4>${answer('¿Cuántos estudiantes indican que han sufrido acoso?',item('bullying_declarado'),'Respuesta personal.')}${answer('¿Cuántos reciben señalamientos de otras personas?',item('bullying_companeros'),'Personas distintas, aunque reciban varias nominaciones.')}<p class="group-summary-note">Las dos fuentes pueden coincidir. No se suman ni establecen un diagnóstico.</p></section>
    <section class="group-summary-panel group-summary-wellbeing" aria-labelledby="center-wellbeing-title"><h4 id="center-wellbeing-title">Bienestar</h4>${answer('¿Cuántos indican soledad frecuente?',item('soledad'),'Casi siempre o siempre durante la última semana.')}</section>
    <section class="group-summary-panel group-summary-friendship" aria-labelledby="center-friendship-title"><h4 id="center-friendship-title">Relaciones de amistad</h4>${answer('¿Cuántos no tienen amistades recíprocas registradas?',item('sin_reciprocas'),'Vínculos observados entre estudiantes del centro.')}<p class="group-summary-note">El recuento se basa en las respuestas disponibles.</p></section>
    </div><details class="expanded-details"><summary>Ver más indicadores <span aria-hidden="true">↓</span></summary><div class="group-expanded">${detail}</div></details></div></article>`;
}
function groupReport(rows,meta){const g=C.aggregate(rows,meta),icons=['megaphone','people','alone','ban','heart'];const structure=(title,position,reason)=>`<div class="mini-card"><h4>${title}</h4><div class="stat">${position==null&&reason?`<span class="missing">${E(reason)}</span>`:score(position)}</div>${position==null&&reason?'':meter(position,title)}</div>`;return `<article class="report">${reportHero(`${selection.course} · ${selection.group}`,`${g.n} estudiantes · ${g.responses==null?'Respuestas sin cobertura completa':g.responses+' respuestas'}${g.period?' · '+g.period:''}`,'Ficha de clase')}<div class="report-body">${reading(g.normalized)}<section class="section-panel panel-attention">${section('01','Señales de atención')}<div>${g.attention.map((a,i)=>`<div class="attention-row${a.id.startsWith('bullying_')?' is-bullying':''}"><span class="icon-bubble">${svg(icons[i])}</span><div class="attention-title"><h4>${E(a.title)}</h4><p>${E(a.description)}</p></div><div class="stat ${a.percent==null?'missing':''}">${percent(a.percent)}</div><div class="attention-scale"><div class="meter-label">${a.score==null?'Sin escala disponible':number(a.score)+' / 10'}</div>${meter(a.score,a.title)}</div></div>`).join('')}</div><p class="section-note">Una misma persona puede figurar en ambas fuentes: no sumes los recuentos. Son señales, no diagnósticos.</p></section><section class="section-panel panel-connections">${section('02','Grupos e integración','panel-connections')}<div class="integration-grid"><div class="mini-card"><h4>Grupos de amistad</h4><div class="stat">${g.communities?g.communities.length:'<span class="missing">Sin datos</span>'}</div>${g.communities?`<div class="community-bar" aria-hidden="true">${g.communities.map(c=>`<span style="flex:${c.count}"></span>`).join('')}</div><p>${g.communities.map(c=>`${E(c.name)}: ${c.count}`).join(' · ')} estudiantes</p>`:'<p>Se requieren respuestas relacionales y amistades recíprocas para formar redes.</p>'}</div>${structure('Separación entre grupos',meta?.pos_separacion,meta?.red_clase_completa===false?'No calculable · faltan respuestas':null)}${structure('Desigualdad de popularidad',meta?.pos_desigualdad,meta?.red_centro_completa===false?'No calculable · faltan respuestas':null)}${structure('Centralización del grupo',meta?.pos_centralizacion,meta?.red_centro_completa===false?'No calculable · faltan respuestas':null)}</div><p class="section-note">Se agrupan amistades recíprocas conectadas. Varios grupos no implican conflicto.</p></section><section class="section-panel panel-context">${section('03','Mediación y convivencia','panel-context')}<div class="mediation-grid"><div><h4>Estudiantes con valoración positiva en mediación</h4><div class="stat">${number(g.mediators.count)}</div><p>Al menos una nominación de buena o muy buena mediación de otras personas. ${g.mediators.denominator?`${number(g.mediators.denominator)} registros disponibles.`:'Sin desglose por valoración en este archivo.'}</p></div><div><h4>Estudiantes con valoración negativa en mediación</h4><div class="stat">${g.negativeMediators.count==null?'Sin datos':number(g.negativeMediators.count)}</div><p>Al menos una nominación de mala o muy mala mediación de otras personas. ${g.negativeMediators.denominator?`${number(g.negativeMediators.denominator)} registros disponibles.`:'Sin desglose por valoración en este archivo.'}</p></div></div><p class="section-note">Una persona puede recibir valoraciones positivas y negativas.</p></section><p class="report-footer">${g.normalized?'Escalas normalizadas, no percentiles entre centros.':`Puntuaciones suministradas${meta?.salones_referencia?' · Referencia: '+number(meta.salones_referencia)+' grupos':''}. Requieren conocer su método de cálculo.`} ${rows[0].ambito_nominaciones==='centro'?'Las nominaciones abarcan el centro. Los recuentos recibidos son los observados en las respuestas disponibles.':''} Los porcentajes muestran sus denominadores válidos.</p></div></article>`;}
function groupReportBrief(rows,meta){
  const g=C.aggregate(rows,meta);
  const item=id=>g.attention.find(value=>value.id===id);
  const datum=value=>value?.count==null?'Sin datos':`${number(value.count)} de ${number(value.denominator)}`;
  const rate=value=>value?.percent==null?'':percent(value.percent);
  const answer=(question,value,note)=>`<div class="group-answer"><h5>${E(question)}</h5><strong>${E(datum(value))}</strong>${rate(value)?`<span>${E(rate(value))}</span>`:''}${note?`<p>${E(note)}</p>`:''}</div>`;
  const complete=groupReport(rows,meta);
  const bodyStart='<div class="report-body">';
  const expanded=complete.slice(complete.indexOf(bodyStart)+bodyStart.length,-'</div></article>'.length);
  return `<article class="report">${reportHero(`${selection.course} · ${selection.group}`,`${g.n} estudiantes · ${g.responses==null?'Respuestas sin cobertura completa':g.responses+' respuestas'}${g.period?' · '+g.period:''}`,'Ficha de clase')}
    <div class="report-body group-brief"><h3 class="summary-heading">Resumen de la clase</h3>${networkCoverageNote(rows[0])}<div class="group-summary-grid">
      <section class="group-summary-panel group-summary-alert" aria-labelledby="group-summary-alert-title"><h4 id="group-summary-alert-title">Señales de acoso escolar</h4>
        ${answer('¿Cuántos estudiantes indican que han sufrido acoso?',item('bullying_declarado'),'Respuesta personal.')}
        ${answer('¿Cuántos reciben señalamientos de otras personas?',item('bullying_companeros'),'Personas distintas, aunque reciban varias nominaciones.')}
        <p class="group-summary-note">Las dos fuentes pueden coincidir. No se suman ni establecen un diagnóstico.</p></section>
      <section class="group-summary-panel group-summary-wellbeing" aria-labelledby="group-summary-wellbeing-title"><h4 id="group-summary-wellbeing-title">Bienestar</h4>
        ${answer('¿Cuántos indican soledad frecuente?',item('soledad'),'Casi siempre o siempre durante la última semana.')}
        </section>
      <section class="group-summary-panel group-summary-friendship" aria-labelledby="group-summary-friendship-title"><h4 id="group-summary-friendship-title">Relaciones de amistad</h4>
        ${answer('¿Cuántos no tienen amistades recíprocas registradas?',item('sin_reciprocas'),'Vínculos recíprocos observados en la red.')}
        <p class="group-summary-note">La composición de la red y sus grupos se describen al ampliar. Varios grupos no implican conflicto.</p></section>
    </div><details class="expanded-details"><summary>Ver más indicadores <span aria-hidden="true">↓</span></summary><div class="group-expanded">${expanded}</div></details></div></article>`;
}
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
  const buttons=reviewChoices.map(([reaction,emoji,text])=>`<button type="button" class="reaction-button reaction-${reaction}" data-roster-reaction="${reaction}" data-student-id="${E(row.ID)}" data-indicator="${key}" aria-label="${E(`${text}: ${label} de ${person}`)}" aria-pressed="${selected===reaction}" title="${E(text)}"><span aria-hidden="true">${emoji}</span><span class="reaction-label">${E(text)}</span></button>`).join('');
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
  return `<article class="report">${reportHero(`${selection.course} · ${selection.group}`,`${rows.length} estudiantes · ${selection.center}`,'Lista de clase')}<div class="report-body"><p class="roster-intro">Ordena por una columna. Pulsa un dato para valorarlo o un nombre para abrir su ficha.</p>${networkCoverageNote(rows[0])}<p class="roster-scroll-hint">Desliza la tabla para ver más indicadores →</p><div class="roster-scroll" tabindex="0" aria-label="Tabla de estudiantes del grupo, desplazable horizontalmente"><table class="roster-table"><thead><tr>${sortHeader('student','Estudiante')}${header}${sortHeader('confidence','Confianza en los datos')}</tr></thead><tbody>${body}</tbody></table></div><details class="roster-method"><summary>Cómo se leen estos datos</summary><p>Felicidad: centro y diversión (0–4), más soledad invertida (4–0); la suma se expresa de 0 a 10. «Se señala» procede de marcar el propio código en acoso; «Le señalan» cuenta nominaciones de otras personas. En Wave 1, las nominaciones pueden proceder de todo el centro. Confianza: −5 significa muy baja; +5, muy alta. Cero es intermedia y «Sin valorar» significa que aún no has respondido. Las valoraciones no modifican los indicadores.</p></details></div></article>`;
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
  if(!slider||!currentRows().some(row=>row.ID===slider.dataset.studentId))return;
  if(rosterReviews.get(slider.dataset.studentId).confidence===null){
    rosterReviews.setConfidence(slider.dataset.studentId,Number(slider.value));
    updateCloseAction();
    const control=slider.closest('.confidence-control');
    control.querySelector('output').textContent=confidenceLabel(Number(slider.value));
    control.querySelector('[data-roster-clear]').hidden=false;
  }
}
function studentReport(r,classRows=[r],visibleRows=classRows){
  const self=r.respondio==='No'?'No respondió':r.bullying_autorreporte;
  const name=r.Nombre||`Estudiante · ${r.ID}`;
  const scope=r.ambito_nominaciones==='centro'?'del centro':'del grupo';
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
  const nominationText=(value,relation)=>value==null?`No consta el recuento de nominaciones de ${relation}.`:`${countText(value)} ${scope} le ${value===1?'nombra':'nombran'} ${relation==='amistad'?'como amistad':'en rechazo'}.`;
  const meanText=value=>value==null?'Media de la clase: Sin datos':`Media de la clase: ${number(value)}`;
  const receivedFriendMean=classMean('amistad_recibida_n'),receivedRejectMean=classMean('rechazo_recibido_n');
  const crtScores=classRows.map(row=>row.crt_aciertos).filter(value=>typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=3);
  const crtMean=average(crtScores);
  const recText=ownReciprocity===null?known(r.amistad_declarada_n)&&r.amistad_declarada_n===0?'No aplicable · 0 elecciones':'Sin datos':`${number(r.amistad_reciproca_n)} de ${number(r.amistad_declarada_n)} · ${number(ownReciprocity)} %`;
  const freq=value=>value===null||value===undefined?'Sin datos':['Nunca','Casi nunca','Algunas veces','Casi siempre','Siempre'][value]||'Sin datos';
  const position=(title,value,detail,missingLabel='Sin datos')=>`<div class="summary-position-item"><span>${E(title)}</span><strong>${value==null?E(missingLabel):`${number(value)} <small>/ 10</small>`}</strong><small>${E(detail)}</small></div>`;
  const signalTone=self==='Sí'?'summary-alert':r.bullying_companeros_n>0?'summary-caution':'summary-neutral';
  const signal=(title,value)=>`<div class="summary-signal"><span>${E(title)}</span><strong>${E(value)}</strong></div>`;
  return `<article class="report">${reportHero(name,`${r.Curso} · ${r.Grupo} · ID ${r.ID}`,'Ficha individual')}
    <div class="report-body student-brief"><button id="back-to-roster" class="quiet back-list" type="button">← Volver a la lista de clase</button>
    <h3 class="summary-heading">Resumen de la ficha</h3>${networkCoverageNote(r)}
    <div class="summary-grid">
      <section class="summary-panel summary-wide ${signalTone}" aria-labelledby="summary-bullying-title"><h4 id="summary-bullying-title">Señales de acoso escolar</h4><div class="summary-signal-grid">
        ${signal('¿Ha indicado que ha sufrido acoso escolar?',self??'Sin datos')}
        ${signal('¿Cuántas personas indican que ha sufrido acoso?',countText(r.bullying_companeros_n))}
        </div><p class="summary-note">Son dos fuentes distintas; no establecen un diagnóstico.</p>
      </section>
      <section class="summary-panel summary-wellbeing" aria-labelledby="summary-wellbeing-title"><div class="summary-card-heading"><h4 id="summary-wellbeing-title">Bienestar</h4><strong>${r.felicidad==null?'Sin datos':`${number(r.felicidad)} / 10`}</strong></div>
        <p class="summary-time">Durante la última semana</p><div class="summary-wellbeing-facts"><p>¿Con qué frecuencia se ha sentido bien en el centro? <strong>${E(freq(r.felicidad_centro))}</strong></p><p>¿Con qué frecuencia ha disfrutado con sus amistades? <strong>${E(freq(r.felicidad_diversion))}</strong></p><p>¿Con qué frecuencia ha sentido soledad? <strong>${E(freq(r.felicidad_soledad))}</strong></p></div>
        <details class="reading-note"><summary>Cómo se calcula</summary><p>El índice combina estas tres respuestas e invierte la de soledad. Suma 0–12, expresada de 0 a 10.</p></details>
      </section>
      <section class="summary-panel summary-friendship" aria-labelledby="summary-friendship-title"><h4 id="summary-friendship-title">Relaciones de amistad</h4><p class="summary-legend"><span class="summary-key-person"></span> Estudiante <span class="summary-key-mean"></span> Media de la clase</p>
        ${comparison('¿Cuántas personas le nombran como amistad?',nominationText(r.amistad_recibida_n,'amistad'),r.amistad_recibida_n,receivedFriendMean,countMax('amistad_recibida_n'),countText(r.amistad_recibida_n),meanText(receivedFriendMean))}
        ${comparison('¿Cuántas personas le nombran en rechazo?',nominationText(r.rechazo_recibido_n,'rechazo'),r.rechazo_recibido_n,receivedRejectMean,countMax('rechazo_recibido_n'),countText(r.rechazo_recibido_n),meanText(receivedRejectMean))}
        ${comparison('¿Cuántas elecciones de amistad son correspondidas?',ownReciprocity===null?(r.amistad_declarada_n===0?'No ha declarado elecciones de amistad.':'No consta su respuesta relacional para calcular la reciprocidad.'):`${number(ownReciprocity)} % de sus elecciones de amistad son correspondidas.`,ownReciprocity,meanReciprocity,100,recText,meanReciprocity===null?(r.red_centro_completa===false?'Media de la clase: No calculable':'Media de la clase: Sin datos'):`Media de la clase: ${number(meanReciprocity)} %`)}
        <details class="reading-note"><summary>Cómo leer las barras</summary><p>Las medias usan los datos disponibles de esta clase. Las nominaciones pueden venir de todo el centro. Las barras de recuentos llegan al máximo observado en la clase; la reciprocidad usa 0–100 %.</p></details>
      </section>
    </div>
    <details class="expanded-details"><summary>Ver más indicadores <span aria-hidden="true">↓</span></summary><div class="student-more-grid">
      <section class="summary-panel summary-position" aria-labelledby="summary-position-title"><h4 id="summary-position-title">Posición en la red</h4>
        ${position('¿Cuál es su popularidad?',r.popularidad,r.amistad_recibida_n==null?'Nominaciones recibidas: Sin datos':`Nominaciones de amistad recibidas: ${number(r.amistad_recibida_n)}`)}
        ${position('¿Cuál es su centralidad?',r.centralidad,'Conexión estructural en la red de amistad',r.red_centro_completa===false?'No calculable · red incompleta':'Sin datos')}
        <p class="summary-note">Escalas 0–10; no son percentiles ni categorías de capacidad.</p>
      </section>
      <section class="summary-panel summary-mediation" aria-labelledby="summary-mediation-title"><h4 id="summary-mediation-title">Mediación</h4><p class="summary-question">¿Cuántas personas le valoran por buena o muy buena mediación?</p><strong class="summary-big-value">${countText(r.mediacion_negativa_n==null?null:r.mediacion_n)}</strong><p class="summary-question">¿Cuántas le valoran por mala o muy mala mediación?</p><strong class="summary-big-value">${countText(r.mediacion_negativa_n)}</strong><p class="summary-note">Nominaciones recibidas de otras personas. Una persona puede recibir valoraciones de ambas categorías.</p></section>
      ${Object.prototype.hasOwnProperty.call(r,'crt_aciertos')?`<section class="summary-panel summary-cognitive" aria-labelledby="summary-cognitive-title"><h4 id="summary-cognitive-title">Test de impulsividad</h4><p class="summary-question">¿Cuántas de las tres preguntas acertó?</p><strong class="summary-big-value">${r.crt_aciertos==null?'Sin datos':`${number(r.crt_aciertos)} <small>/ 3</small>`}</strong><p class="summary-class-mean">Media de la clase: ${crtMean==null?'Sin datos':`${number(crtMean)} / 3`}${crtMean==null?'':` · ${number(crtScores.length)} ${crtScores.length===1?'respuesta válida':'respuestas válidas'}`}</p>${r.crt_aciertos==null?'':`<div class="summary-crt-track" role="img" aria-label="${number(r.crt_aciertos)} aciertos de 3"><span style="width:${100*r.crt_aciertos/3}%"></span></div><div class="summary-crt-labels"><span>0</span><span>1</span><span>2</span><span>3</span></div>`}<p class="summary-note">Es el número de aciertos en tres preguntas; por sí solo no diagnostica impulsividad.</p></section>`:''}
    </div>${studentReportExpanded(r)}${studentNetworkSection(C.studentNetwork(visibleRows,r.ID))}</details></div></article>`;
}

function studentReportExpanded(r){
  const normalized=['normalizada_v1','centro_observado_v1'].includes(r.escala_indicadores);
  const pred=t=>detail([r[`pred_${t}_aciertos`],r[`pred_${t}_n`]],(a,n)=>n?`${a} de ${n} predicciones correctas`:'Sin predicciones declaradas');
  return `<div class="expanded-report">${reading(normalized)}<div class="network-grid">
    <section class="section-panel panel-connections">${section('01','Más sobre amistad','panel-connections')}
      ${metric('Amistades que nombra',r.sociabilidad,detail([r.amistad_declarada_n],n=>`Indica vínculos de amistad con ${n} ${n===1?'estudiante':'estudiantes'}`))}
      ${metric('Acierto de sus predicciones',r.acierto_amistad,pred('amistad'),r.pred_amistad_n===0?'No aplicable':null)}
    </section>
    <section class="section-panel panel-context">${section('02','Más sobre rechazo','panel-context')}
      ${metric('Rechazos que nombra',r.rechazo_declarado,detail([r.rechazo_declarado_n],n=>`Nombra a ${n} ${n===1?'estudiante':'estudiantes'} en la red de rechazo`))}
      ${metric('Reciprocidad del rechazo',r.reciprocidad_rechazo,detail([r.rechazo_reciproco_n,r.rechazo_declarado_n],(a,b)=>b?`${a} de sus ${b} elecciones son correspondidas`:'Sin elecciones declaradas'),r.rechazo_declarado_n===0?'No aplicable':null)}
      ${metric('Acierto de sus predicciones',r.acierto_rechazo,pred('rechazo'),r.pred_rechazo_n===0?'No aplicable':null)}
    </section></div><p class="report-footer">${normalized?'Las puntuaciones reflejan proporciones o medidas normalizadas, no posiciones percentiles.':'Puntuaciones suministradas en el Excel.'} Esta ficha debe interpretarse con contexto y junto a la visión del grupo. No establece diagnósticos ni decisiones automáticas.</p></div>`;
}
function studentNetworkSection(network){
  const label=row=>row.Nombre||`Código ${row.ID}`;
  const heading=`<div class="student-network-heading"><h3>Red de relaciones</h3><p>Amistad y rechazo declarados: quién nombra a quién y con qué intensidad.</p></div>`;
  if(!network.available)return `<section class="student-network" aria-label="Red de relaciones">${heading}<p class="student-network-empty">Esta base solo contiene recuentos. No conserva los vínculos individuales necesarios para dibujar la red.</p></section>`;
  const {selected,neighbors,edges}=network;
  const legend='<div class="student-network-legend"><span><i class="network-line positive"></i> Amistad</span><span><i class="network-line negative"></i> Rechazo</span><span><i class="network-line thin"></i> Relación buena o mala</span><span><i class="network-line thick"></i> Relación muy buena o muy mala</span><span>La flecha indica quién nombra a quién.</span></div>';
  const coverage=`${network.respondents} de ${network.visibleCount} estudiantes accesibles tienen respuesta sobre relaciones. ${network.outgoingKnown?'':'No consta la respuesta de esta persona; solo pueden aparecer nominaciones recibidas. '}Los vínculos con personas fuera del alcance de este perfil no se muestran.`;
  if(!neighbors.length)return `<section class="student-network" aria-label="Red de relaciones">${heading}${legend}<p class="student-network-empty">No se han observado nominaciones de entrada ni de salida en las respuestas disponibles.</p><p class="student-network-coverage">${E(coverage)}</p></section>`;
  const size=Math.min(1800,Math.max(640,neighbors.length*34)),mid=size/2,radius=mid-67;
  const coord=value=>Number(value.toFixed(1));
  const points=new Map(neighbors.map((row,index)=>{const angle=-Math.PI/2+2*Math.PI*index/neighbors.length;return [row.ID,{x:coord(mid+radius*Math.cos(angle)),y:coord(mid+radius*Math.sin(angle)),index:index+1}];}));
  const arrows=`<defs><marker id="network-positive-arrow" markerUnits="userSpaceOnUse" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="13" markerHeight="13" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#218c79"/></marker><marker id="network-negative-arrow" markerUnits="userSpaceOnUse" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="13" markerHeight="13" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#d34d57"/></marker></defs>`;
  const paths=edges.map(edge=>{
    const outgoing=edge.from===selected.ID,peer=points.get(outgoing?edge.to:edge.from);
    if(!peer)return '';
    const dx=peer.x-mid,dy=peer.y-mid,length=Math.hypot(dx,dy),ux=dx/length,uy=dy/length;
    const start={x:coord(mid+ux*54),y:coord(mid+uy*54)},end={x:coord(peer.x-ux*27),y:coord(peer.y-uy*27)};
    const reverse=edges.some(other=>other.from===edge.to&&other.to===edge.from);
    const bend=reverse?(outgoing?14:-14):0;
    const control={x:coord((start.x+end.x)/2-uy*bend),y:coord((start.y+end.y)/2+ux*bend)};
    const from=outgoing?start:end,to=outgoing?end:start;
    const peerName=label(neighbors[peer.index-1]);
    const description=outgoing?`${label(selected)} nombra a ${peerName}`:`${peerName} nombra a ${label(selected)}`;
    return `<path class="network-edge network-${edge.tipo}" d="M ${from.x} ${from.y} Q ${control.x} ${control.y} ${to.x} ${to.y}" stroke-width="${edge.intensidad===2?5:2.5}" marker-end="url(#network-${edge.tipo==='amistad'?'positive':'negative'}-arrow)"><title>${E(`${description}: ${edge.intensidad===2?'muy ':''}${edge.tipo==='amistad'?'buena':'mala'} relación`)}</title></path>`;
  }).join('');
  const satellites=neighbors.map(row=>{const point=points.get(row.ID);return `<g class="network-node"><circle cx="${point.x}" cy="${point.y}" r="22"/><text x="${point.x}" y="${point.y+5}" text-anchor="middle">${point.index}</text><title>${E(`${point.index}. ${label(row)} · ${row.ID}`)}</title></g>`;}).join('');
  const graph=`<div class="student-network-scroll" role="region" tabindex="0" aria-label="Diagrama de red desplazable horizontalmente"><svg class="student-network-svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="Red en estrella de ${E(label(selected))}: ${neighbors.length} personas relacionadas y ${edges.length} nominaciones">${arrows}${paths}<circle class="network-center" cx="${mid}" cy="${mid}" r="48"/><text class="network-center-text" x="${mid}" y="${mid+5}" text-anchor="middle">Estudiante</text>${satellites}</svg></div>`;
  const relationText=edge=>`${edge.from===selected.ID?'Nombra a esta persona':'Esta persona le nombra'}: ${edge.intensidad===2?'muy ':''}${edge.tipo==='amistad'?'buena':'mala'} relación`;
  const list=`<ol class="student-network-list">${neighbors.map((row,index)=>`<li><span class="network-index">${index+1}</span><div><strong>${E(label(row))}</strong><small>${E(row.ID)}</small><div class="network-links">${edges.filter(edge=>edge.from===row.ID||edge.to===row.ID).map(edge=>`<span class="network-link network-${edge.tipo}">${E(relationText(edge))}</span>`).join('')}</div></div></li>`).join('')}</ol>`;
  return `<section class="student-network" aria-label="Red de relaciones">${heading}${legend}${graph}<p class="student-network-scroll-hint">Desliza el diagrama para ver todas las personas.</p>${list}<p class="student-network-coverage">${E(coverage)} Las relaciones son respuestas declaradas; no describen por sí solas la calidad real de los vínculos.</p></section>`;
}
for(const event of ['pointerdown','keydown','wheel','touchstart'])document.addEventListener(event,()=>{lastActivity=Date.now();},{passive:true});
setInterval(()=>{if(profile&&Date.now()-lastActivity>15*60*1000)finish('La consulta se ha cerrado tras 15 minutos sin actividad. Vuelve a entrar para continuar.');},5000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&profile&&Date.now()-lastActivity>15*60*1000)finish('La sesión ha caducado por inactividad.');});
window.addEventListener('pagehide',()=>{clearState();root.replaceChildren();});
window.addEventListener('pageshow',event=>{if(event.persisted)login('La consulta anterior se ha cerrado. Vuelve a identificarte.');});
login();
if(hasDemo&&['#demo','#guia'].includes(window.location?.hash))startTour();
})();
