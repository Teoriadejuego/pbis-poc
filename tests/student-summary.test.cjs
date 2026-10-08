'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

// Exercise the actual renderer without launching the full browser application.
const source=fs.readFileSync(path.join(__dirname,'..','src','app.js'),'utf8');
const start=source.indexOf('function studentReport(r,classRows=[r],visibleRows=classRows){');
const end=source.indexOf('\nfunction studentReportExpanded(r){',start);
assert(start>=0&&end>start,'No se encontró el generador del resumen individual');
const number=value=>Number(value).toLocaleString('es-ES',{maximumFractionDigits:1});
const E=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const classCell=(value,kind,unit='')=>`<span>${value==null?'Sin datos':`${number(value)}${unit}`}</span>`;
const known=(...values)=>values.every(value=>value!==null&&value!==undefined);
const reportHero=(name,subtitle)=>`<header>${E(name)} · ${E(subtitle)}</header>`;
const studentReportExpanded=()=>'<div>Indicadores ampliados</div>';
const studentNetworkSection=()=>'';
const C={studentNetwork:()=>({})};
const studentReport=new Function('number','E','classCell','known','reportHero','studentReportExpanded','studentNetworkSection','C','networkCoverageNote',`${source.slice(start,end)}\nreturn studentReport;`)(number,E,classCell,known,reportHero,studentReportExpanded,studentNetworkSection,C,()=> '');
const expandedEnd=source.indexOf('\nfunction studentNetworkSection(',end);
const expanded=new Function('reading','section','metric','detail',`${source.slice(end+1,expandedEnd)}\nreturn studentReportExpanded;`)(()=>'',(_number,title)=>title,(title)=>`<div class="metric">${title}</div>`,(values,format)=>values.every(value=>value!=null)?format(...values):'Sin datos');
const base={ID:'00001',Curso:'4.º Primaria',Grupo:'A',Nombre:'Ana M.',respondio:'Sí',bullying_autorreporte:'No',bullying_companeros_n:0,amistad_recibida_n:16,amistad_declarada_n:6,amistad_reciproca_n:3,rechazo_recibido_n:0,rechazo_declarado_n:0,popularidad:5.9,centralidad:10,felicidad:7.5,felicidad_centro:3,felicidad_diversion:3,felicidad_soledad:1,mediacion_n:7,mediacion:2.6};

test('the compact summary uses real counts and class means, keeping the bullying sources separate',()=>{
  const selected={...base,bullying_autorreporte:'Sí',bullying_companeros_n:4};
  const peer={...base,ID:'00002',amistad_recibida_n:4,rechazo_recibido_n:2,amistad_reciproca_n:1,amistad_declarada_n:2};
  const html=studentReport(selected,[selected,peer]);
  for(const title of ['Relaciones de amistad','Posición en la red','Bienestar','Mediación','Señales de acoso escolar'])assert.match(html,new RegExp(title));
  assert(html.indexOf('Señales de acoso escolar')<html.indexOf('Bienestar'));
  assert(html.indexOf('Bienestar')<html.indexOf('Relaciones de amistad'));
  assert(html.indexOf('Ver más indicadores')<html.indexOf('Posición en la red'));
  assert.match(html,/¿Cuántas personas le nombran como amistad\?/);
  assert.match(html,/16 estudiantes del grupo le nombran como amistad/);
  assert.match(html,/Media de la clase: 10/);
  assert.match(html,/Media de la clase: 1/);
  assert.match(html,/3 de 6 · 50 %/);
  assert.match(html,/summary-wide summary-alert/);
  assert.match(html,/¿Ha indicado que ha sufrido acoso escolar\?<\/span><strong>Sí/);
  assert.match(html,/¿Cuántas personas indican que ha sufrido acoso\?<\/span><strong>4 estudiantes/);
  assert.match(html,/Indicadores ampliados/);
  assert.match(html,/Ver más indicadores/);
  assert.doesNotMatch(html,/Top 3|enemigos|54,5 %/);
});

test('zero, missing fields and no response do not become invented percentages or zeroes',()=>{
  const html=studentReport({...base,Nombre:null,respondio:'No',bullying_autorreporte:null,bullying_companeros_n:null,amistad_declarada_n:0,amistad_reciproca_n:0,popularidad:null,felicidad:null,felicidad_centro:null});
  assert.match(html,/Estudiante · 00001/);
  assert.match(html,/No aplicable · 0 elecciones/);
  assert.match(html,/No respondió/);
  assert.match(html,/Sin datos/);
  assert.match(html,/summary-wide summary-neutral/);
  assert.doesNotMatch(html,/width:NaN|left:NaN/);
  assert.doesNotMatch(html,/NaN|Infinity|0 de 0 ·/);
});

test('peer nominations without an affirmative personal report have an amber signal',()=>{
  const html=studentReport({...base,bullying_autorreporte:'No',bullying_companeros_n:3});
  assert.match(html,/summary-wide summary-caution/);
  assert.match(html,/¿Cuántas personas indican que ha sufrido acoso\?<\/span><strong>3 estudiantes/);
  assert.doesNotMatch(html,/summary-wide summary-alert/);
});
test('one nomination and one mediator use the singular form',()=>{
  const html=studentReport({...base,amistad_recibida_n:1,rechazo_recibido_n:1,mediacion_n:1,bullying_companeros_n:1});
  assert.match(html,/1 estudiante del grupo le nombra como amistad/);
  assert.match(html,/1 estudiante del grupo le nombra en rechazo/);
  assert.match(html,/Nominaciones de amistad recibidas: 1/);
  assert.match(html,/¿Cuántas personas indican que ha sufrido acoso\?<\/span><strong>1 estudiante/);
  assert.doesNotMatch(html,/1 estudiantes/);
});
test('the Wave 1 impulsivity card shows its total and the mean of complete class results',()=>{
  const selected={...base,crt_aciertos:2};
  const html=studentReport(selected,[selected,{...base,ID:'00002',crt_aciertos:1},{...base,ID:'00003',crt_aciertos:null}]);
  assert.match(html,/Test de impulsividad/);
  assert.match(html,/¿Cuántas de las tres preguntas acertó\?/);
  assert.match(html,/2 <small>\/ 3<\/small>/);
  assert.match(html,/Media de la clase: 1,5 \/ 3 · 2 respuestas válidas/);
  assert.match(html,/no diagnostica impulsividad/);
  assert.doesNotMatch(html,/carrera|Emilia|library|respuesta individual/i);
  assert.doesNotMatch(studentReport(base),/Test de impulsividad/);
  assert.match(studentReport({...base,crt_aciertos:null}),/¿Cuántas de las tres preguntas acertó\?<\/p><strong class="summary-big-value">Sin datos/);
  assert.match(studentReport({...base,crt_aciertos:null}),/Media de la clase: Sin datos/);
});
test('expanded student indicators omit measures already shown in the summary',()=>{
  const html=expanded({...base,escala_indicadores:'normalizada_v1'});
  for(const label of ['Amistades que nombra','Rechazos que nombra','Reciprocidad del rechazo','Acierto de sus predicciones'])assert.match(html,new RegExp(label));
  for(const label of ['Popularidad','Rechazo recibido','Bienestar personal','Centralidad','Reconocimiento en mediación','Señales de acoso escolar'])assert.doesNotMatch(html,new RegExp(label));
});
