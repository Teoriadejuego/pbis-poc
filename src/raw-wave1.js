/* Conversion of the final PBIS Wave 1 export. Pure, local and deterministic. */
(function(root,factory){'use strict';if(typeof module==='object'&&module.exports)module.exports=factory();else root.PbisWave1=factory();}(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const needed=['Usuario Id','Alumno Id','Estudio','Curso','Grupo','dia','eredes1','redes1','eredes2','redes2','ebeliefs1','beliefs1','ebeliefs2','beliefs2','carrera1','carrera2','emilia1','emilia2','library1','library2','egeneral','general','efun','fun','ealone','alone','ebullying','bullying','emediador','mediador'];
const scoreFields=['popularidad','sociabilidad','reciprocidad_amistad','acierto_amistad','rechazo_recibido','rechazo_declarado','reciprocidad_rechazo','acierto_rechazo','bienestar','centralidad','mediacion'];
const countFields=['amistad_recibida_n','amistad_declarada_n','amistad_reciproca_n','rechazo_recibido_n','rechazo_declarado_n','rechazo_reciproco_n','bienestar_suma','mediacion_n','bullying_companeros_n'];
const MAX_BULLYING_OTHERS=15;
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
// Local numerical algorithms. Definitions: R/igraph 2.3.3, seed 20261010.
// A is a binary directed adjacency matrix: source in rows, recipient in columns.
function principalEigen(matrix) {
  const n=matrix.length, visited=new Set(), components=[];
  for(let start=0;start<n;start++)if(!visited.has(start)){
    const nodes=[start];visited.add(start);
    for(let q=0;q<nodes.length;q++)for(let j=0;j<n;j++)if(matrix[nodes[q]][j]>0&&!visited.has(j)){visited.add(j);nodes.push(j);}
    if(nodes.length===1&&!matrix[start][start])continue;
    const adj=nodes.map(i=>nodes.map(j=>matrix[i][j]));
    let v=nodes.map(()=>1),converged=false,lambda=0;
    for(let k=0;k<20000;k++){
      const product=adj.map(row=>row.reduce((s,w,j)=>s+w*v[j],0));
      const next=product.map((x,i)=>x+v[i]),scale=Math.max(...next);
      for(let i=0;i<next.length;i++)next[i]/=scale;
      const delta=Math.max(...next.map((x,i)=>Math.abs(x-v[i])));v=next;
      if(delta<1e-13){converged=true;break;}
    }
    const product=adj.map(row=>row.reduce((s,w,j)=>s+w*v[j],0));
    lambda=product.reduce((s,x,i)=>s+x*v[i],0)/v.reduce((s,x)=>s+x*x,0);
    const residual=Math.max(...product.map((x,i)=>Math.abs(x-lambda*v[i])));
    if(!converged||residual>1e-9*Math.max(1,lambda))return {vector:null,status:'no_convergence',lambda:null};
    components.push({nodes,vector:v,lambda});
  }
  if(!components.length)return {vector:null,status:'no_edges',lambda:0};
  const lambda=Math.max(...components.map(c=>c.lambda));
  const leading=components.filter(c=>Math.abs(c.lambda-lambda)<=1e-10*Math.max(1,lambda));
  // Equal dominant components do not define a unique ranking across components.
  if(leading.length>1)return {vector:null,status:'non_unique',lambda};
  const vector=Array(n).fill(0);leading[0].nodes.forEach((node,i)=>vector[node]=leading[0].vector[i]);
  return {vector,status:'ok',lambda};
}
// MT19937 with R's seed expansion; used only for reproducible network partitions.
// Not a credential generator. Integer draws match the R/igraph 30-bit adapter.
function networkRandom(seed=20261010) {
  const state=new Uint32Array(624);let pos=624,s=seed>>>0;
  for(let i=0;i<51;i++)s=(Math.imul(69069,s)+1)>>>0;
  for(let i=0;i<624;i++){s=(Math.imul(69069,s)+1)>>>0;state[i]=s;}
  function next(){
    if(pos===624){for(let i=0;i<624;i++){const y=(state[i]&0x80000000)|(state[(i+1)%624]&0x7fffffff);state[i]=state[(i+397)%624]^(y>>>1)^((y&1)?0x9908b0df:0);}pos=0;}
    let y=state[pos++];y^=y>>>11;y^=(y<<7)&0x9d2c5680;y^=(y<<15)&0xefc60000;y^=y>>>18;return y>>>0;
  }
  return n=>{
    if(n<=1)return 0;
    const threshold=(4294967296-n)%n;
    for(;;){const x=(next()>>>2)*4+(next()>>>30),product=x*n;if(product%4294967296>=threshold)return Math.floor(product/4294967296);}
  };
}
function canonicalMembership(membership){const map=new Map();return membership.map(c=>{if(!map.has(c))map.set(c,map.size);return map.get(c);});}
function partitionModularity(matrix,membership){
  const degree=matrix.map(row=>row.reduce((s,x)=>s+x,0)),total=degree.reduce((s,x)=>s+x,0);
  if(!total)return null;
  const internal=[],strength=[];
  membership.forEach((c,i)=>{strength[c]=(strength[c]||0)+degree[i];internal[c]=(internal[c]||0)+matrix[i].reduce((s,x,j)=>s+(membership[j]===c?x:0),0);});
  return strength.reduce((q,s,c)=>q+(s?((internal[c]||0)-s*s/total)/total:0),0);
}
// Louvain: greedy vertex moves, followed by contraction, resolution 1.
// Canonical labels are assigned in input-row order; isolated vertices stay separate.
function louvain(matrix){
  let graph=matrix.map(row=>row.slice()),membership=matrix.map((_,i)=>i),bestQ=partitionModularity(matrix,membership);
  if(bestQ===null)return {membership,modularity:null};
  const random=networkRandom();
  for(let level=0;level<matrix.length;level++){
    const n=graph.length,degree=graph.map(row=>row.reduce((s,w)=>s+w,0)),total=degree.reduce((s,w)=>s+w,0);
    let labels=graph.map((_,i)=>i),q=partitionModularity(graph,labels);
    const order=labels.slice();for(let i=n-1;i>0;i--){const j=random(i+1);[order[i],order[j]]=[order[j],order[i]];}
    for(let pass=0;pass<10000;pass++){
      const previous=labels.slice(),previousQ=q,strength=Array(n).fill(0);labels.forEach((c,i)=>strength[c]+=degree[i]);
      const a=random(n),b=random(n);[order[a],order[b]]=[order[b],order[a]];
      let changed=false;
      for(const i of order){
        const old=labels[i],weights=new Map();
        for(let j=0;j<n;j++)if(graph[i][j])weights.set(labels[j],(weights.get(labels[j])||0)+(i===j?0:graph[i][j]));
        strength[old]-=degree[i];let selected=old,gain=0;
        for(const c of [...weights.keys()].sort((a,b)=>a-b)){
          const improvement=weights.get(c)-strength[c]*degree[i]/total;
          if(improvement>gain){gain=improvement;selected=c;}
        }
        labels[i]=selected;strength[selected]+=degree[i];changed||=selected!==old;
      }
      q=partitionModularity(graph,labels);
      if(!changed||q<=previousQ){labels=previous;q=previousQ;break;}
      if(pass===9999)return {membership:null,modularity:null};
    }
    labels=canonicalMembership(labels);const count=Math.max(...labels)+1;
    if(count===n||q<bestQ-1e-14)break;
    membership=membership.map(c=>labels[c]);bestQ=q;
    const contracted=Array.from({length:count},()=>Array(count).fill(0));
    for(let i=0;i<n;i++)for(let j=0;j<n;j++)contracted[labels[i]][labels[j]]+=graph[i][j];
    graph=contracted;
  }
  membership=canonicalMembership(membership);
  return {membership,modularity:partitionModularity(matrix,membership)};
}
function networkMetrics(A,answered=A.map(()=>true)){
  const n=A.length,empty=()=>Array(n).fill(null);
  if(!answered.some(Boolean))return {eigen:{vector:null,status:'no_answers',lambda:null},eigenOr:{vector:null,status:'no_answers',lambda:null},centralization:null,gini:null,membership:null,modularity:null,density:null,incoming:empty(),outgoing:empty(),reciprocal:empty()};
  const U=A.map((row,i)=>row.map((v,j)=>i===j?0:Number(v>0||A[j][i]>0)));
  const sum=A.map((row,i)=>row.map((v,j)=>i===j?0:v+A[j][i]));
  const eigen=principalEigen(sum),eigenOr=principalEigen(U);
  const incoming=A.map((_,j)=>A.reduce((s,row)=>s+row[j],0));
  const outgoing=A.map((row,i)=>answered[i]?row.reduce((s,x)=>s+x,0):null);
  const reciprocal=A.map((row,i)=>answered[i]?row.reduce((s,x,j)=>s+x*A[j][i],0):null);
  const total=incoming.reduce((s,x)=>s+x,0);
  const centralization=n>2?(eigen.vector?eigen.vector.reduce((s,x)=>s+1-x,0)/(n-2):total===0?0:null):null;
  return {eigen,eigenOr,centralization,gini:gini(incoming),...louvain(U),density:n>1?total/(n*(n-1)):null,incoming,outgoing,reciprocal};
}

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
   // Filter emitters across the whole centre, before counting incoming links.
   // Keep the original ballot intact: self-reports and other measures still use it.
   const bullSources=items.filter(x=>x.bull!==null&&x.bull.filter(y=>y.id!==x.id).length<=MAX_BULLYING_OTHERS);
   const bullExcluded=items.filter(x=>x.bull!==null).length-bullSources.length;
   const bullIncoming=id=>bullSources.filter(x=>x.id!==id&&x.bull.some(y=>y.id===id)).length;
   const hasRel=items.some(x=>x.rel!==null),hasMed=items.some(x=>x.med!==null),hasBull=bullSources.length>0;
   const relComplete=items.every(x=>x.rel!==null),medComplete=items.every(x=>x.med!==null),bullComplete=items.every(x=>x.bull!==null);
   const issueCount=items.reduce((total,x)=>total+x.issues.length,0);
   if(issueCount)warnings.push('Centro '+study+': '+issueCount+' respuestas contienen «Error en relación». Se dejan pendientes; las demás preguntas se calculan con los datos válidos.');
   if(!relComplete||!medComplete||!bullComplete)warnings.push('Centro '+study+': hay respuestas incompletas; las nominaciones recibidas son recuentos observados y pueden aumentar con nuevas respuestas.');
   const n=items.length;
   const relAnswered=items.filter(x=>x.rel!==null).length;
   const pendingNetwork=Math.round(1000*(n-relAnswered)/n)/10;
   const classes=new Map();
   for(const x of items){const key=JSON.stringify([x.course,x.group]);if(!classes.has(key))classes.set(key,[]);classes.get(key).push(x);}
   const structures=new Map();
   for(const [key,members] of classes){
     const A=members.map(x=>members.map(y=>Number(x!==y&&!!x.pos?.has(y.id))));
     const calculated=networkMetrics(A,members.map(x=>x.rel!==null));structures.set(key,calculated);
     const pending=Math.round(1000*members.filter(x=>x.rel===null).length/members.length)/10;
     members.forEach((x,i)=>{x.structure=calculated;x.structureIndex=i;x.classPending=pending;});
     if(calculated.eigen.status==='no_convergence'||calculated.eigen.status==='non_unique')warnings.push('Centro '+study+', '+members[0].course+' '+members[0].group+': la centralidad del aula '+(calculated.eigen.status==='non_unique'?'no tiene una solución única':'no se ha estabilizado')+'. Los demás indicadores siguen disponibles.');
   }
   items.forEach((x,i)=>{
     const raw=x.raw, id=x.id, rawNames=[clean(givenColumn&&raw[givenColumn]),clean(familyColumn&&raw[familyColumn])].filter(Boolean).join(' ');
     const started=clean(raw.start)||[x.rel,x.pred,x.med,x.bull].some(value=>value!==null)||['general','fun','alone','carrera1','carrera2','emilia1','emilia2','library1','library2'].some(field=>!!answer(raw[field]));
     const row={ID:id,Centro:'Centro '+study,Curso:x.course,Grupo:x.group,Nombre:rawNames||null,respondio:clean(raw.end)?'Sí':started?null:'No',ambito_nominaciones:'centro',n_centro:n,red_centro_completa:relComplete,red_centro_pendiente_pct:pendingNetwork,centralidad_sin_convergencia:x.structure.eigen.status==='no_convergence',centralidad_estado:x.structure.eigen.status,ambito_centralidad:'clase',metodo_centralidad:'eigenvector_sum_v1',red_clase_pendiente_pct:x.classPending,escala_indicadores:'centro_observado_v1',Tratamiento:/^m/i.test(clean(raw.Sexo))?'alumna':'alumno',incidencias_calculo:x.issues.map(field=>field==='mediador'?'mediación':field.startsWith('beliefs')?'predicciones':'relaciones')};
     row.bullying_filtro_max_otros=MAX_BULLYING_OTHERS;
     row.bullying_filtro_excluidos_n=bullExcluded;
     row.bullying_filtro_admitidos_n=bullSources.length;
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
     row.bienestar=score(row.bienestar_suma,12);row.centralidad_eigenvector=x.structure.eigen.vector?.[x.structureIndex]??null;row.centralidad_eigenvector_or=x.structure.eigenOr.vector?.[x.structureIndex]??null;row.centralidad=score(row.centralidad_eigenvector,1);
     output.push(row);
   });
   for(const [key,groupItems] of classes){
     const representative=groupItems[0],structure=structures.get(key);
     const grows=output.filter(r=>r.Centro==='Centro '+study&&r.Curso===representative.course&&r.Grupo===representative.group);
     grows.forEach((row,i)=>{
       row.comunidad_amistad=structure.membership?'Red '+(structure.membership[i]+1):null;
       row.amistad_clase_recibida_n=structure.incoming[i];
       row.amistad_clase_declarada_n=structure.outgoing[i];
       row.amistad_clase_reciproca_n=structure.reciprocal[i];
     });
     const gin=structure.gini,cent=structure.centralization,modularity=structure.modularity;
     groups.push({Centro:'Centro '+study,Curso:representative.course,Grupo:representative.group,red_centro_completa:relComplete,red_centro_pendiente_pct:pendingNetwork,red_clase_completa:groupItems.every(x=>x.pos!==null),red_clase_pendiente_pct:representative.classPending,estructura_red:'clase_r_igraph_2.3.3_v1',escala_grupo:'centro_observado_v1',gini_popularidad:gin,pos_desigualdad:score(gin,1),centralizacion_eigenvector:cent,pos_centralizacion:score(cent,1),pos_separacion:modularity===null?null:score(Math.max(0,modularity),1),modularidad:modularity});
   }
 }
 return {students:output,groups,warnings:[...new Set(warnings)]};
}
return Object.freeze({isWave1,convert,course,crtScore,networkMetrics});
}));
