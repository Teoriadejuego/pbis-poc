# PDF · PBIS 0.12.0

La versión 0.12.0 incluye descargas PDF en la web y en la edición local, según los permisos de la cuenta.

## Cómo probar

1. Extrae el ZIP y abre `PBIS.html` con un navegador actual. No necesitas instalar
   R, Python, Node ni programas adicionales.
2. Entra con tu cuenta y abre un proyecto, o utiliza la demo incorporada.
3. Selecciona una ficha de centro, aula o estudiante y pulsa **Descargar PDF**.
4. El diálogo muestra el alcance y la identificación. Incluye los indicadores
   ampliados aunque «Ver más» esté cerrado. En aula y estudiante puedes incluir
   la red actual y una lista de relaciones para leer los vínculos con claridad.
5. En cuentas docentes con DNI, la contraseña de apertura será ese DNI. Si tu
   cuenta no tiene DNI (por ejemplo, orientación), introduce el de quien exporta.
6. Pulsa **Descargar PDF**. Para abrir el archivo, escribe ese DNI completo,
   con letra mayúscula, sin espacios ni guiones. En la demo se utiliza únicamente
   el DNI ficticio **12345678Z**.

## Permiso por cuenta

En **Administrar el proyecto**, orientación puede marcar **Permitir descargar
PDF** al añadir o editar cada cuenta. Las nuevas cuentas docentes parten sin
permiso; orientación tiene un control propio, activado inicialmente. El resumen
de cuentas muestra el permiso antes de generar el archivo.

Para cambiar un permiso existente, edita la cuenta y genera una nueva versión
del `.pbis`. No es necesario cambiar su contraseña. Los archivos anteriores a
este control conservan el comportamiento previo; hay que regenerarlos para
asignar estos permisos. Las copias antiguas y los visualizadores antiguos no
incorporan cambios de permisos posteriores.

El permiso controla el botón de descarga de PBIS. No impide capturas, impresión
manual del navegador o el uso de una aplicación modificada. Orientación mantiene
la administración aunque desactive su propio permiso PDF.

## Contraseña para abrir el PDF

Todas las descargas desde esta edición se cifran localmente con AES-256 (R6),
incluidas las redes y los anexos. No se ofrece una copia sin contraseña. Si falla
la protección, se informa del error y no se descarga el documento sin cifrar.

El DNI se utiliza solo en memoria para proteger el PDF. No se incorpora a su
texto, metadatos ni nombre de archivo, ni se añade al registro de accesos o a las
valoraciones. La marca docente continúa mostrando el DNI parcial. Orientación
conserva «Equipo orientador», sin marca repetida.

El DNI no es un secreto robusto: quien lo conozca podrá abrir el archivo. En una
cuenta compartida, la aplicación no verifica la identidad de quien introduce ese
DNI. Para protección más exigente conviene una contraseña aleatoria independiente.
Conocer la contraseña permite obtener una copia descifrada; esta función no
impide fotografiar o volver a compartir un documento ya abierto.

Los PDF descargados antes de esta mejora no cambian: vuelve a exportarlos.

Los datos se procesan localmente; la exportación no necesita conexión ni envía
archivos. Los otros servicios opcionales de la aplicación conservan su comportamiento.
La tabla de valoraciones no se exporta: el informe contiene los datos de la ficha.

Si los permisos ocultan relaciones con otras aulas, una nota junto a la red
individual aclara que los totales sí las incluyen. El PDF conserva esa misma
nota en el resumen de relaciones y, si se incluye, en la página de la red.
No se añaden nombres ni vínculos de aulas no autorizadas.

## Marcas e identificación

- Docente en proyecto protegido: DNI parcial y código de sesión, en la cabecera
  y como marca repetida en todas las páginas, incluidas redes y anexos.
- Docente con carga tradicional: cuenta y sesión. Si la cuenta es un DNI se ocultan
  las mismas posiciones. Los filtros tradicionales siguen siendo visuales; el PDF
  no convierte ese recorrido en un sistema de permisos criptográficos.
- Orientación: «Equipo orientador» en cada página, sin marca repetida, según la
  excepción acordada para este perfil.
- Demo: marca «DATOS SIMULADOS» en todas las páginas.

No hay un botón para desactivar la marca docente. Se dibuja en el contenido del
PDF y no depende de activar fondos de impresión. No se incluye el DNI completo,
contraseñas, tokens ni el Excel de origen. En proyectos protegidos se reutilizan
los compartimentos ya autorizados, sin recalcular indicadores sobre un subconjunto.

El PDF descargado **permanece en el equipo tras cerrar sesión**. La marca sirve
para disuadir la difusión e identificar la cuenta de origen. No impide copiar,
editar o fotografiar el documento, ni acredita por sí sola la identidad de quien
lo haya difundido. Custodia los PDF como los datos de los que proceden.

## Implementación

- `src/pdf-export.js`: modelo de informe, composición A4, red, marcas y descarga.
- `src/app.js`, `src/app.css`: botón y diálogo accesible.
- `vendor/jspdf.umd.min.js`: jsPDF 4.2.1 incorporado, licencia MIT.
- `src/pdf-crypto.js`, `src/pdf-crypto-worker.js`: protección en un worker temporal,
  DNI validado y cancelación al salir o cambiar de consulta.
- `vendor/qpdf.js`, `vendor/qpdf.wasm`: qpdf 12.2.0 mediante
  `@neslinesli93/qpdf-wasm` 0.3.0; integridad y origen en `qpdf-provenance.json`.
  Los avisos de licencia se distribuyen en `LICENSE-qpdf.txt`.
- `tools/build.mjs`: incorpora el módulo y la biblioteca a la aplicación autónoma.
- `tests/pdf-export.test.cjs`, `tests/pdf-permissions.test.cjs`,
  `tests/pdf-crypto.test.cjs`, `tests/e2e/pdf.mjs`, `tests/e2e/pdf-permissions.mjs`
  y `tests/e2e/pdf-password.mjs`: validaciones reproducibles.

Los indicadores se leen de los registros ya preparados y de `PbisCore.aggregate`
y `aggregateCenter`. No se modifican el motor de cálculo, las fórmulas, la
normalización, las cuentas ni los recorridos de demo. La imagen de la red conserva
el diseño visible; el anexo textual permite leer las relaciones de una red densa.
El PDF usa texto seleccionable y tipografía estándar para castellano; no se presenta
como un PDF etiquetado ni como una certificación PDF/UA.

Consulta `VALIDACION_PDF.md` en el proyecto para los resultados de las pruebas.

Referencia técnica: [cifrado PDF de qpdf](https://qpdf.readthedocs.io/en/stable/encryption.html).
