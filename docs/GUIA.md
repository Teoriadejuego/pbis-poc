# RADARS · Guía de la demostración y la edición local

Versión 0.9.1 · Edición de evaluación

RADARS reúne fichas del grupo y fichas individuales para centros de enseñanza. Puedes probarlo directamente en el navegador con un ejemplo integrado, o descargar la edición local y elegir por separado los Excel de indicadores y llave ID–nombre. Los materiales de evaluación contienen datos inventados.

## Probar en el navegador

1. En la portada, pulsa **Probar en el navegador** para abrir la demostración `DEMO.html`.
2. Pulsa **Probar con orientación**. Se abre automáticamente el ejemplo completo, con 54 grupos y 1.512 registros de estudiantes.
3. Elige centro, curso y grupo. Consulta primero la **Ficha del grupo** y después la **Ficha individual**.
4. Si quieres probar el recorrido de tutoría, cierra la sesión y entra con una de las cuentas de evaluación de la tabla de esta guía. Se carga el ejemplo correspondiente a su ámbito.
5. Puedes valorar una ficha y guardar la opinión en un Excel separado. El correo está desactivado en esta entrega; guardar el archivo no envía la opinión.

No necesitas preparar archivos ni descargar un ZIP para esta prueba. La demostración es pública: sus nombres e indicadores están inventados y se incluyen en el código que recibe el navegador. Las cuentas organizan la vista, pero no restringen el acceso al contenido del ejemplo. No añadas datos reales al archivo publicado.

La web necesita conexión para cargar la aplicación y sus recursos. Una vez abierta, las fichas se preparan en el navegador. El alojamiento puede registrar metadatos técnicos de la visita. Si eliges Excel propios, su contenido se procesa en el navegador y no se sube al servidor; revisa el documento de privacidad antes de utilizar otros datos.

Las instrucciones siguientes explican la edición descargable `RADARS.html`, que conserva la carga manual de los dos Excel.

## 1. Preparar la edición local

1. Descarga el ZIP correspondiente a Windows, macOS o Linux. También puedes usar el ZIP universal.
2. Extrae la carpeta completa. No abras el archivo desde el interior del ZIP.
3. Abre `RADARS.html` con un navegador actualizado. No necesitas instalar R, Docker ni dependencias.

Los cuatro ZIP contienen el mismo visualizador HTML y JavaScript; las instrucciones se adaptan a cada sistema. La aplicación no depende del procesador del equipo. La compatibilidad prevista no sustituye la prueba en cada sistema y navegador: consulta las comprobaciones incluidas en la entrega.

Si el sistema pregunta con qué programa abrir el archivo, elige Edge, Chrome, Chromium, Firefox u otro navegador compatible. La extensión `.html` debe mantenerse. El archivo no es un instalador ni una aplicación nativa.

## 2. Preparar los archivos

Descarga por separado:

- **Indicadores:** `datos_evaluacion.xlsx`.
- **Llave de nombres:** `llave_evaluacion.xlsx`.
- **Perfiles y claves:** `perfiles_evaluacion.xlsx`, una referencia de acceso que no se carga en el visualizador.

El paquete del visualizador no contiene los Excel. Para un uso organizado, guarda indicadores y llave en ubicaciones distintas y aplica el protocolo de custodia del centro. La separación de carpetas, por sí sola, no cifra los archivos.

La muestra cubre Sevilla y Córdoba, los grupos A, B y C y nueve cursos:

| Etapa | Cursos |
|---|---|
| Educación Primaria | 4.º, 5.º y 6.º |
| Educación Secundaria Obligatoria | 1.º, 2.º, 3.º y 4.º |
| Bachillerato | 1.º y 2.º |

Son 54 aulas y 1.512 registros de evaluación: 28 estudiantes por aula. Los nombres y los indicadores están inventados; su coherencia sirve para comprobar el comportamiento del producto, no para establecer normas de interpretación escolar.

## 3. Acceder

Consulta la hoja de perfiles para localizar tu cuenta y su alcance. Todas las cuentas de evaluación emplean la clave `1234`.

| Cuenta de ejemplo | Clave | Uso |
|---|---|---|
| `orientador` | `1234` | Explorar el conjunto de centros y grupos de evaluación |
| `tutor7a` | `1234` | Alias conservado del piloto para Sevilla, 1.º ESO A |
| `tutor7b` | `1234` | Alias conservado del piloto para Sevilla, 1.º ESO B |

La hoja de perfiles es la referencia para las demás cuentas. El nombre de cada perfil describe el centro, el curso y el grupo al que corresponde.

**Los perfiles de esta edición organizan lo que se muestra. No constituyen una barrera de seguridad contra alguien que disponga de los Excel, del código o de las herramientas del navegador.** La clave común de evaluación no debe emplearse con datos reales.

## 4. Abrir las fichas

1. Carga el archivo de indicadores en su control correspondiente.
2. Carga la llave ID–nombre en el segundo control.
3. Selecciona las hojas **Datos** y **Llave**, respectivamente, y pulsa **Abrir fichas**.
4. Revisa los mensajes de validación. Si existe un problema, corrige el archivo de origen y vuelve a seleccionarlo.
5. Elige centro, curso y grupo entre las opciones de tu perfil.
6. Consulta la **Ficha del grupo**.
7. Cambia a **Ficha individual** y selecciona un estudiante por su nombre. El ID permite distinguir nombres repetidos.

Los datos no se editan desde las fichas. Una corrección se hace en el Excel y se vuelve a cargar. Conserva los ID como texto y no cambies el ID de un archivo sin aplicar el mismo cambio en el otro.

El visualizador admite archivos `.xlsx` y `.xls`, con un máximo de 20 MB por archivo. Selecciona la hoja adecuada cuando un libro tenga varias. El botón **Abrir fichas** se activa cuando los dos archivos están preparados; no hace falta cargar la hoja de perfiles.

## 5. Leer los resultados

La ficha del grupo muestra señales de atención, integración y mediación. La ficha individual reúne amistad, rechazo, bienestar, centralidad y reconocimiento en mediación.

- Lee la puntuación junto al recuento, el denominador y el nombre de la medida.
- No interpretes automáticamente una escala 0–10 como percentil, comparación normativa o riesgo clínico.
- Distingue las fuentes y las unidades: las nominaciones negativas recibidas y el porcentaje de respuestas personales que indican acoso escolar son medidas diferentes.
- No sumes los casos señalados por estudiantes del grupo y los recogidos en las respuestas personales: pueden referirse a las mismas personas.
- Una ausencia de dato no equivale a cero.
- Los indicadores requieren conversación, contexto y criterio profesional; no identifican diagnósticos ni responsabilidades por sí mismos.

Consulta la metodología y el diccionario de variables para conocer las fórmulas utilizadas y sus límites.

## 6. Opinar sobre las fichas

Usa el pequeño botón de opinión junto a la ficha para valorar su utilidad de 1 a 5 y dejar un comentario opcional. La opinión indica si mirabas una ficha de grupo o individual e incluye la **clave del aula** y, para una ficha individual, la **clave del estudiante**. Revisa las claves que muestra el diálogo antes de guardar o enviar. Se añaden tu rol y un código aleatorio de sesión, sin tu nombre de usuario. No escribas nombres ni detalles personales en el comentario.

Las opiniones están seudonimizadas: permiten a quien dispone de los archivos y la llave relacionar el comentario con la ficha. El ID del estudiante se conserva como texto, incluidos ceros iniciales. La clave del aula usa `ID_aula` de `Grupos`, si está disponible, o se deriva de centro, curso y grupo. No se incluyen sus etiquetas en la opinión ni se modifica el Excel de indicadores.

Si el servicio está activado, puedes enviar la opinión desde ese formulario. Se transmite el comentario, la valoración y sus metadatos, incluidas las claves del aula y del estudiante; los archivos de Excel y las medidas de las fichas permanecen en tu equipo. Se necesita conexión para enviarla. El programa muestra si la ha registrado el receptor, sin prometer su llegada al buzón de correo.

También puedes guardar un Excel independiente con la hoja **Opiniones**, sin modificar indicadores ni llave. Este es el modo disponible cuando el servicio no está configurado. Las opiniones guardadas en ese archivo no se envían automáticamente. Consulta `OPINIONES.md` para conocer la activación y qué información se conserva.

## 7. Finalizar

Usa **Cerrar sesión** cuando termines. El visualizador retira los datos de su estado activo y vuelve a la pantalla de acceso. Cerrar la pestaña o la ventana termina la ejecución de esa instancia.

La sesión también se cierra tras 15 minutos sin interacción. Si el equipo entra en suspensión, puede finalizar al recuperar la actividad. En la edición local, vuelve a identificarte y a elegir ambos archivos para continuar. En la demostración, el ejemplo inventado se carga de nuevo al entrar; cerrar la sesión no lo elimina del archivo público.

Si quieres conservar opiniones que aún no has enviado, guarda su Excel antes de cerrar. Las opiniones solo presentes en la sesión se descartan. Las que ya has exportado o enviado permanecen en el archivo, el servicio receptor o el correo correspondiente; cerrar la sesión no las elimina de esas ubicaciones.

Los Excel originales permanecen en sus ubicaciones. La aplicación no elimina copias, capturas, archivos de descarga ni rastros que pueda conservar el sistema operativo. No se promete un borrado forense. Una pestaña distinta constituye otra instancia y debe cerrarse también.

## Problemas habituales

| Lo que ocurre | Qué hacer |
|---|---|
| El archivo muestra código o texto | Ábrelo con un navegador y conserva la extensión `.html`. |
| La aplicación no abre desde el ZIP | Extrae la carpeta completa y abre el archivo extraído. |
| No aparecen ciertos centros o grupos | Revisa el alcance de tu cuenta en la hoja de perfiles. |
| Faltan nombres | Comprueba que cada ID de indicadores tenga una correspondencia única en la llave. |
| Aparecen ID duplicados | Corrige el archivo de origen; cada persona debe tener un único ID en cada tabla. |
| Una celda muestra «Sin datos» | Revisa si falta la medida en el archivo y su significado en el diccionario. |
| El navegador o el centro bloquea el archivo | Solicita la revisión del equipo de informática. No desactives las protecciones del equipo. |
| No se puede enviar una opinión | Revisa si el servicio está activado y tienes conexión; puedes guardar el Excel de opiniones por separado. |

## Límites de la entrega

Esta edición permite evaluar el flujo, la presentación y el alcance de los perfiles. La carpeta preparada para GitHub Pages permite publicar la prueba de concepto con el ejemplo inventado siguiendo sus instrucciones; preparar esa carpeta no publica la web automáticamente. Antes de usar RADARS con datos reales, deben resolverse los controles de acceso, la provisión de credenciales, la custodia de los archivos y las validaciones indicadas en el documento de comercialización. No incluye soporte contratado ni certificación de cumplimiento.
