# PBIS — consulta por clase

Esta versión se publica en la demostración online y en los paquetes descargables.

Para ver el recorrido nuevo, abre `site/DEMO.html` o `release/PBIS.html` en un navegador. En la demo, pulsa «Probar con orientación», después «Cargar ejemplo» y «Ver lista de clase». Selecciona un nombre y usa «Ver más indicadores».

Para probar la carga manual, abre `release/PBIS.html`, entra con `orientador` / `1234` y carga `outputs/entrega-20260929/datos_evaluacion.xlsx`. Selecciona **Datos**. La llave `outputs/entrega-20260929/llave_evaluacion.xlsx` es opcional y usa la hoja **Llave**. Pulsa «Abrir consulta».

El Excel de indicadores contiene 1.512 estudiantes ficticios y sus tres respuestas de felicidad. El conversor R `tools/convertir_pbis.R` necesita `readxl` y `writexl` para convertir otros libros Wave 1 de 67 columnas. El archivo original de 74 columnas de Salesianas tiene otro esquema y requiere adaptar el conversor antes de usarlo. Los tres campos de felicidad se llaman `felicidad_centro`, `felicidad_diversion` y `felicidad_soledad`, codificados de 0 a 4. La app invierte el tercero.

La lista muestra «Sin datos» cuando falta una respuesta. El Excel de prueba puede usarse sin la llave, en cuyo caso se ven códigos. Pulsa un encabezado para ordenar la lista por esa columna y repetir para invertir el orden. Cada indicador admite una reacción (OK, Revisar o Me sorprende) al pulsar su valor; al final de cada fila hay una valoración de confianza en los datos, de −5 a +5. Estas valoraciones no modifican los indicadores.

Al pulsar **Cerrar sesión**, las valoraciones de la lista y las opiniones de ficha añadidas a la sesión se envían juntas mediante Formspree al formulario `https://formspree.io/f/mvkgydrn`, cuyo destinatario configurado es `pbis_usuario@outlook.es`. El correo lleva el usuario de acceso, el rol, un código de sesión, las reacciones, la confianza y los comentarios. Las personas se identifican mediante códigos derivados del ID; no se adjuntan los Excel ni los nombres de la llave. Los comentarios son texto libre: no escribas nombres en ellos. Si falla el envío, la sesión sigue abierta y se puede reintentar o descargar el resumen. Cerrar la pestaña o perder la conexión no garantiza el envío.

Para evitar perder valoraciones pendientes, la app pide cerrar sesión antes de sustituir los archivos. La demostración online y la edición local utilizan el formulario activo.

Las cuentas de este piloto son compartidas por perfil. En el correo aparece `orientador` o la cuenta de tutoría utilizada; **no identifica de forma fiable a una persona concreta**.

Para reconstruir después de editar, ejecuta `node tools/build.mjs` dentro de esta carpeta. `PROMPTS.md` recoge desarrollo y validación.
