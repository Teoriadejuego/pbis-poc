# Revisión de las propuestas técnicas

16 de octubre de 2026 · Base: PBIS 0.10.15, commit e82ec12. Cambios preparados y comprobados en local; no publicados.

## Conclusión

Las prioridades son comprobar entradas, impedir empaquetados accidentales, verificar integridad, automatizar recorridos reales y mantener la documentación fiel al código. No todas las recomendaciones describían problemas existentes: algunas confunden código fuente con resultados generados, datos con algoritmos o el receptor alternativo con el servicio utilizado.

No se modifican cálculos, filtros de nominaciones, normalización, cuentas, contraseñas ni pasos de la demo. Los Excel se reubican sin modificar sus bytes. La copia ZIP anterior se conserva.

## Repositorio

| Nº | Propuesta | Importancia y decisión | Evidencia o contraargumento |
| --- | --- | --- | --- |
| 1 | Eliminar LEEME_COPIA.txt | No procede en el repositorio | Solo está en la copia ZIP entregada. Explica cómo recuperarla; no ensucia Git. |
| 2 | Eliminar MANIFIESTO_COPIA.json | No procede | Es inventario de una copia, con otro nombre y ruta que los manifiestos de publicación. No existe conflicto de configuración. |
| 3 | Mover PROMPTS.md a docs | Baja; se conserva | Hay prompts históricos distintos en ambas rutas. Se añade un índice que explica su función; moverlos ahora rompería referencias sin mejorar ejecución. |
| 4 | Fusionar EMPIEZA_AQUI con README | Parcial | README queda como entrada de desarrollo; EMPIEZA_AQUI mantiene la apertura de la descarga para usuarios. Se aclara la distinción. |
| 5 | Mover COMPROBACIONES | Baja; no se mueve | Es evidencia legible incluida en los ZIP y enlazada desde la documentación. Su ubicación no afecta las pruebas; se conserva el historial. |
| 6 | Excluir outputs | Alta; aplicado | Se elimina la excepción de seguimiento. outputs/ queda completamente ignorado. |
| 7 | Archivar los Excel necesarios | Se corrige la propuesta | Se trasladan a data/examples/. Borrarlos o retirarlos de la construcción rompería la demo y las pruebas. Se conservan como entradas sintéticas versionadas. |

## Privacidad y seguridad técnica

| Nº | Propuesta | Importancia y decisión | Evidencia o contraargumento |
| --- | --- | --- | --- |
| 8 | Revisar .env.example | Alta; revisado | No contiene tokens: las claves de proveedor están vacías. La ruta de Linux y 127.0.0.1 son ejemplos de configuración, no secretos internos. No se incluye .env en entregas. |
| 9 | Sanitizar server.cjs | Alta; aplicada donde corresponde | server.cjs inicia el servicio; las peticiones se validan en service.cjs. Ya había límites, lista cerrada de campos y consultas SQL parametrizadas. Ahora comparte validación con el modelo del cliente, acepta versiones vigentes y rechaza controles Unicode y accesores. |
| 10 | Comprobar demo-account | Alta; revisado y automatizado | Solo contiene la cuenta demo y su contraseña pública de práctica. Se valida su contrato sin datos de estudiantes. |
| 11 | Anonimizar perfiles irreversiblemente | No resuelve el problema | Son cuentas genéricas del piloto, no perfiles personales de estudiantes. Anonimizar sus identificadores no protege contraseñas incluidas en JavaScript. La autenticación de producción exige otro modelo; no se simula con una transformación cosmética. |
| 12 | Bloquear ejecutables sin firmar | Se adapta el control | Los ZIP actuales no contienen binarios nativos. Se verifica su lista exacta de HTML, documentos y herramientas, rechazando archivos adicionales. Una futura aplicación nativa sí necesitaría su propio proceso de firma. |
| 13 | Sincronizar privacidad | Alta; aplicado | Se actualizan fecha y descripción del receptor vigente; se distingue Formspree v2 del servicio individual opcional y se aclara que cerrar sesión no elimina copias del proveedor o correo. No se inventan plazos ni certificaciones. |
| 14 | Ofuscar datos_evaluacion.pbis | No se aplica | Es un Excel sintético renombrado, no un binario compilado. Ofuscar no equivale a cifrar y obligaría a modificar el formato sin aportar el control de claves que necesita un sistema de cifrado real. |
| 15 | Validar SHA256SUMS | Alta; aplicado | Ya se comprobaban bytes y hashes del manifiesto. Se añade la comparación exacta de SHA256SUMS.txt, la versión, el contenido de los ZIP y la lista permitida de archivos públicos. Un hash detecta cambios; no es una firma del autor. |

## Frontend

| Nº | Propuesta | Importancia y decisión | Evidencia o contraargumento |
| --- | --- | --- | --- |
| 16 | Modularizar y minificar portada | Parcial | site.js y site.css ya pasan por build.mjs. Se añade identificación por contenido para la caché. Minificar 1,1 KB de JS y 26,7 KB de CSS no es la prioridad frente a la demo; se evita añadir un compilador de producción sin medir necesidad. |
| 17 | Convertir portada a WebP/AVIF | Optimización aplazada | La captura JPEG pesa 109.270 bytes. No se cambia una imagen legible sin comparar tamaño y nitidez; se conserva también para las vistas previas de enlaces. |
| 18 | Pasar raw-wave1.js a JSON | No procede | Contiene conversión, validación y algoritmos ejecutables. JSON puede representar configuraciones, no sustituir esas funciones. Se conserva el motor probado. |
| 19 | Extraer evaluación compartida de workers | No como se plantea | Uno lee Excel y otro exporta opiniones; no duplican el mismo algoritmo de evaluación. La duplicación real estaba entre cliente y servicio de opiniones y se corrige compartiendo makeOpinion. |
| 20 | Consolidar plantillas | Ya existe una separación válida | app.html es la fuente del visualizador; local-home.html es su portada local; release/PBIS.html se genera. No hay tres plantillas equivalentes que fusionar. |
| 21 | Separar grafos y dibujo | Ya está mayormente resuelto | class-network expone model, geometry, svg y view; el modelo de red individual procede de core. Se añaden 60 casos deterministas para geometría y aristas sin alterar los algoritmos. |
| 22 | Reducir especificidad CSS | Aplazado | El ámbito del diálogo evita que se mezcle con la ficha. Una sustitución general podría cambiar diseño sin corregir un fallo identificado. Las pruebas cubren diálogos y tres anchos de pantalla. |
| 23 | Centralizar todo el estado de opiniones | No se fusiona indiscriminadamente | feedback-model valida datos puros; feedback.js gestiona DOM y sesión. El ciclo de vida del navegador no debe confundirse con la persistencia del servicio. Se comparten las reglas, no ambos estados. |

## Servicio alternativo

| Nº | Propuesta | Importancia y decisión | Evidencia o contraargumento |
| --- | --- | --- | --- |
| 24 | Migrar CommonJS a ESM | Baja; no se aplica | Ambas opciones funcionan en Node 24. Cambiar la sintaxis no corrige un defecto ni mejora la privacidad. El frontal sigue siendo compatible con los módulos usados en pruebas y descarga. |
| 25 | Separar controladores de lógica analítica | Se matiza | server.cjs es el arranque; service.cjs contiene API, almacenamiento y transporte, no analítica educativa pura. Una división adicional puede hacerse si crece el servicio; no es necesaria para el receptor Formspree activo. |
| 26 | Errores y pruebas del exportador | Alta; aplicado | Se incorporan códigos estables de error, pruebas de base corrupta, destino existente y fallo de apertura. No se exportan resultados parciales ante registros inválidos ni se muestran sus contenidos. |

## Pruebas y fiabilidad

| Nº | Propuesta | Importancia y decisión | Evidencia o contraargumento |
| --- | --- | --- | --- |
| 27 | Redes probabilísticas | Aplicado con semilla fija | Se añaden 60 redes variadas reproducibles. Se verifican dirección, intensidad, deduplicación, coordenadas finitas y ausencia de mutación. |
| 28 | Aserciones contra R | Ya existían; reforzadas | Las referencias proceden de R/igraph 2.3.3. Se comprueban además longitud del vector y valores finitos, conservando tolerancia numérica 1e-8 absoluta y relativa. |
| 29 | End-to-End | Alta; aplicado | Recorrido real de 16 pasos, 12 perfiles, carga con el worker, vistas, DOM, feedback con fallo/reintento y descarga sin conexión. Se incorpora como paso obligatorio anterior a publicar. |
| 30 | Moderación en bullying-filter-note | No corresponde a ese archivo | Ese test evita que reaparezca una nota técnica retirada por decisión del producto. No modera lenguaje de comentarios. Los controles de texto están en los modelos y el servicio. |
| 31 | Estrés en feedback-model | Se lleva a la capa correcta | El modelo es puro, sin concurrencia de red. Se prueban 40 sesiones simultáneas y sus 40 reintentos en el receptor local simulado: un registro y un envío por evento. No certifica capacidad de Formspree. |
| 32 | Variables ausentes con llave opcional | Aplicado | Nueva prueba: nombres ausentes mantienen códigos, null permanece null y una columna obligatoria ausente se rechaza. Se conservan los tests de sustitución de archivo. |
| 33 | Persistencia temporal del servicio | Revisado | El navegador es temporal; SQLite es persistente a propósito para recuperar envíos. Los tests cubren reinicio y reintentos. No se añade una caducidad arbitraria sin política de conservación definida. |
| 34 | Mutación real del DOM | Aplicado | Además del DOM simulado existente, Edge comprueba que las reacciones aparecen al pulsar, quedan seleccionadas y desaparecen los resultados al cerrar. |
| 35 | Certificar rendimiento en review-batch.test | No se puede certificar así | Ese archivo no existía; el módulo se ejercita en otros tests. Se verifica el lote mediante el flujo real. No se confunde un test local con una certificación de rendimiento. |
| 36 | Medir renderizado de lista | Aplicado como medición orientativa | E2E registra transición y presentación por vista y ancho. No se fijan umbrales arbitrarios ni se extrapolan los tiempos a cualquier equipo. |
| 37 | Umbrales en non-participation | No corresponde a esa prueba | Valida motivos de encuesta sin responder. Los umbrales de menciones están en raw-wave1 y core, con casos límite ya probados. Se conserva su lógica. |
| 38 | Parametrizar estética | Parcial | Se prueban las cuatro vistas a 1360, 390 y 320 px, sin desbordamiento de página. Branding sigue verificando marca y textos; no pretende certificar estética subjetiva. |
| 39 | Estadísticos de grupo | Revisado | group-summary prueba presentación; los cálculos y denominadores se verifican en core y raw-wave1, incluidas menciones únicas y el umbral de dos. Se mantienen las fórmulas. |
| 40 | Validación JSON Schema | Aplicado sin romper el catálogo | schema.json era un catálogo de columnas, no un esquema formal. Se añade catalog.schema.json y validación Ajv, más comprobación de ejemplos con el validador real y del formato de cuentas. |

## Documentación

| Nº | Propuesta | Importancia y decisión | Evidencia o contraargumento |
| --- | --- | --- | --- |
| 41 | Subdividir docs | Alternativa más pequeña aplicada | Nuevo índice por uso, desarrollo e historial. No se mueven decenas de rutas cuando la navegación se resuelve con un índice. |
| 42 | Unificar todos los prompts | No se fusionan | Registran requisitos de etapas diferentes; unirlos podría presentar instrucciones antiguas como actuales. El índice distingue históricos de documentación vigente. |
| 43 | Sustituir auditoría por métricas longitudinales definitivas | No se aplica | No hay un estudio longitudinal que permita esas afirmaciones. Se preserva la auditoría fechada y se añade evidencia de esta revisión. |
| 44 | Fusionar revisión editorial y criterios | No se aplica | Una registra decisiones históricas; el otro define vocabulario actual. El índice señala cuál prevalece. Un manual académico más extenso no mejora por sí solo los textos para docentes. |
| 45 | Actualizar WAVE1_FINAL_LOCAL | Alta; aplicado | Se corrigen ámbito de aula de la centralidad, SUM/OR, Louvain, ejemplos y nomenclatura. Se eliminan explicaciones antiguas que contradecían el motor actual. |
| 46 | Diagramas en metodología y comercialización | Parcial | Se añade ARQUITECTURA.md con construcción, cálculo local y salida del feedback. No se recarga la explicación de uso ni se presentan diagramas como evidencia comercial. |

## Integración y despliegue

| Nº | Propuesta | Importancia y decisión | Evidencia o contraargumento |
| --- | --- | --- | --- |
| 47 | Obligar a probar antes de publicar | Ya existía; ampliado | pages.yml ya dependía del trabajo de pruebas. Ahora instala dependencias bloqueadas, ejecuta E2E y guarda resultados; el despliegue sigue esperando a que todo pase. |
| 48 | Suprimir release | No se aplica | La edición local incorpora la demo; la web carga demo-data.json. El HTML autónomo permite trabajar sin servidor ni conexión. release ya se excluye de Git y es necesario para los ZIP. |
| 49 | Hashes para caché | Aplicado | CSS, JS de portada, captura y JSON de demo llevan una huella del contenido en la URL. Los hashes CSP se siguen calculando sobre los scripts realmente incluidos. |
| 50 | Estandarizar package.json | Aplicado | Comandos check, test:e2e, validate:data y verify:release, además de build, test y start. Versiones de dependencias de desarrollo fijadas con package-lock.json. |

## Evidencia y límites

- 176 pruebas Node y 7 Python superadas, sin cambiar core.js ni raw-wave1.js.
- Edge en Windows: recorrido completo, 12 cuentas, carga Excel, cuatro vistas en tres anchos, opiniones y reintento de lote idéntico. No se enviaron correos reales.
- Lista: 46–59 ms en la primera ejecución medida, incluido el clic automatizado y la espera de presentación; orientativo, no una medida aislada de pintura ni un compromiso de servicio.
- 40 sesiones simultáneas y sus reintentos contra el servicio alternativo simulado. No es una prueba de carga del proveedor externo.
- Paquetes locales reconstruidos y hashes verificados. CI actualizado, sin ejecutar un despliegue remoto en esta revisión.
- Auditoría npm: cero avisos conocidos tras actualizar Ajv a 8.20.0. El resultado se limita a las dependencias instaladas de desarrollo; no es una auditoría del lector Excel incluido ni una garantía general de seguridad.
- Estas comprobaciones no sustituyen validación metodológica, pruebas en macOS/Linux ni una auditoría de seguridad de producción.

Las herramientas de desarrollo siguen la documentación oficial de [Ajv](https://ajv.js.org/guide/getting-started.html) y [Playwright](https://playwright.dev/docs/library). No se descargan esas bibliotecas en el navegador de los docentes.

## Segunda propuesta: paquete mínimo y supuestos bloqueos de producción

| Afirmación | Comprobación | Decisión |
| --- | --- | --- |
| La llave publicada filtra identidades reales | Los dos Excel corresponden al generador determinista y coinciden con los 1.512 registros de prueba. Los nombres son simulados. No hay evidencia de esa fuga en estos archivos. | Se retiran los Excel sueltos de futuras construcciones públicas por no ser necesarios para la demo. Sus fuentes de prueba se conservan; no se borran originales ni respaldos. |
| feedback-service es un servidor activo en la aplicación | Pages publica site/, que no contiene ese servicio ni ejecuta Node. linked-feedback prepara registros; app.js envía voluntariamente a Formspree. | Se conserva el feedback solicitado. El nuevo paquete de aplicación excluye el servicio opcional; la copia completa conserva sus fuentes y pruebas. |
| Los resultados generados multiplican por siete el repositorio | site/ y release/ están ignorados en Git. Hay variantes web/local y cuatro descargas, pero una persona no descarga todas al usar una. | Se mantienen las URL existentes y se añade un paquete local reducido con una sola copia de la aplicación. No se confunde respaldo de desarrollo con entrega de uso. |
| Faltan workers Blob para file:// | El parser ya se incorpora y crea desde un Blob. El worker individual de opiniones está desactivado en el modo de lotes actual. | Verificado con una importación .pbis en Edge, file:// y contexto sin red. No hace falta reescribir los workers con Python ni minificar con expresiones regulares. |

LEEME_COPIA.txt y MANIFIESTO_COPIA.json no están en la raíz del repositorio actual. No se borran copias históricas por confundir sus inventarios con archivos de ejecución. El paquete reducido incorpora un inventario de hashes útil para verificar su integridad.

Resultado: 177 pruebas Node, 8 Python y recorrido de navegador superados. Se mantienen el cálculo y la normalización. Este trabajo no certifica la preparación para producción: la concordancia numérica con R tampoco sustituye la validación metodológica o unos controles de acceso distintos de las cuentas públicas del piloto. La web remota no se modifica en esta revisión.

## Tercera propuesta: purga automática y árbol estático

No se ejecuta el script de borrado masivo: elimina resultados, informes y pruebas de comprobación sin construir el árbol prometido; tampoco transforma la demo ni actualiza sus referencias. Las herramientas Node son dependencias de desarrollo, no un backend desplegado. demo-account.json solo contiene usuario y contraseña de simulación, no las respuestas de los 1.512 registros sintéticos.

Se implementa tools/distribuir_estatico.py como alternativa reproducible: crea una carpeta nueva por lista explícita, conserva el proyecto fuente y rechaza destinos existentes. Unifica el acceso en index.html y app.html, incorpora la demo para file://, usa una única descarga universal y agrupa la guía. Las dos entradas antiguas redirigen; no duplican el núcleo. Se conservan licencias y hashes. No se cambian las rutas del sitio publicado ni se despliega esta carpeta.

Pruebas: 177 Node, 12 Python y recorrido de Edge con 12 perfiles. El portal se adapta hasta 320 px tras corregir el salto de los enlaces del pie. Guía, redirecciones con query/hash, carga .pbis sin red desde el ZIP extraído, demo y feedback interceptado comprobados. Los ZIP son reproducibles y cada archivo coincide byte a byte con la construcción. Los informes y datos originales se conservan; no se presenta la limpieza como una garantía absoluta de seguridad.
