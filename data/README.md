# Datos de evaluación

Los datos de 1.512 estudiantes, incluidos nombres y respuestas, son inventados. Las redes se generan de forma determinista y los indicadores se derivan de esas relaciones. No son baremos poblacionales ni un instrumento diagnóstico validado.

Cada perfil del piloto tiene una clave alfanumérica distinta de seis caracteres. Una clave incluida en JavaScript solo limita la navegación de la interfaz: no impide inspeccionar los archivos o el código y no debe considerarse una barrera de seguridad para datos reales.

La fuente de cuentas activa es `profiles.json`. Usuarios: tutoria + curso (4p, 5p, 6p, 1eso, 2eso, 3eso, 4eso, 1bach, 2bach). Ejemplo: `tutoria1eso` consulta 1.º ESO en todos los centros y aulas cargados. `tutoria3esopdci` consulta 3.º ESO PDC I y `tutoria4esopdcii`, 4.º ESO PDC II. Las variantes PDCI/PDC I y PDCII/PDC II se reconocen por igual. `orientacion` ve todas las fichas y puede consultar y distribuir las cuentas y claves del piloto. Los valores técnicos de rol se conservan para mantener la compatibilidad de las valoraciones.

El Excel actualizado de perfiles se entrega solo en local, separado de las descargas públicas. Para uso real deben custodiarse y distribuirse según los permisos de cada centro.

Los Excel sintéticos necesarios para construir y probar la demo están en `data/examples/`. Se conservan como entradas versionadas, no como resultados de ejecución. `outputs/` se ignora completamente.

Esos dos Excel se conservan en el código y en las copias completas para reproducir las pruebas. No se copian a `site/downloads/` ni al paquete `--tipo aplicacion`. La demo incorporada sigue conteniendo nombres y respuestas simulados.

`schema.json` es el catálogo histórico de columnas del ejemplo, no un JSON Schema. Su contrato formal está en `catalog.schema.json`; `npm run validate:data` valida ese catálogo y comprueba los ejemplos con el mismo validador del visualizador. No reemplaza las reglas específicas del importador Wave 1.
