'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),core=require('../src/core.js'),fixtures=JSON.parse(fs.readFileSync(path.join(root,'data/fixtures.json')));
function table(name,records){const headers=[...new Set(records.flatMap(r=>Object.keys(r)))];return {name,rows:[headers,...records.map(r=>headers.map(h=>r[h]??null))]};}
function app(){
 const elements=new Map();
 class Element{
  constructor(){this.files=[];this.value='';this.disabled=false;this.classList={add(){}};this.html='';}
  set innerHTML(html){this.html=html;for(const [,id]of html.matchAll(/\bid="([^"]+)"/g))elements.set(id,new Element());}
  get innerHTML(){return this.html;}
  addEventListener(){} setAttribute(){} focus(){} querySelectorAll(){return [];} showModal(){} close(){}
 }
 elements.set('root',new Element());elements.set('help',new Element());elements.set('close-help',new Element());
 const document={getElementById:id=>elements.get(id),querySelector:()=>new Element(),addEventListener(){},hidden:false};
 const books=[{sheets:[table('Datos',fixtures.students),table('Grupos',fixtures.groups)]},{sheets:[table('Llave',fixtures.keys)]}];
 class Worker{postMessage(){const book=books.shift();queueMicrotask(()=>this.onmessage({data:book}));}terminate(){}}
 const context={document,PbisCore:core,PBIS_PROFILES:JSON.parse(fs.readFileSync(path.join(root,'data/profiles.json'))),PbisFeedback:{reset(){},startSession(){},closeContext(){}},Worker,Blob,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},setTimeout(){return 1;},clearTimeout(){},setInterval(){},addEventListener(){},console};context.window=context;
 vm.runInNewContext(fs.readFileSync(path.join(root,'src/app.js'),'utf8'),context);
 const el=id=>elements.get(id);
 el('username').value='orientador';el('password').value='1234';el('login-form').onsubmit({preventDefault(){}});
 const file=async(kind,name)=>{el('file-'+kind).files=[{name,size:100,arrayBuffer:async()=>new ArrayBuffer(1)}];await el('file-'+kind).onchange();el('sheet-'+kind).value=kind==='data'?'Datos':'Llave';};
 return {el,file};
}
test('app loads a .pbis without names, adds the names key, removes it and clears names before file replacement',async()=>{
 const f=app();await f.file('data','datos.pbis');assert.equal(f.el('show-reports').disabled,false);
 f.el('show-reports').onclick();assert.equal(f.el('tab-student').disabled,false);f.el('tab-student').onclick();
 assert.match(f.el('report-content').innerHTML,/Estudiante · 00001/);assert.doesNotMatch(f.el('report-content').innerHTML,/Ana M\./);
 await f.file('key','llave.xlsx');assert.doesNotMatch(f.el('report-content').innerHTML,/Ficha individual/);
 f.el('show-reports').onclick();assert.match(f.el('report-content').innerHTML,/Ana M\./);
 f.el('file-key').files=[];f.el('remove-key').onclick();assert.match(f.el('report-content').innerHTML,/Estudiante · 00001/);assert.doesNotMatch(f.el('report-content').innerHTML,/Ana M\./);
 f.el('file-data').files=[];await f.el('file-data').onchange();assert.equal(f.el('show-reports').disabled,true);assert.doesNotMatch(f.el('report-content').innerHTML,/Ficha individual/);
});
test('.pbis download is byte-identical to the Excel and readable by the actual parser worker',()=>{
 const bytes=fs.readFileSync(path.join(root,'site/downloads/datos_evaluacion.pbis'));
 assert.deepEqual(bytes,fs.readFileSync(path.join(root,'outputs/entrega-20260929/datos_evaluacion.xlsx')));
 let output;const context={self:{postMessage:value=>output=value},console};vm.createContext(context);
 vm.runInContext(fs.readFileSync(path.join(root,'vendor/xlsx.full.min.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/parser-worker.js'),'utf8'),context);
 context.testBytes=Array.from(bytes);vm.runInContext("self.onmessage({data:Uint8Array.from(testBytes).buffer})",context);assert.equal(output.error,undefined);assert.ok(output.sheets.some(s=>s.name==='Datos'&&s.rows.length===1513));
});
