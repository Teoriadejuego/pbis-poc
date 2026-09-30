'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { openDatabase, assertPrivateDatabase, workbookBytes, validatePayload } = require('./service.cjs');

function exportOpinions(dbPath, outputPath) {
  if (!outputPath || path.extname(outputPath).toLowerCase() !== '.xlsx') throw new Error('Indica una ruta privada terminada en .xlsx.');
  const destination = assertPrivateDatabase(outputPath);
  if (fs.existsSync(destination)) throw new Error('El archivo de destino ya existe. Elige otro nombre.');
  const db = openDatabase(dbPath, true);
  try {
    const rows = db.prepare('SELECT payload FROM opinions ORDER BY created_ms, event_id').all();
    fs.writeFileSync(destination, workbookBytes(rows.map(row => validatePayload(JSON.parse(row.payload)))), { flag: 'wx', mode: 0o600 });
    return rows.length;
  } finally { db.close(); }
}

if (require.main === module) {
  try {
    const count = exportOpinions(process.env.FEEDBACK_DB, process.argv[2]);
    console.log(`Opiniones exportadas: ${count}. Guarda el archivo en un lugar privado.`);
  } catch {
    console.error('No se ha exportado. Comprueba FEEDBACK_DB, la ruta privada de destino y que el archivo no exista.');
    process.exitCode = 1;
  }
}
module.exports = { exportOpinions };
