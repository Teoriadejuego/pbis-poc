"""Create reviewable delivery archives without authoring caches or local dependencies."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parent.parent
allowed = ['src', 'site-src', 'site', 'release', 'data', 'docs', 'tools', 'tests', 'vendor', 'qa']
files = [root / 'README.md', root / 'COMPROBACIONES.md']
for folder in allowed:
    files.extend(p for p in (root / folder).rglob('*') if p.is_file() and not p.is_symlink())
files.extend((root / 'outputs' / 'entrega-20260929').glob('*.xlsx'))
service_files = ['service.cjs', 'server.cjs', 'export.cjs', 'README.md', '.env.example', '.gitignore']
files.extend(root / 'feedback-service' / name for name in service_files)
target = root.parent / 'PBIS_Producto_0.9.1.zip'
with ZipFile(target, 'w', ZIP_DEFLATED, compresslevel=6) as archive:
    for source in sorted(files):
        archive.write(source, 'PBIS_Producto_0.9.1/' + source.relative_to(root).as_posix())
with ZipFile(target) as archive:
    assert archive.testzip() is None
    assert not any('.qa/' in p or 'node_modules/' in p or '.inspect.ndjson' in p for p in archive.namelist())
    assert not any(p.endswith(('.env', '.sqlite', '.sqlite-journal', '.db')) for p in archive.namelist())
print(f'{target.name}: {target.stat().st_size:,} bytes; {len(files)} files; CRC OK')
web_target = root.parent / 'PBIS_Web_0.9.1.zip'
with ZipFile(web_target, 'w', ZIP_DEFLATED, compresslevel=6) as archive:
    for source in sorted((root / 'site').rglob('*')):
        if source.is_file():
            archive.write(source, source.relative_to(root / 'site').as_posix())
with ZipFile(web_target) as archive:
    assert archive.testzip() is None
print(f'{web_target.name}: {web_target.stat().st_size:,} bytes; CRC OK')
