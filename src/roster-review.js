/* Subjective classroom reviews stay in memory and never change the imported indicators. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PbisRosterReview = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const indicators = Object.freeze([
    'bullying_self', 'bullying_peers', 'happiness',
    'friendship_out', 'friendship_in', 'rejection_out', 'rejection_in'
  ]);
  const reactions = Object.freeze(['ok', 'mal', 'sorpresa']);
  const sortFields = Object.freeze({
    bullying_peers: 'bullying_companeros_n', happiness: 'felicidad',
    friendship_out: 'amistad_declarada_n', friendship_in: 'amistad_recibida_n',
    rejection_out: 'rechazo_declarado_n', rejection_in: 'rechazo_recibido_n'
  });
  const validIndicator = value => indicators.includes(value);
  const validReaction = value => reactions.includes(value);
  function nextSort(current, key) {
    if (key !== 'student' && key !== 'confidence' && !validIndicator(key)) throw new Error('Columna no válida.');
    return { key, direction: current.key === key ? (current.direction === 'asc' ? 'desc' : 'asc') : (key === 'student' ? 'asc' : 'desc') };
  }
  function sortRows(rows, sort, store) {
    const name = row => String(row.Nombre || row.ID || '');
    const tie = (a, b) => name(a).localeCompare(name(b), 'es', { sensitivity: 'base' }) || String(a.ID).localeCompare(String(b.ID), 'es');
    const value = row => {
      if (sort.key === 'confidence') return store.get(row.ID).confidence;
      if (sort.key === 'bullying_self') return row.respondio === 'No' || row.bullying_autorreporte == null ? null : row.bullying_autorreporte === 'Sí' ? 1 : row.bullying_autorreporte === 'No' ? 0 : null;
      const raw = row[sortFields[sort.key]];
      return raw == null || raw === '' || !Number.isFinite(Number(raw)) ? null : Number(raw);
    };
    return rows.slice().sort((a, b) => {
      if (sort.key === 'student') {
        const compared = tie(a, b);
        return sort.direction === 'asc' ? compared : -compared;
      }
      const av = value(a), bv = value(b);
      if (av === null) return bv === null ? tie(a, b) : 1;
      if (bv === null) return -1;
      const compared = sort.direction === 'asc' ? av - bv : bv - av;
      return compared || tie(a, b);
    });
  }
  function createStore() {
    const records = new Map();
    const key = value => {
      if (typeof value !== 'string' || !value) throw new Error('ID de estudiante no válido.');
      return value;
    };
    const record = id => records.get(key(id)) || { reactions: {}, confidence: null };
    const keep = (id, value) => {
      if (Object.keys(value.reactions).length || value.confidence !== null) records.set(id, value);
      else records.delete(id);
    };
    return Object.freeze({
      get(id) {
        const value = record(id);
        return { reactions: { ...value.reactions }, confidence: value.confidence };
      },
      toggle(id, indicator, reaction) {
        id = key(id);
        if (!validIndicator(indicator) || !validReaction(reaction)) throw new Error('Valoración no válida.');
        const value = record(id);
        const next = { reactions: { ...value.reactions }, confidence: value.confidence };
        if (next.reactions[indicator] === reaction) delete next.reactions[indicator];
        else next.reactions[indicator] = reaction;
        keep(id, next);
        return next.reactions[indicator] || null;
      },
      setConfidence(id, confidence) {
        id = key(id);
        if (confidence !== null && (!Number.isFinite(confidence) || confidence < -5 || confidence > 5)) {
          throw new Error('La confianza debe estar entre −5 y +5.');
        }
        const value = record(id);
        keep(id, { reactions: { ...value.reactions }, confidence });
      },
      clear() { records.clear(); },
      snapshot() {
        return [...records.entries()].map(([studentId, value]) => ({
          studentId, reactions: { ...value.reactions }, confidence: value.confidence
        }));
      }
    });
  }
  return Object.freeze({ indicators, reactions, createStore, nextSort, sortRows });
}));
