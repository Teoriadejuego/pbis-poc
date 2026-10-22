# Proyectos PBIS protegidos · 0.11.1

Esta ampliación conserva el visualizador, sus cálculos, su normalización y la práctica guiada. Añade proyectos cifrados y permisos por aula, tanto en la web como en las descargas.

## Abrir el proyecto del centro

1. Abre **PBIS.html** en la web o extrae la descarga y abre **index.html**.
2. Introduce el usuario y la contraseña entregados por orientación.
3. En **Abrir proyecto**, selecciona el archivo **.pbis** que te ha facilitado el centro. Las credenciales se comprueban en ese momento.
4. Si tienes acceso como orientación, **Administrar el proyecto** permite cambiar cuentas y generar una nueva revisión.

Los archivos y credenciales de centros no se distribuyen con la aplicación. La práctica guiada utiliza exclusivamente datos simulados. Para pruebas técnicas, tras construir el proyecto, `node tools/protected-example.mjs` genera un archivo ficticio y sus accesos en `revision-local/`, excluido de la publicación. Las contraseñas distinguen mayúsculas y minúsculas.

## Acceso unificado

La primera pantalla admite cualquier usuario y contraseña no vacíos para llegar a la carga; todavía no concede permisos sobre un archivo. El proyecto cifrado valida las credenciales antes de mostrar datos. Si no permiten abrirlo, se muestra «No tienes permisos para visualizar este archivo…». Pulsa **Cambiar usuario o contraseña** para corregir el acceso y cargarlo de nuevo.

Para un Excel sin cifrar se conservan las cuentas del piloto y sus ámbitos. Un usuario desconocido o una contraseña incorrecta tampoco acceden por esa vía. Las credenciales iniciales se conservan solo en memoria para la apertura y se retiran al cerrar o al activar el proyecto cifrado.

## Crear un proyecto

Entra con la cuenta de orientación del piloto, fuera de la demo, y pulsa **Administrar el proyecto**. Selecciona un Excel compatible y su hoja: **Users** para el cuestionario Wave 1, **Datos** para indicadores calculados. Elige un centro.

La aplicación procesa el conjunto completo antes de preparar los accesos. Revisa las aulas detectadas. Añade cada DNI con su letra de control y marca las aulas autorizadas. Un aula queda identificada por centro, curso y grupo: A de un curso no equivale a A de otro.

**Generar** propone dos animales y dos cifras intermedias. Puedes editar la combinación usando los animales mostrados. Se rechazan DNI duplicados, contraseñas repetidas y cuentas sin aulas. La contraseña inicial de orientación es FRJ508; puedes sustituirla antes de generar.

Revisa el resumen, pulsa **Generar proyecto protegido** y descarga el archivo. Cada cuenta abre ese mismo archivo con su propia contraseña. **Copiar acceso** copia únicamente las credenciales de esa cuenta recién creada o restablecida. Entrégalas individualmente, por un canal separado del archivo. No se exporta una tabla de contraseñas.

El proyecto protege los registros de las aulas; los agregados de centro que forman parte de los indicadores de un estudiante se mantienen. Es recomendable usar un nombre de archivo neutro porque ese nombre aparecerá en el registro de accesos si se activa.

## Modificar accesos

Abre el archivo protegido como **orientacion** y entra en la administración. Cambia las aulas, añade o elimina cuentas o sustituye el Excel por una nueva medición del mismo centro.

Una contraseña vacía en la edición conserva la existente. Para restablecerla, escribe o genera otra. El programa no puede mostrar contraseñas antiguas. Generar crea una nueva revisión del mismo proyecto, con nuevos compartimentos cifrados. Las contraseñas que no se modifican siguen funcionando en esa revisión.

Una contraseña nueva de orientación sustituye a la anterior en el archivo nuevo. No existe una contraseña alternativa universal. Si pierdes el archivo y la contraseña de orientación, esta edición no ofrece recuperación.

**Las copias anteriores no se revocan**: sin un servidor no es posible impedir que alguien abra una copia antigua con sus antiguas credenciales. Distribuye la revisión nueva y gestiona las copias anteriores conforme al procedimiento del centro.

## Qué ve cada cuenta

- Orientación consulta todo el centro y administra accesos. La cabecera dice **Equipo orientador**. No aparece marca de agua.
- Cada docente descifra únicamente los registros de sus aulas y sus relaciones entre personas autorizadas. Ni cambiar el filtro ni modificar el rol visual aporta las claves de otras aulas.
- Las pantallas docentes tienen una marca tenue con DNI parcial y código corto de sesión. Se ocultan las posiciones 2, 4, 5 y 7 del DNI.
- Los indicadores calculados para el centro se conservan. Una red restringida puede mostrar menos vínculos que el recuento recibido: ese recuento sigue incluyendo las respuestas del ámbito original.

Los nombres y apellidos son opcionales; se mantiene la abreviación habitual de apellidos. Excel y proyectos cifrados utilizan el mismo acceso y control de carga. La aplicación reconoce el formato. La demo conserva su práctica guiada.

## Formato y protección

El archivo comienza con **PBIS-PROTECTED/1**. Es diferente del antiguo .pbis, que era un Excel con otra extensión. El formato contiene JSON con bloques cifrados; no es necesario ocultar su estructura.

Se utiliza Web Crypto: AES-256-GCM con etiquetas de 128 bits, IV aleatorios de 96 bits y claves derivadas con PBKDF2-HMAC-SHA-256, 600.000 iteraciones y sales aleatorias de 128 bits. Los identificadores, claves de compartimento y credenciales de escritura se generan con la fuente criptográfica del navegador. Los datos asociados de GCM vinculan cada bloque al proyecto, revisión y finalidad.

Cada contraseña abre una autorización cifrada que contiene la clave de su compartimento. Cuentas con las mismas aulas comparten contenido cifrado, pero tienen claves de acceso independientes. Orientación conserva la configuración necesaria para volver a generar el proyecto, sin contraseñas docentes en texto ni material que permita descifrarlas directamente.

El bloque docente se prepara con una lista cerrada de campos: se excluyen los registros, nombres, códigos y vínculos individuales externos a sus aulas. Un contrato específico valida los resultados sin recalcularlos sobre el subconjunto. La validación original de Excel no se modifica.

Los localizadores de cuentas en el sobre son hashes; no prometen anonimato del DNI frente a enumeración. La longitud del archivo y el número de compartimentos también son visibles. Las contraseñas con dos animales y dos cifras tienen un espacio reducido: PBKDF2 ralentiza los intentos, pero no las hace resistentes a un ataque prolongado. **FRJ508 es conocida en el piloto y da acceso completo si se conserva.**

La marca de agua disuade y ayuda a contextualizar una captura; no impide fotografiar, copiar, modificar el navegador ni compartir credenciales. El registro identifica la cuenta utilizada, no la persona física.

## Registro de accesos opcional

Consulta [las instrucciones del receptor](https://github.com/Teoriadejuego/pbis-poc/tree/main/audit-service) (audit-service/README.md en el código fuente) para activar Google Sheets en una hoja privada. Introduce la dirección /exec del receptor en la administración. Después de generar, descarga el manifiesto y regístralo desde esa hoja. Cada revisión necesita su manifiesto.

Solo se comunica código de cuenta, proyecto y revisión, nombre del archivo, sesión, tipo de evento y hora del cliente. El receptor añade la etiqueta y el DNI parcial registrados, y su hora de recepción. No recibe nombres de estudiantes, respuestas, Excel, DNI completos ni contraseñas. El token de escritura viaja por HTTPS y se valida contra su hash registrado.

La apertura se registra después de descifrar y validar. Cada cinco minutos se comunica actividad si la consulta está visible y se ha utilizado recientemente. **Cerrar sesión** intenta confirmar el cierre. La hoja conserva **Sin cierre confirmado** si solo recibió apertura o actividad; no inventa una hora final.

Los fallos se muestran y se reintentan con conexión o durante la consulta. Las colas son solo de memoria. Cerrar sin conexión, interrumpir el navegador o apagar el equipo puede perder eventos. Al cerrar se espera brevemente la confirmación; si no llega, se informa. No hay envíos garantizados desde una aplicación offline.

Los eventos tienen identificadores estables y el receptor evita duplicados al reintentar. Una respuesta HTTP correcta sin confirmación del evento no se considera registro aceptado.

## Valoraciones y cierre

El envío de valoraciones sigue usando el recorrido existente de revisión y Formspree. Para un proyecto protegido, la cuenta enviada es un código **U-…**, nunca el DNI completo. Las valoraciones contienen códigos de estudiantes y valores del indicador revisado; son distintas del registro de accesos y no son anónimas.

No se escriben consultas, contraseñas, valoraciones o colas de accesos en localStorage, sessionStorage ni IndexedDB. Al cerrar se retiran las referencias del estado de la sesión, los diálogos y las marcas. Esto no borra el Excel original, los proyectos descargados, el portapapeles ni garantiza borrado forense de memoria, cachés del sistema o memoria virtual.

## Alcance de la verificación

Se prueban Web Crypto real, permisos separados, integridad, cambio de contraseña, conservación de indicadores y el contrato del receptor. El navegador se prueba en Edge sobre Windows, por HTTP local y file://, con anchos de 320 y 390 píxeles y almacenamiento persistente bloqueado.

Los envíos de las pruebas se interceptan: no se mandan correos ni accesos reales. Google Sheets requiere activar el receptor en la cuenta propietaria y verificar una recepción real. El funcionamiento nativo en macOS, Linux, Safari y Firefox queda pendiente de comprobación en esos equipos. Esta revisión no es una auditoría criptográfica independiente ni una certificación.

Referencias de implementación: [Web Crypto: deriveKey](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveKey), [Google Apps Script: aplicaciones web](https://developers.google.com/apps-script/guides/web).
