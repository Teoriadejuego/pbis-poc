# Publicar el piloto de RADARS en GitHub Pages

La carpeta `RADARS_GitHub` contiene el proyecto preparado para publicarse. Una vez activado, se comparte un enlace y cada persona abre el programa en su navegador. Quien visita la web no necesita instalar R, Docker, Node.js ni dependencias.

El sitio incluye datos sintéticos y accesos de evaluación. La publicación por sí sola no constituye una plataforma con autenticación segura para datos reales. No subas al repositorio archivos de centros de enseñanza, llaves reales, contraseñas privadas ni opiniones recibidas.

## 1. Crear el repositorio y subir el contenido

1. En GitHub, crea un repositorio para el piloto, por ejemplo `radars-piloto`, con la rama principal `main`. Para una primera prueba con GitHub Free puede ser público; Pages en repositorios privados depende del plan contratado. Consulta la [disponibilidad oficial de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages).
2. Sube **el contenido de `RADARS_GitHub` a la raíz del repositorio**, manteniendo las carpetas. No subas un ZIP ni una carpeta adicional que contenga todo el proyecto.
3. Comprueba que se ven `package.json`, `src`, `tools`, `site-src`, `data`, `vendor`, `tests`, `docs`, `feedback-service` y `outputs/entrega-20260929` en la raíz. Conserva también `.gitignore`, `.gitattributes` y `.github/workflows/pages.yml`; algunos exploradores ocultan los nombres que empiezan por punto.
4. Si subes los archivos mediante la web y falta el flujo de publicación, usa **Add file → Create new file** y escribe `.github/workflows/pages.yml` como nombre. Copia en él el contenido del archivo incluido. Para cargas posteriores resulta cómodo utilizar GitHub Desktop o Git.

Las carpetas generadas `site` y `release` no necesitan subirse: GitHub Actions las reconstruye. Las dependencias del navegador ya están incluidas en `vendor`; no hay que ejecutar `npm install`.

## 2. Activar Pages

1. Abre **Settings → Pages** en el repositorio.
2. En **Build and deployment → Source**, selecciona **GitHub Actions**. Este es el [procedimiento oficial para usar un flujo propio](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
3. Abre **Actions → Publicar RADARS en GitHub Pages → Run workflow** y selecciona `main`. Si la primera ejecución falló antes de activar Pages, vuelve a ejecutarla.
4. Espera a que terminen **Construir y comprobar** y **Publicar**. El enlace definitivo aparece en el despliegue y en **Settings → Pages**. Será similar a `https://TU-CUENTA.github.io/radars-piloto/`; sustituye la cuenta y el nombre por los de tu repositorio.

No hacen falta claves de correo ni secretos propios para publicar Pages. El flujo usa los permisos de GitHub Actions, ejecuta las pruebas y publica únicamente la carpeta `site`. Los cambios posteriores en `main` vuelven a construir y publicar la web automáticamente.

## 3. Compartir la prueba

Envía el enlace publicado. La web permite abrir el visor y acceder al material de evaluación. La cuenta `orientador` con contraseña `1234` permite revisar todos los grupos; las cuentas de tutoría aparecen en el Excel de perfiles. Son accesos del piloto, visibles en el código, no contraseñas de producción.

La lectura de los archivos seleccionados se realiza en el navegador. GitHub entrega el programa al visitar la web y puede registrar las peticiones propias del alojamiento; esto no significa que el visor le envíe los Excel seleccionados. El piloto se debe probar con el material sintético incluido.

## Opiniones y correo

El flujo deja `FEEDBACK_ENDPOINT` vacío. Se puede valorar una ficha y guardar las opiniones en un Excel separado; **no se envía correo automáticamente** con esta configuración.

GitHub Pages publica contenido estático y no ejecuta el servicio Node.js de recepción. Para activar el correo, hay que alojar ese servicio por separado siguiendo `docs/OPINIONES.md`. Después se configura su dirección HTTPS en `FEEDBACK_ENDPOINT` dentro del paso de construcción del flujo y se vuelve a publicar. Esa dirección es pública; las claves de envío permanecen exclusivamente en el servidor receptor. El código del servicio puede estar en el repositorio, pero no se incluye como aplicación ejecutable en el sitio publicado. Consulta las [características de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages).

## Comprobar cambios antes de publicar

Solo quien mantiene el proyecto necesita Node.js 24. Desde la carpeta del proyecto:

```text
npm run build
npm test
npm start
```

Abre `http://127.0.0.1:8890/`. Para detener esta vista previa, pulsa `Ctrl+C` en la terminal. También se pueden ejecutar `node tools/build.mjs`, `node tools/run-tests.mjs` y `node tools/serve.mjs` directamente.

El flujo utiliza las acciones oficiales [checkout](https://github.com/actions/checkout), [setup-node](https://github.com/actions/setup-node), [configure-pages](https://github.com/actions/configure-pages), [upload-pages-artifact](https://github.com/actions/upload-pages-artifact) y [deploy-pages](https://github.com/actions/deploy-pages). La ejecución en GitHub y el enlace público solo quedan confirmados después del primer despliegue correcto en tu repositorio.
