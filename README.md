# PBIS · Edición de evaluación 0.12.0

Esta versión incorpora una portada completa con acceso por cuenta destacado, administración simplificada y descargas PDF con permisos por cuenta, marca de agua docente y cifrado AES-256 con DNI. Conserva el acceso unificado, los compartimentos cifrados por aulas, la demo y el registro opcional de accesos en Google Sheets. Se publica el código y la demo sintética; los datos reales, proyectos de centros y credenciales generadas se conservan fuera del repositorio y las descargas.

Abre PBIS.html y consulta docs/PROYECTOS_PROTEGIDOS.md. El receptor opcional y sus instrucciones están en audit-service. Su configuración corresponde a dirección general: las herramientas se generan en direccion-local y no se distribuyen en la web ni en los ZIP de los centros. Actualizar la web no actualiza una implementación existente de Apps Script. El generador tools/protected-example.mjs prepara un proyecto sintético de prueba exclusivamente en revision-local/, excluido de Git y de la web.

Pruebas nuevas: node --test tests/protected-project.test.cjs tests/access-audit.test.cjs tests/audit-service.test.cjs y node tests/e2e/protected.mjs. Después de construir, node tools/protected-example.mjs prepara el ejemplo cifrado. Los prompts de desarrollo y revisión están en docs/PROMPTS_ADMINISTRACION_PROYECTOS.md.

Visualizador de convivencia para centros educativos, en HTML y JavaScript. Lee archivos localmente, calcula indicadores Wave 1 y ofrece fichas de centro, aula, lista de aula y estudiante.

[Abrir PBIS](https://teoriadejuego.github.io/pbis-poc/) · [Práctica guiada](https://teoriadejuego.github.io/pbis-poc/DEMO.html#guia)

## Qué incluye

- Demo con acceso guiado, con 1.512 estudiantes simulados y práctica guiada. Sus valoraciones nunca se envían.
- Importación .pbis/Excel con hoja Users (cuestionario) o Datos (indicadores). Nombres opcionales; apellidos abreviados. No requiere llave de nombres.
- Nueve cuentas `tutoria…`, una por curso desde 4.º de Primaria a 2.º de Bachillerato, con acceso a sus aulas en todos los centros cargados. Dos cuentas específicas para 3.º ESO PDC I y 4.º ESO PDC II. `orientacion` ve todas las fichas y distribuye las contraseñas. El Excel de accesos se entrega en local.
- Resúmenes breves y detalle desplegable, red de estudiante y red de aula con vista circular y por comunidades, buena y mala mediación, test de impulsividad (CRT) 0–3 con media del aula y cobertura de red incompleta.
- Lista ordenable con reacciones y confianza. En consultas con cuenta, revisión y confirmación antes de enviar a Formspree; permite enviar sin cerrar y conservar la consulta ante errores. El logotipo solicita resolver las valoraciones pendientes antes de volver al inicio. Tras 15 minutos sin actividad se intenta enviar lo añadido: un fallo o un borrador incompleto impiden el cierre automático.
- Descargas Windows, macOS, Linux y universal con el mismo motor HTML y demo incorporada. No necesitan R ni Docker.

## Desarrollar y verificar

Requiere Node.js 24. La aplicación distribuida no necesita instalación. Para desarrollar, instala las herramientas de pruebas con el archivo de versiones bloqueadas:

```sh
npm ci --ignore-scripts
npx playwright install chromium
npm run check
npm start
```

La compilación produce site/ (GitHub Pages) y release/ (HTML local). Los cuatro ZIP y sus SHA-256 se generan en site/downloads/; no se publican Excel ni llaves de cruce sueltos. La demo simulada sigue incorporada. GitHub Actions compila, prueba y comprueba la lista de archivos permitidos antes de publicar. site/ y release/ están excluidos de Git.

`npm run check` construye y ejecuta las validaciones, pruebas Node, pruebas Python y recorridos de navegador. Requiere Python 3; puedes indicar su ejecutable mediante la variable `PYTHON`. En Windows las pruebas detectan Edge; para otro navegador Chromium instalado, usa `PBIS_BROWSER_PATH`. No se envían correos durante las pruebas.

También están disponibles `npm run build`, `npm test`, `npm run test:e2e`, `npm run validate:data` y `npm run verify:release`. La construcción sola sigue sin necesitar paquetes externos: las dependencias añadidas son de desarrollo.

Para generar una copia completa: `python tools/empaquetar_entrega.py --salida /ruta/PBIS.zip`. El empaquetador comprueba las descargas, omite datos privados y no sustituye una copia existente.

Para entregar solo la aplicación: `python tools/empaquetar_entrega.py --tipo aplicacion --salida /ruta/PBIS_Local.zip`. Incluye un único visualizador `PBIS.html`, la portada completa de presentación, instrucciones, licencia y huellas de integridad. No incluye los Excel de desarrollo, el código del servicio opcional ni otras copias de la aplicación. La construcción HTML se hace con `tools/build.mjs`; Python empaqueta sus resultados sin reescribir ni minificar JavaScript.

El lector Excel ya se ejecuta en un worker creado desde un Blob, con el código incorporado en el HTML. La consulta y la demo funcionan con `file://`; el envío configurado de valoraciones a Formspree necesita Internet. `feedback-service/` no se inicia ni se publica en GitHub Pages y se conserva únicamente como fuente opcional en la copia completa del proyecto.

## Distribución estática unificada

Para preparar una carpeta nueva con un único núcleo `app.html`, portal, guía y descarga universal:

```sh
node tools/build.mjs
python tools/distribuir_estatico.py --salida /ruta/nueva/PBIS_Estatico --zip /ruta/PBIS_Estatico.zip
```

El generador usa una lista cerrada de archivos, comprueba los enlaces y rechaza destinos existentes. No elimina ni mueve fuentes, originales, informes o respaldos. No cambia el sitio de GitHub Pages ni su workflow de publicación. La nueva carpeta puede revisarse y servirse con cualquier alojamiento estático; los enlaces antiguos PBIS.html y DEMO.html redirigen a app.html conservando parámetros y fragmentos. Sus descargas se unifican en downloads/PBIS.zip.

La demo completa se incorpora en app.html para que el mismo archivo funcione online y desde file://; demo-account.json solo define las credenciales de simulación y no sustituye a los datos de demostración. La guía única se entrega como Markdown y como HTML para poder leerla directamente en el navegador. Las licencias y hashes se conservan. No se incluyen herramientas de construcción ni código de servidor en esa carpeta; el proyecto fuente mantiene ambos y las pruebas para poder reconstruir la entrega.

## Documentación

El [índice documental](docs/README.md) distingue instrucciones actuales, referencias técnicas e históricos. [EMPIEZA_AQUI.md](EMPIEZA_AQUI.md) es una guía breve para quien abre la aplicación descargada, no una segunda guía de desarrollo.

- [Guía](docs/GUIA.md)
- [Metodología](docs/METODOLOGIA.md)
- [Privacidad y alcance](docs/PRIVACIDAD.md)
- [Valoraciones](docs/OPINIONES.md)
- [Auditoría actual y siguiente fase](docs/AUDITORIA_PBIS_RADARS_20261016.md)
- [Auditoría del piloto del 8 de octubre](docs/AUDITORIA_PILOTO_20261008.md)
- [Prompts de implementación y validación](docs/PROMPTS_MEJORA_PILOTO.md)
- [Comprobaciones](COMPROBACIONES.md)

## Alcance del piloto

Preparado para demostraciones y pruebas de uso con datos simulados. Las cuentas de seis caracteres organizan la interfaz, pero se distribuyen con el código público y no protegen datos reales. Un .pbis es Excel renombrado, sin cifrado. Para producción se requieren autenticación y autorización reales, cuentas por persona, protección de archivos y validación metodológica independiente. macOS y Linux necesitan pruebas en esos equipos; no se presentan como plataformas certificadas.

Solo los ejemplos sintéticos se incluyen en la entrega. Los archivos seleccionados por una persona no forman parte de la compilación ni del repositorio.

## Feedback vinculable a las respuestas

El envío v2 identifica centro, curso, aula, código de estudiante y cuenta docente, y conserva el valor observado de cada indicador valorado. Incluye una referencia al archivo y separa reacciones, confianza, no participación y utilidad de interfaz. Documentación: docs/FEEDBACK_DATOS.md. Importación local a CSV y SQLite: tools/importar_feedback.py. La demo nunca envía feedback.
