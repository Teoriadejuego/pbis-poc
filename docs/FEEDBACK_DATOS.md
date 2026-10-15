# Feedback vinculable a los datos · versión 2

Cada reacción de la lista se convierte en un registro. La confianza, el motivo de no participación y las opiniones sobre la utilidad de una ficha producen registros de tipos distintos. Solo se exportan las valoraciones guardadas, no todos los estudiantes del archivo. La demo no envía nada.

## Qué se recibe

El aviso de correo contiene un resumen legible por centro, curso, aula, código de estudiante y cuenta docente. El campo `feedback_json` conserva el lote completo en formato `pbis.feedback.v2`. No hay que extraer números del texto del correo: utiliza ese JSON, la exportación de Formspree o una copia JSON guardada desde Revisar envío.

Campos principales:

- `recordId`: código único de la valoración. Permite eliminar duplicados de un reintento.
- `batchId`, `sessionCode`: identificadores del envío y de la sesión.
- `username`, `role`: cuenta y perfil que valoraron. Una cuenta compartida no identifica a una persona concreta; no hay firma ni autenticación de servidor.
- `center`, `course`, `group`: centro, curso y aula tal como se usan en la consulta.
- `studentId`: código original usado por el visualizador, como texto, conservando ceros iniciales. En Wave 1 es **Usuario Id**, no Alumno Id ni el nombre. Las opiniones de aula no tienen un estudiante concreto.
- `sourceSha256`: huella SHA-256 de los bytes del archivo. Identifica la versión exacta sin transmitirlo; renombrarlo no la cambia, editarlo sí.
- `sourceSheet`, `period`, `preparedAt`, `appVersion`: hoja importada, periodo si está disponible, momento de preparación del lote UTC y versión que calculó la ficha. El momento de preparación no es la fecha de respuesta del cuestionario.
- `feedbackType`: `indicator_reaction`, `student_confidence`, `non_participation` o `interface_opinion`.
- `indicator`, `indicatorField`, `observedValue`, `valueStatus`, `scaleMin`, `scaleMax`: indicador concreto y valor que se mostraba al valorarlo. Un cero es un valor; `null` con `missing` o `not_answered` no lo es. La ausencia de respuesta propia no impide recibir menciones.
- `reaction`: `ok`, `review` o `surprised`. Los dos últimos corresponden a Revisar y Me sorprende.
- `confidence`, `rating`, `comment`, `nonParticipationReason`, `opinionId`: valoración aplicable según el tipo. La confianza va de −5 a +5; utilidad de ficha, de 1 a 5.

El valor transmitido es el del indicador valorado, no la respuesta cruda completa ni las menciones individuales. No se exportan nombres, apellidos, contraseñas, rutas ni el archivo completo. Los comentarios libres se transmiten tal como se escriben: no deben incluir nombres ni detalles personales.

## Preparar una base local

1. Conserva el JSON del envío. También puedes exportar CSV/JSON desde Formspree si tu plan ofrece esa función. La [documentación de exportación](https://help.formspree.io/articles/form-and-project-settings/exporting-submissions/) la incluye en los planes Personal, Professional y Business. No se presupone cuál tienes contratado.
2. Ejecuta con Python 3, sin instalar bibliotecas:

```text
python tools/importar_feedback.py exportacion.json --salida private/feedback
python tools/importar_feedback.py envio1.json envio2.json --salida private/feedback
```

El importador produce `feedback.sqlite`, tabla `feedback`, y `feedback.csv`. Acepta un lote directo, el objeto del envío, la exportación JSON de Formspree y su exportación CSV con columna `feedback_json`. Omite duplicados idénticos, cancela ante IDs repetidos con contenidos diferentes y no adivina referencias de envíos antiguos. Guarda estas salidas en local, fuera del repositorio público.

SQLite conserva tipos y códigos. Al abrir el CSV en Excel, importa los identificadores como texto para mantener ceros iniciales. Las celdas de texto con prefijos de fórmula se escapan en el CSV; el JSON y SQLite mantienen el texto original.

## Cruce con respuestas originales

Para Wave 1, empareja `center` con «Centro » seguido de **Estudio**, y `studentId` con **Usuario Id**, ambos como texto. Para un archivo ya preparado, usa **Centro** e **ID**. Conserva `sourceSha256` y `sourceSheet` para seleccionar exactamente el archivo del que procede la valoración; curso y aula ayudan a comprobar la correspondencia. No unas solo por estudiante si mezclas varias mediciones.

La unión es de muchas valoraciones a una fila del cuestionario: distintos docentes pueden valorar al mismo estudiante y una persona puede valorar varios indicadores. No multipliques ni promedies las respuestas del cuestionario por el número de opiniones. Conserva las discrepancias. La opinión de utilidad de la interfaz no es una etiqueta sobre el estudiante y Me sorprende tampoco demuestra que el dato sea erróneo.

Los envíos previos usaban códigos transformados sin huella de archivo. Este cambio no puede completar retroactivamente su centro, medición o valores observados.

## Envío y recuperación

Revisar envío muestra el contenido y permite guardar una copia JSON sin enviarla. Enviar valoraciones y cerrar registra el lote en Formspree. Un reintento sin cambios reutiliza el mismo lote, fecha e IDs; si cambian las valoraciones se crea otro. El importador resuelve duplicados idénticos, pero no se promete entrega exactamente una vez por correo. Una respuesta positiva confirma la aceptación por Formspree, no la recepción del mensaje en Outlook.
