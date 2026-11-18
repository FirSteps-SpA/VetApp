# clinic-branded-email Specification

## Purpose
Define cómo VetApp envía correos en nombre de cada clínica: remitente y respuestas, la marca y el contacto de la clínica en cada mensaje, y qué mensajes se envían a los dueños.

## Requirements

### Requirement: Remitente con la identidad de la clínica
Los correos a los dueños SHALL enviarse desde una dirección del dominio de VetApp verificado en el proveedor de correo, con el nombre de la clínica como nombre del remitente. Cuando la clínica tenga email configurado, las respuestas del dueño SHALL dirigirse a ese email.

#### Scenario: Responder un recordatorio
- **WHEN** un dueño de la clínica Pradera, cuyo email es contacto@pradera.cl, responde un recordatorio
- **THEN** el remitente que vio era "Clínica Pradera" y su respuesta va a contacto@pradera.cl

#### Scenario: Clínica sin email
- **WHEN** la clínica no tiene email configurado
- **THEN** el correo se envía igual, con el nombre de la clínica como remitente y sin dirección de respuesta propia

### Requirement: Plantilla con la marca de la clínica
Todo correo a un dueño SHALL usar una plantilla común con el nombre y el logo de la clínica, el mensaje, un botón a la acción correspondiente en el portal cuando aplique, y un pie con los datos de contacto de la clínica. Los datos variables SHALL insertarse escapados, sin permitir que alteren el formato del correo.

#### Scenario: Logo y contacto
- **WHEN** la clínica tiene logo, dirección y teléfono configurados y envía un recordatorio
- **THEN** el correo muestra su logo en el encabezado y su dirección y teléfono en el pie

#### Scenario: Dato con marcado
- **WHEN** el nombre de una mascota contiene caracteres como `<` o `&`
- **THEN** el correo muestra el texto tal cual, sin interpretarlo como formato

### Requirement: Mensajes que se envían a los dueños
El sistema SHALL enviar con esta plantilla, según las preferencias de notificación del dueño cuando correspondan:
- la invitación al portal;
- el recordatorio de cita;
- el recordatorio de vacuna;
- la confirmación y el rechazo de una hora solicitada;
- el acuse de una hora cancelada por el dueño.

#### Scenario: Hora confirmada
- **WHEN** el staff confirma una hora solicitada por un dueño con correo activado en sus preferencias
- **THEN** el dueño recibe un correo de la clínica con la fecha y hora confirmadas y un botón a sus citas

### Requirement: Sin proveedor configurado no se interrumpe la operación
Si el envío de correo no está configurado o falla, la acción que lo origina SHALL completarse igual y el fallo SHALL quedar registrado para revisión, sin mostrar un error al dueño.

#### Scenario: Proveedor caído al confirmar una hora
- **WHEN** el staff confirma una hora y el proveedor de correo rechaza el envío
- **THEN** la hora queda confirmada, la notificación en el portal se crea y el fallo del correo queda registrado
