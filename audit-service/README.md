# PBIS · Registro privado de accesos en Google Sheets

## Gestión reservada a dirección general (revisión local 27/10/2026)

Los centros utilizan `PBIS.html` sin controles de conexión o manifiestos.
Dirección general utiliza `direccion-local/PBIS.html`, o `DIRECCION.html` en el
kit interno. En esa copia se conservan **Registro de accesos**, el receptor
de proyectos y la descarga del manifiesto. No contiene tokens de Google ni
conexiones privadas incorporadas; carga tu JSON privado durante la sesión.

Los siguientes pasos de configuración se realizan en esa copia de dirección.
Un proyecto que ya tenga receptor lo conserva al editar las cuentas desde la
versión del centro. Cada nueva revisión sigue necesitando registrar su manifiesto
en Sheets; esta limpieza visual no realiza altas automáticas. Separar la pantalla
de dirección no crea un nuevo rol autenticado ni sustituye los permisos de Google.

La comprobación local también corrige un rechazo ocasional de credenciales de
escritura cuyo hash comenzaba por «+»: la protección frente a fórmulas de Sheets
añade un prefijo a esa celda, que ahora se considera al validar y repetir el alta.
Se verifica con una credencial ficticia reproducible. Esta corrección está en
`Code.gs` local; no se ha modificado la implementación de Google durante esta revisión.

Esta ampliación se ha probado con un receptor simulado y, el 23/10/2026, con
una hoja privada de Google Sheets: apertura y cierre confirmados desde file://
y desde la web local. Se utilizaron solo metadatos de consultas ficticias.
La web pública no se ha actualizado durante esta activación. Para otra cuenta,
hay que instalar su receptor y confirmar su primera recepción según esta guía.

## Qué queda registrado

La pestaña **Sesiones** muestra una fila por consulta de archivo: usuario,
centro o centros, archivo (solo su nombre), apertura, última actividad, cierre
y estado. **Eventos** conserva las comunicaciones recibidas sin duplicar los
reintentos. **Autorizaciones** contiene los permisos para escribir en el registro.

- Proyectos protegidos: código de cuenta U-…, rol, DNI parcial y centro.
  Orientación aparece como `orientacion` y «Equipo orientador».
- Excel directo: cuenta compartida `orientacion`, centros presentes en la consulta
  y nombre del archivo. No distingue a las personas que usan esa cuenta.
- Los eventos tienen hora del cliente y de recepción del servidor, en UTC.
- No se envían ni se guardan contraseñas, nombres de estudiantes, respuestas,
  indicadores ni el Excel. El receptor solo admite campos de metadatos definidos.
- La credencial técnica de escritura es aleatoria e independiente de la contraseña
  de PBIS. Viaja por HTTPS; la hoja conserva solo su hash.

## 1. Crear la hoja e instalar el receptor

1. En tu cuenta de Google, crea una hoja de cálculo y llámala **PBIS · Registro de accesos**.
   Mantén el acceso general en **Restringido**.
2. Abre **Extensiones → Apps Script**. Sustituye el contenido de `Código.gs`
   por el archivo `audit-service/Code.gs` de esta entrega.
3. Pulsa **+ → HTML**, llámalo **Registro** y pega `audit-service/Registro.html`.
4. Abre la configuración del proyecto y activa **Mostrar el archivo de manifiesto
   appsscript.json en el editor**. Sustituye su contenido por `appsscript.json`
   de esta entrega. El permiso de correo identifica únicamente al propietario
   durante la configuración; no lee ni envía mensajes de Gmail.
5. Guarda y ejecuta **setupPbisRegistry**. Autoriza tu aplicación desde la cuenta
   propietaria. Regresa a Sheets y recarga: verás Autorizaciones, Eventos,
   Sesiones y el menú **PBIS**.
6. En Apps Script, selecciona **Implementar → Nueva implementación → Aplicación web**.
   Elige **Ejecutar como: yo** y **Quién tiene acceso: cualquier usuario**.
   Esto habilita el receptor de escritura; no hace pública la hoja. Cada envío
   necesita además su credencial de escritura. No publiques la hoja en la web.
7. Copia la dirección HTTPS que termina en **/exec**. No uses la dirección /dev.
   Si tu cuenta institucional no permite esta implementación, consulta con su
   administración; no desactives las comprobaciones del receptor.

Documentación de Google: https://developers.google.com/apps-script/guides/web

## 2. Registrar las cargas directas de Excel de orientación

1. En la hoja, abre **PBIS → Registrar un proyecto / conectar orientación**.
2. En la primera sección pega la URL /exec y pulsa **Preparar conexión**.
   Solo la cuenta propietaria puede darla de alta.
3. Pulsa **Descargar conexión**. Obtendrás `PBIS-conexion-orientacion.json`.
   Guárdalo de forma privada en dirección general. No contiene la
   contraseña de PBIS y no permite leer la hoja, pero sí escribir en el registro.
4. Abre la copia local **DIRECCION.html** y entra como orientación.
   Pulsa **Registro de accesos**, carga ese JSON y vuelve a la consulta.
5. Carga un Excel de prueba y pulsa **Abrir consulta**. Cuando veas
   **Acceso registrado**, comprueba la fila de Sesiones en Google.
6. Pulsa **Cerrar sesión**: la fila debe indicar **Cierre confirmado**.

El archivo de conexión se carga de nuevo en cada inicio de sesión: no se guarda
su contenido en localStorage, sessionStorage ni IndexedDB. Al abrir sucesivos
Excel dentro de esa sesión, el registro es automático. Cambiar de archivo o de
hoja cierra la consulta anterior; la siguiente se registra al validarse y abrirse.
Volver a las mismas fichas no duplica la apertura. Un Excel inválido no genera
una consulta abierta. Si cargas la conexión después del Excel, se registra desde
ese momento, sin inventar una hora anterior.

Los centros del Excel se registran como información declarada por el cliente.
Este registro no convierte la cuenta compartida del piloto en autenticación
personal ni acredita quién está físicamente ante el equipo.

## 3. Registrar proyectos protegidos

1. En PBIS, entra como orientación y abre **Administrar el proyecto**.
2. Pega la URL /exec en **Registro de accesos** antes de generar el .pbis.
3. Descarga el .pbis y su manifiesto de registro.
4. En la hoja privada, abre el menú PBIS, despliega **Registrar un proyecto
   protegido**, pega el manifiesto JSON y pulsa **Registrar proyecto**.
5. Abre el .pbis con una cuenta de prueba. Su conexión está incorporada dentro
   de su autorización cifrada; no necesita cargar el JSON de orientación.

Cada revisión tiene su propio manifiesto. El centro de los nuevos manifiestos
se contrasta al recibir eventos. Los manifiestos antiguos siguen admitidos,
pero no tienen esa correspondencia previa de centro. La edición anterior del
cliente también puede enviar sus eventos v1. El registro no contiene contraseñas
recuperables de esas cuentas.

## 4. Comprobar el primer envío real

Usa exclusivamente un archivo sintético para activar:

- Apertura: usuario, centro y archivo coinciden; solo hay una fila de Sesiones.
- Cierre explícito: la misma fila recibe el cierre y no se duplica.
- Dos archivos: dos consultas diferenciadas, con sus respectivas fechas.
- Conexión interrumpida: aparece «pendiente de registrar»; al recuperar conexión
  con PBIS abierto, el mismo evento se reintenta sin otra fila.
- Contraseñas: no hay columnas de contraseña ni respuestas del cuestionario.

Solo un recibo JSON con `ok:true` y el mismo `eventId` confirma el registro.
Una respuesta HTTP 200 por sí sola no basta. No uses `mode:no-cors`: ocultaría
la respuesta y evitaría saber si se ha guardado.

## Fallos y cierre

Las consultas siguen disponibles si el receptor falla. La cola de envío solo
vive en memoria; se reintenta al recuperar conexión y cada cinco minutos mientras
la aplicación esté abierta. Se comunica actividad si la pestaña está visible y
se ha utilizado recientemente.

Cerrar sesión espera hasta seis segundos para confirmar. Si no llega confirmación,
lo indica. Cerrar la pestaña, apagar el equipo o estar sin conexión puede perder
lo pendiente: **Sin cierre confirmado** no es una hora de cierre. No se guardan
pendientes en el navegador para recuperarlos en otra sesión.

Si no llegan registros, comprueba /exec, acceso de la implementación, autorización
del propietario y manifiesto o conexión. Al modificar Apps Script, actualiza la
implementación a una versión nueva para conservar su URL. Es necesario probar
la recepción real tanto desde la web como desde file://; las políticas del
navegador o de Google Workspace pueden impedirla.

## Actualización, límites y mantenimiento

El receptor añade columnas a las hojas v1 sin borrar filas ni modificar sus
valores anteriores. No inventa centros para el historial que no los contenía.
No cambies los encabezados de las tres hojas. Usa filtros o una hoja aparte si
quieres elaborar un resumen.

La hoja es privada y no hay API de lectura. Las altas solo funcionan desde el
cuadro de la hoja con su propietario. El receptor rechaza campos adicionales,
limita cada solicitud a 16 KB y cada cuenta a 500 eventos/día. Un evento v2
admite hasta 20 centros, con identificadores de hasta 200 caracteres. El bloqueo
de escritura evita colisiones y eventId evita duplicados. Las celdas se protegen
frente a fórmulas procedentes de nombres de archivo o centros.

Eliminar una autorización impide futuros registros de esa conexión; no revoca
copias offline ni permisos de consulta. La configuración no se publica en el
repositorio. Apps Script está sujeto a cuotas: https://developers.google.com/apps-script/guides/services/quotas

Decide quién custodia la hoja y cuánto tiempo se conserva el historial. Este
receptor no borra registros automáticamente ni garantiza registrar usos que
voluntariamente bloqueen su conexión. Conserva el Excel educativo localmente;
solo los metadatos descritos se comunican al registro.
