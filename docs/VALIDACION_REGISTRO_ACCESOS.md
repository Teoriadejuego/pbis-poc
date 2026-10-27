# Registro de accesos · Validación local y activación, 23 de octubre de 2026

## Resultado

Preparado sobre la copia local PDF de PBIS 0.11.1. La web pública no se ha
actualizado. El 22 de octubre las pruebas utilizaron un receptor simulado;
el 23 de octubre se activó una hoja privada y se confirmó la recepción real
de dos consultas sintéticas. Ningún archivo real ni credencial de centro se utilizó.

| Antes | Ahora | Verificación |
| --- | --- | --- |
| Solo los proyectos protegidos preparaban eventos; el centro no figuraba en el contrato. | Eventos v2 incluyen centros y el receptor añade Usuario y Origen. | Contrato cliente/receptor y prueba de orientación con dos centros. |
| Una consulta directa de orientación no se registraba. | Una conexión privada, solo en memoria, activa el registro para los Excel de la sesión. | Navegador: conectar, abrir, sustituir archivo y cerrar. |
| El estado inicial podía indicar registro antes de enviar. | Solo un recibo correcto muestra Acceso registrado. | Prueba de estado inicial y fallo/reintento. |
| No había conexión privada para la cuenta compartida. | La hoja genera el archivo para orientacion; no se publica en el HTML. | Cuadro HTML probado con google.script.run simulado y descarga real del JSON. |
| Hojas antiguas sin Centro/Usuario/Origen. | Se añaden columnas sin borrar filas y se admiten clientes/manifiestos anteriores. | Migración y repetición de eventos v1. |

## Pruebas

- 208 pruebas JavaScript, todas correctas.
- 12 pruebas Python, todas correctas, incluido empaquetado con la guía actual.
- tests/e2e/access-audit.mjs: siete peticiones simuladas, seis eventos únicos,
  duplicado de reintento con el mismo ID; centros Córdoba y Sevilla de la muestra
  sintética. Se comprueba que un archivo inválido no abre una consulta.
- La nueva sesión no conserva la conexión anterior. Al cargarla después de abrir
  un archivo, se registra desde ese momento. Reabrir la misma consulta no duplica.
- Contraseña centinela y contraseña del piloto ausentes de los cuerpos enviados.
  Un campo adicional password, contraseña, students, answers o username se rechaza
  sin escribir filas. Solo se envía el contrato de metadatos y su token técnico.
- El receptor guarda el hash de ese token, nunca el token en claro.
- tests/e2e/protected.mjs: acceso correcto e incorrecto, dos docentes y orientación,
  registro con centro, edición del proyecto, marcas, file:// y HTTP local.
- En las pruebas de navegador, localStorage, sessionStorage e IndexedDB lanzan un
  error si se accede: los recorridos terminan sin errores.
- Diálogo de conexión probado a 320 y 390 px; cuadro de configuración revisado.
- Cuatro ZIP de distribución verificados contra la aplicación reconstruida.

## Archivos principales

src/access-audit.js, src/audit-connection.js, src/app.js,
src/protected-project.js (solo centro en el manifiesto de registro),
audit-service/Code.gs, audit-service/Registro.html y appsscript.json.
El motor de cálculo, las normalizaciones, las cuentas del piloto y la demo
no se han modificado.

## Activación real verificada

Se instaló el receptor /exec con permisos del propietario, manteniendo la hoja
restringida. Se registró la conexión de orientación y se probó la aplicación
desde file:// y desde HTTP local. En cada consulta se recibieron open y close
con sus eventId, una sola sesión y estado «Cierre confirmado». La cuenta fue
orientacion, los centros sintéticos Córdoba y Sevilla, y el archivo se identificó
como PRUEBA_ACTIVACION_SIN_DATOS_REALES.xlsx. Se cotejaron los registros en Google
Sheets y los recibos del receptor, sin almacenar el token en la evidencia.

tests/e2e/access-audit-live.mjs verifica el contrato de cada solicitud y bloquea
localStorage, sessionStorage e IndexedDB. Dos recorridos correctos, cuatro recibos
reales, sin contraseñas ni datos de estudiantes. La prueba real exige una conexión
privada en PBIS_AUDIT_CONNECTION; no forma parte de CI.

Los proyectos protegidos conservan sus pruebas simuladas y necesitan registrar su
manifiesto para usar esta hoja. No se han probado cuotas, carga concurrente ni
las políticas de otras cuentas Google Workspace. La conexión privada queda fuera
del sitio y de los archivos de distribución.

Cerrar pestaña o perder la conexión puede dejar Sin cierre confirmado. No se
promete registro obligatorio ni identificación personal de la cuenta compartida.
Las colas no sobreviven al cierre del navegador. El cierre explícito espera como
máximo seis segundos y avisa si no recibe confirmación.
