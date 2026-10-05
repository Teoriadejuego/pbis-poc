# Prompts de desarrollo — consulta local por clase

## 1. Recorrido de carga y consulta

> En una copia local de PBIS, conserva la identificación y la carga separada de indicadores y llave ID–nombre. Tras validar el Excel de indicadores, muestra una pantalla de resultados centrada en una sola clase. El primer nivel será la ficha de clase. Incluye un botón visible al final «Ver lista de clase». Permite volver a la carga para sustituir archivos y limpia la vista anterior cuando cambie cualquiera de ellos. No publiques la copia.

## 2. Lista de clase

> Crea una tabla de todas las personas de la clase seleccionada, con enlace en el nombre a su ficha individual. Muestra, en este orden, si se señalaron a sí mismas en la pregunta de acoso, cuántas otras personas las señalaron, felicidad de tres preguntas, amistades que nombran, nominaciones de amistad recibidas, rechazos que nombran y nominaciones de rechazo recibidas. Distingue «Sin datos» de cero. Usa tonos rojos para señales de acoso, una escala suave para felicidad y etiquetas legibles además del color. Conserva los códigos cuando no se cargue la llave y muestra el ID junto al nombre para diferenciar homónimos.

## 3. Felicidad y preparación de datos

> Codifica cada respuesta Nunca / Casi nunca / Algunas veces / Casi siempre / Siempre como 0 / 1 / 2 / 3 / 4. Suma las preguntas de experiencia positiva en el centro y diversión, más `4 − soledad`; el total va de 0 a 12 y se expresa de 0 a 10. Calcula solo si están presentes las tres respuestas. En el conversor R, conserva las tres columnas de origen y la suma calculada. Para la columna «Se señala», interpreta la propia selección en la lista de acoso; para «Le señalan» cuenta otras personas distintas. Documenta el método como descriptivo, sin puntos de corte clínicos.

## 4. Ficha individual breve

> Al elegir una persona en la lista, abre una ficha con nombre o código, dos señales de acoso, felicidad y las cuatro cifras de amistad/rechazo. Añade un control «Ver más indicadores» que despliegue la ficha completa existente, sin perder la selección. Incluye «Volver a la lista de clase». Mantén el diseño adaptable a móvil y la posibilidad de valorar la ficha en el contexto correcto.

## 5. Entrega local

> Construye y abre una versión local aislada del repositorio publicado. Prepara un ejemplo sintético y el Excel de indicadores generado a partir del cuestionario de prueba, con llave opcional. Deja instrucciones para probar la demo y la carga manual. No hagas commit, push ni despliegue.

## Prompts de validación

1. > Verifica que antes de pulsar «Abrir consulta» no se muestran resultados, y que tras validar el Excel aparece la ficha de clase en otra pantalla. Comprueba los filtros de centro, curso y grupo, el botón final de lista y el retorno a la carga.
2. > Con un grupo conocido, calcula a mano el valor de felicidad: respuestas 4, 2 y 1 dan `(4 + 2 + 4 − 1) / 12 × 10 = 7,5`. Comprueba los extremos 0 y 10, los valores ausentes y que soledad se invierte. No conviertas una falta de respuesta en 0.
3. > Contrasta cada cifra de amistad, rechazo y acoso de la tabla con su registro de indicadores. Al cambiar de clase, ningún registro de la clase anterior debe permanecer. Comprueba nombres repetidos, consulta sin llave y celdas vacías.
4. > Haz clic en varias personas de la lista. Cada ficha debe mostrar los datos del ID elegido; «Ver más indicadores» debe desplegar la ficha extensa de la misma persona y «Volver a la lista» debe conservar la clase. Repite con teclado y en ancho móvil para revisar foco, contraste y desplazamiento horizontal.
5. > Sustituye el Excel de indicadores o la llave durante una consulta y confirma que se invalida la unión anterior. Comprueba el cierre de sesión y que la app no envía ni publica esos Excel. Revisa que la versión alojada en GitHub no ha cambiado.

## Ampliación local — valoración del profesorado

> En cada celda de indicadores de la Lista de clase, añade tres reacciones excluyentes: 👍 OK, 👎 Revisar y 😮 Me sorprende. Permite quitar la reacción. Al final de cada fila, añade un deslizador de confianza en los **datos** de ese estudiante, de −5 a +5 en décimas, distinguiendo «Sin valorar» de 0. Mantén estas apreciaciones separadas de los indicadores originales y accesibles por teclado.

> Conserva las reacciones, la confianza y las opiniones de fichas durante la sesión. Al pulsar «Cerrar sesión», envía a Formspree un solo resumen con el usuario de acceso, rol, código de sesión, códigos de aula y estudiante, valoraciones y comentarios. No adjuntes Excel ni nombres de la llave. Espera la confirmación antes de vaciar la sesión; ante un error, ofrece reintento, descarga local y cierre sin enviar. Documenta que cerrar la pestaña no garantiza la entrega.

### Validación de la ampliación

1. > Pulsa cada emoticono sobre una celda: debe seleccionarse solo uno, poder cambiarse o quitarse y no abrir la ficha individual. Comprueba que el indicador original no cambia.
2. > Ajusta la confianza a −5, 0, +5 y una décima intermedia; verifica que «Sin valorar» y 0 son distintos. Cambia de grupo y vuelve: las valoraciones deben conservarse.
3. > Añade un comentario a una ficha de lista y cierra sesión con datos ficticios. Comprueba un único registro aceptado por Formspree que contenga usuario, comentario y valoraciones, sin nombres ni Excel. No interpretes la aceptación como prueba de entrega del correo.
4. > Simula falta de conexión: el cierre debe conservar la sesión y permitir reintentar o descargar el resumen. Revisa la tabla en una pantalla estrecha y con teclado. Confirma que la web publicada no ha cambiado.

### Ajuste local — reacciones discretas

> Oculta los tres emoticonos de cada indicador hasta que se pulse su valor en la lista. Permite abrirlos con teclado, muestra solo un menú de reacciones a la vez y ciérralo al elegir. Cuando exista una valoración, deja visible una pequeña etiqueta de texto. Usa «Revisar» en vez de «Mal» en la interfaz y en el resumen enviado, conservando el código interno anterior para compatibilidad. Pulsar el dato no debe abrir la ficha individual.

> Comprueba que inicialmente no hay emoticonos visibles, que al pulsar un valor aparecen solo sus tres opciones, que la reacción elegida se conserva al cambiar de grupo y que volver a elegirla la quita. Repite la prueba con teclado y en pantalla estrecha.

### Ajuste local — ordenar la lista

> Convierte los encabezados Estudiante, Se señala, Le señalan, Felicidad, amistades, rechazos y Confianza en los datos en botones de ordenación. Al pulsar una columna de indicadores, muestra primero los valores mayores; al repetir, invierte el orden. Ordena los nombres alfabéticamente, mantén los valores ausentes al final y desempata por nombre e ID. Muestra la dirección activa con una flecha y `aria-sort`. No modifiques la asociación entre ID, reacciones, confianza y ficha individual al mover las filas.

> Verifica los dos sentidos en todas las columnas, el desempate y los ausentes. Comprueba que ordenar por confianza tras cambiar un deslizador actualiza el orden al terminar la edición, y que pulsar un nombre sigue abriendo la ficha correspondiente. Prueba también sin llave de nombres y con teclado.
