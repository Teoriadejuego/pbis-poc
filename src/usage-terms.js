/* Session-only acknowledgements. They do not authenticate users or grant permissions. */
(function(root){
'use strict';
const labels=Object.freeze({
 login:'He leído y acepto las condiciones de uso. Cuento con autorización para consultar los datos.',
 pdf:'Custodiaré este informe y lo compartiré solo con personas autorizadas.',
 project:'He revisado las aulas y los permisos. Entregaré cada acceso solo a su destinatario.'
});
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function checkbox(id,kind){
 if(!/^[a-z-]+$/.test(id)||!labels[kind])throw Error('Confirmación de uso no válida.');
 return `<div class="usage-ack"><label for="${id}"><input id="${id}" type="checkbox" required><span>${escape(labels[kind])}</span></label><button type="button" class="usage-link" data-usage-terms>Leer condiciones de uso</button></div>`;
}
function check(id){
 const input=document.getElementById(id);
 if(input?.checked)return true;
 input?.focus();input?.reportValidity();return false;
}
function show(){
 const existing=document.getElementById('usage-terms-dialog');if(existing){existing.focus();return;}
 const opener=document.activeElement,d=document.createElement('dialog');
 d.id='usage-terms-dialog';d.className='usage-dialog';d.setAttribute('aria-labelledby','usage-terms-title');
 d.innerHTML='<header class="usage-heading"><h2 id="usage-terms-title">Condiciones de uso</h2><button type="button" class="quiet" data-usage-close aria-label="Cerrar condiciones de uso">Cerrar ×</button></header><div class="usage-body" tabindex="0" role="region" aria-label="Texto de las condiciones"></div><footer class="usage-actions"><button type="button" class="btn secondary" data-usage-save>Guardar texto</button><button type="button" class="quiet" data-usage-close>Volver</button></footer>';
 const content=d.querySelector('.usage-body');
 for(const line of (root.PBIS_TERMS_TEXT||'Texto no disponible. Vuelve a abrir la aplicación.').split(/\r?\n/)){
   if(!line.trim())continue;
   const heading=line.match(/^(#{1,2}) (.+)$/),el=document.createElement(heading?'h3':'p');
   el.textContent=heading?heading[2]:line;content.append(el);
 }
 d.querySelectorAll('[data-usage-close]').forEach(b=>b.onclick=()=>d.close());
 d.querySelector('[data-usage-save]').onclick=()=>{
   const url=URL.createObjectURL(new Blob([root.PBIS_TERMS_TEXT],{type:'text/plain;charset=utf-8'}));
   const a=document.createElement('a');a.href=url;a.download='PBIS_Condiciones_uso_2026-10-28.txt';d.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 d.addEventListener('close',()=>{d.remove();if(opener?.isConnected)opener.focus();},{once:true});
 document.body.append(d);d.showModal();d.querySelector('[data-usage-close]').focus();
}
document.addEventListener('click',event=>{if(event.target.closest?.('[data-usage-terms]')){event.preventDefault();show();}});
root.PbisTerms=Object.freeze({checkbox,check,show});
})(window);
