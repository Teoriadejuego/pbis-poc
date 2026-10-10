/* Independent, wholly fictional Wave 1 sample. Run with the bundled artifact-tool. */
import fs from 'node:fs/promises';
import path from 'node:path';
const location=process.env.PBIS_ARTIFACT_TOOL_URL;
if(!location)throw Error('Define PBIS_ARTIFACT_TOOL_URL con la URL file: del módulo @oai/artifact-tool.');
const {Workbook,SpreadsheetFile}=await import(location);
const root=path.resolve(import.meta.dirname,'..'),dest=path.join(root,'outputs','wave1-local');
await fs.mkdir(dest,{recursive:true});
const headers=['Usuario Id','Alumno Id','Estudio','Curso','Grupo','Sexo','Año','Ruta','start','privacy','edia','dia','idia','eredes1','iredes1','redes1','carrera1','icarrera1','emilia1','iemilia1','library1','ilibrary1','ebeliefs1','ibeliefs1','beliefs1','egeneral','general','igeneral','efun','fun','ifun','ealone','alone','ialone','epopular','ipopular','popular','ecentral','icentral','central','siblings','isiblings','brothers','sisters','ibrothersisters','posicion','iposicion','emes','mes','imes','ebullying','ibullying','emalestar','imalestar','bullying','fqbullying','stopbullying','conductas','emediador','imediador','mediador','ebeliefs2','ibeliefs2','beliefs2','carrera2','icarrera2','emilia2','iemilia2','library2','ilibrary2','eredes2','iredes2','redes2','end'];
const first=['Lucía','Daniel','Carmen','Hugo','Elena','Mateo','Paula','Álvaro','Marta','Sergio','Inés','David','Clara','Nicolás','Irene','Pablo','Noelia','Adrián','Sara','Javier','Julia','Marcos','Aitana','Mario','Leire','Óscar','Eva','Gabriel'];
const family=['García','Ruiz','Martín','López','Sánchez','Pérez','Fernández','González','Romero','Navarro','Torres','Jiménez','Moreno','Muñoz','Vega','Ortega','Delgado','Cano','Ramos','Castro','Gil','Molina','Serrano','Iglesias','Suárez','Rojas','Prieto','Flores'];
let state=41027;const rnd=()=>((state=(state*1664525+1013904223)>>>0)/4294967296),pick=a=>a[Math.floor(rnd()*a.length)];
const tag='2026-10-01 10:00:00 -> ';
const students=[];for(const study of ['9001','9002'])for(const course of ['1.º ESO','2.º ESO'])for(const group of ['A','B'])for(let i=0;i<14;i++){
 const seq=students.length+1,id='DEMO'+String(seq).padStart(5,'0');students.push({id,study,course,group,index:i,first:first[(seq*3)%first.length],surname1:family[(seq*5)%family.length],surname2:family[(seq*11+3)%family.length]});
}
const byStudy=new Map();for(const s of students){if(!byStudy.has(s.study))byStudy.set(s.study,[]);byStudy.get(s.study).push(s);}
function sample(candidates,count){return [...candidates].sort(()=>rnd()-.5).slice(0,count);}
const rows=[];
for(const s of students){
 const center=byStudy.get(s.study),peers=center.filter(x=>x!==s),same=peers.filter(x=>x.course===s.course&&x.group===s.group),friends=sample(same,2+s.index%4),cross=sample(peers.filter(x=>!friends.includes(x)&&!(x.course===s.course&&x.group===s.group)),1+s.index%2),positive=[...friends,...cross],negative=sample(peers.filter(x=>!positive.includes(x)),s.index%4===0?2:1);
 const listed=[...positive.map((x,i)=>x.id+((s.index+i)%3===0?' (Muy buena relación)':' (Buena relación)')),...negative.map((x,i)=>x.id+((s.index+i)%2===0?' (Muy mala relación)':' (Mala relación)'))];
 const predictions=sample(peers.filter(x=>x!==s),3).map(x=>x.id+' (Buena relación)');
 const mediator=center.find(x=>x.course===s.course&&x.group===s.group&&x.index===0);
 const victim=center.find(x=>x.course===s.course&&x.group===s.group&&x.index===11);
 const surprising=center.find(x=>x.course===s.course&&x.group===s.group&&x.index===4);
 const namesSurprising=[0,1,2,3,6,8,10].includes(s.index);
 const selfBull=s.index===11,bull=[...(selfBull?[s.id]:[]),...(s.index%6===0&&victim!==s?[victim.id]:[]),...(namesSurprising?[surprising.id]:[])];
 const levels=['Nunca','Casi nunca','Algunas veces','Casi siempre','Siempre'];
 const row=Object.fromEntries(headers.map(h=>[h,null]));Object.assign(row,{'Usuario Id':s.id,'Alumno Id':'A'+String(rows.length+1).padStart(5,'0'),Estudio:s.study,Curso:s.course,Grupo:s.group,Sexo:s.index%2?'Hombre':'Mujer','Año':'2026',Ruta:'Completa',start:'2026-10-01 10:00:00',end:'2026-10-01 10:15:00',edia:tag,dia:tag+(s.index%2?'Impar':'Par'),egeneral:tag,general:tag+(s.index===4?'Siempre':levels[2+Math.floor(rnd()*3)]),efun:tag,fun:tag+(s.index===4?'Siempre':levels[2+Math.floor(rnd()*3)]),ealone:tag,alone:tag+(s.index===4?'Nunca':levels[Math.floor(rnd()*3)]),ebullying:tag,bullying:bull.length?tag+bull.join(' | '):null,emediador:tag,mediador:tag+mediator.id+' (Buena mediación)'});
 const suffix=s.index%2?'2':'1';row['eredes'+suffix]=tag;row['redes'+suffix]=tag+listed.join(' | ');row['ebeliefs'+suffix]=tag;row['beliefs'+suffix]=tag+predictions.join(' | ');
 const crtCorrect=s.index%4;row['carrera'+suffix]=tag+(crtCorrect>=1?'2':'1');row['emilia'+suffix]=tag+(crtCorrect>=2?'Emilia':'Junio');row['library'+suffix]=tag+(crtCorrect>=3?'47':'24');rows.push(row);
}
function col(n){let s='';for(n++;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s;}
for(const withNames of [false,true]){
 const columns=withNames?[...headers,'Nombre','Apellidos']:headers;
 const matrix=[columns,...rows.map((row,i)=>columns.map(h=>h==='Nombre'?students[i].first:h==='Apellidos'?students[i].surname1+' '+students[i].surname2:row[h]))];
 const book=Workbook.create(),sheet=book.worksheets.add('Users');sheet.getRange(`A1:${col(columns.length-1)}${matrix.length}`).values=matrix;
 sheet.getRange(`A1:${col(columns.length-1)}1`).format={fill:'#263b75',font:{name:'Aptos',size:11,bold:true,color:'#FFFFFF'}};
 sheet.getRange(`A1:${col(columns.length-1)}1`).format.rowHeight=28;sheet.getRange('A:A').format.columnWidth=17;sheet.getRange('B:E').format.columnWidth=17;sheet.freezePanes.freezeRows(1);sheet.tabColor='#263b75';
 const info=book.worksheets.add('Guía');info.getRange('A1:B8').values=[['PBIS · datos de demostración',''],['Origen','Generación independiente; todos los códigos, nombres y respuestas son ficticios.'],['Uso','Carga la hoja Users en PBIS y entra con la cuenta orientacion.'],['Estudios','9001 y 9002; 1.º y 2.º ESO, grupos A y B.'],['Nombres',withNames?'Nombre y dos apellidos en la misma hoja.':'Sin columnas de nombres; se muestran códigos.'],['Ámbito','Las nominaciones pueden apuntar a cualquier estudiante del mismo estudio. Buena/mala y muy buena/muy mala relación indican dos intensidades para el diagrama.'],['Caso para valorar','DEMO00005, Centro 9001, 1.º ESO A: no se autoseñala, siete personas le señalan y su índice de bienestar es 10/10. La discrepancia invita a contrastar; no implica un diagnóstico.'],['CRT','Las tres respuestas ficticias generan totales de 0, 1, 2 o 3 aciertos según la ruta Par/Impar.']];info.getRange('A1:B1').format={fill:'#263b75',font:{name:'Aptos',size:11,bold:true,color:'#FFFFFF'}};info.getRange('A:A').format.columnWidth=21;info.getRange('B:B').format.columnWidth=105;
 book.recalculate();
 if(withNames){const preview=await book.render({sheetName:'Guía',autoCrop:'all',scale:1,format:'png'});await fs.writeFile(path.join(dest,'PBIS_Wave1_demo_guia.png'),new Uint8Array(await preview.arrayBuffer()));}
 const file=await SpreadsheetFile.exportXlsx(book);await file.save(path.join(dest,withNames?'PBIS_Wave1_demo_con_nombres.xlsx':'PBIS_Wave1_demo_sin_nombres.xlsx'));
 console.log(withNames?'demo_with_names':'demo_without_names',matrix.length-1,columns.length);
}
