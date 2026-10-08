import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const XLSX=require('../vendor/xlsx.full.min.js');

// Only the checked-in synthetic workbook is used. No uploaded records enter this build.
export function completeDemo(root, fixture){
  const book=XLSX.read(fs.readFileSync(path.join(root,'outputs/entrega-20260929/datos_evaluacion.xlsx')),{type:'buffer',cellHTML:false});
  const relations=XLSX.utils.sheet_to_json(book.Sheets.Relaciones,{defval:null});
  const byOrigin=new Map();
  for(const link of relations){
    if(!['amistad','rechazo'].includes(link.Tipo))continue;
    const id=String(link.ID_origen), target=String(link.ID_destino);
    if(!byOrigin.has(id))byOrigin.set(id,[]);
    byOrigin.get(id).push({id:target,tipo:link.Tipo,intensidad:(Number(id)+Number(target))%3===0?2:1});
  }
  const students=fixture.students.map((row,index)=>{
    const total=row.bienestar_suma;
    const alone=row.soledad_frecuente==='Sí'?3+(index%2):Math.max(0,Math.min(2,12-total));
    const positive=total-4+alone;
    if(positive<0||positive>8)throw Error('El ejemplo de bienestar no admite tres respuestas coherentes.');
    return {...row,felicidad_centro:Math.ceil(positive/2),felicidad_diversion:Math.floor(positive/2),felicidad_soledad:alone,crt_aciertos:index%4,relaciones_red:byOrigin.get(row.ID)||[]};
  });
  return {students,keys:fixture.keys,groups:fixture.groups};
}
