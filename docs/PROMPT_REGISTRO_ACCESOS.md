# Prompt · Registro de accesos sin contraseñas

Amplía el receptor Google Sheets existente y la cola en memoria. Conserva los
cálculos, normalización, demo, permisos, PDF y marcas de agua. Registra cuenta,
centro o centros, nombre del archivo, apertura confirmada, actividad y cierre
confirmado. La carga directa de Excel de orientación se identifica como la
cuenta compartida orientacion. Distingue este origen del proyecto protegido.

No envíes ni almacenes contraseñas, Excel, nombres de estudiantes, respuestas
ni tokens de escritura en claro dentro de la hoja. Emplea un contrato cerrado;
no serialices objetos de sesión ni perfiles completos. La credencial de escritura
es independiente, no debe quedar incluida en la web pública y su alta debe
requerir al propietario. No añadas persistencia en el navegador.

Crea una conexión privada de orientación para cargar una vez por sesión y
reutilizarla para sucesivos archivos. No registres una apertura hasta que se
validen los datos. Si se sustituye el archivo, cierra la consulta anterior y
abre otra distinta al validarse. Conserva la identidad del evento al reintentar.
No inventes cierres al salir sin conexión. Conserva compatibilidad con eventos
anteriores y migra encabezados sin borrar historial.

Valida permisos del receptor, campos extra, duplicados, reparación de escritura
parcial, cambios de centro en una sesión, archivos incorrectos y contraseñas
centinela. Prueba en navegador las cargas y sustituciones, los perfiles
protegidos y la ausencia de almacenamiento persistente. Simula el receptor;
la activación real debe comprobarse por separado en la cuenta del propietario.
Entrega el código, la aplicación local, un paquete de activación y una guía.
No despliegues la web ni envíes datos reales.
