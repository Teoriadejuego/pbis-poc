# Registro privado de accesos en Google Sheets

El receptor está preparado, pero **no se ha desplegado ni activado en tu cuenta**. La consulta cifrada funciona sin él. Este registro es independiente del envío de valoraciones a Formspree.

## Configurar

1. Crea una hoja nueva en Google Sheets desde la cuenta que debe custodiar los accesos. Déjala **privada**.
2. Abre **Extensiones → Apps Script**. Copia el contenido de **Code.gs** en el archivo de código. Añade un archivo HTML llamado **Registro** y pega **Registro.html**.
3. En la configuración del proyecto, muestra el manifiesto **appsscript.json** y sustituye su contenido por el archivo adjunto. No añadas claves ni secretos de Google a PBIS.
4. Ejecuta **setupPbisRegistry** desde el editor, autoriza a tu propia aplicación y vuelve a cargar la hoja. Se crean Autorizaciones, Eventos y Sesiones y el menú PBIS. Si la cuenta institucional bloquea Apps Script o aplicaciones públicas, su administración deberá habilitar este uso.
5. En Apps Script, crea una **Nueva implementación → Aplicación web**. Ejecutar como: **tu cuenta propietaria**. Acceso: **Cualquier usuario** para que la aplicación local pueda enviar sin iniciar sesión en Google. Esto publica el receptor, no la hoja: cada escritura exige además el token aleatorio de la cuenta PBIS.
6. Copia la URL HTTPS terminada en **/exec**. No uses /dev. En PBIS, entra como orientación, abre Administrar el proyecto y pega esa URL en Registro de accesos.
7. Genera el proyecto. Descarga el .pbis y el manifiesto de accesos. En la hoja, abre **PBIS → Registrar un proyecto** y pega el JSON del manifiesto. Ese registro solo se admite desde la cuenta propietaria; no existe un alta pública por HTTP.
8. Entrega el archivo y las credenciales por separado. El manifiesto va a la hoja privada: no hace falta entregarlo a docentes.

Cada revisión del proyecto debe registrarse con su nuevo manifiesto. Repetir el mismo alta no duplica cuentas; si hay otra configuración con el mismo identificador y revisión, se rechaza. Al actualizar el código de Apps Script, actualiza la implementación a una versión nueva para conservar su URL.

## Comprobar con el proyecto ficticio

Primero configura y registra una nueva revisión del proyecto de prueba, sin datos reales:

- Abre el proyecto con una cuenta docente y espera **Acceso registrado**.
- Comprueba un evento open en Eventos y una fila en Sesiones, con código U-…, DNI parcial, archivo y horas UTC. El DNI completo no debe aparecer.
- Usa la consulta durante más de cinco minutos: con actividad reciente y la pestaña visible debe llegar activity.
- Pulsa Cerrar sesión. La fila debe pasar a **Cierre confirmado** y contener hora cliente y hora de recepción.
- Interrumpe la conexión durante otra sesión. Debe verse un pendiente; recuperar conexión con la app abierta reintenta. Cerrar la pestaña offline puede dejar **Sin cierre confirmado**.
- Comprueba que repetir un evento no añade otra fila en Eventos.

La prueba automatizada usa un receptor simulado. Esta comprobación en tu cuenta es necesaria para validar permisos de Google, cuotas y acceso entre orígenes desde HTTP y file://.

Si PBIS no recibe confirmación, no se debe dar por registrado el acceso aunque Google haya guardado una fila. El cliente envía JSON como text/plain sin cookies, sigue la redirección de ContentService y exige un recibo JSON. No cambies a mode:no-cors para ocultar errores: impediría comprobar la entrega. Revisa la URL /exec, la implementación, la autorización del propietario y el alta del manifiesto. Las políticas institucionales o del navegador pueden bloquear la conexión; la consulta local sigue funcionando.

## Datos y administración

**Autorizaciones** contiene proyecto, revisión, código de cuenta, rol, DNI parcial, etiqueta y hash del token de escritura. **Eventos** conserva eventos aceptados sin duplicarlos. **Sesiones** resume la apertura, la última actividad recibida y el cierre explícito si llegó. Las horas ISO se guardan como texto UTC para evitar conversiones regionales; el número de revisión conserva tipo numérico.

El receptor rechaza campos ajenos al contrato y solicitudes de más de 4 KB. Nunca admite Excel ni datos educativos. No ofrece ninguna API de lectura. Los tokens de escritura son secretos aleatorios incluidos dentro de las autorizaciones cifradas de cada cuenta; la hoja almacena sus hashes, no los tokens.

La hoja puede contener más de una revisión y más de un centro. No la compartas con docentes. Limita su acceso al equipo responsable. Retención, copias y eliminación deben definirse en ese equipo; este código no borra automáticamente el historial.

Eliminar una fila de Autorizaciones impide aceptar futuros eventos de esa cuenta y revisión, **pero no revoca su acceso offline**. Las cuentas que abren un archivo sin Internet no generan un registro central fiable. También es posible bloquear voluntariamente el envío: este sistema registra uso comunicado, no todo uso posible.

El receptor usa bloqueo de escritura y eventId para evitar duplicados. Una repetición repara también el resumen si la primera escritura quedó parcial. Protege las celdas de texto frente a fórmulas y limita cada cuenta a 500 eventos por día. Es un receptor de piloto sujeto a las cuotas de Apps Script, no un servicio con disponibilidad garantizada ni una prueba de identidad personal.

Documentación: [Aplicaciones web de Apps Script](https://developers.google.com/apps-script/guides/web), [Content Service y redirecciones](https://developers.google.com/apps-script/guides/content).
