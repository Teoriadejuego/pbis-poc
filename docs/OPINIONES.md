# Valoraciones de PBIS

En la **Lista de aula**, pulsa el valor de un indicador para mostrar las reacciones **OK**, **Revisar** o **Me sorprende**. Solo se conserva una reacción por indicador y estudiante; pulsar otra la sustituye y repetir la misma la quita. La opción elegida queda indicada con texto. Al final de cada fila, el control de **confianza en los datos** va de −5 a +5 en décimas. El cero marcado es una valoración neutral; «Sin valorar» significa que no se ha usado el control. Estas apreciaciones no modifican los datos del cuestionario.

El botón **Opinar sobre esta ficha** permite añadir una puntuación de utilidad de 1 a 5 y un comentario opcional. Hay que pulsar **Añadir a esta sesión** para incluirlo en el resumen de cierre. No escribas nombres ni otros datos personales en el comentario.

## Demo y práctica

En la cuenta demo, las reacciones, confianza y comentarios solo sirven para practicar. No se envían a Formspree, aunque pulses PBIS o cierres sesión. Se retiran al salir.

## Revisar, enviar y cerrar

Si hay valoraciones pendientes, aparece **Revisar y enviar**. La revisión muestra centro, curso, aula, código de estudiante, cuenta docente y el contenido preparado; permite guardar una copia JSON. No envía nada por sí sola. **Enviar valoraciones** espera la confirmación y permite seguir consultando. **Cerrar sesión** abre la misma revisión: puedes elegir **Enviar y cerrar sesión**, volver a consultar o cerrar sin enviar.

Una opinión que aún no se ha añadido aparece como borrador. Puedes reabrirla en la ficha correspondiente sin perder el texto o descartarla expresamente. Se pide resolver esos borradores antes del envío; no se inventa una puntuación para un comentario incompleto.

Al enviar y cerrar se remite un lote a Formspree, con aviso previsto a pbis_usuario@outlook.es. Cada reacción incluye el indicador valorado y su valor observado. Confianza, motivos de no participación y opiniones sobre la utilidad de la ficha se conservan como tipos separados. Se añaden la huella del archivo, hoja importada, periodo disponible, fecha de preparación del lote y versión. No se adjuntan nombres, apellidos, contraseñas ni el Excel completo.

El estudiante se identifica con su código original: en los cuestionarios Wave 1, **Usuario Id**. Los registros se pueden cruzar con centro, código de estudiante y archivo de origen. Son datos vinculables, no anónimos. Evita nombres y detalles personales en el texto libre. El correo incluye un resumen legible y el campo `feedback_json` para construir una base de datos.

La aplicación espera una respuesta positiva de Formspree antes de retirar las valoraciones enviadas. Si no se confirma, mantiene los resultados y ofrece **Revisar y reintentar**, **Guardar copia JSON** y **Cerrar sin enviar**. Un reintento sin cambios conserva el lote y sus identificadores; Formspree puede recibir una copia si se perdió la respuesta anterior. El importador distingue esos duplicados. El envío necesita conexión y la confirmación del proveedor no acredita la entrega del correo.

Tras **15 minutos sin actividad**, se intenta enviar automáticamente lo añadido y cerrar la sesión. A los 13 minutos aparece un aviso con **Continuar consulta**. Si falla el envío, las valoraciones siguen disponibles; si quedan borradores, se pide revisarlos y no se cierra. La demo no envía nada, tampoco por inactividad.

Para no mezclar valoraciones de archivos distintos, la app pide resolver las pendientes antes de sustituir los archivos. Siguen en la memoria de esta sesión: el aviso al cerrar la pestaña permite volver y enviarlas, pero no garantiza evitar una pérdida si se fuerza el cierre, se apaga el equipo o falla el navegador. Esta edición no guarda una copia persistente de los pendientes en el navegador; la recuperación duradera se reserva para un futuro servidor. Una copia JSON descargada se recupera con el importador del proyecto; no restaura la consulta en la app. Formspree, el correo y los resúmenes descargados tienen su propia conservación y controles de acceso.

## Encuestas sin responder

La lista resalta con un fondo pastel grisáceo y con «No ha respondido» los registros cuyo estado de respuesta es No. Una encuesta parcial o con estado desconocido no se marca como ausencia. Se conservan las menciones recibidas de otras personas.

En esas filas, el desplegable **Motivo de no participación** sustituye al control de confianza:

- Sin consentimiento registrado.
- Ausencia el día de la encuesta.
- Ausencia prolongada.
- Traslado a otro centro.
- Otro motivo: requiere un texto de hasta 300 caracteres antes de enviar.

No se asigna un motivo automáticamente. Volver a «Seleccionar motivo» retira la anotación. Cambiar de motivo elimina el texto de Otro. El motivo se conserva en esta sesión y acompaña al código del estudiante en el resumen de cierre; no modifica las respuestas del archivo. Las anotaciones de la demo no se envían.

## Construir una base de datos

Consulta FEEDBACK_DATOS.md en la edición descargable o la documentación del proyecto. El importador local tools/importar_feedback.py transforma los lotes y las exportaciones de Formspree en CSV y SQLite, conservando IDs y distinguiendo duplicados. Las cuentas compartidas identifican un acceso, no una persona concreta.

[Guía del formato y del importador](https://teoriadejuego.github.io/pbis-poc/feedback-datos.html).
