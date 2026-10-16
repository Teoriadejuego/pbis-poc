import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const site=process.env.PBIS_TEST_SITE?path.resolve(process.env.PBIS_TEST_SITE):path.join(root,'site');
const types={'.html':'text/html','.json':'application/json','.js':'text/javascript','.css':'text/css','.jpg':'image/jpeg'};
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=path.resolve(site,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
  if(!file.startsWith(site+path.sep)){res.writeHead(403);res.end();return;}
  try{const bytes=fs.readFileSync(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(bytes);}
  catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const edge='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const executablePath=process.env.PBIS_BROWSER_PATH||(process.platform==='win32'&&fs.existsSync(edge)?edge:undefined);
let browser,page;
const errors=[],external=[],sent=[],timings=[];
try{
  browser=await chromium.launch({headless:true,executablePath});
  page=await browser.newPage({viewport:{width:1360,height:1000}});
  // The pilot must work even when the browser forbids persistent feedback storage.
  await page.addInitScript(()=>{
    for(const name of ['localStorage','sessionStorage','indexedDB']){
      Object.defineProperty(window,name,{configurable:true,get(){throw new Error('PBIS no debe acceder a '+name);}});
    }
  });
  page.setDefaultTimeout(15000);
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',async route=>{
    const request=route.request();
    const url=new URL(request.url());
    if(url.origin===origin||url.protocol==='file:'){await route.continue();return;}
    if(request.url()==='https://formspree.io/f/mvkgydrn'){
      sent.push(request.postDataJSON());
      await route.fulfill({status:sent.length===1?503:200,contentType:'application/json',body:JSON.stringify({ok:sent.length!==1})});
    }else{external.push(request.url());await route.abort();}
  });
  const appUrl=origin+'/PBIS.html';
  if(process.env.PBIS_TEST_SITE){
    await page.goto(origin+'/index.html');
    assert.ok(await page.locator('img.report-screenshot').evaluate(image=>image.complete&&image.naturalWidth>0));
    fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
    await page.screenshot({path:path.join(root,'test-results/static-home.png'),fullPage:true});
    assert.ok((await page.locator('a[href^="downloads/"]').evaluateAll(links=>links.map(link=>link.getAttribute('href')))).every(href=>href==='downloads/PBIS.zip'));
    for(const width of [1360,390,320]){
      await page.setViewportSize({width,height:1000});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'portal '+width);
    }
    await page.goto(origin+'/docs/guia.html#privacidad');
    await page.locator('#privacidad').waitFor();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'guía móvil');
    await page.setViewportSize({width:1360,height:1000});
    await page.goto(origin+'/DEMO.html?entrada=antigua#guia');
    await page.waitForURL('**/app.html?entrada=antigua#guia');
  }
  const profiles=JSON.parse(fs.readFileSync(path.join(root,'data/profiles.json'),'utf8'));
  async function login(account){
    await page.locator('#username').fill(account.username);
    await page.locator('#password').fill(account.password);
    await page.locator('#login-form button[type=submit]').click();
    await page.locator('#logout').waitFor();
  }
  const step=async n=>page.waitForFunction(n=>document.querySelector('#tour-panel')?.innerText.includes(n+' de 16'),n);
  await page.goto(appUrl);
  await page.locator('#start-tour-login').click();await step(1);
  await login({username:'demo',password:'DEMO26'});await step(2);
  await page.locator('#load-demo').click();await step(3);
  await page.locator('#center').selectOption('Centro 3705');
  await page.locator('#course').selectOption('1.º ESO');
  await page.locator('#group').selectOption('A');await step(4);
  await page.locator('#tab-roster').click();await step(5);
  await page.locator('[data-roster-sort="bullying_peers"]').click();
  if(!(await page.locator('#tour-panel').innerText()).includes('6 de 16'))await page.locator('[data-roster-sort="bullying_peers"]').click();
  await step(6);
  await page.locator('tr[data-student-id="00280"] td:nth-child(3) [data-roster-open]').click();
  await page.locator('[data-student-id="00280"][data-indicator="bullying_peers"][data-roster-reaction="sorpresa"]').click();await step(7);
  await page.locator('#tour-action').click();await step(8);
  await page.locator('.student-link[data-student-id="00253"]').click();await step(9);
  for(const n of [10,11,12]){await page.locator('#tour-action').click();await step(n);}
  await page.locator('.expanded-details>summary').click();await step(13);
  await page.locator('#tour-action').click();await step(14);
  await page.locator('#tour-action').click();await step(15);
  await page.locator('[data-roster-confidence][data-student-id="00253"]').press('ArrowRight');await step(16);
  await page.locator('#logout').click();
  assert.match(await page.locator('body').innerText(),/Práctica completada/);
  assert.equal(sent.length,0,'La demo no debe enviar valoraciones.');

  // The embedded demo includes actual directed relationships, unlike the
  // legacy indicators workbook below, which only supplies aggregate counts.
  await page.goto(appUrl);await login({username:'demo',password:'DEMO26'});
  await page.locator('#load-demo').click();
  await page.locator('#tour-skip').click();await page.locator('#tour-skip').click();
  await page.locator('#center').selectOption('Centro 3705');
  await page.locator('#course').selectOption('1.º ESO');await page.locator('#group').selectOption('A');
  for(const width of [1360,390,320]){
    await page.setViewportSize({width,height:1000});await page.locator('#tab-group').click();
    await page.locator('.expanded-details>summary').click();
    const panel=page.locator('.class-network'),toggle=panel.locator('[data-class-network-layout-toggle]');
    const signature=()=>panel.locator('[data-class-from]').evaluateAll(edges=>edges.map(edge=>[edge.dataset.classFrom,edge.dataset.classTo,edge.getAttribute('stroke-width'),edge.getAttribute('marker-end')]));
    const before=await signature();assert.ok(before.length>0,'La demo debe dibujar vínculos reales.');
    assert.ok(await panel.locator('.network-amistad').count()>0);assert.ok(await panel.locator('.network-rechazo').count()>0);
    await toggle.click();assert.deepEqual(await signature(),before);
    assert.ok(await panel.locator('.class-network-community').count()>1);
    const fills=await panel.locator('.class-network-cluster-node circle').evaluateAll(nodes=>nodes.map(node=>node.style.fill));
    assert.ok(new Set(fills).size>1,'Las comunidades deben usar colores diferentes.');
    await panel.locator('[data-class-network-highlight]').selectOption('00253');
    assert.ok(await panel.locator('.class-network-edge.is-highlighted').count()>0);
    assert.equal(await panel.locator('.class-network-node.is-selected').getAttribute('data-class-student'),'00253');
    await toggle.click();await toggle.click();assert.deepEqual(await signature(),before);
    assert.equal(await panel.locator('[data-class-network-highlight]').inputValue(),'00253');
    await panel.locator('[data-class-network-highlight]').selectOption('');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'red de demo '+width);
    fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
    await panel.screenshot({path:path.join(root,`test-results/demo-community-network-${width}.png`)});
    await panel.locator('[data-class-student="00253"]').click();
    assert.equal(await page.locator('#tab-student').getAttribute('aria-selected'),'true');
  }
  await page.setViewportSize({width:1360,height:1000});await page.locator('#logout').click();
  assert.equal(sent.length,0,'Explorar las comunidades de la demo no debe enviar información.');

  for(const account of profiles){
    await page.goto(appUrl);await login(account);
    assert.equal(await page.locator('#open-accounts').count(),account.role==='orientador'?1:0);
    assert.equal(await page.locator('#tab-center').count(),account.role==='orientador'?1:0);
    if(account.username==='tutoria1eso'){
      await page.locator('#file-data').setInputFiles(path.join(root,'data/examples/datos_evaluacion.xlsx'));
      await page.locator('#sheet-data').selectOption('Datos');await page.locator('#show-reports').click();
      assert.deepEqual(await page.locator('#course option').allTextContents(),['1.º ESO']);
      assert.equal(await page.locator('#center option').count(),2);
      await page.locator('#change-files').click();
      await page.locator('#file-data').setInputFiles({name:'incorrecto.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:Buffer.from('sin columnas de encuesta')});
      await page.locator('#report-content .empty-state').waitFor({state:'attached'});
      assert.equal(await page.locator('#report-content .report').count(),0);
    }
    await page.locator('#logout').click();await page.locator('#login-form').waitFor();
  }
  await login(profiles.find(row=>row.username==='orientacion'));
  await page.locator('#file-data').setInputFiles(path.join(root,'data/examples/datos_evaluacion.xlsx'));
  await page.locator('#sheet-data').selectOption('Datos');
  await page.locator('#show-reports').click();
  for(const width of [1360,390,320]){
    await page.setViewportSize({width,height:1000});
    for(const view of ['center','group','roster','student']){
      const start=performance.now();await page.locator('#tab-'+view).click();
      await page.locator('#report-content .report').waitFor();
      timings.push({width,view,milliseconds:Math.round(performance.now()-start)});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),view+' '+width);
      if(view==='group'){
        await page.locator('.expanded-details>summary').click();
        const panel=page.locator('.class-network'),toggle=panel.locator('[data-class-network-layout-toggle]');
        const edges=()=>panel.locator('[data-class-from]').evaluateAll(items=>items.map(item=>[item.dataset.classFrom,item.dataset.classTo,item.getAttribute('stroke-width'),item.getAttribute('marker-end')]));
        const before=await edges(),students=await panel.locator('[data-class-student]').count();
        const selected=await panel.locator('[data-class-student]').first().getAttribute('data-class-student');
        await panel.locator('[data-class-network-highlight]').selectOption(selected);
        await panel.locator('[data-network-zoom="in"]').click();
        await toggle.click();
        assert.equal(await toggle.getAttribute('aria-pressed'),'true');
        assert.equal(await toggle.innerText(),'Ver círculo');
        assert.equal(await panel.locator('.class-network-clusters').count(),1);
        assert.equal(await panel.locator('[data-class-student]').count(),students);
        assert.deepEqual(await edges(),before);
        assert.equal(await panel.locator('[data-class-network-highlight]').inputValue(),selected);
        assert.equal(await panel.locator('.class-network-node.is-selected').getAttribute('data-class-student'),selected);
        assert.equal(await panel.locator('.student-network-scroll').getAttribute('data-network-scale'),'1');
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'comunidades '+width);
        await panel.locator('[data-class-network-highlight]').selectOption('');
        fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
        await panel.screenshot({path:path.join(root,`test-results/community-network-${width}.png`)});
        await toggle.click();assert.equal(await panel.locator('.class-network-ring').count(),1);
        assert.deepEqual(await edges(),before);
        await toggle.focus();await page.keyboard.press('Enter');
        assert.equal(await toggle.getAttribute('aria-pressed'),'true');
        await panel.locator('[data-class-student]').first().click();
        assert.equal(await page.locator('#tab-student').getAttribute('aria-selected'),'true');
      }
    }
  }
  await page.setViewportSize({width:1360,height:1000});await page.locator('#tab-roster').click();
  await page.locator('#open-feedback').click();
  await page.locator('#feedback-comment').fill('Borrador de prueba: falta una explicación de la cobertura.');
  await page.locator('#feedback-close').click();
  assert.match(await page.locator('#review-pending-state').innerText(),/opiniones sin añadir/);
  await page.locator('#logout').click();
  assert.equal(await page.locator('#review-preview-send').isDisabled(),true);
  assert.equal(sent.length,0);
  for(const width of [390,320]){
    await page.setViewportSize({width,height:1000});
    assert.ok(await page.locator('#review-send-dialog').evaluate(dialog=>dialog.scrollWidth<=dialog.clientWidth+1),'revisión móvil '+width);
    if(width===320)await page.screenshot({path:path.join(root,'test-results/auditoria-feedback-mobile.png')});
  }
  await page.locator('#review-draft-open').click();
  assert.match(await page.locator('#feedback-comment').inputValue(),/Borrador de prueba/);
  await page.locator('input[name="feedback-rating"][value="4"]').check();
  await page.locator('#feedback-send').click();await page.locator('#feedback-close').click();
  await page.setViewportSize({width:1360,height:1000});
  const opener=page.locator('[data-roster-open]').first();
  const cell=opener.locator('..');
  assert.equal(await cell.locator('.reaction-group').isVisible(),false);
  await opener.click();await cell.locator('[data-roster-reaction="sorpresa"]').click();
  assert.equal(await cell.locator('.review-current').innerText(),'Me sorprende');
  await page.locator('#review-send-preview').click();
  assert.match(await page.locator('#review-preview-content').innerText(),/orientacion/);
  await page.screenshot({path:path.join(root,'test-results/auditoria-feedback-desktop.png')});
  await page.locator('#review-preview-close').click();
  await page.locator('#logout').click();
  assert.equal(sent.length,0,'Cerrar solicita revisión, sin enviar automáticamente.');
  await page.locator('#review-preview-send').click();
  await page.waitForFunction(()=>document.querySelector('#close-status')?.innerText.includes('Formspree no ha confirmado'));
  assert.equal(await page.locator('#report-content .report').count(),1);
  await page.locator('#review-send-preview').click();
  const downloadWait=page.waitForEvent('download');await page.locator('#review-preview-save').click();
  const download=await downloadWait;const saved=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
  assert.deepEqual(saved,JSON.parse(sent[0].feedback_json));
  await page.locator('#review-preview-send').focus();await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.querySelector('#close-status')?.innerText.includes('confirmado el registro'));
  assert.equal(await page.locator('#report-content .report').count(),1,'El envío confirmado permite seguir consultando.');
  assert.equal(await page.locator('#review-pending-state').count(),0);
  await page.locator('#logout').click();await page.locator('#login-form').waitFor();
  assert.equal(sent.length,2);assert.deepEqual(sent[0],sent[1],'El reintento debe conservar el lote.');
  assert.equal(await page.locator('#report-content').count(),0);

  const offlineWorkers=[];
  page.on('worker',worker=>offlineWorkers.push(worker.url()));
  await page.context().setOffline(true);
  const offlineApp=process.env.PBIS_TEST_OFFLINE_APP?path.resolve(process.env.PBIS_TEST_OFFLINE_APP):path.join(root,'release/PBIS.html');
  await page.goto(pathToFileURL(offlineApp).href);
  await login({username:'demo',password:'DEMO26'});await page.locator('#load-demo').click();
  await page.locator('#tour-skip').click();await page.locator('#tour-skip').click();
  await page.locator('#tab-group').click();assert.equal(await page.locator('#report-content .report').count(),1);
  await page.locator('#logout').click();await page.locator('#login-form').waitFor();
  await login(profiles.find(row=>row.username==='orientacion'));
  await page.locator('#file-data').setInputFiles({name:'prueba.pbis',mimeType:'application/octet-stream',buffer:fs.readFileSync(path.join(root,'data/examples/datos_evaluacion.xlsx'))});
  await page.locator('#sheet-data').selectOption('Datos');await page.locator('#show-reports').click();
  await page.locator('#tab-roster').click();await page.locator('#report-content .report').waitFor();
  assert.ok(await page.locator('tr[data-student-id]').count()>0);
  assert.ok(offlineWorkers.length>0&&offlineWorkers.every(url=>url.startsWith('blob:')),'file:// must parse Excel in an embedded Blob worker while offline.');
  await page.locator('#tab-group').click();await page.locator('.expanded-details>summary').click();
  await page.locator('[data-class-network-layout-toggle]').click();
  assert.equal(await page.locator('.class-network-clusters').count(),1);
  await page.locator('#logout').click();await page.locator('#login-form').waitFor();
  assert.equal(sent.length,2);
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
  const result={passed:true,browser:await browser.version(),platform:process.platform,guideSteps:16,profiles:profiles.length,widths:[1360,390,320],offlineImport:'file:// + .pbis + worker Blob, red desconectada',feedback:'interceptado: fallo y reintento; ningún envío real',timings};
  fs.writeFileSync(path.join(root,'test-results/e2e.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result));
}catch(error){
  fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
  await page?.screenshot({path:path.join(root,'test-results/e2e-failure.png'),fullPage:true}).catch(()=>{});
  throw error;
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
