/* Class-only view of observed, directed relationships. No metrics are recalculated. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./core.js'));
  else root.PbisClassNetwork=factory(root.PbisCore);
})(typeof window==='undefined'?globalThis:window,function(C){
  'use strict';
  const E=C.escapeHtml;
  const label=row=>C.displayName(row.Nombre)||String(row.ID);
  const key=row=>JSON.stringify([row.Campus||row.Centro,row.Curso,row.Grupo]);
  const popularity=row=>typeof row.amistad_recibida_n==='number'&&Number.isFinite(row.amistad_recibida_n)?row.amistad_recibida_n:null;
  const answered=row=>row.respondio!=='No'&&Array.isArray(row.relaciones_red);
  const fixed=value=>Number(value.toFixed(2));
  function model(rows){
    const first=rows[0];
    const students=[...new Map(rows.filter(row=>key(row)===key(first)).map(row=>[row.ID,row])).values()];
    students.sort((a,b)=>(popularity(b)??-1)-(popularity(a)??-1)||label(a).localeCompare(label(b),'es')||String(a.ID).localeCompare(String(b.ID),'es',{numeric:true}));
    const ids=new Set(students.map(row=>row.ID)),edges=new Map(),outside=new Set();
    for(const row of students)for(const link of answered(row)?row.relaciones_red:[]){
      if(link.id===row.ID||!['amistad','rechazo'].includes(link.tipo)||![1,2].includes(link.intensidad))continue;
      const edgeKey=JSON.stringify([row.ID,link.id,link.tipo]);
      if(!ids.has(link.id)){outside.add(edgeKey);continue;}
      const previous=edges.get(edgeKey);
      if(!previous||previous.intensidad<link.intensidad)edges.set(edgeKey,{from:row.ID,to:link.id,tipo:link.tipo,intensidad:link.intensidad});
    }
    return {students,edges:[...edges.values()],outside:outside.size,
      respondents:students.filter(answered).length,
      scope:students.some(row=>row.ambito_nominaciones==='centro')?'centro':'archivo'};
  }
  function geometry(network){
    const radius=Math.max(225,network.students.length*10.5),padding=240,center=radius+padding;
    const nodes=network.students.map((student,index)=>{
      const angle=-Math.PI/2+index*2*Math.PI/Math.max(network.students.length,1);
      return {student,rank:index+1,angle,x:fixed(center+radius*Math.cos(angle)),y:fixed(center+radius*Math.sin(angle))};
    });
    const byId=new Map(nodes.map(node=>[node.student.ID,node]));
    const directions=new Set(network.edges.map(edge=>JSON.stringify([edge.from,edge.to])));
    const paths=network.edges.map(edge=>{
      const from=byId.get(edge.from),to=byId.get(edge.to),dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy);
      const ux=dx/length,uy=dy/length;
      // Each direction bends to its own left: reciprocal arrows remain separate.
      const bend=directions.has(JSON.stringify([edge.to,edge.from]))?16:0;
      const control={x:(from.x+to.x)/2-uy*bend,y:(from.y+to.y)/2+ux*bend};
      const trim=(point,distance)=>{const l=Math.hypot(control.x-point.x,control.y-point.y);return {x:point.x+(control.x-point.x)/l*distance,y:point.y+(control.y-point.y)/l*distance};};
      const start=trim(from,17),end=trim(to,21);
      return {...edge,width:edge.intensidad===2?3.2:1.6,path:`M ${fixed(start.x)} ${fixed(start.y)} Q ${fixed(control.x)} ${fixed(control.y)} ${fixed(end.x)} ${fixed(end.y)}`};
    });
    return {radius,center,width:center*2,height:center*2,nodes,paths};
  }
  function svg(network){
    const layout=geometry(network),names=new Map(network.students.map(row=>[row.ID,label(row)]));
    const arrows=['amistad','rechazo'].map(kind=>`<marker id="class-network-arrow-${kind}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="9" markerHeight="9" orient="auto" markerUnits="userSpaceOnUse"><path d="M 0 0 L 10 5 L 0 10 z" class="network-fill-${kind}"/></marker>`).join('');
    const paths=layout.paths.map(edge=>`<path class="network-edge network-${edge.tipo} class-network-edge" data-class-from="${E(edge.from)}" data-class-to="${E(edge.to)}" d="${edge.path}" stroke-width="${edge.width}" marker-end="url(#class-network-arrow-${edge.tipo})"><title>${E(`${names.get(edge.from)} → ${names.get(edge.to)}: ${edge.intensidad===2?'muy ':''}${edge.tipo==='amistad'?'buena':'mala'} relación`)}</title></path>`).join('');
    const nodes=layout.nodes.map(node=>{
      const row=node.student,name=label(row),short=Array.from(name).length>16?Array.from(name).slice(0,15).join('')+'…':name;
      const count=popularity(row),known=answered(row),left=Math.cos(node.angle)<-0.001;
      const rotation=fixed(node.angle*180/Math.PI+(left?180:0)),offset=left?-24:24;
      const detail=count==null?'Sin recuento':`${count} ${count===1?'recibida':'recibidas'}`;
      const description=`${node.rank}. ${name} · Código ${row.ID} · ${count==null?'Sin recuento de menciones de buenas relaciones':count+' menciones de buenas relaciones recibidas'}${known?'':' · Sin respuesta de relaciones'}`;
      return `<a class="class-network-node${known?'':' class-network-unanswered'}" href="#report-content" data-class-student="${E(row.ID)}" aria-label="${E(`Abrir ficha: ${description}`)}"><title>${E(description)}</title><circle cx="${node.x}" cy="${node.y}" r="14"/><text class="class-network-rank" x="${node.x}" y="${node.y+4}" text-anchor="middle" aria-hidden="true">${node.rank}</text><g transform="translate(${node.x} ${node.y}) rotate(${rotation})"><rect class="class-network-hit" x="${left?-220:0}" y="-22" width="220" height="44" rx="8"/><text class="class-network-name" x="${offset}" y="-3" text-anchor="${left?'end':'start'}">${E(short)}</text><text class="class-network-count" x="${offset}" y="13" text-anchor="${left?'end':'start'}">${E(detail)}</text></g></a>`;
    }).join('');
    return `<svg class="student-network-svg class-network-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${layout.width} ${layout.height}" role="group" aria-roledescription="red del aula" aria-labelledby="class-network-title class-network-desc"><title id="class-network-title">Relaciones entre estudiantes del aula</title><desc id="class-network-desc">${network.students.length} estudiantes ordenados por menciones de buenas relaciones recibidas, desde arriba en sentido horario. ${network.edges.length} flechas de quien nombra a quien recibe la mención. Azul: buena relación; rojo: mala relación. El grosor indica intensidad. Cada estudiante abre su ficha.</desc><defs>${arrows}</defs><circle class="class-network-ring" cx="${layout.center}" cy="${layout.center}" r="${layout.radius}"/>${paths}${nodes}</svg>`;
  }
  function view(rows){
    const network=model(rows),total=network.students.length;
    if(!total)return '';
    const missing=total-network.respondents;
    const options=network.students.map((row,index)=>`<option value="${E(row.ID)}">${index+1}. ${E(label(row))} · ${E(row.ID)}</option>`).join('');
    const coverage=`${network.respondents} de ${total} han respondido sobre sus relaciones.${missing?' Borde discontinuo: sin respuesta propia.':''}`;
    const unavailable=!network.respondents?'<p class="student-network-missing">No hay respuestas de relaciones disponibles. Los recuentos por sí solos no permiten dibujar los vínculos.</p>':!network.edges.length?'<p class="student-network-missing">No se observan relaciones entre estudiantes de esta aula en las respuestas disponibles.</p>':'';
    return `<section class="student-network class-network" aria-labelledby="class-network-heading"><div class="student-network-heading"><div><span class="eyebrow">RELACIONES DEL AULA</span><h3 id="class-network-heading">¿Cómo se relaciona el aula?</h3></div></div><div class="student-network-legend" aria-label="Leyenda de la red de aula"><span><i class="network-line positive" aria-hidden="true"></i>Buena relación</span><span><i class="network-line positive strong" aria-hidden="true"></i>Muy buena relación</span><span><i class="network-line negative" aria-hidden="true"></i>Mala relación</span><span><i class="network-line negative strong" aria-hidden="true"></i>Muy mala relación</span></div><details class="reading-note"><summary>Cómo leer las relaciones</summary><p>Buenas relaciones incluye «buena» y «muy buena relación»; malas relaciones incluye «mala» y «muy mala relación». Cada flecha conserva la respuesta original y su intensidad.</p></details><div class="class-network-tools"><label for="class-network-highlight">Destacar estudiante<select id="class-network-highlight" data-class-network-highlight><option value="">Toda el aula</option>${options}</select></label><div class="student-network-zoom"><div><button type="button" data-network-zoom="out" aria-label="Reducir la red de aula" disabled>−</button><button type="button" data-network-zoom="in" aria-label="Ampliar la red de aula">+</button><button type="button" data-network-zoom="fit">Ajustar</button><output data-network-zoom-label aria-live="polite">Ajustado</output></div></div></div><p class="student-network-result" data-class-network-status role="status">${total} estudiantes · ${network.edges.length} menciones dentro del aula</p>${unavailable}<div class="student-network-scroll" tabindex="0" role="region" aria-label="Red del aula; usa el zoom y desplázate para leer los nombres" data-network-scale="1">${svg(network)}</div><p class="student-network-coverage">${E(coverage)}${network.outside?` ${network.outside} ${network.outside===1?'mención hacia un código fuera de esta aula no se dibuja':'menciones hacia códigos fuera de esta aula no se dibujan'}.`:''}</p></section>`;
  }
  function highlight(panel,id){
    const edges=[...panel.querySelectorAll('[data-class-from]')],nodes=[...panel.querySelectorAll('[data-class-student]')];
    const selected=nodes.find(node=>node.dataset.classStudent===id);
    if(!selected)id='';
    const related=new Set([id]);let outgoing=0,incoming=0;
    for(const edge of edges){const match=!id||edge.dataset.classFrom===id||edge.dataset.classTo===id;edge.classList.toggle('is-muted',!match);edge.classList.toggle('is-highlighted',!!id&&match);if(id&&match){related.add(edge.dataset.classFrom);related.add(edge.dataset.classTo);if(edge.dataset.classFrom===id)outgoing++;if(edge.dataset.classTo===id)incoming++;}}
    for(const node of nodes){node.classList.toggle('is-muted',!!id&&!related.has(node.dataset.classStudent));node.classList.toggle('is-selected',node.dataset.classStudent===id);}
    panel.querySelector('[data-class-network-status]').textContent=id?`${outgoing} ${outgoing===1?'mención enviada':'menciones enviadas'} · ${incoming} ${incoming===1?'recibida':'recibidas'} dentro del aula`:`${nodes.length} estudiantes · ${edges.length} menciones dentro del aula`;
  }
  return Object.freeze({model,geometry,svg,view,highlight});
});
