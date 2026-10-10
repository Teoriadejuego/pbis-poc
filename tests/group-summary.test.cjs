'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const source=fs.readFileSync(path.join(__dirname,'..','src','app.js'),'utf8');
const start=source.indexOf('function groupReportBrief(rows,meta){');
const end=source.indexOf('\nfunction cellTone(value,kind){',start);
assert(start>=0&&end>start,'No se encontró el resumen de la ficha de clase');
const aggregate={n:14,responses:14,period:null,communities:[{name:'Red 1',count:10},{name:'Red 2',count:4}],attention:[
  {id:'bullying_declarado',count:1,denominator:14,percent:100/14},
  {id:'bullying_companeros',count:2,denominator:14,percent:200/14},
  {id:'soledad',count:0,denominator:14,percent:0},
  {id:'sin_reciprocas',count:4,denominator:14,percent:400/14}
]};
const full='<article class="report"><header>Ficha completa</header><div class="report-body"><p>Desglose completo: densidad de rechazo y mediación</p></div></article>';
const groupReportBrief=new Function('C','groupReport','reportHero','selection','number','percent','E','networkCoverageNote',`${source.slice(start,end)}\nreturn groupReportBrief;`)(
  {aggregate:()=>aggregate},()=>full,()=>'<header>Ficha de clase</header>',{course:'1.º ESO',group:'A'},
  value=>Number(value).toLocaleString('es-ES'),value=>`${Number(value).toLocaleString('es-ES',{maximumFractionDigits:1})} %`,value=>String(value),()=>''
);

test('class card prioritizes questions on bullying, wellbeing and friendship; full detail stays behind expansion',()=>{
  const html=groupReportBrief([{}],null);
  assert(html.indexOf('Señales de acoso escolar')<html.indexOf('Bienestar'));
  assert(html.indexOf('Bienestar')<html.indexOf('Relaciones de amistad'));
  assert.match(html,/¿Cuántos estudiantes indican que han sufrido acoso\?/);
  assert.match(html,/1 de 14/);
  assert.match(html,/2 de 14/);
  assert.match(html,/al menos 2 nominaciones de sus pares/);
  assert.match(html,/0 de 14/);
  assert(html.indexOf('Ver más indicadores')<html.indexOf('Desglose completo'));
  assert.match(html,/densidad de rechazo y mediación/);
});

test('unavailable class measures stay unknown',()=>{
  const saved=aggregate.attention;
  aggregate.attention=saved.map(item=>({...item,count:null,percent:null}));
  try{
    const html=groupReportBrief([{}],null);
    assert.match(html,/Sin datos/);
    assert.doesNotMatch(html,/0 de 14/);
  }finally{aggregate.attention=saved;}
});
