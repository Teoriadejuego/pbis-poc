# PBIS en GitHub Pages

[Web](https://teoriadejuego.github.io/pbis-poc/) · [Demo](https://teoriadejuego.github.io/pbis-poc/DEMO.html#demo) · [Práctica](https://teoriadejuego.github.io/pbis-poc/DEMO.html#guia) · [Repositorio](https://github.com/Teoriadejuego/pbis-poc)

La versión 0.11.1 incorpora acceso unificado y proyectos cifrados con permisos por aula. El registro privado de accesos requiere activar el receptor de Google Sheets. Conserva la revisión de consulta y valoraciones: borradores visibles, envío manual revisable y envío tras 15 minutos de inactividad. No guarda valoraciones de forma persistente en el navegador. Conserva las funciones Wave 1, perfiles, fichas, redes, demo y descargas. La entrada visible es Comenzar práctica guiada. Sus claves se muestran dentro de la simulación, que espera a «Cargar datos demo» y termina con el cierre de sesión.

## Publicación

El repositorio utiliza main y GitHub Pages con GitHub Actions. Cada subida ejecuta **Construir y comprobar** y después **Publicar**. El flujo compila y prueba antes de publicar únicamente site/.

site/ y release/ son salidas generadas; no se guardan en Git. Node.js 24 es necesario para construir, pero no para usar el visualizador. Las dependencias del navegador están incluidas.

## Datos y correo

Solo se publican código y ejemplos sintéticos. Los archivos seleccionados por una persona se leen en el navegador y no pasan al repositorio. No añadas datos de centros, claves privadas ni opiniones recibidas.

PBIS_BATCH_ENDPOINT configura el receptor de las valoraciones de consultas con cuenta; actualmente usa el formulario público Formspree. La demo nunca envía sus marcas. GitHub Pages aloja la web, no el receptor de correo. No se necesitan secretos de correo en el código.

Después de publicar, comprueba el resultado del flujo, la versión en la portada y manifest.json, y los hashes de las descargas. Si falla una prueba, no se publica esa compilación. Consulta COMPROBACIONES.md y la auditoría del piloto para los límites de la entrega.
