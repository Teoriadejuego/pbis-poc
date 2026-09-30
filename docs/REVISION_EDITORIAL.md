# RADARS · Revisión editorial y visual

Versión 0.9 · Criterios aplicados a la web y la documentación

## Voz del producto

La propuesta es «Entender las relaciones. Cuidar el grupo». Describe una herramienta de lectura y acompañamiento; evita presentar a los estudiantes como una puntuación o a la aplicación como un instrumento diagnóstico.

El tono es directo, sereno y profesional. Los textos usan español de España y verbos de acción: descargar, extraer, abrir, elegir, consultar y cerrar. Se evita «instalar» cuando la acción real consiste en abrir un archivo HTML.

## Decisiones de contenido

| Elemento | Decisión |
|---|---|
| Nombre de la institución | Centro de enseñanza; «Centro» en los filtros. Sevilla y Córdoba son las ubicaciones de los centros de evaluación |
| Personas y equipos | Estudiantes, equipo docente, tutoría y orientación; lenguaje inclusivo sin atribuir género a partir del nombre |
| Cursos | Nomenclatura española: de 4.º de Primaria a 2.º de Bachillerato |
| Convivencia | Acoso escolar, respuesta personal e información del grupo; conservar la diferencia entre las fuentes |
| Mediación | Reconocimiento en mediación; describir la medida sin convertirla en una etiqueta personal |
| Pestañas | Ficha del grupo antes de Ficha individual |
| Descarga principal | «Descargar edición local»: conduce a las opciones por sistema |
| Paquetes | Se explica que los ZIP contienen un visualizador HTML común, no ejecutables nativos |
| Archivos | «Indicadores», «Llave ID–nombre» y «Perfiles y claves», con finalidades diferentes |
| Datos de prueba | Origen inventado explicado en el kit y la documentación, sin estampar marcas sobre cada ficha |
| Estado del producto | Edición de evaluación 0.9 junto a las descargas |
| Privacidad | Se describe el procesamiento local y la conservación de originales sin prometer seguridad absoluta |
| Acceso | Clave 1234 etiquetada como evaluación; filtros distintos de autorización criptográfica |
| Compatibilidad | macOS/Linux previstos, pendientes de verificación en esos equipos |
| Evidencia comercial | Sin precios, clientes, certificaciones, reseñas o porcentajes de eficacia inventados |

## Sistema visual

- Crema como fondo; púrpura oscuro para texto y acciones principales.
- Serif de sistema para títulos editoriales y sans serif de sistema para controles y texto continuo.
- Coral para la ilustración de señales, lila para mediación y amarillo para integración. Los números y textos explican la información aunque no se perciban los colores.
- SVG y CSS propios para redes, archivos y perfiles; ninguna fotografía de estudiantes.
- Vista del hero etiquetada como ilustrativa, con datos de evaluación.
- Componentes flexibles, columnas adaptadas a móvil, botones amplios, foco visible y enlace para saltar al contenido.
- Preferencia de movimiento reducido respetada; sin animaciones necesarias para entender el producto.

## Revisión estática de la web

- No hay fuentes, bibliotecas, imágenes, formularios ni analítica externos.
- Los recursos decorativos se ocultan a tecnologías de apoyo; la ilustración principal tiene una descripción accesible.
- El menú móvil tiene estado `aria-expanded`, se cierra con Escape y conserva acceso a todos los enlaces.
- La sugerencia del sistema operativo no oculta ninguna descarga.
- Las preguntas frecuentes utilizan controles nativos `details` y `summary`.
- Los enlaces de guía, privacidad y metodología necesitan los HTML que genera el proceso de empaquetado.
- Las rutas de descargas dependen de los archivos producidos por el proceso de construcción y deben verificarse en la entrega final.

## Comprobaciones de la web realizadas

La portada se revisó en el navegador Chromium integrado en Windows, con un ancho de 1.280 píxeles y con un ancho móvil simulado de 390 píxeles. No se observó desbordamiento horizontal. Se comprobó el menú móvil con Enter y Escape, incluidos su estado expandido y la devolución del foco al botón.

Las capturas de evidencia están en `qa/web-escritorio.png` y `qa/web-movil.png`. Esta comprobación no demuestra compatibilidad nativa en macOS o Linux, ni sustituye una revisión con lector de pantalla. La revisión de la aplicación local se documenta por separado.

## Antes de una publicación comercial

Revisar las capturas finales de la aplicación real, probar lectura con tecnologías de apoyo, verificar enlaces y tamaños de archivo tras construir los paquetes, comprobar que las instrucciones reflejan el flujo actual y revisar la matriz de sistemas probados. Sustituir cualquier afirmación de compatibilidad prevista únicamente cuando exista evidencia en ese entorno.

Esta revisión es interna y editorial; no constituye una auditoría independiente de seguridad, accesibilidad o metodología.
