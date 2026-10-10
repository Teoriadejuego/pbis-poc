'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const W=require('../src/raw-wave1.js'),C=require('../src/core.js');
const stamp='2026-10-01 10:00:00 -> ';
function fixture(){
 const base=(id,student,group,route)=>({'Usuario Id':id,'Alumno Id':student,Estudio:'9001',Curso:'1.º ESO',Grupo:group,dia:stamp+route,start:'2026-10-01',end:'2026-10-01',egeneral:stamp,general:stamp+'Siempre',efun:stamp,fun:stamp+'Casi siempre',ealone:stamp,alone:stamp+'Casi nunca',ebullying:stamp,emediador:stamp,mediador:stamp+'U1 (Buena mediación)',eredes1:stamp,redes1:null,eredes2:stamp,redes2:null,ebeliefs1:stamp,beliefs1:null,ebeliefs2:stamp,beliefs2:null,carrera1:null,carrera2:null,emilia1:null,emilia2:null,library1:null,library2:null,Nombre:null,Apellidos:null});
 const a=base('U1','A1','A','Par'),b=base('U2','A2','A','Impar'),c=base('U3','A3','B','Par');
 a.redes1=stamp+'U2 (Buena relación) | U3 (Buena relación)';
 b.redes2=stamp+'U1 (Buena relación) | U3 (Buena relación)';
 c.redes1=stamp+'U1 (Buena relación) | U2 (Buena relación)';
 a.beliefs1=stamp+'U2 (Buena relación)';a.bullying=stamp+'U1 | U3';b.bullying=stamp+'U3';
 a.carrera1=stamp+'2';a.emilia1=stamp+'Emilia';a.library1=stamp+'47';
 b.carrera2=stamp+'1';b.emilia2=stamp+'Se llama Emilia.';b.library2=stamp+'24';
 a.Nombre='Lucía';a.Apellidos='García López';return [a,b,c];
}
function bullyingFilterFixture(){
 const template=fixture()[0];
 return Array.from({length:18},(_,i)=>({...template,'Usuario Id':'U'+(i+1),'Alumno Id':'A'+(i+1),Grupo:i<9?'A':'B',Nombre:null,Apellidos:null,redes1:stamp+'Nadie',beliefs1:stamp+'Nadie',mediador:stamp+'Nadie',bullying:stamp+'Nadie'}));
}

test('admits self plus fifteen others, excludes self plus sixteen; summaries require two received',()=>{
 const rows=bullyingFilterFixture();
 rows[0].bullying=stamp+Array.from({length:16},(_,i)=>'U'+(i+1)).join(' | ');
 rows[1].bullying=stamp+Array.from({length:17},(_,i)=>'U'+(i+1)).join(' | ');
 rows[2].bullying=stamp+'U2 | U10';
 rows[17].bullying=stamp+'U2';
 const snapshot=structuredClone(rows),converted=W.convert(rows),joined=C.validateAndJoin(converted.students,null,converted.groups);
 assert.deepEqual(rows,snapshot,'Import must not alter the original ballots');
 assert.deepEqual(joined.students.map(r=>r.bullying_companeros_n),[0,3,1,1,1,1,1,1,1,2,1,1,1,1,1,1,0,0]);
 assert.deepEqual(joined.students.map(r=>r.bullying_autorreporte),['Sí','Sí',...Array(16).fill('No')]);
 assert.ok(joined.students.every(r=>r.bullying_filtro_max_otros===15&&r.bullying_filtro_excluidos_n===1&&r.bullying_filtro_admitidos_n===17));
 const center=C.aggregateCenter(joined.students).attention.find(m=>m.id==='bullying_companeros');
 assert.equal(center.count,2);assert.equal(center.denominator,18);assert.equal(center.percent,200/18);
 const groupA=C.aggregate(joined.students.filter(r=>r.Grupo==='A'),joined.groups).attention.find(m=>m.id==='bullying_companeros');
 const groupB=C.aggregate(joined.students.filter(r=>r.Grupo==='B'),joined.groups).attention.find(m=>m.id==='bullying_companeros');
 assert.equal(groupA.count,1,'Count includes the third nomination from another class');
 assert.equal(groupA.denominator,9);assert.equal(groupB.count,1,'Two received must enter the summary');
 assert.equal(groupB.denominator,9);assert.equal(groupB.percent,100/9);
 assert.equal(joined.students[1].bienestar_suma,10);assert.equal(joined.students[1].crt_aciertos,3);
});

test('fifteen without self is admitted, sixteen without self is excluded, self alone is not a peer nomination',()=>{
 const rows=bullyingFilterFixture();
 rows[0].bullying=stamp+rows.slice(1,16).map(r=>r['Usuario Id']).join(' | ');
 let students=W.convert(rows).students;
 assert.equal(students[1].bullying_companeros_n,1);assert.equal(students[0].bullying_autorreporte,'No');
 assert.equal(students[0].bullying_filtro_excluidos_n,0);
 rows[0].bullying+=' | U17';students=W.convert(rows).students;
 assert.equal(students[1].bullying_companeros_n,0);assert.equal(students[0].bullying_filtro_excluidos_n,1);
 rows[0].bullying=stamp+'U1';students=W.convert(rows).students;
 assert.equal(students[0].bullying_autorreporte,'Sí');assert.ok(students.every(r=>r.bullying_companeros_n===0));
});

test('bullying filter never caps incoming nominations or treats an unknown ballot as eligible',()=>{
 const rows=bullyingFilterFixture();
 rows[0].bullying=null;rows[0].mediador=null;
 for(const r of rows.slice(1))r.bullying=stamp+'U1';
 const students=W.convert(rows).students;
 assert.equal(students[0].bullying_companeros_n,17);
 assert.equal(students[0].bullying_autorreporte,null);
 assert.equal(students[0].bullying_filtro_admitidos_n,17);
 assert.equal(students[0].bullying_filtro_excluidos_n,0);
});

test('excluding every bullying ballot leaves incoming counts unknown and self-reports intact',()=>{
 const rows=bullyingFilterFixture();for(const r of rows)r.bullying=stamp+rows.map(x=>x['Usuario Id']).join(' | ');
 const converted=W.convert(rows),joined=C.validateAndJoin(converted.students,null,converted.groups);
 assert.ok(joined.students.every(r=>r.bullying_companeros_n===null&&r.bullying_autorreporte==='Sí'&&r.bullying_filtro_excluidos_n===18&&r.bullying_filtro_admitidos_n===0));
 const metrics=C.aggregateCenter(joined.students).attention;
 assert.equal(metrics.find(m=>m.id==='bullying_companeros').denominator,0);
 assert.equal(metrics.find(m=>m.id==='bullying_companeros').count,null);
 assert.equal(metrics.find(m=>m.id==='bullying_declarado').percent,100);
});

test('final Wave 1 calculates centre-wide nominations without confusing them with class size',()=>{
 const converted=W.convert(fixture()),key=converted.students.map(r=>({ID:r.ID,Nombre:r.Nombre}));
 const joined=C.validateAndJoin(converted.students,key,converted.groups);
 const a=joined.students.find(r=>r.ID==='U1'),b=joined.students.find(r=>r.ID==='U2'),c=joined.students.find(r=>r.ID==='U3');
 assert.equal(a.Nombre,'Lucía García López');assert.equal(b.Nombre,null);
 assert.equal(a.amistad_recibida_n,2);assert.equal(a.popularidad,10);assert.equal(a['.n_clase'],2);assert.equal(a.n_centro,3);
 assert.equal(c.amistad_recibida_n,2);assert.equal(a.amistad_reciproca_n,2);assert.equal(a.acierto_amistad,10);
 assert.equal(a.bienestar_suma,10);assert.equal(a.bienestar,8.3);assert.equal(a.bullying_autorreporte,'Sí');assert.equal(c.bullying_companeros_n,2);
 assert.equal(a.crt_aciertos,3);assert.equal(b.crt_aciertos,1);assert.equal(c.crt_aciertos,null);
 const group=C.aggregate(joined.students.filter(r=>r.Grupo==='A'),joined.groups);
 assert.equal(group.attention.find(x=>x.id==='densidad_rechazo').denominator,4);
});
test('CRT uses the route-specific three answers, preserves zero and incomplete as missing',()=>{
 const rows=fixture();rows[0].carrera1=stamp+'1';rows[0].emilia1=stamp+'Junio';rows[0].library1=stamp+'24';
 rows[0].carrera2=stamp+'2';rows[0].emilia2=stamp+'Emilia';rows[0].library2=stamp+'47';
 let out=W.convert(rows).students;
 assert.equal(out[0].crt_aciertos,0,'La ruta Par no debe leer las columnas Impar');
 assert.equal(out[1].crt_aciertos,1);
 rows[1].library2=null;out=W.convert(rows).students;
 assert.equal(out[1].crt_aciertos,null,'Falta una respuesta: no debe figurar 0 ni 1');
 assert.throws(()=>C.validateAndJoin([{...out[0],crt_aciertos:4},...out.slice(1)],out.map(x=>({ID:x.ID,Nombre:x.Nombre})),W.convert(rows).groups),/crt_aciertos/);
});
test('mediation counts distinct recipients of positive and negative nominations separately',()=>{
 const rows=fixture();
 rows[0].mediador=stamp+'U2 (Muy buena mediación)';
 rows[1].mediador=stamp+'U1 (Buena mediación)';
 rows[2].mediador=stamp+'U1 (Muy mala mediación) | U3 (Mala mediación)';
 const converted=W.convert(rows),joined=C.validateAndJoin(converted.students,null,converted.groups);
 const one=joined.students.find(row=>row.ID==='U1'),three=joined.students.find(row=>row.ID==='U3');
 assert.equal(one.mediacion_n,1);
 assert.equal(one.mediacion_negativa_n,1);
 assert.equal(three.mediacion_negativa_n,0,'La autonominación no cuenta');
 const center=C.aggregateCenter(joined.students);
 assert.equal(center.mediators.count,2);
 assert.equal(center.negativeMediators.count,1);
 assert.equal(center.negativeMediators.denominator,3);
 const group=C.aggregate(joined.students.filter(row=>row.Grupo==='A'),joined.groups);
 assert.equal(group.mediators.count,2);
 assert.equal(group.negativeMediators.count,1);
});
test('older calculated sheets without negative mediation retain an unknown result',()=>{
 const converted=W.convert(fixture());
 const legacy=converted.students.map(row=>{const copy={...row};delete copy.mediacion_negativa_n;return copy;});
 const joined=C.validateAndJoin(legacy,null,converted.groups);
 const center=C.aggregateCenter(joined.students);
 assert.equal(center.mediators.count,null);
 assert.equal(center.negativeMediators.count,null);
 assert.equal(center.negativeMediators.denominator,0);
});
test('missing question event is unknown; an answered empty list means zero',()=>{
 const rows=fixture();rows[1].eredes2=null;rows[1].redes2=null;rows[2].bullying=null;
 const out=W.convert(rows).students,one=out.find(x=>x.ID==='U2'),three=out.find(x=>x.ID==='U3');
 assert.equal(one.amistad_declarada_n,null);assert.equal(one.amistad_reciproca_n,null);assert.equal(three.bullying_autorreporte,'No');
 assert.ok(W.convert(rows).warnings.length);
});
test('partial networks produce observed provisional measures and exact missing-response coverage',()=>{
 const rows=fixture();rows[2].eredes1=null;rows[2].redes1=null;
 const converted=W.convert(rows),joined=C.validateAndJoin(converted.students,null,converted.groups);
 const a=joined.students.find(row=>row.ID==='U1'),c=joined.students.find(row=>row.ID==='U3');
 assert.equal(a.red_centro_pendiente_pct,33.3);
 assert.equal(a.amistad_reciproca_n,1);
 assert.equal(a.reciprocidad_amistad,5);
 assert.equal(a.pred_amistad_aciertos,1);
 assert.equal(a.acierto_amistad,10);
 assert.equal(c.amistad_declarada_n,null);
 assert.equal(c.reciprocidad_amistad,null);
 assert.equal(typeof a.centralidad,'number');
 const group=converted.groups.find(row=>row.Grupo==='A');
 assert.equal(group.red_centro_pendiente_pct,33.3);
 assert.equal(typeof group.pos_desigualdad,'number');
 assert.equal(typeof group.pos_separacion,'number');
});
test('duplicate IDs, unknown targets and invalid categories fail before any report is shown',()=>{
 const duplicate=fixture();duplicate[1]['Usuario Id']='U1';assert.throws(()=>W.convert(duplicate),/duplicado/);
 const missing=fixture();missing[0].redes1=stamp+'NO_EXISTE (Buena relación)';assert.throws(()=>W.convert(missing),/no existe/);
 const invalid=fixture();invalid[0].redes1=stamp+'U2 (Indiferente)';assert.throws(()=>W.convert(invalid),/Categoría/);
});
test('optional name columns accept lowercase headers and reject a lone surname column',()=>{
 const rows=fixture();for(const row of rows){row.nombre=row.Nombre;row.apellidos=row.Apellidos;delete row.Nombre;delete row.Apellidos;}
 assert.equal(W.convert(rows).students[0].Nombre,'Lucía García López');
 delete rows[0].nombre;delete rows[1].nombre;delete rows[2].nombre;
 assert.throws(()=>W.convert(rows),/Nombre y Apellidos/);
});
test('individual network keeps direction, positive/negative type and the two declared intensity levels',()=>{
 const rows=fixture();
 rows[0].redes1=stamp+'U2 (Muy buena relación) | U3 (Mala relación)';
 rows[1].redes2=stamp+'U1 (Muy mala relación) | U3 (Buena relación)';
 const converted=W.convert(rows),joined=C.validateAndJoin(converted.students,null,converted.groups);
 const network=C.studentNetwork(joined.students,'U1');
 assert.equal(network.available,true);
 assert.equal(network.neighbors.length,2);
 assert.deepEqual(network.edges.filter(edge=>edge.from==='U1').map(edge=>[edge.to,edge.tipo,edge.intensidad]),[['U2','amistad',2],['U3','rechazo',1]]);
 assert.deepEqual(network.edges.filter(edge=>edge.to==='U1').map(edge=>[edge.from,edge.tipo,edge.intensidad]),[['U2','rechazo',2],['U3','amistad',1]]);
 const tutorView=C.studentNetwork(joined.students.filter(row=>row.Grupo==='A'),'U1');
 assert.deepEqual(tutorView.neighbors.map(row=>row.ID),['U2']);
 assert.equal(tutorView.edges.length,2,'El perfil de clase no debe mostrar vínculos de otro grupo');
 const corrupted=converted.students.map(row=>({...row}));
 corrupted[0].relaciones_red=[{...corrupted[0].relaciones_red[0],tipo:'desconocido'},...corrupted[0].relaciones_red.slice(1)];
 assert.throws(()=>C.validateAndJoin(corrupted,null,converted.groups),/tipo o intensidad/);
});
test('bullying needs an explicit list or a later answer, never just an entry timestamp',()=>{
 const rows=fixture(),r=rows[2];r.bullying=null;r.mediador=null;
 assert.equal(W.convert(rows).students[2].bullying_autorreporte,null);
 for(const later of ['fqbullying','stopbullying','conductas','mediador']){
   r[later]=stamp.trim();assert.equal(W.convert(rows).students[2].bullying_autorreporte,null);
   r[later]=stamp+(later==='mediador'?'Nadie':'Respuesta posterior');
   assert.equal(W.convert(rows).students[2].bullying_autorreporte,'No');r[later]=null;
 }
 r.ebullying=null;r.bullying=stamp+'Nadie';assert.equal(W.convert(rows).students[2].bullying_autorreporte,'No');
 r.bullying=stamp+'U3';assert.equal(W.convert(rows).students[2].bullying_autorreporte,'Sí');
 r.bullying=stamp+'U1';assert.equal(W.convert(rows).students[2].bullying_autorreporte,'No');
});
test('explicit responses still count when entry and session timestamps are absent',()=>{
 const rows=fixture(),r=rows[0];
 for(const field of ['start','end','eredes1','ebeliefs1','egeneral','efun','ealone','emediador','ebullying'])r[field]=null;
 const converted=W.convert(rows),joined=C.validateAndJoin(converted.students,null,converted.groups),one=joined.students[0];
 assert.equal(one.amistad_declarada_n,2);assert.equal(one.bienestar_suma,10);assert.equal(one.respondio,null);
 const measure=C.aggregateCenter(joined.students).attention.find(m=>m.id==='bullying_declarado');
 assert.equal(measure.count,1);assert.equal(measure.denominator,3);
});
test('export relationship errors invalidate only the affected questions and preserve other measures',()=>{
 const rows=fixture();rows[0].redes1=stamp+'U2 (Buena relación) | U3 (Error en relación)';
 rows[0].beliefs1=stamp+'U2 (Error en relación)';rows[0].mediador=stamp+'U2 (Error en relación)';
 const converted=W.convert(rows),joined=C.validateAndJoin(converted.students,null,converted.groups),one=joined.students[0];
 assert.deepEqual(one.incidencias_calculo,['relaciones','predicciones','mediación']);
 assert.equal(one.amistad_declarada_n,null);assert.equal(one.rechazo_declarado_n,null);assert.equal(one.relaciones_red,null);
 assert.equal(one.pred_amistad_n,null);assert.equal(one.identifica_apoyo,null);
 assert.equal(one.amistad_recibida_n,2);assert.equal(joined.students[1].amistad_recibida_n,1);
 assert.equal(one.bienestar_suma,10);assert.equal(one.crt_aciertos,3);assert.equal(one.bullying_autorreporte,'Sí');
 assert.equal(one.red_centro_pendiente_pct,33.3);
 assert.ok(converted.warnings.some(w=>w.includes('3 respuestas contienen «Error en relación»')));
});
test('an unconfirmed empty bullying answer is excluded from the percentage denominator',()=>{
 const rows=fixture();rows[2].bullying=null;rows[2].mediador=null;
 const converted=W.convert(rows),joined=C.validateAndJoin(converted.students,null,converted.groups);
 const rate=C.aggregateCenter(joined.students).attention.find(m=>m.id==='bullying_declarado');
 assert.equal(rate.count,1);assert.equal(rate.denominator,2);assert.equal(rate.percent,50);
});
test('centrality converges when two disconnected components have nearly equal eigenvalues',()=>{
 const template=fixture()[0],size=25;
 const rows=Array.from({length:2*size},(_,i)=>({...template,'Usuario Id':'X'+i,'Alumno Id':'A'+i,Grupo:i<size?'A':'B',Nombre:null,Apellidos:null,mediador:stamp+'Nadie',bullying:stamp+'Nadie',beliefs1:null}));
 for(let i=0;i<rows.length;i++)rows[i].redes1=stamp+rows.filter((r,j)=>j!==i&&r.Grupo===rows[i].Grupo&&!((i===size&&j===size+1)||(i===size+1&&j===size))).map(r=>r['Usuario Id']+' (Buena relación)').join(' | ');
 const out=W.convert(rows).students,vec=out.map(r=>r.centralidad_eigenvector);
 assert.ok(out.every(r=>!r.centralidad_sin_convergencia));
 assert.ok(vec.slice(0,size).every(v=>Math.abs(v-1)<1e-8));
 assert.ok(vec.slice(size).every(v=>v<1e-5),'The weaker component must not retain the initial mixture');
 const product=rows.map((r,i)=>rows.reduce((sum,s,j)=>sum+(i!==j&&r.Grupo===s.Grupo&&!((i===size&&j===size+1)||(i===size+1&&j===size))?vec[j]:0),0));
 const residual=Math.max(...product.map((value,i)=>Math.abs(value-(size-1)*vec[i])));
 assert.ok(residual<1e-6);
});

test('Wave 1 preserves PDC group labels and normalizes compact ESO course notation',()=>{
 const rows=fixture();Object.assign(rows[0],{Curso:'3ºESO',Grupo:'PDCI'});Object.assign(rows[1],{Curso:'3º ESO',Grupo:'A'});Object.assign(rows[2],{Curso:'4º ESO',Grupo:'PDC II'});
 const converted=W.convert(rows),students=C.validateAndJoin(converted.students,null,converted.groups).students;
 assert.equal(students[0].Curso,'3.º ESO');assert.equal(students[0].Grupo,'PDCI');
 assert.equal(students[2].Curso,'4.º ESO');assert.equal(students[2].Grupo,'PDC II');
 assert.deepEqual(C.scopeRows(students,{role:'tutor',course:'3.º ESO',group:'PDC I'}).map(r=>r.ID),['U1']);
 assert.deepEqual(C.scopeRows(students,{role:'tutor',course:'4.º ESO',group:'PDC II'}).map(r=>r.ID),['U3']);
});
