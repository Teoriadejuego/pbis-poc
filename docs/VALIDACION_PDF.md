# Validación de la copia PDF · 22 de octubre de 2026

## Resultado

Copia local basada en PBIS 0.11.1 (`708b954`). Sin commit, push ni despliegue.
El repositorio original permanece limpio. Los datos de prueba son sintéticos.

| Antes | Ahora | Comprobación realizada |
| --- | --- | --- |
| Las fichas se consultaban en pantalla. | Centro, aula y estudiante ofrecen «Descargar PDF». | Nueve descargas reales en Edge: HTTP local y doble clic `file://` sin Internet. |
| La marca docente solo aparecía en la pantalla. | DNI parcial y sesión se dibujan en todas las páginas docentes. | Extracción del texto de todas las páginas, renderizado y revisión visual de redes y anexos. |
| No había informe portátil de una red. | Se incluye el diseño circular o de comunidades elegido y un anexo legible con sus relaciones. | Descarga de ambos diseños, revisión de flechas, colores, nombres y paginación. |
| Un archivo PDF no existía como salida. | Se informa de que permanece en el equipo al cerrar sesión. | Diálogo antes de descargar, con alcance e identificación. |
| No había errores de exportación que gestionar. | Un fallo se muestra y permite reintentar; cancelar o cerrar sesión impide una descarga tardía. | Fallo simulado del generador, Escape, recuperación de foco y cierre durante la preparación de la red. |

## Pruebas superadas

- Validación inicial: 200 pruebas JavaScript del proyecto, incluidas cuatro específicas de PDF.
- 12 pruebas Python de importación de valoraciones y empaquetado.
- Recorrido general de 12 perfiles y 16 pasos de la guía; anchuras 1360, 390 y 320 px.
- Recorrido de proyectos protegidos: orientación, dos docentes con aulas distintas,
  contraseña errónea, cambio de contraseña, administración y carga tradicional.
- Dos docentes exportan únicamente su compartimento. No aparece el nombre de la
  otra aula, DNI completo ni contraseña en los PDF. Orientación exporta el centro.
- La marca figura en todas las páginas de nueve informes de prueba: demo,
  orientación, dos docentes, modo desconectado y diseño de comunidades.
- En la prueba de exportación se bloquearon `localStorage`, `sessionStorage` e
  `IndexedDB`. Cero conexiones de red externas durante este recorrido.
- En las pruebas generales y de acceso, los envíos existentes se interceptaron:
  no se enviaron correos ni registros a servicios reales.
- Las cuatro descargas locales incorporan exactamente el mismo HTML, con hashes
  comprobados, licencia de jsPDF e instrucciones.

Se compararon con la base original los archivos de cálculo, permisos,
perfiles y demo: `core.js`, `raw-wave1.js`, `protected-project.js`,
`class-network.js`, `profiles.json`, `fixtures.json`,
`demo-account.json` y `demo-fixture.mjs`. No han cambiado.

## Nota de relaciones no visibles · revisión local

Antes, la ficha docente podía mostrar cinco buenas relaciones recibidas y solo
dos en la red sin explicar la diferencia. Ahora, cuando faltan relaciones por
el alcance de la cuenta, se muestra: «Los totales incluyen relaciones de otras
aulas que no tienes permiso para ver. La red solo muestra las relaciones autorizadas».
La nota aparece también en el PDF; las cifras y los permisos no cambian.

Verificación con seis estudiantes sintéticos de 1.º ESO A y B: docente limitado
a A conserva cinco menciones y solo ve sus dos relaciones autorizadas; orientación
ve las cinco, sin la nota. El clic autorizado funciona y un enlace manipulado
hacia B no abre esa ficha. La prueba tradicional con acceso a ambas aulas tampoco
muestra la nota. Cero errores JavaScript y cero conexiones externas.

El PDF docente contiene la nota en las páginas 2 y 5, marca de agua en las seis
páginas y ningún nombre de B, DNI completo ni contraseña. El PDF de orientación
no incluye la nota. Ambas páginas modificadas se renderizaron y revisaron.
Se añadieron tres pruebas unitarias y se amplió `tests/e2e/network-permissions.mjs`.
La revisión supera las 203 pruebas JavaScript y la verificación de las cuatro
descargas reconstruidas. El recorrido A/B se repitió sobre la construcción final.
Los únicos cambios en `student-network.js` son de presentación.

Se actualizó una prueba antigua que seguía esperando el botón «Cuentas y
contraseñas», retirado antes de este trabajo. No se reintrodujo ese botón.

## Reproducción

```text
node tools/build.mjs
node tools/run-tests.mjs
python -m unittest discover -s tests -p "test_*.py"
node tests/e2e/pdf.mjs
node tests/e2e/network-permissions.mjs
node tests/e2e/smoke.mjs
node tests/e2e/protected.mjs
node tools/verify-release.mjs
```

Las pruebas E2E usan Edge en Windows. Los PDF de ejemplo están en `output/pdf`;
las pruebas de cuentas y los renderizados, en `tmp/pdfs`. La aplicación no
necesita Node ni Python: solo las herramientas de desarrollo y pruebas los usan.

## Límites

### Revisión local: permiso y contraseña PDF (23/10/2026)

- 213 pruebas Node superadas, incluidos los permisos por cuenta y la validación
  de DNI. Los hashes CSP coinciden con el HTML generado. Solo se habilita la
  compilación WebAssembly, no `unsafe-eval` para JavaScript.
- `tests/e2e/pdf-permissions.mjs`: alta, edición sin cambiar contraseñas,
  orientación con y sin permiso, cuentas docentes con y sin permiso y descarga.
  Revocar el permiso en la nueva revisión no bloquea la administración.
- `tests/e2e/pdf.mjs`: nueve PDF generados con fichas, redes y comunidades;
  ejecución HTTP local y `file://` sin Internet; escritorio y 320/390 píxeles.
- `tests/e2e/pdf-password.mjs`: DNI solicitado a orientación, DNI docente
  procedente del acceso correcto, letra validada, reintento tras fallo de cifrado,
  ausencia de descarga sin cifrar, cancelación del worker y retirada del DNI al
  cerrar. La cuenta siguiente no hereda el DNI anterior.
- `tools/verify-pdf-passwords.py`: once documentos comprobados con pypdf como
  lector independiente. Contraseña vacía, incorrecta o con letra minúscula
  rechazadas; DNI correcto aceptado; AES-256, R6, V5 y AESV3 confirmados.
  Las marcas y cabeceras permanecen en todas las páginas; el DNI completo no
  aparece en texto, metadatos ni bytes en claro.
- Poppler abrió los documentos con la contraseña de prueba; se revisaron
  visualmente la primera página y la red individual. Sin cortes ni solapamientos.
- Las pruebas de navegador bloquean las peticiones externas y hacen fallar
  localStorage, sessionStorage e IndexedDB. Exportación sin peticiones externas
  ni almacenamiento persistente de contraseñas o PDF por parte de PBIS.

Para repetir la verificación independiente, ejecutar primero las dos pruebas
E2E de PDF y contraseña, y después `python tools/verify-pdf-passwords.py`.
Los archivos de ejemplo usan exclusivamente datos y DNI ficticios. No se ha
publicado esta revisión ni modificado datos reales o la conexión privada de Sheets.

### Alcance de estas comprobaciones

No se ha probado en equipos físicos macOS/Linux ni en Safari/Firefox. La marca
no es DRM. Desde la revisión local del 23/10/2026, la descarga se cifra con el
DNI completo como contraseña de apertura. El DNI puede ser conocido o adivinado;
conocerlo permite descifrar el PDF y compartirlo. El control PDF por cuenta no
impide capturas ni impresión manual del navegador. La carga tradicional sigue
sin ofrecer permisos criptográficos por aula.

La imagen de una red muy densa puede requerir ampliar el PDF; la lista textual
adjunta conserva los vínculos. No se certifica accesibilidad PDF/UA. Los
comentarios y valoraciones no forman parte de estos informes.
