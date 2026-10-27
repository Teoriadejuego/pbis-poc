# Prompt aplicado: fichas PDF locales con identificación

## Ampliación: permisos de exportación y contraseña de apertura

Conserva las marcas y los cálculos. En Administración, permite a orientación
habilitar PDF por cuenta y revisar ese permiso antes de generar el proyecto.
Guárdalo cifrado en la autorización de cada cuenta, también cuando dos cuentas
comparten aulas. La edición debe poder conservar las contraseñas existentes.
Comprueba el permiso al mostrar el botón y al terminar una generación asíncrona.

Protege cada PDF descargado con el DNI completo de quien exporta, sin enviarlo
ni añadirlo al contenido del documento. Para una cuenta docente protegida utiliza
el DNI validado en el acceso; para una cuenta compartida pídelo al exportar.
La demo utiliza un DNI explícitamente ficticio. Usa cifrado PDF estándar AES-256
con una biblioteca contrastada, incorporada al archivo local. No implementes un
algoritmo criptográfico propio. Si falla el cifrado, no ofrezcas una copia en claro.
Cancela el trabajo al cerrar o cambiar de consulta. Mantén los datos en memoria.

Verifica archivos reales producidos por el navegador con un lector independiente:
contraseña vacía o equivocada no abre; el DNI correcto sí abre; se conservan texto,
redes, notas de permisos y marcas en cada página. Comprueba móvil, teclado,
sin conexión, errores, cancelación y que ningún dato se escribe de forma
persistente o se envía. Explica que un DNI conocido permite abrir el PDF y que
la marca no evita capturas. Entrega únicamente una edición local para revisión.

## Encargo original

Trabaja en una copia independiente de PBIS, sin publicar ni modificar datos reales.
Reutiliza los datos autorizados de la consulta y las funciones actuales de agregación.
Añade «Descargar PDF» a las fichas de centro, aula y estudiante. El PDF debe incluir
el resumen y los indicadores ampliados, sin cambiar cálculos ni normalización.
Explica el alcance antes de descargar. Permite incluir la red actual con sus flechas,
colores y lista legible de relaciones. Respeta el diseño de comunidades elegido.

Genera el PDF íntegramente en el navegador, también mediante doble clic sin Internet.
Incorpora la biblioteca al HTML; no utilices CDN en ejecución, servidores PDF ni
almacenamiento persistente. Usa texto seleccionable, márgenes, paginación, fecha,
periodo de la consulta, participación, recuentos y escalas explícitas. Conserva las
diferencias entre cero, sin respuesta y datos insuficientes.

Los PDF docentes deben llevar en cada página una marca repetida con el DNI parcial
y el código de sesión ya establecidos. En cuentas tradicionales, usa el identificador
de cuenta y sesión, ocultando también un DNI si se usa como identificador. La marca
forma parte del contenido de cada página, incluidas las redes y los anexos. No debe
haber una opción para quitarla. Si falta identificación, bloquea la descarga.
Orientación conserva su excepción: «Equipo orientador» en cada página, sin marca
repetida. La demo lleva «DATOS SIMULADOS» en todas las páginas.

No incluyas contraseñas, tokens, DNI completo, valoraciones pendientes, Excel adjuntos
ni datos de aulas no autorizadas. Centro solo está disponible a orientación y demo.
Retira el diálogo al cerrar sesión e invalida una generación si cambia la consulta.
Muestra errores y permite reintentar. Advierte brevemente de que el archivo descargado
permanece en el equipo tras cerrar sesión. La marca disuade y permite atribuir la copia
a una cuenta; no impide su redistribución ni demuestra quién la compartió.

## Prompts de validación

1. Compara los PDF con las fichas usando datos ficticios: centro, aula, estudiante,
   información ampliada, CRT, ceros, ausencia de respuestas y redes.
2. Abre un proyecto protegido con dos docentes de aulas distintas y orientación.
   Examina el texto, las páginas y el contenido: ninguna cuenta docente exporta otra
   aula, su DNI completo o credenciales. Comprueba todas las marcas y la excepción
   de orientación, también en anexos de varias páginas.
3. Verifica descarga real por HTTP local y por file:// sin conexión; bloquea accesos
   a almacenamiento persistente y conexiones externas. Prueba teclado, móvil, cancelación,
   errores del generador y cierre de sesión. No envíes correos de prueba.
4. Renderiza los PDF a imágenes y revisa recortes, superposiciones, contraste, márgenes,
   pies y legibilidad. Incluye una red densa y nombres largos.
5. Reconstruye las descargas locales y compara los cálculos con el proyecto original.
   Documenta las comprobaciones realizadas y sus límites. No hagas push ni despliegue.
