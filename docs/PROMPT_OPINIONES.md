# RADARS · Prompts para la mejora de opiniones

Versión 0.9.1 · Alcance de esta implementación

## 1. Producto e interacción

Añade una forma discreta de opinar sobre las fichas de RADARS. Un botón pequeño, visible junto a la ficha del grupo o individual, abrirá un diálogo accesible con una valoración obligatoria de 1 a 5 y un comentario opcional de hasta 1.500 caracteres. Usa un lenguaje cercano y preciso. Permite cerrar sin enviar, navegar con teclado y recuperar el foco. Adapta la presentación a escritorio y móvil; el botón no debe tapar datos ni competir con los filtros.

La opinión se refiere al tipo de ficha: grupo (`group` en el contrato técnico) o individual (`individual`). Incluye la clave del aula y, en la ficha individual, la clave del estudiante. Fija ese contexto al abrir el diálogo y muestra ambas claves antes de guardar o enviar. No adjuntes nombres, etiquetas de centro, curso o grupo, capturas, archivos ni valores de los indicadores. Incluye el recordatorio «No escribas nombres ni datos personales en el comentario».

## 2. Datos mínimos y autonomía

Conserva únicamente estos diez campos de la opinión: `eventId`, `sessionCode`, `role`, `sheet`, `classCode`, `studentCode`, `rating`, `comment`, `version` y `date`. El identificador de opinión y el código de sesión serán aleatorios. El código de sesión cambia tras cada nuevo inicio de sesión y no deriva del nombre de usuario ni de la contraseña. El rol se presenta como tutoría u orientación, según el perfil existente; conserva los valores técnicos `tutor` y `orientador`. No guardes identificadores de seguimiento en cookies, localStorage ni otros mecanismos persistentes.

`studentCode` será el ID del estudiante del Excel, conservado como texto, incluidos ceros iniciales; en opiniones de grupo será `null`. Para `classCode`, utiliza el `ID_aula` de la hoja `Grupos` cuando esté disponible. Si no lo hay, calcula SHA-256 de `JSON.stringify([Campus, Curso, Grupo])`, conserva los primeros 24 caracteres hexadecimales y añade el prefijo `AULA-`. Esta clave será estable mientras los textos de entrada no cambien. No modifiques el libro de indicadores para generarla. Valida los códigos antes de enviar y no sustituyas un ID inválido por el nombre del estudiante.

Describe estas opiniones como **seudonimizadas**: las claves permiten a quien dispone de los archivos y la llave vincularlas a un aula o estudiante. El hash del aula no cifra sus etiquetas ni garantiza anonimato irreversible. La persona que prepara los archivos debe utilizar claves que no incluyan nombres u otros identificadores directos.

Mantén la lectura de los Excel y la construcción de las fichas dentro del navegador. Pasa al módulo de opiniones únicamente el rol, el tipo de ficha y las dos claves permitidas; no le entregues el conjunto de estudiantes ni la llave. No hagas peticiones de red al abrir fichas, votar o escribir. Solo el acto explícito de enviar autoriza la transmisión de la opinión seudonimizada al servicio configurado.

Cuando no exista servicio configurado o no haya conexión, permite guardar las opiniones en un Excel independiente con una hoja `Opiniones` de diez columnas como máximo, incluidas `Clave_aula` y `Clave_estudiante`. No modifiques los libros originales. Explica si la opinión se ha guardado localmente, si está pendiente o si el servicio la ha registrado. No uses un enlace `mailto:` como alternativa porque expondría la cuenta del remitente. No prometas anonimización automática del texto libre ni de las claves.

## 3. Servicio de recepción y correo

Prepara un servicio pequeño en Node.js 24 con almacenamiento SQLite privado y persistente. Recibirá únicamente el contrato de datos permitido, rechazará campos adicionales, puntuaciones inválidas, comentarios demasiado largos y cargas excesivas. Aplica consultas parametrizadas, límites de frecuencia y deduplicación por identificador de opinión. Las exportaciones deben tratar los comentarios como texto y evitar fórmulas ejecutables en hojas de cálculo.

Guarda primero la opinión y después solicita el envío de la notificación mediante Resend, con un Excel adjunto de una sola opinión en la hoja `Opiniones`. El destinatario será siempre `pbis_usuario@outlook.es`, fijado en el servidor y no aceptado como parámetro del cliente. El mensaje identificará el rol, código aleatorio de sesión, tipo de ficha y claves de aula y estudiante correspondientes. No añadirá nombres ni identificará la cuenta de quien escribe. Distingue entre registro guardado, correo solicitado al proveedor y fallo de correo. Un reintento no debe duplicar la opinión ni provocar envíos repetidos evitables.

La clave de Resend, el remitente y las credenciales de administración permanecerán en el servidor, fuera del HTML, del repositorio público y de los ZIP descargables. El servicio no publicará sus hojas ni su base de datos. Usa HTTPS en producción y permite en la política de red de la aplicación únicamente el destino configurado. No actives telemetría ni guardes direcciones IP o cabeceras de usuario en la tabla de opiniones. Documenta que los proveedores de red y correo pueden procesar metadatos técnicos.

## 4. Activación y entrega

Entrega el código del servicio, configuración de ejemplo sin secretos, pruebas con un proveedor de correo simulado y una guía de activación en cuatro pasos: desplegar el servicio con almacenamiento persistente, configurar Resend y un remitente de dominio verificado, definir `FEEDBACK_ENDPOINT` al construir el visualizador y regenerar las descargas. Explica que las fichas siguen funcionando sin Internet, mientras que el envío automático requiere conexión y el servicio activado.

No publiques el servicio ni envíes correos reales durante la implementación. La entrega debe funcionar sin configuración mediante el Excel de opiniones separado. Actualiza los textos de privacidad y las instrucciones para que la promesa de uso local sea compatible con este envío opcional.

## 5. Revisión antes de entregar

Revisa la claridad del botón, los estados de envío, la accesibilidad y la presentación en pantalla estrecha. Comprueba las dos clases de ficha, valoración sin comentario, límites, cancelación, nueva sesión, cierre y ausencia de persistencia oculta. Inspecciona el contenido exacto de la petición y de la hoja exportada: deben incluir únicamente los diez campos permitidos, sin nombres, usuario, etiquetas de centro, curso o grupo ni indicadores. Comprueba un ID como `00017`, el uso de `ID_aula`, la estabilidad de la clave de aula derivada y `studentCode: null` en grupo. Cambiar la selección de estudiante no debe atribuir la nueva opinión a la ficha anterior.

Prueba servicio sin configurar, fallo de red, rechazo de validación, envío registrado, fallo del proveedor y reintento. Comprueba que ningún mensaje afirme que el correo llegó al buzón cuando solo se conoce la aceptación del proveedor. Revisa que los secretos de ejemplo sean marcadores y que los ZIP no incluyan bases de datos, opiniones reales ni archivos `.env`.

La descripción del resultado debe distinguir lo implementado, lo probado mediante simulación y lo que queda pendiente de activar en el alojamiento elegido.
