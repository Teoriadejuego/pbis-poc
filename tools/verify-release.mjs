import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {inflateRawSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
export function zipEntries(bytes){
  const entries=new Map();let offset=0;
  while(offset+4<=bytes.length&&bytes.readUInt32LE(offset)===0x04034b50){
    const method=bytes.readUInt16LE(offset+8),size=bytes.readUInt32LE(offset+18),nameSize=bytes.readUInt16LE(offset+26),extra=bytes.readUInt16LE(offset+28);
    const name=bytes.subarray(offset+30,offset+30+nameSize).toString('utf8'),start=offset+30+nameSize+extra;
    if(method!==8||entries.has(name)||name.includes('..')||name.includes('\\')||!name.startsWith('PBIS/'))throw new Error('Entrada ZIP no admitida.');
    entries.set(name,inflateRawSync(bytes.subarray(start,start+size)));offset=start+size;
  }
  return entries;
}
export function verifyRelease(directory=root){
  const read=name=>fs.readFileSync(path.join(directory,name));
  const manifest=JSON.parse(read('site/downloads/manifest.json')),checks=read('site/downloads/SHA256SUMS.txt').toString();
  const names=['PBIS-Windows.zip','PBIS-macOS.zip','PBIS-Linux.zip','PBIS-Universal.zip'];
  if(JSON.stringify(manifest.files.map(file=>file.name).sort())!==JSON.stringify(names.sort()))throw new Error('Descargas no previstas.');
  if(checks!==manifest.files.map(file=>file.sha256+'  '+file.name).join('\n')+'\n')throw new Error('SHA256SUMS no coincide con el manifiesto.');
  const packageVersion=JSON.parse(read('package.json')).version;
  if(manifest.version!==packageVersion)throw new Error('Versión de descarga desactualizada.');
  const zipAllowed=['PBIS.html','index.html','EMPIEZA-AQUI.txt','GUIA.md','OPINIONES.md','PRIVACIDAD.md','FEEDBACK_DATOS.md','tools/importar_feedback.py','METODOLOGIA.md','COMPROBACIONES.md','AUDITORIA.md','PROMPTS.md','PROMPT_RED_CLASE.md','COMPONENTES.txt','LICENSE-SheetJS.txt'].map(name=>'PBIS/'+name).sort();
  for(const file of manifest.files){
    const bytes=read('site/downloads/'+file.name);
    if(bytes.length!==file.size||sha(bytes)!==file.sha256)throw new Error('Descarga alterada: '+file.name);
    if(file.name.endsWith('.zip')){
      const entries=zipEntries(bytes);
      if(JSON.stringify([...entries.keys()].sort())!==JSON.stringify(zipAllowed))throw new Error('Contenido ZIP no previsto.');
      if(!entries.get('PBIS/PBIS.html').equals(read('release/PBIS.html')))throw new Error('Visualizador sin sincronizar.');
    }
  }
  const allowed=new Set(['.nojekyll','index.html','PBIS.html','DEMO.html','demo-data.json','site.css','site.js','assets/ficha-grupo-ejemplo.jpg','guia.html','privacidad.html','metodologia.html','opiniones.html','feedback-datos.html','auditoria.html','prompts.html','downloads/manifest.json','downloads/SHA256SUMS.txt',...names.map(name=>'downloads/'+name)]);
  function walk(relative=''){
    for(const entry of fs.readdirSync(path.join(directory,'site',relative),{withFileTypes:true})){
      const name=path.posix.join(relative,entry.name);
      if(entry.isSymbolicLink())throw new Error('Enlace simbólico en publicación.');
      if(entry.isDirectory())walk(name);
      else if(!allowed.has(name))throw new Error('Archivo público no previsto: '+name);
    }
  }
  walk();
  return {version:manifest.version,downloads:manifest.files.length,verified:true};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(verifyRelease()));
