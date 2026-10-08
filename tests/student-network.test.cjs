'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),N=require('../src/student-network.js');
const student=(id,extra={})=>({ID:id,Campus:'Centro demo',Curso:'1.º ESO',Grupo:'A',Nombre:null,...extra});
const sample=()=>({selected:student('U1',{Nombre:'Ana García López'}),neighbors:[student('U2',{Nombre:'Leo Ruiz Martín'}),student('U3',{Grupo:'B'})],edges:[{from:'U1',to:'U2',tipo:'amistad',intensidad:2},{from:'U2',to:'U1',tipo:'rechazo',intensidad:1},{from:'U3',to:'U1',tipo:'amistad',intensidad:1}],available:true,outgoingKnown:true,respondents:3,visibleCount:3});
test('ISAT-style cards show abbreviated names or codes, class and independent directed intensities',()=>{
 const network=sample(),before=JSON.stringify(network),html=N.view(network),paths=N.geometry(network).paths;
 assert.match(html,/Ana G\. L\./);assert.match(html,/Leo R\. M\./);assert.match(html,/1\.º ESO · B/);
 assert.match(html,/2 personas vinculadas · 1 nominación declarada · 2 recibidas · 1 de otras clases/);
 assert.equal((html.match(/data-network-student=/g)||[]).length,2);assert.equal((html.match(/marker-end=/g)||[]).length,3);
 assert.match(html,/class="network-peer network-other-class"/);
 assert.notEqual(paths[0].path,paths[1].path);assert.ok(paths[0].width>paths[1].width);
 assert.match(html,/Ana G\. L\. → Leo R\. M\.: Muy buena relación/);assert.match(html,/Leo R\. M\. → Ana G\. L\.: mala relación/);
 assert.match(html,/aria-labelledby="network-svg-title network-svg-description"/);
 assert.doesNotMatch(html,/García López|<table|student-network-list|data-network-filter/);assert.equal(JSON.stringify(network),before);
});
test('missing responses, unavailable links and genuine zero links remain distinct',()=>{
 const base={selected:student('U1'),neighbors:[],edges:[],respondents:0,visibleCount:2,outgoingKnown:false};
 assert.match(N.view({...base,available:false}),/solo contiene recuentos o no tiene respuestas/);assert.doesNotMatch(N.view({...base,available:false}),/<svg|data-network-zoom/);
 const empty=N.view({...base,available:true});assert.match(empty,/No se han observado nominaciones/);assert.match(empty,/no significa que no tenga amistades/);
 const received=sample();received.outgoingKnown=false;received.edges=received.edges.filter(e=>e.to==='U1');
 const html=N.view(received);assert.match(html,/0 nominaciones declaradas · 2 recibidas/);assert.match(html,/respuesta propia interpretable/);
});
test('peer geometry keeps small and dense networks inside the drawing without overlapping cards',()=>{
 for(const count of [1,2,12,50,95,300]){
  const network={...sample(),neighbors:Array.from({length:count},(_,i)=>student('P'+i)),edges:[]},g=N.geometry(network);
  for(let i=0;i<g.peers.length;i++){
   const a=g.peers[i];assert.ok(a.x-71>=0&&a.x+71<=g.width&&a.y-34>=0&&a.y+34<=g.height);
   for(let j=i+1;j<g.peers.length;j++){const b=g.peers[j];assert.ok(Math.abs(a.x-b.x)>=142||Math.abs(a.y-b.y)>=68,`Cards ${i}, ${j}, size ${count}`);}
  }
  assert.doesNotMatch(N.svg(network),/NaN|Infinity|undefined/);
 }
});
test('workbook labels and IDs are escaped in SVG text, titles and navigation attributes',()=>{
 const s=student('A'),p=student('B" onclick="alert(1)',{Curso:'<script>alert(1)</script>'});
 const html=N.view({selected:s,neighbors:[p],edges:[{from:s.ID,to:p.ID,tipo:'amistad',intensidad:1}],available:true,outgoingKnown:true,respondents:2,visibleCount:2});
 assert.match(html,/&lt;script&gt;/);assert.match(html,/data-network-student="B&quot; onclick=&quot;alert\(1\)"/);assert.doesNotMatch(html,/<script|\sonclick="/);
});
function panelFixture(width=320,natural=7050){
 const attributes={viewBox:`0 0 ${natural} 1000`};
 const drawing={getAttribute:key=>attributes[key]??null,setAttribute:(key,value)=>{attributes[key]=value}};
 const classes=new Set(),stage={clientWidth:width,clientHeight:240,scrollLeft:0,scrollTop:0,dataset:{networkScale:'1'},querySelector:()=>drawing,classList:{toggle:(name,on)=>on?classes.add(name):classes.delete(name)}};
 const controls={out:{disabled:true},in:{disabled:false},label:{textContent:'Ajustado'}};
 const panel={querySelector:selector=>selector==='.student-network-scroll'?stage:selector.includes('"out"')?controls.out:selector.includes('"in"')?controls.in:controls.label};
 return {panel,stage,controls,attributes,classes};
}
test('zoom can make dense mobile labels readable and fit restores the whole diagram',()=>{
 const f=panelFixture();N.zoom(f.panel,'in');assert.equal(f.stage.dataset.networkScale,'1.5');assert.equal(f.attributes.width,'480');assert.equal(f.controls.out.disabled,false);
 for(let i=0;i<20;i++)N.zoom(f.panel,'in');assert.equal(f.controls.in.disabled,true);assert.ok(Number(f.attributes.width)>=7050);
 N.zoom(f.panel,'out');assert.equal(f.controls.in.disabled,false);
 N.zoom(f.panel,'fit');assert.equal(f.stage.dataset.networkScale,'1');assert.equal(f.attributes.width,'320');assert.equal(f.stage.scrollLeft,0);assert.equal(f.stage.scrollTop,0);assert.equal(f.controls.label.textContent,'Ajustado');assert.equal(f.controls.out.disabled,true);assert.equal(f.classes.has('is-zoomed'),false);
});
test('the diagram uses only scoped relationships and never adds a forbidden course or centre',()=>{
 const one=student('U1',{relaciones_red:[{id:'U2',tipo:'amistad',intensidad:2},{id:'U3',tipo:'rechazo',intensidad:1}]}),two=student('U2',{Grupo:'B',relaciones_red:[]}),three=student('U3',{Curso:'2.º ESO',relaciones_red:[]}),foreign=student('U4',{Campus:'Other',relaciones_red:[{id:'U1',tipo:'amistad',intensidad:1}]});
 const visible=C.scopeRows([one,two,three,foreign],{role:'tutor',course:'1.º ESO'}),html=N.view(C.studentNetwork(visible,'U1'));
 assert.match(html,/data-network-student="U2"/);assert.doesNotMatch(html,/data-network-student="U3"|data-network-student="U4"|Other/);
});
