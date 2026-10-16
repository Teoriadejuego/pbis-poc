# Revisión de PBIS a partir de las lecciones de RADARS

16 de octubre de 2026. Base: commit 22ae348, edición publicada 0.10.16. Revisión preparada y verificada en local, incorporada a la entrega 0.10.17 por petición del usuario. No se han utilizado ni modificado archivos de centros reales ni se han enviado correos de prueba.

## Diagnóstico y arquitectura observada

PBIS es hoy un **visualizador de una medición de convivencia con valoraciones del profesorado**. Tiene una demo funcional, cálculos contrastados con referencias de R, navegación centro → aula → estudiante, redes y lectura local de archivos. No es todavía un sistema de gestión de apoyos educativos. La ausencia de ese sistema es una diferencia de alcance; no prueba un fallo en las fichas actuales.

```
Excel / .pbis → worker local → conversión Wave 1 o validación Datos
→ memoria de la consulta → fichas, lista y redes
→ valoraciones con códigos y referencia al archivo
→ Formspree, tras envío → aviso por correo
→ importador local de feedback → CSV / SQLite
```

- `tools/build.mjs` genera la web estática y el HTML descargable. `.github/workflows/pages.yml` publica únicamente `site/` después de las comprobaciones.
- `src/parser-worker.js`, `src/raw-wave1.js` y `src/core.js` leen, convierten y calculan. La aplicación no sube el Excel para calcular.
- `src/app.js` mantiene la consulta en memoria. Al inicio de esta auditoría no había localStorage, IndexedDB ni historial persistente de consulta.
- `src/roster-review.js` conserva reacciones, confianza y motivos de no participación. `src/feedback.js` mantiene opiniones y borradores. Son valoraciones de datos/interfaz; no reconocimientos educativos ni actuaciones.
- `src/linked-feedback.js` permite vincular las valoraciones al centro, aula, estudiante, cuenta y archivo. Formspree recibe esos datos seleccionados; por eso no procede afirmar que ningún dato sale de Internet o que el envío es anónimo.
- `tools/importar_feedback.py` importa los lotes a CSV/SQLite y evita insertar dos veces el mismo recordId. Un conflicto aborta la transacción.
- `feedback-service/` es un servicio alternativo de opiniones individuales, no el servidor de permisos del producto ni el receptor de los lotes actuales. No se publica con Pages.

## Inventario comprobado

| Capacidad | Estado observado | Evidencia y límite |
| --- | --- | --- |
| Lectura de cuestionario y cálculo | Implementada | parser-worker, raw-wave1, core; errores de importación visibles y pruebas de datos incompletos. No es validación psicométrica. |
| Fichas, lista, redes y comunidades | Implementada | app, student-network, class-network; recorridos de escritorio y móvil. |
| Demo | Implementada, datos simulados | 1.512 registros, 54 aulas, dos centros. No envía valoraciones y no admite archivos propios. |
| Perfiles de tutoría/orientación | Parcial: filtro de interfaz | scopeRows y restricciones de navegación. Contraseñas distribuidas con el código; no hay autorización en servidor. |
| Valoraciones | Implementada con límites | Memoria, envío manual o tras 15 minutos sin actividad, confirmación de Formspree, reintentos y copia JSON. Confirmación del proveedor no acredita entrega del correo. |
| Identidad de quien valora | Parcial | Se registra una cuenta compartida por perfil, no una persona autenticada. |
| Reconocimientos de conductas e incidencias | No implementada | No hay entidad, formulario, persistencia ni recuperación para estos registros. Buena mediación/relaciones no equivalen a un reconocimiento docente. |
| Apoyos, responsables, ejecución y revisión | No implementada | No existe el ciclo objetivo → actuación → revisión ni historial compartido. |
| Evolución temporal | No implementada | Periodo del archivo y fecha del envío no forman una serie longitudinal. |
| Seguimiento semanal | Propuesta, siguiente fase | El usuario ha elegido definirla sin implementar un prototipo adicional. |

## Hallazgos priorizados

Prioridad basada en impacto educativo, frecuencia de uso, riesgo y esfuerzo; no es una escala clínica.

| Prioridad | Evidencia observada | Problema y consecuencia | Solución / estado | Impacto · frecuencia · riesgo · esfuerzo |
| --- | --- | --- | --- | --- |
| P0 | app: login y scopeRows; data/profiles.json; Pages | Los perfiles no impiden inspeccionar el archivo completo. Una prueba visual no demuestra permisos efectivos. | No presentar el piloto como autenticación segura. Backend y cuentas personales, siguiente fase. | Alto · cada acceso · alto · alto |
| P1 | app: closeWithReviews; feedback: drafts | Cerrar enviaba directamente, con revisión opcional; un borrador sin añadir no entraba en el contador ni en el lote. | Revisión y confirmación, envío sin cerrar, borradores detectados y recuperables dentro de la sesión. | Alto · cada sesión · alto · medio |
| P1 | app: temporizador/pagehide | Caducar o cerrar la pestaña podía retirar valoraciones sin un aviso previo suficiente. | Aviso previo y envío automático tras 15 minutos sin actividad; el fallo o un borrador impiden caducar. Aviso al salir de la pestaña. El usuario descarta la copia persistente en el navegador; la recuperación duradera queda para el futuro servidor. No se promete cero pérdidas. | Alto · ocasional · alto · medio |
| P1 | app: cellTone | Bienestar se coloreaba mediante cortes 3,4 y 6,7 sin justificación documentada. Podía leerse como riesgo validado. | Valores de bienestar con color neutro, conservando cifra y escala; cálculo intacto. | Alto · cada lista · medio · bajo |
| P1 | app: lista, ficha y contexto | La lista y la ficha individual no hacían visible el periodo; «Sin datos» cubría varios estados. | Contexto plegable con periodo, cobertura y ámbito. No respondió ≠ datos insuficientes ≠ cero. | Alto · cada consulta · medio · bajo |
| P1 | linked-feedback e importar_feedback | Un reintento tras perder la respuesta puede llegar dos veces a Formspree. | Se conserva el mismo lote; importación local deduplica IDs. No se promete exactamente un correo ni deduplicación del proveedor. | Alto · fallo de conexión · medio · existente |
| P2 | app: reacciones y confianza | Podían confundirse con una evaluación del estudiante o una tarea de seguimiento. | Se explica que se valora la coherencia del dato y la confianza para interpretarlo; no se crea una actuación. | Medio · cada lista · medio · bajo |
| P2 | portada, README y guías | Metadatos omitían la vista de centro; versiones y textos de cierre divergían; no explicaban claramente la ausencia de seguimiento. | Corrección de textos y alcance, equipo responsable y guía del nuevo recorrido. | Medio · primera visita · medio · bajo |
| P2 | columnas y tablas existentes | La lista ancha necesita desplazamiento; ya hay nombres fijos, ordenación, foco y controles de zoom. | Conservar y comprobar en móvil y teclado; no reescribir una función ya operativa. | Medio · cada consulta · bajo · bajo |
| P3 | ausencia de datos de asistencia/intervenciones | No hay denominadores de oportunidades ni datos comparables para atribuir cambios a un apoyo. | Definirlos en la siguiente fase; no generar puntuaciones o conclusiones a partir de su ausencia. | Alto · futuro · alto · alto |

## Cambios de la revisión: antes, ahora y comprobación

- Antes el cierre podía enviar sin abrir la revisión; ahora ofrece el contenido y requiere confirmación. También se puede enviar manteniendo las fichas abiertas. Se comprueba ausencia de POST antes de confirmar, confirmación del proveedor, eliminación de pendientes ya enviados y ausencia de reenvío al cerrar.
- Antes un comentario sin pulsar Añadir quedaba fuera del contador; ahora se detecta, se reabre en su ficha original o se descarta expresamente. Se prueba conservación del texto, contexto y separación frente a opiniones ya añadidas.
- Antes una interrupción podía confundirse con un cierre correcto; ahora los errores mantienen la consulta, el reintento conserva el lote y la salida avisa de pendientes. Tras la petición posterior del usuario, la inactividad intenta enviar antes de cerrar: solo una confirmación positiva permite retirar pendientes. Un borrador bloquea el cierre automático sin inventar una respuesta para enviarlo. Se prueban fallo, recuperación y lote idéntico; siguen existiendo límites del navegador y del proveedor.
- Antes bienestar tenía colores derivados de cortes sin fundamento documentado; ahora todos los valores 0–10 usan una presentación neutral. Prueba para 0, 1, 3,4, 5, 6,7 y 10, con null separado.
- Antes faltaba contexto en algunas vistas; ahora aparece periodo conocido o su ausencia, participación registrada/ausente/desconocida y ámbito de las menciones. Pruebas con aulas mezcladas, periodos ausentes, respuestas parciales y ceros.
- Antes la portada describía tres vistas y no explicitaba el límite de seguimiento; ahora incluye centro y explica qué no registra. No se ha añadido una pantalla con actuaciones inventadas.

## Ocho recorridos solicitados

| Recorrido | Resultado de la revisión |
| --- | --- |
| 1. Reconocimiento ligado a conducta y guardado | No existe; no se presenta la valoración de un indicador como equivalente. |
| 2. Dificultad, contexto y actuación | No existe un registro de incidencias; motivos de no participación no lo sustituyen. |
| 3. Revisión de equipo y acuerdo de apoyo | No existe; siguiente fase. |
| 4. Registro de aplicación del apoyo | No existe; siguiente fase. |
| 5. Progreso y siguiente decisión | No existe comparación temporal ni decisiones registradas. |
| 6. Servidor impide acceso ajeno | No aplicable como prueba aprobada: no existe ese servidor. Se verifica solo el alcance de la interfaz. |
| 7. Interrupción sin pérdida silenciosa/duplicados | Parcial: error visible, lote estable, reintento, envío antes de caducar y copia JSON. No hay recuperación después de un cierre forzado. El importador deduplica; no hay garantía de entrega exactamente una vez. |
| 8. Informe distingue incompleto/ausente/favorable | Se refuerza la presentación; 0/No no equivalen a ausencia de dificultades, y los estados ausentes no se convierten a cero. |

## Validación de esta revisión local

- `node tools/check.mjs`: 189 pruebas Node y 12 Python superadas. Recorrido de 16 pasos de la demo, 12 perfiles, anchos de 1360, 390 y 320 píxeles, importación `file://` sin conexión y workers incorporados. Edge 155 en Windows. No se ha probado físicamente en macOS/Linux.
- Feedback: se interceptan todas las peticiones. No se envían correos reales. Se verifica comentario sin añadir → reapertura → envío, fallo del receptor → copia JSON → reintento idéntico → consulta abierta → cierre sin duplicar. Confirmación con teclado y diálogo móvil sin desbordamiento horizontal.
- Inactividad: reloj simulado, aviso a los 13 minutos, intento de envío a los 15, confirmación antes de cerrar, retención y reintento tras fallo, y conservación de borradores incompletos. La demo no envía feedback.
- La comprobación previa a publicar 0.10.17 ejecuta los recorridos con localStorage, sessionStorage e IndexedDB bloqueados y revisa todos los módulos propios de src. El envío y los borradores siguen funcionando en memoria; no se añade conservación persistente en el navegador.
- Comparación con `22ae348`: agregados de 54 aulas y dos centros, y redes de los 1.512 estudiantes simulados idénticos. `raw-wave1.js`, `student-network.js`, `class-network.js` y `linked-feedback.js` no cambian. La única adición en core es contexto descriptivo, sin alterar cálculos o normalización.
- Se reconstruyen la web y las cuatro descargas de la entrega 0.10.17 desde las mismas fuentes. No se publica ni modifica ningún archivo real. Las capturas y logs se conservan en outputs/ y quedan fuera del repositorio.

### Decisión acordada: recuperación en el futuro servidor

El 16 de octubre de 2026 el usuario ha decidido no guardar pendientes de forma persistente en el navegador y dejar la recuperación para el futuro servidor. Se mantiene el envío antes de caducar, el reintento mientras la sesión siga abierta y la copia JSON que la persona puede descargar expresamente. No se añade localStorage, sessionStorage ni IndexedDB para conservar valoraciones. Formspree y una pestaña sin persistencia no garantizan recuperar lo que aún no ha llegado al receptor frente a un cierre forzado o un apagado.

Requisito de la siguiente fase, no implementado: un receptor autenticado debe guardar cada valoración de forma duradera, confirmar solo después de guardarla, aceptar reintentos con identificadores estables sin duplicar y permitir recuperar lo confirmado según los permisos de cada persona y centro. Los errores y los registros todavía no confirmados deben ser visibles. Sin una copia local, ni siquiera ese servidor podrá recuperar cambios que nunca le hayan llegado; hay que probar también ese límite, especialmente sin conexión.

## Siguiente fase acordada: seguimiento de apoyos

Propuesta, no funcionalidad disponible. Primero hay que acordar quién registra, quién revisa, dónde se conserva y qué campos son necesarios. Reutilizar el visualizador para consultar evidencias, sin mezclar su feedback de evaluación con expedientes educativos.

| Necesidad | Datos mínimos propuestos | Acceso propuesto | Validación | Carga añadida |
| --- | --- | --- | --- | --- |
| Reconocer una conducta concreta | Expectativa del centro, conducta observada, contexto, fecha, estudiante y autor | Autor y equipo autorizado del centro | Guardar, recuperar y corregir con historial | Seleccionar conducta y contexto; medir tiempo real con docentes |
| Acordar un apoyo | Evidencia inicial, objetivo observable, actuación, responsable y revisión | Equipo de apoyo autorizado | Caso completo desde observación a decisión | Un acuerdo por apoyo, evitando duplicar informes |
| Comprobar aplicación | Fecha prevista/real, realizada/no realizada, motivo cuando proceda | Responsable y equipo | No confundir mejora del estudiante con cumplimiento de la actuación | Confirmación breve por actuación |
| Revisar progreso | Medida inicial, periodo comparable, asistencia/oportunidades, resultado y decisión | Equipo de apoyo autorizado | Comparación con datos incompletos y sin atribuir causalidad automáticamente | Revisión acordada, no comentario obligatorio diario |

La pantalla **Qué necesita atención esta semana** se justifica cuando existan esos registros. Mostrará únicamente revisiones vencidas o próximas, actuaciones sin confirmar, evidencias de progreso y datos faltantes. Cada fila enlazará al apoyo/evidencia y a una acción: revisar, confirmar aplicación o solicitar información. No se ordenarán estudiantes por supuesta gravedad ni se generarán alertas desde umbrales inventados.

Permisos requeridos: cuentas personales, centro separado en almacenamiento y autorización de cada lectura/escritura en servidor; asignaciones de aula/equipo verificadas allí, revocación y trazabilidad. Eliminar una cuenta o cambiar un selector no puede ser el control de seguridad. La elección de proveedor y conservación sigue pendiente.

## Evidencia oficial frente a propuesta

El Center on PBIS describe enseñanza y reconocimiento de expectativas como componentes de Tier 1. Esto respalda distinguir un reconocimiento de conducta de una opinión sobre la claridad de una ficha; no demuestra eficacia de nuestro software. [Fuente oficial Tier 1](https://www.pbis.org/pbis/tier-1).

Para Tier 2 distingue el progreso del estudiante y la fidelidad/frecuencia de aplicación de los apoyos. La propuesta anterior conserva esa separación; la pantalla semanal y sus campos son decisiones de diseño pendientes de contrastar con los centros. [Fuente oficial Tier 2](https://www.pbis.org/pbis/tier-2), [guía oficial de sistemas de centro](https://www.pbis.org/resource/tier-2-school-level-systems-guide).

No se atribuye al prototipo la evidencia del marco PBIS, ni se afirma validación de instrumentos, aprobación ética o certificación de seguridad. Las lecciones de RADARS son las aportadas por el usuario; no se ha auditado aquí su código.
