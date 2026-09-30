const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('PBIS branding is consistent in public pages, metadata and download names', () => {
  const root = path.resolve(__dirname, '..');
  for (const name of ['index.html', 'DEMO.html', 'PBIS.html', 'guia.html', 'privacidad.html', 'metodologia.html', 'opiniones.html']) {
    const html = fs.readFileSync(path.join(root, 'site', name), 'utf8');
    // Exclude the unchanged third-party Excel parser from the brand review.
    const visible = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
    assert.match(visible, /PBIS/);
    assert.doesNotMatch(visible, /radars?/i, name);
  }
  const home = fs.readFileSync(path.join(root, 'site/index.html'), 'utf8');
  assert.match(home, /property="og:site_name" content="PBIS"/);
  assert.match(home, /https:\/\/teoriadejuego\.github\.io\/pbis-poc\//);
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'site/downloads/manifest.json')));
  assert.deepEqual(manifest.files.filter(f => f.name.endsWith('.zip')).map(f => f.name),
    ['PBIS-Windows.zip', 'PBIS-macOS.zip', 'PBIS-Linux.zip', 'PBIS-Universal.zip']);
});
