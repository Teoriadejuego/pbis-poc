"""Local activation kit: explicit files only, no connection tokens or real data."""
from pathlib import Path
import json
import sys
from package_files import application_files, generated_files, write_archive
root=Path(__file__).resolve().parent.parent
files=application_files(root)
files['DIRECCION.html']=(root/'direccion-local/PBIS.html').read_bytes()
for name in ['Code.gs','Registro.html','appsscript.json','README.md']:
    files['audit-service/'+name]=(root/'audit-service'/name).read_bytes()
files['PROMPT_REGISTRO_ACCESOS.md']=(root/'docs/PROMPT_REGISTRO_ACCESOS.md').read_bytes()
files['VALIDACION_REGISTRO_ACCESOS.md']=(root/'docs/VALIDACION_REGISTRO_ACCESOS.md').read_bytes()
files['prueba/Excel_sintetico.xlsx']=(root/'data/examples/datos_evaluacion.xlsx').read_bytes()
codes={name:(root/'audit-service'/name).read_text(encoding='utf-8') for name in ['Code.gs','Registro.html','appsscript.json']}
payload=json.dumps(codes,ensure_ascii=False).replace('<',chr(92)+'u003c')
guide='''<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PBIS · Activar Google Sheets</title>
<style>body{font:17px system-ui;line-height:1.6;color:#173f56;background:#f5f8fa;margin:0}main{max-width:850px;margin:auto;padding:24px}section{background:white;border:1px solid #dbe4e9;border-radius:14px;padding:22px;margin:18px 0}h1{line-height:1.2}h2{font-size:23px}button,a{color:#16536c}button{font:inherit;padding:9px 16px;border:1px solid #bdd1db;border-radius:8px;background:#eff6f8;cursor:pointer}textarea{width:100%;box-sizing:border-box;height:240px;margin-top:16px;font:13px monospace}strong{color:#123b50}:focus-visible{outline:3px solid #4091b1;outline-offset:3px}.tag{font-size:14px}#copy-status{min-height:1.5em}[hidden]{display:none!important}</style>
<main><p class="tag">PBIS · Preparación local · Sin publicar</p><h1>Activa tu registro privado de accesos</h1><p>Se registran usuario, centros, archivo, apertura y cierre. No se envían contraseñas ni datos del alumnado. Cada cuenta de Google necesita su propia configuración.</p>
<section><h2>1. Crea la hoja</h2><p>Abre <a href="https://sheets.google.com" target="_blank" rel="noreferrer">Google Sheets</a>, crea una hoja llamada <strong>PBIS · Registro de accesos</strong> y mantenla restringida. Entra en <strong>Extensiones → Apps Script</strong>.</p></section>
<section><h2>2. Copia estos tres archivos</h2><p>Sustituye Código.gs; crea un archivo HTML llamado Registro; y, en Configuración, activa la visualización de appsscript.json para sustituir su contenido.</p><button data-copy="Code.gs">Copiar Code.gs</button> <button data-copy="Registro.html">Copiar Registro.html</button> <button data-copy="appsscript.json">Copiar manifiesto</button><p id="copy-status" role="status"></p><textarea id="code" aria-label="Código seleccionado, listo para copiar" readonly hidden></textarea></section>
<section><h2>3. Prepara y publica el receptor</h2><p>Guarda, ejecuta <strong>setupPbisRegistry</strong> y autoriza tu script con la cuenta propietaria. Recarga Sheets. Después, en Apps Script: <strong>Implementar → Nueva implementación → Aplicación web</strong>; ejecutar como <strong>yo</strong>, acceso <strong>cualquier usuario</strong>.</p><p>La hoja sigue privada: se publica únicamente el receptor, que exige una credencial de escritura. Copia su URL terminada en <strong>/exec</strong>.</p></section>
<section><h2>4. Conecta el registro desde dirección general</h2><p>En la hoja abre <strong>PBIS → Registrar un proyecto / conectar orientación</strong>. Pega la URL, pulsa Preparar conexión y descarga el JSON. Guárdalo de forma privada.</p><p>Abre <a href="DIRECCION.html">PBIS · Herramientas de dirección</a> con tu cuenta de orientación. Pulsa <strong>Registro de accesos</strong> y carga ese JSON. La conexión solo permanece durante esa sesión. Esta copia es para dirección general; los centros utilizan PBIS.html, sin estos controles.</p></section>
<section><h2>5. Comprueba una consulta</h2><p>Carga <strong>prueba/Excel_sintetico.xlsx</strong> y pulsa Abrir consulta. Tras ver <strong>Acceso registrado</strong>, revisa la fila de Sesiones. Pulsa Cerrar sesión y comprueba <strong>Cierre confirmado</strong>.</p><p>Para los .pbis protegidos: configura /exec en Administrar el proyecto y da de alta su manifiesto desde la hoja. No necesitan el JSON de orientación.</p></section>
<p>Si se cierra la pestaña sin confirmación, no se inventa el cierre. Lee REGISTRO_ACCESOS.md para reintentos, actualización y activación de proyectos protegidos. No publiques el archivo de conexión ni lo pegues en el chat.</p></main>
<script type="application/json" id="codes">'''+payload+'''</script><script>const codes=JSON.parse(document.getElementById('codes').textContent);document.querySelectorAll('[data-copy]').forEach(button=>button.onclick=async()=>{const code=document.getElementById('code'),status=document.getElementById('copy-status');code.value=codes[button.dataset.copy];code.hidden=false;try{await navigator.clipboard.writeText(code.value);status.textContent=button.dataset.copy+' copiado. Pégalo en el editor de Apps Script.';}catch{code.focus();code.select();status.textContent='Seleccionado. Pulsa Ctrl+C o Cmd+C para copiar.';}});</script></html>'''
files['ACTIVAR_GOOGLE_SHEETS.html']=guide.encode('utf-8')
(root/'ACTIVAR_GOOGLE_SHEETS.html').write_bytes(files['ACTIVAR_GOOGLE_SHEETS.html'])
folder=root/'activation-google-sheets'
folder.mkdir(exist_ok=True)
for name,content in files.items():
    destination=folder/name
    destination.parent.mkdir(exist_ok=True,parents=True)
    destination.write_bytes(content)
# The HTTP preview has real local download links and the full shared portal.
# The review ZIP keeps its self-contained home, with no ZIP-inside-ZIP copies.
for source_name in generated_files(root):
    if not source_name.startswith('site/'):
        continue
    name=source_name.removeprefix('site/')
    if name=='PBIS.html':
        continue  # Keep the embedded demo for the local review application.
    destination=folder/name
    destination.parent.mkdir(exist_ok=True,parents=True)
    destination.write_bytes(files['PBIS.html'] if name=='DEMO.html' else (root/source_name).read_bytes())
output_name=sys.argv[1] if len(sys.argv)>1 else 'PBIS_Activar_Google_Sheets.zip'
if Path(output_name).name!=output_name or not output_name.endswith('.zip'):
    raise ValueError('Indica solo un nombre de archivo .zip, sin directorios.')
target=root/output_name
print({'archive':str(target),'files':write_archive(target,'PBIS_Registro_Accesos',files)})
