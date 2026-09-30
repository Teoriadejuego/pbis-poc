'use strict';
const { createFeedbackService } = require('./service.cjs');

function integer(value, fallback, min, max) {
  if (value === undefined || value === '') return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) throw new Error('Configuración numérica no válida.');
  return n;
}

let service;
try {
  if (Number(process.versions.node.split('.')[0]) < 24) throw new Error('Se requiere Node.js 24 o posterior.');
  service = createFeedbackService({
    dbPath: process.env.FEEDBACK_DB, apiKey: process.env.RESEND_API_KEY, from: process.env.FEEDBACK_FROM,
    dailyLimit: integer(process.env.FEEDBACK_DAILY_LIMIT, 500, 1, 10000),
    perIpLimit: integer(process.env.FEEDBACK_CONNECTION_LIMIT, 30, 1, 10000)
  });
  const port = integer(process.env.FEEDBACK_PORT, 8787, 1, 65535);
  const host = process.env.FEEDBACK_HOST || '127.0.0.1';
  service.server.on('error', () => {
    console.error('No se ha podido abrir el servicio de opiniones. Revisa la configuración.');
    void service.close().finally(() => { process.exitCode = 1; });
  });
  service.server.listen(port, host, () => {
    console.log(service.configured ? 'Servicio de opiniones iniciado.' : 'Servicio iniciado sin envío configurado; las opiniones serán rechazadas.');
    void service.flushQueue().catch(() => {});
  });
  let stopping = false;
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
    if (stopping) return;
    stopping = true;
    void service.close().then(() => process.exit(0));
  });
} catch {
  console.error('No se ha iniciado el servicio. Revisa Node.js, FEEDBACK_DB y las variables de configuración.');
  process.exitCode = 1;
  if (service) void service.close();
}
