# Validación de proyectos protegidos · 22 de octubre de 2026

## Ajuste posterior: acceso unificado

Antes había dos entradas; ahora el mismo formulario acepta usuario y contraseña y conduce a la carga. Los permisos del archivo se comprueban antes de mostrar datos. Se ofrece Cambiar usuario o contraseña ante un acceso fallido. El recorrido de navegador prueba una contraseña incorrecta, dos aulas docentes, orientación con contraseña modificada y rechazo de FRJ508 en el archivo nuevo. También se verifica que cuentas desconocidas no puedan acceder a Excel mediante el recorrido del piloto. La demo se conserva.

## Resultado

Validación previa sobre la base 0.10.17, incorporada a la entrega 0.11.0 tras la autorización de publicación del 22 de octubre de 2026. Se utilizan únicamente datos sintéticos. Los datos y credenciales de centros quedan fuera de la entrega.

| Antes | Ahora | Comprobación |
|---|---|---|
| El .pbis era un Excel renombrado y el perfil filtraba la interfaz. | Un formato distinto cifra los datos por conjunto de aulas. | Web Crypto real: dos docentes abren aulas diferentes; alterar el rol visual no aporta otros registros ni claves. |
| No había administración de un proyecto por aulas. | Orientación carga Excel, asigna aulas, crea cuentas y descarga un proyecto. | Recorrido de navegador desde Excel válido y rechazo de una sustitución por un archivo inválido. |
| Las credenciales del piloto eran fijas. | Cada proyecto tiene sus contraseñas y admite nuevas revisiones. | La contraseña nueva de orientación abre; la anterior falla. Restablecimiento docente, bajas y conservación de otras credenciales comprobados. |
| No existían compartimentos restringidos. | El docente recibe solo sus registros y enlaces autorizados. | Inspección de datos descifrados sin nombres, códigos o vínculos ajenos. Comparación de puntuaciones, recuentos y centralidad contra el centro original. |
| No había identificación visual por sesión. | DNI parcial y sesión repetidos en las vistas docentes; Equipo orientador sin marca. | Pantallas de escritorio y móvil, detalle de estudiante y red. |
| No existía este registro de accesos. | Receptor preparado y cliente con cola en memoria y recibos. | Token incorrecto, repetición, conflicto, reparación tras escritura parcial, apertura/cierre y fallo de entrega probados con servicio simulado. |
| El feedback utilizaba la cuenta del piloto. | Los proyectos protegidos utilizan código U-…; no envían el DNI completo. | Envío interceptado en navegador y comprobación del cuerpo de la petición. |

## Pruebas ejecutadas

- **196 pruebas Node aprobadas**, incluidos el formato cifrado, Web Crypto, permisos, cálculos existentes, feedback y servicio de registro.
- **12 pruebas Python aprobadas** de importación de feedback, empaquetado y distribución estática. Repetidas tras incluir las guías nuevas.
- Recorrido anterior: **12 perfiles**, los **16 pasos** de la práctica, fichas a 1360, 390 y 320 píxeles, importación sin conexión por file:// y recuperación de fallo de envío.
- Nuevo recorrido: dos docentes, orientación, creación desde Excel, cambio de contraseña, archivo incorrecto, marca de agua, envío de feedback con cuenta pseudónima y cierre sin confirmación.
- Mismo visualizador desde HTTP local y desde file://; almacenamiento localStorage, sessionStorage e IndexedDB bloqueado durante los recorridos.
- Cuatro ZIP verificados mediante manifiesto SHA-256 y comparación del PBIS.html contenido con la aplicación construida.
- Motor core.js y raw-wave1.js conservado sin cambios respecto al original.

Los envíos externos están interceptados; ninguna de estas pruebas ha mandado datos o correos reales. Edge en Windows es el navegador comprobado. El ejemplo de entrega contiene 756 estudiantes del Centro 3705, con acceso docente a 1.º ESO A o B, 28 estudiantes por aula.

## Pendiente

Configurar la hoja privada y el despliegue de Apps Script en la cuenta propietaria; registrar un manifiesto y verificar una apertura y un cierre reales. Hasta entonces la integración de Google está preparada y probada mediante simulación, no activada.

Quedan pendientes las pruebas nativas en macOS/Linux y en Safari/Firefox, la revisión independiente del diseño criptográfico y las decisiones de conservación de registros. El modo sin conexión no permite revocar copias antiguas ni garantizar que se comunique todo acceso. Las contraseñas cortas acordadas y la clave FRJ508 mantienen los límites descritos en la guía.

## Repetir

Ejecutar tools/check.mjs con Node 24, Python 3 y las dependencias de desarrollo instaladas. En Windows se utiliza Edge. Las pruebas que abren un puerto local o carpetas temporales necesitan que el entorno permita esas operaciones.

Los registros de esta comprobación están en comprobacion-final.log y comprobacion-paquetes.log. Las capturas de revisión están en test-results/proyecto-docente.png, proyecto-movil.png y proyecto-administracion.png.
