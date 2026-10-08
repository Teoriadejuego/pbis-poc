# Auditoría de PBIS · 8 de octubre de 2026

## Dictamen

**Preparado para enseñar y evaluar con datos simulados en centros piloto.** La versión 0.10.0 ofrece un recorrido completo para demostrar utilidad y recoger observaciones de uso. **No está preparado como servicio de producción con datos reales de menores:** las cuentas actuales son públicas y filtran la interfaz, sin autorización segura.

Esta es una revisión funcional, de coherencia de datos y experiencia de uso. No sustituye una auditoría de seguridad, validación psicométrica, revisión de accesibilidad independiente ni aprobación jurídica o ética.

## Mejoras aplicadas

| Hallazgo | Mejora implementada |
|---|---|
| No había una entrada clara para practicar sin claves de tutoría | Demo siempre visible y cuenta pública demo / DEMO26 |
| La práctica no mostraba todas las funciones recientes | Recorrido de 15 pasos: acceso, carga explícita, aula, lista, reacciones, ficha, detalle, red, centro y confianza |
| El ejemplo no alimentaba red, respuestas de bienestar y CRT en la demo principal | Enriquecimiento reproducible con relaciones de la hoja sintética, tres respuestas coherentes y total CRT 0–3 |
| Las marcas de aprendizaje podían confundirse con opiniones de una consulta | Sesión demo aislada; no admite archivos y no envía reacciones, confianza ni comentarios |
| El logotipo no cerraba la consulta | PBIS cierra y vuelve a portada; espera envío confirmado cuando corresponde; conserva la sesión si falla |
| Exceso de notas en los resúmenes | Textos más cortos; método y lectura de barras en desplegables; notas de cobertura y fuentes conservadas |
| Emoticonos ambiguos y recortados en móvil | Reacciones con texto, desplegables y ajuste de desplazamiento para que sean visibles |
| Descargas sin la experiencia completa de demo | Cuatro ZIP con el mismo motor, portada local, demo y práctica incorporadas |
| Guías desactualizadas y cuentas antiguas | Guías, metodología, privacidad, versión y documentación de entrega revisadas |

## Comprobaciones ejecutadas

- **114 pruebas automáticas superadas en Windows**, con Node.js 24. Incluyen lectura Excel, identificadores, archivos con y sin nombres, error y sustitución de archivos, cálculos Wave 1, mediación, cobertura, CRT, red, ordenación, opiniones y paquetes.
- Inicio y cierre con las diez cuentas mediante los manejadores reales de la aplicación en un entorno DOM de prueba: nueve tutorías de curso y orientación. Rechazo de la antigua clave 1234. Tutorías: 168 estudiantes de su curso en ambos centros; orientación: 1.512.
- En navegador local: cuenta demo, pulsación explícita de carga, práctica completa, salto al ejercicio esencial, reacciones, confianza, resumen individual, ampliación, CRT con media, red y ficha de centro.
- En navegador local: tutor1eso carga el .pbis publicado de prueba, ve solo 1.º ESO y cambia entre Sevilla y Córdoba. Orientación accede a la tabla de cuentas; demo y tutoría no tienen ese botón.
- Comprobación móvil a 390 × 844: acceso guiado, lista desplazable, reacciones legibles y ficha individual sin desbordamiento de página. Revisión de escritorio en el navegador integrado.
- Cierre desde PBIS y vuelta a portada comprobados. Pruebas de envío simulado: éxito, fallo, reintento y descarte explícito. La demo no hace peticiones de envío.
- Coherencia del ejemplo: entradas y salidas de amistad/rechazo coinciden con los recuentos; bienestar reconstruye exactamente su suma; soledad y total CRT respetan sus dominios.
- Políticas de contenido, enlaces y hashes de descargas verificados por pruebas. Los ZIP comparten el mismo HTML y la demo incorporada.

No se han enviado correos de prueba reales en esta revisión. La entrega al buzón se confirmó en una sesión anterior; las pruebas actuales validan el contrato y los errores sin consumir el servicio. Los ZIP son aplicaciones HTML locales, no ejecutables nativos.

## Mejoras siguientes por prioridad

1. **Antes de usar datos reales:** cuentas individuales con alta, baja, recuperación y permisos aplicados fuera del navegador; revisión independiente de seguridad y del tratamiento de datos. Las cuentas por curso no atribuyen una actuación a una persona concreta.
2. **Validación de medidas:** contrastar un conjunto pequeño con cálculo independiente y responsables metodológicos; fijar definiciones, denominadores y reglas de cobertura por versión del cuestionario.
3. **Panel de calidad de carga:** previsualizar centros, cursos, respuestas pendientes y referencias excluidas antes de abrir la consulta. Ya existen validaciones; un resumen visual ayudaría a detectar errores de origen.
4. **Seguimiento educativo:** añadir objetivos y revisiones fechadas con permisos, separadas de las respuestas originales. Evitar convertir una señal en una etiqueta permanente.
5. **Comparación entre oleadas:** conservar trazabilidad del método y cobertura para comparar cambios. No comparar porcentajes con denominadores diferentes sin advertirlo.
6. **Evaluación con centros:** probar con profesorado y orientación sin explicación del equipo promotor; medir comprensión de fuentes, ausencias, confianza y procedimiento de cierre.
7. **Plataformas y accesibilidad:** verificar apertura directa de los ZIP en Windows, macOS y Linux, navegadores objetivo, teclado, lector de pantalla y zoom. La prueba móvil fue por viewport, no en teléfonos físicos.
8. **Feedback para investigación:** separar comentarios sobre diseño de valoración de indicadores; registrar versiones y criterios. Una reacción o confianza subjetiva no equivale a una etiqueta validada para entrenar modelos.

## Guion para el piloto

Presentar el propósito; abrir Práctica guiada; entrar como demo / DEMO26; cargar el ejemplo; contrastar el caso de Samuel; abrir la ficha de Ana; observar red y centro; expresar confianza. Después pedir al profesorado que repita el recorrido sin ayuda y explique qué haría para contrastar la información, sin tomar decisiones sobre personas reales.

El objetivo del primer piloto es comprobar utilidad, comprensión y facilidad de uso. Los archivos reales y las decisiones de intervención requieren el siguiente nivel de controles y validación.
