'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const profiles=JSON.parse(read('data/profiles.json')),demo=JSON.parse(read('site/demo-data.json'));
function fixture({failSend=false,data=demo}={}){
 const elements=new Map(),fetches=[],navigations=[];let opinions=[],demoMode=false,resets=0;
 class Element{
  constructor(id=''){this.id=id;this.value='';this.disabled=false;this.isConnected=true;this.dataset={};this.classList={add(){},remove(){},toggle(){}};this.listeners={};this.children=[];this.html='';}
  set innerHTML(value){if(this.id==='root')for(const id of [...elements.keys()])if(!['root','help','close-help'].includes(id))elements.delete(id);this.html=value;for(const [,id]of value.matchAll(/\bid="([^"]+)"/g))elements.set(id,new Element(id));if(value.includes('brand-home'))elements.set('brand',new Element('brand'));if(this.id.startsWith('sheet-'))this.value=value.match(/<option value="([^"]*)"/)?.[1]||'';}
  get innerHTML(){return this.html;}
  insertAdjacentHTML(_,value){this.html+=value;for(const [,id]of value.matchAll(/\bid="([^"]+)"/g))elements.set(id,new Element(id));}
  addEventListener(event,fn){const previous=this.listeners[event];this.listeners[event]=e=>{previous?.(e);fn(e);};}setAttribute(){}focus(){}showModal(){}close(){}scrollIntoView(){}
  querySelectorAll(){return [];}querySelector(selector){return elements.get(selector.slice(1))||new Element();}
  append(child){this.children.push(child);if(child.id)elements.set(child.id,child);}after(child){this.append(child);}
  replaceChildren(){this.children=[];}remove(){elements.delete(this.id);}
 }
 for(const id of ['root','help','close-help'])elements.set(id,new Element(id));
 const body=new Element('body'),document={body,getElementById:id=>elements.get(id),querySelector:selector=>selector==='.brand-home'?elements.get('brand'):body,querySelectorAll:selector=>selector==='.brand-home'?[elements.get('brand')].filter(Boolean):[],createElement:()=>new Element(),addEventListener(){}};
 const table=(name,rows)=>{const headers=[...new Set(rows.flatMap(row=>Object.keys(row)))];return {name,rows:[headers,...rows.map(row=>headers.map(h=>row[h]??null))]};};
 class Worker{postMessage(){queueMicrotask(()=>this.onmessage({data:{sheets:[table('Datos',data.students),table('Grupos',data.groups)]}}));}terminate(){}}
 const context={document,Worker,Blob,AbortController,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},console,setTimeout(){return 1},clearTimeout(){},setInterval(){},addEventListener(){},location:{hash:'',assign:url=>navigations.push(url)},PBIS_HOME:'index.html',PBIS_PROFILES:profiles,PBIS_DEMO_DATA:demo,PBIS_BATCH:{endpoint:'https://test.invalid/form'},PbisCore:require('../src/core.js'),PbisStudentNetwork:require('../src/student-network.js'),PbisRosterReview:require('../src/roster-review.js'),PbisFeedbackModel:{classCode:async()=> 'AULA-test',newId:()=> 'id-test'},PbisReviewBatch:{studentCode:async(c,id)=>'coded-'+id,create:value=>({...value,message:'batch-test'})},PbisFeedback:{reset(){resets++;opinions=[];demoMode=false},startSession(_role,{demo=false}={}){demoMode=demo},closeContext(){},sessionSnapshot:()=>({sessionCode:'session-test',opinions}),hasPending:()=>false},fetch:async(url,options)=>{fetches.push({url,options});return {ok:!failSend,status:failSend?500:200,json:async()=>({ok:!failSend})}}};
 context.window=context;vm.runInNewContext(read('src/app.js'),context);
 const el=id=>elements.get(id);
 const login=(username,password=profiles.find(p=>p.username===username).password)=>{el('username').value=username;el('password').value=password;el('login-form').onsubmit({preventDefault(){}});};
 const upload=async()=>{el('file-data').files=[{name:'datos.pbis',size:100,arrayBuffer:async()=>new ArrayBuffer(1)}];await el('file-data').onchange();el('sheet-data').value='Datos';el('show-reports').onclick();};
 const addOpinion=()=>{opinions.push({classCode:'AULA-test',studentCode:null,sheet:'group',rating:4,comment:'Prueba sin envío real'});context.PBIS_UPDATE_CLOSE?.();};
 return {el,login,upload,addOpinion,fetches,navigations,demoMode:()=>demoMode,resets:()=>resets};
}
test('every account signs in, loads its exact course scope and signs out without data leaking into the next session',async()=>{
 const f=fixture();
 f.login('orientador','1234');assert.match(f.el('login-error').textContent,/Cuenta o clave/);assert.equal(f.el('file-data'),undefined);
 for(const p of profiles){
  f.login(p.username);assert.equal(!!f.el('open-accounts'),p.role==='orientador');assert.equal(f.el('load-demo'),undefined);
  await f.upload();assert.match(f.el('import-status').textContent,new RegExp(`${p.role==='orientador'?1512:168} estudiantes`));
  assert.match(f.el('filters').innerHTML,/Centro 3705/);assert.match(f.el('filters').innerHTML,/Centro 3884/);
  if(p.role==='tutor')for(const other of profiles.filter(x=>x.role==='tutor'&&x.course!==p.course))assert.ok(!f.el('filters').innerHTML.includes(`>${other.course}</option>`));
  await f.el('logout').onclick();assert.ok(f.el('login-form'));assert.equal(f.el('report-content'),undefined);
 }
 assert.equal(f.fetches.length,0);
});
test('demo is independent of accounts, cannot import a file, and closing brand never sends practice feedback',async()=>{
 const f=fixture();f.login('demo','DEMO26');await f.el('load-demo').onclick();assert.equal(f.demoMode(),true);
 assert.equal(f.el('open-accounts'),undefined);assert.equal(f.el('change-files'),undefined);
 assert.ok(f.el('tab-center'));assert.match(f.el('report-content').innerHTML,/Resumen de la clase/);
 f.el('file-data').files=[{name:'not-allowed.pbis',size:100,arrayBuffer:()=>{throw Error('Demo must never read uploaded files')}}];await f.el('file-data').onchange();
 f.addOpinion();assert.equal(f.el('logout').textContent,'Cerrar sesión');await f.el('brand').onclick();
 assert.deepEqual(f.navigations,['index.html']);assert.equal(f.fetches.length,0);assert.equal(f.demoMode(),false);assert.ok(f.el('login-form'));
 f.login('tutor1eso');assert.match(f.el('root').innerHTML,/Selecciona el archivo/);
});
test('demo credentials start guided loading with no automatic imported records before the load action',async()=>{
 const f=fixture();await f.login('demo','DEMO26');assert.equal(f.demoMode(),true);assert.ok(f.el('load-demo'));
 assert.match(f.el('root').innerHTML,/Cargar datos demo/);assert.doesNotMatch(f.el('report-content').innerHTML,/Resumen de la clase/);
 await f.el('load-demo').onclick();assert.match(f.el('report-content').innerHTML,/Resumen de la clase/);assert.equal(f.fetches.length,0);
});
test('demo credentials appear only after starting the simulation and the last exercise requires logout',async()=>{
 const f=fixture();assert.equal(f.el('enter-demo-login'),undefined);
 assert.doesNotMatch(f.el('root').innerHTML,/DEMO26|También puedes entrar/);
 f.el('start-tour-login').onclick();assert.match(f.el('tour-panel').innerHTML,/DEMO26/);
 f.login('demo','DEMO26');await f.el('load-demo').onclick();
 assert.match(f.el('tour-panel').innerHTML,/Centro 3705 → 1.º ESO → A/);
 f.el('tour-skip').onclick();
 assert.match(f.el('tour-panel').innerHTML,/Valora un dato de la lista/);
 const reaction={dataset:{studentId:'00280',indicator:'bullying_peers',rosterReaction:'sorpresa'},closest:()=>({querySelector:selector=>selector==='[data-roster-open]'?{setAttribute(){},focus(){}}:selector==='.reaction-group'?{querySelectorAll:()=>[],hidden:false}:{textContent:'',hidden:true}})};
 f.el('report-content').listeners.click({target:{closest:selector=>selector==='button[data-roster-reaction]'?reaction:null}});
 const slider={value:'4',dataset:{studentId:'00253'},closest:()=>({querySelector:()=>({textContent:'',hidden:false})}),setAttribute(){}};
 f.el('report-content').listeners.input({target:{closest:selector=>selector==='input[data-roster-confidence]'?slider:null}});
 assert.match(f.el('tour-panel').innerHTML,/Tus comentarios se envían al cerrar/);
 assert.match(f.el('tour-panel').innerHTML,/envía al equipo PBIS tus comentarios y valoraciones/);
 assert.doesNotMatch(f.el('tour-panel').innerHTML,/Práctica completada|Terminar práctica/);
 await f.el('logout').onclick();assert.match(f.el('root').innerHTML,/Práctica completada/);
 assert.equal(f.el('report-content'),undefined);assert.equal(f.fetches.length,0);
});
test('brand waits for a confirmed batch before clearing the session and navigating home',async()=>{
 const f=fixture();f.login('tutor1eso');await f.upload();f.addOpinion();await f.el('brand').onclick();
 assert.equal(f.fetches.length,1);assert.equal(f.fetches[0].options.method,'POST');
 assert.deepEqual(f.navigations,['index.html']);assert.ok(f.el('login-form'));assert.equal(f.el('report-content'),undefined);
});
test('network cards open the related class and preserve course restrictions and feedback state',async()=>{
 const C=require('../src/core.js'),make=(id,course,group,links)=>{
  const row={...demo.students[0],ID:id,Campus:'Centro 3705',Centro:'Centro 3705',Curso:course,Grupo:group,Nombre:null,n_clase:1,n_centro:3,ambito_nominaciones:'centro',escala_indicadores:'comparativa',relaciones_red:links,centralidad_eigenvector:null,mediacion_negativa_n:null};
  for(const key of [...C.SCORE_COLUMNS,...C.COUNT_COLUMNS,...Object.keys(row).filter(k=>k.startsWith('pred_'))])row[key]=null;
  row.amistad_declarada_n=links.filter(x=>x.tipo==='amistad').length;row.rechazo_declarado_n=links.filter(x=>x.tipo==='rechazo').length;
  return row;
 };
 const data={students:[make('X1','1.º ESO','A',[{id:'X2',tipo:'amistad',intensidad:2}]),make('X2','2.º ESO','B',[{id:'X1',tipo:'rechazo',intensidad:1}]),make('X3','3.º ESO','C',[])],groups:[]};
 const click=(f,id)=>f.el('report-content').listeners.click({preventDefault(){},target:{closest:selector=>selector==='a[data-network-student]'?{dataset:{networkStudent:id}}:null}});
 const f=fixture({data});f.login('orientador');await f.upload();assert.equal(f.el('import-error').textContent,'');f.el('tab-student').onclick();f.addOpinion();
 click(f,'X3');assert.match(f.el('filters').innerHTML,/value="X1" selected/);
 click(f,'X2');assert.match(f.el('filters').innerHTML,/value="2.º ESO" selected/);assert.match(f.el('filters').innerHTML,/value="B" selected/);assert.match(f.el('filters').innerHTML,/value="X2" selected/);assert.equal(f.fetches.length,0);
 await f.el('logout').onclick();assert.equal(f.fetches.length,1,'Opening a peer must preserve the opinion until logout');
 const tutor=fixture({data});tutor.login('tutor1eso');await tutor.upload();tutor.el('tab-student').onclick();
 assert.doesNotMatch(tutor.el('report-content').innerHTML,/data-network-student="X2"/);
 click(tutor,'X2');assert.match(tutor.el('filters').innerHTML,/value="X1" selected/);assert.equal(tutor.fetches.length,0);
});
test('a failed close retains data, retries to the original home destination and offers explicit discard',async()=>{
 const f=fixture({failSend:true});f.login('tutor1eso');await f.upload();f.addOpinion();await f.el('brand').onclick();
 assert.deepEqual(f.navigations,[]);assert.ok(f.el('report-content'));assert.match(f.el('logout').textContent,/Reintentar/);
 await f.el('logout').onclick();assert.equal(f.fetches.length,2);assert.deepEqual(f.navigations,[]);
 const discard=f.el('close-status').children.find(child=>child.textContent==='Cerrar sin enviar');assert.ok(discard);discard.onclick();
 assert.deepEqual(f.navigations,['index.html']);assert.equal(f.el('report-content'),undefined);
});
