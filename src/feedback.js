(function () {
  'use strict';
  const M = window.PbisFeedbackModel;
  const config = window.PBIS_FEEDBACK;
  const dialog = document.createElement('dialog');
  dialog.id = 'feedback-dialog';
  dialog.setAttribute('aria-labelledby', 'feedback-title');
  dialog.setAttribute('aria-describedby', 'feedback-intro');
  dialog.innerHTML = `<div class="feedback-heading"><span class="eyebrow">TU EXPERIENCIA CON PBIS</span><button type="button" class="quiet" id="feedback-close" aria-label="Cerrar opinión">Cerrar ×</button></div>
    <h2 id="feedback-title">Una ficha más útil,<br>con tu mirada.</h2>
    <p id="feedback-intro">¿Te ayuda esta forma de presentar la información?</p>
    <p id="feedback-context" class="feedback-context"></p>
    <p id="feedback-codes" class="feedback-codes"></p>
    <form id="feedback-form"><fieldset class="feedback-rating"><legend>Valora la claridad y utilidad de la ficha</legend>
      <div class="rating-options">${['Nada útil','Poco útil','Algo útil','Útil','Muy útil'].map((label,i)=>`<label><input type="radio" name="feedback-rating" value="${i+1}" required><span><strong>${i+1}</strong><small>${label}</small></span></label>`).join('')}</div></fieldset>
      <label class="field" for="feedback-comment">¿Qué mejorarías? <span class="optional">Opcional</span></label>
      <textarea id="feedback-comment" rows="3" maxlength="1500" placeholder="Una idea, algo que falta o lo que te ha resultado útil…" aria-describedby="feedback-hint"></textarea>
      <p id="feedback-hint" class="feedback-hint">Comenta el diseño o la claridad. No incluyas nombres ni datos de estudiantes.</p>
      <details class="feedback-disclosure"><summary>Qué datos acompañan mi opinión</summary><p class="feedback-privacy">Se incluyen las claves que ves arriba, tu rol, un código aleatorio de sesión, el tipo de ficha, la valoración, el comentario, la fecha y la versión. No se añaden nombres ni indicadores. Quien tenga la correspondencia de claves podrá identificar el aula y a qué estudiante se refiere la opinión.</p></details>
      <p id="feedback-mode" class="feedback-mode"></p>
      <p id="feedback-status" class="feedback-status" role="status" aria-live="polite"></p>
      <div class="feedback-actions"><button type="submit" class="btn" id="feedback-send">Enviar opinión</button><button type="button" class="btn secondary" id="feedback-save">Guardar Excel</button><button type="button" class="quiet" id="feedback-new" hidden>Nueva opinión</button></div>
    </form>`;
  document.body.append(dialog);
  const el = id => document.getElementById('feedback-' + id);
  const radios = [...dialog.querySelectorAll('input[type=radio]')];
  let session = null, context = null, epoch = 0, exportJob = null;
  const requests = new Set();
  let drafts = {}, records = new Map();
  const names = {group:'Ficha del grupo',individual:'Ficha individual'};
  const blank = () => ({rating:'',comment:'',opinion:null,status:'',busy:false,saved:false});
  const key = () => context && JSON.stringify(context);
  const current = () => context && drafts[key()];
  function collect() {
    const d = current();
    if (d && !d.opinion) { d.rating = radios.find(r=>r.checked)?.value || ''; d.comment = el('comment').value; }
  }
  function render() {
    const d = current(); if (!d || !session) return;
    el('context').textContent = `${names[context.sheet]} · ${session.role === 'tutor' ? 'Tutoría' : 'Orientación'}`;
    el('codes').textContent = `Clave del aula: ${context.classCode}${context.studentCode !== null ? ' · Clave de estudiante: '+context.studentCode : ' · Sin referencia individual'}`;
    radios.forEach(r=>{r.checked=r.value===d.rating;r.disabled=!!d.opinion||d.busy;});
    el('comment').value=d.comment; el('comment').disabled=!!d.opinion||d.busy;
    el('send').hidden=!config.endpoint; el('send').disabled=d.busy||d.saved;
    el('send').textContent=d.busy?'Enviando…':d.opinion&&!d.saved?'Reintentar envío':'Enviar opinión';
    el('save').disabled=d.busy; el('save').textContent=config.endpoint?'Guardar Excel aparte':'Guardar opinión en Excel';
    el('new').hidden=!d.opinion;el('new').disabled=d.busy;
    el('mode').textContent=config.endpoint
      ? `Al enviar, la opinión se guardará en el servicio de opiniones y se notificará a ${config.recipient}. Necesita conexión. Los Excel con datos de estudiantes permanecen en tu equipo.`
      : 'El correo aún no está activado. Puedes guardar las opiniones de esta sesión en un Excel separado; no se enviarán por Internet.';
    el('status').textContent=d.status;
  }
  function opinion() {
    collect();const d=current();
    if(!d.rating){d.status='Elige una valoración del 1 al 5.';render();radios[0].focus();return null;}
    if(!d.opinion){
      if(records.size>=100)throw Error('Ya hay 100 opiniones en esta sesión. Guarda el Excel antes de cerrar sesión.');
      d.opinion=M.makeOpinion({sessionCode:session.code,role:session.role,sheet:context.sheet,classCode:context.classCode,studentCode:context.studentCode,rating:Number(d.rating),comment:d.comment,version:config.version});
      records.set(d.opinion.eventId,d.opinion);
    }
    return d.opinion;
  }
  function exportBook(opinions) {
    return new Promise((resolve,reject)=>{
      const url=URL.createObjectURL(new Blob([window.PBIS_FEEDBACK_WORKER],{type:'text/javascript'}));
      let worker;
      try { worker=new Worker(url); } catch(error) { URL.revokeObjectURL(url);reject(error);return; }
      const stop=()=>{worker.terminate();URL.revokeObjectURL(url);clearTimeout(timer);exportJob=null;};
      const timer=setTimeout(()=>{stop();reject(Error('No se pudo crear el Excel a tiempo. Vuelve a intentarlo.'));},15000);
      exportJob={stop,reject};
      worker.onmessage=e=>{stop();e.data.error?reject(Error(e.data.error)):resolve(e.data.buffer);};
      worker.onerror=()=>{stop();reject(Error('No se pudo crear el Excel. Prueba con un navegador actualizado.'));};
      worker.postMessage({opinions});
    });
  }
  async function save() {
    const d=current(),ticket=epoch;if(!d||d.busy)return;
    if(exportJob){d.status='Hay otro Excel preparándose. Vuelve a intentarlo en un momento.';render();return;}
    try {
      if(!opinion())return;d.busy=true;render();
      const bytes=await exportBook([...records.values()]);if(ticket!==epoch)return;
      const url=URL.createObjectURL(new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
      const a=document.createElement('a');a.href=url;a.download='PBIS_Opiniones.xlsx';document.body.append(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      d.status='Excel preparado con las opiniones de esta sesión. Comprueba la descarga. Este guardado no envía ningún correo.';
    } catch(error) { if(ticket===epoch)d.status=error.message; }
    finally { if(ticket===epoch){d.busy=false;render();} }
  }
  async function send(event) {
    event.preventDefault();const d=current(),ticket=epoch;if(!d||d.busy||d.saved)return;
    if(!config.endpoint){await save();return;}
    let timer, request;
    try {
      const data=opinion();if(!data)return;d.busy=true;d.status='Registrando tu opinión…';render();
      request=new AbortController();requests.add(request);timer=setTimeout(()=>request.abort(),20000);
      const response=await fetch(config.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store',redirect:'error',signal:request.signal});
      if(!response.ok)throw Error(response.status===429?'Hay demasiados envíos. Espera un momento y vuelve a intentarlo.':'El servicio no ha confirmado el registro. Puedes reintentar o guardar el Excel.');
      const result=await response.json();if(ticket!==epoch)return;
      if(result.saved!==true||!['accepted','pending'].includes(result.emailStatus))throw Error('No se ha podido confirmar el registro. Reintenta con el mismo botón o guarda el Excel.');
      d.saved=true;d.status=result.emailStatus==='accepted'
        ? 'Gracias por tu mirada. Opinión registrada; el proveedor ha aceptado el aviso por correo.'
        : 'Gracias. Tu opinión está registrada; el aviso por correo queda pendiente en el servicio.';
    } catch(error) {
      if(ticket===epoch)d.status=error.name==='AbortError'||error instanceof TypeError
        ? 'No se ha podido confirmar el envío. Tu opinión sigue en esta sesión: reintenta o guarda el Excel.' : error.message;
    } finally { clearTimeout(timer);requests.delete(request);if(ticket===epoch){d.busy=false;render();} }
  }
  function reset() {
    epoch++;for(const request of requests)request.abort();requests.clear();
    if(exportJob){const job=exportJob;job.stop();job.reject(Error('Sesión cerrada.'));}
    if(dialog.open)dialog.close();session=null;context=null;drafts={};records.clear();
    el('form').reset();el('comment').value='';el('context').textContent='';el('codes').textContent='';el('status').textContent='';
  }
  el('form').addEventListener('submit',send);el('save').addEventListener('click',save);
  el('close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',collect);
  el('new').addEventListener('click',()=>{drafts[key()]=blank();render();radios[0].focus();});
  window.PbisFeedback=Object.freeze({
    startSession(role){reset();if(!['tutor','orientador'].includes(role))throw Error('Rol de opinión no válido.');session={role,code:M.newId()};},
    reset,
    closeContext(){if(dialog.open)dialog.close();},
    open(value){
      if(!session||!value||!Object.hasOwn(names,value.sheet))return;
      // Snapshot only the authorised codes, never the source row or its names.
      const next={sheet:value.sheet,classCode:value.classCode,studentCode:value.sheet==='individual'?value.studentCode:null};
      M.makeOpinion({...next,sessionCode:session.code,role:session.role,rating:1,comment:'',version:config.version});
      collect();context=next;drafts[key()]??=blank();render();dialog.showModal();
    }
  });
})();
