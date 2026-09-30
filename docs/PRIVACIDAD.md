# RADARS · Datos de la demostración y tratamiento de archivos

Versión 0.9.1 · Edición de evaluación

## Qué hace esta edición

La web presenta el producto, permite abrir una demostración y ofrece una edición descargable. La demostración `DEMO.html` incluye un ejemplo completo de 1.512 registros inventados, distribuidos en 54 grupos. Se carga automáticamente al acceder con un perfil de evaluación. Los nombres, las relaciones y los indicadores de ese ejemplo son públicos: forman parte del archivo que recibe cada navegador. No se deben incorporar datos reales ni secretos al contenido publicado.

La edición descargable `RADARS.html` no incluye el ejemplo integrado. Se abre como un archivo HTML en el equipo y después permite elegir los Excel de indicadores y llave ID–nombre por separado.

El visualizador procesa indicadores y llave ID–nombre en el navegador. Los Excel que se seleccionan en el equipo no se suben al servidor para construir las fichas. La aplicación no incorpora publicidad, fuentes remotas ni analítica de uso. Incluye un formulario opcional para opinar sobre el diseño y la utilidad de las fichas: solo transmite la opinión al pulsar enviar y cuando se ha configurado el servicio receptor. En esta entrega el envío de correo está desactivado.

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

1. En la demostración, el visualizador prepara la consulta con el ejemplo integrado. En la carga manual, lee los archivos en el navegador y, al pulsar **Abrir fichas**, valida la correspondencia por ID.
2. Al sustituir un archivo, la vista anterior debe invalidarse antes de usar la nueva combinación.
3. Al cerrar sesión, se retiran las fichas y los datos del estado activo de la aplicación.
4. Al cerrar la pestaña, termina esa instancia del visualizador.

La aplicación no modifica ni borra los Excel originales. El ejemplo integrado sigue disponible dentro del archivo público de la demostración después de cerrar sesión. Tampoco se borran capturas, archivos copiados, descargas previas ni otras instancias abiertas. No se garantiza sobrescritura de memoria, borrado forense, eliminación de la memoria virtual ni eliminación de información guardada por el sistema o por extensiones.

## Opiniones voluntarias sobre las fichas

Una opinión contiene diez campos: valoración de 1 a 5, comentario opcional, tipo de ficha (grupo o individual), rol general, código aleatorio de sesión, identificador de opinión, fecha, versión, clave del aula y clave del estudiante. La clave del estudiante es el ID del Excel conservado como texto; en las opiniones de grupo queda vacía. El diálogo muestra las claves antes de guardar o enviar. No se incorporan cuenta, contraseña, nombres, etiquetas de centro, curso o grupo, capturas, archivos ni medidas de los indicadores.

El código de sesión cambia en cada nuevo inicio de sesión y no deriva del nombre de usuario. Las claves de aula y estudiante son estables para poder relacionar las opiniones con sus fichas. Por ello, las opiniones están **seudonimizadas, no anonimizadas**: quien dispone de los archivos y de la llave puede vincularlas con personas y aulas.

Para el aula se utiliza `ID_aula` de la hoja `Grupos` cuando está disponible. Si falta, se deriva una clave mediante SHA-256 de los textos de centro, curso y grupo; no se modifican los Excel. Esa derivación no cifra los datos ni impide que alguien que conozca las posibles combinaciones reproduzca la clave. Utiliza códigos de origen que no contengan nombres u otros identificadores directos.

El comentario es texto libre: no incluyas nombres ni información adicional que permita reconocer a una persona. El rol o el contexto también pueden facilitar la identificación de quien escribe. La aplicación no anonimiza automáticamente lo escrito.

Sin receptor configurado, la aplicación permite guardar las opiniones en un Excel independiente con las columnas `Clave_aula` y `Clave_estudiante`. Con el servicio activado, el envío voluntario registra la opinión y ambas claves, y notifica a `pbis_usuario@outlook.es` a través del proveedor de correo configurado. El correo incluye un Excel con esa opinión. No se utiliza la cuenta personal de correo de quien comenta para enviarla. Las fichas siguen disponibles sin Internet; el envío requiere conexión.

Las opiniones solo presentes en memoria desaparecen al finalizar la sesión. Las copias exportadas, la base del receptor y los mensajes de correo permanecen hasta que sus responsables los eliminen. Define acceso, conservación y eliminación para esas ubicaciones; cerrar RADARS no las borra.

La tabla de opiniones no registra IP ni cabeceras del navegador. El alojamiento, los intermediarios de red y el proveedor de correo pueden tratar metadatos técnicos de las conexiones y mensajes; deben incluirse en la revisión del despliegue. La aplicación no instala identificadores persistentes de seguimiento. Consulta `OPINIONES.md` para activar el servicio y revisar su alcance.

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
