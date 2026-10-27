/* PDF open-password encryption. No network or browser persistence. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(globalThis);
  else root.PbisPdfCrypto=factory(root);
})(typeof window==='undefined'?globalThis:window,function(root){
  'use strict';
  function normalizeDni(value){
    const dni=String(value??'').trim().toUpperCase();
    if(!/^\d{8}[A-Z]$/.test(dni)||'TRWAGMYFPDXBNJZSQVHLCKE'[Number(dni.slice(0,8))%23]!==dni[8])throw Error('Introduce tu DNI completo: ocho cifras y su letra, sin espacios ni guiones.');
    return dni;
  }
  function protect(bytes,password,{current=()=>true}={}){
    password=normalizeDni(password);
    if(!current())return Promise.reject(Error('La consulta ha cambiado. Repite la descarga.'));
    if(!(bytes instanceof ArrayBuffer)||bytes.byteLength>80*1024*1024)return Promise.reject(Error('El PDF supera el tamaño admitido. Prueba sin incluir la red.'));
    if(!root.PBIS_PDF_CRYPTO_WORKER||!root.Worker||!root.WebAssembly)return Promise.reject(Error('Este navegador no permite proteger el PDF. Usa una versión actual de Edge, Chrome, Firefox o Safari.'));
    return new Promise((resolve,reject)=>{
      let worker,url,timer,poll,done=false;
      const finish=(error,result)=>{
        if(done)return;done=true;clearTimeout(timer);clearInterval(poll);
        worker?.terminate();if(url)URL.revokeObjectURL(url);password='';
        if(error)reject(error);else resolve(result);
      };
      const failed=()=>finish(Error('No se ha podido cifrar el PDF. No se ha descargado ninguna copia sin proteger.'));
      try{
        url=URL.createObjectURL(new Blob([root.PBIS_PDF_CRYPTO_WORKER],{type:'text/javascript'}));
        worker=new root.Worker(url);
        worker.onmessage=({data})=>{
          if(!current())return finish(Error('La consulta ha cambiado. Repite la descarga.'));
          if(data?.ok!==true||!(data.bytes instanceof ArrayBuffer))return failed();
          finish(null,new Blob([data.bytes],{type:'application/pdf'}));
        };
        worker.onerror=event=>{event.preventDefault();failed();};
        timer=setTimeout(failed,60000);
        poll=setInterval(()=>{if(!current())finish(Error('La consulta ha cambiado. Repite la descarga.'));},100);
        worker.postMessage({bytes,password},[bytes]);password='';
      }catch{failed();}
    });
  }
  return Object.freeze({normalizeDni,protect});
});
