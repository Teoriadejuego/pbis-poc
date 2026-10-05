import fs from 'node:fs/promises';
const target=new URL('../data/fixtures.json',import.meta.url);
const fixture=JSON.parse(await fs.readFile(target,'utf8'));
for(const row of fixture.students){
  const total=Number(row.bienestar_suma);
  if(!Number.isInteger(total)||total<0||total>12)throw Error('Suma de felicidad de ejemplo no válida');
  const base=Math.floor(total/3),remainder=total%3;
  row.felicidad_centro=base+(remainder>0?1:0);
  row.felicidad_diversion=base+(remainder>1?1:0);
  row.felicidad_soledad=4-base;
  if(row.felicidad_centro+row.felicidad_diversion+4-row.felicidad_soledad!==total)throw Error('Descomposición incorrecta');
}
await fs.writeFile(target,JSON.stringify(fixture));
console.log(`Ejemplo local preparado: ${fixture.students.length} respuestas sintéticas de tres preguntas.`);
