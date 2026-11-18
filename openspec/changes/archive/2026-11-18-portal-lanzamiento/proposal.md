# Proposal

## Why

El portal de dueños existe desde la Fase II, pero ningún dueño lo usa todavía. Con multi-tenant (spec 6) y privacidad (spec 7) listos, falta lo necesario para un piloto real con 3 a 5 dueños por clínica.

- **Correos sin marca ni dominio:** hoy salen de un remitente genérico, sin la identidad de la clínica, y el dominio no está verificado, así que pueden caer en spam.
- **Invitación manual:** no se envía por correo; el staff copia un enlace.
- **Sin cancelación:** el dueño no puede cancelar sus horas, porque desde la auditoría #6 no escribe directamente en `citas`.
- **Sin orientación:** no hay bienvenida ni ayuda, por ejemplo para instalar la app y recibir notificaciones push en el celular.

Es la spec #8 del roadmap de VetApp (`1stDocs/005-roadmap/001-VetApp.md`).

## What Changes

**Correos con la marca de la clínica**
- Salen desde **un dominio de VetApp** verificado en Resend.
- El nombre del remitente es el de la clínica y las respuestas van al email de la clínica (`Reply-To`).
- Una plantilla común (nombre y logo de la clínica, botón de acción, pie con datos de contacto) para:
  - invitación al portal;
  - recordatorio de cita;
  - recordatorio de vacuna;
  - hora confirmada y hora rechazada;
  - hora cancelada por el dueño (acuse al dueño).
- Sin dominio configurado, la app sigue funcionando y no envía correos, como hoy.

**Invitación por correo**
- Al invitar a un dueño se le envía el correo con el enlace de acceso a la entrada de la clínica.
- El staff igual ve el enlace copiable, para compartirlo por WhatsApp si el correo no llega, y la pantalla indica si el correo se envió.

**Cancelación de horas por el dueño**
- Desde el portal, el dueño cancela sus horas pendientes o confirmadas hasta **N horas antes**. N lo configura cada clínica en Admin y por defecto es 24.
- Se hace con una función dedicada de la base. El dueño sigue sin escribir directamente en `citas`.
- La cancelación queda marcada como hecha por el dueño, con fecha. La clínica la ve en la agenda y en Reservas.
- El dueño recibe el acuse por notificación y por correo.

**Bienvenida y ayuda en el portal**
- Bienvenida en el primer ingreso: qué puede hacer en el portal.
- Página de Ayuda con preguntas frecuentes: solicitar y cancelar horas, documentos, notificaciones, privacidad, e instalar la app en Android y en iOS para recibir push.

**Operación del piloto, documentada en 1stDocs**
- Procedimiento del piloto: verificar el dominio en Resend, elegir los dueños, invitar, hacer seguimiento y recoger su opinión.
- Checklist manual de push en Android e iOS.

## Capabilities

### New Capabilities
- `clinic-branded-email`: correos de VetApp con la marca y el contacto de cada clínica, desde un dominio verificado, y sus tipos de mensaje.
- `owner-appointment-cancellation`: cancelación de horas por el dueño desde el portal, con plazo configurable por clínica y visible para el staff.
- `portal-onboarding-help`: bienvenida en el primer ingreso y ayuda del portal, incluida la instalación para recibir push.

### Modified Capabilities
- `clinic-entry-and-onboarding`: la invitación al portal también se envía por correo con la marca de la clínica, además del enlace copiable.

## Impact

- **Base de datos:** una migración.
  - `tenants.horas_cancelacion` (por defecto 24).
  - `citas.cancelada_por_cliente` y `citas.cancelada_en`.
  - Función `cancelar_cita_portal(p_cita, p_motivo)`.
  - `portal_citas` devuelve si cada hora se puede cancelar.
  - `usuarios.bienvenida_vista_en`, para la bienvenida del primer ingreso.
- **App:**
  - `src/lib/notificaciones/email.ts`: remitente con nombre de la clínica y `Reply-To`.
  - Plantilla `src/lib/notificaciones/plantilla-email.ts`.
  - `invitarCliente` envía el correo.
  - Portal: botón Cancelar en Citas, bienvenida en el inicio y página `/portal/ayuda`.
  - Admin › Clínica: plazo de cancelación.
  - Agenda y Reservas: se marca la cancelación hecha por el dueño.
- **Configuración:** `RESEND_FROM` pasa a ser la dirección del dominio de VetApp (p. ej. `avisos@<dominio>`). El dominio se verifica en Resend con sus registros DNS; es un paso operativo documentado.
- **Fuera de alcance:**
  - Envío de documentos por correo (spec 9).
  - Dominios propios por clínica.
  - Reprogramar una hora desde el portal: el dueño cancela y solicita otra.
