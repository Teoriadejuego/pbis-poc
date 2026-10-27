/* Local PDF edition. Reuses the consultation's aggregates; never opens source books.
 * Native PDF text and page watermarks, with the current scoped SVG as an image.
 * No persistence, network, credentials, feedback or source-file attachment. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./core.js'));
  else root.PbisPdf=factory(root.PbisCore);
})(typeof window==='undefined'?globalThis:window,function(C){
  'use strict';
  const known=x=>typeof x==='number'&&Number.isFinite(x);
  const number=x=>known(x)?x.toLocaleString('es-ES',{maximumFractionDigits:1}):'Sin datos';
  const scale=(x,max=10)=>known(x)?number(x)+' / '+max:'Sin datos';
  const mean=values=>{const a=values.filter(known);return a.length?a.reduce((s,x)=>s+x,0)/a.length:null;};
  const ratio=(a,b)=>known(a)&&known(b)?`${number(a)} de ${number(b)}`:'Sin datos';
  const name=r=>C.displayName(r.Nombre)||String(r.ID);
  const clean=x=>String(x??'').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,'').replace(/[–—−]/g,'-').replace(/→/g,' > ').replace(/[\u202f\u00a0]/g,' ');
  const classKey=r=>JSON.stringify([r.Campus||r.Centro,r.Curso,r.Grupo]);
  function identity({demo=false,role,maskedDni,username,sessionCode,protectedProject=false}){
    if(demo)return {header:'Datos simulados',watermark:'DATOS SIMULADOS'};
    if(role==='orientador')return {header:'Equipo orientador',watermark:null};
    if(role!=='tutor')throw Error('No se puede identificar el perfil para marcar el PDF.');
    if(!sessionCode)throw Error('Falta el código de sesión. Vuelve a entrar antes de descargar.');
    if(protectedProject&&!/^.[*].[*][*].[*]..$/.test(maskedDni||''))throw Error('No se puede verificar la marca de agua de esta cuenta.');
    let account=protectedProject?maskedDni:username;
    if(!account)throw Error('Falta la cuenta para marcar el PDF.');
    // Legacy imports can also use a DNI-shaped login: never print it in full.
    if(/^\d{8}[A-Z]$/i.test(account))account=[...account].map((x,i)=>[1,3,4,6].includes(i)?'*':x).join('');
    const label=clean(account)+' · '+clean(sessionCode).slice(0,8);
    return {header:'Copia de '+label,watermark:label};
  }
  function model({view,selection,students,groups,identity:mark,demo=false,networkNote=''}){
    if(!['center','group','student'].includes(view))throw Error('Selecciona una ficha de centro, aula o estudiante.');
    if(!mark?.header||(!mark.watermark&&mark.header!=='Equipo orientador'))throw Error('El PDF requiere una identificación válida.');
    if(view==='center'&&mark.header!=='Equipo orientador'&&!demo)throw Error('Esta cuenta no puede descargar el centro completo.');
    const center=students.filter(r=>(r.Campus||r.Centro)===selection.center);
    const classroom=center.filter(r=>r.Curso===selection.course&&r.Grupo===selection.group);
    const rows=view==='center'?center:classroom;
    if(!rows.length)throw Error('No hay datos autorizados para esta selección.');
    const r=classroom.find(r=>r.ID===selection.student);
    if(view==='student'&&!r)throw Error('El estudiante no está en esta aula autorizada.');
    const info=C.consultationContext(rows,groups),meta=groups.find(g=>classKey(g)===classKey(rows[0]));
    const sections=[];
    const section=(title,cards,note='',tone='blue')=>sections.push({title,cards,note,tone});
    const card=(question,answer,detail='')=>({question,answer:String(answer),detail});
    const scoreCard=(question,value,detail='')=>({...card(question,scale(value),detail),score:value,maximum:10});
    if(view==='student'){
      section('Señales de acoso escolar',[
        card('¿Declara haber sufrido acoso?',r.respondio==='No'?'No ha respondido':r.bullying_autorreporte??'Datos insuficientes'),
        card('¿Cuántas menciones de acoso recibe?',number(r.bullying_companeros_n), 'Menciones de otras personas; se conserva el recuento individual completo.')
      ],'Las dos fuentes pueden coincidir. Son señales para contrastar, no un diagnóstico.','red');
      const freq=x=>['Nunca','Casi nunca','Algunas veces','Casi siempre','Siempre'][x]||'Sin datos';
      section('Bienestar',[
        scoreCard('¿Cuál es su índice de bienestar?',r.felicidad,'Durante la última semana.'),
        card('¿Con qué frecuencia se ha sentido bien en el centro?',freq(r.felicidad_centro)),
        card('¿Con qué frecuencia ha disfrutado con sus amistades?',freq(r.felicidad_diversion)),
        card('¿Con qué frecuencia ha sentido soledad?',freq(r.felicidad_soledad))
      ],'El índice combina las tres respuestas e invierte la de soledad. Suma 0-12, expresada de 0 a 10.');
      const mutual=x=>known(x.amistad_reciproca_n)&&x.amistad_declarada_n>0?100*x.amistad_reciproca_n/x.amistad_declarada_n:null;
      section('Relaciones',[
        card('¿Cuántas buenas relaciones recibe?',number(r.amistad_recibida_n),'Media del aula: '+number(mean(classroom.map(x=>x.amistad_recibida_n)))),
        card('¿Cuántas malas relaciones recibe?',number(r.rechazo_recibido_n),'Media del aula: '+number(mean(classroom.map(x=>x.rechazo_recibido_n)))),
        card('¿Cuántas buenas relaciones son mutuas?',r.amistad_declarada_n===0?'No aplicable · 0 relaciones declaradas':ratio(r.amistad_reciproca_n,r.amistad_declarada_n)+(known(mutual(r))?' · '+number(mutual(r))+' %':''),'Media del aula: '+(known(mean(classroom.map(mutual)))?number(mean(classroom.map(mutual)))+' %':'Sin datos'))
      ],'Buenas relaciones incluye buena y muy buena relación; malas relaciones incluye mala y muy mala relación.'+(networkNote?' '+networkNote:''));
      const centralityMissing={no_edges:'Sin buenas relaciones en esta red',non_unique:'Sin un resultado único',no_convergence:'Cálculo pendiente'};
      section('Posición en la red',[
        scoreCard('¿Qué puntuación tiene en buenas relaciones recibidas?',r.popularidad),
        {...scoreCard('¿Cuál es su centralidad?',r.centralidad,(r.ambito_centralidad==='clase'?'Calculada dentro del aula.':'Ámbito indicado en el archivo.')+(r.red_clase_pendiente_pct>0?' Falta por completar el '+number(r.red_clase_pendiente_pct)+' % de las respuestas relacionales del aula.':'')),answer:known(r.centralidad)?scale(r.centralidad):centralityMissing[r.centralidad_estado]||'Sin datos'}
      ]);
      section('Mediación',[
        card('¿Cuántas menciones de buena mediación recibe?',number(r.mediacion_negativa_n==null?null:r.mediacion_n)),
        card('¿Cuántas menciones de mala mediación recibe?',number(r.mediacion_negativa_n))
      ],'Buena y mala mediación incluyen muy buena y muy mala, respectivamente. Una persona puede recibir ambas.');
      if(Object.hasOwn(r,'crt_aciertos')){
        const scores=classroom.map(x=>x.crt_aciertos).filter(x=>known(x)&&x>=0&&x<=3);
        section('Test de impulsividad',[{...card('¿Cuántas de las tres preguntas acertó?',scale(r.crt_aciertos,3),'Media del aula: '+scale(mean(scores),3)+' · '+scores.length+' respuestas válidas.'),score:r.crt_aciertos,maximum:3}],'Este resultado no diagnostica impulsividad.');
      }
      const prediction=kind=>r['pred_'+kind+'_n']===0?'No aplicable · Sin predicciones declaradas':ratio(r['pred_'+kind+'_aciertos'],r['pred_'+kind+'_n'])+' predicciones correctas';
      section('Más indicadores',[
        scoreCard('Buenas relaciones declaradas',r.sociabilidad,'Recuento: '+number(r.amistad_declarada_n)),
        {...scoreCard('Acierto de predicciones de buenas relaciones',r.acierto_amistad,prediction('amistad')),answer:r.acierto_amistad==null&&r.pred_amistad_n===0?'No aplicable':scale(r.acierto_amistad)},
        scoreCard('Malas relaciones declaradas',r.rechazo_declarado,'Recuento: '+number(r.rechazo_declarado_n)),
        {...scoreCard('Malas relaciones mutuas',r.reciprocidad_rechazo,r.rechazo_declarado_n===0?'Sin relaciones declaradas':ratio(r.rechazo_reciproco_n,r.rechazo_declarado_n)),answer:r.reciprocidad_rechazo==null&&r.rechazo_declarado_n===0?'No aplicable':scale(r.reciprocidad_rechazo)},
        {...scoreCard('Acierto de predicciones de malas relaciones',r.acierto_rechazo,prediction('rechazo')),answer:r.acierto_rechazo==null&&r.pred_rechazo_n===0?'No aplicable':scale(r.acierto_rechazo)}
      ]);
    }else{
      const g=view==='center'?C.aggregateCenter(rows):C.aggregate(rows,meta);
      const metric=id=>{const a=g.attention.find(a=>a.id===id);return {...card(a.title,ratio(a.count,a.denominator)+(known(a.percent)?' · '+number(a.percent)+' %':''),a.description),score:a.score,maximum:10};};
      section('Señales de acoso escolar',[metric('bullying_declarado'),metric('bullying_companeros')],'Las dos fuentes pueden coincidir; no se suman. Son señales para contrastar, no un diagnóstico.','red');
      section('Bienestar',[metric('soledad')],'Soledad frecuente: casi siempre o siempre durante la última semana.');
      section('Relaciones',[metric('sin_reciprocas'),metric('densidad_rechazo')],'Recuentos basados en las respuestas disponibles.');
      if(view==='group')section('Comunidades de relaciones',[
        card('¿Cuántas comunidades se observan?',g.communities?g.communities.length:'Sin datos',g.communities?g.communities.map(c=>`${String(c.name).replace(/^Red (\d+)$/,'Comunidad $1')}: ${c.count}`).join(' · '):'No hay información suficiente para identificar agrupaciones.'),
        {...scoreCard('Separación entre comunidades',meta?.pos_separacion),answer:meta?.pos_separacion==null&&meta?.red_clase_completa===false?'Faltan respuestas':scale(meta?.pos_separacion)},
        {...scoreCard('Desigualdad de buenas relaciones recibidas',meta?.pos_desigualdad),answer:meta?.pos_desigualdad==null&&meta?.red_centro_completa===false?'Faltan respuestas':scale(meta?.pos_desigualdad)},
        {...scoreCard('Centralización del aula',meta?.pos_centralizacion),answer:meta?.pos_centralizacion==null&&meta?.red_centro_completa===false?'Faltan respuestas':scale(meta?.pos_centralizacion)}
      ],'Tener varias comunidades no implica conflicto.');
      section('Mediación y convivencia',[
        card('¿Cuántos estudiantes reciben menciones de buena mediación?',ratio(g.mediators.count,g.mediators.denominator)),
        card('¿Cuántos estudiantes reciben menciones de mala mediación?',ratio(g.negativeMediators.count,g.negativeMediators.denominator))
      ],'Al menos una mención de otras personas. Una persona puede recibir menciones de buena y mala mediación.');
      if(g.coverageComplete===false)sections.unshift({title:'Cobertura del archivo',cards:[card('¿Qué parte del centro contiene?',ratio(g.n,g.expected)+' estudiantes')],note:'',tone:'blue'});
    }
    const warnings=[];
    const pending=rows[0].red_centro_pendiente_pct;
    if(known(pending)&&pending>0)warnings.push('Falta por completar el '+number(pending)+' % de las respuestas relacionales del centro.');
    if(center.some(x=>x.incidencias_calculo?.length))warnings.push('Hay respuestas con errores de relación pendientes de revisión; no se cuentan como ceros.');
    if(center.some(x=>x.centralidad_sin_convergencia===true))warnings.push('La centralidad no ha convergido en parte del centro.');
    const title=view==='student'?name(r):view==='center'?selection.center:selection.course+' · '+selection.group;
    const type={center:'Ficha de centro',group:'Ficha de aula',student:'Ficha de estudiante'}[view];
    return {type,title,scope:selection.center+(view==='student'?' · '+r.Curso+' · '+r.Grupo+' · Código '+r.ID:''),
      context:[info.periods.length?info.periods.join(' · '):'Periodo no indicado',`${info.answered} de ${info.total} con respuesta registrada · ${info.unanswered} sin respuesta · ${info.unknown} con estado desconocido`,
        'Ámbito de las menciones: '+({centro:'todo el centro',aula:'el aula'}[info.nominationScope]||'según el archivo')+(info.undatedClasses?' · '+info.undatedClasses+' aulas sin periodo indicado.':''),
        ...(info.periods.length>1?['Hay varios periodos; este resumen no compara su evolución.']:[]),...warnings],
      identity:mark,sections,networkNote:view==='student'?networkNote:'',filename:'PBIS-'+view+'-'+(view==='student'?r.ID:selection.center+(view==='group'?'-'+selection.course+'-'+selection.group:'')).replace(/[^a-z0-9_-]/gi,'_')+'.pdf'};
  }
  // Capture a self-contained SVG with computed styles. No DOM from another view.
  function snapshotNetwork(element,view){
    if(!element)return null;
    const svg=element.cloneNode(true),original=[element,...element.querySelectorAll('*')],copy=[svg,...svg.querySelectorAll('*')];
    const properties=['fill','stroke','stroke-width','stroke-opacity','opacity','font-family','font-size','font-weight','text-anchor','dominant-baseline','stroke-dasharray','stroke-linecap','paint-order','stroke-linejoin'];
    original.forEach((el,i)=>{const style=getComputedStyle(el);copy[i].setAttribute('style',properties.map(p=>p+':'+style.getPropertyValue(p)).join(';'));copy[i].removeAttribute('href');copy[i].removeAttribute('tabindex');copy[i].removeAttribute('filter');});
    const box=element.viewBox.baseVal;svg.setAttribute('width',box.width);svg.setAttribute('height',box.height);
    // Interactive highlighting must not hide edges or labels in a complete report.
    copy.forEach(el=>el.style.opacity='1');
    svg.querySelectorAll('.class-network-hit').forEach(el=>el.remove());
    // Remove only empty canvas margins, including when the on-screen details are closed.
    const host=document.createElement('div');host.style.cssText='position:fixed;left:-10000px;top:0;visibility:hidden;pointer-events:none';
    host.append(svg);document.body.append(host);
    let w=box.width,h=box.height;
    try{const b=svg.getBBox();if(b.width>0&&b.height>0){w=b.width+30;h=b.height+30;svg.setAttribute('viewBox',`${b.x-15} ${b.y-15} ${w} ${h}`);svg.setAttribute('width',w);svg.setAttribute('height',h);}}
    finally{host.remove();}
    return {source:new XMLSerializer().serializeToString(svg),width:w,height:h,title:view==='group'?'Red del aula':'Red de relaciones del estudiante'};
  }
  async function raster(network){
    const image=new Image();
    await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('La red no ha podido prepararse. Reintenta la descarga.')),15000);image.onload=()=>{clearTimeout(timer);resolve();};image.onerror=()=>{clearTimeout(timer);reject(Error('No se ha podido dibujar la red. Reintenta la descarga.'));};image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(network.source);});
    const factor=Math.min(3,4096/network.width,4096/network.height);
    const canvas=document.createElement('canvas');canvas.width=Math.ceil(network.width*factor);canvas.height=Math.ceil(network.height*factor);
    const context=canvas.getContext('2d');if(!context)throw Error('No se ha podido preparar la imagen de la red.');
    context.fillStyle='white';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);
    const result=canvas.toDataURL('image/png');canvas.width=canvas.height=0;image.src='';return result;
  }
  async function generate(report,{network=null,relations=[],password,current=()=>true}={}){
    password=window.PbisPdfCrypto.normalizeDni(password);
    if(!current())throw Error('La consulta ha cambiado. Repite la descarga.');
    if(!report.identity?.header||(!report.identity.watermark&&report.identity.header!=='Equipo orientador'))throw Error('No se puede generar un PDF sin identificación.');
    const picture=network?await raster(network):null;
    if(!current())throw Error('La consulta ha cambiado. Repite la descarga.');
    const doc=new window.jspdf.jsPDF({unit:'mm',format:'a4',compress:true,putOnlyUsedFonts:true});
    doc.setProperties({title:report.type+' · PBIS',author:'PBIS',subject:'Consulta de datos disponibles',creator:'PBIS · Edición local PDF'});
    const ink='#183e50',blue='#28718c',muted='#50636e',margin=17;
    let y=33,sectionTitle='';
    const width=()=>doc.internal.pageSize.getWidth(),height=()=>doc.internal.pageSize.getHeight();
    const font=(size=10,bold=false,color=ink)=>{doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(color);};
    const lines=(value,w,size=10,bold=false)=>{font(size,bold);return doc.splitTextToSize(clean(value),w);};
    function page(landscape=false){doc.addPage('a4',landscape?'landscape':'portrait');y=33;}
    function ensure(h){if(y+h>height()-23)page();}
    function text(value,size=10,bold=false,color=ink){const ls=lines(value,width()-2*margin,size,bold),lineHeight=size*.46;for(const line of ls){ensure(lineHeight);font(size,bold,color);doc.text(line,margin,y+size*.35);y+=lineHeight;}y+=2;}
    function heading(value,tone='blue'){sectionTitle=value;const titleLines=lines(value,width()-2*margin-8,12,true),h=titleLines.length*5.4+7;ensure(h+25);doc.setFillColor(tone==='red'?'#fbe9e6':'#e9f2f4');doc.roundedRect(margin,y-4,width()-2*margin,h,2,2,'F');font(12,true,tone==='red'?'#9d3c35':ink);doc.text(titleLines,margin+4,y+2,{lineHeightFactor:1.28});y+=h+3;}
    text(report.type.toUpperCase(),10,true,blue);text(report.title,23,true);text(report.scope,10,false,muted);y+=2;
    report.context.forEach(value=>text(value,9,false,muted));
    text('Una respuesta registrada puede estar incompleta. Cada indicador utiliza los datos disponibles.',9,false,muted);y+=3;
    for(const section of report.sections){
      heading(section.title,section.tone);
      for(const card of section.cards){
        const q=lines(card.question,width()-2*margin-8,10,true),a=lines(card.answer,width()-2*margin-8,15,true),d=card.detail?lines(card.detail,width()-2*margin-8,9):[];
        const bar=known(card.score);const block=q.length*4.6+a.length*6.9+d.length*4.14+(bar?12:0)+12;
        // User strings can be very long: let text paginate rather than clip the card.
        if(block>height()-65){text(card.question,10,true);text(card.answer,15,true);if(card.detail)text(card.detail,9,false,muted);continue;}
        if(y+block>height()-23){page();text(sectionTitle+' · continuación',10,true,blue);y+=4;}
        font(10,true);doc.text(q,margin+3,y,{lineHeightFactor:1.3});y+=q.length*4.6+2;
        font(15,true,ink);doc.text(a,margin+3,y,{lineHeightFactor:1.3});y+=a.length*6.9+1;
        if(d.length){font(9,false,muted);doc.text(d,margin+3,y,{lineHeightFactor:1.3});y+=d.length*4.14+1;}
        if(bar){const w=62,x=margin+3;doc.setFillColor('#e5ecef');doc.roundedRect(x,y+1,w,2,1,1,'F');doc.setFillColor(blue);const v=Math.min(card.maximum,Math.max(0,card.score));if(v>0)doc.roundedRect(x,y+1,w*v/card.maximum,2,.6,.6,'F');font(8,false,muted);doc.text('0',x,y+7);doc.text(String(card.maximum),x+w,y+7,{align:'right'});doc.text('Escala: '+scale(card.score,card.maximum),x+w+6,y+4);y+=12;}
        y+=5;doc.setDrawColor('#e0e7ea');doc.setLineWidth(.2);doc.line(margin+3,y-2,width()-margin-3,y-2);y+=3;
      }
      if(section.note){ensure(12);text(section.note,9,false,muted);}y+=4;
    }
    if(network){
      page(network.width/network.height>1.25);text(network.title,18,true);text('Flechas: quien nombra > persona nombrada. Azul: buena relación. Rojo: mala relación.',10,false,muted);
      text('Mayor grosor: muy buena o muy mala relación.'+(report.networkNote?'':' Solo se muestran relaciones autorizadas.'),9,false,muted);
      if(report.networkNote)text(report.networkNote,9,false,muted);
      const w=width()-2*margin,h=height()-y-27,factor=Math.min(w/network.width,h/network.height),iw=network.width*factor,ih=network.height*factor;
      doc.addImage(picture,'PNG',(width()-iw)/2,y,iw,ih,undefined,'FAST');
      // Text appendix keeps long/dense networks legible and retains every direction.
      if(relations.length){page();heading('Relaciones representadas');text('Origen > destino · Tipo e intensidad. Complemento legible de la red.',9,false,muted);relations.forEach(relation=>text(relation,9));}
    }
    const stamp=new Date().toLocaleString('es-ES'),total=doc.getNumberOfPages();
    for(let p=1;p<=total;p++){
      doc.setPage(p);font(15,true,blue);doc.text('PBIS',margin,16);font(9,false,muted);
      doc.text(report.identity.header,width()-margin,15,{align:'right'});doc.setDrawColor('#dae4e8');doc.line(margin,21,width()-margin,21);
      font(8,false,muted);doc.text('Generado: '+stamp,margin,height()-11);doc.text(`${p} / ${total}`,width()-margin,height()-11,{align:'right'});
      if(report.identity.watermark){
        // Drawn LAST in every page content stream: not optional PDF annotations,
        // CSS backgrounds, layers or a print setting. No unmarked download path.
        doc.saveGraphicsState();doc.setGState(new doc.GState({opacity:.16}));font(17,true,'#57707b');
        const label=clean(report.identity.watermark);const size=Math.min(17,17*90/Math.max(90,doc.getTextWidth(label)));font(size,true,'#57707b');
        for(let row=0;row<4;row++)for(let col=0;col<2;col++)doc.text(label,margin+8+col*(width()-2*margin)/2,58+row*(height()-90)/4,{angle:27});
        doc.restoreGraphicsState();
      }
    }
    if(!current())throw Error('La consulta ha cambiado. Repite la descarga.');
    return window.PbisPdfCrypto.protect(doc.output('arraybuffer'),password,{current});
  }
  function download(blob,filename){
    if(!(blob instanceof Blob)||blob.type!=='application/pdf')throw Error('No se ha preparado un PDF protegido.');
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
  }
  return Object.freeze({identity,model,snapshotNetwork,generate,download});
});
