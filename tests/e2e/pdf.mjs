import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {chromium} from 'playwright';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),require=createRequire(import.meta.url);
const P=require('../../src/protected-project.js'),data=require('../protected-fixture.cjs').data(),C=require('../../src/core.js');
const out=path.join(root,'output/pdf'),qa=path.join(root,'tmp/pdfs');await fs.mkdir(out,{recursive:true});await fs.mkdir(qa,{recursive:true});
const aulas=P.classes(data),accounts=[{username:'orientacion',password:'FRJ508'},{username:'12345678Z',password:'Toro05Leon',canExportPdf:true,allowed:[aulas[0].key]},{username:'87654321X',password:'Lince72Delfin',canExportPdf:true,allowed:[aulas[1].key]}];
const sample=path.join(qa,'proyecto-sintetico.pbis');await fs.writeFile(sample,(await P.build({data,center:'Centro 4826',accounts})).text);
const server=http.createServer(async(req,res)=>{try{const f=path.resolve(root,'site','.'+new URL(req.url,'http://local').pathname);if(!f.startsWith(path.join(root,'site')+path.sep))throw Error();res.setHeader('Content-Type',f.endsWith('.json')?'application/json':'text/html');res.end(await fs.readFile(f));}catch{res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,executablePath:process.env.PBIS_BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const page=await browser.newPage({viewport:{width:1360,height:960},acceptDownloads:true}),errors=[],outgoing=[],downloaded=[];
page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{for(const key of ['localStorage','sessionStorage','indexedDB'])Object.defineProperty(window,key,{get(){throw Error('Persistent storage forbidden '+key);}});});
await page.route('**/*',route=>{const url=route.request().url();if(url.startsWith(origin)||url.startsWith('file:'))return route.continue();outgoing.push(url);return route.abort();});
async function open(user,password){await page.locator('#username').fill(user);await page.locator('#password').fill(password);await page.locator('#login-form button[type=submit]').click();await page.locator('#file-data').setInputFiles(sample);await page.locator('#tab-group:not([disabled])').waitFor();}
async function pdf(name){await page.locator('#export-pdf').click();await page.locator('#pdf-dialog').waitFor();if(await page.locator('#pdf-dni').count())await page.locator('#pdf-dni').fill('11223344B');const downloadPromise=page.waitForEvent('download');await page.locator('#pdf-confirm').click();const download=await downloadPromise;assert.match(download.suggestedFilename(),/^PBIS-.*\.pdf$/);await download.saveAs(path.join(name.startsWith('ejemplo')?out:qa,name));downloaded.push(name);await page.locator('#pdf-cancel').click();}
try{
 await page.goto(origin+'/PBIS.html');await open('12345678Z','Toro05Leon');
 assert.equal(await page.locator('#tab-center').count(),0);
 await pdf('docente-aula.pdf');await page.locator('#tab-student').click();await pdf('docente-estudiante.pdf');
 await page.locator('#export-pdf').click();await page.keyboard.press('Escape');assert.equal(await page.locator('#pdf-dialog').count(),0);assert.equal(await page.locator('#export-pdf').evaluate(e=>e===document.activeElement),true);
 // Failure remains visible and can be retried without dropping identity.
 await page.evaluate(()=>{window.pdfOriginal=window.jspdf.jsPDF;window.jspdf.jsPDF=function(){throw Error('Fallo simulado del generador');};});
 await page.locator('#export-pdf').click();await page.locator('#pdf-confirm').click();await page.locator('#pdf-status[role=alert]').filter({hasText:'Puedes reintentarlo'}).waitFor();assert.ok(await page.locator('#pdf-confirm').isEnabled());await page.locator('#pdf-cancel').click();await page.evaluate(()=>{window.jspdf.jsPDF=window.pdfOriginal;delete window.pdfOriginal;});
 for(const width of [390,320]){await page.setViewportSize({width,height:850});await page.locator('#export-pdf').click();assert.ok(await page.locator('#pdf-dialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1));await page.screenshot({path:path.join(qa,'dialog-'+width+'.png')});await page.locator('#pdf-cancel').click();}
 await page.locator('#logout').click();await open('87654321X','Lince72Delfin');await pdf('docente-b.pdf');await page.locator('#logout').click();
 await page.setViewportSize({width:1360,height:960});await open('orientacion','FRJ508');await page.locator('#tab-center').click();await pdf('orientacion-centro.pdf');await page.locator('#logout').click();
 // No Internet and file://: a real browser download from the bundled application.
 await page.goto(pathToFileURL(path.join(root,'release/PBIS.html')).href);await page.context().setOffline(true);await open('12345678Z','Toro05Leon');await pdf('docente-offline.pdf');await page.locator('#logout').click();
 // Deterministic demo export: do not alter the guided practice. Use its own login.
 await page.locator('#username').fill('demo');await page.locator('#password').fill('DEMO26');await page.locator('#login-form button[type=submit]').click();
 // Demo requires explicit loading, same as current app.
 const load=page.locator('#load-demo');if(await load.count())await load.click();
 await page.locator('#tab-group:not([disabled])').waitFor();
 const exit=page.locator('[data-tour-exit]');if(await exit.count())await exit.click();
 await page.locator('#tab-center').click();await pdf('ejemplo-centro.pdf');await page.locator('#tab-group').click();
 await page.locator('#course').selectOption('1.º ESO');await page.locator('#group').selectOption('A');
 await pdf('ejemplo-aula.pdf');
 await page.locator('.expanded-details > summary').first().click();
 const communities=page.locator('[data-class-network-layout-toggle]');if(await communities.isEnabled()){await communities.click();await pdf('aula-comunidades.pdf');}
 await page.locator('#tab-student').click();await page.locator('#student').selectOption('00253');await pdf('ejemplo-estudiante.pdf');
 // Prevent a late PDF after switching/logging out while rasterization is running.
 await page.evaluate(()=>{const original=window.Image;window.testImage=original;window.Image=function(){const img=new original;const descriptor=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');Object.defineProperty(img,'src',{set(value){if(value)document.getElementById('logout').click();descriptor.set.call(img,value);},get(){return descriptor.get.call(img);}});return img;};});
 let lateDownload=false;page.once('download',()=>{lateDownload=true;});
 await page.locator('#export-pdf').click();await page.locator('#pdf-confirm').click();await page.locator('#login-form').waitFor();
 await page.waitForTimeout(400);assert.equal(lateDownload,false);assert.equal(await page.locator('#pdf-dialog').count(),0);
 assert.equal(outgoing.length,0,'No outgoing requests: '+outgoing.join(','));assert.equal(errors.length,0,errors.join('\n'));
 console.log(JSON.stringify({ok:true,downloads:downloaded,networkRequests:outgoing.length,http:true,fileOffline:true,mobile:[390,320]}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
