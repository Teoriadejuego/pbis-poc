import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {zipEntries} from '../../tools/verify-release.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const site=path.join(root,'site'),out=path.join(root,'test-results/landing');
await fs.mkdir(out,{recursive:true});
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.jpg':'image/jpeg','.zip':'application/zip'};
const server=http.createServer(async(req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=path.resolve(site,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
 if(!file.startsWith(site+path.sep)){res.writeHead(403).end();return;}
 try{res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'}).end(await fs.readFile(file));}
 catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,executablePath:process.env.PBIS_BROWSER_PATH||(process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':undefined)});
const page=await browser.newPage({viewport:{width:1360,height:1000},acceptDownloads:true});
const errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',route=>{const url=route.request().url();if(url.startsWith(origin+'/')||url.startsWith('file:'))return route.continue();external.push(url);return route.abort();});
try{
 await page.goto(origin+'/');
 assert.match(await page.locator('.hero-actions > a').first().innerText(),/Acceder con mi cuenta/);
 assert.match(await page.locator('.hero-actions > a').nth(1).innerText(),/Comenzar práctica guiada/);
 assert.ok(await page.locator('.report-screenshot').evaluate(i=>i.complete&&i.naturalWidth>0));
 for(const width of [1360,768,390,320]){
  await page.setViewportSize({width,height:1000});
  await page.evaluate(()=>window.scrollTo(0,0));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Overflow at '+width);
  await page.screenshot({path:path.join(out,'portada-'+width+'.png'),fullPage:width===1360});
  if(width<850){
   await page.locator('.menu-toggle').click();
   assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'true');
   await page.locator('#menu a[href="#descargas"]').click();
   assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
   assert.ok(await page.locator('#descargas h2').isVisible());
   await page.locator('.menu-toggle').click();await page.keyboard.press('Escape');
   assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
  }
 }
 const pdfFaq=page.locator('.faq summary').filter({hasText:'¿Puedo descargar las fichas?'});
 await pdfFaq.focus();await page.keyboard.press('Enter');assert.equal(await pdfFaq.locator('..').getAttribute('open'),'');
 await page.setViewportSize({width:1360,height:1000});
 for(const platform of ['Windows','macOS','Linux','Universal']){
  const download=page.waitForEvent('download');await page.locator(`a[href="downloads/PBIS-${platform}.zip"]`).click();
  const file=path.join(out,'PBIS-'+platform+'.zip');await (await download).saveAs(file);
  assert.deepEqual(await fs.readFile(file),await fs.readFile(path.join(site,'downloads','PBIS-'+platform+'.zip')));
 }
 await page.locator('.hero-actions > a').first().click();await page.locator('#login-form').waitFor();
 assert.equal(await page.locator('#report-content').count(),0);
 await page.goto(origin+'/');await page.locator('.hero-actions > a').nth(1).click();await page.locator('#tour-panel').waitFor();
 assert.match(await page.locator('#tour-panel').innerText(),/1 de 16/);
 // Open the actual downloaded home with only its app; resources must be embedded.
 const entries=zipEntries(await fs.readFile(path.join(out,'PBIS-Universal.zip')));
 const local=path.join(out,'offline');await fs.mkdir(local,{recursive:true});
 for(const file of ['index.html','PBIS.html'])await fs.writeFile(path.join(local,file),entries.get('PBIS/'+file));
 await page.goto(pathToFileURL(path.join(local,'index.html')).href);
 assert.ok(await page.locator('.report-screenshot').evaluate(i=>i.complete&&i.naturalWidth>0));
 assert.ok(await page.locator('.button-dark').first().evaluate(e=>getComputedStyle(e).backgroundColor!=='rgba(0, 0, 0, 0)'));
 assert.match(await page.locator('.download-connection-note').innerText(),/requieren conexión/);
 await page.setViewportSize({width:390,height:900});await page.locator('.menu-toggle').click();
 assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'true');
 await page.keyboard.press('Escape');
 await page.locator('.hero-actions > a').first().click();await page.locator('#login-form').waitFor();
 await page.goto(pathToFileURL(path.join(local,'index.html')).href);
 await page.locator('.hero-actions > a').nth(1).click();await page.locator('#tour-panel').waitFor();
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(external.length,0,external.join('\n'));
 console.log(JSON.stringify({ok:true,viewportWidths:[1360,768,390,320],downloads:4,accountEntry:true,guidedEntry:true,offlineHomeAndEntry:true,noExternalRequests:true}));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
