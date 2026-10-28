// Reproduce cross-class network navigation without changing application code.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {chromium} from 'playwright';
const require=createRequire(import.meta.url),P=require('../../src/protected-project.js'),C=require('../../src/core.js'),W=require('../../src/raw-wave1.js'),XLSX=require('../../vendor/xlsx.full.min.js');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),out=path.join(root,'test-results/permisos-red');
await fs.mkdir(out,{recursive:true});
const stamp='2026-10-01 10:00:00 -> ',names=['Ana','Beatriz','Carlos','Diego','Elena','Félix'];
const raw=names.map((name,i)=>({'Usuario Id':'S'+(i+1),'Alumno Id':'TEST'+(i+1),Estudio:'4826',Curso:'1.º ESO',Grupo:i<3?'A':'B',dia:stamp+'Par',start:'2026-10-01',end:'2026-10-01',egeneral:stamp,general:stamp+'Siempre',efun:stamp,fun:stamp+'Casi siempre',ealone:stamp,alone:stamp+'Casi nunca',ebullying:stamp,bullying:stamp+'Nadie',emediador:stamp,mediador:stamp+'S1 (Buena mediación)',eredes1:stamp,redes1:stamp+names.map((_,j)=>j!==i?'S'+(j+1)+' (Buena relación)':null).filter(Boolean).join(' | '),ebeliefs1:stamp,beliefs1:stamp+'Nadie',carrera1:stamp+'2',emilia1:stamp+'Emilia',library1:stamp+'47',Nombre:name,Apellidos:'Ejemplo Prueba',eredes2:null,redes2:null,ebeliefs2:null,beliefs2:null,carrera2:null,emilia2:null,library2:null}));
const converted=W.convert(raw),data=C.validateAndJoin(converted.students,null,converted.groups),aula=P.classes(data).find(x=>x.group==='A'||JSON.parse(x.key)[2]==='A');
assert.ok(aula);assert.equal(data.students.find(r=>r.ID==='S1').amistad_recibida_n,5);
const generated=await P.build({data,center:'Centro 4826',accounts:[{username:'orientacion',password:'FRJ508'},{username:'12345678Z',password:'Toro05Leon',canExportPdf:true,allowed:[aula.key]}]});
const protectedFile=path.join(out,'centro-prueba-A-B.pbis');await fs.writeFile(protectedFile,generated.text);
const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(raw),'Users');const rawFile=path.join(out,'centro-prueba-A-B.xlsx');await fs.writeFile(rawFile,XLSX.write(wb,{type:'buffer',bookType:'xlsx'}));
const browser=await chromium.launch({headless:true,executablePath:process.env.PBIS_BROWSER_PATH||(process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':undefined)});
const page=await browser.newPage({viewport:{width:1360,height:1000}}),errors=[],requests=[];
page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',route=>{if(route.request().url().startsWith('file:'))return route.continue();requests.push(route.request().url());return route.abort();});
await page.context().setOffline(true);
async function login(username,password,file){await page.goto(pathToFileURL(path.join(root,'release/PBIS.html')).href);await page.locator('#username').fill(username);await page.locator('#password').fill(password);await page.locator('#login-terms').check();await page.locator('#login-form button[type=submit]').click();await page.locator('#file-data').setInputFiles(file);if(file.endsWith('.xlsx')){await page.locator('#show-reports:not([disabled])').waitFor();await page.locator('#show-reports').click();}await page.locator('#tab-student:not([disabled])').waitFor();await page.locator('#tab-student').click();await page.locator('#student').selectOption('S1');await page.locator('.expanded-details > summary').click();}
async function snapshot(){return {permissionNote:await page.locator('.student-network-permission-note').allTextContents(),student:await page.locator('#student').inputValue(),heading:await page.locator('.report-hero h2').first().textContent(),classrooms:await page.locator('#group option').allTextContents(),receivedCard:await page.locator('.summary-comparison').first().innerText(),networkSummary:await page.locator('.student-network-result').innerText(),networkCoverage:await page.locator('.student-network-coverage').innerText(),networkLinks:await page.locator('a[data-network-student]').evaluateAll(elements=>elements.map(a=>({id:a.dataset.networkStudent,label:a.getAttribute('aria-label')}))),incomingArrows:await page.locator('.student-network-svg path[data-network-direction="incoming"]').count(),diegoLinks:await page.locator('a[data-network-student="S4"]').count()};}
async function pdf(name){await page.locator('#export-pdf').click();if(await page.locator('#pdf-dni').count())await page.locator('#pdf-dni').fill('11223344B');const pending=page.waitForEvent('download');await page.locator('#pdf-terms').check();await page.locator('#pdf-confirm').click();await (await pending).saveAs(path.join(out,name));await page.locator('#pdf-cancel').click();}
const result={setup:{center:'Centro 4826',student:'Ana E. P. (S1), 1.º ESO A',nominationsFromA:['S2','S3'],nominationsFromB:['S4','S5','S6'],totalReceived:5}};
try{
 await login('12345678Z','Toro05Leon',protectedFile);
 result.protectedTeacher=await snapshot();assert.equal(result.protectedTeacher.permissionNote.length,1);assert.match(result.protectedTeacher.permissionNote[0],/Los totales incluyen relaciones de otras aulas/);await pdf('docente-A-nota.pdf');assert.deepEqual(result.protectedTeacher.classrooms,['A']);assert.equal(result.protectedTeacher.diegoLinks,0);assert.equal(result.protectedTeacher.incomingArrows,2);assert.deepEqual(result.protectedTeacher.networkLinks.map(x=>x.id).sort(),['S2','S3']);
 await page.locator('.student-network').screenshot({path:path.join(out,'docente-A-red.png')});
 await page.locator('.summary-friendship').screenshot({path:path.join(out,'docente-A-recuento.png')});
 // A real permitted click: the other A record opens normally.
 await page.locator('a[data-network-student="S2"]').click();result.allowedClick={student:await page.locator('#student').inputValue(),heading:await page.locator('.report-hero h2').first().textContent()};assert.equal(result.allowedClick.student,'S2');
 // Explicitly separate this artificial robustness check from the normal UI path.
 await page.locator('#student').selectOption('S1');await page.locator('.expanded-details > summary').click();
 await page.locator('a[data-network-student="S2"]').evaluate(a=>a.dataset.networkStudent='S4');
 await page.locator('a[data-network-student="S4"]').click();
 result.artificialRetarget={student:await page.locator('#student').inputValue(),heading:await page.locator('.report-hero h2').first().textContent(),description:'Only this step retargets an existing A link to S4 in the DOM; it is not a link normally shown.'};assert.equal(result.artificialRetarget.student,'S1');
 await page.locator('#logout').click();
 // Control: exact same encrypted file as orientation can show B and navigate to it.
 await login('orientacion','FRJ508',protectedFile);result.orientationBeforeClick=await snapshot();assert.deepEqual(result.orientationBeforeClick.permissionNote,[]);await pdf('orientacion-sin-nota.pdf');assert.equal(result.orientationBeforeClick.diegoLinks,1);assert.equal(result.orientationBeforeClick.incomingArrows,5);
 await page.locator('.student-network').screenshot({path:path.join(out,'orientacion-red-completa.png')});await page.locator('a[data-network-student="S4"]').click();
 result.orientationAfterClick={student:await page.locator('#student').inputValue(),heading:await page.locator('.report-hero h2').first().textContent(),classroom:await page.locator('#group').inputValue()};assert.equal(result.orientationAfterClick.student,'S4');assert.equal(result.orientationAfterClick.classroom,'B');await page.locator('#logout').click();
 // Existing course-wide pilot account is NOT an A-only account. Verify the distinction.
 const profiles=JSON.parse(await fs.readFile(path.join(root,'data/profiles.json'))),courseTutor=profiles.find(p=>p.username==='tutoria1eso');
 await login(courseTutor.username,courseTutor.password,rawFile);result.legacyCourseTutorBeforeClick=await snapshot();assert.deepEqual(result.legacyCourseTutorBeforeClick.permissionNote,[]);await page.locator('a[data-network-student="S4"]').click();
 result.legacyCourseTutorAfterClick={student:await page.locator('#student').inputValue(),heading:await page.locator('.report-hero h2').first().textContent(),classroom:await page.locator('#group').inputValue()};assert.equal(result.legacyCourseTutorAfterClick.student,'S4');await page.locator('#logout').click();
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(requests.length,0,requests.join('\n'));
 result.errors=errors;result.externalRequests=requests;await fs.writeFile(path.join(out,'resultado.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{await browser.close();}
