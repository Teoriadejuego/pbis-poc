import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {chromium} from 'playwright';
const require=createRequire(import.meta.url),P=require('../../src/protected-project.js');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),out=path.join(root,'test-results/pdf-permissions');await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PBIS_BROWSER_PATH||(process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':undefined)});
const page=await browser.newPage({viewport:{width:1360,height:960},acceptDownloads:true}),errors=[],external=[];
page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{for(const key of ['localStorage','sessionStorage','indexedDB'])Object.defineProperty(window,key,{get(){throw Error('Persistent storage forbidden');}});});
await page.route('**/*',route=>{if(route.request().url().startsWith('file:'))return route.continue();external.push(route.request().url());return route.abort();});
async function login(user='orientacion',password='FRJ508',file){await page.locator('#username').fill(user);await page.locator('#password').fill(password);await page.locator('#login-form button[type=submit]').click();if(file){await page.locator('#file-data').setInputFiles(file);await page.locator('#tab-group:not([disabled])').waitFor();}}
async function logout(){await page.locator('#logout').click();await page.locator('#login-form').waitFor();}
async function saveProject(name){await page.locator('#admin-build').click();await page.locator('#admin-download:not([hidden])').waitFor();const wait=page.waitForEvent('download');await page.locator('#admin-download').click();const d=await wait;const file=path.join(out,name);await d.saveAs(file);return file;}
async function checkViews(allowed,center=false){for(const tab of [...(center?['center']:[]),'group','student']){await page.locator('#tab-'+tab).click();assert.equal(await page.locator('#export-pdf').count(),allowed?1:0);assert.equal(await page.locator('#pdf-dialog').count(),0);}}
try{
 await page.goto(pathToFileURL(path.join(root,'release/PBIS.html')).href);await login();await page.locator('#admin-project').click();
 await page.locator('#admin-file').setInputFiles(path.join(root,'data/examples/datos_evaluacion.xlsx'));await page.locator('#admin-source-status').filter({hasText:'estudiantes preparados'}).waitFor();
 assert.equal(await page.locator('#admin-account-pdf').isChecked(),false);assert.equal(await page.locator('#admin-orientation-pdf').isChecked(),true);
 await page.locator('#admin-dni').fill('12345678Z');await page.locator('#admin-account-password').fill('Toro05Leon');await page.locator('[name=allowed]').first().check();await page.locator('#admin-add').click();
 await page.locator('#admin-dni').fill('87654321X');await page.locator('#admin-account-password').fill('Lince72Delfin');await page.locator('[name=allowed]').first().check();await page.locator('#admin-account-pdf').press('Space');await page.locator('#admin-add').click();
 assert.equal(await page.locator('#admin-account-pdf').isChecked(),false);
 assert.ok((await page.locator('#admin-accounts tr').nth(1).textContent()).includes('No permitido'));assert.ok((await page.locator('#admin-accounts tr').nth(2).textContent()).includes('Permitido'));
 const v1=await saveProject('permisos-v1.pbis');
 await page.screenshot({path:path.join(out,'administracion-permisos.png'),fullPage:true});
 assert.equal((await P.open(await fs.readFile(v1),'12345678Z','Toro05Leon')).grant.canExportPdf,false);
 assert.equal((await P.open(await fs.readFile(v1),'87654321X','Lince72Delfin')).grant.canExportPdf,true);
 await page.locator('.protected-dialog [data-close]').click();await logout();
 await login('12345678Z','Toro05Leon',v1);await checkViews(false);await page.locator('.expanded-details > summary').click();assert.equal(await page.locator('#export-pdf').count(),0);await logout();
 await login('87654321X','Lince72Delfin',v1);await checkViews(true);await page.locator('#export-pdf').click();const pdfWait=page.waitForEvent('download');await page.locator('#pdf-confirm').click();await (await pdfWait).saveAs(path.join(out,'docente-autorizado.pdf'));await page.locator('#pdf-cancel').click();await logout();
 await login('orientacion','FRJ508',v1);await checkViews(true,true);await page.locator('#admin-project').click();
 await page.locator('[data-edit="0"]').click();assert.equal(await page.locator('#admin-account-pdf').isChecked(),false);await page.locator('#admin-account-pdf').check();await page.locator('#admin-add').click();
 await page.locator('[data-edit="1"]').click();assert.equal(await page.locator('#admin-account-pdf').isChecked(),true);await page.locator('#admin-account-pdf').uncheck();await page.locator('#admin-add').click();
 await page.locator('#admin-orientation-pdf').uncheck();const v2=await saveProject('permisos-v2.pbis');
 // Editing permissions invalidates an already generated download.
 await page.locator('#admin-orientation-pdf').check();assert.equal(await page.locator('#admin-download').isVisible(),false);
 await page.locator('.protected-dialog [data-close]').click();await logout();
 await login('orientacion','FRJ508',v2);await checkViews(false,true);await page.locator('#admin-project').click();assert.equal(await page.locator('#admin-orientation-pdf').isChecked(),false);
 await page.locator('[data-edit="1"]').click();assert.equal(await page.locator('#admin-account-pdf').isChecked(),false);
 for(const width of [390,320]){await page.setViewportSize({width,height:900});assert.ok(await page.locator('.protected-dialog').evaluate(d=>d.scrollWidth<=d.clientWidth+1));await page.locator('#admin-account-pdf').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'permiso-movil-'+width+'.png')});}
 await page.locator('.protected-dialog [data-close]').click();await logout();
 await login('87654321X','Lince72Delfin',v2);await checkViews(false);await logout();
 await login('12345678Z','Toro05Leon',v2);await checkViews(true);await logout();
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(external.length,0,external.join('\n'));
 console.log(JSON.stringify({ok:true,creation:true,editingWithoutPasswordChange:true,encryptedPermissions:true,teacherAllowedAndDenied:true,orientationAllowedAndDenied:true,download:true,mobile:[390,320],noExternalRequests:true,noBrowserPersistence:true}));
}finally{await browser.close();}
