/* Conversion of the final PBIS Wave 1 export. Pure, local and deterministic. */
(function(root,factory){'use strict';if(typeof module==='object'&&module.exports)module.exports=factory();else root.PbisWave1=factory();}(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const needed=['Usuario Id','Alumno Id','Estudio','Curso','Grupo','dia','eredes1','redes1','eredes2','redes2','ebeliefs1','beliefs1','ebeliefs2','beliefs2','carrera1','carrera2','emilia1','emilia2','library1','library2','egeneral','general','efun','fun','ealone','alone','ebullying','bullying','emediador','mediador'];
const scoreFields=['popularidad','sociabilidad','reciprocidad_amistad','acierto_amistad','rechazo_recibido','rechazo_declarado','reciprocidad_rechazo','acierto_rechazo','bienestar','centralidad','mediacion'];
const countFields=['amistad_recibida_n','amistad_declarada_n','amistad_reciproca_n','rechazo_recibido_n','rechazo_declarado_n','rechazo_reciproco_n','bienestar_suma','mediacion_n','bullying_companeros_n'];
const clean=v=>v===null||v===undefined?'':String(v).trim();
const answer=v=>clean(v).replace(/^.*?\s->\s*/,'').trim();
const normalized=v=>clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const score=(a,b)=>a===null||a===undefined||!b?null:Math.round(100*a/b)/10;
function course(v){const s=clean(v),n=s.match(/([1-6])\s*[^\w\d]*\s*(primaria|eso|bachillerato)/i);if(n)return n[1]+'.º '+(n[2].toLowerCase()==='eso'?'ESO':n[2].toLowerCase()==='primaria'?'Primaria':'Bachillerato');throw Error('Curso no reconocido en la base Wave 1.');}
function isWave1(rows){return Array.isArray(rows)&&rows.length>0&&needed.every(h=>Object.prototype.hasOwnProperty.call(rows[0],h));}
function selections(value,known,field,byId,selfId){
  if(!known)return null;
  const raw=answer(value);if(!raw||/^(ninguno|ninguna|nadie)$/i.test(raw))return [];
  const result=raw.split(/\s*\|\s*/).map(piece=>{
    const match=piece.trim().match(/^(.+?)(?:\s*\(([^()]*)\))?$/);
    const id=clean(match&&match[1]),label=normalized(match&&match[2]||'');if(!byId.has(id))throw Error('La pregunta '+field+' contiene una referencia a un ID que no existe en el mismo estudio.');
    if(field!=='bullying'&&!label)throw Error('Falta la valoración de una nominación en '+field+'.');
    if(/^(redes|beliefs)/.test(field)&&id===selfId)throw Error('La pregunta '+field+' contiene una autonominación no admitida.');
    return {id,label};
  });
  if(new Set(result.map(x=>x.id)).size!==result.length)throw Error('La pregunta '+field+' contiene un ID repetido.');
  return result;
}
// In this questionnaire, proceeding past bullying requires choosing somebody
// or "Nadie". An entry timestamp alone does not establish that it was answered.
function bullyingKnown(raw){return !!answer(raw.bullying)||['fqbullying','stopbullying','conductas','mediador'].some(field=>!!answer(raw[field]));}
function nominations(item,field,known,byId){
  const result=selections(item.raw[field],known||!!answer(item.raw[field]),field,byId,item.id);
  // This explicit export error invalidates the question, not the whole record.
  // Do not turn unclassified links into zero nominations or partial answers.
  if(result?.some(link=>link.label==='error en relacion')){item.issues.push(field);return null;}
  return result;
}
function frequency(value,known,field){if(!known)return null;const options=['nunca','casi nunca','algunas veces','casi siempre','siempre'];const s=normalized(answer(value));if(!s)return null;const i=options.indexOf(s);if(i<0)throw Error('Respuesta desconocida en '+field+'.');return i;}
function crtScore(raw,route){
 if(route!=='par'&&route!=='impar')return null;
 const suffix=route==='par'?'1':'2';
 const responses=['carrera','emilia','library'].map(field=>normalized(answer(raw[field+suffix])).replace(/[\s.!?¡¿]+$/g,'').trim());
 if(responses.some(value=>!value))return null;
 const correct=[/^(?:2|2[ºª°]|segund[ao])$/.test(responses[0]),/^(?:emilia|se llama emilia|la tercera hija se llama emilia)$/.test(responses[1]),/^(?:47|47 dias|dia 47|el dia 47)$/.test(responses[2])];
 return correct.filter(Boolean).length;
}
function classify(list){for(const x of list)if(!/^(muy )?(buena|mala) relaci.n$/.test(x.label))throw Error('Categoría de relación no reconocida.');return {positive:new Set(list.filter(x=>/^(buena|muy buena) relaci.n$/.test(x.label)).map(x=>x.id)),negative:new Set(list.filter(x=>/^(mala|muy mala) relaci.n$/.test(x.label)).map(x=>x.id))};}
function gini(values){if(!values.length)return null;const sum=values.reduce((a,b)=>a+b,0);if(!sum)return 0;let diff=0;for(const a of values)for(const b of values)diff+=Math.abs(a-b);return diff/(2*values.length*sum);}
function convert(rows){
 if(!isWave1(rows))throw Error('Esta hoja no tiene la estructura Wave 1 final. Selecciona «Users» o una hoja Datos ya calculada.');
 const optional=Object.keys(rows[0]).reduce((map,key)=>(map.set(normalized(key),key),map),new Map());
 const givenColumn=optional.get('nombre'),familyColumn=optional.get('apellidos');
 if(Boolean(givenColumn)!==Boolean(familyColumn))throw Error('Si se incluyen nombres, hacen falta las columnas Nombre y Apellidos juntas.');
 const byStudy=new Map(),byId=new Map(),keys=new Set();
 rows.forEach((raw,index)=>{const study=clean(raw.Estudio),id=clean(raw['Usuario Id']),studentCode=clean(raw['Alumno Id']);if(!study||!id||!studentCode)throw Error('Faltan Estudio, Usuario Id o Alumno Id en la fila '+(index+2)+'.');const key=JSON.stringify([study,id]);if(keys.has(key))throw Error('Hay un Usuario Id duplicado dentro de un estudio.');keys.add(key);const item={raw,study,id,studentCode,index};if(!byStudy.has(study))byStudy.set(study,[]);byStudy.get(study).push(item);byId.set(key,item);});
 const output=[],groups=[],warnings=[];
 for(const [study,items] of byStudy){
   const centerIds=new Map(items.map(x=>[x.id,x]));if(centerIds.size!==items.length)throw Error('Usuario Id debe ser único dentro de cada estudio.');
   for(const x of items){
     x.issues=[];
     x.course=course(x.raw.Curso);x.group=clean(x.raw.Grupo);if(!x.group)throw Error('Falta Grupo en una fila.');
     const route=answer(x.raw.dia);if(route&&!/^(par|impar)$/i.test(route))throw Error('La ruta dia debe ser Par o Impar.');x.route=route.toLowerCase();
     const relField=x.route==='par'?'redes1':'redes2',predField=x.route==='par'?'beliefs1':'beliefs2';
     x.rel=x.route?nominations(x,relField,!!clean(x.raw['e'+relField]),centerIds):null;
     x.pred=x.route?nominations(x,predField,!!clean(x.raw['e'+predField]),centerIds):null;
     x.med=nominations(x,'mediador',!!clean(x.raw.emediador),centerIds);
     x.bull=selections(x.raw.bullying,bullyingKnown(x.raw),'bullying',centerIds,x.id);
     if(x.med&&x.med.some(y=>!/^(muy )?(buena|mala) mediaci.n$/.test(y.label)))throw Error('Categoría de mediación no reconocida.');
     const type=x.rel===null?null:classify(x.rel);x.pos=type?.positive??null;x.neg=type?.negative??null;
     const predicted=x.pred===null?null:classify(x.pred);x.predPos=predicted?.positive??null;x.predNeg=predicted?.negative??null;
   }
   const incoming=(field,id)=>items.filter(x=>x[field]&&x.id!==id&&x[field].has(id)).length;
   const medIncoming=(id,positive)=>items.filter(x=>x.med&&x.id!==id&&x.med.some(y=>y.id===id&&(positive?/^(muy )?buena mediaci.n$/.test(y.label):/^(muy )?mala mediaci.n$/.test(y.label)))).length;
   const bullIncoming=id=>items.filter(x=>x.bull&&x.id!==id&&x.bull.some(y=>y.id===id)).length;
   const hasRel=items.some(x=>x.rel!==null),hasMed=items.some(x=>x.med!==null),hasBull=items.some(x=>x.bull!==null);
   const relComplete=items.every(x=>x.rel!==null),medComplete=items.every(x=>x.med!==null),bullComplete=items.every(x=>x.bull!==null);
   const issueCount=items.reduce((total,x)=>total+x.issues.length,0);
   if(issueCount)warnings.push('Centro '+study+': '+issueCount+' respuestas contienen «Error en relación». Se dejan pendientes; las demás preguntas se calculan con los datos válidos.');
   if(!relComplete||!medComplete||!bullComplete)warnings.push('Centro '+study+': hay respuestas incompletas; las nominaciones recibidas son recuentos observados y pueden aumentar con nuevas respuestas.');
   const n=items.length;
   // Provisional eigenvector on the observed undirected positive network.
   // Self loops stabilize power iteration in disconnected/bipartite networks.
   const adj=items.map(x=>items.filter(y=>y!==x&&((x.pos&&x.pos.has(y.id))||(y.pos&&y.pos.has(x.id)))).map(y=>items.indexOf(y)));
   const relAnswered=items.filter(x=>x.rel!==null).length;
   const pendingNetwork=Math.round(1000*(n-relAnswered)/n)/10;
   let eigen=null;
   if(n>1&&relAnswered){
     if(adj.every(neighbors=>!neighbors.length))eigen=items.map(()=>0);
     else{
       let vec=items.map(()=>1/Math.sqrt(n)),converged=false;
       // Disconnected classroom networks can have almost equal leading
       // eigenvalues. A fixed 500 steps can return an unstabilized mixture.
       for(let k=0;k<20000;k++){
         const next=adj.map((neighbors,i)=>vec[i]+neighbors.reduce((sum,j)=>sum+vec[j],0));
         const len=Math.hypot(...next),normalized=next.map(value=>value/len);
         const delta=Math.max(...normalized.map((value,i)=>Math.abs(value-vec[i])));
         vec=normalized;if(delta<1e-10){converged=true;break;}
       }
       if(converged){const max=Math.max(...vec);eigen=vec.map(value=>value/max);}
       else warnings.push('Centro '+study+': la centralidad no se ha estabilizado. Queda pendiente; los recuentos y las demás medidas siguen disponibles.');
     }
   }
   items.forEach((x,i)=>{
     const raw=x.raw, id=x.id, rawNames=[clean(givenColumn&&raw[givenColumn]),clean(familyColumn&&raw[familyColumn])].filter(Boolean).join(' ');
     const started=clean(raw.start)||[x.rel,x.pred,x.med,x.bull].some(value=>value!==null)||['general','fun','alone','carrera1','carrera2','emilia1','emilia2','library1','library2'].some(field=>!!answer(raw[field]));
     const row={ID:id,Centro:'Centro '+study,Curso:x.course,Grupo:x.group,Nombre:rawNames||null,respondio:clean(raw.end)?'Sí':started?null:'No',ambito_nominaciones:'centro',n_centro:n,red_centro_completa:relComplete,red_centro_pendiente_pct:pendingNetwork,centralidad_sin_convergencia:n>1&&relAnswered>0&&eigen===null,escala_indicadores:'centro_observado_v1',Tratamiento:/^m/i.test(clean(raw.Sexo))?'alumna':'alumno',incidencias_calculo:x.issues.map(field=>field==='mediador'?'mediación':field.startsWith('beliefs')?'predicciones':'relaciones')};
     for(const f of [...scoreFields,...countFields])row[f]=null;
     // Preserve only ID, direction and the survey's two intensity levels in memory.
     // Names, when supplied, remain in this file's display field.
     row.relaciones_red=x.rel?.map(({id:target,label})=>({id:target,tipo:/buena relaci.n$/.test(label)?'amistad':'rechazo',intensidad:label.startsWith('muy ')?2:1}))??null;
     row.amistad_declarada_n=x.pos?.size??null;row.rechazo_declarado_n=x.neg?.size??null;
     row.amistad_recibida_n=hasRel?incoming('pos',id):null;row.rechazo_recibido_n=hasRel?incoming('neg',id):null;
     row.amistad_reciproca_n=x.pos?[...x.pos].filter(target=>centerIds.get(target).pos?.has(id)).length:null;
     row.rechazo_reciproco_n=x.neg?[...x.neg].filter(target=>centerIds.get(target).neg?.has(id)).length:null;
     row.pred_amistad_n=x.predPos?.size??null;row.pred_rechazo_n=x.predNeg?.size??null;
     row.pred_amistad_aciertos=x.predPos?[...x.predPos].filter(target=>centerIds.get(target).pos?.has(id)).length:null;
     row.pred_rechazo_aciertos=x.predNeg?[...x.predNeg].filter(target=>centerIds.get(target).neg?.has(id)).length:null;
     row.mediacion_n=hasMed?medIncoming(id,true):null;row.mediacion_negativa_n=hasMed?medIncoming(id,false):null;row.bullying_companeros_n=hasBull?bullIncoming(id):null;
     row.identifica_apoyo=x.med===null?null:x.med.length?'Sí':'No';row.bullying_autorreporte=x.bull===null?null:x.bull.some(y=>y.id===id)?'Sí':'No';
     row.crt_aciertos=crtScore(raw,x.route);
     const happiness=[['felicidad_centro','general','egeneral'],['felicidad_diversion','fun','efun'],['felicidad_soledad','alone','ealone']];for(const [dest,field,event] of happiness)row[dest]=frequency(raw[field],!!clean(raw[event])||!!answer(raw[field]),field);
     row.soledad_frecuente=row.felicidad_soledad===null?null:row.felicidad_soledad>=3?'Sí':'No';
     if(happiness.every(([dest])=>row[dest]!==null))row.bienestar_suma=row.felicidad_centro+row.felicidad_diversion+4-row.felicidad_soledad;
     for(const [dest,count] of [['popularidad','amistad_recibida_n'],['sociabilidad','amistad_declarada_n'],['rechazo_recibido','rechazo_recibido_n'],['rechazo_declarado','rechazo_declarado_n'],['mediacion','mediacion_n']])row[dest]=score(row[count],n-1);
     row.reciprocidad_amistad=score(row.amistad_reciproca_n,row.amistad_declarada_n);row.reciprocidad_rechazo=score(row.rechazo_reciproco_n,row.rechazo_declarado_n);
     row.acierto_amistad=score(row.pred_amistad_aciertos,row.pred_amistad_n);row.acierto_rechazo=score(row.pred_rechazo_aciertos,row.pred_rechazo_n);
     row.bienestar=score(row.bienestar_suma,12);row.centralidad_eigenvector=eigen?eigen[i]:null;row.centralidad=score(row.centralidad_eigenvector,1);
     output.push(row);
   });
   const classes=new Map();for(const x of items){const key=JSON.stringify([x.course,x.group]);if(!classes.has(key))classes.set(key,[]);classes.get(key).push(x);}
   for(const groupItems of classes.values()){
     const representative=groupItems[0],grows=output.filter(r=>r.Centro==='Centro '+study&&r.Curso===representative.course&&r.Grupo===representative.group);
     const gin=hasRel?gini(grows.map(r=>r.amistad_recibida_n)):null;
     const ev=grows.map(r=>r.centralidad_eigenvector);const cent=ev.every(v=>v!==null)&&ev.length>2?(ev.every(v=>v===0)?0:Math.max(0,Math.min(1,ev.reduce((s,v)=>s+1-v,0)/(ev.length-2)))):null;
     let modularity=null;
     // Classroom communities are connected components of *reciprocal* positive
     // links inside the class. Cross-class links still count in student metrics.
     if(groupItems.some(x=>x.pos!==null)){
       const edges=groupItems.map((x,i)=>groupItems.map((y,j)=>i!==j&&x.pos?.has(y.id)&&y.pos?.has(x.id)));
       const degree=edges.map(row=>row.filter(Boolean).length),m=degree.reduce((a,b)=>a+b,0)/2;
       if(m>0){let component=0;const assignments=new Array(groupItems.length).fill(-1),components=[];
         for(let i=0;i<groupItems.length;i++)if(assignments[i]<0){const queue=[i];assignments[i]=component;for(let q=0;q<queue.length;q++)for(let j=0;j<groupItems.length;j++)if(edges[queue[q]][j]&&assignments[j]<0){assignments[j]=component;queue.push(j);}components.push(queue);component++;}
         modularity=1-components.reduce((sum,nodes)=>sum+Math.pow(nodes.reduce((total,j)=>total+degree[j],0)/(2*m),2),0);
         modularity=Math.max(0,Math.min(1,modularity));
         grows.forEach(row=>{const i=groupItems.findIndex(x=>x.id===row.ID);row.comunidad_amistad='Red '+(assignments[i]+1);});
       }
     }
     groups.push({Centro:'Centro '+study,Curso:representative.course,Grupo:representative.group,red_centro_completa:relComplete,red_centro_pendiente_pct:pendingNetwork,red_clase_completa:groupItems.every(x=>x.pos!==null),escala_grupo:'centro_observado_v1',gini_popularidad:gin,pos_desigualdad:score(gin,1),centralizacion_eigenvector:cent,pos_centralizacion:score(cent,1),pos_separacion:score(modularity,1),modularidad:modularity});
   }
 }
 return {students:output,groups,warnings:[...new Set(warnings)]};
}
return Object.freeze({isWave1,convert,course,crtScore});
}));
