import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {verifyRelease} from '../tools/verify-release.mjs';
test('release checks text checksums, manifests, exact ZIP contents and public file allowlist',()=>{
  assert.equal(verifyRelease().downloads,4);
});
test('release verification rejects checksum corruption and unexpected public files',t=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'pbis-release-'));
  t.after(()=>fs.rmSync(temp,{recursive:true,force:true}));
  for(const folder of ['site','release'])fs.cpSync(new URL('../'+folder,import.meta.url),path.join(temp,folder),{recursive:true});
  fs.copyFileSync(new URL('../package.json',import.meta.url),path.join(temp,'package.json'));
  const sums=path.join(temp,'site/downloads/SHA256SUMS.txt'),original=fs.readFileSync(sums);
  fs.writeFileSync(sums,'invalid');assert.throws(()=>verifyRelease(temp),/SHA256SUMS/);
  fs.writeFileSync(sums,original);fs.writeFileSync(path.join(temp,'site/private.json'),'{}');
  assert.throws(()=>verifyRelease(temp),/público no previsto/);
  fs.unlinkSync(path.join(temp,'site/private.json'));
  fs.copyFileSync(new URL('../data/examples/llave_evaluacion.xlsx',import.meta.url),path.join(temp,'site/downloads/llave_evaluacion.xlsx'));
  assert.throws(()=>verifyRelease(temp),/público no previsto/,'Even a synthetic key must not become a public download again.');
});
test('landing assets and demo data carry fingerprints derived from their bytes',()=>{
  const base=new URL('../site/',import.meta.url),html=fs.readFileSync(new URL('index.html',base),'utf8');
  for(const name of ['site.css','site.js','assets/ficha-grupo-ejemplo.jpg']){
    const digest=createHash('sha256').update(fs.readFileSync(new URL(name,base))).digest('hex').slice(0,12);
    assert.ok(html.includes(name+'?v='+digest));
  }
  const demoHash=createHash('sha256').update(fs.readFileSync(new URL('demo-data.json',base))).digest('hex').slice(0,12);
  assert.ok(fs.readFileSync(new URL('PBIS.html',base),'utf8').includes('demo-data.json?v='+demoHash));
});
