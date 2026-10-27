import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),out=path.join(root,'test-results/audit-v2');await fs.mkdir(out,{recursive:true});
const endpoint='https://script.google.com/macros/s/PBIS_TEST/exec';
const connection={schema:'pbis.audit-connection.v1',endpoint,projectId:randomUUID(),revision:1,userCode:'U-'+randomUUID(),username:'orientacion',token:randomBytes(32).toString('base64')};
const browser=await chromium.launch({headless:true,executablePath:process.env.PBIS_BROWSER_PATH||(process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':undefined)}),page=await browser.newPage({viewport:{width:1360,height:950}}),errors=[],events=[],external=[];let fail=false;
page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{for(const name of ['localStorage','sessionStorage','indexedDB'])Object.defineProperty(window,name,{get(){throw Error('Persistent storage forbidden');}});});
await page.route('**/*',async route=>{const req=route.request(),url=req.url();if(url.startsWith('file:'))return route.continue();if(url===endpoint){const body=JSON.parse(req.postData());events.push(body);return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(fail?{ok:false}:{ok:true,eventId:body.event.eventId})});}external.push(url);return route.abort();});
const connect=async value=>{await page.locator('#configure-audit').click();await page.locator('#audit-connection-file').setInputFiles({name:'conexion.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(value))});};
const openExcel=async(name='ejemplo.xlsx')=>{await page.locator('#file-data').setInputFiles({name,mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:await fs.readFile(path.join(root,'data/examples/datos_evaluacion.xlsx'))});await page.locator('#show-reports:not([disabled])').waitFor();await page.locator('#show-reports').click();await page.locator('#tab-roster:not([disabled])').waitFor();};
try{
 await page.goto(pathToFileURL(path.join(root,'direccion-local/PBIS.html')).href);
 await page.locator('#username').fill('orientacion');await page.locator('#password').fill('FRJ508');await page.locator('#login-form button[type=submit]').click();
 await connect({...connection,password:'NEVER_STORE_PASSWORD'});await page.locator('#audit-connection-status').filter({hasText:'No se pudo activar'}).waitFor();await page.locator('#audit-connection-close').click();assert.equal(events.length,0);
 await connect(connection);await page.locator('#audit-connection-status').filter({hasText:'Conexión preparada'}).waitFor();
 for(const width of [390,320]){await page.setViewportSize({width,height:900});assert.ok(await page.locator('#audit-connection-dialog').evaluate(d=>d.scrollWidth<=d.clientWidth+1));}
 await page.setViewportSize({width:1360,height:950});await page.locator('#audit-connection-close').click();assert.equal(events.length,0);
 await openExcel();await page.locator('.protected-audit-status').filter({hasText:'Acceso registrado'}).waitFor();
 const first=events[0].event;assert.equal(first.type,'open');assert.equal(first.fileName,'ejemplo.xlsx');assert.deepEqual(first.centers,(await page.locator('#center option').allTextContents()).sort());
 await page.screenshot({path:path.join(out,'orientacion-con-registro.png'),fullPage:true});
 await page.locator('#change-files').click();await page.locator('#show-reports').click();assert.equal(events.length,1,'Same consultation does not duplicate open');
 await page.locator('#change-files').click();await openExcel('segunda-consulta.xlsx');await page.locator('.protected-audit-status').filter({hasText:'Acceso registrado'}).waitFor();
 assert.equal(events.filter(e=>e.event.type==='close'&&e.event.sessionId===first.sessionId).length,1);
 const second=events.find(e=>e.event.type==='open'&&e.event.fileName==='segunda-consulta.xlsx').event;assert.notEqual(second.sessionId,first.sessionId);
 await page.locator('#logout').click();await page.locator('#login-form').waitFor();assert.ok(events.some(e=>e.event.type==='close'&&e.event.sessionId===second.sessionId));
 // Nothing persists: a later login must reconnect; invalid Excel never creates open.
 await page.locator('#username').fill('orientacion');await page.locator('#password').fill('FRJ508');await page.locator('#login-form button[type=submit]').click();const baseline=events.length;
 await openExcel();assert.equal(events.length,baseline);await page.locator('.protected-audit-status').filter({hasText:'sin activar'}).waitFor();
 fail=true;await connect(connection);await page.locator('#audit-connection-close').click();await page.locator('.protected-audit-status').filter({hasText:'pendiente de registrar'}).waitFor();
 const failed=events.at(-1).event;fail=false;await page.evaluate(()=>window.dispatchEvent(new Event('online')));await page.locator('.protected-audit-status').filter({hasText:'Acceso registrado'}).waitFor();assert.equal(events.at(-1).event.eventId,failed.eventId);
 await page.locator('#change-files').click();await page.locator('#file-data').setInputFiles({name:'mal.xlsx',mimeType:'application/octet-stream',buffer:Buffer.from('invalid workbook')});await page.locator('#show-reports:not([disabled])').waitFor();await page.locator('#show-reports').click();await page.locator('#import-error').filter({hasText:/./}).waitFor();assert.ok(!events.some(e=>e.event.fileName==='mal.xlsx'));
 await page.locator('#logout').click();await page.locator('#login-form').waitFor();

 // Exercise the owner dialog with a simulated google.script.run, never Google.
 await page.goto(pathToFileURL(path.join(root,'audit-service/Registro.html')).href);
 await page.evaluate(()=>{const api={withSuccessHandler(fn){this.success=fn;return this;},withFailureHandler(fn){this.failure=fn;return this;},registerOrientationConnection(text){window.testConnection=JSON.parse(text);this.success('Conexión registrada.');}};window.google={script:{run:api}};});
 assert.equal(await page.locator('#download').isVisible(),false);
 await page.locator('#endpoint').fill(endpoint);await page.locator('#connection').click();await page.locator('#download').waitFor();
 const downloadPromise=page.waitForEvent('download');await page.locator('#download').click();const download=await downloadPromise;const file=path.join(out,'conexion-sintetica.json');await download.saveAs(file);
 const created=JSON.parse(await fs.readFile(file));assert.equal(created.username,'orientacion');assert.equal(Buffer.from(created.token,'base64').length,32);assert.ok(!Object.hasOwn(created,'password'));
 await page.screenshot({path:path.join(out,'activacion-hoja.png')});
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(external.length,0,external.join('\n'));
 assert.ok(events.every(b=>Object.keys(b).sort().join(',')==='event,token'));
 assert.ok(events.every(b=>Object.keys(b.event).sort().join(',')===['schema','projectId','revision','userCode','sessionId','fileName','eventId','type','clientTime','centers'].sort().join(',')));
 assert.doesNotMatch(JSON.stringify(events),/FRJ508|NEVER_STORE_PASSWORD|password|Nombre|Apellidos|bullying/);
 // Store evidence without the connection token, even in the test report.
 await fs.writeFile(path.join(out,'resultado.json'),JSON.stringify({events:events.map(x=>x.event),errors,external},null,2));console.log(JSON.stringify({ok:true,requests:events.length,uniqueEvents:new Set(events.map(x=>x.event.eventId)).size,centers:first.centers,noPersistentStorage:true,noPasswords:true}));
}finally{await browser.close();}
