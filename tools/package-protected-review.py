"""Build a local review kit from an explicit list of synthetic artifacts."""
from pathlib import Path
import shutil
from package_files import write_archive

root = Path(__file__).resolve().parent.parent
target = root / 'revision-local'
target.mkdir(exist_ok=True)
copies = {
    'PBIS.html': 'release/PBIS.html',
    'index.html': 'release/index.html',
    'PROYECTOS_PROTEGIDOS.md': 'docs/PROYECTOS_PROTEGIDOS.md',
    'PROMPTS_ADMINISTRACION_PROYECTOS.md': 'docs/PROMPTS_ADMINISTRACION_PROYECTOS.md',
    'VALIDACION.md': 'docs/VALIDACION_PROYECTOS_PROTEGIDOS.md',
    'LICENSE-SheetJS.txt': 'vendor/LICENSE-SheetJS.txt',
    'COMPONENTES.txt': 'release/COMPONENTES.txt',
}
for name in ['Code.gs', 'Registro.html', 'appsscript.json', 'README.md']:
    copies['audit-service/' + name] = 'audit-service/' + name
for destination, source in copies.items():
    path = target / destination
    path.parent.mkdir(exist_ok=True, parents=True)
    shutil.copyfile(root / source, path)
names = list(copies) + ['Centro_pruebas.pbis', 'ACCESOS_DE_PRUEBA.txt', 'Registro_pruebas.json']
files = {name: (target / name).read_bytes() for name in names}
archive = root / 'PBIS_Revision_Proyectos_20261022.zip'
count = write_archive(archive, 'PBIS_Revision_Local', files)
print(f'{archive}: {count} archivos verificados; solo datos sintéticos.')
