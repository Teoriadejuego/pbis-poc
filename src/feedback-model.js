/* Opinions are a separate, deliberately small record. No profile or report data
 * is accepted here, and no browser storage or network is used by this module. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(root);
  else root.PbisFeedbackModel = factory(root);
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';
  const FIELDS = new Set(['eventId', 'sessionCode', 'role', 'sheet', 'classCode', 'studentCode', 'rating', 'comment', 'version', 'date']);
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const VERSION = /^\d{1,3}\.\d{1,3}\.\d{1,3}(?:-[A-Za-z0-9.-]{1,24})?$/;
  const CODE = /^[A-Za-z0-9_.:-]{1,80}$/;

  function newId() {
    const provider = root.crypto;
    if (!provider || typeof provider.getRandomValues !== 'function') {
      throw new Error('Este navegador no permite generar un código de sesión seguro. Usa un navegador actualizado.');
    }
    if (typeof provider.randomUUID === 'function') return provider.randomUUID();
    const bytes = new Uint8Array(16);
    provider.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    const hex = Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
    return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' + hex.slice(12, 16) + '-' + hex.slice(16, 20) + '-' + hex.slice(20);
  }

  function identifier(value, label) {
    if (typeof value !== 'string' || !UUID.test(value)) throw new Error(label + ' no tiene un formato válido.');
    return value.toLowerCase();
  }

  async function classCode({center, course, group, explicitCode} = {}) {
    if (typeof explicitCode === 'string' && CODE.test(explicitCode)) return explicitCode;
    const context = [center, course, group];
    if (context.some(value => typeof value !== 'string' || !value.trim() || value.length > 1000)) {
      throw new Error('No se ha podido identificar el aula. Revisa el centro, curso y grupo.');
    }
    if (!root.crypto || !root.crypto.subtle || typeof root.TextEncoder !== 'function') {
      throw new Error('Este navegador no permite generar la clave de aula. Usa un navegador actualizado.');
    }
    const bytes = new root.TextEncoder().encode(JSON.stringify(context));
    const digest = await root.crypto.subtle.digest('SHA-256', bytes);
    return 'AULA-' + Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('').slice(0, 24);
  }

  function makeOpinion(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input) ||
        ![Object.prototype, null].includes(Object.getPrototypeOf(input))) {
      throw new Error('La opinión no tiene un formato válido.');
    }
    // Reject extra fields rather than silently carrying identifying metadata.
    for (const key of Reflect.ownKeys(input)) {
      if (!FIELDS.has(key) || !Object.prototype.hasOwnProperty.call(Object.getOwnPropertyDescriptor(input, key), 'value')) {
        throw new Error('La opinión contiene campos no permitidos.');
      }
    }
    const own = key => Object.prototype.hasOwnProperty.call(input, key);
    const eventId = own('eventId') ? identifier(input.eventId, 'El código de opinión') : newId();
    const sessionCode = identifier(input.sessionCode, 'El código de sesión');
    if (!['tutor', 'orientador'].includes(input.role)) throw new Error('El rol debe ser de tutoría u orientación.');
    if (!['group', 'roster', 'individual'].includes(input.sheet)) throw new Error('Selecciona la ficha de grupo, la lista o la ficha individual.');
    if (typeof input.classCode !== 'string' || !CODE.test(input.classCode)) throw new Error('La clave de aula no tiene un formato válido.');
    if ((input.sheet !== 'individual' && input.studentCode !== null) ||
        (input.sheet === 'individual' && (typeof input.studentCode !== 'string' || !CODE.test(input.studentCode)))) {
      throw new Error('La clave de estudiante debe identificar la ficha individual y quedar vacía en la ficha de grupo o la lista.');
    }
    if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
      throw new Error('Elige una valoración entre 1 y 5.');
    }
    if (typeof input.comment !== 'string') throw new Error('El comentario debe ser texto.');
    const normalized = input.comment.replace(/\r\n?/g, '\n');
    const comment = normalized.trim();
    const characters = Array.from(comment);
    if (characters.length > 1500) throw new Error('El comentario no puede superar los 1.500 caracteres.');
    if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/.test(normalized) ||
        characters.some(character => character.length === 1 && /[\ud800-\udfff]/.test(character))) {
      throw new Error('El comentario contiene caracteres no admitidos.');
    }
    const version = own('version') ? input.version : '0.10.1';
    if (typeof version !== 'string' || !VERSION.test(version)) throw new Error('La versión no tiene un formato válido.');
    const date = own('date') ? input.date : new Date().toISOString().slice(0, 10);
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(Date.parse(date + 'T00:00:00Z')) || new Date(date + 'T00:00:00Z').toISOString().slice(0, 10) !== date) {
      throw new Error('La fecha debe ser un día válido con formato AAAA-MM-DD.');
    }
    return {eventId, sessionCode, role: input.role, sheet: input.sheet, classCode: input.classCode, studentCode: input.studentCode, rating: input.rating, comment, version, date};
  }

  function toSheetRows(opinions) {
    if (!Array.isArray(opinions) || opinions.length > 100) {
      throw new Error('Puedes guardar como máximo 100 opiniones de esta sesión.');
    }
    return opinions.map(value => {
      const opinion = makeOpinion(value);
      return {
        ID_opinion: opinion.eventId,
        Codigo_sesion: opinion.sessionCode,
        Fecha: opinion.date,
        Rol: opinion.role === 'tutor' ? 'Tutoría' : 'Orientación',
        Ficha: opinion.sheet === 'group' ? 'Grupo' : opinion.sheet === 'roster' ? 'Lista de clase' : 'Individual',
        Clave_aula: opinion.classCode,
        Clave_estudiante: opinion.studentCode === null ? '' : opinion.studentCode,
        Valoracion: opinion.rating,
        Comentario: opinion.comment,
        Version: opinion.version
      };
    });
  }

  return Object.freeze({newId, classCode, makeOpinion, toSheetRows});
}));
