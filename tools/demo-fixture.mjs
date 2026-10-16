import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const XLSX=require('../vendor/xlsx.full.min.js');
const {networkMetrics}=require('../src/raw-wave1.js');
const {aggregate}=require('../src/core.js');
// Randomly chosen once, then fixed so every practice uses the same example.
const DEMO_CENTERS=Object.freeze({Sevilla:'Centro 3705','Córdoba':'Centro 3884'});
const demoCenter=row=>({...row,Campus:DEMO_CENTERS[row.Campus]||row.Campus});
// Last name in the default alphabetical list of the training class.
// Ana and Samuel remain the two answered cases used by the existing tour.
const MANUAL_NON_RESPONDENT='00269';
const score=(a,b=1)=>a==null||!b?null:Math.round(100*a/b)/10;

function updateObservedClass(rows,relations){
  const sets=new Map();
  for(const link of relations){
    const key=String(link.ID_origen)+':'+link.Tipo;
    if(!sets.has(key))sets.set(key,new Set());
    sets.get(key).add(String(link.ID_destino));
  }
  const links=(id,type)=>sets.get(id+':'+type)||new Set();
  const incoming=(id,type)=>rows.filter(r=>r.ID!==id&&links(r.ID,type).has(id)).length;
  for(const row of rows){
    const answered=row.respondio!=='No',peers=rows.length-1;
    for(const [type,received,declared,mutual] of [
      ['amistad','amistad_recibida_n','amistad_declarada_n','amistad_reciproca_n'],
      ['rechazo','rechazo_recibido_n','rechazo_declarado_n','rechazo_reciproco_n']
    ]){
      row[received]=incoming(row.ID,type);
      row[declared]=answered?links(row.ID,type).size:null;
      row[mutual]=answered?[...links(row.ID,type)].filter(id=>links(id,type).has(row.ID)).length:null;
      row['pred_'+type+'_n']=answered?links(row.ID,'prediccion_'+type).size:null;
      row['pred_'+type+'_aciertos']=answered?[...links(row.ID,'prediccion_'+type)].filter(id=>links(id,type).has(row.ID)).length:null;
      row['reciprocidad_'+type]=score(row[mutual],row[declared]);
      row['acierto_'+type]=score(row['pred_'+type+'_aciertos'],row['pred_'+type+'_n']);
    }
    for(const [type,field] of [['mediacion','mediacion_n'],['mediacion_negativa','mediacion_negativa_n'],['bullying','bullying_companeros_n']])row[field]=incoming(row.ID,type);
    for(const [field,count] of [['popularidad','amistad_recibida_n'],['sociabilidad','amistad_declarada_n'],['rechazo_recibido','rechazo_recibido_n'],['rechazo_declarado','rechazo_declarado_n'],['mediacion','mediacion_n']])row[field]=score(row[count],peers);
  }
}

// Only the checked-in synthetic workbook is used. No uploaded records enter this build.
export function completeDemo(root, fixture){
  const book=XLSX.read(fs.readFileSync(path.join(root,'data/examples/datos_evaluacion.xlsx')),{type:'buffer',cellHTML:false});
  const relations=XLSX.utils.sheet_to_json(book.Sheets.Relaciones,{defval:null}).filter(link=>String(link.ID_origen)!==MANUAL_NON_RESPONDENT);
  const byOrigin=new Map();
  for(const link of relations){
    if(!['amistad','rechazo'].includes(link.Tipo))continue;
    const id=String(link.ID_origen), target=String(link.ID_destino);
    if(!byOrigin.has(id))byOrigin.set(id,[]);
    byOrigin.get(id).push({id:target,tipo:link.Tipo,intensidad:(Number(id)+Number(target))%3===0?2:1});
  }
  const anaIds=new Set(fixture.keys.filter(row=>row.Nombre==='Ana M.').map(row=>row.ID));
  const students=fixture.students.map((row,index)=>{
    const total=row.bienestar_suma;
    const alone=row.soledad_frecuente==='Sí'?3+(index%2):Math.max(0,Math.min(2,12-total));
    const positive=total-4+alone;
    if(positive<0||positive>8)throw Error('El ejemplo de bienestar no admite tres respuestas coherentes.');
    return {...demoCenter(row),felicidad_centro:Math.ceil(positive/2),felicidad_diversion:Math.floor(positive/2),felicidad_soledad:alone,crt_aciertos:anaIds.has(row.ID)?3:index%4,relaciones_red:byOrigin.get(row.ID)||[]};
  });
  const missing=students.find(row=>row.ID===MANUAL_NON_RESPONDENT);
  if(!missing||missing.Campus!=='Centro 3705'||missing.Curso!=='1.º ESO'||missing.Grupo!=='A')throw Error('Falta el caso manual de la demo.');
  missing.respondio='No';
  for(const field of ['bienestar_suma','bienestar','felicidad_centro','felicidad_diversion','felicidad_soledad','crt_aciertos','bullying_autorreporte','soledad_frecuente','identifica_apoyo'])missing[field]=null;
  const groups=fixture.groups.map(demoCenter);
  for(const group of groups){
    const rows=students.filter(r=>r.Campus===group.Campus&&r.Curso===group.Curso&&r.Grupo===group.Grupo);
    if(rows.includes(missing))updateObservedClass(rows,relations);
    const A=rows.map(r=>rows.map(s=>Number(r.ID!==s.ID&&r.relaciones_red.some(link=>link.id===s.ID&&link.tipo==='amistad'))));
    const net=networkMetrics(A,rows.map(r=>r.respondio!=='No')),pending=Math.round(1000*rows.filter(r=>r.respondio==='No').length/rows.length)/10;
    rows.forEach((r,i)=>Object.assign(r,{centralidad_eigenvector:net.eigen.vector?.[i]??null,centralidad:score(net.eigen.vector?.[i]),centralidad_eigenvector_or:net.eigenOr.vector?.[i]??null,centralidad_estado:net.eigen.status,ambito_centralidad:'clase',metodo_centralidad:'eigenvector_sum_v1',red_clase_pendiente_pct:pending,comunidad_amistad:net.membership?'Red '+(net.membership[i]+1):null}));
    Object.assign(group,{estructura_red:'clase_r_igraph_2.3.3_v1',gini_popularidad:net.gini,pos_desigualdad:score(net.gini),centralizacion_eigenvector:net.centralization,pos_centralizacion:score(net.centralization),modularidad:net.modularity,pos_separacion:net.modularity==null?null:score(Math.max(0,net.modularity))});
    if(rows.includes(missing))for(const metric of aggregate(rows,group).attention)group['pos_'+metric.id]=metric.score;
  }
  return {students,keys:fixture.keys,groups};
}
