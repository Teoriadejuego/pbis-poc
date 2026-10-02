# PBIS · Prompts de desarrollo y revisión

Versión 0.9 · Prompts para trabajar sobre la misma entrega

## Instrucción común

Actúa como parte del equipo de producto de PBIS. Inspecciona los archivos existentes y la evidencia de las pruebas antes de proponer cambios. Conserva los originales que no pertenezcan a esta entrega. Trabaja con datos inventados y documentados. No publiques, envíes mensajes, contrates servicios ni inventes testimonios, validaciones o certificaciones. Cada cambio debe terminar con evidencia revisable y limitaciones explícitas.

La prioridad es una edición local clara, coherente y verificable. Los requisitos actuales sustituyen los anteriores cuando entran en conflicto: los cursos usan el sistema educativo español; los indicadores deben ser coherentes con los recuentos; no hay que conservar puntuaciones arbitrarias de fotografías si contradicen las fórmulas. Las referencias visuales orientan el diseño, no validan las medidas.

## 01 · Dirección de producto

> Define y entrega una versión de evaluación de PBIS para tutoría y orientación. Mantén dos recorridos: ficha del grupo y ficha individual, en ese orden. Cubre 4.º, 5.º y 6.º de Primaria, 1.º a 4.º de ESO y 1.º y 2.º de Bachillerato, cada uno con grupos A, B y C. Usa centros de enseñanza de Sevilla y Córdoba en la muestra. Separa alcance implementado, comprobado y pendiente. Describe el trabajo necesario para convertir la evaluación en un producto comercial sin presentar tareas pendientes como resueltas.

**Entrega:** inventario de pantallas, recorridos, perfiles, archivos y criterios de aceptación.

## 02 · Arquitectura local y distribución

> Revisa si la lógica existente puede ejecutarse íntegramente en el navegador. Produce un visualizador local que se abra al extraer un ZIP y abrir PBIS.html, sin instalar R, Docker ni paquetes. Incluye sus dependencias, estilos e iconos en la entrega; evita CDN, fuentes remotas, analítica y llamadas de red durante la consulta. Prepara ZIP con instrucciones para Windows, macOS, Linux y una edición universal. No los presentes como binarios nativos ni afirmes compatibilidad probada sin pruebas en esos sistemas. Excluye de los paquetes los Excel de indicadores, llave y perfiles.

**Comprobar:** apertura mediante `file://`, funcionamiento sin red, recursos locales, ausencia de archivos de trabajo o datos en el ZIP.

## 03 · Ingeniería de datos y coherencia

> Genera 54 aulas de 28 estudiantes: dos centros de enseñanza por nueve cursos por tres grupos. Construye relaciones y respuestas plausibles y deriva sus medidas mediante fórmulas explícitas. A igual denominador, más nominaciones recibidas deben dar mayor popularidad. La reciprocidad no debe superar las elecciones emitidas; los vínculos recíprocos deben existir en ambos sentidos. Verifica totales, límites, denominadores y correspondencia entre las fichas individuales y de grupo. Guarda indicadores sin nombres en un Excel y la llave ID–nombre en otro. Incluye diccionario y metodología. Distingue las proporciones 0–10 de percentiles y escalas normativas.

**Comprobar:** invariantes de red, agregaciones reproducibles, ID únicos, ausencia de nombres en indicadores y ausencia de estudiantes reales.

## 04 · Revisión de medidas

> Actúa como parte del equipo de revisión metodológica. Revisa cada medida de amistad, rechazo, reciprocidad, predicción, bienestar, centralidad, mediación y convivencia. Para cada una, especifica numerador, denominador, rango, unidad, tratamiento de ausentes y dirección de interpretación. Distingue medidas calculadas, respuestas personales y nominaciones de estudiantes del grupo. Detecta recuentos duplicados, denominadores inconsistentes y etiquetas que sugieran diagnóstico. No crees umbrales de alerta sin justificación. Cuando una medida no puede calcularse con la información disponible, muéstrala como ausente y explica qué falta.

**Entrega:** tabla metodológica y casos concretos que se recalculen en las pruebas.

## 05 · Perfiles y acceso

> Crea una hoja de perfiles legible con usuario, clave de evaluación, rol, centro, curso, grupo y alcance. Incluye tutoría por aula, orientación por centro y orientación general; conserva los alias tutor7a y tutor7b para el piloto. Usa 1234 únicamente para evaluación e indícalo. Filtra las opciones y la ficha según el perfil. Valida que una selección fuera del alcance no permita mostrar otra clase. Explica que la lógica y los archivos del navegador pueden inspeccionarse y que los perfiles locales de esta edición no constituyen una barrera criptográfica. No distribuyas datos fuera del alcance permitido confiando solo en ocultar controles.

**Comprobar:** acceso correcto, credenciales erróneas, alias, centro ajeno, cambio de perfil y cierre de sesión.

## 06 · Diseño de interacción

> Ordena la interfaz como acceso, carga de archivos, pestañas Ficha del grupo/Ficha individual, filtros y ficha. Usa nombres cortos y acciones inequívocas. Distingue las funciones de archivo de indicadores, llave de nombres y hoja de perfiles. Presenta primero una explicación breve, después el control y finalmente el estado de validación. Conserva el foco de teclado cuando se produce un error. Invalida la ficha al cambiar un archivo y evita mostrar valores anteriores durante una nueva lectura. No añadas impresión ni PDF.

**Comprobar:** primer uso, carga parcial, sustitución de archivo, archivo rechazado, cambio de grupo, selección vacía y cierre.

## 07 · Dirección visual

> Diseña un sistema visual propio y coherente: fondo crema, tinta púrpura oscura, acentos caléndula, coral y lila. Usa tipografía de sistema para controles y una serif local para títulos editoriales. Reserva los colores de estado para significados definidos. Crea tarjetas con espacios consistentes, jerarquía clara, barras legibles y numeradores junto a denominadores. Adapta escritorio, tableta y móvil. Evita texto pequeño, bloques abarrotados y elementos decorativos que compitan con los datos. Documenta tamaños, espaciado, bordes, estados y colores reutilizables.

**Entrega:** componentes aplicados y capturas de las principales pantallas en dos anchos, con revisión de recortes y solapamientos.

## 08 · Revisión editorial y botones

> Revisa toda la interfaz, la web, los Excel y la documentación desde la edición de textos en español de España. Usa «centros de enseñanza» y la etiqueta breve «Centro» en filtros. Habla de «estudiantes», «equipo docente», «tutoría» y «orientación»; no atribuyas género a partir del nombre. Prefiere «acoso escolar», «respuesta personal», «información del grupo» y «reconocimiento en mediación». Revisa las frases completas, las concordancias y los casos con una sola persona; evita sustituciones mecánicas que dejen textos poco naturales. Conserva los nombres de usuario, las variables y los contratos técnicos para mantener la compatibilidad. Sustituye jerga innecesaria y promesas ambiguas por acciones concretas. Conserva los términos metodológicos necesarios y explícalos al lado de la medida. Botones como Descargar edición local, Elegir indicadores, Elegir llave y Cerrar sesión deben describir su efecto. Los errores deben indicar el archivo y la corrección posible sin exponer datos ajenos. No prometas borrar originales, cifrar datos o impedir copias si no está implementado.

**Entrega:** cambios de texto aplicados y un registro breve de decisiones editoriales.

## 09 · Ilustración y recursos

> Diseña recursos propios en SVG y CSS que ayuden a explicar relaciones, fichas y unión temporal de archivos. Las ilustraciones deben ser distinguibles de capturas del producto y usar únicamente datos inventados. No uses fotografías de menores, logotipos ajenos, iconos descargados sin licencia ni imágenes remotas. Marca como decorativos los recursos que no añadan información y ofrece texto alternativo cuando sí la aporten. Mantén los SVG sencillos y sus colores alineados con el sistema visual.

**Comprobar:** independencia de red, licencias, contraste, escalado y contenido alternativo.

## 10 · Web de producto y descargas

> Crea una web editorial profesional con propuesta de valor, vistas del producto, cuatro pasos de uso, descargas por sistema, kit de evaluación, preguntas frecuentes y enlaces a guía, privacidad y metodología. Cada botón de descarga debe apuntar a un artefacto existente y comprobado. La detección de sistema puede sugerir una descarga, pero nunca ocultar las otras. Explica que las ediciones contienen HTML local común. No añadas precios, formularios de captación, reseñas, clientes o certificaciones inventados. Mantén el estado de evaluación visible donde afecta a la decisión de uso.

**Comprobar:** enlaces, archivos ZIP, navegación por teclado, menú móvil, ausencia de solicitudes externas y rutas de documentos.

## 11 · Privacidad y revisión de seguridad

> Revisa el flujo de datos desde la selección del archivo hasta el cierre. Identifica dónde existen indicadores, nombres, perfiles y datos unidos. Evita almacenamiento persistente de los Excel o de los datos unidos, mensajes de consola con contenido sensible y peticiones de red. Limpia referencias de sesión y el estado visual al cerrar, al cambiar perfil y al sustituir archivos. Documenta lo que no se puede garantizar en un equipo ajeno: inspección de código, extensiones, capturas, memoria virtual y copias originales. Distingue anonimización, seudonimización, cifrado y filtrado de pantalla. No presentes una revisión interna como auditoría independiente.

**Entrega:** mapa de datos, pruebas ejecutadas, hallazgos priorizados y decisiones pendientes para datos reales.

## 12 · Accesibilidad y adaptación

> Revisa la aplicación y la web con teclado y ampliación. Asegura etiquetas asociadas a todos los controles, orden de foco lógico, foco visible, estados de error anunciados, estructura de encabezados y nombres accesibles en iconos. No comuniques un valor solo por color; acompaña las barras con cifras y texto. Prueba anchos de 360, 768 y 1440 píxeles y zoom del 200 %. Respeta la preferencia de movimiento reducido. Describe qué se verificó y qué requiere todavía pruebas con tecnologías de apoyo.

**Entrega:** incidencias corregidas y limitaciones verificables, sin afirmar una certificación de accesibilidad.

## 13 · Calidad y casos adversos

> Crea pruebas independientes de las funciones de importación, perfiles, fórmulas y selección. Usa archivos con columnas ausentes, ID duplicados, ID sin llave, números fuera de rango, valores nulos, fórmulas inesperadas, tipos erróneos y grupos incompletos. Comprueba que una nueva selección actualiza la ficha completa. Asegura que las sumas grupales coinciden con las filas de estudiantes correspondientes. Prueba el cierre y la recarga de página. Mantén los errores comprensibles y evita aceptar silenciosamente una tabla incoherente.

**Entrega:** informe de pruebas con resultado, entorno, fecha y reproducciones de cualquier fallo abierto.

## 14 · Revisión de entrega y comercialización

> Actúa como responsable de lanzamiento. Verifica que cada enlace web resuelve a un archivo real, que los ZIP abren sin instalar dependencias y que la guía coincide con las pantallas actuales. Incluye versión, inventario de dependencias, licencias, notas de cambios y comprobaciones. Distingue Windows probado de macOS/Linux previstos cuando no dispongas de esos equipos. Enumera los requisitos pendientes de credenciales, cifrado, custodia, medidas, revisión independiente, soporte y contratación. No publiques ni declares el producto listo para datos reales mientras esos criterios sigan pendientes.

**Entrega:** paquete de evaluación verificable y decisión de salida documentada.

## Lista común para aceptar una revisión

- ¿El cambio resuelve un problema concreto sin introducir una promesa no comprobada?
- ¿El texto y el comportamiento del botón coinciden?
- ¿Los recuentos, denominadores y puntuaciones se pueden reproducir?
- ¿Los archivos de datos permanecen separados del paquete de la aplicación?
- ¿La ausencia de dato se distingue de cero?
- ¿Se mantienen los filtros correctos al cambiar centro, curso, grupo y estudiante?
- ¿Es posible completar el flujo con teclado y en una pantalla estrecha?
- ¿El cierre retira los datos de la vista sin afirmar que elimina los originales?
- ¿Todas las descargas existen y contienen la versión anunciada?
- ¿Las limitaciones que afectan a la decisión de quien utiliza el producto están visibles en el lugar adecuado?


## Identidad PBIS

> Sustituye la marca anterior por PBIS en la web, acceso, fichas, metadatos para compartir enlaces, documentación y paquetes locales. Mantén los indicadores, permisos, datos y diseño. Actualiza las referencias internas de forma coherente, comprueba los Excel y las descargas, ejecuta las pruebas y publica en el repositorio y la dirección PBIS.


## Llave opcional y entrega .pbis

> Permite cargar solo indicadores y consultar todas las fichas autorizadas por código, sin utilizar nombres del propio archivo de datos. Mantén la validación estricta cuando se carga una llave. Añade Retirar llave para eliminar los nombres y continuar por códigos. Acepta .pbis como Excel renombrado, sin cifrar ni transformar bytes, y entrega los indicadores de prueba con esa extensión. Conserva la carga Excel compatible, las medidas, los filtros y las opiniones. Verifica carga, retirada, sustitución, privacidad de nombres y lectura del .pbis.
