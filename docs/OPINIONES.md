# Valoraciones de PBIS

En la **Lista de clase**, pulsa el valor de un indicador para mostrar las reacciones **OK**, **Revisar** o **Me sorprende**. Solo se conserva una reacción por indicador y estudiante; pulsar otra la sustituye y repetir la misma la quita. La opción elegida queda indicada con texto. Al final de cada fila, el control de **confianza en los datos** va de −5 a +5 en décimas. El cero marcado es una valoración neutral; «Sin valorar» significa que no se ha usado el control. Estas apreciaciones no modifican los datos del cuestionario.

El botón **Valorar esta ficha** permite añadir una puntuación de utilidad de 1 a 5 y un comentario opcional. Hay que pulsar **Añadir a esta sesión** para incluirlo en el resumen de cierre. No escribas nombres ni otros datos personales en el comentario.

## Envío al cerrar sesión

Al pulsar **Cerrar sesión**, la aplicación prepara un solo resumen con el usuario de acceso, el rol, un código aleatorio de sesión, las reacciones, las puntuaciones de confianza y las opiniones de ficha añadidas. Lo envía a `https://formspree.io/f/mvkgydrn`. El formulario debe estar configurado para notificar a `pbis_usuario@outlook.es`; Formspree confirma el registro, pero no garantiza la entrega final del aviso por correo. No se envían los Excel, los nombres de la llave ni los valores medidos de los indicadores.

El aula se identifica con `ID_aula` cuando existe o con un código derivado. El código de estudiante enviado se obtiene con SHA-256 del código de aula y el ID. Es una **seudonimización**, no cifrado ni anonimato: se puede reconstruir la correspondencia con los archivos de origen. El texto libre puede contener información identificativa si quien lo escribe la introduce.

La aplicación espera la respuesta de Formspree antes de vaciar la sesión. Si no se confirma, mantiene los resultados y ofrece **Reintentar cierre**, **Guardar resumen local** y **Cerrar sin enviar**. Un reintento puede duplicar el registro si Formspree lo recibió pero se perdió la respuesta; el identificador de cierre permanece igual para reconocer posibles copias. El envío necesita conexión. Cerrar la pestaña, perder la conexión o dejar caducar la sesión no garantiza el envío.

Para no perder valoraciones pendientes, la app pide cerrar sesión antes de sustituir los archivos. Las valoraciones solo residen en la memoria de esta sesión hasta el envío o el cierre. Formspree, el correo y cualquier resumen descargado tienen su propia conservación y controles de acceso.
