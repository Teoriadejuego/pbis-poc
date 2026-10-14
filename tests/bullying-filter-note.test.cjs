'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../src/app.js'),'utf8');
const start=source.indexOf('function importQualityNote(rows){'),end=source.indexOf('\nfunction centerReport(',start);
const note=new Function('number',source.slice(start,end)+'\nreturn importQualityNote;')(n=>Number(n).toLocaleString('es-ES'));
test('reports do not display a methodological note about excluded nominations',()=>{
 assert.equal(note([{}]),'');
 assert.equal(note([{bullying_filtro_max_otros:15,bullying_filtro_excluidos_n:30}]),'');
 assert.equal(note([{bullying_filtro_max_otros:15,bullying_filtro_excluidos_n:0}]),'');
 assert.equal(note([{bullying_filtro_max_otros:15,bullying_filtro_excluidos_n:'<img onerror=alert(1)>'}]),'');
});

test('actual import errors and unavailable centrality still have their own warnings',()=>{
 const html=note([{bullying_filtro_max_otros:15,bullying_filtro_excluidos_n:30,incidencias_calculo:['relaciones'],centralidad_sin_convergencia:true}]);
 assert.match(html,/Error en relación/);assert.match(html,/centralidad no se ha estabilizado/);
 assert.doesNotMatch(html,/nominaciones|excluid|autoselección/);
});
