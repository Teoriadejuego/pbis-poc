import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { deflateRawSync } from 'node:zlib';
import { feedbackConfig, connectPolicy } from './feedback-config.mjs';
import { completeDemo } from './demo-fixture.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
// HTML normalizes CRLF before CSP hashing; hash and embed the same LF bytes.
const read=async p=>(await fs.readFile(path.join(root,p),'utf8')).replace(/\r\n?/g,'\n');
const put=(p,data)=>fs.writeFile(path.join(root,p),data);
await fs.mkdir(path.join(root,'site/downloads'),{recursive:true});
await fs.mkdir(path.join(root,'release'),{recursive:true});
const hash=s=>createHash('sha256').update(s).digest('base64');
const safeScript=s=>s.replace(/<\/script/gi,'<\\/script');
const parser=(await read('vendor/xlsx.full.min.js'))+'\n'+await read('src/parser-worker.js');
const feedback={...feedbackConfig(''),batchOnClose:true};
const batch=feedbackConfig(process.env.PBIS_BATCH_ENDPOINT||'https://formspree.io/f/mvkgydrn');
// Batch mode keeps a plain-text fallback; the separate opinion Excel worker is unused.
const feedbackWorker=feedback.batchOnClose?'':(await read('vendor/xlsx.full.min.js'))+'\n'+await read('src/feedback-model.js')+'\n'+await read('src/feedback-worker.js');
const fixtures=JSON.parse(await read('data/fixtures.json'));
const demo=completeDemo(root,fixtures);
const config="window.PBIS_HOME='index.html';\nwindow.PBIS_DEMO_ACCOUNT="+await read('data/demo-account.json')+";\nwindow.PBIS_PROFILES="+await read('data/profiles.json')+';\nwindow.PBIS_PARSER='+JSON.stringify(parser)+';\nwindow.PBIS_FEEDBACK='+JSON.stringify(feedback)+';\nwindow.PBIS_BATCH='+JSON.stringify(batch)+';\nwindow.PBIS_FEEDBACK_WORKER='+JSON.stringify(feedbackWorker)+';';
const scripts=[config,await read('src/core.js'),await read('src/raw-wave1.js'),await read('src/roster-review.js'),await read('src/review-batch.js'),await read('src/feedback-model.js'),await read('src/feedback.js'),await read('src/app.js')].map(safeScript);
const policy="default-src 'none'; script-src "+scripts.map(s=>"'sha256-"+hash(s)+"'").join(' ')+"; style-src 'unsafe-inline'; img-src data:; worker-src blob:; child-src blob:; connect-src "+connectPolicy(batch)+"; font-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";
const css=await read('src/app.css')+'\n'+await read('src/feedback.css');
const offlineDemoConfig=safeScript('window.PBIS_DEMO_DATA='+JSON.stringify(demo)+';');
const offlineScripts=[scripts[0],offlineDemoConfig,...scripts.slice(1)];
const offlinePolicy=policy.replace(/script-src [^;]+/,'script-src '+offlineScripts.map(s=>"'sha256-"+hash(s)+"'").join(' '));
const html=(await read('src/app.html')).replace('<!--CSP-->',()=>`<meta http-equiv="Content-Security-Policy" content="${offlinePolicy}">`).replace('<!--STYLE-->',()=>`<style>${css}</style>`).replace('<!--SCRIPTS-->',()=>offlineScripts.map(s=>`<script>${s}</script>`).join('\n'));
await put('release/PBIS.html',html);
const localHome=await read('site-src/local-home.html');
await put('release/index.html',localHome);
// Both editions offer the same synthetic demo; imported files never enter the build.
await put('site/demo-data.json',JSON.stringify(demo));
const demoConfig=safeScript("window.PBIS_DEMO_URL='demo-data.json';");
const demoScripts=[...scripts.slice(0,1),demoConfig,...scripts.slice(1)];
const demoPolicy=policy.replace(/script-src [^;]+/, 'script-src '+demoScripts.map(s=>"'sha256-"+hash(s)+"'").join(' ')).replace(/connect-src ([^;]+)/,(_,destinations)=>`connect-src 'self' ${destinations==='\'none\''?'':destinations}`.trim());
const demoHtml=(await read('src/app.html')).replace('<!--CSP-->',()=>`<meta http-equiv="Content-Security-Policy" content="${demoPolicy}">`).replace('<!--STYLE-->',()=>`<style>${css}</style>`).replace('<!--SCRIPTS-->',()=>demoScripts.map(s=>`<script>${s}</script>`).join('\n')).replace('<title>PBIS · Consulta local</title>','<title>PBIS · Prueba de concepto</title>');
await put('site/DEMO.html',demoHtml);
await put('site/PBIS.html',demoHtml);
await put('site/.nojekyll','');
for(const f of ['index.html','site.css','site.js'])await put('site/'+f,await read('site-src/'+f));
// Preserve the captured report as a binary asset; text normalization would corrupt it.
await fs.mkdir(path.join(root,'site/assets'),{recursive:true});
await fs.copyFile(path.join(root,'site-src/assets/ficha-grupo-ejemplo.jpg'),path.join(root,'site/assets/ficha-grupo-ejemplo.jpg'));
const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function markdown(text){
 const inline=s=>escape(s).replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g,'<a href="$2" rel="noreferrer">$1</a>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/`([^`]+)`/g,'<code>$1</code>');
 const lines=text.split(/\r?\n/),out=[];let list=null;
 const endList=()=>{if(list){out.push(`</${list}>`);list=null;}};
 for(let i=0;i<lines.length;i++){const line=lines[i];if(!line.trim()){endList();continue;}
  if(line.startsWith('```')){endList();const code=[];while(++i<lines.length&&!lines[i].startsWith('```'))code.push(lines[i]);out.push('<pre><code>'+escape(code.join('\n'))+'</code></pre>');continue;}
  if(line.startsWith('|')&&/^\|[\s:|-]+\|\s*$/.test(lines[i+1]||'')){endList();const cells=s=>s.trim().slice(1,-1).split('|').map(x=>x.trim());out.push('<div class="table-scroll"><table><thead><tr>'+cells(line).map(x=>`<th>${inline(x)}</th>`).join('')+'</tr></thead><tbody>');i++;while(lines[i+1]?.startsWith('|')){i++;out.push('<tr>'+cells(lines[i]).map(x=>`<td>${inline(x)}</td>`).join('')+'</tr>');}out.push('</tbody></table></div>');continue;}
  const item=line.match(/^(?:([-*]) |(\d+)\. )(.*)/);if(item){const kind=item[1]?'ul':'ol';if(list!==kind){endList();out.push(`<${kind}>`);list=kind;}out.push(`<li>${inline(item[3])}</li>`);continue;}
  endList();const heading=line.match(/^(#{1,3}) (.*)/);out.push(heading?`<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`:`<p>${inline(line)}</p>`);
 }endList();return out.join('\n');
}
const methodology=await read('docs/METODOLOGIA.md');
for(const [source,target,title]of[['GUIA.md','guia.html','Guía de uso'],['PRIVACIDAD.md','privacidad.html','Privacidad y alcance'],['METODOLOGIA.md','metodologia.html','Metodología'],['OPINIONES.md','opiniones.html','Opiniones'],['AUDITORIA_PILOTO_20261008.md','auditoria.html','Auditoría del piloto'],['PROMPTS_MEJORA_PILOTO.md','prompts.html','Prompts de mejora y validación']]){
const text=await read('docs/'+source);
await put('site/'+target,`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} · PBIS</title><link rel="stylesheet" href="site.css"><style>.document{max-width:850px;margin:40px auto;padding:20px 28px 80px}.document h1{font:50px Georgia;line-height:1.05;margin:40px 0}.document h2{font:30px Georgia;margin:35px 0 15px}.document h3{margin:25px 0 10px}.document p{line-height:1.75;margin:12px 0;color:var(--muted)}.document pre{overflow:auto;padding:14px;background:var(--lilac);border-radius:8px;font-size:12px;line-height:1.7}.document pre code{padding:0}.document code{background:var(--lilac);padding:2px 5px;border-radius:4px;overflow-wrap:anywhere}.back{font-size:13px;font-weight:bold}</style><main class="document"><a class="back" href="index.html">← PBIS · Volver a la web</a>${markdown(text)}</main></html>`);
}
const provenance=`PBIS LOCAL 0.10.2 — COMPONENTES\n\nCódigo de la aplicación: fuentes en src y tools del proyecto PBIS.\nLector Excel: SheetJS Community Edition 0.20.3.\nOrigen: https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js\nDocumentación: https://docs.sheetjs.com/docs/getting-started/installation/standalone/\nLicencia Apache 2.0 adjunta.\nSHA-256 del lector: ${createHash('sha256').update(await read('vendor/xlsx.full.min.js')).digest('hex')}\n\nLa distribución incluye solo el ejemplo sintético incorporado, nunca archivos cargados por usuarios.\nLas cuentas de evaluación se incluyen en el programa. No usarlas como control de seguridad para datos reales.\nEl titular del producto debe determinar la licencia comercial, titularidad y condiciones antes de comercializar.\n`;
await put('release/COMPONENTES.txt',provenance);
const crcTable=Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc32(buffer){let crc=0xffffffff;for(const b of buffer)crc=crcTable[(crc^b)&255]^(crc>>>8);return (crc^0xffffffff)>>>0;}
function zip(files){const parts=[],central=[];let offset=0;for(const [filename,body]of files){const name=Buffer.from(filename),data=Buffer.from(body),packed=deflateRawSync(data),crc=crc32(data),head=Buffer.alloc(30);head.writeUInt32LE(0x04034b50);head.writeUInt16LE(20,4);head.writeUInt16LE(0x800,6);head.writeUInt16LE(8,8);head.writeUInt16LE(23869,12);head.writeUInt32LE(crc,14);head.writeUInt32LE(packed.length,18);head.writeUInt32LE(data.length,22);head.writeUInt16LE(name.length,26);parts.push(head,name,packed);const c=Buffer.alloc(46);c.writeUInt32LE(0x02014b50);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);c.writeUInt16LE(0x800,8);c.writeUInt16LE(8,10);c.writeUInt16LE(23869,14);c.writeUInt32LE(crc,16);c.writeUInt32LE(packed.length,20);c.writeUInt32LE(data.length,24);c.writeUInt16LE(name.length,28);c.writeUInt32LE(offset,42);central.push(c,name);offset+=head.length+name.length+packed.length;}const dir=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);end.writeUInt32LE(dir.length,12);end.writeUInt32LE(offset,16);return Buffer.concat([...parts,dir,end]);}
const manifest={version:'0.10.2',edition:'evaluacion-local',feedbackEnabled:!!batch.endpoint,demoIncluded:true,demoFeedback:false,built:new Date().toISOString().slice(0,10),files:[]};
for(const platform of ['Windows','macOS','Linux','Universal']){
const intro=`PBIS · ${platform} · EDICIÓN LOCAL 0.10.2\n\n1. Extrae la carpeta completa del ZIP.\n2. Abre index.html en un navegador actual (Chrome, Edge, Firefox o Safari).\n   Si se abre como texto, usa Abrir con y selecciona el navegador.\n3. Pulsa Comenzar práctica guiada; la simulación te mostrará sus claves.\n   Para consultar archivos, abre Acceder con mi cuenta.\n   Identifícate con una cuenta y su clave de seis caracteres.\n   Consulta los accesos en perfiles_evaluacion.xlsx.\n   Orientación puede ver todas las cuentas; tutoría consulta su curso en todos los centros.\n4. Carga datos_evaluacion.pbis y elige Datos; pulsa Abrir consulta.\n   Si el archivo contiene nombres, se muestran; si no, verás códigos.\n5. Pulsa Cerrar sesión al terminar y cierra la pestaña.\n\nLas fichas no necesitan R, Docker, un servidor ni conexión a Internet.\nEnviar opiniones requiere conexión y un receptor activado por el administrador.\nConsulta OPINIONES.md. El resumen se envía al pulsar Cerrar sesión.\nEs una aplicación web local, no un ejecutable nativo. Mismo motor en las cuatro descargas.\nLos originales de Excel no se modifican ni borran. Custodia el archivo de datos.\nLa demo está incorporada y funciona sin conexión. Sus valoraciones no se envían.\nEl archivo de prueba para ensayar la carga y la tabla de cuentas se descargan aparte.\nEl perfil limita la interfaz; no cifra archivos ni impide inspeccionarlos fuera de ella.\n\nCOMPATIBILIDAD\nPreparado para navegadores actuales de escritorio en Windows, macOS y Linux.\nConsulta COMPROBACIONES.md en el proyecto para conocer pruebas realmente realizadas.\nmacOS/Linux necesitan validación en esos sistemas antes de despliegue comercial.\nNo es una aplicación para iOS o Android; el diseño se adapta a pantallas estrechas.\n\nSEGURIDAD DEL PILOTO\nLas contraseñas de seis caracteres son de evaluación. No protegen datos reales.\nSin almacenamiento persistente de archivos en la aplicación. Cerrar sesión libera referencias\ny retira los resultados; no promete borrado forense de RAM, navegador, disco o swap.\nNo protege ante malware, extensiones, capturas o control del equipo.\n\n`;
const files=[['PBIS/PBIS.html',html],['PBIS/index.html',localHome],['PBIS/EMPIEZA-AQUI.txt',intro],['PBIS/GUIA.md',await read('docs/GUIA.md')],['PBIS/OPINIONES.md',await read('docs/OPINIONES.md')],['PBIS/PRIVACIDAD.md',await read('docs/PRIVACIDAD.md')],['PBIS/METODOLOGIA.md',methodology],['PBIS/COMPROBACIONES.md',await read('COMPROBACIONES.md')],['PBIS/AUDITORIA.md',await read('docs/AUDITORIA_PILOTO_20261008.md')],['PBIS/PROMPTS.md',await read('docs/PROMPTS_MEJORA_PILOTO.md')],['PBIS/COMPONENTES.txt',provenance],['PBIS/LICENSE-SheetJS.txt',await read('vendor/LICENSE-SheetJS.txt')]];
const bytes=zip(files),name=`PBIS-${platform}.zip`;await put('site/downloads/'+name,bytes);manifest.files.push({name,size:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
}
for(const name of ['datos_evaluacion.xlsx','llave_evaluacion.xlsx','perfiles_evaluacion.xlsx']){const bytes=await fs.readFile(path.join(root,'outputs/entrega-20260929',name));const delivered=name==='datos_evaluacion.xlsx'?'datos_evaluacion.pbis':name;await put('site/downloads/'+delivered,bytes);manifest.files.push({name:delivered,size:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}
await put('site/downloads/manifest.json',JSON.stringify(manifest,null,2));
await put('site/downloads/SHA256SUMS.txt',manifest.files.map(f=>`${f.sha256}  ${f.name}`).join('\n')+'\n');
await put('release/manifest.json',JSON.stringify(manifest,null,2));
console.log(JSON.stringify({appBytes:Buffer.byteLength(html),downloads:manifest.files.map(f=>({name:f.name,bytes:f.size}))},null,2));
