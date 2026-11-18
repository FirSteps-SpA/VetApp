# Design

## Context

Ver `proposal.md`. Estado relevante:

- **Correo:** `enviarEmail(to, subject, html)` (`src/lib/notificaciones/email.ts`) usa la API de Resend con `RESEND_FROM`. Si falta la configuración, no envía y solo advierte.
- **Notificaciones a dueños:** `notificarDueno` (`enviar.ts`) crea la notificación del portal y envía correo y push según preferencias. Desde la spec 6 lleva la marca de la clínica en el asunto, el título del push y una línea del cuerpo. La usan el cron (recordatorios) y Reservas (confirmar y rechazar).
- **Invitación:** `invitarCliente` devuelve un enlace a `/c/<slug>/acceso` que el staff copia; no se envía correo.
- **Citas:** el cliente no tiene escritura directa (auditoría #6). Solicita horas con una server action que inserta con `service_role`, y ve sus horas con `portal_citas()`.
- **Push:** `push-toggle.tsx` detecta `serviceWorker` y `PushManager`; la PWA usa `@ducanh2912/next-pwa`. En iOS, el push web solo funciona con la app agregada a la pantalla de inicio (modo standalone).
- **Bloqueo por aviso:** desde la spec 7, `cliente_owns_paciente` exige la aceptación del aviso de privacidad.

## Goals / Non-Goals

**Goals:**
- Una sola plantilla de correo, pura y testeable, para todos los mensajes.
- La cancelación la valida entera la base: propiedad, aviso aceptado, estado y plazo.

**Non-Goals:**
- Dominios por clínica.
- Reprogramar desde el portal.
- Adjuntar documentos (spec 9).
- Pruebas automáticas de push en dispositivos: se cubre con un checklist manual.

## Decisions

### 1. Remitente y respuestas
`enviarEmail({ to, subject, html, remitente, responderA })`:
- `from` = `"<nombre de la clínica> <RESEND_FROM>"`, con el nombre saneado: sin comillas, `<`, `>` ni saltos de línea.
- `reply_to` = email de la clínica, si existe.

`RESEND_FROM` pasa a ser solo la dirección, p. ej. `avisos@<dominio de VetApp>`. Por compatibilidad, si trae `Nombre <dir>`, se toma la dirección.

*Alternativa descartada:* un dominio por clínica (decisión del usuario).

### 2. Plantilla común
`plantillaEmail({ clinica, titulo, parrafos, boton?, pie? })` (`src/lib/notificaciones/plantilla-email.ts`) es pura y devuelve `{ subject, html, text }`:
- HTML con estilos en línea y tabla de ancho fijo, para compatibilidad con clientes de correo;
- logo de la clínica (URL pública de `clinica-assets`) o su nombre;
- texto plano como alternativa;
- todo dato variable escapado con `escaparHtml`, y la URL del botón validada como `http(s)`.

`enviar.ts` deja de armar HTML propio y usa la plantilla. Los mensajes concretos son funciones pequeñas en `src/lib/notificaciones/mensajes.ts`:
- `mensajeInvitacion`;
- `mensajeRecordatorioCita`;
- `mensajeRecordatorioVacuna`;
- `mensajeHoraConfirmada`;
- `mensajeHoraRechazada`;
- `mensajeHoraCancelada`.

Así el texto vive en un solo lugar y se testea.

### 3. Invitación por correo
`invitarCliente`, después de generar el enlace, envía `mensajeInvitacion` al email de la ficha con la marca de la clínica de la sesión. Devuelve `{ ok, link, correoEnviado }`, y la UI muestra el enlace con "Correo enviado a …" o "No se pudo enviar el correo: comparte el enlace".

### 4. Cancelación
Migración:
- `tenants.horas_cancelacion int not null default 24 check (between 0 and 168)`;
- `citas.cancelada_por_cliente boolean not null default false`;
- `citas.cancelada_en timestamptz`.

`cancelar_cita_portal(p_cita uuid, p_motivo text default null)` (`security definer`) verifica:
- que la hora sea de una mascota suya (`cliente_owns_paciente`, que ya exige el aviso aceptado);
- que el estado sea `pendiente` o `confirmada`;
- que `fecha_hora >= now() + horas_cancelacion` de la clínica de la hora.

Si todo se cumple:
- actualiza solo `estado = 'cancelada'`, `cancelada_por_cliente`, `cancelada_en` y `notas_cliente` (el motivo, si viene, recortado a 500 caracteres);
- devuelve `tenant_id`, `dueno_id`, `fecha_hora` y el nombre de la mascota, para el acuse.

`portal_citas()` suma la columna `cancelable` con la misma regla, y el portal muestra el botón solo cuando es verdadera.

La server action `cancelarCita` llama a la función y después a `notificarDueno(..., 'cita_cancelada')`, que deja la notificación en el portal y envía correo y push según preferencias. El staff no recibe notificación: lo ve en la agenda y en Reservas (decisión del usuario).

*Alternativa descartada:* una política de UPDATE para el cliente sobre `citas`. Reabre la escritura directa que cerró la auditoría #6.

### 5. Staff
- **Agenda y Reservas:** a las horas con `cancelada_por_cliente` les agregan la etiqueta "Cancelada por el dueño" y el motivo. Reservas suma una pestaña "Canceladas por dueños" con las de los últimos 14 días.
- **Admin › Clínica:** campo "Plazo de cancelación (horas)".

### 6. Bienvenida y ayuda
- **Bienvenida:**
  - `usuarios.bienvenida_vista_en timestamptz`; el usuario puede escribirlo sobre sí mismo, porque no es una columna protegida.
  - La tarjeta del inicio se muestra mientras sea nulo y "Entendido" lo marca.
  - Al vivir en la base, no reaparece en otro dispositivo.
- **`/portal/ayuda`**, fuera del grupo bloqueado por el aviso, para que se pueda leer antes de aceptar:
  - preguntas frecuentes en secciones;
  - el plazo de cancelación y el contacto de cada clínica del dueño;
  - instalación en Android (Chrome → Instalar app) e iOS (Safari → Compartir → Agregar a inicio).
- **`push-toggle`:** si es iOS y no está en modo standalone (`navigator.standalone` o `display-mode: standalone`), muestra "Agrega VetApp a tu pantalla de inicio para activar las notificaciones" con enlace a la ayuda, en lugar de "no compatible".

### 7. Operación del piloto
En `1stDocs/004-operacion/piloto-portal-vetapp.md`:
1. Verificar el dominio en Resend (registros SPF, DKIM y DMARC) y configurar `RESEND_FROM` en Vercel.
2. Prerrequisitos: specs 6 y 7 en producción y el aviso publicado.
3. Elegir 3 a 5 dueños con email y teléfono, que vengan seguido.
4. Invitar y verificar la entrada.
5. Esperar un recordatorio real (cron diario) y probar una cancelación.
6. Recoger su opinión a las dos semanas.

Incluye el checklist manual de push en Android e iOS.

## Risks / Trade-offs

- [Correos en spam mientras el dominio no esté verificado] → El procedimiento del piloto exige verificarlo antes de invitar, con un correo de prueba revisado en Gmail y Outlook.
- [Nombre de la clínica con caracteres que rompan el `from`] → Se sanea antes de usarlo, con un test.
- [Una hora cancelada sobre el plazo por diferencia de reloj] → La base compara con `now()` del servidor; el portal solo refleja `cancelable`.
- [La ayuda queda desactualizada] → Los datos variables (plazo y contacto) se leen de la clínica, no se escriben a mano.

## Migration Plan

Migración aditiva: columnas con valor por defecto y funciones nuevas o redefinidas. Va después de las specs 6 y 7.

Para enviar correos hace falta configurar `RESEND_FROM` y `RESEND_API_KEY` en Vercel; sin ellos todo funciona sin correo.
