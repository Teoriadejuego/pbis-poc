"""Public project files only; never walk uploads, outputs or feedback storage."""
from pathlib import Path
import hashlib
import json
from zipfile import ZipFile, ZIP_DEFLATED

ROOT_FILES = ['README.md', 'EMPIEZA_AQUI.md', 'COMPROBACIONES.md', 'PROMPTS.md',
              'package.json', 'package-lock.json', '.gitignore', '.gitattributes']
DATA_FILES = ['README.md', 'profiles.json', 'demo-account.json', 'fixtures.json',
              'schema.json', 'catalog.schema.json',
              'examples/datos_evaluacion.xlsx', 'examples/llave_evaluacion.xlsx']
SERVICE_FILES = ['service.cjs', 'server.cjs', 'export.cjs', 'README.md', '.env.example', '.gitignore']
AUDIT_FILES = ['Code.gs', 'Registro.html', 'appsscript.json', 'README.md']
SUFFIXES = {'.js', '.cjs', '.mjs', '.py', '.json', '.md', '.html', '.css', '.txt',
            '.jpg', '.png', '.webp', '.svg', '.yml', '.yaml', '.R', '.wasm'}
BLOCKED = {'private', 'storage', 'node_modules', '__pycache__', '.qa', 'qa'}

def project_files(root):
    root = Path(root).resolve()
    files = set(ROOT_FILES)
    files.update('data/' + name for name in DATA_FILES)
    files.update('feedback-service/' + name for name in SERVICE_FILES)
    files.update('audit-service/' + name for name in AUDIT_FILES)
    for folder in ['src', 'site-src', 'docs', 'tools', 'tests', 'vendor', '.github']:
        for source in (root / folder).rglob('*'):
            relative = source.relative_to(root)
            if source.is_symlink():
                raise ValueError('No se empaquetan enlaces simbólicos.')
            if any(part in BLOCKED for part in relative.parts) or source.name == 'AUDITORIA_SIN_DATOS_LOCAL.md':
                continue
            if source.is_file() and source.suffix in SUFFIXES:
                files.add(relative.as_posix())
    for name in files:
        source = root / name
        if source.is_symlink() or not source.resolve().is_relative_to(root) or not source.is_file():
            raise ValueError('Archivo de proyecto no disponible: ' + name)
    return sorted(files)

def generated_files(root):
    root = Path(root)
    manifest = json.loads((root / 'site/downloads/manifest.json').read_text(encoding='utf-8'))
    version = json.loads((root / 'package.json').read_text(encoding='utf-8'))['version']
    if manifest['version'] != version:
        raise ValueError('Construye la versión actual antes de empaquetar.')
    files = ['release/' + name for name in ['PBIS.html', 'index.html', 'COMPONENTES.txt', 'manifest.json']]
    files += ['site/' + name for name in ['index.html', 'PBIS.html', 'DEMO.html', '.nojekyll',
              'site.css', 'site.js', 'demo-data.json', 'assets/ficha-grupo-ejemplo.jpg',
              'guia.html', 'proyectos-protegidos.html', 'prompts-proyectos.html', 'metodologia.html', 'privacidad.html', 'opiniones.html',
              'feedback-datos.html', 'auditoria.html', 'prompts.html',
              'downloads/manifest.json', 'downloads/SHA256SUMS.txt']]
    expected = {'PBIS-Windows.zip', 'PBIS-macOS.zip', 'PBIS-Linux.zip', 'PBIS-Universal.zip'}
    if {item['name'] for item in manifest['files']} != expected or len(manifest['files']) != len(expected):
        raise ValueError('Descargas no previstas.')
    for item in manifest['files']:
        name = 'site/downloads/' + item['name']
        data = (root / name).read_bytes()
        if len(data) != item['size'] or hashlib.sha256(data).hexdigest() != item['sha256']:
            raise ValueError('Descarga alterada: ' + item['name'])
        files.append(name)
    return files

def application_files(root):
    """Only the application and its notices, never source data or server code."""
    root = Path(root).resolve()
    generated_files(root)  # Reject an outdated or corrupted build first.
    sources = {
        'PBIS.html': 'release/PBIS.html',
        'index.html': 'release/index.html',
        'COMPONENTES.txt': 'release/COMPONENTES.txt',
        'LICENSE-SheetJS.txt': 'vendor/LICENSE-SheetJS.txt',
        'LICENSE-jsPDF.txt': 'vendor/LICENSE-jsPDF.txt',
        'LICENSE-qpdf.txt': 'vendor/LICENSE-qpdf.txt',
        'EXPORTACION_PDF.md': 'docs/EXPORTACION_PDF.md',
        'PROMPT_EXPORTACION_PDF.md': 'docs/PROMPT_EXPORTACION_PDF.md',
        'PROYECTOS_PROTEGIDOS.md': 'docs/PROYECTOS_PROTEGIDOS.md',
        'REGISTRO_ACCESOS.md': 'audit-service/README.md',
    }
    files = {}
    for name, relative in sources.items():
        source = root / relative
        if source.is_symlink() or not source.resolve().is_relative_to(root):
            raise ValueError('Archivo de aplicación no permitido: ' + relative)
        # Match build.mjs: distributed text has LF line endings on every OS.
        files[name] = source.read_text(encoding='utf-8').encode('utf-8')
    with ZipFile(root / 'site/downloads/PBIS-Universal.zip') as archive:
        for name, data in files.items():
            if archive.read('PBIS/' + name) != data:
                raise ValueError('Aplicación distinta de la construcción verificada: ' + name)
    files['EMPIEZA-AQUI.txt'] = (
        'PBIS · Aplicación local\n\n'
        'Extrae la carpeta completa y abre index.html o PBIS.html en el navegador.\n'
        'No necesitas instalar Python, Node, R ni un servidor.\n'
        'PBIS.html incorpora los estilos, el lector Excel, el worker y la demo simulada.\n'
        'index.html es la pantalla de inicio; conserva ambos archivos juntos.\n'
        'Los Excel se leen localmente. Enviar valoraciones requiere Internet y utiliza Formspree.\n'
        'La demo no envía valoraciones.\n\n'
        'Introduce usuario y contraseña; después carga el archivo en Abrir proyecto.\n'
        'Consulta PROYECTOS_PROTEGIDOS.md. Incluye instrucciones de administración y alcance de las pruebas.\n'
    ).encode('utf-8')
    return files

def write_archive(target, prefix, files):
    target = Path(target)
    if target.exists():
        raise FileExistsError('La copia ya existe; elige otra ruta: ' + str(target))
    files = dict(files)
    files['SHA256SUMS_COPIA.txt'] = ''.join(
        hashlib.sha256(data).hexdigest() + '  ' + name + '\n'
        for name, data in sorted(files.items())).encode('utf-8')
    with ZipFile(target, 'x', ZIP_DEFLATED, compresslevel=6) as archive:
        for name, data in sorted(files.items()):
            if Path(name).is_absolute() or '..' in Path(name).parts:
                raise ValueError('Ruta no permitida.')
            archive.writestr(prefix + '/' + name, data)
    with ZipFile(target) as archive:
        if archive.testzip() is not None:
            raise ValueError('Copia dañada.')
        for name, data in files.items():
            if archive.read(prefix + '/' + name) != data:
                raise ValueError('Copia no idéntica.')
    digest = hashlib.sha256(target.read_bytes()).hexdigest()
    target.with_suffix('.zip.sha256').write_text(digest + '  ' + target.name + '\n', encoding='utf-8')
    return len(files)
