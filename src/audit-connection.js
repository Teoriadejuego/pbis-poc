/* Private write connection for shared orientation accounts. Memory only. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.PbisAuditConnection=factory();})(typeof globalThis==='undefined'?this:globalThis,function(){
'use strict';
function parse(text){
 if(typeof text!=='string'||text.length>4096)throw Error('Selecciona el archivo de conexión generado en tu hoja de Google.');
 let c;try{c=JSON.parse(text);}catch{throw Error('El archivo de conexión no es válido.');}
 const keys=['schema','endpoint','projectId','revision','userCode','username','token'];
 const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
 if(!c||Object.keys(c).sort().join(',')!==keys.sort().join(',')||c.schema!=='pbis.audit-connection.v1'||c.username!=='orientacion'||c.revision!==1||!uuid.test(c.projectId)||!/^U-[a-f0-9-]{36}$/i.test(c.userCode)||!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(c.endpoint)||!/^[A-Za-z0-9+/]{43}=$/.test(c.token))throw Error('La conexión no tiene el formato admitido. No se ha enviado nada.');
 return Object.freeze({...c});
}
return Object.freeze({parse});
});
