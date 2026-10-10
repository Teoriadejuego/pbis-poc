# Cómo leer PBIS

## Dos formatos de entrada

**Users (Wave 1):** se interpretan los recorridos Par/Impar y se calculan los indicadores en el navegador. Las nominaciones abarcan todo el centro identificado por su código de estudio. Las autoselecciones se excluyen de amistad, rechazo y mediación; la autoselección en acoso define «Se señala».

**Datos (indicadores):** se validan y muestran los valores suministrados. No se inventan respuestas o relaciones ausentes. El diccionario del archivo debe explicar su método y ámbito de cálculo.

## Relaciones y cobertura

Popularidad, sociabilidad, rechazo recibido, rechazo declarado y mediación positiva: nominaciones / (estudiantes del ámbito − 1) × 10. En Wave 1 el ámbito es el centro; en el ejemplo clásico de indicadores es la clase. Las escalas no son percentiles ni comparaciones con una población externa.

Reciprocidad: elecciones correspondidas / elecciones emitidas × 10. Acierto de predicciones: predicciones correctas / predicciones emitidas × 10. Sin elecciones o predicciones, la proporción se muestra como **No aplicable**.

Las medidas de red usan los vínculos observados. Cuando faltan respuestas relacionales se indica el porcentaje de la red pendiente; los resultados pueden cambiar cuando se complete. Una ausencia no se convierte en una respuesta negativa. La centralidad describe la posición estructural y no es un juicio sobre la persona.

La red individual representa nominaciones entrantes y salientes; el color distingue amistad y rechazo, y el grosor su intensidad. El detalle de cada relación permite comprobar la dirección. Si el archivo solo contiene recuentos, no se puede reconstruir quién nombró a quién.

La presentación sigue la red de ISAT: estudiante en el centro, tarjetas alrededor y dos flechas separadas cuando hay nominaciones en ambos sentidos. Azul indica buena o muy buena relación; rojo, mala o muy mala. Las categorías «Muy» tienen mayor grosor. Las tarjetas muestran nombre con apellidos abreviados, o código si no hay nombre, y abren la ficha correspondiente. Un borde discontinuo distingue otras clases. Los controles +, − y Ajustar amplían el dibujo, incluso en móvil. No se muestran personas fuera del alcance del perfil. Esta visualización no cambia los recuentos ni utiliza predicciones como relaciones observadas.

La centralidad de eigenvector se calcula sobre la red positiva observada, sin dirección. El cálculo itera hasta estabilizarse, con un máximo de 20.000 pasos; si no converge, se muestra pendiente en vez de presentar una aproximación sin verificar. La centralidad puede cambiar al incorporar respuestas o conectar componentes de la red.

## Bienestar y test

Felicidad: experiencia en el centro y diversión (0–4), más soledad invertida (4 − respuesta). La suma de 0 a 12 se expresa de 0 a 10. Las tres respuestas originales se muestran sin invertir. El índice requiere las tres respuestas válidas.

El **Test de impulsividad** presenta únicamente el total de aciertos de las tres preguntas CRT, de 0 a 3, y la media de respuestas completas de la clase. En esta exportación las respuestas correctas son segundo lugar, Emilia y día 47. Una prueba incompleta se muestra sin puntuación. No permite diagnosticar impulsividad ni clasificar capacidades.

## Centro y clase

Los porcentajes de respuestas personales usan solo las respuestas válidas. Se distingue la respuesta personal sobre acoso de las nominaciones de otras personas: pueden referirse al mismo estudiante y no se suman.

Desde PBIS 0.10.8, el recuento de señalamientos recibidos excluye todas las nominaciones emitidas por quienes señalan a **más de 15 personas distintas**, sin contar la autoselección para ese límite. Se admiten de 0 a 15 nominaciones a otras personas; con 16 o más se descartan todas las nominaciones a pares de esa respuesta. El filtro se aplica en todo el centro, antes de seleccionar clase o perfil. Se conserva el autorreporte, los demás indicadores y el registro del estudiante.

El **reconocimiento de acoso por pares** cuenta estudiantes que reciben **2 o más nominaciones válidas de personas distintas**. En centro y clase, el porcentaje es ese recuento dividido por los estudiantes con recuento recibido conocido en el ámbito, multiplicado por 100. El denominador no se limita a quienes emiten respuestas admitidas. En la lista y la ficha individual se conserva el número recibido, incluido 1; ese caso no entra en el numerador de los resúmenes. La ficha individual conserva las señales descriptivas del recuento recibido y del autorreporte por separado. Las nominaciones recibidas no tienen un máximo de 15.

Si no queda ninguna respuesta admisible, el recuento aparece como Sin datos. Las fichas indican cuántas respuestas se han excluido en el centro. Estos criterios sustituyen al límite anterior de 3 y al mínimo de 1 recibido. Son reglas de análisis de este piloto, no un diagnóstico ni una prueba de que las respuestas excluidas sean falsas.

El filtro de emisores se aplica al importar respuestas originales de la hoja Users. Los archivos Datos y la demo clásica contienen recuentos ya calculados: se aplica el mínimo de 2 recibidas, pero no se les atribuye el filtro de emisores sin regenerarlos desde las nominaciones originales. Las escalas normalizadas de reconocimiento por pares se recalculan desde los recuentos; las posiciones comparativas antiguas de ese indicador no se reutilizan con el nuevo criterio.

En este cuestionario Wave 1, una lista de acoso vacía se interpreta como **Nadie** si hay una respuesta posterior a frecuencia, posibilidad de detener el acoso, conductas o mediación: avanzar requería responder a acoso. Una marca horaria de entrada, por sí sola, no confirma una respuesta. Sin lista ni respuesta posterior, el dato queda pendiente y se excluye del denominador. La autoselección exige que coincida el ID completo, no una parte del código.

Una respuesta que contiene **Error en relación** es un error de exportación. Esa pregunta queda pendiente, sin asignar categorías a sus nominaciones; se conservan las demás preguntas del registro y las fichas muestran el aviso. Los vínculos válidos recibidos de otras personas siguen contando. Las respuestas explícitas no se descartan por faltar su marca horaria de entrada.

Mediación positiva cuenta estudiantes con al menos una nominación por buena o muy buena mediación. Mediación negativa cuenta estudiantes con al menos una nominación por mala o muy mala mediación. Una persona puede figurar en ambos recuentos.

La densidad de rechazo usa los vínculos posibles de emisores con respuesta conocida, según el ámbito del archivo. Las comunidades de clase agrupan amistades recíprocas conectadas; varias comunidades no implican conflicto. La ficha de centro omite «Grupos e integración», que no debe extrapolarse desde una clase.

## Ejemplo incorporado

La demo contiene 1.512 estudiantes simulados, 54 clases, nueve cursos y dos centros. Los recuentos proceden de relaciones sintéticas reproducibles; las barras dependen de esos recuentos. Las tres respuestas de bienestar reconstruyen exactamente su suma y el indicador de soledad. El CRT de ejemplo es simulado y toma valores 0–3. Las relaciones de la demo coinciden con su hoja Relaciones.

## Interpretación

Las fichas apoyan la escucha y la revisión profesional. No diagnostican acoso ni generan decisiones disciplinarias. Antes de utilizar indicadores para decisiones reales, se requiere validación metodológica independiente y un protocolo de interpretación y actuación.
