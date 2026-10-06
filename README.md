# PBIS · Demostración web y edición local 0.9.1

La demostración y la edición descargable incluyen la ficha de clase, la lista y las fichas individuales. Si se registran valoraciones, el resumen se envía por Formspree al pulsar «Enviar valoraciones y cerrar». Consulta [docs/OPINIONES.md](docs/OPINIONES.md).

[Abrir la web](https://teoriadejuego.github.io/pbis-poc/) · [Probar la demostración](https://teoriadejuego.github.io/pbis-poc/DEMO.html) · [Repositorio público](https://github.com/Teoriadejuego/pbis-poc)

Web de presentación, demostración en el navegador y aplicación descargable para consultar indicadores de convivencia de la clase y de cada estudiante. Evolución independiente del proyecto Shiny; los archivos anteriores se conservan.

## Empezar

Abre [la demostración publicada](https://teoriadejuego.github.io/pbis-poc/DEMO.html) y pulsa **Comenzar práctica guiada** para recorrer un ejemplo con 1.512 registros simulados en 54 grupos. También puedes entrar con una cuenta de tutoría u orientación y pulsar **Cargar ejemplo**. Con una cuenta de tutoría, verás solo los grupos de su ámbito. El ejemplo se descarga al pulsar el botón; iniciar sesión por sí solo no carga datos ni muestra fichas.

La demostración es una prueba de concepto pública. Sus nombres, relaciones e indicadores son simulados y se sirven desde `demo-data.json`: cualquiera puede inspeccionarlos. Los perfiles y la clave `1234` permiten probar recorridos; no protegen el ejemplo como si fuera información privada.

Para probar la carga manual de archivos y trabajar sin conexión, descarga la edición local desde la misma web. Extrae el ZIP y abre `PBIS/PBIS.html` con un navegador actual. Esta edición no lleva el ejemplo integrado: se cargan los indicadores .pbis y, opcionalmente, la llave Excel. Si has clonado el repositorio, ejecuta primero la construcción descrita más abajo: crea `site/`, `release/` y las descargas, que no se guardan en Git.

Ninguna opción requiere R, Docker ni instalación de paquetes. Ambas ejecutan la consulta en el navegador. La web necesita un alojamiento estático para servir sus páginas; la edición descargada puede abrirse sin conexión. Los cuatro paquetes locales utilizan el mismo motor, con instrucciones por plataforma. No son ejecutables nativos. La compatibilidad en macOS y Linux aún requiere comprobación en esos sistemas.

## Publicación en GitHub Pages

El repositorio público es [Teoriadejuego/pbis-poc](https://github.com/Teoriadejuego/pbis-poc). GitHub Pages está activado y el [primer despliegue](https://github.com/Teoriadejuego/pbis-poc/actions/runs/36690923072) terminó correctamente el 30 de septiembre de 2026, a partir del commit `458bceb`, con 72 pruebas superadas en Ubuntu. Las mismas 72 pruebas también se han superado en Windows.

Los cambios en `main` vuelven a construir, comprobar y publicar la web. Consulta [cómo mantener la publicación](docs/GITHUB.md). Se publican únicamente el producto y sus ejemplos sintéticos; no añadas archivos reales de estudiantes, llaves privadas o credenciales del servicio de opiniones.

## Valorar las fichas

La lista de clase permite ordenar por columna, reaccionar a cada dato con «OK», «Revisar» o «Me sorprende» y valorar la confianza de −5 a +5. Las fichas permiten añadir una puntuación de utilidad de 1 a 5 y un comentario. Al cerrar sesión se envía un único resumen con el usuario de acceso, rol, código aleatorio de sesión, claves de aula y estudiante, reacciones, confianza y opiniones añadidas. No incluye nombres, Excel ni valores medidos de los indicadores.

Las opiniones están **seudonimizadas**: una persona que disponga de los Excel y la llave puede relacionarlas con el aula y la persona correspondientes. La clave del aula usa `ID_aula` de `Grupos`, si existe; en caso contrario deriva una clave estable de centro, curso y grupo sin modificar los Excel. No es cifrado ni anonimato irreversible. El comentario también puede identificar a alguien: la interfaz pide no incluir nombres ni datos personales.

El envío de opiniones está conectado a Formspree. Se realiza al pulsar **Enviar valoraciones y cerrar** y requiere conexión. Si falla, se puede reintentar, guardar el resumen localmente o cerrar sin enviarlo. Cerrar la pestaña no garantiza el envío. Consulta [la guía de opiniones](docs/OPINIONES.md).

## Acceso y ejemplos

- `orientador` / `1234`: todos los centros y grupos.
- `orientador_sevilla` o `orientador_cordoba` / `1234`: un centro.
- `tutor4pa_sevilla`, `tutor1esob_cordoba`, `tutor2bachc_sevilla` / `1234`: grupos concretos.
- `tutor7a` y `tutor7b` / `1234`: alias para Sevilla, 1.º ESO A y B.

El Excel de perfiles contiene los 59 accesos. Sirve como referencia; no se importa para cambiar las cuentas del programa. Los alias 7a/7b se refieren a los nuevos cursos: los Excel anteriores con curso «7.º» pueden revisarse con `orientador`.

Los ejemplos abarcan dos centros de enseñanza, nueve cursos desde 4.º de Primaria a 2.º de Bachillerato y grupos A/B/C: 54 clases de 28 estudiantes (1.512 en total). Todos los datos son simulados. En la demostración, pulsa **Cargar ejemplo** después de iniciar sesión. En la edición local, carga `datos_evaluacion.pbis` y, si quieres ver nombres, `llave_evaluacion.xlsx`; selecciona las hojas Datos y Llave, y pulsa **Abrir consulta**. El archivo `.pbis` es un Excel renombrado, no cifrado.

Los archivos no se incluyen en los ZIP de la aplicación. Sus originales permanecen separados en las ubicaciones elegidas por cada centro.

## Estructura de la entrega

- `site/`: salida generada y publicada en GitHub Pages; incluye `DEMO.html`, documentación HTML y descargas. Contiene únicamente materiales públicos de evaluación y no se versiona en Git.
- `release/PBIS.html`: aplicación autocontenida generada al construir, para abrir en local. No se versiona en Git.
- `outputs/entrega-20260929/`: tres Excel entregados. Los archivos auxiliares de inspección no se publican.
- `src/`: interfaz, lectura de Excel y motor de validación/indicadores.
- `data/`: perfiles y ejemplos reproducibles.
- `tools/`: generador de Excel, constructor de paquetes y servidor de previsualización.
- `tests/`: pruebas del motor, los libros y la integridad de la distribución.
- `docs/`: guía, publicación con GitHub Pages, metodología, privacidad, criterios de lenguaje, revisión editorial, comercialización y 14 prompts especializados.
- `docs/OPINIONES.md` y `docs/PROMPT_OPINIONES.md`: uso, activación y prompts de la mejora de opiniones.
- `feedback-service/`: receptor privado de opiniones, almacenamiento SQLite, correo y exportación para administración. No se publica dentro de `site/`.
- `vendor/`: lector Excel local con licencia y versión fijada.

## Construir y revisar

Para el desarrollo se requiere Node.js 24. Quien utiliza el visualizador no lo necesita. Desde la carpeta del repositorio, sin ejecutar `npm install`:

```sh
npm run build
npm test
npm start
```

También puedes ejecutar directamente `node tools/build.mjs`, `node tools/run-tests.mjs` y `node tools/serve.mjs`. Ambos recorridos evitan comodines de shell y funcionan con las mismas instrucciones en Windows, macOS y Linux.

La previsualización escucha solo en `http://127.0.0.1:8890/`; abre esa dirección después de construir. Para regenerar los Excel, `tools/generar_datos.mjs` utiliza la herramienta de hojas de cálculo del entorno de autoría; la aplicación descargada no depende de ella. El generador puede requerir `node --max-old-space-size=12288 tools/generar_datos.mjs` por el recálculo de las relaciones y fórmulas.

`site/downloads/manifest.json` y `SHA256SUMS.txt` identifican versiones y hashes. `tools/build.mjs` incluye el lector, CSS y JavaScript en el HTML y genera ZIP reproducibles sin dependencias de red. Para cambiar el ámbito de cuentas en una edición propia, editar `data/profiles.json`, revisar las correspondencias y reconstruir. Ese cambio no constituye un control de seguridad criptográfico.

## Privacidad y alcance comercial

El visualizador no guarda los Excel en almacenamiento persistente del navegador ni incorpora analítica o fuentes remotas. Al visitar la web, el navegador solicita páginas y recursos al alojamiento, que puede tratar metadatos de la conexión. Eso no equivale a subir el contenido de los Excel: los archivos seleccionados se leen y procesan en el navegador, mediante un trabajador aislado que termina al cerrar sesión.

Existe cierre por 15 minutos de inactividad. Las referencias de sesión y los elementos de pantalla se retiran. El ejemplo integrado sigue formando parte del archivo público de la demostración. La política de contenido permite la conexión al formulario Formspree para el resumen explícito de cierre. Se puede cambiar el receptor al construir mediante `PBIS_BATCH_ENDPOINT`; no se envían los Excel.

Las opiniones guardadas en un Excel, recibidas en el servidor o notificadas por correo permanecen en esas ubicaciones tras cerrar sesión, incluidas sus claves de aula y estudiante. El servicio no guarda IP ni cabeceras del navegador en su tabla; la infraestructura de alojamiento y correo puede procesar metadatos técnicos. La seudonimización no garantiza anonimato ni borrado forense de memoria, archivos o copias realizadas por el sistema o quien utiliza el equipo.

Esta es una edición funcional de evaluación, con presentación profesional y materiales para demostraciones. Las claves `1234` y los filtros de interfaz no protegen frente a alguien que tenga los archivos o inspeccione/modifique el código. No incluye cifrado, aprovisionamiento de credenciales, un servicio de soporte ni certificación. Antes de venderla para tratar datos reales, completar `docs/COMERCIALIZACION.md`, la validación de las medidas y las pruebas en los sistemas destino.

Consulta `COMPROBACIONES.md` para separar lo implementado de lo probado. Se han publicado el código, el sitio y los ejemplos sintéticos en GitHub; no se han publicado archivos reales de centros de enseñanza.


## Consulta por códigos y archivo .pbis

Solo los indicadores son obligatorios. Sin llave ID–nombre las fichas muestran Estudiante y su código, nunca nombres tomados del archivo de indicadores. La llave Excel es opcional y debe corresponder exactamente a los ID de los indicadores; no se ignoran errores de una llave cargada. El botón Retirar llave permite volver a consultar por códigos y elimina los nombres de la vista.

Los indicadores se entregan como datos_evaluacion.pbis: conserva exactamente los bytes del Excel original y solo cambia su extensión. La aplicación lo lee directamente en memoria. No se cifra, ofusca ni modifica el archivo original. Para preparar uno, cambia .xlsx por .pbis; los nombres siguen en la llave separada. También se admiten los indicadores .xlsx y .xls por compatibilidad.
