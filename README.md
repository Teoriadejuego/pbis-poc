# PBIS · Piloto 0.10.9

Visualizador de convivencia para centros educativos, en HTML y JavaScript. Lee archivos localmente, calcula indicadores Wave 1 y ofrece fichas de centro, clase, lista e individuales.

[Abrir PBIS](https://teoriadejuego.github.io/pbis-poc/) · [Práctica guiada](https://teoriadejuego.github.io/pbis-poc/DEMO.html#guia)

## Qué incluye

- Demo con acceso guiado, con 1.512 estudiantes simulados y práctica guiada. Sus valoraciones nunca se envían.
- Importación .pbis/Excel con hoja Users (cuestionario) o Datos (indicadores). Nombres opcionales; apellidos abreviados. No requiere llave de nombres.
- Nueve cuentas `tutoria…`, una por curso desde 4.º de Primaria a 2.º de Bachillerato, con acceso a sus grupos en todos los centros cargados. Dos cuentas específicas para 3.º ESO PDC I y 4.º ESO PDC II. `orientacion` ve todas las fichas y distribuye las claves. El Excel de accesos se entrega en local.
- Resúmenes breves y detalle desplegable, red individual, mediación positiva/negativa, CRT 0–3 con media de clase y cobertura de red incompleta.
- Lista ordenable con reacciones y confianza. En consultas con cuenta, cierre con envío a Formspree; reintento o guardado si falla. El logotipo cierra y vuelve al inicio.
- Descargas Windows, macOS, Linux y universal con el mismo motor HTML y demo incorporada. No necesitan R ni Docker.

## Desarrollar y verificar

Requiere Node.js 24. El lector Excel está incluido; no hace falta instalar dependencias para construir o ejecutar las pruebas.

```sh
node tools/build.mjs
node tools/run-tests.mjs
node tools/serve.mjs
```

La compilación produce site/ (GitHub Pages) y release/ (HTML local). Los ZIP, los archivos sintéticos y sus SHA-256 se generan en site/downloads/. GitHub Actions compila y prueba antes de publicar.

## Documentación

- [Guía](docs/GUIA.md)
- [Metodología](docs/METODOLOGIA.md)
- [Privacidad y alcance](docs/PRIVACIDAD.md)
- [Valoraciones](docs/OPINIONES.md)
- [Auditoría y mejoras priorizadas](docs/AUDITORIA_PILOTO_20261008.md)
- [Prompts de implementación y validación](docs/PROMPTS_MEJORA_PILOTO.md)
- [Comprobaciones](COMPROBACIONES.md)

## Alcance del piloto

Preparado para demostraciones y pruebas de uso con datos simulados. Las cuentas de seis caracteres organizan la interfaz, pero se distribuyen con el código público y no protegen datos reales. Un .pbis es Excel renombrado, sin cifrado. Para producción se requieren autenticación y autorización reales, cuentas por persona, protección de archivos y validación metodológica independiente. macOS y Linux necesitan pruebas en esos equipos; no se presentan como plataformas certificadas.

Solo los ejemplos sintéticos se incluyen en la entrega. Los archivos seleccionados por una persona no forman parte de la compilación ni del repositorio.
