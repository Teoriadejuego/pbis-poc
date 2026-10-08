'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const C=require('../src/core.js');
test('public demo extends the synthetic example coherently and preserves tutor scopes',()=>{
  const html=read('site/DEMO.html');
  const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
  const config=scripts.find(s=>s.startsWith('window.PBIS_DEMO_URL='));assert.ok(config);
  const context={window:{}};vm.runInNewContext(config,context);
  assert.equal(context.window.PBIS_DEMO_URL,'demo-data.json');
  assert.doesNotMatch(html,/window\.PBIS_DEMO=/);
  const demo=JSON.parse(read('site/demo-data.json'));
  assert.deepEqual(Object.keys(demo),['students','keys','groups']);
  const original=JSON.parse(read('data/fixtures.json'));
  const centers={Sevilla:'Centro 3705','Córdoba':'Centro 3884'};
  const renameCenter=row=>({...row,Campus:centers[row.Campus]});
  assert.deepEqual(demo.keys,original.keys);assert.deepEqual(demo.groups,original.groups.map(renameCenter));
  assert.deepEqual(demo.students.map(({felicidad_centro,felicidad_diversion,felicidad_soledad,crt_aciertos,relaciones_red,...row})=>row),original.students.map(renameCenter));
  assert.deepEqual([...new Set(demo.students.map(row=>row.Campus))].sort(),['Centro 3705','Centro 3884']);
  const incoming=new Map();
  for(const row of demo.students){
    assert.equal(row.felicidad_centro+row.felicidad_diversion+4-row.felicidad_soledad,row.bienestar_suma);
    assert.equal(row.felicidad_soledad>=3,row.soledad_frecuente==='Sí');
    assert.ok(Number.isInteger(row.crt_aciertos)&&row.crt_aciertos>=0&&row.crt_aciertos<=3);
    for(const [kind,field]of [['amistad','amistad_declarada_n'],['rechazo','rechazo_declarado_n']])assert.equal(row.relaciones_red.filter(link=>link.tipo===kind).length,row[field]);
    for(const link of row.relaciones_red){assert.notEqual(link.id,row.ID);assert([1,2].includes(link.intensidad));const key=link.id+':'+link.tipo;incoming.set(key,(incoming.get(key)||0)+1);}
  }
  for(const row of demo.students){assert.equal(incoming.get(row.ID+':amistad')||0,row.amistad_recibida_n);assert.equal(incoming.get(row.ID+':rechazo')||0,row.rechazo_recibido_n);}
  const data=C.validateAndJoin(demo.students,demo.keys,demo.groups);
  assert.equal(data.students.length,1512);assert.equal(data.groups.length,54);
  assert(data.students.every(row=>Number.isInteger(row.mediacion_negativa_n)));
  assert.equal(data.students.find(row=>row.ID==='00253').crt_aciertos,3);
  const anaClass=data.students.filter(row=>row.Centro==='Centro 3705'&&row.Curso==='1.º ESO'&&row.Grupo==='A');
  assert.equal(anaClass.reduce((sum,row)=>sum+row.crt_aciertos,0)/anaClass.length,45/28);
  const firstGroup=data.students.filter(row=>row.Centro==='Centro 3705'&&row.Curso==='4.º Primaria'&&row.Grupo==='A');
  const summary=C.aggregate(firstGroup,data.groups);
  assert(summary.mediators.count>0);
  assert(summary.negativeMediators.count>0);
  const accounts=JSON.parse(read('data/profiles.json'));
  assert.equal(C.scopeRows(data.students,accounts.find(p=>p.username==='tutor1eso')).length,168);
  const policy=html.match(/Content-Security-Policy" content="([^"]+)"/)[1];
  assert.deepEqual([...policy.matchAll(/'sha256-([^']+)'/g)].map(m=>m[1]),scripts.map(s=>crypto.createHash('sha256').update(s).digest('base64')));
  scripts.forEach(s=>assert.doesNotThrow(()=>new vm.Script(s)));
  assert.ok(policy.includes("connect-src 'self' "+(process.env.PBIS_BATCH_ENDPOINT || 'https://formspree.io/f/mvkgydrn')));
});
test('downloadable viewer embeds the same demo without fetching it and web links enter directly',()=>{
  const offline=read('release/PBIS.html');
  assert.doesNotMatch(offline,/window\.PBIS_DEMO_URL=/);
  const config=[...offline.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.startsWith('window.PBIS_DEMO_DATA='));
  const context={window:{}};vm.runInNewContext(config,context);
  assert.deepEqual(JSON.parse(JSON.stringify(context.window.PBIS_DEMO_DATA)),JSON.parse(read('site/demo-data.json')));
  const viewer=read('site/PBIS.html');
  assert.match(viewer,/window\.PBIS_DEMO_URL='demo-data\.json'/);
  assert.match(viewer,/Cargar datos demo/);
  assert.doesNotMatch(viewer,/window\.PBIS_DEMO=/);
  assert.doesNotMatch(read('site/index.html'),/Explorar demo|href="DEMO.html#demo"|DEMO26/);
  assert.match(read('site/index.html'),/href="DEMO.html#guia"/);
  assert.match(read('release/index.html'),/href="PBIS.html#guia"/);
  assert.ok(fs.existsSync(path.join(root,'site/.nojekyll')));
});
