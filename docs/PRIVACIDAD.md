# PBIS · Datos de la demostración y tratamiento de archivos

Versión 0.9.1 · Edición de evaluación

## Qué hace esta edición

La web presenta el producto, permite abrir una demostración y ofrece una edición descargable. La demostración `DEMO.html` incluye un ejemplo completo de 1.512 registros inventados, distribuidos en 54 grupos. Solo se activa al pulsar **Cargar ejemplo** después de acceder con un perfil de evaluación. Iniciar sesión, incluido el acceso **Probar con orientación**, no carga datos ni muestra fichas. Los nombres, las relaciones y los indicadores de ese ejemplo son públicos: forman parte del archivo que recibe cada navegador. No se deben incorporar datos reales ni secretos al contenido publicado.

La edición descargable `PBIS.html` no incluye el ejemplo integrado. Se abre como un archivo HTML en el equipo y después permite elegir los Excel de indicadores y llave ID–nombre por separado.

El visualizador procesa indicadores y llave ID–nombre en el navegador. Los Excel que se seleccionan en el equipo no se suben al servidor para construir las fichas. La aplicación no incorpora publicidad, fuentes remotas ni analítica de uso. Las valoraciones del profesorado se envían a Formspree al pulsar «Cerrar sesión»; los Excel utilizados para construir las fichas no se transmiten.

Visitar una web sí requiere descargar sus páginas y recursos desde el alojamiento. Si se publica con GitHub Pages, ese alojamiento y la infraestructura de red pueden tratar metadatos técnicos de la conexión, como la dirección IP, la hora o el recurso solicitado. El procesamiento de las fichas en el navegador no significa que la visita carezca de conexiones de red. La edición descargada puede abrirse sin conexión una vez guardada en el equipo.

Estas afirmaciones describen la aplicación entregada. No describen el comportamiento de extensiones del navegador, programas de supervisión, copias de seguridad o servicios instalados por terceros en el equipo.

## Dos archivos, funciones distintas

| Archivo | Contenido | Finalidad |
|---|---|---|
| Indicadores | ID, centro, curso, grupo y medidas | Describir resultados sin incluir el nombre en esa tabla |
| Llave | ID y nombre | Permitir que la persona autorizada identifique a cada estudiante |
| Perfiles de evaluación | Usuarios, alcance y claves de prueba | Documentar el acceso de la demostración |

Un ID que puede vincularse a una persona mediante una llave no convierte los datos en anónimos. Mientras exista posibilidad de reidentificación, la separación debe formar parte de una gestión más amplia de permisos y custodia.

Los Excel se distribuyen fuera del paquete de la edición local. Su ubicación, sus copias y sus permisos de acceso dependen de quien los custodia. La demostración pública ya contiene una copia del ejemplo inventado en su propio archivo; esta excepción solo sirve para la prueba de concepto.

## Qué ocurre durante y después de la sesión

1. En la demostración, el visualizador prepara la consulta con el ejemplo integrado solo al pulsar **Cargar ejemplo**. En la carga manual, lee los archivos en el navegador y, al pulsar **Abrir consulta**, valida la correspondencia por ID.
2. Al sustituir un archivo, la vista anterior debe invalidarse antes de usar la nueva combinación.
3. Al cerrar sesión, se retiran las fichas y los datos del estado activo de la aplicación.
4. Al cerrar la pestaña, termina esa instancia del visualizador.

La aplicación no modifica ni borra los Excel originales. El ejemplo integrado sigue disponible dentro del archivo público de la demostración después de cerrar sesión. Tampoco se borran capturas, archivos copiados, descargas previas ni otras instancias abiertas. No se garantiza sobrescritura de memoria, borrado forense, eliminación de la memoria virtual ni eliminación de información guardada por el sistema o por extensiones.

## Valoraciones y correo

Las reacciones por indicador, la confianza en los datos y las opiniones de fichas permanecen en la memoria de la sesión. No modifican los Excel cargados. Antes de sustituir los archivos, la aplicación pide cerrar sesión para enviar las valoraciones pendientes.

Al pulsar «Cerrar sesión», se envía a Formspree un resumen con el **usuario de acceso**, el rol, un código aleatorio de sesión, las claves de aula y estudiante, las reacciones, la confianza y los comentarios añadidos. El formulario está previsto para avisar a `pbis_usuario@outlook.es`. La confirmación de Formspree acredita el registro, no la entrega del aviso. El cierre de la pestaña o la caducidad por inactividad no garantizan el envío.

No se incorporan automáticamente nombres de la llave, los valores numéricos de los indicadores ni los Excel. La clave de estudiante enviada se deriva con SHA-256 del código de aula y el ID original. Es seudonimización, no anonimato ni cifrado: quien tenga los archivos de origen puede reconstruir la correspondencia. El texto libre podría contener datos personales si quien comenta los escribe; evita incluir nombres.

Si falla el envío, la sesión sigue abierta para reintentar o guardar un resumen local. También se puede cerrar sin enviarlo. Un reintento puede generar una copia adicional si se perdió la respuesta del servicio. Formspree, el correo y cualquier archivo descargado requieren sus propias medidas de acceso, conservación y eliminación. La aplicación no garantiza borrado forense de la memoria ni de archivos externos.
## Qué protegen los perfiles

Las cuentas de esta evaluación filtran la interfaz según el alcance asignado. Todas usan la contraseña `1234`, indicada en la hoja de perfiles. En la demostración se ofrece además un acceso directo con orientación. Estas opciones sirven para comparar recorridos dentro de un ejemplo público.

**No son un mecanismo de confidencialidad frente a quien dispone del paquete y de los archivos.** En una aplicación local de JavaScript, quien controla su equipo puede inspeccionar o modificar el código y los datos que le haya entregado. Ocultar una pestaña o filtrar un selector no sustituye el cifrado, la compartimentación de los archivos o una autorización aplicada en un entorno controlado.

No distribuyas un archivo que contenga más datos de los que la persona está autorizada a recibir confiando únicamente en los filtros del visualizador. La hoja de claves común es material de evaluación, no un directorio de secretos para producción.

## Controles pendientes para un uso real

- Definir qué personas reciben cada conjunto de datos y cada llave; limitar ambos a su alcance autorizado.
- Sustituir credenciales compartidas por un mecanismo de autorización acorde con la distribución local elegida.
- Decidir e implementar la protección criptográfica de paquetes y claves si el modelo de custodia lo requiere. Esta edición no cifra los Excel.
- Establecer almacenamiento, transmisión, copia, conservación, recuperación y eliminación de los archivos.
- Evaluar los riesgos del equipo, sesiones abiertas, extensiones, capturas y acceso físico.
- Revisar la información a las personas participantes y las responsabilidades del centro y de los proveedores según el contexto de uso.
- Validar las medidas, los criterios de interpretación y el protocolo de actuación por profesionales responsables.

Estos puntos necesitan decisiones documentadas y comprobaciones. La ejecución local, por sí sola, no implica aprobación ética ni cumplimiento normativo. La edición no incorpora certificaciones ni garantías de ausencia total de riesgo.


## Recepción con Formspree

El formulario público recibe el resumen de cierre y gestiona el aviso al buzón configurado. El mensaje contiene el usuario de acceso y códigos de referencia, reacciones y comentarios. No incluye los Excel ni los nombres de la llave. Sus registros y los correos permanecen tras cerrar PBIS; el cierre local no los elimina. Consulta OPINIONES.md para el contenido exacto y los límites de confirmación y reintento.
## Consulta por códigos y archivo .pbis

Solo los indicadores son obligatorios. Sin llave ID–nombre las fichas muestran Estudiante y su código, nunca nombres tomados del archivo de indicadores. La llave Excel es opcional y debe corresponder exactamente a los ID de los indicadores; no se ignoran errores de una llave cargada. El botón Retirar llave permite volver a consultar por códigos y elimina los nombres de la vista.

Los indicadores se entregan como datos_evaluacion.pbis: conserva exactamente los bytes del Excel original y solo cambia su extensión. La aplicación lo lee directamente en memoria. No se cifra, ofusca ni modifica el archivo original. Para preparar uno, cambia .xlsx por .pbis; los nombres siguen en la llave separada. También se admiten los indicadores .xlsx y .xls por compatibilidad.
