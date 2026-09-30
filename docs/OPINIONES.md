# PBIS · Opiniones sobre las fichas

Versión 0.9.1 · Guía de uso y activación

PBIS permite valorar la ficha del grupo o la ficha individual y añadir un comentario asociado a las claves del aula y del estudiante. Las fichas y los Excel de los estudiantes siguen procesándose en el equipo. Solo la opinión y esas claves se transmiten cuando la persona pulsa el botón de envío y existe un servicio configurado.

La entrega incluye el formulario, el Excel independiente de opiniones y el servicio preparado para recibirlas y notificar a **pbis_usuario@outlook.es**. El correo automático queda pendiente de configurar y desplegar: no se ha enviado ningún correo real durante las pruebas.

## Para quien usa las fichas

Abre el botón de opinión junto a la ficha, elige una valoración de 1 a 5 y, si quieres, escribe un comentario de hasta 1.500 caracteres. Puedes cancelar sin enviar. No incluyas nombres ni detalles que permitan reconocer a estudiantes, personal del centro u otras personas.

La opinión indica el tipo de ficha —grupo o individual—, el rol del perfil y un código aleatorio de sesión. Incluye también la **clave del aula** y, para una ficha individual, la **clave del estudiante**. El diálogo muestra esas claves antes de guardar o enviar. No incorpora el nombre del estudiante ni las etiquetas del centro, curso o grupo. Un nuevo inicio de sesión genera un código de sesión distinto; las claves del aula y estudiante se mantienen para poder relacionar la opinión con su ficha.

Son opiniones **seudonimizadas**: quien dispone de los archivos y de la llave puede vincularlas con el aula y el estudiante. No deben presentarse como anónimas.

Si el envío no está configurado o no hay conexión, puedes guardar un Excel independiente con la hoja **Opiniones**. Ese archivo no cambia los Excel de indicadores ni la llave. Las opiniones que solo permanezcan en la sesión se pierden al cerrarla; guarda el Excel antes si quieres conservarlas. Guardar el Excel no lo envía por correo ni programa un envío posterior desde el navegador.

Cuando el servicio confirma el registro, conserva una copia de la opinión y gestiona la notificación. El correo lleva un Excel adjunto con esa única opinión en la hoja **Opiniones**. Un fallo al enviar el correo no debe confundirse con la pérdida de una opinión ya registrada. La aceptación por el proveedor de correo tampoco garantiza que el mensaje haya llegado a la bandeja de entrada.

## Qué información contiene una opinión

| Campo | Contenido |
|---|---|
| `eventId` | Identificador aleatorio de esa opinión, para evitar duplicados al reintentar |
| `sessionCode` | Código aleatorio de la sesión; no deriva del nombre de usuario |
| `role` | Rol general del perfil |
| `sheet` | Tipo de ficha: `group` (grupo) o `individual` |
| `classCode` | Clave estable del aula, exportada como `Clave_aula` |
| `studentCode` | ID del estudiante como texto, exportado como `Clave_estudiante`; `null` en la ficha de grupo |
| `rating` | Valoración entera de 1 a 5 |
| `comment` | Texto escrito voluntariamente, hasta 1.500 caracteres |
| `version` | Versión del visualizador |
| `date` | Fecha de la opinión |

El servicio añade información operativa, como el momento de recepción y el estado de la notificación. Recibe las claves del aula y del estudiante, pero no los libros de Excel, capturas, indicadores, nombres, usuario, contraseña ni etiquetas de centro, curso o grupo. El rol es una declaración del cliente; no acredita la identidad de quien comenta.

La clave del estudiante conserva el ID del Excel como texto, incluidos ceros iniciales. Guarda los ID como texto en el archivo de origen: los ceros ya perdidos al introducir números no pueden recuperarse. Las claves admitidas tienen de 1 a 80 caracteres: letras A–Z o a–z, números, punto, guion bajo, dos puntos o guion, sin espacios. Utiliza claves que no incluyan nombres ni identificadores directos.

La clave del aula utiliza `ID_aula` de la hoja `Grupos` si existe. En su ausencia, se calcula SHA-256 de `JSON.stringify([Campus, Curso, Grupo])`, se toman los primeros 24 caracteres hexadecimales y se añade `AULA-`. Se mantiene mientras no cambien esos textos; no se añade ni modifica ninguna hoja de indicadores. Esta derivación no es un cifrado: una persona que conozca los posibles centros, cursos y grupos puede reproducirla y relacionarla con el aula.

El comentario libre, el contexto o un rol poco frecuente también podrían revelar quién escribe. El transporte de cualquier petición por Internet expone metadatos a la infraestructura utilizada. La tabla de opiniones no guarda IP ni cabeceras de navegador; revisa por separado los registros del alojamiento, proxy y proveedor de correo.

## Activar el correo en cuatro pasos

Esta preparación la hace quien administra PBIS. Las personas que descarguen el visualizador no necesitan instalar Node.js ni configurar servicios.

### 1. Desplegar el receptor con almacenamiento privado

Usa un alojamiento con **Node.js 24**, un proceso persistente y un disco privado persistente. El código está en `feedback-service/`; utiliza SQLite integrado en Node y el lector de Excel incluido en `vendor/`. No necesita `npm install`. Conserva `vendor/xlsx.full.min.js` y su licencia junto al proyecto si vas a utilizar la exportación a Excel.

Copia `feedback-service/.env.example` a un archivo `.env` privado y configura los valores descritos en el paso 2. No incluyas ese archivo, la base de datos ni las exportaciones en `site/`, en los ZIP públicos o en un repositorio público.

El servicio se inicia desde la raíz de el proyecto PBIS con:

```text
node --env-file=feedback-service/.env feedback-service/server.cjs
```

Coloca un proxy HTTPS delante del puerto interno y publica la ruta `POST /api/feedback`. El proceso escucha por defecto solo en `127.0.0.1:8787`; adapta el enlace al entorno privado de tu alojamiento si lo exige. `GET /health` permite comprobar su disponibilidad sin exponer las opiniones. No hay una ruta pública para leerlas.

La ruta acepta envíos desde archivos locales del visualizador, por lo que usa CORS abierto. Eso no autentica al remitente ni impide que un tercero invoque la API. Mantén el límite de envíos y configura límites adicionales en el alojamiento antes de anunciar la URL de forma pública. El endpoint no debe compartir permisos con los datos de los estudiantes.

El límite por conexión cuenta la IP que llega directamente al proceso, sin confiar en cabeceras que podría falsificar el cliente. Detrás de un proxy, varias personas pueden compartir ese contador. Ajusta `FEEDBACK_CONNECTION_LIMIT` a ese despliegue y aplica el control por cliente en el proxy; evita dejar por error a todo el centro limitado a 30 intentos por hora. Este contador temporal en memoria no se exporta ni se escribe en la tabla de opiniones.

### 2. Configurar el remitente y los secretos del servidor

Crea una cuenta de Resend, verifica un dominio que controles y genera una clave de API de envío. Resend necesita una clave y un dominio verificado; el remitente debe pertenecer a ese dominio. [Documentación de envío](https://resend.com/docs/send-with-nodejs) y [verificación del dominio](https://resend.com/docs/dashboard/domains/introduction).

**Outlook es el destinatario, no el remitente.** No se necesita la contraseña de `pbis_usuario@outlook.es` ni debe ponerse en el programa. El servidor fija esa dirección como destinatario y no permite cambiarla desde el formulario.

Configura estos valores únicamente en el gestor de secretos del alojamiento o en su `.env` privado:

| Variable | Valor que debes preparar |
|---|---|
| `RESEND_API_KEY` | Clave secreta de Resend con permiso de envío |
| `FEEDBACK_FROM` | Remitente del dominio verificado, por ejemplo `PBIS <opiniones@tu-dominio.es>` |
| `FEEDBACK_DB` | Ruta absoluta a la base privada y persistente, por ejemplo `/var/lib/pbis/opiniones.sqlite` |
| `FEEDBACK_HOST` | `127.0.0.1` detrás de un proxy en el mismo equipo; adapta solo si el alojamiento lo requiere |
| `FEEDBACK_PORT` | Puerto interno, por defecto `8787` |
| `FEEDBACK_DAILY_LIMIT` | Máximo global de opiniones por día, por defecto `500` |
| `FEEDBACK_CONNECTION_LIMIT` | Máximo de intentos por IP de conexión y hora, por defecto `30`; ajústalo si el proxy agrupa todas las conexiones |

Sin credenciales de envío, un receptor iniciado devuelve un error de servicio no disponible y no registra la opinión. Una ruta de base de datos inválida impide el arranque. Nunca pongas la clave de Resend en el HTML ni en `FEEDBACK_ENDPOINT`. Desactiva el seguimiento de apertura y clics de los mensajes si lo habías habilitado en Resend.

### 3. Conectar la dirección del receptor al visualizador

Una vez publicado y comprobado el servicio, usa su URL HTTPS terminada en `/api/feedback` al generar PBIS. Desde el proyecto PBIS, en PowerShell:

```powershell
$env:FEEDBACK_ENDPOINT = 'https://opiniones.tu-dominio.es/api/feedback'
node tools/build.mjs
Remove-Item Env:FEEDBACK_ENDPOINT
```

O, en macOS/Linux:

```sh
FEEDBACK_ENDPOINT='https://opiniones.tu-dominio.es/api/feedback' node tools/build.mjs
```

Sustituye el dominio de ejemplo por el tuyo. Esta URL es pública y no lleva secretos. La compilación incorpora el destino y permite esa URL en la política de conexión de la aplicación. Las fichas continúan funcionando sin Internet; la red se utiliza únicamente para enviar la opinión cuando se pulsa el botón correspondiente.

Si generas los paquetes sin `FEEDBACK_ENDPOINT`, el correo no estará activado y seguirá disponible el guardado del Excel de opiniones. Los paquetes ya descargados no reciben esta configuración de forma remota.

### 4. Probar y distribuir las nuevas descargas

La compilación actualiza `release/PBIS.html` y los ZIP de `site/downloads/` para Windows, macOS, Linux y Universal. Publica las descargas regeneradas y comprueba que quien recibe el paquete extrae y abre la nueva versión.

Haz una prueba identificada como «Prueba de activación», sin información de personas: envía una valoración, comprueba que queda una única fila en la base y revisa la recepción del aviso en Outlook. Prueba también una desconexión y un reintento. Hasta que se configure y haga esta prueba, solo puede afirmarse que el envío funciona con un proveedor simulado.

El servidor guarda primero la opinión y mantiene una cola de notificación. Aplica hasta cinco intentos y no reenvía automáticamente cuando han pasado 23 horas desde el primero, para respetar la ventana de idempotencia del proveedor y limitar duplicados. Revisa los fallos pendientes desde la administración del alojamiento; no los presentes en la interfaz como correos entregados.

## Obtener la hoja consolidada de opiniones

Desde el servidor, exporta a una ruta privada:

```text
node --env-file=feedback-service/.env feedback-service/export.cjs /ruta/privada/Opiniones.xlsx
```

La hoja consolidada contiene los diez campos de las opiniones recibidas, incluidas `Clave_aula` y `Clave_estudiante`. La base SQLite conserva además el estado operativo de las notificaciones. La base es el registro persistente; la exportación es una copia. No publiques ninguna de las dos dentro de la web de descargas. El Excel que guarda una persona en su equipo solo recoge las opiniones de su sesión, no las de otras personas.

Las opiniones recibidas, las exportaciones y los correos permanecen después de cerrar PBIS. Define quién puede consultarlos, durante cuánto tiempo se conservan y cómo se eliminan de cada ubicación. La nueva función no altera la separación entre indicadores y llave ni sustituye ese protocolo de custodia.

## Verificación técnica sin enviar correos

Usa las pruebas `tests/feedback-service.test.cjs`, `tests/feedback-ui.test.cjs` y `tests/feedback-model.test.cjs`, que sustituyen al proveedor de correo por una función de prueba. Cubren validación del contrato, deduplicación, fallos y notificación sin dirigirse al buzón real. No añadas una clave real al entorno de pruebas.

Consulta `PROMPT_OPINIONES.md` para revisar el alcance de diseño, privacidad y validación solicitado para esta mejora.
