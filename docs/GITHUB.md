# PBIS en GitHub Pages

[Web](https://teoriadejuego.github.io/pbis-poc/) · [Demo](https://teoriadejuego.github.io/pbis-poc/DEMO.html#demo) · [Práctica](https://teoriadejuego.github.io/pbis-poc/DEMO.html#guia) · [Repositorio](https://github.com/Teoriadejuego/pbis-poc)

La versión 0.12.0 destaca «Acceder con mi cuenta» en la portada y conserva la práctica guiada como opción secundaria. Incluye administración simplificada, acceso a proyectos cifrados por aulas y exportación PDF con permisos, marcas docentes y contraseña DNI. La configuración de Google Sheets permanece en la copia local de dirección; sus secretos no se publican. El motor Wave 1, las normalizaciones y los datos demo se conservan. No se guardan valoraciones de forma persistente en el navegador.

## Publicación

El repositorio utiliza main y GitHub Pages con GitHub Actions. Cada subida ejecuta **Construir y comprobar** y después **Publicar**. El flujo compila y prueba antes de publicar únicamente site/.

site/ y release/ son salidas generadas; no se guardan en Git. Node.js 24 es necesario para construir, pero no para usar el visualizador. Las dependencias del navegador están incluidas.

## Datos y correo

Solo se publican código y ejemplos sintéticos. Los archivos seleccionados por una persona se leen en el navegador y no pasan al repositorio. No añadas datos de centros, claves privadas ni opiniones recibidas.

PBIS_BATCH_ENDPOINT configura el receptor de las valoraciones de consultas con cuenta; actualmente usa el formulario público Formspree. La demo nunca envía sus marcas. GitHub Pages aloja la web, no el receptor de correo. No se necesitan secretos de correo en el código.

Después de publicar, comprueba el resultado del flujo, la versión en la portada y manifest.json, y los hashes de las descargas. Si falla una prueba, no se publica esa compilación. Consulta COMPROBACIONES.md y la auditoría del piloto para los límites de la entrega.
