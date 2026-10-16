const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const C=require('../src/core.js');
test('context separates nonresponse, unknown and observed zero without altering input',()=>{
 const rows=[{ID:'1',Centro:'C',Curso:'ESO',Grupo:'A',respondio:'Sí',felicidad:0,ambito_nominaciones:'centro'},{ID:'2',Centro:'C',Curso:'ESO',Grupo:'A',respondio:'No'},{ID:'3',Centro:'C',Curso:'ESO',Grupo:'A',respondio:null}];
 const copy=JSON.stringify(rows),info=C.consultationContext(rows,[{Centro:'C',Curso:'ESO',Grupo:'A',Periodo:'Octubre 2026'},{Centro:'Otro',Curso:'ESO',Grupo:'A',Periodo:'No debe aparecer'}]);
 assert.deepEqual(info,{total:3,answered:1,unanswered:1,unknown:1,periods:['Octubre 2026'],undatedClasses:0,nominationScope:'centro'});
 assert.equal(JSON.stringify(rows),copy);assert.equal(rows[0].felicidad,0);
});
test('missing dates and mixed scopes stay explicit instead of borrowing a neighbouring class date',()=>{
 const rows=[{Campus:'C',Curso:'ESO',Grupo:'A',respondio:'Sí',ambito_nominaciones:'centro'},{Campus:'C',Curso:'ESO',Grupo:'B',respondio:'Sí',ambito_nominaciones:'clase'}];
 const info=C.consultationContext(rows,[{Campus:'C',Curso:'ESO',Grupo:'B',Periodo:'2026'}]);
 assert.equal(info.undatedClasses,1);assert.deepEqual(info.periods,['2026']);assert.equal(info.nominationScope,'archivo');
 assert.deepEqual(C.consultationContext(rows,[]).periods,[]);
});
test('wellbeing colours do not impose undocumented risk thresholds',()=>{
 const source=fs.readFileSync(require.resolve('../src/app.js'),'utf8');
 const body=source.slice(source.indexOf('function cellTone('),source.indexOf('function classCell('));
 const tone=new Function(body+';return cellTone;')();
 for(const value of [0,1,3.4,5,6.7,10])assert.equal(tone(value,'happiness'),'tone-neutral');
 assert.equal(tone(null,'happiness'),'tone-missing');assert.notEqual(tone(0,'peer'),'tone-danger');assert.notEqual(tone('No','self'),'tone-danger');
});
