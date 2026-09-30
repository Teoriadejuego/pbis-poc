'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');
const XLSX = require('../vendor/xlsx.full.min.js');
const { createFeedbackService, createResendSender, validatePayload, workbookBytes, emailPayload,
  assertPrivateDatabase, RECIPIENT } = require('../feedback-service/service.cjs');
const { exportOpinions } = require('../feedback-service/export.cjs');

const example = (overrides = {}) => {
  const payload = { eventId: randomUUID(), sessionCode: randomUUID(), role: 'tutor', sheet: 'group',
    rating: 4, comment: 'La ficha se comprende bien.', version: '0.9.1', date: '2026-09-29',
    classCode: 'aula-01', studentCode: null, ...overrides };
  if (payload.sheet === 'individual' && !Object.hasOwn(overrides, 'studentCode')) payload.studentCode = '00001';
  return payload;
};

async function start(t, overrides = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'radars-feedback-test-'));
  const dbPath = path.join(directory, 'private.sqlite');
  const sent = [];
  const service = createFeedbackService({ dbPath, pollMs: 0, mailSender: async payload => {
    sent.push(payload); return { accepted: true };
  }, ...overrides });
  await new Promise(resolve => service.server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${service.server.address().port}`;
  t.after(async () => {
    await service.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return { service, sent, dbPath, directory, origin, post: async (body, init = {}) => {
    const response = await fetch(`${origin}/api/feedback`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'null' },
      body: JSON.stringify(body), ...init });
    return { status: response.status, headers: response.headers, json: await response.json() };
  } };
}

function records(dbPath) {
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try { return db.prepare('SELECT * FROM opinions ORDER BY created_ms').all(); } finally { db.close(); }
}

test('an accepted opinion persists only the agreed fields and operational delivery state', async t => {
  const f = await start(t), payload = example();
  const response = await f.post(payload);
  assert.equal(response.status, 200);
  assert.deepEqual(response.json, { saved: true, emailStatus: 'accepted' });
  assert.equal(response.headers.get('access-control-allow-origin'), '*');
  assert.equal(response.headers.get('access-control-allow-credentials'), null);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(f.sent, [payload]);
  const row = records(f.dbPath)[0];
  assert.deepEqual(JSON.parse(row.payload), payload);
  assert.deepEqual(Object.keys(row).sort(), ['event_id', 'payload', 'created_ms', 'email_status', 'attempts', 'first_attempt_ms', 'next_attempt_ms'].sort());
});

test('an identical retry, reordered properties and uppercase UUIDs send only once', async t => {
  const f = await start(t), payload = example();
  assert.equal((await f.post(payload)).status, 200);
  const reordered = Object.fromEntries(Object.entries(payload).reverse());
  reordered.eventId = reordered.eventId.toUpperCase(); reordered.sessionCode = reordered.sessionCode.toUpperCase();
  assert.equal((await f.post(reordered)).status, 200);
  assert.equal(f.sent.length, 1);
  assert.equal(records(f.dbPath).length, 1);
});

test('a duplicate event with changed comment, role, rating or sheet is a conflict', async t => {
  const f = await start(t), payload = example();
  await f.post(payload);
  for (const change of [{ comment: 'Otra' }, { role: 'orientador' }, { rating: 5 }, { sheet: 'individual', studentCode: '00001' }, { classCode: 'aula-02' }]) {
    assert.equal((await f.post({ ...payload, ...change })).status, 409);
  }
  assert.equal(f.sent.length, 1);
});

test('concurrent duplicate requests share the same send', async t => {
  let sends = 0;
  const f = await start(t, { mailSender: async () => {
    sends++; await new Promise(resolve => setTimeout(resolve, 30)); return { accepted: true };
  } });
  const payload = example();
  const responses = await Promise.all([f.post(payload), f.post(payload), f.post(payload)]);
  assert.ok(responses.every(result => result.status === 200));
  assert.equal(sends, 1);
});

test('additional private fields, missing keys and invalid ranges never reach storage or email', async t => {
  const f = await start(t, { perIpLimit: 100 });
  const variants = [
    { user: 'tutor7a' }, { centro: 'Sevilla' }, { group: 'A' }, { student: 'Ana' }, { to: 'other@example.org' },
    { rating: 0 }, { rating: 6 }, { rating: 3.5 }, { rating: '4' }, { role: 'admin' }, { sheet: 'students' },
    { comment: 'a'.repeat(1501) }, { comment: null }, { comment: 'a\0b' }, { version: '0.9' },
    { date: '2026-02-30' }, { date: '29/09/2026' }, { eventId: 'user123' }, { sessionCode: 'tutor7a' },
    { classCode: '' }, { classCode: 'a'.repeat(81) }, { classCode: 'Aula con nombre' }, { classCode: 123 },
    { studentCode: '001' }, { sheet: 'individual', studentCode: null }, { sheet: 'individual', studentCode: 1 },
    { sheet: 'individual', studentCode: '=1+1' }
  ];
  for (const variant of variants) assert.equal((await f.post(example(variant))).status, 400, JSON.stringify(variant));
  const missing = example(); delete missing.date;
  for (const payload of [missing, null, [], 'text']) assert.equal((await f.post(payload)).status, 400);
  assert.equal(records(f.dbPath).length, 0);
  assert.equal(f.sent.length, 0);
  assert.equal((await f.post(example({ comment: '', rating: 1 }))).status, 200);
  assert.equal((await f.post(example({ comment: 'a'.repeat(1500), rating: 5, role: 'orientador', sheet: 'individual' }))).status, 200);
  assert.equal((await f.post(example({ comment: '🙂'.repeat(1500) }))).status, 200);
});

test('unconfigured service returns 503 and does not silently save feedback', async t => {
  const f = await start(t, { mailSender: null, apiKey: '', from: '' });
  const response = await f.post(example());
  assert.equal(response.status, 503);
  assert.equal(records(f.dbPath).length, 0);
  const health = await fetch(`${f.origin}/health`);
  assert.equal(health.status, 503);
  assert.deepEqual(await health.json(), { status: 'unconfigured' });
});

test('failed email is saved pending and durable retry can later confirm acceptance', async t => {
  let time = 100000, attempts = 0;
  const f = await start(t, { now: () => time, retryBaseMs: 100, mailSender: async () => {
    if (++attempts === 1) throw new Error('provider unavailable'); return { accepted: true };
  } });
  const payload = example();
  assert.deepEqual((await f.post(payload)).json, { saved: true, emailStatus: 'pending' });
  assert.equal((await f.post(payload)).status, 202);
  assert.equal(attempts, 1);
  await f.service.flushQueue(); assert.equal(attempts, 1);
  time += 100; await f.service.flushQueue(); assert.equal(attempts, 2);
  assert.deepEqual((await f.post(payload)).json, { saved: true, emailStatus: 'accepted' });
  assert.equal(records(f.dbPath)[0].email_status, 'accepted');
});

test('unconfirmed sender results do not claim email acceptance and five attempts are the limit', async t => {
  let time = 100000, attempts = 0;
  const f = await start(t, { now: () => time, retryBaseMs: 10, mailSender: async () => { attempts++; return {}; } });
  await f.post(example());
  for (let i = 0; i < 10; i++) { time += 10000; await f.service.flushQueue(); }
  assert.equal(attempts, 5);
  const row = records(f.dbPath)[0];
  assert.equal(row.email_status, 'pending'); assert.equal(row.attempts, 5);
});

test('a service restart recovers the durable queue without duplicating accepted events', async t => {
  let time = 100000;
  const f = await start(t, { now: () => time, retryBaseMs: 100, mailSender: async () => { throw new Error('offline'); } });
  const payload = example(); await f.post(payload);
  let accepted = 0;
  await f.service.close();
  const restarted = createFeedbackService({ dbPath: f.dbPath, now: () => time, pollMs: 0,
    mailSender: async () => { accepted++; return { accepted: true }; } });
  try {
    time += 100; await restarted.flushQueue(); await restarted.flushQueue();
    assert.equal(accepted, 1);
    assert.equal(records(f.dbPath)[0].email_status, 'accepted');
  } finally { await restarted.close(); }
});

test('queue does not automatically resend beyond the provider idempotency window', async t => {
  let time = 100000, attempts = 0;
  const f = await start(t, { now: () => time, mailSender: async () => { attempts++; throw new Error('offline'); } });
  const payload = example(); await f.post(payload);
  time += 24 * 60 * 60 * 1000;
  await f.service.flushQueue(); await f.post(payload);
  assert.equal(attempts, 1);
  assert.equal(records(f.dbPath)[0].email_status, 'pending');
});

test('per-connection-address limit ignores forged forwarding headers and does not persist addresses', async t => {
  const f = await start(t, { perIpLimit: 1 });
  await f.post(example());
  const response = await f.post(example(), { headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '1.2.3.4' } });
  assert.equal(response.status, 429);
  assert.equal(records(f.dbPath).length, 1);
  assert.doesNotMatch(JSON.stringify(records(f.dbPath)), /127\.0\.0\.1|1\.2\.3\.4/);
});

test('global daily budget is durable and duplicate retries do not consume it', async t => {
  const f = await start(t, { dailyLimit: 1 });
  const payload = example(); await f.post(payload);
  assert.equal((await f.post(payload)).status, 200);
  assert.equal((await f.post(example())).status, 429);
  assert.equal(records(f.dbPath).length, 1);
});

test('API has no read endpoint, checks methods and content types, limits bytes, supports file-origin preflight', async t => {
  const f = await start(t);
  for (const target of ['/opiniones.xlsx', '/private.sqlite', '/api/opinions', '/api/feedback?dump=1']) {
    assert.equal((await fetch(f.origin + target)).status, 404);
  }
  assert.equal((await fetch(`${f.origin}/api/feedback`)).status, 405);
  assert.equal((await f.post(example(), { headers: { 'Content-Type': 'text/plain' } })).status, 415);
  assert.equal((await f.post(example(), { headers: { 'Content-Type': 'application/json', 'Content-Encoding': 'gzip' } })).status, 415);
  assert.equal((await f.post(example({ comment: 'x'.repeat(9000) }))).status, 413);
  assert.equal((await f.post(example(), { body: '{invalid' })).status, 400);
  const preflight = await fetch(`${f.origin}/api/feedback`, { method: 'OPTIONS', headers: { Origin: 'null' } });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-origin'), '*');
  assert.equal(preflight.headers.get('access-control-allow-headers'), 'Content-Type');
  const health = await fetch(`${f.origin}/health`);
  assert.deepEqual(await health.json(), { status: 'ready' });
});

test('email has a fixed recipient, plain text body and only the current opinion in its attachment', () => {
  const payload = example({ comment: '<img src=x onerror=alert(1)>\n=HYPERLINK("https://bad.example")' });
  const email = emailPayload(payload, 'RADARS <opiniones@example.org>');
  assert.deepEqual(email.to, [RECIPIENT]); assert.equal(RECIPIENT, 'pbis_usuario@outlook.es');
  assert.equal(email.html, undefined); assert.ok(email.text.includes(payload.comment));
  assert.equal(email.attachments.length, 1);
  const book = XLSX.read(Buffer.from(email.attachments[0].content, 'base64'), { type: 'buffer' });
  assert.deepEqual(book.SheetNames, ['Opiniones']);
  const rows = XLSX.utils.sheet_to_json(book.Sheets.Opiniones, { header: 1 });
  assert.equal(rows.length, 2); assert.equal(rows[1][0], payload.eventId); assert.equal(rows[1][7], payload.comment);
  assert.equal(rows[1][4], payload.classCode); assert.equal(rows[1][5], '');
});

test('workbook bytes are deterministic and formula-like comments remain inert text', () => {
  const payloads = ['=1+1', '+SUM(A1:A2)', '-42', '@SUM(A1:A2)', '\t=HYPERLINK("https://bad.example")'].map(comment => example({ comment }));
  const bytes = workbookBytes(payloads);
  assert.deepEqual(workbookBytes(payloads), bytes);
  const sheet = XLSX.read(bytes, { type: 'buffer', cellFormula: true }).Sheets.Opiniones;
  for (let i = 0; i < payloads.length; i++) {
    const cell = sheet[`H${i + 2}`];
    assert.equal(cell.t, 's'); assert.equal(cell.v, payloads[i].comment); assert.equal(cell.f, undefined); assert.equal(cell.l, undefined);
    assert.equal(sheet[`G${i + 2}`].t, 'n');
  }
  const individual = example({ sheet: 'individual', studentCode: '0000001' });
  const idCell = XLSX.read(workbookBytes([individual]), { type: 'buffer' }).Sheets.Opiniones.F2;
  assert.equal(idCell.t, 's'); assert.equal(idCell.v, '0000001');
});

test('Resend adapter sends an idempotent request with timeout and requires provider confirmation', async () => {
  const calls = [], payload = example();
  const sender = createResendSender({ apiKey: 'test-key', from: 'Test <test@example.org>', fetchImpl: async (url, options) => {
    calls.push({ url, options }); return new Response(JSON.stringify({ id: 'accepted-id' }), { status: 200 });
  } });
  assert.deepEqual(await sender(payload), { accepted: true });
  const { url, options } = calls[0];
  assert.equal(url, 'https://api.resend.com/emails'); assert.equal(options.method, 'POST'); assert.equal(options.redirect, 'error');
  assert.equal(options.headers['Idempotency-Key'], `radars-feedback/${payload.eventId}`);
  assert.equal(options.headers.Authorization, 'Bearer test-key'); assert.ok(options.signal instanceof AbortSignal);
  assert.deepEqual(JSON.parse(options.body).to, [RECIPIENT]);
  for (const response of [new Response('{}', { status: 200 }), new Response('provider error', { status: 429 })]) {
    const failed = createResendSender({ apiKey: 'test-key', from: 'test@example.org', fetchImpl: async () => response });
    await assert.rejects(failed(payload));
  }
});

test('private CLI export collects multiple rows without changing delivery state or replacing files', async t => {
  const f = await start(t); await f.post(example()); await f.post(example({ role: 'orientador', sheet: 'individual' }));
  const output = path.join(f.directory, 'Opiniones.xlsx');
  assert.equal(exportOpinions(f.dbPath, output), 2);
  const book = XLSX.read(fs.readFileSync(output), { type: 'buffer' });
  assert.equal(XLSX.utils.sheet_to_json(book.Sheets.Opiniones).length, 2);
  assert.throws(() => exportOpinions(f.dbPath, output));
  assert.ok(records(f.dbPath).every(row => row.email_status === 'accepted'));
  for (const directory of ['site', 'site-src', 'release', 'outputs']) {
    assert.throws(() => assertPrivateDatabase(path.resolve(__dirname, '..', directory, 'data.sqlite')));
  }
  assert.throws(() => assertPrivateDatabase('relative.sqlite'));
});
