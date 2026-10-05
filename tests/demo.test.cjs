'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const C=require('../src/core.js');
test('public demo embeds exactly the synthetic example and preserves tutor scopes',()=>{
  const html=read('site/DEMO.html');
  const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
  const config=scripts.find(s=>s.startsWith('window.PBIS_DEMO='));assert.ok(config);
  const context={window:{}};vm.runInNewContext(config,context);
  const demo=JSON.parse(JSON.stringify(context.window.PBIS_DEMO));
  assert.deepEqual(Object.keys(demo),['students','keys','groups']);
  const original=JSON.parse(read('data/fixtures.json'));
  assert.deepEqual(demo,{students:original.students,keys:original.keys,groups:original.groups});
  const data=C.validateAndJoin(demo.students,demo.keys,demo.groups);
  assert.equal(data.students.length,1512);assert.equal(data.groups.length,54);
  const accounts=JSON.parse(read('data/profiles.json'));
  assert.equal(C.scopeRows(data.students,accounts.find(p=>p.username==='tutor7a')).length,28);
  const policy=html.match(/Content-Security-Policy" content="([^"]+)"/)[1];
  assert.deepEqual([...policy.matchAll(/'sha256-([^']+)'/g)].map(m=>m[1]),scripts.map(s=>crypto.createHash('sha256').update(s).digest('base64')));
  scripts.forEach(s=>assert.doesNotThrow(()=>new vm.Script(s)));
  assert.ok(policy.includes('connect-src '+(process.env.PBIS_BATCH_ENDPOINT || 'https://formspree.io/f/mvkgydrn')));
});
test('downloadable viewer has no embedded demo records and web entry links to the live demo',()=>{
  assert.doesNotMatch(read('release/PBIS.html'),/window\.PBIS_DEMO=/);
  assert.match(read('site/index.html'),/href="DEMO.html"/);
  assert.ok(fs.existsSync(path.join(root,'site/.nojekyll')));
});
