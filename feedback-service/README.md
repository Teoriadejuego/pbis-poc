# Servicio de opiniones de RADARS

Este componente recibe opiniones voluntarias y las claves del aula y, cuando corresponde, de la persona a la que se refiere la ficha. Envía una notificación a **pbis_usuario@outlook.es**. Las fichas, los Excel de indicadores, la llave de nombres y los perfiles continúan procesándose en el equipo de quien utiliza el visualizador. La aplicación de escritorio no necesita instalar este servicio. Las opiniones están **seudonimizadas**, no son anónimas: las claves permiten relacionarlas con otras fuentes que tengan esas mismas claves.

El envío automático necesita conexión a Internet y un servicio alojado una vez por la persona que administra el servicio. Esta entrega contiene el código y las pruebas, **sin servicio publicado, credenciales de correo ni envíos reales**. La dirección Outlook es el destinatario; no se accede a esa cuenta ni se pide su contraseña.

## Instalación para administración

1. Instala Node.js 24 LTS en un servidor con disco persistente privado. No hace falta `npm install`.
2. Copia `feedback-service/` y `vendor/xlsx.full.min.js` con `vendor/LICENSE-SheetJS.txt`, manteniendo la estructura relativa. El directorio de código no debe exponerse como contenido web.
3. Crea un directorio de datos accesible sólo por la cuenta que ejecuta el servicio. En Linux se recomiendan permisos `0700` para el directorio y `0600` para la base. En Windows configura sus ACL para esa cuenta; los bits POSIX no sustituyen las ACL de Windows.
4. Copia `.env.example` como `.env`, fuera de las entregas públicas. Completa `RESEND_API_KEY` y `FEEDBACK_FROM` con la clave de envío de Resend y un remitente de un dominio verificado. Nunca escribas secretos en `RADARS.html`, JavaScript público, repositorios o paquetes descargables.
5. Define `FEEDBACK_DB` como una ruta absoluta, por ejemplo `/var/lib/radars-feedback/opiniones.sqlite`. En Windows puede ser `C:/RADARS-privado/opiniones.sqlite`. No uses directorios sincronizados públicos, `site/`, `site-src/`, `release/` ni `outputs/`.
6. Desde la raíz de `radars_producto`, ejecuta:

```text
node --env-file=feedback-service/.env feedback-service/server.cjs
```

7. Publica **sólo este servicio HTTP** detrás de un proxy HTTPS administrado. Por defecto escucha en `127.0.0.1:8787`; evita exponer el puerto HTTP directamente. Configura el gestor de procesos para reiniciar el servicio si cae. Usa una sola instancia sobre el archivo SQLite.
8. Configura en la compilación de RADARS la URL HTTPS exacta terminada en `/api/feedback`, siguiendo las instrucciones de `docs/OPINIONES.md`. No pongas la clave del proveedor en esa configuración.
9. Comprueba `/health`, la entrada de una opinión de prueba autorizada y la recepción en el buzón. Una respuesta `accepted` indica aceptación por el proveedor, no entrega garantizada en la bandeja del destinatario.

Variables disponibles:

| Variable | Uso |
| --- | --- |
| `RESEND_API_KEY` | Secreto de envío, sólo servidor. |
| `FEEDBACK_FROM` | Remitente autorizado, p. ej. `RADARS <opiniones@tu-dominio.es>`. |
| `FEEDBACK_DB` | Ruta absoluta al archivo SQLite privado y persistente. |
| `FEEDBACK_HOST` | Dirección de escucha; `127.0.0.1` por defecto. |
| `FEEDBACK_PORT` | Puerto; `8787` por defecto. |
| `FEEDBACK_DAILY_LIMIT` | Máximo global de nuevas opiniones al día UTC; `500` por defecto. |
| `FEEDBACK_CONNECTION_LIMIT` | Máximo de solicitudes por IP de conexión y hora; `30` por defecto. |

**Límite y proxy:** el servicio no confía en `X-Forwarded-For`. Detrás de un proxy, las peticiones suelen compartir la IP del proxy y, por tanto, el límite de conexión. Ajusta `FEEDBACK_CONNECTION_LIMIT` al volumen agregado previsto y establece también límites de IP en el proxy. El límite diario global de opiniones se conserva en SQLite. El contador por conexión sólo vive en memoria y se reinicia al arrancar.

Este es un receptor público de escritura para permitir la aplicación descargada (`file://`). CORS permite `*`, sin cookies ni credenciales. CORS no autentica al remitente, y el rol recibido es declarado por el cliente. No hay ninguna API para consultar o descargar opiniones. Antes de una apertura pública de gran escala hay que dimensionar y operar protección frente a abuso; el código limita volumen, tamaño y destinatario, pero no acredita identidades.

## Contrato de la API

`POST /api/feedback`, `Content-Type: application/json`, hasta 8192 bytes sin compresión. Sólo admite estos diez campos:

```json
{
  "eventId": "45845145-800c-445e-a22a-c5f79ce9b1bb",
  "sessionCode": "4938b76f-50d9-40bf-8d54-3879cfe7e7d8",
  "role": "tutor",
  "sheet": "group",
  "rating": 4,
  "comment": "Los indicadores se entienden bien.",
  "version": "0.9.1",
  "date": "2026-09-29",
  "classCode": "AULA-5246c8b62f581d5f9a7fb895",
  "studentCode": null
}
```

- `eventId` y `sessionCode`: UUID v4 aleatorios. El primero identifica la opinión y permite reintentar sin duplicarla; el segundo se renueva al iniciar sesión.
- `role`: `tutor` u `orientador`. `sheet`: `group` o `individual`.
- `classCode`: clave del aula, obligatoria; `studentCode`: clave del estudiante para ficha individual, o `null` para ficha de grupo. Cada clave es texto de 1 a 80 caracteres, con letras ASCII, números, `_`, `.`, `:`, `-`. Los ceros iniciales se conservan. El cliente obtiene la clave del estudiante del ID cargado; para el aula usa un `ID_aula` válido de la hoja de grupos o una clave derivada mediante SHA-256 de la combinación centro/curso/grupo. Esa combinación legible no se transmite.
- `rating`: entero de 1 a 5. `comment`: texto opcional vacío, máximo 1500 puntos de código Unicode; admite saltos de línea y tabuladores, pero no otros controles.
- `version`: `0.9.1`. `date`: fecha válida `YYYY-MM-DD` sin hora, indicada por el cliente.
- Se rechazan campos extra, incluidos usuario, nombres, etiquetas de centro/curso/grupo y destinatario. Las claves deben ser códigos de referencia, nunca nombres escritos como códigos; el servicio valida su formato y no puede comprobar cómo se asignaron.

Respuestas:

| HTTP | Resultado |
| --- | --- |
| `200` | `{ "saved": true, "emailStatus": "accepted" }`: guardada, proveedor aceptó el correo electrónico. |
| `202` | `{ "saved": true, "emailStatus": "pending" }`: guardada, correo electrónico todavía no confirmado. |
| `400` | Contenido o validación incorrectos. |
| `409` | El mismo `eventId` ya contiene otra opinión. No modificar un evento enviado. |
| `413` / `415` | Tamaño excesivo / formato no admitido. |
| `429` | Límite de solicitudes o presupuesto diario. |
| `503` | Correo no configurado: no se guarda la opinión. |
| `500` | No se puede confirmar el guardado. Reintentar con el mismo `eventId`. |

Una opinión repetida con el mismo contenido devuelve su estado existente. El orden de propiedades JSON y las mayúsculas de UUID no crean duplicados. Una petición que pierde la conexión puede haber quedado guardada: al reintentar, el cliente debe conservar su ID.

`GET /health` devuelve exclusivamente `{ "status": "ready" }` o `{ "status": "unconfigured" }`. No comprueba la validez remota de las credenciales ni expone datos o secretos.

## Hoja de opiniones y correo

Cada correo electrónico contiene un único `Opiniones.xlsx`, con una hoja **Opiniones** y sólo la fila que se acaba de comentar. No se redistribuye todo el histórico en cada correo. Las columnas son ID de opinión, código de sesión, rol, ficha, **Clave_aula**, **Clave_estudiante**, valoración, comentario, versión y fecha. Los textos se escriben como celdas de texto sin fórmulas ni enlaces, incluso si comienzan por `=`, `+`, `-` o `@`.

El histórico acumulado se guarda únicamente en la base privada. Para obtener una hoja acumulada, la persona que administra el servicio ejecuta localmente en el servidor:

```text
node --env-file=feedback-service/.env feedback-service/export.cjs /ruta/privada/Opiniones.xlsx
```

El directorio de destino debe existir, la ruta debe ser absoluta y el archivo no debe existir. La exportación contiene las opiniones guardadas, incluidas las que tienen correo pendiente y sus claves de referencia; no añade direcciones IP ni nombres. No existe un enlace público de descarga. Protege y elimina estos archivos conforme al plazo de conservación que establezcas.

## Entrega pendiente y recuperación

SQLite confirma el guardado antes de contactar con el proveedor. Si falla el envío, mantiene una cola persistente y realiza como máximo cinco intentos por opinión, con esperas de 1, 2, 4 y 8 minutos entre intentos. La cola se revisa cada 15 segundos y se recupera al reiniciar. Cada petición al proveedor usa una clave idempotente estable basada en `eventId`.

Resend conserva la idempotencia durante 24 horas. Para evitar duplicados por un reinicio tardío, el servicio deja de reenviar automáticamente transcurridas 23 horas desde el primer intento. Las opiniones que agotan intentos o ventana permanecen guardadas con estado `pending`. La persona que administra el servicio puede revisar los estados directamente en su base privada y exportar la hoja; no debe reiniciar los contadores ni reenviar esos correos sin comprobar antes el historial del proveedor. Las confirmaciones y rebotes posteriores no se procesan en esta versión.

Mantén estable el remitente mientras haya reintentos pendientes, pues los reintentos idempotentes deben tener exactamente el mismo contenido. La copia adjunta se genera de manera determinista.

## Privacidad y operación

Se conservan sólo los diez campos de la opinión y metadatos internos de guardado/reintento. El servicio guarda las claves de referencia del aula y, en fichas individuales, del estudiante. No guarda IP, usuario, nombre del estudiante, etiquetas de centro/curso/grupo, contraseñas, la llave de nombres ni indicadores de los Excel. No registra cuerpos, comentarios, errores del proveedor o secretos en consola.

Esto reduce la identificación directa y constituye **seudonimización**. El código de sesión permite relacionar las opiniones de esa sesión; las claves de aula/estudiante permiten vincularlas con otras fuentes; una persona puede escribir información identificativa en su comentario. Un código de aula derivado de etiquetas predecibles podría recuperarse probando combinaciones: el hash no equivale a cifrado. El navegador, el alojamiento, el proxy y el proveedor de correo pueden procesar metadatos de red. Desactiva registros de cuerpos y parámetros en esas capas, minimiza los registros de acceso y configura retención y acceso a buzón/base/copias de seguridad antes de recoger opiniones reales. La opinión y sus claves abandonan el dispositivo únicamente cuando se solicita su envío. Ningún adjunto incluye los Excel de estudiantes.

La API del proveedor usa texto plano para el comentario, nunca HTML construido con él. El destinatario está fijado en el código y no se puede cambiar desde una petición. No se aceptan redirecciones al enviar al proveedor, y cada llamada tiene un tiempo máximo de diez segundos.

## Verificación de esta entrega

```text
node --test tests/feedback-service.test.cjs
```

Las pruebas inyectan un proveedor simulado y usan bases temporales. Comprueban campos, persistencia, idempotencia, concurrencia, reintentos, límites, destinatario, adjuntos y exportación sin fórmulas. **No envían correos reales**. La entrega requiere todavía configurar el alojamiento, el remitente verificado y una prueba de recepción con autorización de la persona responsable.

Referencias técnicas: [Node.js SQLite](https://nodejs.org/api/sqlite.html), [API de Resend e idempotencia](https://resend.com/docs/dashboard/emails/idempotency-keys), [adjuntos Base64 de Resend](https://resend.com/docs/dashboard/emails/attachments).
