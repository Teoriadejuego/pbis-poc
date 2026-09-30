// Datos sintéticos deterministas: relaciones observables -> recuentos -> escalas.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out=path.join(root,'outputs','entrega-20260929');
await fs.mkdir(out,{recursive:true});
await fs.mkdir(path.join(root,'outputs','revision-datos'),{recursive:true});
const N=28, students=[], keys=[], relations=[], groups=[];
const courses=[['4.º Primaria','4p'],['5.º Primaria','5p'],['6.º Primaria','6p'],['1.º ESO','1eso'],['2.º ESO','2eso'],['3.º ESO','3eso'],['4.º ESO','4eso'],['1.º Bachillerato','1bach'],['2.º Bachillerato','2bach']];
const centers=[['Sevilla','sevilla'],['Córdoba','cordoba']];
const classrooms=centers.flatMap(([center])=>courses.flatMap(([course])=>['A','B','C'].map(group=>[center,course,group])));
const female=['Ana','Lucía','Marina','Clara','Elena','Paula','Carmen','Nora','Valeria','Alba','Irene','Sofía','Lola','Marta'];
const male=['Lucas','Hugo','Mateo','Leo','Pablo','Daniel','Álvaro','Bruno','Diego','Iván','Mario','Nicolás','Tomás','Samuel'];
const letters=['M.','R.','V.','P.','D.','S.','L.','G.','C.','A.','T.','F.'];
const scores=['popularidad','sociabilidad','reciprocidad_amistad','acierto_amistad','rechazo_recibido','rechazo_declarado','reciprocidad_rechazo','acierto_rechazo','bienestar','centralidad','mediacion'];
const counts=['amistad_recibida_n','amistad_declarada_n','amistad_reciproca_n','rechazo_recibido_n','rechazo_declarado_n','rechazo_reciproco_n','bienestar_suma','mediacion_n','bullying_companeros_n'];
const columns=['ID','Campus','Curso','Grupo','Tratamiento',...scores,...counts,'bullying_autorreporte','respondio','soledad_frecuente','identifica_apoyo','comunidad_amistad','escala_indicadores','n_clase','pred_amistad_n','pred_amistad_aciertos','pred_rechazo_n','pred_rechazo_aciertos','centralidad_eigenvector'];
const groupScores=['pos_bullying_declarado','pos_bullying_companeros','pos_soledad','pos_densidad_rechazo','pos_sin_reciprocas','pos_separacion','pos_desigualdad','pos_centralizacion'];
const groupColumns=['Campus','Curso','Grupo','Periodo','salones_referencia',...groupScores,'modularidad','gini_popularidad','centralizacion_eigenvector','escala_grupo'];
const sum=a=>a.reduce((x,y)=>x+y,0), round=x=>Math.round(x*10)/10;
const matrix=()=>Array.from({length:N},()=>Array(N).fill(0));
const incoming=(a,i)=>sum(a.map(r=>r[i])), mutual=(a,i)=>sum(a[i].map((v,j)=>v*a[j][i]));
function eigen(a){
  let v=Array(N).fill(1);
  for(let step=0;step<10000;step++){
    let w=a.map((r,i)=>sum(r.map((x,j)=>x*v[j]))+v[i]);
    let max=Math.max(...w);w=w.map(x=>x/max);
    if(Math.max(...w.map((x,i)=>Math.abs(x-v[i])))<1e-12)return w;
    v=w;
  }
  throw Error('Eigenvector no convergente');
}
for(const [c,[Campus,Curso,Grupo]] of classrooms.entries()){
  const scenario=c%4;
  // Cuatro escenarios: grupo conectado, subgrupos, integración, concentración en líderes.
  const sizes=[[10,10,8],[12,9,7],[14,14],[14,14]][scenario];
  const community=sizes.flatMap((n,k)=>Array(n).fill(k));
  const hubs=sizes.map((_,k)=>sum(sizes.slice(0,k)));
  const f=matrix(),r=matrix(),m=matrix(),b=matrix(),pf=matrix(),pr=matrix();
  const add=(a,i,j)=>{if(i!==j)a[i][j]=1;};
  for(let i=0;i<N;i++){
    const members=community.map((x,j)=>x===community[i]?j:-1).filter(j=>j>=0);
    const local=members.indexOf(i);
    for(const offset of (scenario===3?[1]:[1,2+(Math.floor(c/4)%2)])){
      const j=members[(local+offset)%members.length];add(f,i,j);add(f,j,i);
    }
    add(f,i,hubs[community[i]]);
    if(scenario===0 && i%3===0)add(f,i,(i+11)%N);
    if(scenario===2){add(f,i,(i+13)%N);add(f,(i+13)%N,i);}
    if(scenario===3 && i%2===0)add(f,i,0);
  }
  // Puentes entre comunidades mantienen conectada la proyección no dirigida.
  for(let k=1;k<hubs.length;k++){add(f,hubs[k-1],hubs[k]);add(f,hubs[k],hubs[k-1]);}
  if(scenario===0){
    for(let i=0;i<N;i++){f[i][0]=i>=1&&i<=16?1:0;f[i][26]=[20,21,22,23].includes(i)?1:0;}
  }
  if(scenario===1){
    // Cuatro estudiantes con elecciones no correspondidas, sin convertirlas en diagnósticos.
    for(let j=24;j<N;j++){for(let i=0;i<N;i++)f[i][j]=0;f[j].fill(0);add(f,j,21);}
  }
  const stress=[[23,25],[24,25,26,27],[25],[22,25,27]][scenario];
  for(let i=0;i<N;i++){
    const candidates=[...stress,...Array.from({length:N},(_,k)=>(i+9+k*5)%N)];
    const limit=i%7===0?0:(scenario===1?2+i%2:1+(i%5===0?1:0));
    for(const j of candidates){if(sum(r[i])>=limit)break;if(j!==i&&!f[i][j]&&!f[j][i])add(r,i,j);}
    // Mediación: reconocimiento concentrado en los conectores del grupo.
    const mediator=hubs[community[i]];
    if(i%3!==0)add(m,i,mediator);
    if(i%7===0)add(m,i,hubs[(community[i]+1)%hubs.length]);
  }
  const self=[[23],[24,25,26],[25],[22,25]][scenario];
  const reported=[[23,25],[24,25,26,27,23],[25],[22,25,27]][scenario];
  for(const [k,j] of reported.entries())for(let w=0;w<2+(k+scenario)%5;w++)add(b,(j+3+w)%N,j);
  for(let i=0;i<N;i++){
    for(const [actual,pred] of [[f,pf],[r,pr]]){
      const incomingIds=actual.map((row,j)=>row[i]?j:-1).filter(j=>j>=0);
      for(const [k,j] of incomingIds.entries())if((k+i+Math.floor(c/4))%4!==0)add(pred,i,j);
      if(i%3===1){const falseId=Array.from({length:N},(_,k)=>(i+k+5)%N).find(j=>j!==i&&!actual[j][i]);if(falseId!==undefined)add(pred,i,falseId);}
    }
  }
  const undirected=f.map((row,i)=>row.map((v,j)=>Math.max(v,f[j][i])));
  const ec=eigen(undirected),degrees=undirected.map(sum),edgeCount=sum(degrees)/2;
  let q=0;
  for(let i=0;i<N;i++)for(let j=0;j<N;j++)if(community[i]===community[j])q+=undirected[i][j]-degrees[i]*degrees[j]/(2*edgeCount);
  q/=2*edgeCount;
  const received=f.map((_,i)=>incoming(f,i));
  let pairDiff=0;for(const x of received)for(const y of received)pairDiff+=Math.abs(x-y);
  const gini=pairDiff/(2*N*sum(received));
  const cent=sum(ec.map(x=>1-x))/(N-2); // Freeman; eigenvector normalizado por máximo; grafo simple no dirigido.
  const classRows=[];
  for(let i=0;i<N;i++){
    const ID=String(c*N+i+1).padStart(5,'0'), femaleStudent=i%2===0;
    let Nombre=`${(femaleStudent?female:male)[Math.floor(i/2)]} ${letters[(c*3+i)%letters.length]}`;
    if((c===0||c===9)&&i===0)Nombre='Ana M.';
    if(scenario===0&&[7,9].includes(i))Nombre='Leo R.';
    keys.push({ID,Nombre});
    const loneliness=(mutual(f,i)===0 || stress.includes(i) || (scenario===0&&i===18));
    const support=!(loneliness && i%3!==0) && !(scenario===1&&i%5===0);
    // Respuestas personales explícitas con variación individual; no son diagnósticos derivados de la red.
    let wellbeingTotal=9+(i%4)- (loneliness?4:0)-(self.includes(i)?2:0);
    if(i===11)wellbeingTotal=6; // Malestar posible incluso con vínculos.
    wellbeingTotal=Math.max(2,Math.min(12,wellbeingTotal));
    const items=Array.from({length:4},(_,k)=>Math.floor(wellbeingTotal/4)+(k<wellbeingTotal%4?1:0));
    const row={ID,Campus,Curso,Grupo,Tratamiento:femaleStudent?'alumna':'alumno',
      amistad_recibida_n:incoming(f,i),amistad_declarada_n:sum(f[i]),amistad_reciproca_n:mutual(f,i),
      rechazo_recibido_n:incoming(r,i),rechazo_declarado_n:sum(r[i]),rechazo_reciproco_n:mutual(r,i),
      bienestar_suma:sum(items),mediacion_n:incoming(m,i),bullying_companeros_n:incoming(b,i),
      bullying_autorreporte:self.includes(i)?'Sí':'No',respondio:'Sí',soledad_frecuente:loneliness?'Sí':'No',
      identifica_apoyo:support?'Sí':'No',comunidad_amistad:`G${community[i]+1}`,escala_indicadores:'normalizada_v1',n_clase:N,
      pred_amistad_n:sum(pf[i]),pred_amistad_aciertos:sum(pf[i].map((v,j)=>v*f[j][i])),
      pred_rechazo_n:sum(pr[i]),pred_rechazo_aciertos:sum(pr[i].map((v,j)=>v*r[j][i])),centralidad_eigenvector:ec[i],items};
    const ratio=(a,b)=>b?round(10*a/b):null;
    Object.assign(row,{popularidad:ratio(row.amistad_recibida_n,N-1),sociabilidad:ratio(row.amistad_declarada_n,N-1),
      reciprocidad_amistad:ratio(row.amistad_reciproca_n,row.amistad_declarada_n),acierto_amistad:ratio(row.pred_amistad_aciertos,row.pred_amistad_n),
      rechazo_recibido:ratio(row.rechazo_recibido_n,N-1),rechazo_declarado:ratio(row.rechazo_declarado_n,N-1),
      reciprocidad_rechazo:ratio(row.rechazo_reciproco_n,row.rechazo_declarado_n),acierto_rechazo:ratio(row.pred_rechazo_aciertos,row.pred_rechazo_n),
      bienestar:ratio(row.bienestar_suma,12),centralidad:round(10*ec[i]),mediacion:ratio(row.mediacion_n,N-1)});
    students.push(row);classRows.push(row);
  }
  for(const [Tipo,a] of [['amistad',f],['rechazo',r],['mediacion',m],['bullying',b],['prediccion_amistad',pf],['prediccion_rechazo',pr]])
    for(let i=0;i<N;i++)for(let j=0;j<N;j++)if(a[i][j])relations.push({Campus,Curso,Grupo,ID_origen:classRows[i].ID,ID_destino:classRows[j].ID,Tipo,
      Correspondida:['amistad','rechazo'].includes(Tipo)?a[j][i]:null,
      Acierto:Tipo==='prediccion_amistad'?f[j][i]:Tipo==='prediccion_rechazo'?r[j][i]:null});
  const raw=[self.length/N,reported.length/N,classRows.filter(x=>x.soledad_frecuente==='Sí').length/N,
    sum(classRows.map(x=>x.rechazo_declarado_n))/(N*(N-1)),classRows.filter(x=>x.amistad_reciproca_n===0).length/N,
    Math.max(0,q),gini,cent];
  groups.push({Campus,Curso,Grupo,Periodo:'Septiembre 2026',salones_referencia:null,
    ...Object.fromEntries(groupScores.map((k,i)=>[k,round(10*raw[i])])),modularidad:q,gini_popularidad:gini,centralizacion_eigenvector:cent,escala_grupo:'normalizada_v1'});
}
assert.equal(students[0].amistad_recibida_n,16);assert.equal(students[26].amistad_recibida_n,4);
assert(students[0].popularidad>students[26].popularidad);
for(const g of groups){const d=students.filter(x=>x.Campus===g.Campus&&x.Curso===g.Curso&&x.Grupo===g.Grupo);
  for(const type of ['amistad','rechazo'])assert.equal(sum(d.map(x=>x[`${type}_recibido_n`]??x.amistad_recibida_n)),sum(d.map(x=>x[`${type}_declarado_n`]??x.amistad_declarada_n)));
}

const descriptions={
 popularidad:'10 × nominaciones de amistad recibidas / (N−1).',sociabilidad:'10 × amistades declaradas / (N−1).',
 reciprocidad_amistad:'10 × amistades correspondidas / amistades declaradas. Sin elecciones: vacío.',
 acierto_amistad:'Precisión: 10 × predicciones correctas / predicciones emitidas. Sin predicciones: vacío.',
 rechazo_recibido:'10 × nominaciones negativas recibidas / (N−1).',rechazo_declarado:'10 × nominaciones negativas emitidas / (N−1).',
 reciprocidad_rechazo:'10 × elecciones negativas correspondidas / elecciones negativas emitidas. Sin elecciones: vacío.',
 acierto_rechazo:'Precisión: 10 × predicciones negativas correctas / predicciones emitidas. Sin predicciones: vacío.',
 bienestar:'10 × suma de cuatro respuestas de 0 a 3 / 12. Escala ilustrativa, no instrumento validado.',
 centralidad:'10 × eigenvector de la amistad no dirigida (existe vínculo si cualquiera nomina), máximo del grupo = 1.',
 mediacion:'10 × nominaciones como referente en mediación / (N−1).',
 ID:'Identificador de texto. Nombres solo en el libro Llave.',Campus:'Centro de enseñanza.',Curso:'Curso.',Grupo:'Grupo dentro del centro de enseñanza y curso.',Tratamiento:'Campo heredado por compatibilidad. Los informes usan redacción inclusiva.',
 amistad_recibida_n:'Nominaciones entrantes en Relaciones, tipo amistad.',amistad_declarada_n:'Nominaciones salientes de amistad.',amistad_reciproca_n:'Salientes cuya nominación inversa también existe.',
 rechazo_recibido_n:'Nominaciones entrantes de rechazo.',rechazo_declarado_n:'Nominaciones salientes de rechazo.',rechazo_reciproco_n:'Rechazos salientes cuya nominación inversa existe.',
 bienestar_suma:'Suma de los cuatro ítems de Respuestas.',mediacion_n:'Nominaciones recibidas como referente en mediación.',bullying_companeros_n:'Estudiantes del grupo que señalan una situación de acoso escolar; excluye la respuesta propia.',
 bullying_autorreporte:'Respuesta personal sobre acoso escolar. Puede diferir de las respuestas del grupo.',respondio:'Participación en la encuesta.',soledad_frecuente:'Respuesta personal sobre soledad frecuente.',identifica_apoyo:'Declara conocer a quién acudir.',
 comunidad_amistad:'Comunidad plantada en el escenario. No detectada por un algoritmo.',escala_indicadores:'normalizada_v1: escalas descritas aquí, no percentiles.',n_clase:'Número de estudiantes con el mismo centro de enseñanza, curso y grupo.',
 pred_amistad_n:'Estudiantes del grupo de quienes se espera recibir una nominación de amistad.',pred_amistad_aciertos:'Predicciones contrastadas con nominaciones realmente recibidas.',pred_rechazo_n:'Estudiantes del grupo de quienes se espera recibir una nominación negativa.',pred_rechazo_aciertos:'Predicciones negativas contrastadas con nominaciones recibidas.',centralidad_eigenvector:'Valor calculado desde Relaciones por el generador. Regenerar si cambia la red.'};

const profiles=[];
for(const [center,slug] of centers){
  for(const [course,code] of courses)for(const group of ['A','B','C'])profiles.push({username:`tutor${code}${group.toLowerCase()}_${slug}`,password:'1234',role:'tutor',center,course,group,label:`Tutoría ${course} ${group} · ${center}`});
  profiles.push({username:`orientador_${slug}`,password:'1234',role:'orientador',center,course:null,group:null,label:`Orientación · ${center}`});
}
profiles.push({username:'orientador',password:'1234',role:'orientador',center:null,course:null,group:null,label:'Orientación · todos los centros'});
for(const group of ['A','B'])profiles.push({username:`tutor7${group.toLowerCase()}`,password:'1234',role:'tutor',center:'Sevilla',course:'1.º ESO',group,label:`Tutoría 1.º ESO ${group} · Sevilla (acceso anterior)`});
assert.equal(students.length,1512);assert.equal(groups.length,54);assert.equal(profiles.length,59);
assert.equal(new Set(students.map(s=>s.ID)).size,1512);assert.equal(new Set(profiles.map(p=>p.username)).size,59);
const studentMap=new Map(students.map(s=>[s.ID,s]));
const relationSet=new Set();
for(const r of relations){
  assert.notEqual(r.ID_origen,r.ID_destino);
  const key=`${r.ID_origen}|${r.ID_destino}|${r.Tipo}`;assert(!relationSet.has(key));relationSet.add(key);
  const a=studentMap.get(r.ID_origen),b=studentMap.get(r.ID_destino);assert(a&&b);
  assert.equal(`${a.Campus}|${a.Curso}|${a.Grupo}`,`${b.Campus}|${b.Curso}|${b.Grupo}`);
}
for(const s of students){
  assert(s.amistad_reciproca_n<=Math.min(s.amistad_recibida_n,s.amistad_declarada_n));
  assert(s.rechazo_reciproco_n<=Math.min(s.rechazo_recibido_n,s.rechazo_declarado_n));
  for(const k of counts)assert(Number.isInteger(s[k])&&s[k]>=0&&s[k]<28);
  for(const k of scores)assert(s[k]===null||s[k]>=0&&s[k]<=10);
  assert(s.items.every(x=>Number.isInteger(x)&&x>=0&&x<=3));
}
await fs.mkdir(path.join(root,'data'),{recursive:true});
await fs.writeFile(path.join(root,'data','fixtures.json'),JSON.stringify({students:students.map(({items,...s})=>s),keys,groups,profiles}));
await fs.writeFile(path.join(root,'data','profiles.json'),JSON.stringify(profiles,null,2));
await fs.writeFile(path.join(root,'data','schema.json'),JSON.stringify({version:'1.0',centers:centers.map(x=>x[0]),courses:courses.map(x=>x[0]),groups:['A','B','C'],dataColumns:columns,groupColumns,keyColumns:['ID','Nombre'],profileColumns:['usuario','clave','rol','centro','curso','grupo','nombre'],scale:'normalizada_v1'},null,2));
await fs.writeFile(path.join(root,'data','README.md'),'# Datos de evaluación\n\nLos datos de 1.512 estudiantes, incluidos nombres y respuestas, son inventados. Las redes se generan de forma determinista y los indicadores se derivan de esas relaciones. No son baremos poblacionales ni un instrumento diagnóstico validado.\n\nLos perfiles del piloto usan la clave 1234 por petición del proyecto. Una clave incluida en JavaScript solo limita la navegación de la interfaz: no impide inspeccionar los archivos o el código y no debe considerarse una barrera de seguridad para datos reales.\n\nUsuarios: tutor + curso (4p, 5p, 6p, 1eso, 2eso, 3eso, 4eso, 1bach, 2bach) + grupo (a, b, c) + _ + centro (sevilla, cordoba). Ejemplo: tutor4pa_sevilla. orientador_sevilla y orientador_cordoba ven su centro. orientador ve todos los centros. tutor7a y tutor7b conservan el acceso anterior a 1.º ESO A y B de Sevilla.\n\nLos libros de indicadores, nombres y perfiles se entregan por separado. Para uso real deben custodiarse y distribuirse según los permisos de cada centro.\n');
console.log(JSON.stringify({fase:'JSON preparados',alumnos:students.length,grupos:groups.length,relaciones:relations.length,perfiles:profiles.length}));

function letter(n){let s='';for(n++;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s;}
function grid(sheet,matrix,widths){
  const range=sheet.getRangeByIndexes(0,0,matrix.length,matrix[0].length);range.values=matrix;
  range.format.font.name='Arial';range.format.font.size=10;range.format.font.color='#292334';range.format.rowHeight=23;range.format.verticalAlignment='center';
  sheet.showGridLines=false;
  const header=sheet.getRangeByIndexes(0,0,1,matrix[0].length);header.format.fill='#332046';header.format.font.color='#FFFFFF';header.format.font.bold=true;header.format.rowHeight=36;header.format.horizontalAlignment='center';
  header.format.borders={insideVertical:{style:'thin',color:'#FFFFFF'}};
  for(let c=0;c<matrix[0].length;c++)sheet.getRangeByIndexes(0,c,matrix.length,1).format.columnWidth=widths[c]??24;
  sheet.freezePanes.freezeRows(1);sheet.tabColor='#332046';
}
const wb=Workbook.create();
const data=wb.worksheets.add('Datos'),groupSheet=wb.worksheets.add('Grupos'),rel=wb.worksheets.add('Relaciones'),responses=wb.worksheets.add('Respuestas'),dictionary=wb.worksheets.add('Diccionario');
const relCols=['Campus','Curso','Grupo','ID_origen','ID_destino','Tipo','Correspondida','Acierto'];
const responseCols=['ID','bienestar_item1','bienestar_item2','bienestar_item3','bienestar_item4','bullying_autorreporte','respondio','soledad_frecuente','identifica_apoyo','comunidad_amistad'];
const responseRows=students.map(s=>[s.ID,...s.items,s.bullying_autorreporte,s.respondio,s.soledad_frecuente,s.identifica_apoyo,s.comunidad_amistad]);
grid(data,[columns,...students.map(s=>columns.map(c=>s[c]??null))],columns.map(c=>c==='Curso'?24:Math.max(14,c.length+3)));
grid(groupSheet,[groupColumns,...groups.map(g=>groupColumns.map(c=>g[c]??null))],groupColumns.map(c=>c==='Curso'?24:Math.max(16,c.length+3)));
grid(rel,[relCols,...relations.map(r=>relCols.map(c=>r[c]))],[16,24,12,16,16,29,20,15]);
grid(responses,[responseCols,...responseRows],responseCols.map(c=>Math.max(16,c.length+3)));
console.log('Libros: tablas pobladas');
const bounds=new Map();
const groupKey=x=>`${x.Campus}|${x.Curso}|${x.Grupo}`;
for(let i=0;i<relations.length;i++){const key=groupKey(relations[i]);if(!bounds.has(key))bounds.set(key,{first:i+2,last:i+2});else bounds.get(key).last=i+2;}
const rr=(c,s)=>{const b=bounds.get(groupKey(s));return `Relaciones!$${c}$${b.first}:$${c}$${b.last}`;};
const col=name=>letter(columns.indexOf(name)),dc=(name,r)=>`${col(name)}${r}`;
for(let j=0;j<2;j++)rel.getRangeByIndexes(1,6+j,relations.length,1).formulas=relations.map((s,i)=>{
  const r=i+2;
  if(j===0)return[['amistad','rechazo'].includes(s.Tipo)?`=COUNTIFS(${rr('D',s)},E${r},${rr('E',s)},D${r},${rr('F',s)},F${r})`:''];
  return[s.Tipo.startsWith('prediccion_')?`=COUNTIFS(${rr('D',s)},E${r},${rr('E',s)},D${r},${rr('F',s)},"${s.Tipo.replace('prediccion_','')}")`:''];
});
console.log('Libros: reciprocidad y predicciones preparadas');
function formulaColumn(name,make){data.getRangeByIndexes(1,columns.indexOf(name),students.length,1).formulas=students.map((s,i)=>[make(i+2,s)]);}
for(const [name,type,direction] of [['amistad_recibida_n','amistad','E'],['amistad_declarada_n','amistad','D'],['rechazo_recibido_n','rechazo','E'],['rechazo_declarado_n','rechazo','D'],['mediacion_n','mediacion','E'],['bullying_companeros_n','bullying','E'],['pred_amistad_n','prediccion_amistad','D'],['pred_rechazo_n','prediccion_rechazo','D']])formulaColumn(name,(r,s)=>`=COUNTIFS(${rr(direction,s)},A${r},${rr('F',s)},"${type}")`);
for(const [name,type,flag] of [['amistad_reciproca_n','amistad','G'],['rechazo_reciproco_n','rechazo','G'],['pred_amistad_aciertos','prediccion_amistad','H'],['pred_rechazo_aciertos','prediccion_rechazo','H']])formulaColumn(name,(r,s)=>`=SUMIFS(${rr(flag,s)},${rr('D',s)},A${r},${rr('F',s)},"${type}")`);
const last=students.length+1;
formulaColumn('n_clase',r=>`=COUNTIFS($B$2:$B$${last},B${r},$C$2:$C$${last},C${r},$D$2:$D$${last},D${r})`);
// Cada clase es un bloque contiguo en las fuentes. Rangos acotados conservan el enlace por ID
// y evitan millones de dependencias innecesarias durante la recalculación del libro.
const responseRange=(c,r)=>{const first=Math.floor((r-2)/N)*N+2;return `Respuestas!$${c}$${first}:$${c}$${first+N-1}`;};
formulaColumn('bienestar_suma',r=>'=SUM('+['B','C','D','E'].map(c=>`INDEX(${responseRange(c,r)},MATCH(A${r},${responseRange('A',r)},0))`).join(',')+')');
for(const [name,rc] of [['bullying_autorreporte','F'],['respondio','G'],['soledad_frecuente','H'],['identifica_apoyo','I'],['comunidad_amistad','J']])formulaColumn(name,r=>`=INDEX(${responseRange(rc,r)},MATCH(A${r},${responseRange('A',r)},0))`);
const ratios={popularidad:['amistad_recibida_n','n_clase'],sociabilidad:['amistad_declarada_n','n_clase'],rechazo_recibido:['rechazo_recibido_n','n_clase'],rechazo_declarado:['rechazo_declarado_n','n_clase'],mediacion:['mediacion_n','n_clase'],reciprocidad_amistad:['amistad_reciproca_n','amistad_declarada_n'],reciprocidad_rechazo:['rechazo_reciproco_n','rechazo_declarado_n'],acierto_amistad:['pred_amistad_aciertos','pred_amistad_n'],acierto_rechazo:['pred_rechazo_aciertos','pred_rechazo_n']};
for(const [name,[num,den]] of Object.entries(ratios))formulaColumn(name,r=>{const divisor=den==='n_clase'?`(${dc(den,r)}-1)`:dc(den,r);return `=IF(${divisor}=0,"",ROUND(10*${dc(num,r)}/${divisor},1))`;});
formulaColumn('bienestar',r=>`=ROUND(10*${dc('bienestar_suma',r)}/12,1)`);
formulaColumn('centralidad',r=>`=ROUND(10*${dc('centralidad_eigenvector',r)},1)`);
console.log('Libros: indicadores individuales preparados');
for(let i=0;i<groups.length;i++){
  const r=i+2,crit=`Datos!$B$2:$B$${last},A${r},Datos!$C$2:$C$${last},B${r},Datos!$D$2:$D$${last},C${r}`,size=`COUNTIFS(${crit})`;
  for(const [name,source,condition] of [['pos_bullying_declarado','bullying_autorreporte','Sí'],['pos_bullying_companeros','bullying_companeros_n','>0'],['pos_soledad','soledad_frecuente','Sí'],['pos_sin_reciprocas','amistad_reciproca_n','0']]){const c=col(source);groupSheet.getRangeByIndexes(i+1,groupColumns.indexOf(name),1,1).formulas=[[`=ROUND(10*COUNTIFS(${crit},Datos!$${c}$2:$${c}$${last},"${condition}")/${size},1)`]];}
  const c=col('rechazo_declarado_n');groupSheet.getRangeByIndexes(i+1,groupColumns.indexOf('pos_densidad_rechazo'),1,1).formulas=[[`=ROUND(10*SUMIFS(Datos!$${c}$2:$${c}$${last},${crit})/(${size}*(${size}-1)),1)`]];
  for(const [name,source] of [['pos_separacion','modularidad'],['pos_desigualdad','gini_popularidad'],['pos_centralizacion','centralizacion_eigenvector']])groupSheet.getRangeByIndexes(i+1,groupColumns.indexOf(name),1,1).formulas=[[`=ROUND(10*MAX(0,${letter(groupColumns.indexOf(source))}${r}),1)`]];
}
const dictionaryRows=[['Variable','Tipo / regla','Descripción','Origen'],...columns.map(c=>[c,scores.includes(c)?'0–10, un decimal':counts.includes(c)?'Entero':'Ver descripción',descriptions[c],'Modelo determinista v3']),
 ['Grupos.pos_*','Escala 0–10','Señales: 10 × proporción. Estructura: 10 × medida; modularidad negativa se muestra como 0.','Fórmulas'],
 ['Grupos.salones_referencia','Vacío','No existe muestra normativa externa. Las puntuaciones no son percentiles.','Sin referencia externa'],
 ['Grupos.modularidad','Q, resolución 1','Modularidad de la partición plantada sobre amistad no dirigida. Regenerar al cambiar la red.','Modelo determinista v3'],
 ['Grupos.gini_popularidad','0–1','Suma de diferencias absolutas entre grados recibidos dividida por 2 × N × suma de grados.','Relaciones'],
 ['Grupos.centralizacion_eigenvector','0–1','Suma de (1−eigenvector normalizado por máximo) / (N−2), amistad simple no dirigida.','Relaciones'],
 ['Relaciones','Origen, destino, tipo','Una nominación por fila. Sin duplicados ni autonominaciones. Predicción: cada estudiante indica de quién espera recibir una nominación.','Escenarios diseñados'],
 ['Respuestas','Cuatro ítems de 0 a 3','Ítems ilustrativos de bienestar. No reproducen un instrumento clínico validado.','Respuestas inventadas'],
 ['Actualización','Recalcular y regenerar','Excel recalcula recuentos y proporciones. Al cambiar la red, regenerar medidas estructurales. Mantener cada grupo contiguo en Relaciones y Respuestas; reordenar globalmente o añadir filas requiere regenerar rangos.','Generador reproducible'],
 ['Escenarios','54 grupos de 28 estudiantes','Dos centros de enseñanza, nueve cursos y grupos A, B, C. Cuatro familias de red y variación determinista de vínculos y predicciones.','Datos de evaluación inventados'],
 ['Identidades','Libro separado','Los nombres se entregan en llave_evaluacion.xlsx y se enlazan por ID de texto.','Llave separada'],
 ['Interpretación','Sin diagnóstico','Más puntuación indica más cantidad del indicador; no siempre significa una mejor situación.','Convención'],
 ['Perfiles','Libro separado','59 accesos de evaluación en perfiles_evaluacion.xlsx. La clave 1234 es de piloto y no una protección para datos reales.','Configuración de evaluación']];
grid(dictionary,dictionaryRows,[36,30,112,42]);dictionary.getRangeByIndexes(1,1,dictionaryRows.length-1,3).format.wrapText=true;dictionary.getRangeByIndexes(1,0,dictionaryRows.length-1,4).format.rowHeight=48;
data.getRange(`A2:A${last}`).setNumberFormat('@');responses.getRange(`A2:A${last}`).setNumberFormat('@');rel.getRange(`D2:E${relations.length+1}`).setNumberFormat('@');
for(const name of scores)data.getRangeByIndexes(1,columns.indexOf(name),students.length,1).setNumberFormat('0.0');
for(const name of counts)data.getRangeByIndexes(1,columns.indexOf(name),students.length,1).setNumberFormat('0');
for(const name of groupScores)groupSheet.getRangeByIndexes(1,groupColumns.indexOf(name),groups.length,1).setNumberFormat('0.0');
for(const name of ['modularidad','gini_popularidad','centralizacion_eigenvector'])groupSheet.getRangeByIndexes(1,groupColumns.indexOf(name),groups.length,1).setNumberFormat('0.000');
wb.recalculate();
console.log('Libros: recálculo completo');
const calculated=data.getRangeByIndexes(1,0,students.length,columns.length).values;
for(let i=0;i<students.length;i++)for(const name of [...scores,...counts,'pred_amistad_n','pred_amistad_aciertos','pred_rechazo_n','pred_rechazo_aciertos','n_clase']){
  const actual=calculated[i][columns.indexOf(name)],expected=students[i][name];
  if(expected===null)assert(actual===null||actual==='',`${students[i].ID} ${name}: ${actual}`);else assert(Math.abs(Number(actual)-expected)<1e-8,`${students[i].ID} ${name}: ${actual} != ${expected}`);
}
const groupValues=groupSheet.getRangeByIndexes(1,0,groups.length,groupColumns.length).values;
for(let i=0;i<groups.length;i++)for(const name of groupScores)assert(Math.abs(Number(groupValues[i][groupColumns.indexOf(name)])-groups[i][name])<1e-8,`Grupo ${i} ${name}`);
const nomination=relations.findIndex(x=>x.Tipo==='amistad'&&x.ID_destino==='00001');
const edited=rel.getRange(`E${nomination+2}`);edited.values=[['00028']];wb.recalculate();assert.equal(Number(data.getRange(`${col('amistad_recibida_n')}2`).values[0][0]),15);assert.equal(Number(data.getRange('F2').values[0][0]),round(150/27));
edited.values=[['00001']];wb.recalculate();assert.equal(Number(data.getRange('F2').values[0][0]),round(160/27));
console.log((await wb.inspect({kind:'table',range:'Datos!A1:H4',include:'values,formulas',tableMaxRows:4,tableMaxCols:8,maxChars:1800})).ndjson);
console.log((await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#NUM!|#NULL!',options:{useRegex:true,maxResults:10},maxChars:800})).ndjson);
const previewDir=path.join(root,'outputs','revision-datos');
async function preview(book,sheetName,range){const png=await book.render({sheetName,range,scale:1});await fs.writeFile(path.join(previewDir,`${sheetName}-${range.replace(':','-')}.png`),new Uint8Array(await png.arrayBuffer()));}
for(const [sheetName,range] of [['Datos','A1:J6'],['Grupos','A1:H6'],['Relaciones','A1:H7'],['Respuestas','A1:F6'],['Diccionario','A1:C7']])await preview(wb,sheetName,range);
await(await SpreadsheetFile.exportXlsx(wb)).save(path.join(out,'datos_evaluacion.xlsx'));
const keyBook=Workbook.create(),keySheet=keyBook.worksheets.add('Llave');grid(keySheet,[['ID','Nombre'],...keys.map(k=>[k.ID,k.Nombre])],[18,32]);keySheet.getRange(`A2:A${last}`).setNumberFormat('@');keyBook.recalculate();await preview(keyBook,'Llave','A1:B8');await(await SpreadsheetFile.exportXlsx(keyBook)).save(path.join(out,'llave_evaluacion.xlsx'));
const profileBook=Workbook.create(),profileSheet=profileBook.worksheets.add('Perfiles');
const profileRows=profiles.map(p=>[p.username,p.password,p.role,p.center??'Todos',p.course??'Todos',p.group??'Todos',p.label]);
grid(profileSheet,[['usuario','clave','rol','centro','curso','grupo','nombre'],...profileRows],[29,14,18,18,25,12,62]);profileSheet.getRange(`B2:B${profiles.length+1}`).setNumberFormat('@');profileSheet.getRange(`B2:B${profiles.length+1}`).format.fill='#FFF0C3';
profileSheet.getRange('I1').values=[['Accesos del piloto']];profileSheet.getRange('I1').format.font.bold=true;profileSheet.getRange('I1:I6').format.columnWidth=110;profileSheet.getRange('I2:I6').values=[['La clave 1234 es pública dentro de este piloto.'],['Estos perfiles organizan la interfaz. No cifran los datos ni sustituyen controles de acceso reales.'],['Tutoría: su grupo. Orientación de centro: 27 grupos. Orientación general: todos los centros.'],['tutor7a y tutor7b conservan el acceso anterior a 1.º ESO A y B de Sevilla.'],['Para utilizar información real, acordad los accesos y la distribución por centro de enseñanza antes de entregar los datos.']];profileSheet.getRange('I1:I6').format.font.name='Arial';profileSheet.getRange('I1:I6').format.font.size=10;
profileBook.recalculate();await preview(profileBook,'Perfiles','A1:G9');await preview(profileBook,'Perfiles','A55:I60');await(await SpreadsheetFile.exportXlsx(profileBook)).save(path.join(out,'perfiles_evaluacion.xlsx'));
const summary={alumnos:students.length,grupos:groups.length,relaciones:relations.length,perfiles:profiles.length,centros:centers.map(x=>x[0]),cursos:courses.map(x=>x[0]),formulaChecks:'Todos los recuentos, puntuaciones y 54 agregados contrastados con cálculo independiente',recalculation:'Una nominación cambiada, popularidad verificada y original restaurado',files:['datos_evaluacion.xlsx','llave_evaluacion.xlsx','perfiles_evaluacion.xlsx']};
for(const filename of summary.files)await fs.rm(path.join(out,`${filename}.inspect.ndjson`),{force:true});
await fs.writeFile(path.join(previewDir,'verificacion.json'),JSON.stringify(summary,null,2));console.log(JSON.stringify(summary,null,2));
process.exit(0);

