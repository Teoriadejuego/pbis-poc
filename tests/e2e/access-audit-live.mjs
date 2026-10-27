// Explicit activation check: sends only synthetic consultation metadata to the
// receiver specified by the owner's private connection file. Never run in CI.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const configPath=process.env.PBIS_AUDIT_CONNECTION;
if(!configPath)throw Error('Set PBIS_AUDIT_CONNECTION to the private owner connection. This test writes synthetic events.');
const connection=JSON.parse(await fs.readFile(configPath,'utf8'));
const appUrl=process.env.PBIS_AUDIT_APP||pathToFileURL(path.join(root,'direccion-local/PBIS.html')).href;
if(!appUrl.startsWith('file:')&&!/^http:\/\/127\.0\.0\.1:\d+\/(?:PBIS|DIRECCION)\.html$/.test(appUrl))throw Error('Live check must use the local PBIS application.');
const out=path.join(root,'test-results/audit-live');await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PBIS_BROWSER_PATH||(process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':undefined)});
const page=await browser.newPage({viewport:{width:1360,height:950}}),events=[],receipts=[],errors=[];
page.setDefaultTimeout(25000);
await page.addInitScript(()=>{for(const name of ['localStorage','sessionStorage','indexedDB'])Object.defineProperty(window,name,{get(){throw Error('Persistent storage forbidden');}});});
await page.route('**/*',async route=>{
 const req=route.request(),url=req.url();
 if(url.startsWith('file:')||url===appUrl)return route.continue();
 if(url===connection.endpoint&&req.method()==='POST'){
  const body=JSON.parse(req.postData());
  assert.deepEqual(Object.keys(body).sort(),['event','token']);
  assert.deepEqual(Object.keys(body.event).sort(),['schema','projectId','revision','userCode','sessionId','fileName','eventId','type','clientTime','centers'].sort());
  assert.doesNotMatch(JSON.stringify(body.event),/FRJ508|password|Nombre|Apellidos|bullying/);
  events.push(body.event);return route.continue();
 }
 if(url.startsWith('https://script.googleusercontent.com/')&&req.method()==='GET')return route.continue();
 throw Error('Unexpected external request: '+new URL(url).origin);
});
page.on('response',async response=>{if(response.url().startsWith('https://script.googleusercontent.com/')){try{const result=await response.json();if(result.ok&&result.eventId)receipts.push({eventId:result.eventId,receivedAt:result.receivedAt});}catch{}}});
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(appUrl);
 await page.locator('#username').fill('orientacion');await page.locator('#password').fill('FRJ508');await page.locator('#login-form button[type=submit]').click();
 await page.locator('#configure-audit').click();await page.locator('#audit-connection-file').setInputFiles(configPath);
 await page.locator('#audit-connection-status').filter({hasText:'Conexión preparada'}).waitFor();await page.locator('#audit-connection-close').click();
 await page.locator('#file-data').setInputFiles({name:'PRUEBA_ACTIVACION_SIN_DATOS_REALES.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:await fs.readFile(path.join(root,'activation-google-sheets/prueba/Excel_sintetico.xlsx'))});
 await page.locator('#show-reports:not([disabled])').waitFor();await page.locator('#show-reports').click();
 await page.locator('.protected-audit-status').filter({hasText:'Acceso registrado'}).waitFor();
 await page.screenshot({path:path.join(out,'apertura-confirmada.png'),fullPage:true});
 await page.locator('#logout').click();await page.locator('#login-form').waitFor();
 assert.equal(errors.length,0,errors.join('\n'));
 assert.equal(events.filter(e=>e.type==='open').length,1);assert.equal(events.filter(e=>e.type==='close').length,1);
 assert.equal(new Set(events.map(e=>e.sessionId)).size,1);
 assert.equal(new Set(receipts.map(e=>e.eventId)).size,2,'Both events require a live server receipt');
 const result={ok:true,appUrl,events,receipts,noPasswords:true,noStudentData:true,noPersistentBrowserStorage:true};
 await fs.writeFile(path.join(out,appUrl.startsWith('file:')?'resultado.json':'resultado-web-local.json'),JSON.stringify(result,null,2));
 console.log(JSON.stringify({ok:true,sessionId:events[0].sessionId,events:events.map(e=>e.type),centers:events[0].centers,confirmedReceipts:receipts.length,noPasswords:true,noPersistentBrowserStorage:true}));
}finally{await browser.close();}
