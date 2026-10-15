# Prompt de implementación · Red del aula

Amplía PBIS con una red completa al final de la información complementaria de la ficha de aula, dentro de «Ver más indicadores». Mantén la portada, la práctica guiada, las fichas existentes y los cálculos actuales.

Representa a todos los estudiantes del aula seleccionada en un círculo, incluidos quienes no tienen vínculos o no han respondido. Ordena desde las doce, en sentido horario, por menciones de buenas relaciones recibidas de mayor a menor, usando el mismo campo de buenas relaciones recibidas que las fichas (`amistad_recibida_n`). Los empates se resuelven por nombre e ID y los valores desconocidos quedan al final. Indica que el orden usa el ámbito del indicador, que puede abarcar todo el centro, mientras el dibujo muestra solo relaciones dentro del aula.

Usa las menciones individuales existentes en `relaciones_red`; no infieras vínculos a partir de recuentos. Cada flecha sale de quien responde hacia la persona nombrada. Azul representa buena relación y rojo mala relación; el grosor distingue buena/muy buena y mala/muy mala. Separa las flechas recíprocas para poder ver ambas direcciones. No dibujes autoselecciones ni dupliques menciones idénticas.

Conserva los nombres con apellidos abreviados o los códigos cuando no hay nombres. Cada nodo abre la ficha del estudiante. Añade zoom, ajuste a la pantalla y un selector accesible para destacar sus relaciones sin ocultar por completo el resto del aula. Conserva los límites de centro, curso, aula y perfil. No transmitas estos datos ni añadas almacenamiento persistente.

Diferencia una respuesta de relaciones ausente de una respuesta válida sin menciones. Informa de la cobertura y de cuántas menciones quedan fuera del listado representado. No inventes vínculos para archivos que solo incluyen indicadores agregados.

## Prompt de validación

Comprueba con datos sintéticos:

1. Todos los estudiantes del aula aparecen una sola vez y en el orden indicado, con empates estables, valores cero y desconocidos.
2. El número, origen, destino, signo e intensidad de las flechas coinciden con las respuestas del archivo. Las relaciones recíprocas tienen trazados distintos.
3. No aparecen estudiantes ni enlaces de otras aulas o centros. Los perfiles conservan sus restricciones al abrir fichas desde la red.
4. Los estudiantes sin respuesta y sin vínculos siguen visibles. No se confunde «sin respuesta» con «ninguna mención».
5. Se escapan nombres, códigos y otros textos del archivo. Los apellidos mantienen sus iniciales.
6. El círculo y sus etiquetas caben en el dibujo. En escritorio y móvil se puede ampliar, desplazar, destacar, abrir fichas y volver a ajustar sin desbordar la página.
7. Cambiar de aula o de estudiante actualiza completamente la vista; no se filtran datos de otra selección.
8. La demo mantiene sus pasos y sus datos. No se envía ningún correo durante las pruebas.
9. La compilación web y las cuatro descargas incluyen la misma funcionalidad y pasan las pruebas existentes.
