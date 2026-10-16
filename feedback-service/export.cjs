'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { openDatabase, assertPrivateDatabase, workbookBytes, validatePayload } = require('./service.cjs');

class ExportError extends Error {
  constructor(code, message) { super(message); this.name = 'ExportError'; this.code = code; }
}

function exportOpinions(dbPath, outputPath) {
  if (!outputPath || path.extname(outputPath).toLowerCase() !== '.xlsx') throw new ExportError('INVALID_DESTINATION', 'Indica una ruta privada terminada en .xlsx.');
  let destination, db;
  try { destination = assertPrivateDatabase(outputPath); }
  catch { throw new ExportError('INVALID_DESTINATION', 'La ruta debe ser absoluta y estar fuera de las entregas públicas.'); }
  if (fs.existsSync(destination)) throw new ExportError('DESTINATION_EXISTS', 'El archivo de destino ya existe. Elige otro nombre.');
  try { db = openDatabase(dbPath, true); }
  catch { throw new ExportError('DATABASE_UNAVAILABLE', 'No se ha podido abrir la base privada para lectura.'); }
  try {
    const rows = db.prepare('SELECT payload FROM opinions ORDER BY created_ms, event_id').all();
    let bytes;
    try { bytes = workbookBytes(rows.map(row => validatePayload(JSON.parse(row.payload)))); }
    catch { throw new ExportError('INVALID_RECORD', 'La base contiene una opinión no válida. No se ha exportado.'); }
    try { fs.writeFileSync(destination, bytes, { flag: 'wx', mode: 0o600 }); }
    catch (error) {
      throw new ExportError(error.code === 'EEXIST' ? 'DESTINATION_EXISTS' : 'WRITE_FAILED', 'No se ha podido crear el archivo de destino.');
    }
    return rows.length;
  } catch (error) {
    if (error instanceof ExportError) throw error;
    throw new ExportError('DATABASE_UNAVAILABLE', 'No se ha podido leer la tabla de opiniones.');
  } finally { db.close(); }
}

if (require.main === module) {
  try {
    const count = exportOpinions(process.env.FEEDBACK_DB, process.argv[2]);
    console.log(`Opiniones exportadas: ${count}. Guarda el archivo en un lugar privado.`);
  } catch (error) {
    console.error(error instanceof ExportError ? `No se ha exportado [${error.code}]. ${error.message}` : 'No se ha exportado. Revisa la configuración.');
    process.exitCode = 1;
  }
}
module.exports = { exportOpinions, ExportError };
