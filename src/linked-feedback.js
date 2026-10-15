/* Versioned, allowlisted feedback records. No source rows, names or passwords. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(root);
  else root.PbisLinkedFeedback=factory(root);
}(typeof globalThis!=='undefined'?globalThis:this,function(root){
  'use strict';
  const SCHEMA='pbis.feedback.v2';
  const fields=Object.freeze({
    bullying_self:['bullying_autorreporte','Declara haber sufrido acoso',null,null],
    bullying_peers:['bullying_companeros_n','Menciones de acoso recibidas',0,null],
    happiness:['felicidad','Bienestar',0,10],
    friendship_out:['amistad_declarada_n','Buenas relaciones declaradas',0,null],
    friendship_in:['amistad_recibida_n','Buenas relaciones recibidas',0,null],
    rejection_out:['rechazo_declarado_n','Malas relaciones declaradas',0,null],
    rejection_in:['rechazo_recibido_n','Malas relaciones recibidas',0,null]
  });
  const reactions={ok:'OK',review:'Revisar',surprised:'Me sorprende'};
  const reasons={consent_missing:'Sin consentimiento registrado',absent_day:'Ausencia el día de la encuesta',extended_absence:'Ausencia prolongada',changed_center:'Traslado a otro centro',other:'Otro motivo'};
  const text=(value,label,max=200,nullable=false)=>{
    if(nullable&&(value==null||value===''))return null;
    if(typeof value!=='string'||!value.trim()||value.length>max||/[\u0000-\u001f\u007f]/.test(value))throw Error(label+' no válido.');
    return value;
  };
  const comment=value=>{
    if(typeof value!=='string'||Array.from(value).length>1500||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value))throw Error('Comentario no válido.');
    return value;
  };
  function target(value,individual){
    if(!value)throw Error('No se ha podido identificar la ficha valorada.');
    return {center:text(value.center,'Centro'),course:text(value.course,'Curso'),group:text(value.group,'Grupo'),
      studentId:individual?text(value.studentId,'Código de estudiante',1000):null,
      period:text(value.period,'Periodo',200,true)};
  }
  function observed(row,indicator){
    if(!Object.hasOwn(fields,indicator))throw Error('Indicador no válido.');
    const [field,label,scaleMin,scaleMax]=fields[indicator];
    const value=indicator==='bullying_self'&&row.respondio==='No'?null:row[field]??null;
    if(value!==null&&(indicator==='bullying_self'?!['Sí','No'].includes(value):typeof value!=='number'||!Number.isFinite(value)))throw Error('Valor observado no válido.');
    return {indicator,indicatorField:field,indicatorLabel:label,observedValue:value,
      valueStatus:value===null?(row.respondio==='No'?'not_answered':'missing'):'observed',scaleMin,scaleMax};
  }
  async function fingerprint(buffer){
    if(!root.crypto?.subtle)throw Error('No se puede identificar el archivo en este navegador.');
    const hash=await root.crypto.subtle.digest('SHA-256',buffer);
    return Array.from(new Uint8Array(hash),n=>n.toString(16).padStart(2,'0')).join('');
  }
  function create({eventId,username,role,sessionCode,source,version,roster=[],opinions=[],date=new Date().toISOString()}){
    text(eventId,'Identificador del envío',80);text(username,'Cuenta',80);text(sessionCode,'Sesión',80);text(version,'Versión',40);
    if(!['tutor','orientador'].includes(role))throw Error('Rol no válido.');
    if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(date)||!Number.isFinite(Date.parse(date)))throw Error('Fecha no válida.');
    if(!source||!/^([a-f0-9]{64})$/.test(source.sha256))throw Error('Falta la referencia al archivo de origen.');
    const base={schemaVersion:SCHEMA,batchId:eventId,sessionCode,username,role,preparedAt:date,appVersion:version,
      sourceSha256:source.sha256,sourceSheet:text(source.sheet,'Hoja de origen')};
    if(!Array.isArray(roster)||!Array.isArray(opinions))throw Error('Valoraciones no válidas.');
    const records=[],seen=new Set();
    const add=(t,data)=>records.push({...base,recordId:eventId+':'+(records.length+1),...t,
      feedbackType:null,sheet:null,indicator:null,indicatorField:null,indicatorLabel:null,
      observedValue:null,valueStatus:null,scaleMin:null,scaleMax:null,reaction:null,confidence:null,
      rating:null,comment:null,nonParticipationReason:null,opinionId:null,...data});
    for(const entry of roster){
      const t=target(entry.target,true),key=JSON.stringify([t.center,t.course,t.group,t.studentId]);
      if(seen.has(key))throw Error('Estudiante duplicado en el envío.');seen.add(key);
      for(const indicator of Object.keys(fields)){
        const raw=entry.reactions?.[indicator];if(raw==null)continue;
        const reaction={ok:'ok',mal:'review',sorpresa:'surprised'}[raw];
        if(!reaction)throw Error('Reacción no válida.');
        add(t,{...observed(entry.values,indicator),feedbackType:'indicator_reaction',sheet:'roster',reaction});
      }
      for(const key of Object.keys(entry.reactions||{}))if(!Object.hasOwn(fields,key))throw Error('Indicador no válido.');
      if(entry.confidence!=null){
        if(typeof entry.confidence!=='number'||!Number.isFinite(entry.confidence)||entry.confidence< -5||entry.confidence>5||entry.nonParticipation)throw Error('Confianza en los datos no válida.');
        add(t,{feedbackType:'student_confidence',sheet:'roster',confidence:entry.confidence,scaleMin:-5,scaleMax:5});
      }
      if(entry.nonParticipation){
        const {reason,detail}=entry.nonParticipation;
        if(entry.values.respondio!=='No'||!Object.hasOwn(reasons,reason)||typeof detail!=='string'||detail.length>300||(reason==='other'?!detail.trim():detail!==''))throw Error('Revisa el motivo de no participación.');
        add(t,{feedbackType:'non_participation',sheet:'roster',nonParticipationReason:reason,comment:comment(detail),valueStatus:'not_answered'});
      }
    }
    for(const entry of opinions){
      if(!['group','roster','individual'].includes(entry.sheet)||!Number.isInteger(entry.rating)||entry.rating<1||entry.rating>5)throw Error('Opinión de ficha no válida.');
      add(target(entry.target,entry.sheet==='individual'),{feedbackType:'interface_opinion',sheet:entry.sheet,rating:entry.rating,
        comment:comment(entry.comment),opinionId:text(entry.eventId,'Identificador de opinión',80),scaleMin:1,scaleMax:5});
    }
    if(!records.length)throw Error('No hay valoraciones para enviar.');
    const envelope={schemaVersion:SCHEMA,batchId:eventId,records};
    const feedback_json=JSON.stringify(envelope);
    const centers=[...new Set(records.map(r=>r.center))];
    const lines=[`PBIS · ${records.length} valoraciones`,`Cuenta: ${username} · Rol: ${role==='orientador'?'Orientación':'Tutoría'}`,`Centro(s): ${centers.join(', ')}`,`Preparado: ${date}`,`Archivo SHA-256: ${source.sha256}`,`Hoja de origen: ${source.sheet}`,''];
    for(const r of records){
      lines.push(`${r.center} · ${r.course} · ${r.group} · ${r.studentId===null?'Ficha de aula':'Código de estudiante: '+r.studentId}`);
      if(r.feedbackType==='indicator_reaction')lines.push(`  ${r.indicatorLabel}: ${r.observedValue===null?'Sin datos':r.observedValue}${r.scaleMax!==null?' / '+r.scaleMax:''} → ${reactions[r.reaction]}`);
      if(r.feedbackType==='student_confidence')lines.push(`  Confianza en los datos: ${r.confidence} (−5 a +5)`);
      if(r.feedbackType==='non_participation')lines.push(`  Motivo de no participación: ${reasons[r.nonParticipationReason]}`);
      if(r.feedbackType==='interface_opinion')lines.push(`  Opinión sobre la ficha (${r.sheet==='individual'?'estudiante':r.sheet==='roster'?'lista de aula':'aula'}): ${r.rating}/5`);
      if(r.comment)lines.push('  Comentario: '+r.comment);
    }
    return {_subject:`PBIS · ${centers.join(', ').slice(0,120)} · ${username}`,eventId,username,role,sessionCode,date,
      schemaVersion:SCHEMA,centers:centers.join(' | '),recordCount:String(records.length),message:lines.join('\n'),feedback_json};
  }
  return Object.freeze({SCHEMA,fields,observed,fingerprint,create});
}));
