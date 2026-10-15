# Cómo leer PBIS

## Dos formatos de entrada

**Users (Wave 1):** se interpretan los recorridos Par/Impar y se calculan los indicadores en el navegador. Las menciones abarcan todo el centro identificado por su código de estudio. Las autoselecciones se excluyen de buenas relaciones, malas relaciones y mediación; la autoselección en acoso define «Declara haber sufrido acoso».

**Datos (indicadores):** se validan y muestran los valores suministrados. No se inventan respuestas o relaciones ausentes. El diccionario del archivo debe explicar su método y ámbito de cálculo.

## Relaciones y cobertura

**Buenas relaciones** incluye «buena» y «muy buena relación». **Muy buenas relaciones** es un subconjunto y no se suma de nuevo al total. **Malas relaciones** incluye «mala» y «muy mala relación», con el mismo criterio. Las relaciones declaradas son las que indica el estudiante; las recibidas, las que indican otras personas sobre él; las mutuas son las declaradas en ambos sentidos.

La organización es **centro → curso → aula** (por ejemplo, 1.º ESO A). Las **comunidades de relaciones** son agrupaciones detectadas en la red dentro de un aula; no son las aulas A, B y C.

Buenas relaciones recibidas y declaradas, malas relaciones recibidas y declaradas, y buena mediación: menciones / (estudiantes del ámbito − 1) × 10. En Wave 1 el ámbito es el centro; en el ejemplo clásico de indicadores es el aula. Las escalas no son percentiles ni comparaciones con una población externa.

Relaciones mutuas (reciprocidad): relaciones declaradas en ambos sentidos / relaciones declaradas × 10. Acierto de predicciones: predicciones correctas / predicciones emitidas × 10. Sin elecciones o predicciones, la proporción se muestra como **No aplicable**.

Las medidas de red usan los vínculos observados. Cuando faltan respuestas relacionales se indica el porcentaje de la red pendiente; los resultados pueden cambiar cuando se complete. Una ausencia no se interpreta como respuesta «No». La centralidad describe la posición estructural y no es un juicio sobre la persona.

La red de estudiante representa menciones entrantes y salientes; el color distingue buenas y malas relaciones, y el grosor su intensidad. El detalle de cada relación permite comprobar la dirección. Si el archivo solo contiene recuentos, no se puede reconstruir quién nombró a quién.

La presentación sigue la red de ISAT: estudiante en el centro, tarjetas alrededor y dos flechas separadas cuando hay menciones en ambos sentidos. Azul indica buena o muy buena relación; rojo, mala o muy mala. Las categorías «Muy» tienen mayor grosor. Las tarjetas muestran nombre con apellidos abreviados, o código si no hay nombre, y abren la ficha correspondiente. Un borde discontinuo distingue otras aulas. Los controles +, − y Ajustar amplían el dibujo, incluso en móvil. No se muestran personas fuera del alcance del perfil. Esta visualización no cambia los recuentos ni utiliza predicciones como relaciones observadas.

La centralidad de eigenvector de Wave 1 y de la demo se calcula **dentro del aula** (centro, curso y aula), con la definición `eigenvectorf_class` de la réplica R: matriz A + Aᵀ de buenas relaciones. Cada mención vale uno; una relación recíproca suma dos. «Buena» y «Muy buena» cuentan igual para este cálculo. El mayor eigenvector vale 1 y se presenta multiplicado por 10, con un decimal. Los recuentos principales de menciones siguen incluyendo todo el centro; no son el grado interno del aula.

Se incluyen los estudiantes sin respuesta, con los vínculos válidos que reciben. Un aula sin respuestas o sin buenas relaciones no tiene centralidad calculable. El algoritmo comprueba convergencia y residuo; si dos componentes tienen el mismo autovalor dominante, muestra «Sin una solución única». No asigna un orden arbitrario entre ellos. Los ceros en componentes de menor autovalor no significan ausencia de buenas relaciones. El porcentaje pendiente corresponde a respuestas relacionales, no a una estimación de cuántos vínculos faltan.

La centralización de aula utiliza esos mismos eigenvectors: suma de (1 − eigenvector) / (n − 2), para n > 2. Una red observada sin aristas tiene centralización 0. El Gini utiliza las menciones de buenas relaciones recibidas **dentro de esa aula**. No se mezclan valores de centralidad normalizados en distintas aulas para construir una centralización de centro.

Las comunidades se detectan con Louvain sobre las buenas relaciones OR: una arista si hay mención de buena relación en cualquiera de los sentidos, resolución 1, semilla 20261010 y orden de filas del archivo. La modularidad Q corresponde a esa partición. El motor se contrasta con R/igraph 2.3.3; se fija también el generador aleatorio y el orden de visita, porque la semilla sola no asegura iguales particiones entre bibliotecas. Una nueva versión, un orden de registros distinto o empates pueden cambiar la partición. Véanse [eigenvector](https://r.igraph.org/reference/eigen_centrality.html) y [Louvain](https://r.igraph.org/reference/cluster_louvain.html).

La variante OR del eigenvector se conserva separada como `centralidad_eigenvector_or` para auditoría. No se confunde con la variante SUM de la ficha. Los campos antiguos `pbis_eigenvector_class` de la réplica R usan OR y, por tanto, no son la nueva escala SUM de la ficha. Los archivos Datos previamente calculados conservan su definición de origen.

## Bienestar y test

Bienestar: experiencia en el centro y diversión (0–4), más soledad invertida (4 − respuesta). La suma de 0 a 12 se expresa de 0 a 10. Las tres respuestas originales se muestran sin invertir. El índice requiere las tres respuestas válidas.

El **Test de impulsividad** presenta únicamente el total de aciertos de las tres preguntas CRT, de 0 a 3, y la media de respuestas completas del aula. En esta exportación las respuestas correctas son segundo lugar, Emilia y día 47. Una prueba incompleta se muestra sin puntuación. No permite diagnosticar impulsividad ni clasificar capacidades.

## Centro y aula

Los porcentajes de respuestas personales usan solo las respuestas válidas. Se distingue la respuesta personal sobre acoso de las menciones de otras personas: pueden referirse al mismo estudiante y no se suman.

El **recuento de estudiantes con menciones de acoso** cuenta estudiantes que reciben **2 o más menciones válidas de personas distintas**. En centro y aula, el porcentaje es ese recuento dividido por los estudiantes con recuento recibido conocido en el ámbito, multiplicado por 100. El denominador no se limita a quienes emiten respuestas admitidas. En la lista y la ficha de estudiante se conserva el número recibido, incluido 1; ese caso no entra en el numerador de los resúmenes. La ficha de estudiante conserva las señales descriptivas del recuento recibido y de la declaración de acoso por separado.

Los archivos Datos y la demo clásica contienen recuentos ya calculados. Las escalas normalizadas de menciones de acoso se recalculan desde esos recuentos; las posiciones comparativas antiguas de ese indicador no se reutilizan.

En este cuestionario Wave 1, una lista de acoso vacía se interpreta como **Nadie** si hay una respuesta posterior a frecuencia, posibilidad de detener el acoso, conductas o mediación: avanzar requería responder a acoso. Una marca horaria de entrada, por sí sola, no confirma una respuesta. Sin lista ni respuesta posterior, el dato queda pendiente y se excluye del denominador. La autoselección exige que coincida el ID completo, no una parte del código.

Una respuesta que contiene **Error en relación** es un error de exportación. Esa pregunta queda pendiente, sin asignar categorías a sus menciones; se conservan las demás preguntas del registro y las fichas muestran el aviso. Los vínculos válidos recibidos de otras personas siguen contando. Las respuestas explícitas no se descartan por faltar su marca horaria de entrada.

Buena mediación cuenta estudiantes con al menos una mención por buena o muy buena mediación. Mala mediación cuenta estudiantes con al menos una mención por mala o muy mala mediación. Una persona puede figurar en ambos recuentos.

La densidad de malas relaciones de las fichas usa los vínculos posibles de emisores con respuesta conocida, según el ámbito del archivo. En Wave 1 describe menciones hacia todo el centro y no equivale a `densitye_class` de R, que divide las aristas internas por n × (n − 1). Ambas medidas tienen distinto ámbito y denominador. Varias comunidades no implican conflicto. La ficha de centro omite «Comunidades de relaciones», que no debe extrapolarse desde un aula.

## Ejemplo incorporado

La demo contiene 1.512 estudiantes simulados, 54 aulas, nueve cursos y dos centros. Los recuentos proceden de relaciones sintéticas reproducibles; las barras dependen de esos recuentos. Las tres respuestas de bienestar reconstruyen exactamente su suma y el indicador de soledad. El CRT de ejemplo es simulado y toma valores 0–3. Las relaciones de la demo coinciden con su hoja Relaciones.

## Interpretación

Las fichas apoyan la escucha y la revisión profesional. No diagnostican acoso ni generan decisiones disciplinarias. Antes de utilizar indicadores para decisiones reales, se requiere validación metodológica independiente y un protocolo de interpretación y actuación.
