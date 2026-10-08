'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const C=require('../src/core.js');

const source=fs.readFileSync(path.join(__dirname,'..','src','app.js'),'utf8');
const start=source.indexOf('function studentNetworkSection(network){');
const end=source.indexOf('\nfor(const event of ',start);
assert(start>=0&&end>start,'No se encontró el diagrama individual');
const render=new Function('E',`${source.slice(start,end)}\nreturn studentNetworkSection;`)(C.escapeHtml);

test('network view draws all nominated directions and maps survey intensity to line thickness',()=>{
 const selected={ID:'U1',Nombre:'Ana A. B.'},peer={ID:'U2',Nombre:'Leo <script>'};
 const html=render({selected,neighbors:[peer],edges:[
   {from:'U1',to:'U2',tipo:'amistad',intensidad:2},
   {from:'U2',to:'U1',tipo:'rechazo',intensidad:1}
 ],available:true,outgoingKnown:true,respondents:2,visibleCount:2});
 assert.match(html,/Red de relaciones/);
 assert.match(html,/<svg[^>]+role="img"/);
 assert.match(html,/network-edge network-amistad[^>]+stroke-width="5"/);
 assert.match(html,/network-edge network-rechazo[^>]+stroke-width="2\.5"/);
 assert.match(html,/Nombra a esta persona: muy buena relación/);
 assert.match(html,/Esta persona le nombra: mala relación/);
 assert.match(html,/Leo &lt;script&gt;/);
 assert.doesNotMatch(html,/<script>/);
});

test('network view explains unavailable relationship data instead of inventing edges',()=>{
 const base={selected:{ID:'U1',Nombre:null},neighbors:[],edges:[],outgoingKnown:false,respondents:0,visibleCount:2};
 assert.match(render({...base,available:false}),/solo contiene recuentos/);
 assert.doesNotMatch(render({...base,available:false}),/<svg/);
 assert.match(render({...base,available:true}),/No se han observado nominaciones/);
});
