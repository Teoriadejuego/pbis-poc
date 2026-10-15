/* A deliberately small email payload: account, class/student codes and reviews;
 * no names, source Excel rows or measured indicator values. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(root);
  else root.PbisReviewBatch = factory(root);
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';
  const CODE = /^[A-Za-z0-9_.:-]{1,80}$/;
  const USER = /^[A-Za-z0-9_.-]{1,80}$/;
  const INDICATORS = new Set(['bullying_self','bullying_peers','happiness','friendship_out','friendship_in','rejection_out','rejection_in']);
  const REACTIONS = new Set(['ok','mal','sorpresa']);
  const REACTION_LABELS = {ok:'OK',mal:'Revisar',sorpresa:'Me sorprende'};
  const NON_PARTICIPATION_LABELS = {
    consent_missing:'Sin consentimiento registrado', absent_day:'Ausencia el día de la encuesta',
    extended_absence:'Ausencia prolongada', changed_center:'Traslado a otro centro', other:'Otro motivo'
  };
  const LABELS = {
    bullying_self:'Declara haber sufrido acoso',bullying_peers:'Menciones de acoso recibidas',happiness:'Bienestar',
    friendship_out:'Buenas relaciones declaradas',friendship_in:'Buenas relaciones recibidas',
    rejection_out:'Malas relaciones declaradas',rejection_in:'Malas relaciones recibidas'
  };
  const safeCode = (value, label) => {
    if(typeof value !== 'string'||!CODE.test(value))throw new Error(label+' no tiene formato de código.');
    return value;
  };
  async function studentCode(classCode, id) {
    safeCode(classCode,'La código de aula');
    if(typeof id!=='string'||!id||id.length>1000)throw new Error('El código de estudiante no es válido.');
    if(!root.crypto?.subtle||!root.TextEncoder)throw new Error('El navegador no permite crear códigos de estudiante.');
    const bytes=new root.TextEncoder().encode(JSON.stringify([classCode,id]));
    const digest=await root.crypto.subtle.digest('SHA-256',bytes);
    return 'EST-'+Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('').slice(0,24);
  }
  function create({eventId,username,role,sessionCode,roster=[],opinions=[],date=new Date().toISOString()}={}) {
    if(typeof eventId!=='string'||!CODE.test(eventId))throw new Error('Código de cierre no válido.');
    if(typeof username!=='string'||!USER.test(username))throw new Error('Cuenta de acceso no válida.');
    if(!['tutor','orientador'].includes(role))throw new Error('Rol no válido.');
    if(typeof sessionCode!=='string'||!CODE.test(sessionCode))throw new Error('Código de sesión no válido.');
    if(!Array.isArray(roster)||!Array.isArray(opinions))throw new Error('Lista de valoraciones no válida.');
    if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(date))throw new Error('Fecha no válida.');
    const lines=[`Usuario: ${username}`,`Rol: ${role}`,`Sesión: ${sessionCode}`,`Fecha: ${date}`];
    lines.push('',`VALORACIONES DE LA LISTA (${roster.length})`);
    for(const entry of roster){
      const classCode=safeCode(entry.classCode,'La código de aula');
      const student=safeCode(entry.studentCode,'La código de estudiante');
      const confidence=entry.confidence;
      if(confidence!==null&&(!Number.isFinite(confidence)||confidence< -5||confidence>5))throw new Error('Confianza en los datos fuera de −5 a +5.');
      const parts=[];
      for(const [indicator,reaction] of Object.entries(entry.reactions||{})){
        if(!INDICATORS.has(indicator)||!REACTIONS.has(reaction))throw new Error('Reacción no válida.');
        parts.push(`${LABELS[indicator]}: ${REACTION_LABELS[reaction]}`);
      }
      let assessment=`Confianza en los datos: ${confidence===null?'sin valorar':confidence>0?'+'+confidence:confidence}`;
      if(entry.nonParticipation!=null){
        const {reason,detail}=entry.nonParticipation;
        if(!Object.hasOwn(NON_PARTICIPATION_LABELS,reason)||typeof detail!=='string'||detail.length>300)throw new Error('Motivo de no participación no válido.');
        if(confidence!==null)throw new Error('No se puede indicar confianza en los datos junto a un motivo de no participación.');
        if(reason==='other'&&!detail.trim())throw new Error('Completa el texto de «Otro motivo» antes de enviar las valoraciones.');
        if(reason!=='other'&&detail!=='')throw new Error('El detalle solo corresponde a «Otro motivo».');
        assessment='Motivo de no participación: '+NON_PARTICIPATION_LABELS[reason];
        if(reason==='other')assessment+=' — '+detail.trim().replace(/\r?\n/g,'\n  ');
      }
      lines.push(`${classCode} | ${student} | ${assessment} | ${parts.join('; ')}`);
    }
    lines.push('',`OPINIONES DE FICHAS (${opinions.length})`);
    for(const entry of opinions){
      const classCode=safeCode(entry.classCode,'La código de aula');
      const student=entry.studentCode===null?'aula':safeCode(entry.studentCode,'La código de estudiante');
      if(!['group','roster','individual'].includes(entry.sheet)||!Number.isInteger(entry.rating)||entry.rating<1||entry.rating>5||typeof entry.comment!=='string'||entry.comment.length>1500||(entry.sheet==='individual')!==(entry.studentCode!==null))throw new Error('Opinión de ficha no válida.');
      const sheetLabel=entry.sheet==='group'?'Ficha de aula':entry.sheet==='roster'?'Lista de aula':'Ficha de estudiante';
      lines.push(`${classCode} | ${student} | ${sheetLabel} | ${entry.rating}/5`);
      if(entry.comment.trim())lines.push('  Comentario: '+entry.comment.trim().replace(/\r?\n/g,'\n  '));
    }
    const message=lines.join('\n');
    return {
      _subject:`PBIS · valoración de ${username}`,
      eventId,username,role,sessionCode,date,
      rosterCount:String(roster.length),opinionCount:String(opinions.length),message
    };
  }
  return Object.freeze({studentCode,create});
}));
