"""Build a separate static delivery from verified artifacts; never delete source files."""
import argparse
import hashlib
import io
from html import escape
from html.parser import HTMLParser
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED

from package_files import application_files

SECTIONS = [
    ('proyectos', 'Proyectos protegidos', 'PROYECTOS_PROTEGIDOS.md', 'proyectos-protegidos.html'),
    ('uso', 'Uso de PBIS', 'GUIA.md', 'guia.html'),
    ('privacidad', 'Archivos y privacidad', 'PRIVACIDAD.md', 'privacidad.html'),
    ('metodologia', 'Lectura de los indicadores', 'METODOLOGIA.md', 'metodologia.html'),
    ('valoraciones', 'Valoraciones', 'OPINIONES.md', 'opiniones.html'),
    ('formato', 'Formato de las valoraciones', 'FEEDBACK_DATOS.md', 'feedback-datos.html'),
]


def digest(data):
    return hashlib.sha256(data).hexdigest()


def with_checksums(files):
    files = dict(files)
    files['SHA256SUMS.txt'] = ''.join(
        digest(data) + '  ' + name + '\n' for name, data in sorted(files.items())
    ).encode('utf-8')
    return files


def zipped(files):
    buffer = io.BytesIO()
    with ZipFile(buffer, 'w', ZIP_DEFLATED, compresslevel=6) as archive:
        for name, data in sorted(files.items()):
            # Rebuilding unchanged inputs must produce identical bytes and hashes.
            entry = ZipInfo('PBIS/' + name, date_time=(1980, 1, 1, 0, 0, 0))
            entry.create_system = 3
            entry.external_attr = 0o100644 << 16
            archive.writestr(entry, data, compress_type=ZIP_DEFLATED, compresslevel=6)
    return buffer.getvalue()


def redirect():
    script = "location.replace('app.html'+location.search+location.hash);"
    import base64
    script_hash = base64.b64encode(hashlib.sha256(script.encode()).digest()).decode()
    return (
        '<!doctype html><html lang="es"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        '<meta name="referrer" content="no-referrer">'
        '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; '
        f'''script-src 'sha256-{script_hash}'; base-uri 'none'">'''
        '<title>PBIS</title></head><body><p><a href="app.html">Abrir PBIS</a></p>'
        f'<script>{script}</script></body></html>'
    ).encode('utf-8')


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = []

    def handle_starttag(self, tag, attrs):
        self.references.extend(value for key, value in attrs if key in {'href', 'src'} and value)


def validate_links(files):
    """Check relative resources in both the website and the downloaded folder."""
    from posixpath import normpath, dirname, join
    for name, data in files.items():
        if not name.endswith('.html'):
            continue
        parser = Links()
        parser.feed(data.decode('utf-8'))
        for reference in parser.references:
            url = urlsplit(reference)
            if url.scheme or url.netloc or not url.path:
                continue
            target = normpath(join(dirname(name), unquote(url.path)))
            if target.startswith(('../', '/')) or target not in files:
                raise ValueError(f'Enlace sin destino en {name}: {reference}')


def static_files(root):
    root = Path(root).resolve()
    application = application_files(root)
    read = lambda name: (root / name).read_text(encoding='utf-8')
    home = read('site/index.html')
    home = home.replace('href="PBIS.html', 'href="app.html').replace('href="DEMO.html', 'href="app.html')
    home = home.replace('href="site.css', 'href="assets/site.css').replace('src="site.js', 'src="assets/site.js')
    home = re.sub(r'downloads/PBIS-(?:Windows|macOS|Linux|Universal)\.zip', 'downloads/PBIS.zip', home)
    home = home.replace('La aplicación es la misma en los cuatro ZIP.', 'Una única descarga para los tres sistemas.')
    home = home.replace('La edición universal incluye instrucciones comunes.', 'Incluye la demo y funciona sin conexión.')
    for section, _, _, page in SECTIONS:
        home = home.replace(f'href="{page}"', f'href="docs/guia.html#{section}"')
    home = home.replace('href="auditoria.html">Revisión del piloto', 'href="docs/guia.html#compatibilidad">Compatibilidad')
    home = home.replace('href="prompts.html"', 'href="docs/guia.html#uso"')

    # Reuse the current rendered sections. Do not parse or minify application JS.
    guide_text = ['# Guía unificada de PBIS\n']
    guide_sections = []
    for section, label, document, page in SECTIONS:
        source = read('site/' + page)
        match = re.search(r'<main class="document"><a class="back"[^>]*>.*?</a>([\s\S]*?)</main>', source)
        if not match:
            raise ValueError('Falta una sección de la guía construida: ' + page)
        body = match.group(1)
        markdown = read('docs/' + document)
        old = 'Los cuatro ZIP contienen el mismo visualizador HTML. Las comprobaciones realizadas y los límites de compatibilidad están en COMPROBACIONES.md.'
        new = 'Esta distribución utiliza un único ZIP y el mismo app.html para consulta online y local. Consulta la sección Compatibilidad de esta guía.'
        body, markdown = body.replace(old, new), markdown.replace(old, new)
        old = 'Consulta FEEDBACK_DATOS.md en la edición descargable o la documentación del proyecto.'
        new = 'Consulta la sección Formato de las valoraciones de esta guía. El importador para investigación se conserva en el proyecto fuente.'
        body, markdown = body.replace(old, new), markdown.replace(old, new)
        body = body.replace('https://teoriadejuego.github.io/pbis-poc/feedback-datos.html', '#formato')
        markdown = markdown.replace('https://teoriadejuego.github.io/pbis-poc/feedback-datos.html', '#formato')
        guide_text.append(f'\n---\n\n## {label}\n\n' + markdown)
        guide_sections.append(f'<section id="{section}">{body}</section>')
    compatibility = ('La consulta y la demo funcionan en el navegador sin un servidor propio. '
        'La edición se ha comprobado en Edge sobre Windows. La validación en equipos físicos macOS y Linux sigue pendiente. '
        'Las valoraciones requieren Internet y se envían a Formspree; la demo no las envía. '
        'Las cuentas de evaluación incluidas no constituyen autenticación segura ni cifrado de archivos.')
    guide_text.append('\n## Compatibilidad\n\n' + compatibility + '\n')
    navigation = ' · '.join(f'<a href="#{section}">{escape(label)}</a>' for section, label, _, _ in SECTIONS)
    style = re.search(r'<style>([\s\S]*?)</style>', read('site/guia.html')).group(1)
    guide = ('<!doctype html><html lang="es"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        '<meta name="referrer" content="no-referrer"><title>Guía de PBIS</title>'
        '<link rel="stylesheet" href="../assets/site.css">'
        f'<style>{style}section{{scroll-margin-top:24px}}.guide-nav{{line-height:2}}</style></head>'
        '<body><main class="document"><a class="back" href="../index.html">← Volver a PBIS</a>'
        f'<h1>Guía de PBIS</h1><nav class="guide-nav" aria-label="Secciones de la guía">{navigation}</nav>'
        + ''.join(guide_sections) + '<section id="compatibilidad"><h2>Compatibilidad</h2><p>'
        + escape(compatibility) + '</p></section></main></body></html>')
    files = {
        '.nojekyll': b'',
        'index.html': home.encode('utf-8'),
        'app.html': application['PBIS.html'],
        'PBIS.html': redirect(),
        'DEMO.html': redirect(),
        'assets/site.css': (root / 'site/site.css').read_bytes(),
        'assets/site.js': (root / 'site/site.js').read_bytes(),
        'assets/ficha-grupo-ejemplo.jpg': (root / 'site/assets/ficha-grupo-ejemplo.jpg').read_bytes(),
        'docs/GUIA.md': '\n'.join(guide_text).encode('utf-8'),
        'docs/guia.html': guide.encode('utf-8'),
        'docs/COMPONENTES.txt': application['COMPONENTES.txt'],
        'docs/LICENSE-SheetJS.txt': application['LICENSE-SheetJS.txt'],
    }
    # The local download contains the same application and guide, once each.
    local_home = application['index.html'].decode('utf-8').replace('PBIS.html', 'app.html')
    local_home = local_home.replace('</footer>', ' · <a href="docs/guia.html">Guía de uso</a></footer>')
    local = {name: files[name] for name in [
        'app.html', 'assets/site.css', 'docs/GUIA.md', 'docs/guia.html',
        'docs/COMPONENTES.txt', 'docs/LICENSE-SheetJS.txt']}
    local['index.html'] = local_home.encode('utf-8')
    validate_links(local)
    files['downloads/PBIS.zip'] = zipped(with_checksums(local))
    validate_links(files)
    return with_checksums(files)


def write_distribution(target, files, archive_path=None):
    target = Path(target).absolute()
    archive_path = Path(archive_path).absolute() if archive_path else None
    if target.exists() or target.is_symlink():
        raise FileExistsError('La carpeta ya existe. Elige una nueva; no se borrará nada: ' + str(target))
    if archive_path and (archive_path.exists() or archive_path.is_symlink()):
        raise FileExistsError('El ZIP ya existe. Elige otro nombre: ' + str(archive_path))
    for name in files:
        if Path(name).is_absolute() or '..' in Path(name).parts or '\\' in name:
            raise ValueError('Ruta no permitida: ' + name)
    target.mkdir(parents=True, exist_ok=False)
    for name, data in files.items():
        destination = target / name
        destination.parent.mkdir(parents=True, exist_ok=True)
        with destination.open('xb') as stream:
            stream.write(data)
    if archive_path:
        with archive_path.open('xb') as stream:
            stream.write(zipped(files))
    return target


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--salida', type=Path, required=True, help='Carpeta nueva: no debe existir')
    parser.add_argument('--zip', type=Path, help='Copia ZIP opcional de esa carpeta')
    args = parser.parse_args()
    root = Path(__file__).resolve().parent.parent
    files = static_files(root)
    target = write_distribution(args.salida, files, args.zip)
    print(f'{target}: {len(files)} archivos; una aplicación y una descarga. Fuentes conservadas.')


if __name__ == '__main__':
    main()
