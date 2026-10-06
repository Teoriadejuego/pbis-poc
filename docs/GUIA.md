# PBIS · Guía de la demostración y la edición local

Versión 0.9.1 · Edición de evaluación

PBIS permite consultar la ficha de clase, la lista de estudiantes y las fichas individuales. Prueba la demo con datos simulados o descarga la edición local para cargar tus propios indicadores y, si quieres mostrar nombres, una llave ID–nombre.

## Probar en el navegador

1. En la portada, pulsa **Explorar demo** para abrir `DEMO.html`.
2. Pulsa **Comenzar práctica guiada** o entra con una cuenta de tutoría de evaluación. La sesión se abre sin datos cargados y sin fichas.
3. Pulsa **Cargar ejemplo**. Orientación puede consultar los 54 grupos y 1.512 registros de estudiantes; tutoría solo ve los grupos de su ámbito. También puedes cargar tus indicadores y, opcionalmente, la llave y pulsar **Abrir consulta**.
4. Elige centro, curso y grupo. Consulta primero la **Ficha de clase**, después la **Lista de clase** y la **Ficha individual**.
5. Si quieres probar otro perfil, cierra la sesión, entra con una de las cuentas de la tabla de esta guía y vuelve a pulsar **Cargar ejemplo**.
6. Si valoras datos o fichas, pulsa **Enviar valoraciones y cerrar** para enviar el resumen y cerrar la sesión.

No necesitas preparar archivos ni descargar un ZIP para esta prueba. La demostración es pública: sus nombres e indicadores simulados se descargan al pulsar **Cargar ejemplo**. Las cuentas organizan la vista, pero no restringen el acceso al contenido publicado. No añadas datos reales al sitio.

### Práctica guiada para profesorado

En la demostración, pulsa **Comenzar práctica guiada** en el acceso. El recorrido facilita la cuenta de prueba, acompaña la carga del ejemplo y pide seleccionar Sevilla · 1.º ESO · A. Después muestra cómo leer la ficha de clase, ordenar la lista, contrastar los casos simulados de Samuel y Ana, marcar un dato como «Me sorprende», abrir una ficha individual y expresar confianza en los datos. Las señales no son diagnósticos. Las marcas realizadas durante la práctica se retiran al terminar y no se envían. Dentro de la guía, **Saltar al ejercicio de valoración** omite la explicación inicial y lleva al ejercicio de la lista.

La web necesita conexión para cargar la aplicación y sus recursos. Una vez abierta, las fichas se preparan en el navegador. El alojamiento puede registrar metadatos técnicos de la visita. Si eliges Excel propios, su contenido se procesa en el navegador y no se sube al servidor; revisa el documento de privacidad antes de utilizar otros datos.

Las instrucciones siguientes explican la edición descargable `PBIS.html`, que conserva la carga manual de indicadores con llave opcional.

## 1. Preparar la edición local

1. Descarga el ZIP correspondiente a Windows, macOS o Linux. También puedes usar el ZIP universal.
2. Extrae la carpeta completa. No abras el archivo desde el interior del ZIP.
3. Abre `PBIS.html` con un navegador actualizado. No necesitas instalar R, Docker ni dependencias.

Los cuatro ZIP contienen el mismo visualizador HTML y JavaScript; las instrucciones se adaptan a cada sistema. La aplicación no depende del procesador del equipo. La compatibilidad prevista no sustituye la prueba en cada sistema y navegador: consulta las comprobaciones incluidas en la entrega.

Si el sistema pregunta con qué programa abrir el archivo, elige Edge, Chrome, Chromium, Firefox u otro navegador compatible. La extensión `.html` debe mantenerse. El archivo no es un instalador ni una aplicación nativa.

## 2. Preparar los archivos

Descarga por separado:

- **Indicadores:** `datos_evaluacion.pbis` (un Excel con otra extensión; no está cifrado).
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
3. Selecciona **Datos** y, si has cargado llave, **Llave**, respectivamente, y pulsa **Abrir consulta**.
4. Revisa los mensajes de validación. Si existe un problema, corrige el archivo de origen y vuelve a seleccionarlo.
5. Elige centro, curso y grupo entre las opciones de tu perfil.
6. Consulta la **Ficha de clase** y la **Lista de clase**. Pulsa una columna para ordenar o un dato para valorarlo.
7. Selecciona un nombre en la lista para abrir la **Ficha individual**. El ID permite distinguir nombres repetidos.

Los datos no se editan desde las fichas. Una corrección se hace en el Excel y se vuelve a cargar. Conserva los ID como texto y no cambies el ID de un archivo sin aplicar el mismo cambio en el otro.

El visualizador admite archivos `.xlsx` y `.xls`, con un máximo de 20 MB por archivo. Selecciona la hoja adecuada cuando un libro tenga varias. El botón **Abrir consulta** se activa cuando el archivo de indicadores está preparado; no hace falta cargar la hoja de perfiles.

## 5. Leer los resultados

La ficha de clase muestra señales de atención, integración y mediación. La lista permite comparar datos de estudiantes sin perder el contexto del grupo. La ficha individual muestra primero los indicadores principales y ofrece más detalle al desplegarla.

- Lee la puntuación junto al recuento, el denominador y el nombre de la medida.
- No interpretes automáticamente una escala 0–10 como percentil, comparación normativa o riesgo clínico.
- Distingue las fuentes y las unidades: las nominaciones negativas recibidas y el porcentaje de respuestas personales que indican acoso escolar son medidas diferentes.
- No sumes los casos señalados por estudiantes del grupo y los recogidos en las respuestas personales: pueden referirse a las mismas personas.
- Una ausencia de dato no equivale a cero.
- Los indicadores requieren conversación, contexto y criterio profesional; no identifican diagnósticos ni responsabilidades por sí mismos.

Consulta la metodología y el diccionario de variables para conocer las fórmulas utilizadas y sus límites.

## 6. Valorar datos y fichas

En la **Lista de clase**, pulsa un encabezado para ordenar sus valores y vuelve a pulsarlo para invertir el orden. Pulsa un dato para mostrar las opciones **OK**, **Revisar** o **Me sorprende**. Solo se guarda una reacción por dato y estudiante; si vuelves a elegir la misma, se quita. La valoración elegida aparece como una pequeña etiqueta de texto. Al final de la fila, el deslizador registra tu confianza en los **datos** de esa persona entre −5 y +5, en décimas. «Sin valorar» es distinto de marcar 0. Son observaciones profesionales separadas del cuestionario; no cambian los indicadores.

El botón **Valorar esta ficha** permite añadir una puntuación de utilidad de 1 a 5 y un comentario opcional. Pulsa **Añadir a esta sesión** para incluirlo en el envío de cierre. No escribas nombres ni datos personales en el comentario.

## 7. Finalizar y enviar

Si has valorado datos o fichas, el botón muestra **Enviar valoraciones y cerrar** y el número de valoraciones pendientes. Envía un único resumen con tu usuario de acceso, rol, código de sesión y códigos de aula y estudiante. No adjunta los Excel ni los nombres de la llave. Formspree confirma el registro, pero el aviso por correo puede tardar. Si no has valorado nada, el botón muestra **Cerrar sesión**.

La aplicación espera la confirmación antes de retirar la consulta. Si falla el envío, conserva la sesión para reintentar, guardar el resumen local o cerrar sin enviarlo. Antes de sustituir los archivos, cierra la sesión para no perder valoraciones pendientes. Cerrar la pestaña o dejar caducar la sesión por inactividad no garantiza el envío. Los Excel originales permanecen donde estaban; no se promete un borrado forense.
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

Esta edición permite evaluar el flujo, la presentación y el alcance de los perfiles. La carpeta preparada para GitHub Pages permite publicar la prueba de concepto con el ejemplo inventado siguiendo sus instrucciones; preparar esa carpeta no publica la web automáticamente. Antes de usar PBIS con datos reales, deben resolverse los controles de acceso, la provisión de credenciales, la custodia de los archivos y las validaciones indicadas en el documento de comercialización. No incluye soporte contratado ni certificación de cumplimiento.


## Consulta por códigos y archivo .pbis

Solo los indicadores son obligatorios. Sin llave ID–nombre las fichas muestran Estudiante y su código, nunca nombres tomados del archivo de indicadores. La llave Excel es opcional y debe corresponder exactamente a los ID de los indicadores; no se ignoran errores de una llave cargada. El botón Retirar llave permite volver a consultar por códigos y elimina los nombres de la vista.

Los indicadores se entregan como datos_evaluacion.pbis: conserva exactamente los bytes del Excel original y solo cambia su extensión. La aplicación lo lee directamente en memoria. No se cifra, ofusca ni modifica el archivo original. Para preparar uno, cambia .xlsx por .pbis; los nombres siguen en la llave separada. También se admiten los indicadores .xlsx y .xls por compatibilidad.
