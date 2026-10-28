import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {chromium} from 'playwright';
const require=createRequire(import.meta.url),P=require('../../src/protected-project.js');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),out=path.join(root,'test-results/admin-clean');await fs.mkdir(out,{recursive:true});
const endpoint='https://script.google.com/macros/s/PBIS_TEST/exec';
const browser=await chromium.launch({headless:true,executablePath:process.env.PBIS_BROWSER_PATH||(process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':undefined)});
const page=await browser.newPage({viewport:{width:1280,height:1020},acceptDownloads:true}),errors=[],external=[];
page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{for(const key of ['localStorage','sessionStorage','indexedDB'])Object.defineProperty(window,key,{get(){throw Error('Persistent storage forbidden');}});});
await page.route('**/*',async route=>{const req=route.request();if(req.url().startsWith('file:'))return route.continue();if(req.url()===endpoint){const b=JSON.parse(req.postData());return route.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,eventId:b.event.eventId})});}external.push(req.url());return route.abort();});
async function login(folder){await page.goto(pathToFileURL(path.join(root,folder,'PBIS.html')).href);await page.locator('#username').fill('orientacion');await page.locator('#password').fill('FRJ508');await page.locator('#login-terms').check();await page.locator('#login-form button[type=submit]').click();}
async function loadAdmin(){await page.locator('#admin-project').click();await page.locator('#admin-file').setInputFiles(path.join(root,'data/examples/datos_evaluacion.xlsx'));await page.locator('#admin-source-status').filter({hasText:'estudiantes preparados'}).waitFor();}
async function build(name){await page.locator('#admin-terms').check();await page.locator('#admin-build').click();await page.locator('#admin-download:not([hidden])').waitFor();const waiting=page.waitForEvent('download');await page.locator('#admin-download').click();const file=path.join(out,name);await (await waiting).saveAs(file);return file;}
const removed=/Protección y límites|Dos animales y dos cifras|Animales disponibles|Revisa aulas y permisos|FRJ508 es la clave pública|Después de generar el proyecto|Generar proyecto protegido|Añadir cuenta/;
try{
 await login('release');assert.equal(await page.locator('#configure-audit').count(),0);await loadAdmin();
 assert.equal(await page.locator('#admin-endpoint,#admin-manifest,#admin-summary,.admin-limits').count(),0);
 assert.doesNotMatch(await page.locator('.project-admin').innerText(),removed);
 assert.equal(await page.locator('#admin-add').textContent(),'Guardar cuenta');assert.equal(await page.locator('#admin-build').textContent(),'Preparar archivo');
 await page.locator('#admin-dni').fill('12345678Z');await page.locator('#admin-account-password').fill('Toro05Leon');await page.locator('[name=allowed]').first().check();await page.locator('#admin-account-pdf').check();await page.locator('#admin-add').click();
 const ordinary=await build('centro.pbis');assert.equal((await P.open(await fs.readFile(ordinary),'12345678Z','Toro05Leon')).grant.canExportPdf,true);
 for(const width of [1280,390,320]){await page.setViewportSize({width,height:1050});await page.locator('#admin-build').scrollIntoViewIfNeeded();assert.ok(await page.locator('.project-admin').evaluate(d=>d.scrollWidth<=d.clientWidth+1));await page.screenshot({path:path.join(out,'admin-'+width+'.png')});}
 await login('direccion-local');assert.equal(await page.locator('#configure-audit').count(),1);await loadAdmin();
 assert.equal(await page.locator('#admin-endpoint').count(),1);await page.locator('#admin-endpoint').fill(endpoint);
 assert.doesNotMatch(await page.locator('.project-admin').innerText(),removed);
 const configured=await build('configurado.pbis');assert.equal(await page.locator('#admin-manifest').isVisible(),true);
 const manifestWait=page.waitForEvent('download');await page.locator('#admin-manifest').click();await (await manifestWait).saveAs(path.join(out,'manifiesto-prueba.json'));
 assert.equal((await P.open(await fs.readFile(configured),'orientacion','FRJ508')).grant.endpoint,endpoint);
 // The centre copy must preserve an existing receptor even though it is not editable.
 await login('release');await page.locator('#file-data').setInputFiles(configured);await page.locator('#tab-group:not([disabled])').waitFor();await page.locator('#admin-project').click();assert.equal(await page.locator('#admin-endpoint').count(),0);
 const edited=await build('configurado-editado.pbis');assert.equal((await P.open(await fs.readFile(edited),'orientacion','FRJ508')).grant.endpoint,endpoint);assert.equal(await page.locator('#admin-manifest').count(),0);
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(external.length,0,external.join('\n'));
 const result={ok:true,removedTexts:true,centreNoRegistryControls:true,accountsAndPdfPermissions:true,directorToolsSeparated:true,existingRegistryPreserved:true,mobile:[390,320],noUnexpectedRequests:true};
 await fs.writeFile(path.join(out,'resultado.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();}
