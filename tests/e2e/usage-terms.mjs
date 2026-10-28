import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const out=path.join(root,'test-results/usage-terms');await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PBIS_BROWSER_PATH||(process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':undefined)});
const page=await browser.newPage({viewport:{width:1360,height:1000},acceptDownloads:true});
page.setDefaultTimeout(20000);
const errors=[],external=[],downloads=[];
page.on('pageerror',e=>errors.push(e.message));page.on('download',d=>downloads.push(d.suggestedFilename()));
await page.addInitScript(()=>{for(const key of ['localStorage','sessionStorage','indexedDB'])Object.defineProperty(window,key,{get(){throw Error('Persistent storage forbidden');}});});
await page.route('**/*',route=>{if(route.request().url().startsWith('file:'))return route.continue();external.push(route.request().url());return route.abort();});
try{
 await page.goto(pathToFileURL(path.join(root,'release/index.html')).href);
 await page.getByRole('link',{name:'Condiciones de uso',exact:true}).click();
 const termsText=await page.locator('main').innerText();
 assert.match(termsText,/Equipo PBIS/);assert.match(termsText,/28 de octubre de 2026/);
 assert.doesNotMatch(termsText,/Borrador|revisión local|personalidad jurídica|Antes de publicar|pendiente de completar/);
 assert.match(termsText,/no excluyen la responsabilidad legalmente exigible/);
 await page.goto(pathToFileURL(path.join(root,'release/PBIS.html')).href);
 assert.equal(await page.locator('#login-terms').isChecked(),false);
 await page.locator('#username').fill('orientacion');await page.locator('#password').fill('FRJ508');
 await page.locator('#login-form button[type=submit]').click();assert.equal(await page.locator('#file-data').count(),0);
 // The handler also checks it if native form validation is bypassed.
 await page.locator('#login-form').evaluate(f=>f.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true})));
 assert.match(await page.locator('#login-error').textContent(),/condiciones/);assert.equal(await page.locator('#file-data').count(),0);
 for(const width of [1360,390,320]){
  await page.setViewportSize({width,height:1000});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.screenshot({path:path.join(out,'acceso-'+width+'.png'),fullPage:true});
  await page.locator('#login-form [data-usage-terms]').click();
  assert.ok(await page.locator('#usage-terms-dialog').evaluate(d=>d.scrollWidth<=d.clientWidth+1));
  await page.screenshot({path:path.join(out,'condiciones-'+width+'.png')});
  await page.keyboard.press('Tab');assert.ok(await page.evaluate(()=>document.getElementById('usage-terms-dialog').contains(document.activeElement)));
  await page.keyboard.press('Escape');await page.locator('#usage-terms-dialog').waitFor({state:'detached'});
  assert.equal(await page.locator('#login-terms').isChecked(),false);
  assert.ok(await page.locator('#login-form [data-usage-terms]').evaluate(b=>b===document.activeElement));
 }
 await page.setViewportSize({width:1360,height:1000});
 await page.locator('#login-form [data-usage-terms]').click();const textWait=page.waitForEvent('download');await page.locator('[data-usage-save]').click();
 const text=await textWait;const textFile=path.join(out,text.suggestedFilename());await text.saveAs(textFile);
 assert.equal(await fs.readFile(textFile,'utf8'),(await fs.readFile(path.join(root,'docs/CONDICIONES_USO.md'),'utf8')).replace(/\r\n?/g,'\n'));
 await page.keyboard.press('Escape');await page.locator('#usage-terms-dialog').waitFor({state:'detached'});await page.locator('#login-terms').focus();await page.keyboard.press('Space');await page.locator('#login-form button[type=submit]').click();
 await page.locator('#admin-project').click();await page.locator('#admin-file').setInputFiles(path.join(root,'data/examples/datos_evaluacion.xlsx'));
 await page.locator('#admin-source-status').filter({hasText:'estudiantes preparados'}).waitFor();
 assert.equal(await page.locator('#admin-terms').isChecked(),false);await page.locator('#admin-build').click();
 assert.equal(await page.locator('#admin-download').isVisible(),false);assert.match(await page.locator('#admin-status').textContent(),/Confirma/);
 await page.locator('#admin-terms').check();await page.locator('#admin-orientation-pdf').uncheck();assert.equal(await page.locator('#admin-terms').isChecked(),false);await page.locator('#admin-orientation-pdf').check();
 await page.locator('#admin-terms').check();await page.locator('#admin-dni').fill('12345678Z');await page.locator('#admin-account-password').fill('Toro05Leon');await page.locator('[name=allowed]').first().check();await page.locator('#admin-account-pdf').check();await page.locator('#admin-add').click();
 assert.equal(await page.locator('#admin-terms').isChecked(),false);await page.locator('#admin-terms').check();await page.locator('#admin-build').click();
 await page.locator('#admin-download:not([hidden])').waitFor();const projectWait=page.waitForEvent('download');await page.locator('#admin-download').click();const project=await projectWait;
 const projectFile=path.join(out,'proyecto-sintetico.pbis');await project.saveAs(projectFile);await page.locator('.project-admin [data-close]').click();
 await page.locator('#file-data').setInputFiles(projectFile);await page.locator('#tab-group:not([disabled])').waitFor();await page.locator('#tab-group').click();await page.locator('#export-pdf').click();
 await page.locator('#pdf-dni').fill('11223344B');assert.equal(await page.locator('#pdf-terms').isChecked(),false);const previous=downloads.length;
 await page.locator('#pdf-confirm').click();assert.match(await page.locator('#pdf-status').textContent(),/Confirma/);assert.equal(downloads.length,previous);
 await page.locator('#pdf-dialog [data-usage-terms]').click();assert.equal(await page.locator('#pdf-dialog').isVisible(),true);await page.keyboard.press('Escape');await page.locator('#usage-terms-dialog').waitFor({state:'detached'});
 for(const width of [390,320]){await page.setViewportSize({width,height:1000});assert.ok(await page.locator('#pdf-dialog').evaluate(d=>d.scrollWidth<=d.clientWidth+1));await page.screenshot({path:path.join(out,'pdf-'+width+'.png')});}
 await page.locator('#pdf-terms').check();const pdfWait=page.waitForEvent('download');await page.locator('#pdf-confirm').click();await (await pdfWait).saveAs(path.join(out,'informe-protegido.pdf'));
 assert.equal(await page.locator('#pdf-terms').isChecked(),false);await page.locator('#pdf-confirm').click();assert.match(await page.locator('#pdf-status').textContent(),/Confirma/);assert.equal(downloads.length,previous+1);
 await page.locator('#pdf-cancel').click();await page.locator('#logout').click();await page.locator('#login-form').waitFor();assert.equal(await page.locator('#login-terms').isChecked(),false);
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(external.length,0,external.join('\n'));
 const evidence={ok:true,sessionEntry:true,handlerGuard:true,readingDoesNotAccept:true,keyboard:true,mobile:[390,320],adminResetOnChanges:true,pdfGuardAndReset:true,offlineTextDownload:true,noExternalRequests:true,noPersistentStorage:true,logoutResets:true};
 await fs.writeFile(path.join(out,'validation.json'),JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence));
}finally{await browser.close();}
