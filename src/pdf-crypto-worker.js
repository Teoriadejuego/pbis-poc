/* qpdf runs once in an isolated worker. Its filesystem is RAM only.
 * PBIS_QPDF_WASM and the unmodified qpdf factory are bundled at build time. */
'use strict';
let used=false;
self.onmessage=async({data})=>{
  if(used)return;used=true;
  let engine=null;
  try{
    const dni=String(data.password||'');
    if(!/^\d{8}[A-Z]$/.test(dni)||'TRWAGMYFPDXBNJZSQVHLCKE'[Number(dni.slice(0,8))%23]!==dni[8])throw Error();
    if(!(data.bytes instanceof ArrayBuffer)||data.bytes.byteLength>80*1024*1024)throw Error();
    const binary=Uint8Array.from(atob(PBIS_QPDF_WASM),c=>c.charCodeAt(0));
    // The Emscripten loader expects fetch; satisfy it from bundled bytes only.
    // No URL, token, password or document ever leaves this worker.
    self.fetch=async url=>{
      if(url!=='pbis-qpdf.wasm')throw Error('Resource unavailable');
      return new Response(binary,{headers:{'Content-Type':'application/wasm'}});
    };
    engine=await Module({locateFile:()=> 'pbis-qpdf.wasm',print:()=>{},printErr:()=>{}});
    engine.FS.writeFile('/source.pdf',new Uint8Array(data.bytes));
    const owner=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
    const status=engine.callMain(['/source.pdf','--encrypt',dni,owner,'256','--','/protected.pdf']);
    if(status!==0)throw Error();
    const output=engine.FS.readFile('/protected.pdf').slice();
    // qpdf is the encryption implementation, not an in-house PDF cipher.
    if(output.byteLength<100||new TextDecoder('latin1').decode(output.subarray(0,8))!=='%PDF-1.7')throw Error();
    self.postMessage({ok:true,bytes:output.buffer},[output.buffer]);
  }catch{
    // Never expose qpdf diagnostics, arguments, passwords or document content.
    self.postMessage({ok:false});
  }finally{
    if(data.bytes instanceof ArrayBuffer)new Uint8Array(data.bytes).fill(0);
    data.password='';
    if(engine){for(const path of ['/source.pdf','/protected.pdf'])try{engine.FS.unlink(path);}catch{}engine.HEAPU8.fill(0);}
    self.close();
  }
};
