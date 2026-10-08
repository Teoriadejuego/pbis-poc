'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib');
const root=path.resolve(__dirname,'..'),site=path.join(root,'site'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('every relative link and resource in the public website resolves to a shipped file',()=>{
 for(const file of fs.readdirSync(site).filter(f=>f.endsWith('.html'))){const html=fs.readFileSync(path.join(site,file),'utf8');
  for(const m of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)){const url=m[1];if(/^(?:#|data:|https?:|mailto:)/.test(url))continue;const destination=path.resolve(site,url.split('#')[0]);assert.ok(destination.startsWith(site+path.sep));assert.ok(fs.existsSync(destination),`${file}: ${url}`);}
 }
});
test('all published download sizes and SHA-256 checksums match the manifest',()=>{
 const manifest=JSON.parse(read('site/downloads/manifest.json'));assert.equal(manifest.files.length,7);
 for(const entry of manifest.files){const bytes=fs.readFileSync(path.join(site,'downloads',entry.name));assert.equal(bytes.length,entry.size);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),entry.sha256);}
});
test('all platform ZIP files contain the identical app and local home without separate Excel files',()=>{
 const expected=fs.readFileSync(path.join(root,'release/PBIS.html'));
 for(const platform of ['Windows','macOS','Linux','Universal']){const zip=fs.readFileSync(path.join(site,'downloads',`PBIS-${platform}.zip`));let offset=0;const entries=new Map();while(zip.readUInt32LE(offset)===0x04034b50){const size=zip.readUInt32LE(offset+18),nameSize=zip.readUInt16LE(offset+26),extraSize=zip.readUInt16LE(offset+28),name=zip.subarray(offset+30,offset+30+nameSize).toString('utf8');const start=offset+30+nameSize+extraSize;entries.set(name,zlib.inflateRawSync(zip.subarray(start,start+size)));offset=start+size;}assert.deepEqual(entries.get('PBIS/PBIS.html'),expected);assert.deepEqual(entries.get('PBIS/index.html'),fs.readFileSync(path.join(root,'release/index.html')));assert.ok(entries.has('PBIS/EMPIEZA-AQUI.txt'));assert.ok(entries.has('PBIS/AUDITORIA.md'));assert.ok(entries.has('PBIS/PROMPTS.md'));assert.ok(entries.has('PBIS/LICENSE-SheetJS.txt'));assert.ok([...entries.keys()].every(name=>!name.endsWith('.xlsx')));}
});
test('runtime has no persistent storage or telemetry and only the explicit feedback connection',()=>{
 const source=read('src/app.js')+read('src/parser-worker.js');assert.doesNotMatch(source,/\b(?:localStorage|sessionStorage|indexedDB|sendBeacon|XMLHttpRequest|WebSocket)\s*[.(]/);assert.match(source,/fetch\(window\.PBIS_BATCH\.endpoint/);assert.ok(read('release/PBIS.html').includes('connect-src '+(process.env.PBIS_BATCH_ENDPOINT || 'https://formspree.io/f/mvkgydrn')));
});
