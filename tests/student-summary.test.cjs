'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

// Exercise the actual renderer without launching the full browser application.
const source=fs.readFileSync(path.join(__dirname,'..','src','app.js'),'utf8');
const start=source.indexOf('function studentReport(r){');
const end=source.indexOf('\nfunction studentReportExpanded(r){',start);
assert(start>=0&&end>start,'No se encontró el generador del resumen individual');
const number=value=>Number(value).toLocaleString('es-ES',{maximumFractionDigits:1});
const E=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const classCell=(value,kind,unit='')=>`<span>${value==null?'Sin datos':`${number(value)}${unit}`}</span>`;
const known=(...values)=>values.every(value=>value!==null&&value!==undefined);
const reportHero=(name,subtitle)=>`<header>${E(name)} · ${E(subtitle)}</header>`;
const studentReportExpanded=()=>'<div>Indicadores ampliados</div>';
const studentReport=new Function('number','E','classCell','known','reportHero','studentReportExpanded',`${source.slice(start,end)}\nreturn studentReport;`)(number,E,classCell,known,reportHero,studentReportExpanded);
const base={ID:'00001',Curso:'4.º Primaria',Grupo:'A',Nombre:'Ana M.',respondio:'Sí',bullying_autorreporte:'No',bullying_companeros_n:0,amistad_recibida_n:16,amistad_declarada_n:6,amistad_reciproca_n:3,rechazo_recibido_n:0,rechazo_declarado_n:0,popularidad:5.9,centralidad:10,felicidad:7.5,felicidad_centro:3,felicidad_diversion:3,felicidad_soledad:1,mediacion_n:7,mediacion:2.6};

test('the individual summary uses supplied fields and keeps the two bullying sources separate',()=>{
  const html=studentReport({...base,bullying_autorreporte:'Sí',bullying_companeros_n:4});
  assert.match(html,/3 de 6 · 50 %/);
  for(const title of ['Relaciones de amistad','Posición','Bienestar','Mediación','Señales de acoso escolar'])assert.match(html,new RegExp(title));
  assert.match(html,/Le nombran como amistad<\/span><span>16/);
  assert.match(html,/Sensación de soledad<\/span><span>1 \/ 4/);
  assert.match(html,/summary-wide summary-alert/);
  assert.match(html,/Respuesta personal<\/span><strong[^>]*>Sí/);
  assert.match(html,/Personas que le señalan<\/span><strong[^>]*>4/);
  assert.match(html,/Ver más indicadores/);
  assert.doesNotMatch(html,/Test cognitivo|Top 3|enemigos/);
});

test('zero, missing fields and no response do not become invented percentages or zeroes',()=>{
  const html=studentReport({...base,Nombre:null,respondio:'No',bullying_autorreporte:null,bullying_companeros_n:null,amistad_declarada_n:0,amistad_reciproca_n:0,popularidad:null,felicidad:null,felicidad_centro:null});
  assert.match(html,/Estudiante · 00001/);
  assert.match(html,/No aplicable · 0 elecciones/);
  assert.match(html,/No respondió/);
  assert.match(html,/Sin datos/);
  assert.match(html,/summary-wide summary-neutral/);
  assert.doesNotMatch(html,/NaN|Infinity|0 de 0 ·/);
});

test('peer nominations without an affirmative personal report have an amber signal',()=>{
  const html=studentReport({...base,bullying_autorreporte:'No',bullying_companeros_n:3});
  assert.match(html,/summary-wide summary-caution/);
  assert.match(html,/Personas que le señalan<\/span><strong[^>]*>3/);
  assert.doesNotMatch(html,/summary-wide summary-alert/);
});
