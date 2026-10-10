'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),core=require('../src/core.js'),fixtures=JSON.parse(fs.readFileSync(path.join(root,'data/fixtures.json')));
function table(name,records){const headers=[...new Set(records.flatMap(r=>Object.keys(r)))];return {name,rows:[headers,...records.map(r=>headers.map(h=>r[h]??null))]};}
function app(dataRows=fixtures.students,username='orientacion'){
 const elements=new Map();
 class Element{
  constructor(){this.files=[];this.value='';this.disabled=false;this.classList={add(){},remove(){},toggle(){}};this.html='';}
  set innerHTML(html){this.html=html;for(const [,id]of html.matchAll(/\bid="([^"]+)"/g))elements.set(id,new Element());}
  get innerHTML(){return this.html;}
  insertAdjacentHTML(_position,html){this.html+=html;for(const [,id]of html.matchAll(/\bid="([^"]+)"/g))elements.set(id,new Element());}
  addEventListener(){} setAttribute(){} focus(){} querySelectorAll(){return [];} showModal(){} close(){}
 }
 elements.set('root',new Element());elements.set('help',new Element());elements.set('close-help',new Element());
 const document={getElementById:id=>elements.get(id),querySelector:()=>new Element(),querySelectorAll:()=>[],addEventListener(){},hidden:false};
 const books=[{sheets:[table('Datos',dataRows),table('Grupos',fixtures.groups)]}];
 class Worker{postMessage(){const book=books.shift();queueMicrotask(()=>this.onmessage({data:book}));}terminate(){}}
 const context={document,PbisCore:core,PbisStudentNetwork:require('../src/student-network.js'),PbisRosterReview:require('../src/roster-review.js'),PbisReviewBatch:require('../src/review-batch.js'),PBIS_PROFILES:JSON.parse(fs.readFileSync(path.join(root,'data/profiles.json'))),PbisFeedback:{reset(){},startSession(){},closeContext(){},sessionSnapshot(){return {opinions:[]}},hasPending(){return false}},Worker,Blob,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},setTimeout(){return 1;},clearTimeout(){},setInterval(){},addEventListener(){},console};context.window=context;
 vm.runInNewContext(fs.readFileSync(path.join(root,'src/app.js'),'utf8'),context);
 const el=id=>elements.get(id);
 el('username').value=username;el('password').value=context.PBIS_PROFILES.find(profile=>profile.username===username).password;el('login-form').onsubmit({preventDefault(){}});
 const file=async(kind,name)=>{el('file-'+kind).files=[{name,size:100,arrayBuffer:async()=>new ArrayBuffer(1)}];await el('file-'+kind).onchange();el('sheet-'+kind).value='Datos';};
 return {el,file};
}
test('app loads one .pbis file, uses embedded names and invalidates on replacement',async()=>{
 const f=app();await f.file('data','datos.pbis');assert.equal(f.el('show-reports').disabled,false);
 assert.equal(f.el('file-key'),undefined);assert.equal(f.el('sheet-key'),undefined);
 f.el('show-reports').onclick();f.el('tab-student').onclick();
 assert.match(f.el('report-content').innerHTML,/Estudiante · 00001/);
 f.el('file-data').files=[];await f.el('file-data').onchange();assert.equal(f.el('show-reports').disabled,true);
 assert.doesNotMatch(f.el('report-content').innerHTML,/Ficha individual/);
});
test('embedded given and family names show surname initials throughout the app',async()=>{
 const dataRows=fixtures.students.map(row=>row.ID==='00001'?{...row,Nombre:'María José',Apellidos:'García López'}:row);
 const f=app(dataRows);await f.file('data','datos.pbis');f.el('show-reports').onclick();
 f.el('course').onchange({target:{value:'4.º Primaria'}});
 f.el('group').onchange({target:{value:'A'}});
 f.el('tab-student').onclick();f.el('student').onchange({target:{value:'00001'}});
 assert.match(f.el('report-content').innerHTML,/María José G\. L\./);
 assert.doesNotMatch(f.el('report-content').innerHTML,/García López/);
 assert.match(f.el('filters').innerHTML,/María José G\. L\./);
 f.el('tab-roster').onclick();assert.match(f.el('report-content').innerHTML,/María José G\. L\./);
});
test('partial network coverage note follows every view',async()=>{
 const rows=fixtures.students.map(row=>({...row,red_centro_pendiente_pct:9}));
 const f=app(rows);await f.file('data','datos.pbis');f.el('show-reports').onclick();
 for(const tab of ['center','group','roster','student']){
  f.el('tab-'+tab).onclick();
  assert.match(f.el('report-content').innerHTML,/Falta por completar el 9 % de la red del centro/);
  assert.match(f.el('report-content').innerHTML,/pueden cambiar al completarse/);
 }
});
test('export errors remain visible in every view and disappear when selecting another centre',async()=>{
 const rows=fixtures.students.map((row,index)=>index===0?{...row,incidencias_calculo:['relaciones','predicciones','mediación']}:row);
 const f=app(rows);await f.file('data','datos.pbis');f.el('show-reports').onclick();
 for(const tab of ['center','group','roster','student']){
  f.el('tab-'+tab).onclick();
  assert.match(f.el('report-content').innerHTML,/3 respuestas del centro contienen «Error en relación»/);
  assert.match(f.el('report-content').innerHTML,/no se convierten en ceros/);
 }
 const other=rows.find(row=>(row.Campus||row.Centro)!==(rows[0].Campus||rows[0].Centro));
 f.el('center').onchange({target:{value:other.Campus||other.Centro}});
 assert.doesNotMatch(f.el('report-content').innerHTML,/report-import-warning/);
});
test('a non-convergent centrality is explained without hiding other measures',async()=>{
 const f=app(fixtures.students.map(row=>({...row,centralidad_sin_convergencia:true})));
 await f.file('data','datos.pbis');f.el('show-reports').onclick();
 for(const tab of ['center','group','roster','student']){
  f.el('tab-'+tab).onclick();
  assert.match(f.el('report-content').innerHTML,/La centralidad no se ha estabilizado y queda pendiente/);
  assert.match(f.el('report-content').innerHTML,/Los recuentos y las demás medidas siguen disponibles/);
 }
});
test('orientation sees centre-wide totals while a class tutor has no centre tab',async()=>{
 const f=app();assert.ok(f.el('tab-center'));
 await f.file('data','datos.pbis');f.el('show-reports').onclick();
 assert.equal(f.el('tab-center').disabled,false);f.el('tab-center').onclick();
 assert.match(f.el('report-content').innerHTML,/Ficha de centro/);
 assert.match(f.el('report-content').innerHTML,/Resumen del centro/);
 assert.doesNotMatch(f.el('report-content').innerHTML,/Grupos e integración|Grupos de amistad del centro|Separación entre grupos/);
 assert.match(f.el('report-content').innerHTML,/Mediación y convivencia/);
 assert.match(f.el('filters').innerHTML,/Centro de enseñanza/);
 assert.doesNotMatch(f.el('filters').innerHTML,/>Curso</);
 f.el('tab-group').onclick();
 assert.match(f.el('report-content').innerHTML,/Grupos e integración/);
 const tutor=app(fixtures.students,'tutoria4p');
 assert.equal(tutor.el('tab-center'),undefined);
});
test('orientation can reveal all pilot accounts while tutor sees its course in both centers',async()=>{
 const orientacion=app();
 assert.ok(orientacion.el('open-accounts'));
 orientacion.el('open-accounts').onclick();
 assert.match(orientacion.el('accounts-dialog').innerHTML,/tutoria1eso/);
 assert.doesNotMatch(orientacion.el('accounts-dialog').innerHTML,/FRJ508/);
 orientacion.el('toggle-account-keys').onclick();
 assert.match(orientacion.el('accounts-dialog').innerHTML,/FRJ508/);
 const tutor=app(fixtures.students,'tutoria1eso');
 assert.equal(tutor.el('open-accounts'),undefined);
 await tutor.file('data','datos.pbis');tutor.el('show-reports').onclick();
 assert.match(tutor.el('import-status').textContent,/168 estudiantes/);
 assert.match(tutor.el('filters').innerHTML,/Sevilla/);
 assert.match(tutor.el('filters').innerHTML,/Córdoba/);
 assert.doesNotMatch(tutor.el('filters').innerHTML,/4.º Primaria/);
});
test('.pbis download is byte-identical to the Excel and readable by the actual parser worker',()=>{
 const bytes=fs.readFileSync(path.join(root,'site/downloads/datos_evaluacion.pbis'));
 assert.deepEqual(bytes,fs.readFileSync(path.join(root,'outputs/entrega-20260929/datos_evaluacion.xlsx')));
 let output;const context={self:{postMessage:value=>output=value},console};vm.createContext(context);
 vm.runInContext(fs.readFileSync(path.join(root,'vendor/xlsx.full.min.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/parser-worker.js'),'utf8'),context);
 context.testBytes=Array.from(bytes);vm.runInContext("self.onmessage({data:Uint8Array.from(testBytes).buffer})",context);assert.equal(output.error,undefined);assert.ok(output.sheets.some(s=>s.name==='Datos'&&s.rows.length===1513));
});
