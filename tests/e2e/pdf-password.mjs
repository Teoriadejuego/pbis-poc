import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {chromium} from 'playwright';
const require=createRequire(import.meta.url),P=require('../../src/protected-project.js');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),out=path.join(root,'test-results/pdf-password');
await fs.mkdir(out,{recursive:true});
const data=require('../protected-fixture.cjs').data(),allowed=[P.classes(data)[0].key];
const sample=path.join(out,'solo-prueba.pbis');
await fs.writeFile(sample,(await P.build({data,center:'Centro 4826',accounts:[{username:'orientacion',password:'FRJ508'},{username:'12345678Z',password:'Toro05Leon',allowed,canExportPdf:true}]})).text);
const browser=await chromium.launch({headless:true,executablePath:process.env.PBIS_BROWSER_PATH||(process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':undefined)});
const page=await browser.newPage({viewport:{width:1180,height:960},acceptDownloads:true}),errors=[],external=[];
let downloads=0;page.on('download',()=>downloads++);page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(15000);
await page.addInitScript(()=>{for(const key of ['localStorage','sessionStorage','indexedDB'])Object.defineProperty(window,key,{get(){throw Error('Persistent storage forbidden');}});});
await page.route('**/*',route=>{if(route.request().url().startsWith('file:'))return route.continue();external.push(route.request().url());return route.abort();});
async function login(user,password,file=sample){await page.locator('#username').fill(user);await page.locator('#password').fill(password);await page.locator('#login-form button[type=submit]').click();await page.locator('#file-data').setInputFiles(file);if(file.endsWith('.xlsx')){await page.locator('#show-reports:enabled').waitFor();await page.locator('#show-reports').click();}await page.locator('#tab-group:not([disabled])').waitFor();}
async function download(name){const wait=page.waitForEvent('download');await page.locator('#pdf-confirm').click();const d=await wait;await d.saveAs(path.join(out,name));await page.locator('#pdf-cancel').click();}
try{
 await page.goto(pathToFileURL(path.join(root,'release/PBIS.html')).href);await page.context().setOffline(true);
 await login('orientacion','FRJ508');await page.locator('#tab-center').click();await page.locator('#export-pdf').click();
 await page.locator('#pdf-confirm').click();assert.match(await page.locator('#pdf-status').textContent(),/DNI completo/);assert.equal(downloads,0);
 await page.locator('#pdf-dni').fill('12345678A');await page.locator('#pdf-confirm').click();assert.match(await page.locator('#pdf-status').textContent(),/DNI completo/);assert.equal(downloads,0);
 // Crypto failure: no unprotected fallback and retry stays available.
 await page.evaluate(()=>{window.savedCryptoWorker=window.PBIS_PDF_CRYPTO_WORKER;window.PBIS_PDF_CRYPTO_WORKER='self.onmessage=()=>postMessage({ok:false});';});
 await page.locator('#pdf-dni').fill('11223344b');await page.locator('#pdf-confirm').click();await page.locator('#pdf-status[role=alert]').filter({hasText:'ninguna copia sin proteger'}).waitFor();
 assert.equal(downloads,0);assert.equal(await page.locator('#pdf-dni').inputValue(),'');assert.equal(await page.locator('#pdf-confirm').isEnabled(),true);
 await page.evaluate(()=>{window.PBIS_PDF_CRYPTO_WORKER=window.savedCryptoWorker;delete window.savedCryptoWorker;});
 for(const width of [390,320]){await page.setViewportSize({width,height:900});assert.ok(await page.locator('#pdf-dialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1));await page.screenshot({path:path.join(out,'dni-orientacion-'+width+'.png')});}
 await page.locator('#pdf-dni').fill('11223344b');await download('orientacion.pdf');assert.equal(downloads,1);
 await page.locator('#logout').click();await login('12345678z','Toro05Leon');await page.locator('#export-pdf').click();
 assert.equal(await page.locator('#pdf-dni').count(),0);assert.doesNotMatch(await page.locator('#pdf-dialog').textContent(),/12345678Z/);
 await download('docente.pdf');assert.equal(downloads,2);
 // Cancelling while encryption is running terminates the worker and downloads nothing.
 await page.evaluate(()=>{window.savedCryptoWorker=window.PBIS_PDF_CRYPTO_WORKER;window.PBIS_PDF_CRYPTO_WORKER='self.onmessage=()=>{};';const NativeWorker=Worker;window.cancelledWorkers=0;window.Worker=class extends NativeWorker{terminate(){window.cancelledWorkers++;super.terminate();}};});
 await page.locator('#export-pdf').click();await page.locator('#pdf-network').uncheck();await page.locator('#pdf-confirm').click();await page.locator('#pdf-cancel').click();await page.waitForFunction(()=>window.cancelledWorkers>0);assert.equal(downloads,2);
 await page.locator('#logout').click();await login('orientacion','FRJ508',path.join(root,'data/examples/datos_evaluacion.xlsx'));await page.locator('#export-pdf').click();
 assert.equal(await page.locator('#pdf-dni').inputValue(),''); // Previous teacher DNI cannot survive logout.
 await page.locator('#pdf-dni').fill('11223344B');await page.keyboard.press('Escape');assert.equal(await page.locator('#pdf-dni').count(),0);
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(external.length,0,external.join('\n'));
 const result={ok:true,fullDniRequired:true,orientationPrompt:true,teacherUsesAuthenticatedDni:true,wrongDniBlocked:true,noPlaintextFallback:true,retry:true,cancelTerminatesWorker:true,logoutClearsDni:true,mobile:[390,320],noExternalRequests:true,noBrowserPersistence:true};
 await fs.writeFile(path.join(out,'resultado.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();}
