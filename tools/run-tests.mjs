import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entries = await readdir(path.join(root, 'tests'), { withFileTypes: true });
const files = entries
  .filter(entry => entry.isFile() && /\.test\.(?:cjs|mjs|js)$/.test(entry.name))
  .map(entry => path.join('tests', entry.name))
  .sort();

if (!files.length) throw new Error('No se encontraron pruebas en tests/.');

// Pass individual paths directly, avoiding shell-specific wildcard expansion.
const result = spawnSync(process.execPath, ['--test', ...files], {
  cwd: root,
  stdio: 'inherit',
  shell: false
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
