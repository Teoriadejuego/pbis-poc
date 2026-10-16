# PBIS · Privacidad y alcance del piloto

Revisión técnica: 16 de octubre de 2026 · Edición 0.10.15

## Demo y consultas

La demo usa 1.512 registros sintéticos. Se accede desde Comenzar práctica guiada; la cuenta y contraseña se muestran dentro de la simulación. La práctica espera a «Cargar datos demo». En web el ejemplo es un recurso público; en la edición descargable está incorporado y no requiere conexión. No contiene archivos cargados por usuarios.

La demo no permite sustituir el ejemplo por archivos. Para abrir un archivo, termina la demo y entra con una cuenta de consulta. Sus reacciones y comentarios de práctica nunca se envían.

## Archivos en el navegador

El archivo .pbis o Excel seleccionado se procesa localmente; no se sube a GitHub Pages ni a Formspree para calcular las fichas. Nombres y apellidos son opcionales. La interfaz abrevia apellidos; los originales permanecen en el archivo y en la memoria necesaria para procesarlo. No hace falta una llave adicional.


La app no incorpora analítica, publicidad ni almacenamiento persistente de las consultas. El alojamiento de la web puede registrar información técnica de las visitas. Esto no describe extensiones, copias de seguridad, malware ni otros programas del equipo.

## Cierre

Pulsar PBIS o cerrar sesión retira los datos del estado activo y cancela las lecturas pendientes. En consultas con cuenta, si existen valoraciones, se espera su registro antes del cierre. Ante un fallo puedes reintentar, guardar el resumen o cerrar sin enviar.

Los Excel originales no se modifican ni borran. Tampoco se eliminan capturas, copias, otras pestañas, correos o registros externos. No se promete borrado forense de RAM, disco ni memoria virtual. Cerrar la pestaña o caducar por inactividad no garantiza enviar valoraciones.

## Valoraciones de consultas con cuenta

Se envía a Formspree un resumen y registros estructurados con cuenta, rol, sesión, centro, curso, aula y código original del estudiante. Incluyen reacciones, confianza, motivos de no participación y comentarios. Cada reacción incluye el valor del indicador que se estaba valorando. Una huella SHA-256 del archivo, la hoja y la versión de la aplicación permiten cruzar el feedback con la medición correspondiente.

No se adjuntan el Excel completo, nombres, apellidos ni contraseñas. El formulario está configurado para avisar al buzón pbis_usuario@outlook.es; el registro por Formspree no acredita la entrega final del correo. Revisar envío permite leer el contenido y guardar una copia JSON antes de enviarlo.

Estos registros están vinculados al centro y al código del estudiante: no son anónimos. El texto libre también puede identificar personas; no escribas nombres ni detalles personales. La cuenta registrada identifica el acceso utilizado; si se comparte, no permite atribuir la valoración a una persona concreta.

Formspree, el correo y los resúmenes descargados tienen su propia conservación y acceso. Un reintento puede duplicar un envío si se perdió su respuesta; el identificador del lote permite reconocer copias.

## Qué protegen las cuentas

Las cuentas de evaluación y sus contraseñas se distribuyen en el código público. Filtran la interfaz por curso; orientación consulta todos los datos y puede ver la tabla de cuentas. La cuenta demo solo activa datos simulados y no muestra esa tabla en su interfaz.

Estos perfiles **no constituyen autenticación segura ni confidencialidad**. Quien controla su equipo puede inspeccionar JavaScript y archivos. Las contraseñas de seis caracteres no deben usarse para proteger datos reales. La edición tampoco crea, revoca o rota cuentas de producción.

## Receptor utilizado

Esta edición envía el lote de valoraciones a Formspree. La carpeta feedback-service contiene un receptor alternativo para opiniones individuales; no está activado por la web y no recibe el contrato de lotes v2. No debe configurarse como sustituto de Formspree sin adaptar y comprobar ese contrato.

No hay una eliminación automática de los registros de Formspree o del buzón al cerrar sesión. Los plazos de conservación y las solicitudes de eliminación deben gestionarse en esos servicios por el equipo responsable. Este documento describe el comportamiento del programa; no acredita configuraciones de proveedor que no se han comprobado.
