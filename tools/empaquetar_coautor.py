"""Bundle the reviewed product and a simple, ready-to-open coauthor demo."""
import os
from hashlib import sha256
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parent.parent
version = '0.9.1'
product = root.parent / f'PBIS_Producto_{version}.zip'
target = root.parent / f'PBIS_Para_Coautor_{version}.zip'
prefix = 'PBIS_Para_Coautor/'

instructions = '''PBIS · PAQUETE PARA REVISIÓN DEL EQUIPO DE AUTORÍA
Versión 0.9.1 · 30 de septiembre de 2026

Este ZIP contiene la aplicación, los tres Excel de prueba y el proyecto completo.
Los nombres y resultados de estudiantes de estos ejemplos son inventados.
No necesitas instalar R, Docker, Node.js ni dependencias para consultar las fichas.
Necesitas un navegador actual de escritorio. La consulta funciona sin Internet.

EMPEZAR EN CINCO PASOS

1. GUARDA Y EXTRAE TODO EL ZIP.
   Windows: clic derecho sobre el ZIP > Extraer todo.
   macOS: doble clic sobre el ZIP.
   Linux: usa la opción de extraer de tu gestor de archivos.
   Trabaja con la carpeta extraída; no abras el programa dentro del ZIP.

2. ABRE 2_ABRIR_PBIS.html.
   Haz doble clic. Si se abre como texto, elige Abrir con y un navegador
   actualizado: Edge, Chrome, Firefox o Safari.
   Este archivo es el programa completo: no necesitas arrancar ningún servidor.

3. ENTRA CON ESTOS DATOS.
   Cuenta de acceso: orientador
   Contraseña: 1234
   Este perfil permite consultar todos los centros de enseñanza, cursos y grupos del ejemplo.
   Para probar un perfil de tutoría: tutor7a o tutor7b, también con contraseña 1234.
   Esos dos alias corresponden a Sevilla, 1.º ESO A y B.

4. SELECCIONA LOS DOS EXCEL POR SEPARADO.
   En Datos e indicadores:
     3_DATOS_DE_PRUEBA/indicadores/datos_evaluacion.xlsx
   En Llave ID–nombre:
     3_DATOS_DE_PRUEBA/llave/llave_evaluacion.xlsx
   Selecciona las hojas Datos y Llave, respectivamente.
   Pulsa Abrir fichas.
   El tercer Excel, perfiles_evaluacion.xlsx, sirve para consultar los accesos;
   no se carga en la aplicación.

5. REVISA LAS FICHAS.
   Empieza por Ficha del grupo, elige Centro de enseñanza, Curso y Grupo.
   En Ficha individual puedes buscar y seleccionar a cada estudiante.
   Los ejemplos cubren 4.º de Primaria a 2.º de Bachillerato, grupos A/B/C,
   dos centros de enseñanza, 54 aulas y 1.512 estudiantes.
   Al terminar, pulsa Cerrar sesión y cierra la pestaña.

OPINIONES

El botón Valorar esta ficha permite puntuar de 1 a 5 y escribir un comentario.
El envío depende de la configuración del paquete: cuando aparece Enviar opinión,
Formspree registra la opinión y gestiona un aviso por correo, sin Excel adjunto.
Consulta el destino y los detalles en el diálogo antes de enviar.
Puedes guardar un Excel separado de opiniones y compartirlo por tu cuenta.
Contiene las claves de aula y, en fichas individuales, la clave de estudiante;
no añade nombres. No escribas datos personales en los comentarios.
Los borradores solo duran durante la sesión. Los Excel descargados permanecen
en tu equipo después de salir. Guardar el Excel no programa un envío posterior.

QUÉ REVISAR

- Claridad de las fichas de grupo e individuales, textos, escalas y navegación.
- Coherencia entre recuentos, denominadores y puntuaciones.
- Utilidad del formulario de opiniones y sus claves de referencia.
- Legibilidad en tu navegador y tamaño de pantalla.

PROYECTO COMPLETO

4_PROYECTO incluye código, web con descargas, documentación, prompts, pruebas,
licencia del lector Excel y servicio opcional de opiniones.
Para ver la web de presentación: 4_PROYECTO/site/index.html.
Para las instrucciones técnicas: 4_PROYECTO/README.md.
Para activar el correo: 4_PROYECTO/docs/OPINIONES.md.
No hay que abrir esa carpeta para usar el programa de los pasos anteriores.

ALCANCE DE ESTA REVISIÓN

Las claves 1234 son de evaluación; no son seguridad para datos reales.
Los originales de Excel no se modifican ni se borran al salir.
La aplicación no cifra los archivos y no promete borrado forense del equipo.
El formulario público no contiene secretos de envío en el ZIP.
77 pruebas automáticas superadas; consulta previa verificada por localhost.
Envío de prueba a Formspree aceptado; recepción en Outlook confirmada por su titular.
La apertura directa del HTML y la compatibilidad en macOS/Linux deben confirmarse
en los equipos destino. Los límites y pruebas están en 4_PROYECTO/COMPROBACIONES.md.
'''

extras = {
    '1_EMPIEZA_AQUI.txt': instructions.encode('utf-8-sig'),
    '2_ABRIR_PBIS.html': (root / 'release/PBIS.html').read_bytes(),
}
books = {
    'datos_evaluacion.xlsx': 'indicadores/',
    'llave_evaluacion.xlsx': 'llave/',
    'perfiles_evaluacion.xlsx': '',
}
for name, folder in books.items():
    extras[f'3_DATOS_DE_PRUEBA/{folder}{name}'] = (root / 'outputs/entrega-20260929' / name).read_bytes()

with ZipFile(product) as source:
    assert source.testzip() is None, 'The reviewed product archive is corrupt.'
    product_prefix = f'PBIS_Producto_{version}/'
    assert source.read(product_prefix + 'release/PBIS.html') == extras['2_ABRIR_PBIS.html'], 'Rebuild the main product archive first.'
    for item in source.infolist():
        assert item.filename.startswith(product_prefix)
        relative = item.filename[len(product_prefix):]
        assert relative and '..' not in Path(relative).parts
        assert not relative.endswith(('.env', '.sqlite', '.db', '.sqlite-journal'))
        assert not any(part in {'node_modules', '.qa', 'private'} for part in Path(relative).parts)
        if not item.is_dir():
            extras['4_PROYECTO/' + relative] = source.read(item)

checksums = ''.join(f'{sha256(data).hexdigest()}  {name}\n' for name, data in sorted(extras.items()))
extras['SHA256SUMS.txt'] = checksums.encode('utf-8')
with ZipFile(target, 'w', ZIP_DEFLATED, compresslevel=6) as archive:
    for name, data in extras.items():
        archive.writestr(prefix + name, data)

with ZipFile(target) as archive:
    assert archive.testzip() is None
    assert len(archive.namelist()) == len(extras)
    for name, expected in extras.items():
        assert archive.read(prefix + name) == expected, name
    assert ("connect-src " + (os.environ.get("FEEDBACK_ENDPOINT") or "'none'")).encode() in archive.read(prefix + '2_ABRIR_PBIS.html')

digest = sha256(target.read_bytes()).hexdigest()
target.with_suffix('.zip.sha256').write_text(f'{digest}  {target.name}\n', encoding='utf-8')
print(f'{target}\n{target.stat().st_size:,} bytes · {len(extras)} files · CRC and content verified\nSHA-256: {digest}')
