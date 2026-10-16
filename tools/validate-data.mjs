import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import Ajv from 'ajv';
const require=createRequire(import.meta.url);
const C=require('../src/core.js');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
export function validateCatalog(catalog,schema=read('data/catalog.schema.json')){
  const validate=new Ajv({allErrors:true,strict:true}).compile(schema);
  if(!validate(catalog))throw new Error('Catálogo no válido: '+JSON.stringify(validate.errors));
  return true;
}
export function validateData(){
  const catalog=read('data/schema.json'),fixtures=read('data/fixtures.json'),profiles=read('data/profiles.json');
  validateCatalog(catalog);
  const validated=C.validateAndJoin(fixtures.students,fixtures.keys,fixtures.groups);
  for(const field of catalog.dataColumns)if(!fixtures.students.some(row=>Object.hasOwn(row,field)))throw new Error('Columna sin ejemplo: '+field);
  if(new Set(profiles.map(row=>row.username)).size!==profiles.length)throw new Error('Cuentas duplicadas.');
  for(const row of profiles){
    if(!/^(?:tutoria[a-z0-9]+|orientacion)$/.test(row.username)||!/^[A-Za-z0-9]{6}$/.test(row.password))throw new Error('Formato de cuenta de piloto incorrecto.');
    if(!['tutor','orientador'].includes(row.role)||row.center!==null)throw new Error('Perfil no previsto.');
    if(row.role==='tutor'&&!catalog.courses.includes(row.course))throw new Error('Curso sin ejemplo.');
  }
  const demo=read('data/demo-account.json');
  if(JSON.stringify(Object.keys(demo).sort())!==JSON.stringify(['password','username'])||demo.username!=='demo'||demo.password!=='DEMO26')throw new Error('Cuenta demo no prevista.');
  return {students:validated.students.length,profiles:profiles.length,catalogValid:true};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(validateData()));
