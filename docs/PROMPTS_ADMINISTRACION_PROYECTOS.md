# Prompts · Administración de proyectos PBIS

## Ajuste: una única entrada

Unifica el acceso inicial: usuario o DNI y contraseña, seguido de Abrir proyecto. Acepta cualquier credencial no vacía en esa primera etapa, sin dar acceso a datos por ello. Reconoce el formato del archivo seleccionado; descifra y valida sus permisos antes de mostrar las fichas. Mantén los perfiles de evaluación para Excel y la demo existente. Elimina el botón y diálogo separados de apertura protegida. Si falla la autorización, explica que no hay permisos para visualizar el archivo y ofrece Cambiar usuario o contraseña. Conserva la contraseña exacta solo en memoria hasta la apertura o cierre, sin alterar mayúsculas en las claves cifradas. Verifica también que la clave del piloto no abre un proyecto cuya contraseña de orientación se haya cambiado.

## 1. Implementación compatible

Trabaja en una copia local del visualizador PBIS. Conserva el motor de cálculo, la normalización, los Excel originales y la demo. Añade una pantalla Administrar el proyecto, solo para orientación fuera de la simulación. Reutiliza la lectura y validación de Excel. Permite elegir centro, asignar varias aulas por DNI, generar contraseñas de dos animales y dos cifras y editar permisos. Genera un solo archivo protegido por centro. No publiques ni despliegues.

Criterios: rechazar DNI y contraseñas duplicados, DNI con letra incorrecta, aulas inexistentes y archivos incompatibles. Sustituir un Excel invalida la preparación anterior. Mostrar resumen antes de descargar. Conservar cuentas existentes sin recuperar sus contraseñas. Orientación usa orientacion y una contraseña editable, inicialmente FRJ508; no hay acceso maestro oculto.

## 2. Revisión del cifrado

Revisa el código de src/protected-project.js y sus pruebas. Comprueba AES-256-GCM, PBKDF2-SHA-256 a 600.000 iteraciones, sales e IV aleatorios, claves separadas y autenticación del contexto. Verifica límites de tamaño y formato, ausencia de secretos en claro, cambio de contraseña y rechazo de archivos manipulados. Examina los compromisos de conservar autorizaciones al renovar el archivo. No presentes el formato ni las contraseñas cortas como protección absoluta.

Un resultado satisfactorio debe mostrar que la contraseña anterior no abre la nueva revisión cuando se cambia, que un rol manipulado no aporta otras claves y que la cuenta de orientación no tiene una contraseña alternativa. Documenta ataques offline, copias antiguas, metadatos visibles y alcance de la revisión.

## 3. Permisos e indicadores

Construye un centro sintético con dos aulas y vínculos cruzados. Calcula primero todo el centro con el motor existente. Empaqueta y abre como dos docentes con permisos diferentes y como orientación. Compara cada puntuación y recuento con el original. Inspecciona el objeto docente: no debe contener registros, nombres, códigos, campos libres ni aristas de estudiantes ajenos al permiso. Verifica que el contrato acepta enlaces parciales autorizados sin cambiar el validador Excel.

Comprueba lista, filtros, fichas, ambas redes y marca de agua docente. Orientación debe mostrar Equipo orientador y ninguna marca. Mantén las redes acotadas, aunque los agregados del indicador incluyan respuestas del centro.

## 4. Trazabilidad sin persistencia

Implementa una cola solo en memoria con eventos de apertura, actividad y cierre explícito. Requiere confirmación exacta de eventId. Prepara un receptor privado de Google Sheets con credenciales de escritura independientes por cuenta, hashes de tokens en el manifiesto, bloqueo de concurrencia e idempotencia. No envíes DNI completo, estudiantes, contraseñas ni archivos al registro.

Prueba rechazo de tokens incorrectos, campos extra, repeticiones con distinto contenido y registro no autorizado de manifiestos. Prueba recuperación tras escritura parcial. No confundas entrega de eventos con identidad física ni con auditoría de cada dato leído. Describe la pérdida de pendientes al cerrar offline.

## 5. Pruebas de uso y regresión

Usa solo datos ficticios. En navegador, crea un proyecto desde Excel, abre dos docentes, cambia orientación y genera una nueva revisión. Ensaya teclado, móvil de 320 y 390 píxeles, red ampliada, error de archivo y sustitución de Excel. Ejecuta la consulta por HTTP local y file:// sin conexión. Bloquea localStorage, sessionStorage e IndexedDB para detectar escrituras.

Intercepta todas las llamadas externas. Verifica que las valoraciones conservan su recorrido y usan U-… como cuenta, sin DNI completo. Repite la práctica guiada existente y la verificación de descargas. Entrega los fallos reales y las comprobaciones pendientes; nunca simules una activación real de Google.

## 6. Entrega y límites

Entrega aplicación autónoma, proyecto sintético, credenciales de prueba por separado, cuatro descargas sincronizadas, guía y receptor. Conserva los cambios previos del repositorio. Documenta Antes / Ahora / Comprobación. Diferencia implementación local comprobada, integración simulada y activación pendiente. No publiques datos ni código sin la indicación posterior del usuario.

## Aplicación de estos prompts

Los módulos nuevos son protected-project.js, project-admin.js y access-audit.js. La integración está en app.js y build.mjs. El receptor está en audit-service. Las pruebas nuevas están en protected-project.test.cjs, access-audit.test.cjs, audit-service.test.cjs y tests/e2e/protected.mjs. La activación real de Google Sheets queda pendiente de la cuenta propietaria.
