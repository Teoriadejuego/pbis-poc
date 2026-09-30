# Opiniones sobre las fichas de PBIS

El botón de opinión permite valorar la utilidad de una ficha de 1 a 5 y escribir un comentario opcional. No incluyas nombres ni información personal en el comentario.

## Enviar o guardar en tu equipo

**Enviar opinión** transmite el registro a Formspree, que lo almacena y gestiona la notificación al buzón configurado por la persona titular del formulario, previsto como pbis_usuario@outlook.es. El remitente es Formspree. La confirmación del formulario acredita el registro, no la entrega del correo: comprueba la bandeja y la carpeta de correo no deseado.

**Guardar Excel** genera PBIS_Opiniones.xlsx, con la hoja Opiniones y las opiniones de la sesión. Es una acción separada: no envía correo. El correo de Formspree no contiene un Excel adjunto.

## Información enviada

Se envían exactamente diez campos: eventId, sessionCode, role, sheet, classCode, studentCode, rating, comment, version y date. Incluyen un código aleatorio de opinión y sesión, el rol, el tipo de ficha, clave del aula y clave del estudiante solo en ficha individual, valoración, comentario, versión y fecha. No se pide correo a quien comenta ni se incluyen nombres, usuario, contraseña, etiquetas de centro/curso/grupo, indicadores ni los libros Excel.

Las opiniones son seudonimizadas: las claves permiten relacionarlas con otras fuentes. El diálogo muestra las claves antes de enviar. Formspree y su infraestructura pueden procesar metadatos de conexión; esto no es anonimato completo. Las opiniones registradas y los correos permanecen después de cerrar sesión. El botón de cierre elimina las referencias y borradores locales, no los registros externos.

## Configuración actual

La web y las nuevas descargas utilizan https://formspree.io/f/mvkgydrn. Su titular debe verificar en Formspree el destinatario pbis_usuario@outlook.es y las notificaciones de correo. La dirección del formulario es pública y no contiene contraseñas. El plan gratuito consultado permite 50 envíos al mes y 30 días de historial; revisa los límites en https://formspree.io/plans/.

El envío se realiza con JavaScript y fetch, sin scripts de terceros ni claves secretas. GitHub Pages publica las páginas y Formspree recibe solo las opiniones. No hace falta alojar un servidor de PBIS para esta opción.

## Fallos y reintentos

Un error no borra el borrador: puedes guardar el Excel o reintentar. Formspree no garantiza deduplicación por el eventId que enviamos: si el envío llegó pero su respuesta se perdió, un reintento puede crear otra entrada. Se bloquea el botón durante la solicitud y después de una confirmación correcta. No hay reenvíos automáticos. El identificador permite reconocer copias al revisar el historial.

## Construcción

Para activar el formulario al construir, define FEEDBACK_ENDPOINT=https://formspree.io/f/mvkgydrn y ejecuta node tools/build.mjs. Para una edición sin envío omite la variable. Las descargas antiguas no se actualizan por sí solas.

El servicio propio de feedback-service/ sigue disponible como alternativa avanzada con Resend, base privada y adjunto Excel. Sus instrucciones y garantías de deduplicación solo se aplican a esa alternativa, no a Formspree.
