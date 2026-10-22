import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const target=path.resolve(root,'../PBIS_GitHub');
try { await fs.access(path.join(target,'.git')); throw Error('PBIS_GitHub ya es un repositorio: actualiza sus archivos mediante Git.'); }
catch(error){if(error.code!=='ENOENT')throw error;}
const files=['README.md','EMPIEZA_AQUI.md','PROMPTS.md','COMPROBACIONES.md','package.json','package-lock.json','.gitignore','.gitattributes'];
async function walk(folder){
  for(const entry of await fs.readdir(path.join(root,folder),{withFileTypes:true})){
    if(['__pycache__','private','storage','node_modules','AUDITORIA_SIN_DATOS_LOCAL.md'].includes(entry.name))continue;
    const relative=path.posix.join(folder,entry.name);
    if(entry.isSymbolicLink())throw Error('No se incluyen enlaces simbólicos: '+relative);
    if(entry.isDirectory())await walk(relative);
    else if(entry.isFile())files.push(relative);
  }
}
for(const folder of ['src','docs','tests','tools','vendor','.github'])await walk(folder);
files.push('site-src/index.html','site-src/local-home.html','site-src/site.css','site-src/site.js','site-src/assets/ficha-grupo-ejemplo.jpg');
files.push('data/profiles.json','data/demo-account.json','data/fixtures.json','data/README.md','data/schema.json','data/catalog.schema.json');
for(const name of ['datos_evaluacion.xlsx','llave_evaluacion.xlsx'])files.push('data/examples/'+name);
for(const name of ['service.cjs','server.cjs','export.cjs','README.md','.env.example','.gitignore'])files.push('feedback-service/'+name);
for(const name of ['Code.gs','Registro.html','appsscript.json','README.md'])files.push('audit-service/'+name);
const expected=new Set(files);
async function existing(folder=''){
  const dir=path.join(target,folder);
  let entries;try{entries=await fs.readdir(dir,{withFileTypes:true});}catch(error){if(error.code==='ENOENT')return;throw error;}
  for(const entry of entries){const rel=path.posix.join(folder,entry.name);if(entry.isDirectory())await existing(rel);else if(!expected.has(rel))throw Error('Archivo previo no previsto en la carpeta de entrega: '+rel);}
}
await existing();
for(const relative of files){
  if(/(?:^|\/)\.env$|\.(?:db|sqlite|pem|key|zip)$/.test(relative))throw Error('Archivo privado o paquete no permitido: '+relative);
  const destination=path.join(target,relative);
  await fs.mkdir(path.dirname(destination),{recursive:true});
  const bytes=await fs.readFile(path.join(root,relative));
  await fs.writeFile(destination,bytes);
  const actual=await fs.readFile(destination);
  if(createHash('sha256').update(actual).digest('hex')!==createHash('sha256').update(bytes).digest('hex'))throw Error('La copia no coincide: '+relative);
}
console.log(JSON.stringify({directory:target,files:files.length,syntheticExcelFiles:files.filter(x=>x.endsWith('.xlsx')),readyForGit:true},null,2));
