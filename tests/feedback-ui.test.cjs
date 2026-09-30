'use strict';
// A small DOM fixture exercises the real event handlers without any network,
// browser automation or sent email. The real XLSX bytes have separate tests.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const source = name => fs.readFileSync(path.join(__dirname, '../src', name), 'utf8');
const flush = () => new Promise(resolve => setImmediate(resolve));

function fixture({endpoint = '', fetchResult, holdWorker = false} = {}) {
  const elements = new Map(), radios = [], downloads = [], fetchCalls = [], workers = [], urls = new Map(), timers = new Map();
  let nextTimer = 0, nextUrl = 0;
  class Element {
    constructor(tag) {this.tag = tag; this.listeners = {}; this.value = ''; this.checked = false; this.disabled = false; this.hidden = false; this.open = false; this.textContent = '';}
    setAttribute() {}
    append(child) {if (child.id) elements.set(child.id, child);}
    set innerHTML(value) {
      this.html = value;
      for (const [, id] of value.matchAll(/\bid="([^"]+)"/g)) {const el = new Element(id === 'feedback-form' ? 'form' : 'div'); el.id = id; elements.set(id, el);}
      for (let i = 1; i <= 5; i++) {const radio = new Element('input'); radio.value = String(i); radios.push(radio);}
    }
    querySelectorAll() {return radios;}
    addEventListener(name, handler) {(this.listeners[name] ??= []).push(handler);}
    dispatch(name) {return Promise.all((this.listeners[name] || []).map(handler => handler({preventDefault() {}, target: this})));}
    showModal() {this.open = true;}
    close() {this.open = false; this.dispatch('close');}
    reset() {for (const radio of radios) radio.checked = false; const comment = elements.get('feedback-comment'); if (comment) comment.value = '';}
    focus() {this.focused = true;}
    click() {if (this.tag === 'a') downloads.push({href: this.href, filename: this.download}); return this.dispatch('click');}
    remove() {}
  }
  const document = {body: new Element('body'), createElement: tag => new Element(tag), getElementById: id => elements.get(id)};
  class Worker {
    constructor(url) {this.url = url; this.terminated = false; workers.push(this);}
    postMessage(data) {
      this.data = JSON.parse(JSON.stringify(data));
      if (!holdWorker) queueMicrotask(() => this.onmessage({data: {buffer: new ArrayBuffer(16)}}));
    }
    terminate() {this.terminated = true;}
  }
  const context = {
    document, crypto: crypto.webcrypto, Blob, Worker, AbortController,
    // Shared TypeError lets a simulated failed fetch behave like a browser error.
    TypeError,
    URL: {createObjectURL(blob) {const url = 'blob:fixture/' + ++nextUrl; urls.set(url, blob); return url;}, revokeObjectURL: url => urls.delete(url)},
    setTimeout(handler, delay) {const id = ++nextTimer; timers.set(id, {handler, delay}); return id;},
    clearTimeout: id => timers.delete(id),
    fetch(url, options) {
      const call = {url, options, payload: JSON.parse(options.body)}; fetchCalls.push(call);
      if (!fetchResult) return Promise.reject(new TypeError('Network must never be reached in this test'));
      return fetchResult(call, fetchCalls.length);
    },
    PBIS_FEEDBACK: {endpoint, recipient: 'pbis_usuario@outlook.es', version: '0.9.1'},
    PBIS_FEEDBACK_WORKER: 'test worker supplied separately',
    // Poisoned app metadata proves the feature does not read report/profile state.
    PBIS_PROFILES: [{username: 'DO_NOT_SEND_USERNAME', center: 'DO_NOT_SEND_CENTER'}],
    unrelatedStudent: {name: 'DO_NOT_SEND_STUDENT', score: 8}
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(source('feedback-model.js') + '\n' + source('feedback.js'), context, {filename: 'feedback-ui-under-test.js'});
  const el = suffix => elements.get('feedback-' + suffix);
  const api = context.PbisFeedback;
  const choose = (rating, comment = '') => {radios.forEach(radio => {radio.checked = radio.value === String(rating);}); el('comment').value = comment;};
  const respond = (saved = true, emailStatus = 'accepted') => ({ok: true, status: 200, json: async () => ({saved, emailStatus})});
  const open = (sheet, codes = {}) => api.open({sheet, classCode: 'AULA-1234567890abcdef12345678', studentCode: sheet === 'individual' ? '00012' : null, ...codes});
  return {api, open, el, choose, radios, downloads, fetchCalls, workers, timers, urls, respond,
    submit: () => el('form').dispatch('submit'), save: () => el('save').dispatch('click')};
}

function assertAnonymous(opinion) {
  assert.deepEqual(Object.keys(opinion).sort(), ['classCode', 'comment', 'date', 'eventId', 'rating', 'role', 'sessionCode', 'sheet', 'studentCode', 'version']);
  assert.doesNotMatch(JSON.stringify(opinion), /DO_NOT_SEND|username|studentName|center|groupName/);
}
const success = status => ({ok: true, status: 200, json: async () => ({saved: true, emailStatus: status})});

test('default offline UI makes no fetch and exports only the separate opinion record', async () => {
  const f = fixture(); f.api.startSession('tutor'); f.open('group');
  assert.equal(f.el('send').hidden, true);
  assert.match(f.el('mode').textContent, /correo aún no está activado/);
  f.choose(4, 'Más espacio entre tarjetas.');
  await f.submit();
  assert.equal(f.fetchCalls.length, 0);
  assert.equal(f.workers.length, 1);
  assert.equal(f.workers[0].data.opinions.length, 1);
  const opinion = f.workers[0].data.opinions[0]; assertAnonymous(opinion);
  assert.equal(opinion.role, 'tutor'); assert.equal(opinion.sheet, 'group'); assert.equal(opinion.rating, 4);
  assert.equal(opinion.comment, 'Más espacio entre tarjetas.');
  assert.equal(f.workers[0].terminated, true);
  assert.deepEqual(f.downloads.map(item => item.filename), ['PBIS_Opiniones.xlsx']);
  assert.match(f.el('status').textContent, /no envía ningún correo/);
});

test('missing rating does not send or export and guides focus to the vote', async () => {
  const f = fixture({endpoint: 'https://feedback.example/opinions'});
  f.api.startSession('tutor'); f.open('individual');
  await f.submit(); await f.save();
  assert.equal(f.fetchCalls.length, 0); assert.equal(f.workers.length, 0);
  assert.match(f.el('status').textContent, /Elige una valoración/); assert.equal(f.radios[0].focused, true);
});

test('confirmed online submission sends no cookies/referrer and reports accepted separately from delivery', async () => {
  const f = fixture({endpoint: 'https://feedback.example/opinions', fetchResult: async () => success('accepted')});
  f.api.startSession('orientador'); f.open('individual'); f.choose(5, 'Muy clara.'); await f.submit();
  assert.equal(f.fetchCalls.length, 1);
  const {options, payload} = f.fetchCalls[0]; assertAnonymous(payload);
  assert.equal(payload.role, 'orientador'); assert.equal(payload.sheet, 'individual');
  assert.equal(options.credentials, 'omit'); assert.equal(options.referrerPolicy, 'no-referrer');
  assert.equal(options.redirect, 'error'); assert.equal(options.cache, 'no-store');
  assert.equal(options.method, 'POST'); assert.equal(options.headers['Content-Type'], 'application/json');
  assert.match(f.el('status').textContent, /proveedor ha aceptado/);
  assert.doesNotMatch(f.el('status').textContent, /entregado|recibido por/);
  assert.equal(f.el('send').disabled, true);
  await f.submit(); assert.equal(f.fetchCalls.length, 1, 'A confirmed opinion cannot be submitted twice from the same draft.');
});

test('pending email is a registered opinion and cannot be accidentally resent as new', async () => {
  const f = fixture({endpoint: 'https://feedback.example/opinions', fetchResult: async () => success('pending')});
  f.api.startSession('tutor'); f.open('group'); f.choose(3); await f.submit();
  assert.match(f.el('status').textContent, /registrada.*pendiente/);
  assert.equal(f.el('send').disabled, true);
  await f.submit(); assert.equal(f.fetchCalls.length, 1);
  await f.save();
  assert.equal(f.workers[0].data.opinions[0].eventId, f.fetchCalls[0].payload.eventId);
});

test('network failures preserve the exact opinion for idempotent retry and offline export', async () => {
  const f = fixture({endpoint: 'https://feedback.example/opinions', fetchResult: async (_call, index) => {
    if (index === 1) throw new TypeError('Offline'); return success('accepted');
  }});
  f.api.startSession('tutor'); f.open('group'); f.choose(2, 'Cambiar el tamaño del texto.'); await f.submit();
  assert.match(f.el('status').textContent, /no se ha podido confirmar/i);
  assert.equal(f.el('send').disabled, false); assert.equal(f.el('send').textContent, 'Reintentar envío');
  assert.equal(f.el('comment').disabled, true);
  await f.save(); assert.equal(f.workers[0].data.opinions.length, 1);
  await f.submit();
  assert.deepEqual(f.fetchCalls[1].payload, f.fetchCalls[0].payload);
  assert.deepEqual(f.workers[0].data.opinions[0], f.fetchCalls[0].payload);
  assert.equal(f.el('send').disabled, true);
});

test('unsuccessful, rate-limited and unconfirmed responses remain retryable', async () => {
  for (const response of [
    {ok: false, status: 500}, {ok: false, status: 429},
    {ok: true, status: 200, json: async () => ({saved: false, emailStatus: 'accepted'})},
    {ok: true, status: 200, json: async () => ({saved: true, emailStatus: 'delivered'})}
  ]) {
    const f = fixture({endpoint: 'https://feedback.example/opinions', fetchResult: async () => response});
    f.api.startSession('tutor'); f.open('group'); f.choose(4); await f.submit();
    assert.equal(f.el('send').disabled, false);
    assert.equal(f.el('send').textContent, 'Reintentar envío');
    assert.doesNotMatch(f.el('status').textContent, /^Gracias/);
  }
});

test('group and individual drafts retain their own context and share only a random session code', async () => {
  const f = fixture(); f.api.startSession('tutor'); f.open('group'); f.choose(3, 'Comentario de grupo.');
  f.api.closeContext(); f.open('individual'); f.choose(4, 'Comentario individual.'); await f.save();
  f.api.closeContext(); f.open('group'); assert.equal(f.el('comment').value, 'Comentario de grupo.'); await f.save();
  const opinions = f.workers[1].data.opinions;
  assert.equal(opinions.length, 2); opinions.forEach(assertAnonymous);
  assert.deepEqual(opinions.map(row => [row.sheet, row.comment]), [['individual', 'Comentario individual.'], ['group', 'Comentario de grupo.']]);
  assert.equal(opinions[0].sessionCode, opinions[1].sessionCode); assert.notEqual(opinions[0].eventId, opinions[1].eventId);
});

test('logout clears drafts, records and old status and creates a fresh session code', async () => {
  const f = fixture(); f.api.startSession('tutor'); f.open('group'); f.choose(4, 'Old private draft.'); await f.save();
  const oldCode = f.workers[0].data.opinions[0].sessionCode;
  f.api.reset();
  assert.equal(f.el('dialog').open, false); assert.equal(f.el('comment').value, ''); assert.equal(f.el('status').textContent, '');
  f.open('group'); assert.equal(f.el('dialog').open, false, 'A closed session cannot open opinions.');
  f.api.startSession('orientador'); f.open('group');
  assert.equal(f.el('comment').value, ''); assert.equal(f.radios.some(radio => radio.checked), false);
  f.choose(5, 'New session.'); await f.save();
  const rows = f.workers[1].data.opinions; assert.equal(rows.length, 1);
  assert.equal(rows[0].comment, 'New session.'); assert.notEqual(rows[0].sessionCode, oldCode);
});

test('logout aborts all pending requests from different ficha contexts and ignores late statuses', async () => {
  const f = fixture({endpoint: 'https://feedback.example/opinions', fetchResult: call => new Promise((_resolve, reject) => {
    call.options.signal.addEventListener('abort', () => {const error = new Error('Aborted'); error.name = 'AbortError'; reject(error);});
  })});
  f.api.startSession('tutor'); f.open('group'); f.choose(4); const first = f.submit();
  f.api.closeContext(); f.open('individual'); f.choose(5); const second = f.submit();
  assert.equal(f.fetchCalls.length, 2);
  f.api.reset();
  assert.ok(f.fetchCalls.every(call => call.options.signal.aborted));
  await Promise.all([first, second]);
  assert.equal(f.el('status').textContent, ''); assert.equal(f.el('dialog').open, false);
  assert.equal(f.timers.size, 0);
});

test('only one export runs at a time, and logout terminates it without a later download', async () => {
  const f = fixture({holdWorker: true}); f.api.startSession('tutor'); f.open('group'); f.choose(4); const first = f.save();
  f.api.closeContext(); f.open('individual'); f.choose(5); await f.save();
  assert.equal(f.workers.length, 1); assert.match(f.el('status').textContent, /otro Excel/);
  f.api.reset(); await first;
  assert.equal(f.workers[0].terminated, true); assert.equal(f.downloads.length, 0); assert.equal(f.urls.size, 0);
  f.workers[0].onmessage({data: {buffer: new ArrayBuffer(16)}}); await flush();
  assert.equal(f.downloads.length, 0); assert.equal(f.el('status').textContent, '');
});

test('request timeouts target their own request and preserve the opinion for a later retry', async () => {
  const f = fixture({endpoint: 'https://feedback.example/opinions', fetchResult: call => new Promise((_resolve, reject) => {
    call.options.signal.addEventListener('abort', () => {const error = new Error('Timeout'); error.name = 'AbortError'; reject(error);});
  })});
  f.api.startSession('tutor'); f.open('group'); f.choose(4); const first = f.submit();
  const firstTimer = [...f.timers.values()].find(timer => timer.delay === 20000);
  f.api.closeContext(); f.open('individual'); f.choose(5); const second = f.submit();
  firstTimer.handler(); await first;
  assert.equal(f.fetchCalls[0].options.signal.aborted, true);
  assert.equal(f.fetchCalls[1].options.signal.aborted, false);
  f.api.closeContext(); f.open('group');
  assert.equal(f.el('send').disabled, false); assert.equal(f.el('send').textContent, 'Reintentar envío');
  f.api.reset(); await second;
});

test('failed and timed out Excel generation releases the worker and permits retry', async () => {
  for (const failure of ['error', 'timeout']) {
    const f = fixture({holdWorker: true}); f.api.startSession('tutor'); f.open('group'); f.choose(4, 'Conservar este comentario.');
    const saving = f.save();
    if (failure === 'error') f.workers[0].onerror();
    else [...f.timers.values()].find(timer => timer.delay === 15000).handler();
    await saving;
    assert.equal(f.workers[0].terminated, true); assert.equal(f.urls.size, 0);
    assert.equal(f.el('save').disabled, false); assert.match(f.el('status').textContent, /No se pudo crear el Excel/);
    const retry = f.save();
    assert.equal(f.workers.length, 2);
    assert.deepEqual(f.workers[1].data, f.workers[0].data, 'Retry must retain the same record, not duplicate it.');
    f.workers[1].onmessage({data: {buffer: new ArrayBuffer(16)}}); await retry;
    assert.equal(f.downloads.length, 1); assert.equal(f.fetchCalls.length, 0);
  }
});

test('an explicit new opinion gets a new event ID while the session Excel keeps both', async () => {
  const f = fixture({endpoint: 'https://feedback.example/opinions', fetchResult: async () => success('accepted')});
  f.api.startSession('tutor'); f.open('group'); f.choose(3, 'Primera opinión.'); await f.submit();
  await f.el('new').dispatch('click');
  assert.equal(f.el('comment').value, ''); assert.equal(f.el('comment').disabled, false);
  f.choose(5, 'Otra sugerencia.'); await f.submit(); await f.save();
  const first = f.fetchCalls[0].payload, second = f.fetchCalls[1].payload;
  assert.notEqual(first.eventId, second.eventId); assert.equal(first.sessionCode, second.sessionCode);
  assert.equal(f.workers[0].data.opinions.length, 2);
  assert.deepEqual(f.workers[0].data.opinions, [first, second]);
});

test('drafts are isolated by exact classroom and student keys, with no names in the exported context', async () => {
  const f = fixture(); f.api.startSession('orientador');
  f.open('individual', {classCode: 'AULA-AAA', studentCode: '00001', studentName: 'DO_NOT_SEND_STUDENT'});
  f.choose(2, 'Primera ficha individual.'); await f.save();
  assert.match(f.el('codes').textContent, /AULA-AAA.*00001/);
  f.api.closeContext(); f.open('individual', {classCode: 'AULA-AAA', studentCode: '00002'});
  assert.equal(f.el('comment').value, ''); assert.equal(f.el('comment').disabled, false);
  f.choose(5, 'Segunda ficha individual.'); await f.save();
  f.api.closeContext(); f.open('individual', {classCode: 'AULA-BBB', studentCode: '00001'});
  assert.equal(f.el('comment').value, ''); f.choose(4, 'Otra aula.'); await f.save();
  f.api.closeContext(); f.open('individual', {classCode: 'AULA-AAA', studentCode: '00001'});
  assert.equal(f.el('comment').value, 'Primera ficha individual.'); assert.equal(f.el('comment').disabled, true);
  const opinions = f.workers[2].data.opinions; assert.equal(opinions.length, 3); opinions.forEach(assertAnonymous);
  assert.deepEqual(opinions.map(row => [row.classCode, row.studentCode]), [['AULA-AAA', '00001'], ['AULA-AAA', '00002'], ['AULA-BBB', '00001']]);
});

test('group opinions always omit the individual key even if a caller passes a student selection', async () => {
  const f = fixture(); f.api.startSession('tutor');
  f.open('group', {classCode: 'AULA-AAA', studentCode: '00001', center: 'DO_NOT_SEND_CENTER'});
  f.choose(5); await f.save();
  const opinion = f.workers[0].data.opinions[0]; assertAnonymous(opinion);
  assert.equal(opinion.studentCode, null); assert.equal(opinion.classCode, 'AULA-AAA');
  assert.match(f.el('codes').textContent, /Sin referencia individual/);
});
