# PBIS 0.10.16 · Red de comunidades

## Vista de comunidades · 16 de octubre de 2026

- La red del aula alterna entre círculo y comunidades ya calculadas. Los nodos identifican cada comunidad por color; las flechas conservan dirección, intensidad y tipo de relación.
- Comprobados los mismos estudiantes y vínculos en ambos diseños, el estudiante destacado, el zoom, la navegación a las fichas y el uso del teclado. Las asignaciones ausentes no se presentan como comunidades calculadas.
- 180 pruebas Node y 12 Python superadas. En Edge/Windows: demo de 16 pasos, 12 perfiles, fichas a 1360, 390 y 320 px, carga offline mediante Blob worker y feedback interceptado sin correos reales.
- La demo incluye 162 relaciones observadas en el aula utilizada en la prueba visual. Se comprueba su conservación al cambiar de diseño; también se prueban archivos de indicadores sin relaciones individuales.
- Web y cuatro descargas reconstruidas desde las mismas fuentes. Cálculos, normalización, filtros de nominaciones, cuentas y recorrido de la demo sin cambios.
- Las revisiones locales del 16 de octubre que se describen a continuación se incorporan a esta entrega; sus menciones a ausencia de publicación describen el estado en que se realizaron.

# PBIS 0.10.15 · Terminología unificada

## Distribución estática unificada · 16 de octubre de 2026

- Nueva carpeta separada con index.html, un único app.html, recursos visuales, guía y un ZIP universal. PBIS.html y DEMO.html son redirecciones pequeñas que conservan query y hash.
- 177 pruebas Node y 12 Python superadas. En Edge/Windows se comprueban el portal a 1360, 390 y 320 px, la guía móvil, las redirecciones, la demo de 16 pasos y las 12 cuentas.
- El ZIP descargable extraído se prueba con file://, red desactivada e importación .pbis mediante Blob worker. Se conserva el envío de feedback con pruebas interceptadas, sin correos reales.
- Corregido el desbordamiento del pie de la portada a 320 px mediante salto de línea de sus enlaces.
- El generador valida enlaces, rechaza sobrescribir carpetas existentes y produce ZIP reproducibles. Se compara cada archivo de la carpeta y del ZIP con la construcción; aplicación online y local idénticas.
- Sin borrado de fuentes ni publicación. El proyecto mantiene las pruebas y herramientas; la distribución no las necesita para ejecutarse. Los cálculos y la normalización no cambian.

## Entrega local reducida · 16 de octubre de 2026

- 177 pruebas Node y 8 Python superadas, más el recorrido real de navegador con 12 perfiles.
- En Edge/Windows, importación de un .pbis mediante el worker Blob desde file:// con la red del contexto desactivada; demo, consulta de lista y cierre correctos.
- Se retiran de la construcción pública los Excel sueltos de datos, nombres y perfiles, incluidos restos de versiones anteriores. La lista de publicación se comprueba también como paso explícito de CI.
- Nuevo modo `python tools/empaquetar_entrega.py --tipo aplicacion`: una copia del visualizador, pantalla de inicio, instrucciones, licencia y hashes. Sin Excel separados, fuentes del servicio, pruebas ni otras copias de la aplicación.
- El servicio opcional sigue únicamente en las fuentes. El envío configurado a Formspree se conserva; se intercepta en las pruebas y no se envían correos reales.
- Cálculos, normalización, demo y código de la interfaz no modificados. Cambios solo locales; no se han retirado archivos de la web publicada.

## Revisión técnica local · 16 de octubre de 2026

- 176 pruebas Node y 7 Python, más el recorrido completo en navegador.
- Edge/Windows: guía de 16 pasos, 12 cuentas, carga de Excel con el worker real, cuatro vistas a 1360, 390 y 320 px, reacciones, envío fallido y reintento con el mismo lote, y demo sin conexión.
- Se usan exclusivamente ejemplos sintéticos y receptores interceptados. Ningún correo real enviado.
- 40 sesiones simultáneas y sus reintentos probados contra el servicio alternativo local; esta prueba no mide la capacidad de Formspree.
- Hashes del manifiesto y SHA256SUMS.txt, lista de archivos públicos y contenido exacto de las cuatro descargas comprobados.
- Ejemplos reubicados en data/examples/ sin modificar sus bytes; cálculos y normalización conservados. Documentación de Wave 1 corregida para describir el motor actual.
- Informe de decisiones: docs/REVISION_PROPUESTAS_20261016.md. Resultados reproducibles con npm run check; mediciones de navegador en test-results/e2e.json.
- Cambios preparados en local. No se ha desplegado esta revisión ni se ha certificado funcionamiento en equipos físicos macOS/Linux.

## Actualización del 15 de octubre de 2026

- Navegación Centro → Curso → Aula; fichas de centro, aula y estudiante, y Lista de aula. Las agrupaciones calculadas en la red se denominan Comunidades de relaciones.
- Bienestar es el índice conjunto; Soledad es una de sus preguntas. Buenas y malas relaciones se distinguen en declaradas, recibidas y mutuas. Cada conjunto incluye sus respuestas «muy buena» o «muy mala».
- Se separan declaración de acoso y menciones de acoso recibidas, opinión sobre la ficha y valoración de los datos, contraseña de acceso y código de estudiante.
- Revisadas fichas, filtros, cuentas, práctica guiada, ayudas, etiquetas de las valoraciones, instrucciones y documentación de las descargas. Se conserva la pregunta original sobre disfrutar con amistades y los nombres técnicos de columnas por compatibilidad.
- Comparados con la versión publicada anterior los 1.512 registros, 54 agregados de aula y dos agregados de centro de la demo: valores sin cambios. No se modifican fórmulas, normalización, ámbitos, cuentas ni contraseñas.
- 166 pruebas Node y cuatro Python superadas. Recorridos completos de los 16 pasos de la demo y de acceso con tutoría y orientación comprobados en Edge/Windows. Fichas verificadas a 1360, 390 y 320 píxeles, sin errores JavaScript ni desbordamiento horizontal de página. Se bloquearon las conexiones externas; no se enviaron correos reales.
- Guías y etiquetas de acceso y opiniones revisadas en el navegador. Las cuatro descargas se generan desde el mismo código. La compatibilidad en equipos físicos macOS y Linux sigue pendiente de comprobación.

## Historial de comprobaciones

# PBIS 0.10.14 · Notas de lectura simplificadas

## Actualización del 15 de octubre de 2026

- Eliminadas la introducción extensa de la red de aula y las notas repetidas sobre normalización, percentiles y denominadores en las fichas de aula, centro y estudiante.
- Cobertura, errores de importación y falta de respuesta se explican con frases breves. Se conservan leyendas, escalas, datos simulados y ayudas desplegables de cálculo.
- 166 pruebas Node superadas. Sin cambios en indicadores, filtros, datos, permisos ni pasos de la demo.
- Comprobadas las cuatro vistas en Edge/Windows y la red en 1360, 390 y 320 píxeles. Sin errores JavaScript ni desbordamientos horizontales; las dos frases retiradas ya no aparecen en las fichas. Se conserva la navegación entre fichas y el zoom.
- No se enviaron comentarios ni datos externos durante la revisión. Web y cuatro descargas se generan desde el mismo código.

# PBIS 0.10.13 · Red del aula

## Actualización del 15 de octubre de 2026

- Red circular al final de «Ver más indicadores» de la ficha de aula, con todos los estudiantes y las nominaciones observadas dentro del aula. Orden por menciones de buenas relaciones recibidas, sin modificar cálculos ni ámbito del indicador.
- Flechas dirigidas, signos e intensidades conservados; recorridos separados para las nominaciones recíprocas. No se deducen vínculos de los recuentos agregados.
- Incluye estudiantes sin respuesta y sin relaciones; cobertura diferenciada. Se mantienen los límites de centro, curso, aula y perfil, los nombres abreviados y los códigos.
- 166 pruebas Node y cuatro Python superadas. Se han comprobado orden, empates, datos ausentes, vínculos externos, duplicados, escape de textos, geometría y navegación con orientación y tutoría.
- Edge en Windows: 1360, 390 y 320 píxeles. Comprobados el zoom, el desplazamiento, el destacado, la apertura de fichas y el cambio de aula; sin desbordamiento horizontal de la página ni errores JavaScript. Los textos del gráfico quedan dentro del SVG.
- En Centro 3705 → 1.º ESO → A, la demo muestra 28 estudiantes, 27 respuestas de relaciones y 162 nominaciones dentro del aula. Conserva todos sus pasos y datos anteriores.
- Las solicitudes externas se bloquearon durante la prueba visual. No se enviaron datos ni correos de prueba.
- El mismo módulo se incluye en la web y los cuatro ZIP. Se adjunta PROMPT_RED_CLASE.md con los criterios de implementación y validación. macOS y Linux no se han ensayado en equipos físicos en esta revisión.

## Historial de comprobaciones

# PBIS 0.10.12 · Comprobación de la entrega

## Actualización del feedback · 15 de octubre de 2026

- 156 pruebas Node y cuatro pruebas Python superadas. Se conserva el cálculo de indicadores y la demo anterior.
- Envíos v2 con centro, curso, aula, ID original, cuenta docente y valor observado del indicador valorado. Tipos separados para reacciones, confianza, no participación y utilidad de interfaz. Sin nombres ni archivos completos.
- Validado en Edge/Windows con un Excel sintético: opiniones de dos centros, ficha de estudiante, reacción, confianza y motivo de ausencia. Revisar envío y copia JSON, en 1360 y 390 px. Sin errores JavaScript.
- Receptor interceptado: un fallo 503 mantiene la sesión y un reintento reutiliza exactamente el lote. No se enviaron correos externos durante estas pruebas.
- Conversión del JSON de ese flujo a seis registros CSV/SQLite, ceros iniciales conservados. Importación repetida sin duplicar y conflictos detectados.
- Los cuatro ZIP contienen el visualizador, FEEDBACK_DATOS.md y el importador local. El registro en Formspree y la entrega de correo en producción no se han vuelto a ensayar con un envío real para esta actualización.

Las secciones siguientes conservan comprobaciones de entregas anteriores; el contrato actual del feedback está descrito en FEEDBACK_DATOS.md.


Revisión del 10 de octubre de 2026. Los accesos usan los nombres inclusivos tutoria + curso y orientacion. Se añaden cuentas específicas para 3.º ESO PDC I y 4.º ESO PDC II. El alcance reconoce PDCI/PDC I y PDCII/PDC II, sin confundirlos ni permitir otros cursos o aulas. Las cuentas generales por curso conservan su alcance. Se actualiza la contraseña de orientación y se rechazan los nombres anteriores.

142 pruebas automáticas superadas en Windows. Se comprueban el inicio y cierre de todas las cuentas, los dos perfiles PDC con datos simulados en dos centros, la apertura de lista y ficha de estudiante, la ausencia de estudiantes asignados y la conservación de la práctica guiada. Los HTML y ZIP contienen el mismo catálogo de cuentas. La revisión local de los archivos recibidos confirma que las dos denominaciones PDC se importan y se asignan a su perfil. Los originales y el Excel de distribución de contraseñas quedan en local. El libro histórico de accesos deja de incluirse en el repositorio.

## Revisión anterior

# PBIS 0.10.8 · Comprobación de la entrega

Revisión del 10 de octubre de 2026. Los resúmenes de aula y centro cuentan estudiantes con 2 o más nominaciones válidas recibidas. Las fichas y listas conservan el número recibido, incluido 1. Los denominadores incluyen todos los registros con recuento conocido; sin información válida se mantiene Sin datos.

137 pruebas automáticas superadas en Windows: recuentos recibidos, nominaciones entre aulas, declaraciones de acoso, valores ausentes, compatibilidad con las escalas normalizadas anteriores y lectura de la demo. Los HTML públicos y los cuatro ZIP incluyen exactamente los motores probados. Las pruebas del servicio usan un receptor local simulado y no envían correos reales.

Los datos reales, sus informes y las credenciales privadas permanecen fuera de esta publicación. La ejecución en equipos macOS/Linux sigue pendiente de validación en esos equipos.

## Revisión anterior

# PBIS 0.10.7 · Comprobación de la entrega

Revisión del 10 de octubre de 2026. Se revisó la importación de Users y se comprobó la conservación de los declaraciones de acoso, las demás medidas y los registros de estudiantes.

133 pruebas automáticas superadas en Windows, incluidas la autoselección, las nominaciones entre aulas, la conservación de otras medidas y el lector incluido en los HTML distribuidos. Los cuatro ZIP contienen la misma aplicación. El cálculo se ha contrastado con un recuento independiente en local. No se incorporan archivos de centros, resultados de la revisión, informes ni nuevas credenciales privadas al repositorio o a las descargas. La ejecución en macOS/Linux sigue pendiente de validación en esos equipos.

## Revisión anterior

# PBIS 0.10.5 · Comprobación de la entrega

Revisión del 9 de octubre de 2026. La red individual adopta el formato del visualizador ISAT: nodo central identificado, tarjetas con nombres abreviados o códigos y clase, flechas independientes en ambos sentidos, azul/rojo por signo y grosor por intensidad. Las tarjetas abren las fichas respetando el ámbito del perfil. Incluye ampliación, reducción y ajuste completo; la práctica guiada explica los nuevos controles. No cambia los cálculos.

127 pruebas automáticas superadas en Windows. Comprobaciones de geometría sin solapamientos hasta 300 personas, escape de etiquetas, respuestas ausentes, navegación entre aulas, límites de tutoría y conservación de opiniones. Verificación visual en navegador de escritorio y a 390 × 844: ampliación, ajuste, flechas, nombres abreviados y apertura de fichas; sin desbordamiento horizontal de página ni errores de consola. La web y los cuatro descargables contienen el mismo módulo, sin servicios ni librerías remotas adicionales. La compatibilidad en equipos macOS/Linux sigue pendiente de verificación en esos sistemas.

## Revisión anterior · 0.10.4

Revisión del 9 de octubre de 2026. El lector Wave 1 distingue una lista de acoso vacía confirmada por respuestas posteriores de una pregunta sin responder. Conserva respuestas explícitas aunque falte su marca de entrada. El marcador de exportación «Error en relación» deja pendiente únicamente la pregunta afectada, informa en las fichas y permite calcular las demás medidas. Se han añadido pruebas de regresión con datos sintéticos; los archivos utilizados para la revisión privada no se incluyen en el repositorio ni en la demo.

122 pruebas automáticas superadas en Windows. Comprobación local en navegador de seis archivos, sustitución de datos y fichas de centro, clase, lista y estudiante, incluidas las ampliaciones y la red. Sin errores de consola ni envíos de correo. La web y las cuatro descargas comparten el lector corregido. La compatibilidad en equipos macOS/Linux sigue pendiente de verificación en esos sistemas.

Se corrige también el límite de iteraciones de centralidad: una red con componentes de valores propios muy próximos podía no estabilizarse en 500 pasos. Una prueba sintética comprueba la convergencia y la ecuación del eigenvector. Si se alcanza el nuevo límite sin convergencia, el indicador queda pendiente y se informa en todas las vistas.

La versión 0.10.3 introdujo la corrección de cobertura y errores de exportación; la 0.10.4 completa la revisión de centralidad.

## Revisión anterior · 0.10.2

Revisión del 8 de octubre de 2026: 115 pruebas automáticas superadas. Los centros de la demo son Centro 3705 y Centro 3884, códigos ficticios fijos de cuatro cifras. Las tablas de estudiantes y grupos conservan sus correspondencias y medidas. El recorrido guiado se verificó completo en el navegador: carga explícita, selección de Centro 3705 → 1.º ESO → A, ordenación, reacción, ficha de estudiante, ficha de centro, confianza y cierre. El último paso explica que el cierre envía los comentarios y valoraciones en una consulta con cuenta; la demo completa el ejercicio sin enviar nada. Consola sin errores.

## Revisión anterior · 0.10.1

Revisión del 8 de octubre de 2026: 115 pruebas automáticas superadas en Windows. La entrada visible a la demo es «Comenzar práctica guiada»; las credenciales se muestran dentro de la simulación. Se ha comprobado en escritorio y a 390 × 844 que el cuadro de ayuda no tapa «Lista de aula». El ejercicio final destaca «Cerrar sesión» y solo al pulsarlo muestra la práctica completada, retira las fichas y descarta sus valoraciones sin enviar correo. Ana M. tiene 3/3 aciertos; en el aula del ejercicio se muestran 1,6/3 de media y 28 respuestas válidas. Consola del navegador sin errores.

Las cuatro descargas incorporan estos mismos cambios. La apertura directa de los ZIP y la compatibilidad en macOS/Linux siguen pendientes de comprobación en esos equipos.

## Revisión anterior · 0.10.0

Revisión del 8 de octubre de 2026: 114 pruebas automáticas superadas en Windows. Pruebas de navegador: demo con carga explícita, práctica completa y atajo, perfiles de tutoría y orientación, carga de .pbis, fichas y cierre desde PBIS. Revisión móvil a 390 × 844. Las cuatro descargas contienen la misma aplicación y demo. No se enviaron correos reales en esta revisión.

Consulta docs/AUDITORIA_PILOTO_20261008.md para la evidencia y los límites. La apertura directa de los ZIP y la compatibilidad en macOS/Linux requieren comprobación en los equipos destino. La demo funciona sin conexión mediante datos incorporados; sus valoraciones nunca se envían.

## Historial de versiones anteriores

Los apartados siguientes describen versiones previas; sus cifras, credenciales, formatos y condiciones de demo no sustituyen las indicadas arriba.

# PBIS 0.9.1 · Evidencia y límites de la entrega

## Revisión de interfaz y carga · 5 de octubre de 2026

La portada presenta las tres vistas reales: ficha de aula, lista de aula y ficha de estudiante. Los textos de ayuda describen el envío agrupado al cerrar. La demostración sirve sus 1.512 registros simulados desde `demo-data.json` únicamente cuando se pulsa **Cargar ejemplo**; `DEMO.html` ya no incorpora el conjunto de datos. En el navegador local se comprobó el acceso, la carga, las pestañas, la lista a 390 px, el indicador de desplazamiento, el cambio de la etiqueta de cierre al valorar un dato y una sola cabecera en la ficha de estudiante ampliada. No se realizó un nuevo envío a Formspree.

**81 pruebas automáticas superadas en Windows.** La eliminación de una biblioteca Excel duplicada redujo `PBIS.html` de aproximadamente 2,12 MB a 1,13 MB y cada ZIP de alrededor de 740 KB a 400 KB. Las comprobaciones históricas siguientes describen versiones anteriores cuando indican otras cantidades o el ejemplo integrado en `DEMO.html`. La ejecución de esta revisión en Ubuntu se verificará en el flujo de publicación.

## Copia local de lista de aula · 5 de octubre de 2026

Esta versión publicada incluye reacciones por indicador, confianza de −5 a +5 y un resumen de cierre con usuario de acceso y comentarios. Los encabezados de la lista ordenan cada indicador en ambos sentidos; las reacciones se abren al pulsar el dato y «Mal» se muestra como «Revisar». Las pruebas automáticas de esta versión pasan: cálculo de felicidad, lectura del Excel con y sin llave, rechazo de IDs incorrectos, reacciones, confianza, ordenación, resumen de cierre y opinión de la lista. En navegador se comprobó que la ordenación de amistades y felicidad coloca primero los mayores valores, que la reacción permanece unida al ID tras ordenar y que pulsar el dato no abre la ficha de estudiante. En una prueba anterior Formspree confirmó **un envío con datos inventados**. Esto confirma el registro por Formspree, no la entrega final al buzón. La versión online incorpora estos cambios.

Actualizado: 5 de octubre de 2026. Entorno de desarrollo: Windows, navegador Chromium integrado y Node.js 24 incluido en el entorno de autoría. Integración continua: Ubuntu con Node.js 24 en GitHub Actions.

[Web publicada](https://teoriadejuego.github.io/pbis-poc/) · [Demostración](https://teoriadejuego.github.io/pbis-poc/DEMO.html) · [Despliegue comprobado](https://github.com/Teoriadejuego/pbis-poc/actions/runs/36690923072)

## Superado

- 72 pruebas automáticas superadas tanto en Windows como en Ubuntu (46 nuevas para opiniones, códigos de aula, servicio y configuración): validación de datos, IDs duplicados o sin correspondencia, campos ausentes, límites, denominadores, perfiles, estructura de grupos y escape de texto.
- Lectura de los tres Excel finales con el mismo lector del producto: 1.512 estudiantes, 54 grupos, 59 perfiles y 18.502 relaciones. Coincidencia con los valores fuente; IDs de texto con ceros iniciales.
- Coherencia de todas las escalas normalizadas y de los agregados; comprobación específica que evita usar números redondeados por el formato de las celdas.
- Fórmulas y valores guardados en los Excel verificados por la herramienta de autoría. Cambio y restauración de una nominación para comprobar el recálculo. Revisión visual de rangos representativos de las siete hojas.
- Prueba real en navegador por localhost: acceso de orientador, lectura de ambos Excel por separado, 1.512 estudiantes validados, cambio de centro/curso, fichas de grupo e individuales, Ana M. y actualización al seleccionar Lucía sin escribir la tilde. Búsqueda sin coincidencias comprobada.
- Contraseña incorrecta rechazada. Tutor7a carga exclusivamente su vista de 28 estudiantes, Sevilla, 1.º ESO A; los selectores no ofrecen otros grupos.
- Cambiar la hoja retira de inmediato las fichas anteriores. Seleccionar Grupos como hoja de indicadores produce un error con las columnas ausentes. Cerrar sesión vuelve al acceso, sin los selectores ni las fichas de la consulta anterior.
- Web revisada en escritorio y con ancho móvil simulado de 390 px. Navegación del menú con teclado, anclas y recursos locales comprobados. La aplicación dispone de diseño adaptable; su ficha se revisó visualmente en la anchura disponible del navegador integrado.
- Cuatro ZIP válidos: mismo HTML autocontenido, guía y licencia; ninguno incluye los Excel del proyecto. Hashes SHA-256 y tamaños comprobados contra el manifiesto. Enlaces de la web resueltos a archivos entregados.
- Los scripts empaquetados coinciden con sus fuentes y compilan; sus hashes coinciden con la política de contenido. La entrega sin receptor prohíbe conexiones; la configuración opcional admite solo su URL HTTPS para enviar opiniones explícitamente. El visualizador no usa almacenamiento persistente ni telemetría.

## Opiniones: verificación de la versión 0.9.1

- Contrato de diez campos: tipo de ficha, rol, sesión aleatoria, ID de opinión, claves de aula/estudiante, voto, comentario, fecha y versión. Rechazo de campos extra. ID del estudiante como texto; nulo para grupo. Los datos son seudonimizados y vinculables con los archivos originales.
- Claves de aula SHA-256 reproducibles, código explícito opcional ID_aula y rechazo de duplicados en Grupos. Borradores separados por ficha, aula y estudiante; controles de concurrencia y ausencia de nombres o indicadores añadidos al envío.
- Pruebas de receptor HTTP y SQLite privados con proveedor simulado: registro, aceptación, fallo, reintentos, reinicio, deduplicación, adjunto de una opinión, exportación consolidada, restricciones y límites. No se ha enviado ningún correo real.
- Pruebas de los controladores de interfaz con un DOM de prueba: envío voluntario, reintentos con el mismo ID, estado pendiente frente a aceptado, cancelación de todas las solicitudes al salir y recuperación ante fallos de exportación.
- Navegador real sobre localhost: tutor7a, ficha del grupo e individual, clave estable AULA-ba8346ce809d9fd65c9b8dab e ID 00253. Dos descargas reales verificadas con el lector Excel: una y dos opiniones, hoja única Opiniones, diez columnas, ceros iniciales conservados y sin nombres/centro/curso añadidos. El aviso indica que guardar localmente no envía correo.
- Cierre de sesión real: formulario cerrado, comentario y claves vacíos, votos desmarcados; la siguiente sesión comienza sin el estado anterior.
- Revisión visual del formulario en escritorio y viewport móvil configurado a 390 px (375 px útiles). Sin desbordamiento horizontal; el diálogo permite desplazamiento vertical cuando lo necesita. Evidencia en qa/opiniones-escritorio.png y qa/opiniones-movil.png.
- Normalización de saltos de línea antes de calcular hashes CSP: evita que guardar fuentes con CRLF en Windows bloquee el acceso al empaquetarlas en HTML.
- Nota histórica: el receptor propio con Resend no se publicó. El flujo actual usa Formspree y se confirmó la recepción de un mensaje de prueba con datos inventados.

## Prueba de concepto web y revisión editorial

- La demostración pública ofrece los 1.512 registros simulados, sus claves y los 54 grupos en `demo-data.json`; se descargan al pulsar **Cargar ejemplo**. Los perfiles de tutoría mantienen su ámbito de 28 estudiantes. La versión descargable `PBIS.html` no incorpora estos registros.
- Carga manual comprobada en navegador sobre localhost: iniciar sesión con `tutor7a` o usar **Probar con orientación** deja los Excel vacíos, los filtros ocultos y las pestañas desactivadas. El ejemplo se activa únicamente al pulsar **Cargar ejemplo**; `tutor7a` ve 28 estudiantes de Sevilla, 1.º ESO A. Cerrar sesión y volver a entrar mantiene la consulta vacía hasta una nueva carga. Las 72 pruebas automáticas siguen superadas después del cambio.
- Los filtros actualizan la consulta; cambiar entre Ana M. y Alba actualiza la ficha de estudiante. Cerrar sesión retira las fichas y los controles de consulta.
- Repositorio público `Teoriadejuego/pbis-poc` y GitHub Pages activados. Primer despliegue correcto el 30 de septiembre de 2026, commit `458bceb`, ejecución `36690923072`: construcción, 72 pruebas en Ubuntu y publicación de `site/`. Secretos, bases de opiniones, cachés y documentos ajenos al producto quedan fuera del repositorio.
- Sitio público comprobado en navegador: portada disponible y acceso de orientación a 1.512 estudiantes. Filtros Córdoba → 2.º Bachillerato → C; ficha de estudiante de Alba con ID `01503`. El formulario de opinión muestra claves de aula y estudiante sin el nombre y avisa de que el correo está desactivado. Cerrar sesión limpia la interfaz; consola sin errores. Vista móvil de 390 px (375 px útiles) sin desbordamiento horizontal y con tarjetas legibles.
- Descarga pública de PBIS-Windows.zip comprobada: SHA-256 idéntico al paquete generado localmente. Esta comprobación verifica la entrega del ZIP, no su apertura directa mediante file://.
- Textos revisados para centros de enseñanza en España: estudiantes, tutoría, orientación, acoso escolar, respuesta personal, información del grupo y reconocimiento en mediación. Identificadores de archivos y cuentas heredados se conservan por compatibilidad.
- Dieciséis descripciones del diccionario y dos avisos del Excel de perfiles actualizados. Comparación exhaustiva confirma conservación de fórmulas, valores, IDs, estilos, dimensiones y paneles. La llave de nombres permanece intacta.

## Implementado, con alcance de prueba limitado

- Cierre de sesión: cancela los trabajadores de lectura, elimina referencias al conjunto de datos, vacía los controles y vuelve al acceso. Pagehide retira el estado de la instancia y el retorno desde la caché de navegación vuelve al acceso.
- Caducidad de 15 minutos sin interacción: comprobación periódica y al recuperar visibilidad. No se ha realizado una espera cronometrada de 15 minutos en todos los navegadores.
- Lectura aislada con límite de 20 MB por archivo, 10.000 registros por hoja de consulta, 100 columnas, un millón de celdas convertido en total y 30 segundos por lectura. Estos límites no constituyen una garantía de memoria máxima ante archivos hostiles.
- No se ha auditado de forma independiente todo el tráfico interno del navegador o sus extensiones. El bloqueo de conexiones es de la aplicación.

## Pendiente antes de un despliegue comercial

- Apertura directa de PBIS.html mediante file://: el navegador de pruebas bloqueó ese protocolo por su política. No se intentó eludirla. La funcionalidad se probó sobre localhost con el mismo HTML; debe comprobarse por doble clic en los equipos destino.
- Pruebas reales en macOS Intel/Apple Silicon, Linux y navegadores Safari/Firefox/Edge independientes. Los ZIP son ediciones del mismo HTML, no binarios nativos certificados.
- Pruebas en dispositivos móviles físicos y en más anchos de pantalla. La vista móvil del sitio público sí se ha revisado a 390 px en el navegador integrado; no sustituye las pruebas en dispositivos reales.
- Revisión con tecnologías de apoyo, prueba de ampliación y auditoría completa de accesibilidad.
- Recálculo de los libros en Excel de escritorio. Los valores cacheados y las fórmulas del fichero se han comprobado, pero no sustituyen esa prueba.
- Credenciales de producción, cifrado/compartimentación, provisión y revocación de accesos, revisión independiente de seguridad, medidas, licencias y condiciones comerciales.

Las contraseñas 1234 y el filtrado en JavaScript son de evaluación. Quien posee los Excel o controla el código puede acceder a su contenido. El cierre retira el estado de consulta; no promete borrado forense. Los originales no se modifican ni eliminan. Esta entrega no acredita aprobación ética, validez clínica ni cumplimiento normativo.


## Integración Formspree · 30 de septiembre de 2026

77 pruebas superadas con envío configurado y sin envío. Se verifica respuesta explícita ok, campos limitados, bloqueo tras éxito, exportación disponible tras fallo y aviso de posible duplicación al reintentar. El único POST real de prueba devolvió HTTP 200 y ok=true; ID 2b892447-d137-480a-993e-8a7861a07706. El titular confirmó la recepción del mensaje y compartió su contenido, coincidente con los diez campos de la prueba. Las comprobaciones anteriores de correo desactivado describen versiones anteriores; el servidor Resend continúa siendo una alternativa separada.


## Llave opcional y .pbis · 2 de octubre de 2026

Consulta por códigos sin llave, conservación de indicadores y agregados, ceros iniciales y eliminación de nombres que pudieran venir en indicadores. Prueba de los manejadores reales de carga, incorporación y retirada de llave e invalidación al sustituir los datos. El archivo datos_evaluacion.pbis coincide byte a byte con el Excel original y se lee con el mismo worker incluido en PBIS. No hay cifrado ni ofuscación.

## Actualización de participación · 11 de octubre de 2026

- La lista destaca discretamente las encuestas sin responder y sustituye la confianza por un motivo opcional. «Otro motivo» requiere una explicación antes del envío.
- Solo se usa el estado No; las encuestas parciales o de estado desconocido no se clasifican como ausencia. Las nominaciones recibidas se conservan.
- El ejemplo deja a Valeria G. (00269), última en el orden alfabético de 1.º ESO A del Centro 3705, sin respuestas propias. Los recuentos y medidas del aula se recalculan con los vínculos observados.
- El recorrido anterior de 16 pasos se mantiene, con los casos de Ana y Samuel; no se añade una lección sobre no participación.
- Web y cuatro ZIP se construyen a partir del mismo código y ejemplo. Los datos aportados por centros y los informes locales no se incluyen.


## Presentación · 14 de octubre de 2026

Se simplifican los avisos de las fichas y la documentación visible. Se conservan los cálculos, las validaciones de carga, los avisos de errores del archivo y el recorrido de la demo. Comprobadas las siete vistas disponibles entre tutoría y orientación, sin errores del navegador ni envíos de datos.
