'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const XLSX = require('../vendor/xlsx.full.min.js');
const { makeOpinion } = require('../src/feedback-model.js');

const RECIPIENT = 'pbis_usuario@outlook.es';
const KEYS = ['eventId', 'sessionCode', 'role', 'sheet', 'rating', 'comment', 'version', 'date', 'classCode', 'studentCode'];
const MAX_BYTES = 8192;
const MAX_ATTEMPTS = 5;
// Resend only deduplicates for 24 hours. Never retry automatically outside this window.
const RETRY_WINDOW_MS = 23 * 60 * 60 * 1000;
const HEADERS = ['ID opinión', 'Código de sesión', 'Rol', 'Ficha', 'Clave_aula', 'Clave_estudiante', 'Valoración (1–5)', 'Comentario', 'Versión', 'Fecha'];

class RequestError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function validatePayload(value) {
  if (!value || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype ||
      Reflect.ownKeys(value).length !== KEYS.length || KEYS.some(key => !Object.hasOwn(value, key))) {
    throw new RequestError(400, 'La opinión contiene campos no admitidos o incompletos.');
  }
  let checked;
  try {
    checked = makeOpinion(value);
    // Keep the exact legacy comment for durable idempotency and historical exports.
    if (Array.from(value.comment).length > 1500) throw new Error('El comentario supera los 1.500 caracteres.');
  } catch (error) { throw new RequestError(400, error.message); }
  return {
    eventId: checked.eventId, sessionCode: checked.sessionCode,
    role: value.role, sheet: value.sheet, rating: value.rating, comment: value.comment,
    version: value.version, date: value.date, classCode: value.classCode, studentCode: value.studentCode
  };
}

const sheetLabel = sheet => ({ group: 'Ficha de aula', roster: 'Lista de aula', individual: 'Ficha de estudiante' })[sheet];

function workbookBytes(payloads) {
  const rows = [HEADERS, ...payloads.map(item => [item.eventId, item.sessionCode,
    item.role === 'tutor' ? 'Tutoría' : 'Orientación', sheetLabel(item.sheet),
    item.classCode, item.studentCode ?? '', item.rating, item.comment, item.version, item.date])];
  const sheet = {};
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      const value = rows[r][c];
      // Explicit string cells keep =, +, - and @ comments as text. Never set a formula or hyperlink.
      sheet[XLSX.utils.encode_cell({ r, c })] = typeof value === 'number' ? { t: 'n', v: value } : { t: 's', v: value };
    }
  }
  sheet['!ref'] = `A1:J${rows.length}`;
  sheet['!cols'] = [{ wch: 38 }, { wch: 38 }, { wch: 14 }, { wch: 20 }, { wch: 28 }, { wch: 24 }, { wch: 19 }, { wch: 85 }, { wch: 12 }, { wch: 13 }];
  sheet['!autofilter'] = { ref: sheet['!ref'] };
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Opiniones');
  // Stable bytes are necessary for provider idempotency, including after a restart.
  book.Props = { Title: 'Opiniones sobre PBIS', Author: 'PBIS',
    CreatedDate: new Date('2000-01-01T00:00:00Z'), ModifiedDate: new Date('2000-01-01T00:00:00Z') };
  return Buffer.from(XLSX.write(book, { type: 'buffer', bookType: 'xlsx', compression: true }));
}

function emailPayload(payload, from) {
  const role = payload.role === 'tutor' ? 'Tutoría' : 'Orientación';
  const sheet = sheetLabel(payload.sheet);
  return {
    from, to: [RECIPIENT], subject: `PBIS · Opinión sobre ${sheet.toLowerCase()}`,
    text: [
      'Nueva opinión sobre PBIS.', '', `Rol: ${role}`, `Código de sesión: ${payload.sessionCode}`,
      `Ficha: ${sheet}`, `Código del aula: ${payload.classCode}`, `Código de estudiante: ${payload.studentCode ?? '(No corresponde)'}`,
      `Valoración: ${payload.rating}/5`, `Fecha indicada: ${payload.date}`,
      `Versión: ${payload.version}`, `ID de opinión: ${payload.eventId}`, '',
      'Comentario:', payload.comment || '(Sin comentario)', '',
      'El adjunto contiene únicamente esta opinión y las claves de referencia. No incluye nombres, etiquetas de centro/curso/grupo ni indicadores de estudiantes. Los datos están seudonimizados.'
    ].join('\n'),
    attachments: [{ filename: 'Opiniones.xlsx', content: workbookBytes([payload]).toString('base64') }]
  };
}

function createResendSender({ apiKey, from, fetchImpl = fetch, timeoutMs = 10000 }) {
  return async payload => {
    const response = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(timeoutMs),
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json',
        'Idempotency-Key': `pbis-feedback/${payload.eventId}` },
      body: JSON.stringify(emailPayload(payload, from))
    });
    // Deliberately do not log or store the provider's body, headers or errors.
    if (!response.ok) { await response.body?.cancel(); throw new Error('El proveedor no aceptó el envío.'); }
    const result = await response.json();
    if (!result || typeof result.id !== 'string' || !result.id) throw new Error('Respuesta del proveedor no confirmada.');
    return { accepted: true };
  };
}

function assertPrivateDatabase(dbPath) {
  if (!dbPath || !path.isAbsolute(dbPath)) throw new Error('FEEDBACK_DB debe ser una ruta absoluta en un directorio privado.');
  const resolved = path.resolve(dbPath);
  const productRoot = path.resolve(__dirname, '..');
  for (const directory of ['site', 'site-src', 'release', 'outputs']) {
    const publicRoot = path.join(productRoot, directory);
    if (resolved === publicRoot || resolved.startsWith(`${publicRoot}${path.sep}`)) {
      throw new Error('La base de opiniones debe estar fuera de los archivos públicos y las entregas.');
    }
  }
  return resolved;
}

function openDatabase(dbPath, readOnly = false) {
  const resolved = assertPrivateDatabase(dbPath);
  if (!readOnly) fs.mkdirSync(path.dirname(resolved), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(resolved, { readOnly, enableForeignKeyConstraints: true, allowExtension: false });
  db.exec('PRAGMA busy_timeout = 5000;');
  if (!readOnly) {
    // A private DELETE journal avoids long-lived WAL copies and keeps durable acknowledged commits.
    db.exec(`PRAGMA journal_mode = DELETE; PRAGMA synchronous = FULL;
      CREATE TABLE IF NOT EXISTS opinions (
        event_id TEXT PRIMARY KEY, payload TEXT NOT NULL, created_ms INTEGER NOT NULL,
        email_status TEXT NOT NULL DEFAULT 'pending' CHECK(email_status IN ('pending','accepted')),
        attempts INTEGER NOT NULL DEFAULT 0, first_attempt_ms INTEGER,
        next_attempt_ms INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS opinions_queue ON opinions(email_status, next_attempt_ms);
      CREATE INDEX IF NOT EXISTS opinions_created ON opinions(created_ms);`);
    fs.chmodSync(resolved, 0o600);
  }
  return db;
}

function createFeedbackService(options = {}) {
  const now = options.now || Date.now;
  const configured = !!options.mailSender || (!!options.apiKey?.trim() && !!options.from?.trim() && !/[\r\n]/.test(options.from));
  const sender = options.mailSender || (configured ? createResendSender(options) : null);
  const db = openDatabase(options.dbPath);
  const retryBaseMs = options.retryBaseMs ?? 60000;
  const dailyLimit = options.dailyLimit ?? 500;
  const perIpLimit = options.perIpLimit ?? 30;
  const perIpWindowMs = options.perIpWindowMs ?? 3600000;
  const inFlight = new Map();
  const addresses = new Map();
  let closing = false, closePromise;
  const rowById = id => db.prepare('SELECT * FROM opinions WHERE event_id = ?').get(id);

  async function attempt(id) {
    if (inFlight.has(id)) return inFlight.get(id);
    const row = rowById(id);
    if (!row || row.email_status === 'accepted' || !configured || closing || row.attempts >= MAX_ATTEMPTS ||
        row.next_attempt_ms > now() || (row.first_attempt_ms !== null && now() - row.first_attempt_ms >= RETRY_WINDOW_MS)) return;
    const promise = (async () => {
      const time = now();
      // Commit before network I/O: a crash cannot reset the attempt budget or the idempotency window.
      db.prepare(`UPDATE opinions SET attempts = attempts + 1, first_attempt_ms = COALESCE(first_attempt_ms, ?),
        next_attempt_ms = ? WHERE event_id = ?`).run(time, time + retryBaseMs * 2 ** row.attempts, id);
      try {
        const result = await sender(JSON.parse(row.payload));
        if (result?.accepted !== true) throw new Error('No confirmado.');
        db.prepare("UPDATE opinions SET email_status = 'accepted' WHERE event_id = ?").run(id);
      } catch {
        // The committed row remains pending. The queue retries without logging the comment or credentials.
      }
    })();
    inFlight.set(id, promise);
    try { await promise; } finally { inFlight.delete(id); }
  }

  async function flushQueue() {
    if (!configured || closing) return;
    const due = db.prepare(`SELECT event_id FROM opinions WHERE email_status = 'pending' AND attempts < ?
      AND next_attempt_ms <= ? AND (first_attempt_ms IS NULL OR first_attempt_ms > ?)
      ORDER BY created_ms LIMIT 20`).all(MAX_ATTEMPTS, now(), now() - RETRY_WINDOW_MS);
    // Sequential sends stay within provider throughput limits.
    for (const row of due) { if (closing) break; await attempt(row.event_id); }
  }

  function rateLimit(address) {
    const time = now();
    for (const [key, value] of addresses) if (value.until <= time) addresses.delete(key);
    let entry = addresses.get(address);
    if (!entry) {
      if (addresses.size >= 10000) throw new RequestError(429, 'Hay demasiadas solicitudes. Inténtalo más tarde.');
      entry = { count: 0, until: time + perIpWindowMs };
      addresses.set(address, entry);
    }
    entry.count++;
    if (entry.count > perIpLimit) throw new RequestError(429, 'Has alcanzado el límite de intentos. Inténtalo más tarde.');
  }

  function response(res, status, value) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*', 'X-Content-Type-Options': 'nosniff',
      ...(status === 429 ? { 'Retry-After': '3600' } : {}) });
    res.end(JSON.stringify(value));
  }

  async function receive(req, res) {
    if (req.url === '/health' && req.method === 'GET') {
      response(res, configured ? 200 : 503, { status: configured ? 'ready' : 'unconfigured' }); return;
    }
    if (req.url !== '/api/feedback') { response(res, 404, { error: 'Ruta no disponible.' }); return; }
    if (req.method === 'OPTIONS') {
      res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '600', 'Cache-Control': 'no-store' });
      res.end(); return;
    }
    try {
      if (req.method !== 'POST') throw new RequestError(405, 'Solo se admite enviar una opinión.');
      rateLimit(req.socket.remoteAddress || 'unknown');
      if (!configured) throw new RequestError(503, 'El envío de opiniones todavía no está configurado. No se ha guardado la opinión.');
      if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(req.headers['content-type'] || '') ||
          (req.headers['content-encoding'] && req.headers['content-encoding'] !== 'identity')) {
        throw new RequestError(415, 'Se requiere JSON sin compresión.');
      }
      const raw = await readBody(req);
      let parsed;
      try { parsed = JSON.parse(raw); } catch { throw new RequestError(400, 'No se ha podido leer la opinión.'); }
      const payload = validatePayload(parsed);
      const canonical = JSON.stringify(payload);
      let row = rowById(payload.eventId);
      if (row && row.payload !== canonical) throw new RequestError(409, 'Ese código de opinión ya se utilizó para otro contenido.');
      if (!row) {
        const midnight = Math.floor(now() / 86400000) * 86400000;
        const count = db.prepare('SELECT COUNT(*) AS n FROM opinions WHERE created_ms >= ?').get(midnight).n;
        if (count >= dailyLimit) throw new RequestError(429, 'Se ha alcanzado el límite diario. Inténtalo mañana.');
        db.prepare('INSERT INTO opinions(event_id, payload, created_ms) VALUES (?, ?, ?)').run(payload.eventId, canonical, now());
      }
      await attempt(payload.eventId);
      row = rowById(payload.eventId);
      response(res, row.email_status === 'accepted' ? 200 : 202, { saved: true, emailStatus: row.email_status });
    } catch (error) {
      req.resume();
      response(res, error instanceof RequestError ? error.status : 500,
        { error: error instanceof RequestError ? error.message : 'No se ha podido confirmar el guardado. Inténtalo de nuevo con la misma opinión.' });
    }
  }

  const server = http.createServer((req, res) => { void receive(req, res); });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  server.keepAliveTimeout = 5000;
  server.maxHeadersCount = 25;
  server.maxRequestsPerSocket = 100;
  let timer = null;
  if (options.pollMs !== 0) {
    let running = false;
    timer = setInterval(async () => {
      if (running) return;
      running = true;
      try { await flushQueue(); } catch { /* A future tick retries; never log payloads. */ }
      finally { running = false; }
    }, options.pollMs ?? 15000);
    timer.unref();
  }
  return {
    server, configured, flushQueue,
    close() {
      if (closePromise) return closePromise;
      closing = true;
      if (timer) clearInterval(timer);
      closePromise = (async () => {
        if (server.listening) await new Promise(resolve => server.close(resolve));
        await Promise.allSettled([...inFlight.values()]);
        addresses.clear();
        db.close();
      })();
      return closePromise;
    }
  };
}

function readBody(req) {
  const length = req.headers['content-length'];
  if (length && (!/^\d+$/.test(length) || Number(length) > MAX_BYTES)) {
    return Promise.reject(new RequestError(413, 'La opinión es demasiado grande.'));
  }
  return new Promise((resolve, reject) => {
    let bytes = 0;
    const parts = [];
    const done = error => {
      req.removeListener('data', data);
      req.removeListener('end', end);
      req.removeListener('error', failed);
      req.removeListener('aborted', aborted);
      if (error) reject(error); else resolve(Buffer.concat(parts).toString('utf8'));
    };
    const data = chunk => {
      bytes += chunk.length;
      if (bytes > MAX_BYTES) { done(new RequestError(413, 'La opinión es demasiado grande.')); req.resume(); }
      else parts.push(chunk);
    };
    const end = () => done();
    const failed = () => done(new RequestError(400, 'La conexión se ha interrumpido.'));
    const aborted = failed;
    req.on('data', data); req.once('end', end); req.once('error', failed); req.once('aborted', aborted);
  });
}

module.exports = { RECIPIENT, KEYS, validatePayload, workbookBytes, emailPayload, createResendSender,
  assertPrivateDatabase, openDatabase, createFeedbackService };
