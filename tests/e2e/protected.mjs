import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {chromium} from 'playwright';
const require=createRequire(import.meta.url),P=require('../../src/protected-project.js'),fixture=require('../protected-fixture.cjs');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const output=path.join(root,'test-results');await fs.mkdir(output,{recursive:true});
const data=fixture.data(),aulas=P.classes(data),accounts=[{username:'orientacion',password:'FRJ508'},{username:'12345678Z',password:'Toro05Leon',allowed:[aulas[0].key]},{username:'87654321X',password:'Lince72Delfin',allowed:[aulas[1].key]}];
const endpoint='https://script.google.com/macros/s/PBIS_TEST/exec';
const generated=await P.build({data,center:'Centro 4826',accounts,auditEndpoint:endpoint});
const sample=path.join(output,'protected-test.pbis');await fs.writeFile(sample,generated.text);
const server=http.createServer(async(req,res)=>{try{const file=path.resolve(root,'site','.'+new URL(req.url,'http://local').pathname);if(!file.startsWith(path.join(root,'site')+path.sep))throw Error();res.setHeader('Content-Type',file.endsWith('.json')?'application/json':'text/html');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;
const executablePath=process.env.PBIS_BROWSER_PATH||(process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':undefined);
const browser=await chromium.launch({headless:true,executablePath});
const page=await browser.newPage({viewport:{width:1360,height:960},acceptDownloads:true}),errors=[],events=[],reviews=[];let failAudit=false;
page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{for(const name of ['localStorage','sessionStorage','indexedDB'])Object.defineProperty(window,name,{get(){throw Error('Persistent storage forbidden: '+name);}});});
await page.route('**/*',async route=>{const request=route.request(),url=request.url();if(url.startsWith(origin)||url.startsWith('file:'))return route.continue();
 if(url===endpoint){const body=JSON.parse(request.postData());events.push(body);return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(failAudit?{ok:false}:{ok:true,eventId:body.event.eventId})});}
 if(url==='https://formspree.io/f/mvkgydrn'){reviews.push(JSON.parse(request.postData()));return route.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'});}
 throw Error('Unexpected outgoing connection '+url);
});
async function open(user,pass,file=sample){await page.locator('#username').fill(user);await page.locator('#password').fill(pass);await page.locator('#login-terms').check();await page.locator('#login-form button[type=submit]').click();await page.locator('#file-data').waitFor();assert.equal(await page.locator('#open-protected').count(),0);await page.locator('#file-data').setInputFiles(file);}
async function logout(){await page.locator('#logout').click();await page.locator('#login-form').waitFor();}
try{
 await page.goto(origin+'/PBIS.html');await open('12345678Z','wrong');await page.locator('#import-error').filter({hasText:'No tienes permisos'}).waitFor();assert.equal(await page.locator('#tab-roster').isDisabled(),true);assert.equal(await page.locator('#admin-project').count(),0);assert.equal(events.length,0);await page.locator('#change-access').click();await page.locator('#login-form').waitFor();
 await open('12345678Z','Toro05Leon');await page.locator('#tab-roster:not([disabled])').waitFor();await page.locator('.protected-audit-status').filter({hasText:'Acceso registrado'}).waitFor();
 assert.equal(await page.locator('#admin-project').count(),0);assert.equal(await page.locator('#tab-center').count(),0);assert.equal(await page.locator('.protected-watermark').count(),1);assert.ok((await page.locator('.protected-watermark').textContent()).includes('1*3**6*8Z'));
 await page.locator('#tab-roster').click();assert.equal(await page.locator('tr[data-student-id]').count(),3);assert.ok(!(await page.locator('#report-content').textContent()).includes('Bruno'));
 await page.locator('tr[data-student-id="S1"] [data-roster-open]').first().click();await page.locator('tr[data-student-id="S1"] [data-roster-reaction="ok"]').first().click();
 await page.locator('#review-send-preview').click();await page.locator('#review-send-dialog .protected-watermark').waitFor();await page.locator('#review-preview-send').click();await page.getByText('Formspree ha confirmado el registro. Puedes seguir consultando. El aviso por correo puede tardar.',{exact:true}).waitFor();
 assert.equal(reviews.length,1);assert.ok(!JSON.stringify(reviews).includes('12345678Z'));assert.ok(reviews[0].username.startsWith('U-'));
 await page.screenshot({path:path.join(output,'proyecto-docente.png'),fullPage:true});
 await page.locator('#tab-student').click();await page.locator('.expanded-details > summary').click();assert.ok(await page.locator('.student-network').count());
 for(const width of [390,320]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'mobile report width '+width);}
 await page.screenshot({path:path.join(output,'proyecto-movil.png'),fullPage:true});await logout();assert.equal(await page.locator('.protected-watermark').count(),0);assert.ok(events.some(e=>e.event.type==='close'));
 await page.setViewportSize({width:1360,height:960});await open('87654321X','Lince72Delfin');await page.locator('#tab-roster:not([disabled])').waitFor();await page.locator('#tab-roster').click();assert.ok((await page.locator('#report-content').textContent()).includes('Bruno'));assert.ok(!(await page.locator('#report-content').textContent()).includes('Ana'));await logout();
 await open('orientacion','FRJ508');await page.locator('#admin-project').waitFor();assert.equal(await page.locator('#open-accounts, #accounts-dialog, #open-demo, #start-tour').count(),0);assert.equal(await page.locator('.protected-watermark').count(),0);assert.equal((await page.locator('.user-info').textContent()).trim(),'Equipo orientador');await page.locator('#tab-center').click();
 await page.locator('#admin-project').click();await page.locator('#admin-accounts').waitFor();assert.equal(await page.locator('#admin-accounts [data-edit]').count(),2);await page.locator('#admin-orientation-password').fill('Nutria42Leon');await page.locator('#admin-terms').check();await page.locator('#admin-build').click();await page.locator('#admin-download:not([hidden])').waitFor();
 const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#admin-download').click()]);const changed=path.join(output,'changed-project.pbis');await download.saveAs(changed);await assert.rejects(P.open(await fs.readFile(changed),'orientacion','FRJ508'));assert.equal((await P.open(await fs.readFile(changed),'orientacion','Nutria42Leon')).data.students.length,6);
 await page.screenshot({path:path.join(output,'proyecto-administracion.png'),fullPage:true});
 for(const width of [390,320]){await page.setViewportSize({width,height:900});assert.ok(await page.locator('.protected-dialog').evaluate(d=>d.scrollWidth<=d.clientWidth+1),'mobile admin width '+width);}
 await page.locator('.protected-dialog [data-close]').click();await logout();
 await open('orientacion','FRJ508',changed);await page.locator('#import-error').filter({hasText:'No tienes permisos'}).waitFor();assert.equal(await page.locator('#tab-roster').isDisabled(),true);await logout();
 await open('orientacion','Nutria42Leon',changed);await page.locator('#tab-center:not([disabled])').waitFor();await logout();
 // Actual Excel upload and project creation through the administration screen.
 await page.setViewportSize({width:1360,height:960});await page.locator('#username').fill('orientacion');await page.locator('#password').fill('FRJ508');await page.locator('#login-terms').check();await page.locator('#login-form button[type=submit]').click();await page.locator('#admin-project').click();await page.locator('#admin-file').setInputFiles(path.join(root,'data/examples/datos_evaluacion.xlsx'));await page.locator('#admin-source-status').filter({hasText:'estudiantes preparados'}).waitFor();
 await page.locator('#admin-dni').fill('12345678Z');await page.locator('#admin-account-password').fill('Toro05Leon');await page.locator('[name=allowed]').first().check();await page.locator('#admin-add').click();await page.locator('#admin-terms').check();await page.locator('#admin-build').click();await page.locator('#admin-download:not([hidden])').waitFor();
 await page.locator('#admin-file').setInputFiles({name:'incorrecto.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:Buffer.from('No es un Excel')});await page.locator('#admin-file:not([disabled])').waitFor();assert.equal(await page.locator('#admin-build').isDisabled(),true);assert.equal(await page.locator('#admin-download').isVisible(),false);assert.equal(await page.locator('[name=allowed]').count(),0);
 await page.locator('.protected-dialog [data-close]').click();await logout();
 // Same app from file:// with no Internet, including an unconfirmed close.
 failAudit=true;await page.goto(pathToFileURL(path.join(root,'release/PBIS.html')).href);await open('12345678Z','Toro05Leon');await page.locator('#tab-roster:not([disabled])').waitFor();await page.locator('.protected-audit-status').filter({hasText:'pendiente de registrar'}).waitFor();await logout();await page.getByText(/El cierre no se ha confirmado/).waitFor();
 assert.equal(errors.length,0,errors.join('\n'));assert.ok(events.every(e=>!JSON.stringify(e).includes('12345678Z')&&!Object.hasOwn(e.event,'students')));
 console.log(JSON.stringify({ok:true,accessRequests:events.length,feedbackRequests:reviews.length,httpAndFile:true,mobileWidths:[390,320],newExcelProject:true,editedProject:true}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
