/* Star diagram adapted from the local ISAT viewer. PBIS supplies scoped links;
 * this module changes presentation only, never survey measures or permissions. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./core.js'));
  else root.PbisStudentNetwork=factory(root.PbisCore);
})(typeof window==='undefined'?globalThis:window,function(C){
  'use strict';
  const E=C.escapeHtml;
  const label=row=>C.displayName(row.Nombre)||String(row.ID);
  const classKey=row=>JSON.stringify([row.Campus||row.Centro,row.Curso,row.Grupo]);
  const classLabel=row=>[row.Curso,row.Grupo&&row.Grupo!=='.'?row.Grupo:null].filter(Boolean).join(' · ');
  const fixed=value=>Number(value.toFixed(2));
  function lines(value,max=19,count=2){
    const result=[];let current='';
    for(const word of String(value).split(/\s+/)){
      if(current&&(current+' '+word).length>max){result.push(current);current='';}
      current=current?current+' '+word:word;
    }
    if(current)result.push(current);
    const visible=result.slice(0,count).map(line=>line.length>max?line.slice(0,max-1)+'…':line);
    if(result.length>count)visible[count-1]=visible[count-1].slice(0,max-1)+'…';
    return visible;
  }
  function geometry(network){
    const n=network.neighbors.length,rx=Math.max(330,n*36),ry=Math.max(235,n*18),cx=rx+105,cy=ry+55;
    const peers=network.neighbors.map((student,index)=>{
      const angle=-Math.PI/2+index*2*Math.PI/Math.max(1,n);
      return {student,x:fixed(cx+rx*Math.cos(angle)),y:fixed(cy+ry*Math.sin(angle))};
    });
    const positions=new Map(peers.map(peer=>[peer.student.ID,peer]));
    const counts=new Map();
    for(const edge of network.edges){const id=edge.from===network.selected.ID?edge.to:edge.from;counts.set(id,(counts.get(id)||0)+1);}
    const paths=network.edges.map(edge=>{
      const outgoing=edge.from===network.selected.ID,peerId=outgoing?edge.to:edge.from,node=positions.get(peerId);
      const dx=node.x-cx,dy=node.y-cy,length=Math.hypot(dx,dy),ux=dx/length,uy=dy/length,nx=-uy,ny=ux;
      const lane=counts.get(peerId)>1?(outgoing?-9:9):0;
      const boundary=Math.min(71/Math.max(0.001,Math.abs(ux)),34/Math.max(0.001,Math.abs(uy)));
      const central={x:cx+ux*87+nx*lane,y:cy+uy*87+ny*lane};
      const outer={x:node.x-ux*(boundary+12)+nx*lane,y:node.y-uy*(boundary+12)+ny*lane};
      const start=outgoing?central:outer,end=outgoing?outer:central;
      const control={x:(start.x+end.x)/2+nx*lane,y:(start.y+end.y)/2+ny*lane};
      return {...edge,peerId,outgoing,width:edge.intensidad===2?5.5:2.3,path:`M ${fixed(start.x)} ${fixed(start.y)} Q ${fixed(control.x)} ${fixed(control.y)} ${fixed(end.x)} ${fixed(end.y)}`};
    });
    return {width:rx*2+210,height:ry*2+110,cx,cy,peers,paths};
  }
  function svg(network){
    const layout=geometry(network),names=new Map([network.selected,...network.neighbors].map(row=>[row.ID,label(row)]));
    const labels=(row,x,y,central=false)=>{
      const text=lines(label(row),central?20:19),first=y-(text.length>1?13:3);
      return `<text class="network-node-name${central?' network-central-name':''}" text-anchor="middle">${text.map((line,i)=>`<tspan x="${x}" y="${first+i*16}">${E(line)}</tspan>`).join('')}</text><text class="network-node-class${central?' network-central-class':''}" text-anchor="middle" x="${x}" y="${y+21}">${E(lines(classLabel(row),23,1)[0]||'')}</text>`;
    };
    const arrows=['amistad','rechazo'].map(kind=>`<marker id="network-arrow-${kind}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="10" markerHeight="10" orient="auto" markerUnits="userSpaceOnUse"><path d="M 0 0 L 10 5 L 0 10 z" class="network-fill-${kind}"/></marker>`).join('');
    const paths=layout.paths.map(edge=>{
      const description=`${names.get(edge.from)} → ${names.get(edge.to)}: ${edge.intensidad===2?'Muy ':''}${edge.tipo==='amistad'?'buena':'mala'} relación`;
      return `<path class="network-edge network-${edge.tipo}" d="${edge.path}" stroke-width="${edge.width}" marker-end="url(#network-arrow-${edge.tipo})" data-network-direction="${edge.outgoing?'outgoing':'incoming'}"><title>${E(description)}</title></path>`;
    }).join('');
    const peers=layout.peers.map(peer=>`<a href="#report-content" data-network-student="${E(peer.student.ID)}" aria-label="${E(`Abrir ficha de ${label(peer.student)}, ${classLabel(peer.student)}`)}"><title>${E(`${label(peer.student)} · ${peer.student.ID} · ${classLabel(peer.student)}`)}</title><rect class="network-peer${classKey(peer.student)!==classKey(network.selected)?' network-other-class':''}" x="${peer.x-71}" y="${peer.y-34}" width="142" height="68" rx="16"/>${labels(peer.student,peer.x,peer.y)}</a>`).join('');
    return `<svg class="student-network-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${layout.width} ${layout.height}" role="group" aria-roledescription="red de relaciones" aria-labelledby="network-svg-title network-svg-description"><title id="network-svg-title">Red de relaciones de ${E(label(network.selected))}</title><desc id="network-svg-description">${network.neighbors.length} personas vinculadas y ${network.edges.length} nominaciones. La flecha sale de quien nombra. Azul: relación positiva; rojo: negativa. Un mayor grosor indica muy buena o muy mala relación. Cada tarjeta abre la ficha de esa persona.</desc><defs>${arrows}</defs>${paths}${peers}<circle class="network-center" cx="${layout.cx}" cy="${layout.cy}" r="80"/><text class="network-central-caption" text-anchor="middle" x="${layout.cx}" y="${layout.cy-39}">ESTUDIANTE</text>${labels(network.selected,layout.cx,layout.cy,true)}</svg>`;
  }
  function view(network){
    const heading='<div class="student-network-heading"><div><span class="eyebrow">VÍNCULOS DEL CUESTIONARIO</span><h3 id="network-heading">Red de relaciones</h3></div></div>';
    if(!network.available)return `<section class="student-network" aria-labelledby="network-heading">${heading}<p class="student-network-empty">Esta base solo contiene recuentos o no tiene respuestas de relaciones interpretables. No hay vínculos individuales disponibles para dibujar la red.</p></section>`;
    const count=network.neighbors.length,outgoing=network.edges.filter(edge=>edge.from===network.selected.ID).length,incoming=network.edges.length-outgoing;
    const other=network.neighbors.filter(peer=>classKey(peer)!==classKey(network.selected)).length;
    const missing=network.outgoingKnown?'':'<p class="student-network-missing">No consta una respuesta propia interpretable. Pueden aparecer nominaciones recibidas; la ausencia de flechas salientes no significa que no tenga amistades.</p>';
    const legend='<div class="student-network-legend" aria-label="Leyenda de la red"><span><i class="network-line positive" aria-hidden="true"></i>Buena relación</span><span><i class="network-line positive strong" aria-hidden="true"></i>Muy buena relación</span><span><i class="network-line negative" aria-hidden="true"></i>Mala relación</span><span><i class="network-line negative strong" aria-hidden="true"></i>Muy mala relación</span></div>';
    const controls=count?'<div class="student-network-zoom"><span>Amplía y desplaza el dibujo para leer las tarjetas.</span><div><button type="button" data-network-zoom="out" aria-label="Reducir la red" disabled>−</button><button type="button" data-network-zoom="in" aria-label="Ampliar la red">+</button><button type="button" data-network-zoom="fit">Ajustar</button><output data-network-zoom-label aria-live="polite">Ajustado</output></div></div>':'';
    const graph=count?`<div class="student-network-scroll" tabindex="0" role="region" aria-label="Red de relaciones; amplía y desplaza el dibujo" data-network-scale="1">${svg(network)}</div>`:'<p class="student-network-empty">No se han observado nominaciones de entrada ni de salida en las respuestas disponibles.</p>';
    return `<section class="student-network" aria-labelledby="network-heading">${heading}<p class="student-network-intro">Las flechas salen de quien nombra y llegan a la persona nombrada. Pulsa una tarjeta para abrir su ficha.</p>${legend}${controls}<p class="student-network-result" role="status">${count} ${count===1?'persona vinculada':'personas vinculadas'} · ${outgoing} ${outgoing===1?'nominación declarada':'nominaciones declaradas'} · ${incoming} ${incoming===1?'recibida':'recibidas'}${other?` · ${other} de otras clases`:''}</p>${missing}${graph}<p class="student-network-coverage">${network.respondents} de ${network.visibleCount} estudiantes accesibles tienen respuesta sobre relaciones. Solo se muestran personas accesibles para tu perfil; el borde discontinuo indica otra clase. Los vínculos reflejan respuestas declaradas.</p></section>`;
  }
  function zoom(panel,action){
    const stage=panel.querySelector('.student-network-scroll'),drawing=stage?.querySelector('svg');
    if(!stage||!drawing||!stage.clientWidth)return;
    const width=stage.clientWidth,natural=Number(drawing.getAttribute('viewBox').split(/\s+/)[2]);
    // Keep labels readable even on phones with many neighbours; fit always
    // starts with the entire diagram. No network request or persistent state.
    const max=Math.max(8,Math.ceil(natural/width));
    const scales=[1,1.5,2.25,3.5,5,8,12,18,27,40,60,90,135].filter(value=>value<max).concat(max);
    const current=Number(stage.dataset.networkScale)||1;
    const index=Math.max(0,scales.findLastIndex(value=>value<=current));
    const next=action==='fit'?0:Math.max(0,Math.min(scales.length-1,index+(action==='in'?1:-1))),scale=scales[next];
    const previous=(Number(drawing.getAttribute('width'))||width)/width;
    const centerX=(stage.scrollLeft+width/2)/previous,centerY=(stage.scrollTop+stage.clientHeight/2)/previous;
    stage.dataset.networkScale=String(scale);stage.classList.toggle('is-zoomed',next>0);
    drawing.setAttribute('width',String(Math.round(width*scale)));
    panel.querySelector('[data-network-zoom="out"]').disabled=next===0;
    panel.querySelector('[data-network-zoom="in"]').disabled=next===scales.length-1;
    panel.querySelector('[data-network-zoom-label]').textContent=next?`${scale*100} %`:'Ajustado';
    stage.scrollLeft=next?Math.max(0,centerX*scale-width/2):0;
    stage.scrollTop=next?Math.max(0,centerY*scale-stage.clientHeight/2):0;
  }
  return Object.freeze({view,svg,geometry,zoom});
});
