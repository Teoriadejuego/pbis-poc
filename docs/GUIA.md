# Guía de PBIS · 0.10.15

## Prueba sin preparar nada

Pulsa **Comenzar práctica guiada**. La simulación te muestra la cuenta y contraseña para entrar y espera a que pulses **Cargar datos demo**. Recorre centro, aula, lista y fichas de estudiante paso a paso; puedes saltar directamente al ejercicio de valoración.

Los centros ficticios son **Centro 3705** y **Centro 3884**. El ejercicio utiliza **Centro 3705 → 1.º ESO → A**, siempre con los mismos datos.

La demo incluye siempre el mismo caso: Samuel no declara haber sufrido acoso, pero recibe menciones de acoso de otras personas. Esa diferencia sirve para aprender a contrastar las fuentes y marcar **Me sorprende**, sin convertirla en un diagnóstico.

Las reacciones, la confianza y los comentarios de la demo son de práctica: no se envían y se eliminan al salir. El botón **Acceder con mi cuenta** termina la demo.

## Consulta con un archivo

1. Entra con la cuenta y contraseña que te facilite orientación. Orientación ve todos los cursos; las cuentas de tutoría por curso ven todas sus aulas. Las cuentas PDC I (3.º ESO) y PDC II (4.º ESO) ven solo ese curso y aula, en los centros cargados.
2. Selecciona el archivo .pbis, .xlsx o .xls. Elige **Users** si es una exportación Wave 1, o **Datos** si contiene indicadores ya calculados.
3. Pulsa **Abrir consulta**. Los nombres se leen del propio archivo; se muestran con iniciales de los apellidos. Si no hay nombres, se muestran códigos. No hace falta una llave adicional.
4. Elige centro, curso y aula. Orientación dispone también de **Ficha de centro** y **Cuentas y contraseñas**, donde puede consultar y repartir las contraseñas de evaluación.

## Términos de la consulta

| Concepto | Término utilizado |
|---|---|
| Organización del centro | Centro → Curso → Aula; por ejemplo, 1.º ESO A |
| Agrupaciones detectadas en la red de un aula | Comunidades de relaciones |
| Índice de las tres respuestas personales | Bienestar; Soledad es una de sus preguntas |
| Relación buena o muy buena | Buenas relaciones |
| Relación mala o muy mala | Malas relaciones |
| Dirección de las relaciones | Declaradas, recibidas o mutuas |
| Respuesta personal sobre acoso | Declara haber sufrido acoso |
| Recuento de menciones de otras personas sobre acoso | Menciones de acoso recibidas |
| Valoración de la mediación | Buena mediación o mala mediación |
| Posición del estudiante / concentración en el aula | Centralidad / Centralización del aula; son medidas distintas |
| Resultado de las tres preguntas CRT | Test de impulsividad |
| Revisión de los indicadores por el profesorado | Valoración de los datos; Confianza en los datos |
| Utilidad y presentación de la ficha | Opinión sobre la ficha |
| Acceso e identificación | Cuenta, Contraseña y Código de estudiante |

## Lee, contrasta y valora

Los filtros siguen **Centro → Curso → Aula**. **Buenas relaciones** incluye las respuestas buena y muy buena; **Malas relaciones**, mala y muy mala. Las categorías «muy» son subconjuntos, no cantidades adicionales. **Bienestar** es el índice conjunto; **Soledad** es una de sus tres respuestas, no otro nombre para ese índice.

- **Ficha de centro o aula:** empieza por acoso, bienestar y relaciones. Abre **Ver más indicadores** para ampliar. El centro muestra solo medidas que pueden calcularse para ese ámbito.
- **Lista de aula:** pulsa un encabezado para ordenar; vuelve a pulsarlo para invertir el orden. Pulsa un dato para marcar **OK**, **Revisar** o **Me sorprende**. Repetir la misma reacción la retira.
- **Confianza en los datos:** va de −5 (muy baja) a +5 (muy alta). Cero es intermedia; **Sin valorar** significa que todavía no has respondido. No modifica el cuestionario.
- **Ficha de estudiante:** pulsa el nombre o código. El resumen empieza por señales de acoso, bienestar y relaciones. **Ver más indicadores** abre posición, mediación, test de impulsividad, predicciones y red de relaciones cuando el archivo los permite.

Un cero es un resultado conocido. **Sin datos** indica que falta información. **No aplicable** se utiliza cuando una proporción no está definida, por ejemplo, buenas relaciones mutuas sin relaciones declaradas. Si la red está incompleta, se indica el porcentaje pendiente.

En la **Red de relaciones**, el estudiante aparece en el centro. Las tarjetas muestran nombres abreviados o códigos y abren la ficha correspondiente. Azul indica una buena relación; rojo, mala relación. Las flechas salen de quien nombra y su grosor distingue las categorías «Muy». Un borde discontinuo señala otra aula. Usa **+**, **−** y **Ajustar**; en móvil puedes desplazar el dibujo ampliado dentro del cuadro. Solo aparecen personas accesibles para tu perfil.

En la **Ficha de aula → Ver más indicadores**, al final, encontrarás **¿Cómo se relaciona el aula?**. Todos sus estudiantes se disponen en círculo, ordenados desde arriba por menciones de buenas relaciones recibidas de mayor a menor. El dibujo muestra solo las relaciones entre integrantes de esa aula; el orden conserva el ámbito del indicador del archivo. **Destacar estudiante** resalta sus flechas sin quitar al resto. Pulsa un nombre para abrir su ficha y usa el zoom para leer la red. Aquí el borde discontinuo indica falta de respuesta de relaciones, no ausencia de vínculos recibidos.

Pulsa **Ver comunidades** para separar y colorear a los estudiantes según sus comunidades de relaciones. **Ver círculo** recupera el diseño inicial. Los colores de los estudiantes identifican comunidades; las flechas mantienen azul para buenas relaciones y rojo para malas relaciones. Se conservan las comunidades ya calculadas, los vínculos, el acceso a las fichas y el estudiante destacado. Si faltan asignaciones, se indica **Sin comunidad asignada**; si no hay ninguna, el botón permanece desactivado. Estas comunidades no son las aulas A, B o C.

La práctica termina enseñando a pulsar **Cerrar sesión**: así se envían al equipo PBIS los comentarios y valoraciones cuando utilizas tu cuenta. Espera la confirmación antes de cerrar la pestaña. En la demo se ensaya ese cierre sin enviar comentarios; solo después de pulsar el botón se confirma la finalización.

## Termina la consulta

En una consulta con cuenta, **Revisar envío** muestra el contenido y permite guardar una copia JSON. **Enviar valoraciones y cerrar** envía las valoraciones por Formspree y espera su confirmación. Si falla, puedes reintentar, guardar una copia JSON o cerrar sin enviar. Cerrar la pestaña no garantiza el envío.

Pulsar el logotipo **PBIS** hace el mismo cierre y vuelve a la página principal. Si el envío falla, conserva la consulta hasta que decidas cómo continuar. En la demo no se envía nada.

## Edición descargable

Extrae el ZIP y abre **index.html**. Incluye demo, práctica guiada y acceso a archivos; no necesita instalar R ni Docker. La consulta funciona sin conexión. El envío de valoraciones sí necesita Internet.

Los cuatro ZIP contienen el mismo visualizador HTML. Las comprobaciones realizadas y los límites de compatibilidad están en COMPROBACIONES.md.

## Encuestas sin responder

La lista resalta con un fondo pastel grisáceo y con «No ha respondido» los registros cuyo estado de respuesta es No. Una encuesta parcial o con estado desconocido no se marca como ausencia. Se conservan las menciones recibidas de otras personas.

En esas filas, el desplegable **Motivo de no participación** sustituye al control de confianza:

- Sin consentimiento registrado.
- Ausencia el día de la encuesta.
- Ausencia prolongada.
- Traslado a otro centro.
- Otro motivo: requiere un texto de hasta 300 caracteres antes de enviar.

No se asigna un motivo automáticamente. Volver a «Seleccionar motivo» retira la anotación. Cambiar de motivo elimina el texto de Otro. El motivo se conserva en esta sesión y acompaña al código del estudiante en el resumen de cierre; no modifica las respuestas del archivo. Las anotaciones de la demo no se envían.
