const W=require('../src/raw-wave1.js'),C=require('../src/core.js');
function data(){
 const stamp='2026-10-01 10:00:00 -> ';
 const rows=Array.from({length:6},(_,i)=>({'Usuario Id':'S'+(i+1),'Alumno Id':'TEST'+(i+1),Estudio:'4826',Curso:'1.º ESO',Grupo:i<3?'A':'B',dia:stamp+'Par',start:'2026-10-01',end:'2026-10-01',egeneral:stamp,general:stamp+'Siempre',efun:stamp,fun:stamp+'Casi siempre',ealone:stamp,alone:stamp+'Casi nunca',ebullying:stamp,bullying:stamp+'Nadie',emediador:stamp,mediador:stamp+'S1 (Buena mediación)',eredes1:stamp,redes1:stamp+Array.from({length:6},(_,j)=>j!==i?'S'+(j+1)+' (Buena relación)':null).filter(Boolean).join(' | '),ebeliefs1:stamp,beliefs1:stamp+'Nadie',carrera1:stamp+'2',emilia1:stamp+'Emilia',library1:stamp+'47',Nombre:i<3?'Ana':'Bruno',Apellidos:i<3?'Prueba A':'Oculto B'}));
 rows.forEach(r=>Object.assign(r,{eredes2:null,redes2:null,ebeliefs2:null,beliefs2:null,carrera2:null,emilia2:null,library2:null}));
 const converted=W.convert(rows);return C.validateAndJoin(converted.students,null,converted.groups);
}
module.exports={data};
