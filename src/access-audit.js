/* Access telemetry: metadata only, in-memory queue, explicit receipts. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory;else root.PbisAccessAudit={create:options=>factory({...options,fetch:root.fetch.bind(root),crypto:root.crypto})};})(typeof globalThis!=='undefined'?globalThis:this,function({endpoint,projectId,revision,userCode,role,maskedDni,token,fileName,fetch,crypto,onStatus=()=>{},clock=()=>new Date(),timeoutMs=6000}){
const sessionId=crypto.randomUUID(),queue=[];let running=null,disposed=false,lastError='',closeQueued=false,activeAbort=null;
const base={schema:'pbis.access.v1',projectId,revision,userCode,sessionId,fileName:String(fileName).split(/[\\/]/).at(-1).slice(0,180)};
function status(){const value=!endpoint?'Registro de accesos sin activar':lastError?'Acceso pendiente de registrar. Reintentaremos mientras la consulta siga abierta.':queue.length?'Registrando acceso…':'Acceso registrado';onStatus(value);return {pending:queue.length,message:value};}
function enqueue(type){if(disposed||!endpoint)return;if(!['open','activity','close'].includes(type))throw Error('Evento no válido.');if(type==='close'){if(closeQueued)return;closeQueued=true;}if(type==='activity'&&queue.some(x=>x.type==='activity'))return;
 queue.push({...base,eventId:crypto.randomUUID(),type,clientTime:clock().toISOString()});status();return flush();}
async function flush(){
 if(disposed||!endpoint)return false;if(running)return running;
 running=(async()=>{while(queue.length&&!disposed){const event=queue[0],abort=new AbortController(),timer=setTimeout(()=>abort.abort(),timeoutMs);activeAbort=abort;try{
  const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify({token,event}),credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store',redirect:'follow',signal:abort.signal});
  if(!response.ok||response.type==='opaque')throw Error('Sin confirmación');const receipt=await response.json();
  if(receipt.ok!==true||receipt.eventId!==event.eventId)throw Error('Sin confirmación');
  if(!disposed){queue.shift();lastError='';status();}
 }catch(error){if(!disposed){lastError=error.message;status();}return false;}finally{clearTimeout(timer);activeAbort=null;}}
 return !queue.length;})().finally(()=>{running=null;});return running;
}
function dispose(){disposed=true;queue.length=0;token='';activeAbort?.abort();activeAbort=null;}
status();
return Object.freeze({sessionId,enqueue,flush,status,dispose,identity:{userCode,role,maskedDni},pending:()=>queue.length});
});
