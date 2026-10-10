'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../src/app.js'),'utf8');
const start=source.indexOf('function importQualityNote(rows){'),end=source.indexOf('\nfunction centerReport(',start);
const note=new Function('number',source.slice(start,end)+'\nreturn importQualityNote;')(n=>Number(n).toLocaleString('es-ES'));
test('every report shares the filter note and does not attribute it to legacy calculated data',()=>{
 assert.equal(note([{}]),'');
 const html=note([{bullying_filtro_max_otros:15,bullying_filtro_excluidos_n:30}]);
 assert.match(html,/más de 15 personas, sin contar la autoselección/);assert.match(html,/30 respuestas excluidas en el centro/);assert.match(html,/autorreporte se conserva/);
 assert.match(note([{bullying_filtro_max_otros:15,bullying_filtro_excluidos_n:0}]),/0 respuestas excluidas/);
 assert.equal(note([{bullying_filtro_max_otros:15,bullying_filtro_excluidos_n:'<img onerror=alert(1)>'}]),'');
});
