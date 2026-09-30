# PBIS 0.9.1 · Evidencia y límites de la entrega

Actualizado: 30 de septiembre de 2026. Entorno de desarrollo: Windows, navegador Chromium integrado y Node.js 24 incluido en el entorno de autoría. Integración continua: Ubuntu con Node.js 24 en GitHub Actions.

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
- Pendiente: publicar receptor HTTPS, configurar remitente y clave Resend, regenerar con FEEDBACK_ENDPOINT y confirmar recepción real en Outlook. No se afirma entrega efectiva ni disponibilidad de un servicio no desplegado.

## Prueba de concepto web y revisión editorial

- DEMO.html incorpora exclusivamente los 1.512 registros ficticios, sus claves y los 54 grupos del ejemplo. Los perfiles de tutoría mantienen su ámbito de 28 estudiantes. La versión descargable PBIS.html no incorpora estos registros.
- Carga manual comprobada en navegador sobre localhost: iniciar sesión con `tutor7a` o usar **Probar con orientación** deja los Excel vacíos, los filtros ocultos y las pestañas desactivadas. El ejemplo se activa únicamente al pulsar **Cargar ejemplo**; `tutor7a` ve 28 estudiantes de Sevilla, 1.º ESO A. Cerrar sesión y volver a entrar mantiene la consulta vacía hasta una nueva carga. Las 72 pruebas automáticas siguen superadas después del cambio.
- Los filtros actualizan la consulta; cambiar entre Ana M. y Alba actualiza la ficha individual. Cerrar sesión retira las fichas y los controles de consulta.
- Repositorio público `Teoriadejuego/pbis-poc` y GitHub Pages activados. Primer despliegue correcto el 30 de septiembre de 2026, commit `458bceb`, ejecución `36690923072`: construcción, 72 pruebas en Ubuntu y publicación de `site/`. Secretos, bases de opiniones, cachés y documentos ajenos al producto quedan fuera del repositorio.
- Sitio público comprobado en navegador: portada disponible y acceso de orientación a 1.512 estudiantes. Filtros Córdoba → 2.º Bachillerato → C; ficha individual de Alba con ID `01503`. El formulario de opinión muestra claves de aula y estudiante sin el nombre y avisa de que el correo está desactivado. Cerrar sesión limpia la interfaz; consola sin errores. Vista móvil de 390 px (375 px útiles) sin desbordamiento horizontal y con tarjetas legibles.
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

77 pruebas superadas con envío configurado y sin envío. Se verifica respuesta explícita ok, campos limitados, bloqueo tras éxito, exportación disponible tras fallo y aviso de posible duplicación al reintentar. El único POST real de prueba devolvió HTTP 200 y ok=true; ID 2b892447-d137-480a-993e-8a7861a07706. Esta aceptación no acredita la recepción en el buzón, pendiente de confirmación por su titular. Las comprobaciones anteriores de correo desactivado describen versiones anteriores; el servidor Resend continúa siendo una alternativa separada.
